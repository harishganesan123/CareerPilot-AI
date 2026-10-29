"""Career recommendations using the existing role catalogue and skill-gap logic.

This is a transparent rule-based MVP. It ranks roles by the percentage of
listed required skills found in the authenticated user's saved skills.
It does not predict hiring probability.
"""

from sqlmodel import Session

from app.models.user import User
from app.services.skill_gap_service import ROLE_REQUIREMENTS, analyze_skill_gap


def get_career_recommendations(
    session: Session,
    user: User,
    limit: int = 3,
) -> dict:
    """Return the highest-matching roles for the current user's saved skills."""
    results = [
        analyze_skill_gap(session, user, role_name)
        for role_name in ROLE_REQUIREMENTS
    ]

    # Stable tie-break: more matched skills first, then fewer missing skills.
    results.sort(
        key=lambda item: (
            item["readiness_score"],
            item["matched_count"],
            -item["missing_count"],
        ),
        reverse=True,
    )

    return {
        "recommendations": results[:limit],
        "note": (
            "Recommendations are ranked by overlap with the skills recorded "
            "in your profile. The readiness score is not a prediction of "
            "employability or hiring probability."
        ),
    }
