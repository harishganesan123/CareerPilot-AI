from typing import Any

from sqlmodel import Session

from app.models.user import User
from app.services.skill_gap_service import analyze_skill_gap


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
