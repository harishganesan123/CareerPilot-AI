import json
from typing import Any

from sqlmodel import Session, select

from app.ai.base import ChatMessage
from app.ai.errors import AIInvalidResponseError
from app.ai.prompts import STUDY_RECOMMENDATION_SYSTEM_PROMPT
from app.ai.service import AIService
from app.core.config import settings
from app.models.study_task import StudyTask, StudyTaskStatus
from app.models.user import User
from app.schemas.study_recommendation import (
    MAX_AI_RECOMMENDATIONS,
    AIGeneratedRecommendations,
)
from app.services.skill_gap_service import (
    ROLE_REQUIREMENTS,
    analyze_skill_gap,
    normalize_skill,
)


LEARNING_GUIDANCE: dict[str, dict[str, Any]] = {
    "Python": {
        "minutes": 60,
        "activity": "Practise variables, functions, collections, and problem-solving with Python.",
    },
    "Machine Learning": {
        "minutes": 90,
        "activity": "Study supervised learning and build a small model using a sample dataset.",
    },
    "Deep Learning": {
        "minutes": 90,
        "activity": "Review neural networks and implement a small classification example.",
    },
    "NumPy": {
        "minutes": 45,
        "activity": "Practise array operations, indexing, and vectorized calculations.",
    },
    "Pandas": {
        "minutes": 60,
        "activity": "Load a dataset, clean missing values, and perform grouping and analysis.",
    },
    "SQL": {
        "minutes": 60,
        "activity": "Practise SELECT, JOIN, GROUP BY, and aggregate queries.",
    },
    "Git": {
        "minutes": 30,
        "activity": "Practise commits, branches, merges, and pushing a project to GitHub.",
    },
    "Model Deployment": {
        "minutes": 90,
        "activity": "Package a small model behind an API and practise deployment fundamentals.",
    },
    "Excel": {
        "minutes": 45,
        "activity": "Practise formulas, sorting, filtering, and pivot tables.",
    },
    "Statistics": {
        "minutes": 60,
        "activity": "Review descriptive statistics, distributions, and hypothesis testing basics.",
    },
    "Data Visualization": {
        "minutes": 60,
        "activity": "Create charts from a dataset and explain the patterns they reveal.",
    },
    "Power BI": {
        "minutes": 60,
        "activity": "Build a basic dashboard with charts, filters, and key performance indicators.",
    },
    "Communication": {
        "minutes": 30,
        "activity": "Practise explaining a technical finding clearly and concisely.",
    },
    "Object-Oriented Programming": {
        "minutes": 60,
        "activity": "Practise classes, objects, inheritance, and encapsulation.",
    },
    "REST APIs": {
        "minutes": 60,
        "activity": "Build and test a small REST API with request validation and HTTP status codes.",
    },
    "Testing": {
        "minutes": 45,
        "activity": "Write unit tests for functions and practise testing expected failures.",
    },
    "Debugging": {
        "minutes": 45,
        "activity": "Use logs, breakpoints, and small reproducible examples to diagnose errors.",
    },
    "HTML": {
        "minutes": 45,
        "activity": "Create a semantic HTML page with forms, headings, and accessible structure.",
    },
    "CSS": {
        "minutes": 45,
        "activity": "Practise responsive layouts, Flexbox, Grid, and spacing.",
    },
    "JavaScript": {
        "minutes": 60,
        "activity": "Practise functions, arrays, objects, asynchronous code, and DOM fundamentals.",
    },
    "React": {
        "minutes": 60,
        "activity": "Build a small React component using props, state, and event handlers.",
    },
    "Networking": {
        "minutes": 60,
        "activity": "Review TCP/IP, DNS, routing, ports, and common network troubleshooting commands.",
    },
    "Linux": {
        "minutes": 45,
        "activity": "Practise shell navigation, file permissions, processes, and basic networking commands.",
    },
    "Security Fundamentals": {
        "minutes": 60,
        "activity": "Review the CIA triad, authentication, access control, and common security threats.",
    },
    "SIEM": {
        "minutes": 60,
        "activity": "Learn how security logs, alerts, and event correlation support investigations.",
    },
    "Incident Response": {
        "minutes": 60,
        "activity": "Study incident identification, containment, eradication, and recovery.",
    },
    "Firewalls": {
        "minutes": 60,
        "activity": "Learn firewall rules, traffic filtering, and allow/deny troubleshooting scenarios.",
    },
}


def get_study_recommendations(
    session: Session,
    user: User,
    role_name: str,
) -> dict[str, Any]:
    """Generate explainable study recommendations from the user's skill gaps."""
    analysis = analyze_skill_gap(session, user, role_name)

    missing_skills = analysis["missing_skills"]
    recommendations = []

    for index, skill_name in enumerate(missing_skills[:5]):
        guidance = LEARNING_GUIDANCE.get(
            skill_name,
            {
                "minutes": 45,
                "activity": (
                    f"Study the fundamentals of {skill_name}, complete a guided "
                    "exercise, and apply it in a small practical example."
                ),
            },
        )

        if index < 2:
            priority = "High"
            reason = "Start here because this skill is currently missing from your recorded profile."
        elif index < 4:
            priority = "Medium"
            reason = "Build this skill after completing the first learning priorities."
        else:
            priority = "Low"
            reason = "Add this skill to your next learning cycle after the higher priorities."

        recommendations.append(
            {
                "skill_name": skill_name,
                "priority": priority,
                "estimated_minutes": guidance["minutes"],
                "reason": reason,
                "suggested_activity": guidance["activity"],
            }
        )

    return {
        "role_name": analysis["role_name"],
        "readiness_score": analysis["readiness_score"],
        "readiness_level": analysis["readiness_level"],
        "missing_count": analysis["missing_count"],
        "recommendations": recommendations,
        "method_note": (
            "These are rule-based learning suggestions derived from the selected "
            "role's missing skills. Priority reflects the recommendation order, "
            "not a validated prediction of career success."
        ),
    }


# ---------------------------------------------------------------------------
# AI-generated recommendations
# ---------------------------------------------------------------------------
_TASK_CONTEXT_LIMIT = 30  # most recently updated tasks passed to the model
_SUBJECT_MAX_CHARS = 80


def _task_context(session: Session, user: User) -> list[dict[str, str]]:
    """Subject + status of the student's own recent tasks. No titles or descriptions."""
    statement = (
        select(StudyTask)
        .where(StudyTask.user_id == user.id)
        .order_by(StudyTask.updated_at.desc())
        .limit(_TASK_CONTEXT_LIMIT)
    )
    return [
        {"subject": t.subject[:_SUBJECT_MAX_CHARS], "status": t.status.value}
        for t in session.exec(statement).all()
    ]


def _validate_ai_output(
    output: AIGeneratedRecommendations,
    missing_skills: list[str],
    role_skills: list[str],
    planned_keys: set[str],
) -> list[dict[str, Any]]:
    """
    Enforce grounding on top of the schema bounds.

    - every skill must be one of the student's missing skills (alias-tolerant);
    - a skill may appear only once;
    - prerequisites outside the role's skill list are dropped (never invented);
    - `order` is renumbered 1..n so it is always unique and contiguous.
    """
    canonical_by_key = {normalize_skill(s): s for s in missing_skills}
    role_by_key = {normalize_skill(s): s for s in role_skills}
    seen: set[str] = set()
    items: list[dict[str, Any]] = []

    for rec in output.recommendations:
        key = normalize_skill(rec.skill_name)
        canonical = canonical_by_key.get(key)
        if canonical is None or key in seen:
            # Do not echo the offending value: it is model output.
            raise AIInvalidResponseError("recommendation outside the student's missing skills")
        seen.add(key)

        prerequisites: list[str] = []
        for raw in rec.prerequisites:
            prereq = role_by_key.get(normalize_skill(raw))
            if prereq and prereq != canonical and prereq not in prerequisites:
                prerequisites.append(prereq)

        item = rec.model_dump()
        item.update(
            skill_name=canonical,
            prerequisites=prerequisites,
            already_planned=key in planned_keys,
        )
        items.append(item)

    items.sort(key=lambda i: i["order"])
    for position, item in enumerate(items, start=1):
        item["order"] = position
    return items


def generate_ai_study_recommendations(
    session: Session,
    user: User,
    role_name: str,
    ai: AIService,
) -> dict[str, Any]:
    """
    AI study recommendations grounded in the rule-based skill-gap facts.

    Raises ValueError for an unsupported role (the router maps it to HTTP 400)
    and AIError subclasses for model failures. Reads only; never writes.
    """
    analysis = analyze_skill_gap(session, user, role_name)
    missing = analysis["missing_skills"]

    base = {
        "role_name": analysis["role_name"],
        "readiness_score": analysis["readiness_score"],
        "readiness_level": analysis["readiness_level"],
        "missing_count": analysis["missing_count"],
    }

    if not missing:
        # Nothing to recommend: no model call, so this is NOT labelled as AI output.
        return {
            **base,
            "recommendations": [],
            "source": "rule_based",
            "model": None,
            "method_note": (
                "No missing skills were found for this role, so no AI recommendations "
                "were requested."
            ),
        }

    role_skills = ROLE_REQUIREMENTS[analysis["role_name"]]["skills"]
    tasks = _task_context(session, user)
    planned_keys = {
        normalize_skill(t["subject"])
        for t in tasks
        if t["status"] != StudyTaskStatus.COMPLETED.value
    }
    context = {
        "target_role": analysis["role_name"],
        "role_description": analysis["description"],
        "role_skills": role_skills,
        "matched_skills": [
            {"skill": m["skill_name"], "self_reported_level": m["proficiency"]}
            for m in analysis["matched_skills"]
        ],
        "missing_skills": missing,
        "already_planned_skills": [m for m in missing if normalize_skill(m) in planned_keys],
        "existing_tasks": tasks,
    }

    # Release the database connection before the (slow) model call.
    session.close()

    output = ai.generate_structured(
        system=STUDY_RECOMMENDATION_SYSTEM_PROMPT.format(max_items=MAX_AI_RECOMMENDATIONS),
        messages=[ChatMessage(role="user", text=json.dumps(context, ensure_ascii=False))],
        schema=AIGeneratedRecommendations,
        max_output_tokens=1500,
        temperature=0.3,
    )
    items = _validate_ai_output(output, missing, role_skills, planned_keys)

    return {
        **base,
        "recommendations": items,
        "source": "ai",
        "model": settings.AI_MODEL,
        "method_note": (
            "AI-generated suggestions based on your recorded skills and the selected "
            "role's listed requirements. Durations are estimates for a first study "
            "session. Nothing here changes your readiness score or skill levels."
        ),
    }
