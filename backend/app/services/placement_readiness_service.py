from typing import Any

from app.services.skill_gap_service import ROLE_REQUIREMENTS, analyze_skill_gap


DISCLAIMER = (
    "This is a rule-based readiness estimate based on available skill coverage. "
    "It is not a hiring-probability prediction and does not assess recruiter decisions."
)


def _field(value: Any, *names: str, default: Any = None) -> Any:
    """Read a field from either a dict-like result or an object."""
    for name in names:
        if isinstance(value, dict) and name in value:
            return value[name]
        if hasattr(value, name):
            return getattr(value, name)
    return default


def _number(value: Any, default: float = 0.0) -> float:
    try:
        return max(0.0, min(100.0, float(value)))
    except (TypeError, ValueError):
        return default


def _status(score: float) -> str:
    if score >= 80:
        return "Strong"
    if score >= 60:
        return "Developing"
    return "Needs improvement"


def calculate_placement_readiness(
    session: Any,
    user: Any,
    target_role: str | None = None,
) -> dict[str, Any]:
    """
    Minimal MVP using the project's existing skill-gap analysis.

    This deliberately avoids assuming database fields for profile, projects,
    certifications, or interview history. The current score is skills-based.
    """
    roles = list(ROLE_REQUIREMENTS.keys())
    if not roles:
        raise ValueError("No role requirements are configured.")

    normalized_target = target_role.strip().casefold() if target_role else None
    selected_role = None
    if normalized_target:
        selected_role = next(
            (role for role in roles if role.casefold() == normalized_target),
            None,
        )
        if selected_role is None:
            raise ValueError(
                f"Unknown target role. Available roles: {', '.join(roles)}"
            )

    roles_to_score = [selected_role] if selected_role else roles
    analyses = []
    for role in roles_to_score:
        result = analyze_skill_gap(session, user, role)
        readiness = _field(
            result,
            "readiness_score",
            "match_percentage",
            "skill_match_percentage",
            "coverage_percentage",
            default=None,
        )
        matched = _field(result, "matched_skills", "matched", default=[]) or []
        missing = _field(result, "missing_skills", "missing", default=[]) or []

        # If the existing result does not expose a percentage, derive coverage
        # from matched/missing skill counts without inventing a value.
        if readiness is None:
            total = len(matched) + len(missing)
            readiness = (len(matched) / total * 100) if total else 0.0

        analyses.append({
            "role": role,
            "score": _number(readiness),
            "matched": list(matched),
            "missing": list(missing),
        })

    analyses.sort(key=lambda item: item["score"], reverse=True)
    best = analyses[0]
    average_score = sum(item["score"] for item in analyses) / len(analyses)

    if selected_role:
        overall = best["score"]
        target_label = selected_role
        factors = [
            {
                "name": "Target-role skill coverage",
                "score": round(best["score"], 1),
                "weight": 1.0,
                "status": _status(best["score"]),
                "details": (
                    f"{len(best['matched'])} listed skills matched; "
                    f"{len(best['missing'])} listed skills missing."
                ),
            }
        ]
        strengths = [f"Matched skill: {skill}" for skill in best["matched"][:5]]
        improvement_areas = [f"Missing skill: {skill}" for skill in best["missing"][:5]]
        recommended_actions = [
            f"Build or complete a practical project using {skill}."
            for skill in best["missing"][:3]
        ]
        if not recommended_actions:
            recommended_actions = [
                "Validate your skills with a portfolio project and mock interview practice."
            ]
    else:
        overall = average_score
        target_label = None
        factors = [
            {
                "name": "Average skill coverage across configured roles",
                "score": round(average_score, 1),
                "weight": 1.0,
                "status": _status(average_score),
                "details": (
                    f"Compared saved skills against {len(analyses)} configured roles. "
                    f"Best current match: {best['role']} ({best['score']:.1f}%)."
                ),
            }
        ]
        strengths = [
            f"Best matching role is {best['role']} ({best['score']:.1f}% coverage)."
        ]
        improvement_areas = [
            f"{item['role']}: {len(item['missing'])} missing listed skills"
            for item in analyses[:3]
            if item["missing"]
        ]
        recommended_actions = [
            f"Review the missing skills for {best['role']} and practise them in a project."
        ]
        if not recommended_actions:
            recommended_actions = [
                "Build a portfolio project and practise role-specific interview questions."
            ]

    if overall >= 80:
        level = "High readiness"
    elif overall >= 60:
        level = "Moderate readiness"
    else:
        level = "Building readiness"

    return {
        "overall_score": round(overall, 1),
        "readiness_level": level,
        "target_role": target_label,
        "factors": factors,
        "strengths": strengths or ["Continue building demonstrable practical skills."],
        "improvement_areas": improvement_areas or ["Add more role-specific skills to your profile."],
        "recommended_actions": recommended_actions,
        "disclaimer": DISCLAIMER,
    }
