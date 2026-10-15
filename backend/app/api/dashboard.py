"""
Consolidated dashboard endpoint.

Returns everything the student dashboard needs in one request, so the
frontend doesn't have to fan out to five separate endpoints on load. Every
number is computed from actual database rows.
"""
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.auth import _to_public
from app.api.projects import _to_read as project_to_read
from app.api.skills import _to_read as skill_to_read
from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.certification import Certification
from app.models.project import StudentProject
from app.models.skill import StudentSkill
from app.models.target_role import TargetRole
from app.models.user import User
from app.schemas.dashboard import DashboardResponse, DashboardStats
from app.services.dashboard_service import (
    build_recent_activity,
    calculate_profile_completion,
)
from app.services.ownership import list_owned

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> DashboardResponse:
    skills = list(list_owned(session, StudentSkill, current_user.id))
    projects = list(list_owned(session, StudentProject, current_user.id))
    certifications = list(list_owned(session, Certification, current_user.id))
    target_roles = list(list_owned(session, TargetRole, current_user.id))

    completion = calculate_profile_completion(
        current_user, skills, projects, certifications, target_roles
    )

    return DashboardResponse(
        user=_to_public(current_user),
        profile_completion=completion,
        skills=[skill_to_read(s) for s in skills],
        projects=[project_to_read(p) for p in projects],
        certifications=certifications,
        target_roles=target_roles,
        stats=DashboardStats(
            skills_count=len(skills),
            projects_count=len(projects),
            certifications_count=len(certifications),
            target_roles_count=len(target_roles),
        ),
        recent_activity=build_recent_activity(
            skills, projects, certifications, target_roles
        ),
    )
