"""Authenticated CRUD endpoints for study tasks."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.study_task import StudyTask
from app.models.user import User
from app.schemas.study_task import StudyTaskCreate, StudyTaskRead, StudyTaskUpdate
from app.services.ownership import get_owned_or_404, list_owned

router = APIRouter(prefix="/study-tasks", tags=["study-tasks"])


@router.get("", response_model=list[StudyTaskRead])
def list_study_tasks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[StudyTask]:
    """List the authenticated student's study tasks."""
    return list(list_owned(session, StudyTask, current_user.id))


@router.post(
    "",
    response_model=StudyTaskRead,
    status_code=status.HTTP_201_CREATED,
)
def create_study_task(
    data: StudyTaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> StudyTask:
    """Create a task owned by the authenticated student."""
    title = data.title.strip()
    subject = data.subject.strip()

    if not title or not subject:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Title and subject cannot be blank.",
        )

    task = StudyTask(
        user_id=current_user.id,
        **{
            **data.model_dump(exclude={"title", "subject"}),
            "title": title,
            "subject": subject,
        },
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.patch("/{task_id}", response_model=StudyTaskRead)
def update_study_task(
    task_id: int,
    data: StudyTaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> StudyTask:
    """Update a task only when it belongs to the authenticated student."""
    task = get_owned_or_404(session, StudyTask, task_id, current_user.id)
    updates = data.model_dump(exclude_unset=True)

    for field in ("title", "subject"):
        if field in updates:
            value = updates[field]
            if value is None or not value.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"{field.replace('_', ' ').capitalize()} cannot be blank.",
                )
            updates[field] = value.strip()

    for field, value in updates.items():
        setattr(task, field, value)

    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """Delete a task only when it belongs to the authenticated student."""
    task = get_owned_or_404(session, StudyTask, task_id, current_user.id)
    session.delete(task)
    session.commit()
