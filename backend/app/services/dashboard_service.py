"""
Dashboard aggregation logic: profile completion and recent activity.

Both are deterministic and derived entirely from database records — no AI,
no fabricated numbers.
"""
from typing import List, Sequence

from app.models.certification import Certification
from app.models.project import StudentProject
from app.models.skill import StudentSkill
from app.models.target_role import TargetRole
from app.models.user import User
from app.schemas.dashboard import ActivityItem, ProfileCompletion, CompletionFactor

# Each factor is worth a fixed number of points; they sum to 100. Keeping the
# weights explicit here makes the resulting percentage explainable to the
# student rather than an opaque number.
_FACTOR_WEIGHTS: list[tuple[str, str, int]] = [
    ("name", "Add your name", 10),
    ("programme", "Add your programme", 10),
    ("university", "Add your university", 10),
    ("semester", "Add your semester", 10),
    ("bio", "Write a short bio", 10),
    ("skills", "Add at least one skill", 15),
    ("projects", "Add at least one project", 15),
    ("certifications", "Add at least one certification", 10),
    ("target_roles", "Set a target career role", 10),
]


def calculate_profile_completion(
    user: User,
    skills: Sequence[StudentSkill],
    projects: Sequence[StudentProject],
    certifications: Sequence[Certification],
    target_roles: Sequence[TargetRole],
) -> ProfileCompletion:
    """
    Compute a 0-100 profile completion score plus a per-factor breakdown so
    the UI can show the student exactly what is still missing.
    """
    satisfied = {
        "name": bool(user.name and user.name.strip()),
        "programme": bool(user.programme and user.programme.strip()),
        "university": bool(user.university and user.university.strip()),
        "semester": user.semester is not None,
        "bio": bool(user.bio and user.bio.strip()),
        "skills": len(skills) > 0,
        "projects": len(projects) > 0,
        "certifications": len(certifications) > 0,
        "target_roles": len(target_roles) > 0,
    }

    factors: List[CompletionFactor] = []
    earned = 0
    for key, label, weight in _FACTOR_WEIGHTS:
        complete = satisfied[key]
        if complete:
            earned += weight
        factors.append(
            CompletionFactor(key=key, label=label, weight=weight, complete=complete)
        )

    return ProfileCompletion(percent=earned, factors=factors)


def build_recent_activity(
    skills: Sequence[StudentSkill],
    projects: Sequence[StudentProject],
    certifications: Sequence[Certification],
    target_roles: Sequence[TargetRole],
    limit: int = 8,
) -> List[ActivityItem]:
    """
    Derive a recent-activity feed from the timestamps already present on the
    student's own records.

    There is no separate activity table: nothing here is fabricated, and the
    feed only ever reflects records the student actually created. The
    tradeoff is that it shows creation events only — edits and deletions
    aren't represented, since those timestamps aren't retained per-action.
    """
    items: List[ActivityItem] = []

    for skill in skills:
        items.append(
            ActivityItem(
                type="skill",
                description=f"Added {skill.skill_name} to skills",
                timestamp=skill.created_at,
            )
        )
    for project in projects:
        items.append(
            ActivityItem(
                type="project",
                description=f"Added project: {project.title}",
                timestamp=project.created_at,
            )
        )
    for certification in certifications:
        items.append(
            ActivityItem(
                type="certification",
                description=f"Added certification: {certification.name}",
                timestamp=certification.created_at,
            )
        )
    for role in target_roles:
        items.append(
            ActivityItem(
                type="career_goal",
                description=f"Added career goal: {role.role_name}",
                timestamp=role.created_at,
            )
        )

    items.sort(key=lambda item: item.timestamp, reverse=True)
    return items[:limit]
