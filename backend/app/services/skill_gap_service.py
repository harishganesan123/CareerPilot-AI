"""
Rule-based skill-gap analysis for CareerPilot AI.
The readiness score measures coverage of listed role requirements,
not a prediction of employability.
"""

import re
from typing import Any

from sqlmodel import Session, select

from app.models.skill import StudentSkill
from app.models.user import User


# Initial role catalogue. These are configurable starter requirements,
# not an official industry certification or exhaustive job description.
ROLE_REQUIREMENTS: dict[str, dict[str, Any]] = {
    "AI Engineer": {
        "description": "Build and deploy machine-learning and AI applications.",
        "skills": [
            "Python",
            "Machine Learning",
            "Deep Learning",
            "NumPy",
            "Pandas",
            "SQL",
            "Git",
            "Model Deployment",
        ],
    },
    "Data Analyst": {
        "description": "Analyze data and communicate actionable insights.",
        "skills": [
            "SQL",
            "Python",
            "Excel",
            "Statistics",
            "Pandas",
            "Data Visualization",
            "Power BI",
            "Communication",
        ],
    },
    "Python Developer": {
        "description": "Develop, test, and maintain Python applications.",
        "skills": [
            "Python",
            "Object-Oriented Programming",
            "REST APIs",
            "SQL",
            "Git",
            "Testing",
            "Debugging",
        ],
    },
    "Full Stack Developer": {
        "description": "Build frontend and backend web applications.",
        "skills": [
            "HTML",
            "CSS",
            "JavaScript",
            "React",
            "Python",
            "REST APIs",
            "SQL",
            "Git",
        ],
    },
    "Cybersecurity Analyst": {
        "description": "Monitor systems and investigate security risks.",
        "skills": [
            "Networking",
            "Linux",
            "Security Fundamentals",
            "SIEM",
            "Incident Response",
            "Python",
            "Firewalls",
        ],
    },
}


# Map common alternative names to a canonical skill name.
SKILL_ALIASES = {
    "ml": "machine learning",
    "machine learning": "machine learning",
    "dl": "deep learning",
    "oop": "object oriented programming",
    "oops": "object oriented programming",
    "object-oriented programming": "object oriented programming",
    "powerbi": "power bi",
    "js": "javascript",
    "api development": "rest apis",
    "rest api": "rest apis",
    "restful api": "rest apis",
    "data visualisation": "data visualization",
    "ms excel": "excel",
    "git and github": "git",
    "networking fundamentals": "networking",
    "cyber security": "security fundamentals",
}


def normalize_skill(value: str) -> str:
    """Normalize spelling and common aliases for skill comparison."""
    normalized = re.sub(r"\s+", " ", value.strip().lower())
    normalized = SKILL_ALIASES.get(normalized, normalized)
    return normalized


def get_role_catalogue() -> list[dict[str, Any]]:
    """Return available roles and their required skills."""
    return [
        {
            "role_name": role_name,
            "description": details["description"],
            "required_skills": details["skills"],
        }
        for role_name, details in ROLE_REQUIREMENTS.items()
    ]


def analyze_skill_gap(
    session: Session,
    user: User,
    role_name: str,
) -> dict[str, Any]:
    """Compare the authenticated user's skills with a selected role."""
    role = ROLE_REQUIREMENTS.get(role_name)
    if role is None:
        raise ValueError("Unsupported career role")

    statement = select(StudentSkill).where(
        StudentSkill.user_id == user.id
    )
    student_skills = session.exec(statement).all()

    # Keep one record per normalized skill, preferring the highest
    # self-reported proficiency if duplicates exist.
    proficiency_rank = {
        "Beginner": 1,
        "Intermediate": 2,
        "Advanced": 3,
        "Expert": 4,
    }

    owned_skills: dict[str, StudentSkill] = {}
    for skill in student_skills:
        key = normalize_skill(skill.skill_name)
        existing = owned_skills.get(key)
        if (
            existing is None
            or proficiency_rank[skill.proficiency.value]
            > proficiency_rank[existing.proficiency.value]
        ):
            owned_skills[key] = skill

    matched = []
    missing = []

    for required_skill in role["skills"]:
        key = normalize_skill(required_skill)
        student_skill = owned_skills.get(key)

        if student_skill is None:
            missing.append(required_skill)
        else:
            matched.append(
                {
                    "skill_name": required_skill,
                    "student_skill_name": student_skill.skill_name,
                    "proficiency": student_skill.proficiency.value,
                    "proficiency_percent": {
                        "Beginner": 25,
                        "Intermediate": 50,
                        "Advanced": 75,
                        "Expert": 100,
                    }[student_skill.proficiency.value],
                }
            )

    total = len(role["skills"])
    score = round(len(matched) / total * 100) if total else 0

    if score >= 80:
        level = "High"
    elif score >= 50:
        level = "Moderate"
    else:
        level = "Developing"

    return {
        "role_name": role_name,
        "description": role["description"],
        "readiness_score": score,
        "readiness_level": level,
        "matched_count": len(matched),
        "missing_count": len(missing),
        "total_required_skills": total,
        "matched_skills": matched,
        "missing_skills": missing,
        "recommended_next_skills": missing[:3],
        "score_note": (
            "This score is the percentage of listed role requirements "
            "matched to your recorded skills. Proficiency is self-reported; "
            "the score is not a prediction of employability."
        ),
    }