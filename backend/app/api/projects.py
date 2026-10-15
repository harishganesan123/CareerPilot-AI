"""
Projects endpoints. All routes are scoped to the authenticated user.
"""
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.project import StudentProject
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.ownership import apply_updates, get_owned_or_404, list_owned

router = APIRouter(prefix="/projects", tags=["projects"])


def _split_technologies(raw: str | None) -> List[str]:
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def _join_technologies(items: List[str]) -> str | None:
    cleaned = [item.strip() for item in items if item.strip()]
    return ", ".join(cleaned) if cleaned else None


def _to_read(project: StudentProject) -> ProjectRead:
    return ProjectRead(
        id=project.id,
        title=project.title,
        description=project.description,
        technologies=_split_technologies(project.technologies),
        project_type=project.project_type,
        role=project.role,
        github_url=project.github_url,
        demo_url=project.demo_url,
        start_date=project.start_date,
        end_date=project.end_date,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("", response_model=List[ProjectRead])
def list_projects(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[ProjectRead]:
    projects = list_owned(session, StudentProject, current_user.id)
    return [_to_read(p) for p in projects]


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ProjectRead:
    payload = data.model_dump()
    payload["technologies"] = _join_technologies(payload.get("technologies") or [])
    project = StudentProject(user_id=current_user.id, **payload)
    session.add(project)
    session.commit()
    session.refresh(project)
    return _to_read(project)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ProjectRead:
    project = get_owned_or_404(session, StudentProject, project_id, current_user.id)
    updates = data.model_dump(exclude_unset=True)
    if "technologies" in updates:
        updates["technologies"] = _join_technologies(updates["technologies"] or [])
    apply_updates(project, updates)
    project.updated_at = datetime.now(timezone.utc)
    session.add(project)
    session.commit()
    session.refresh(project)
    return _to_read(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    project = get_owned_or_404(session, StudentProject, project_id, current_user.id)
    session.delete(project)
    session.commit()
