"""
Career-goal (target role) endpoints. All routes are scoped to the
authenticated user.
"""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.target_role import TargetRole
from app.models.user import User
from app.schemas.target_role import TargetRoleCreate, TargetRoleRead, TargetRoleUpdate
from app.services.ownership import apply_updates, get_owned_or_404, list_owned

router = APIRouter(prefix="/career-goals", tags=["career-goals"])


@router.get("", response_model=List[TargetRoleRead])
def list_career_goals(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[TargetRole]:
    return list(list_owned(session, TargetRole, current_user.id))


@router.post("", response_model=TargetRoleRead, status_code=status.HTTP_201_CREATED)
def create_career_goal(
    data: TargetRoleCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TargetRole:
    role = TargetRole(user_id=current_user.id, **data.model_dump())
    session.add(role)
    session.commit()
    session.refresh(role)
    return role


@router.patch("/{role_id}", response_model=TargetRoleRead)
def update_career_goal(
    role_id: int,
    data: TargetRoleUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TargetRole:
    role = get_owned_or_404(session, TargetRole, role_id, current_user.id)
    apply_updates(role, data.model_dump(exclude_unset=True))
    session.add(role)
    session.commit()
    session.refresh(role)
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_career_goal(
    role_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    role = get_owned_or_404(session, TargetRole, role_id, current_user.id)
    session.delete(role)
    session.commit()
