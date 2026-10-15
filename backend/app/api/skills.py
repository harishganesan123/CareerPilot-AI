"""
Skills endpoints. All routes are scoped to the authenticated user.
"""
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.skill import PROFICIENCY_PERCENT, StudentSkill
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillRead, SkillUpdate
from app.services.ownership import apply_updates, get_owned_or_404, list_owned

router = APIRouter(prefix="/skills", tags=["skills"])


def _to_read(skill: StudentSkill) -> SkillRead:
    return SkillRead(
        id=skill.id,
        skill_name=skill.skill_name,
        category=skill.category,
        proficiency=skill.proficiency,
        proficiency_percent=PROFICIENCY_PERCENT[skill.proficiency],
        created_at=skill.created_at,
        updated_at=skill.updated_at,
    )


@router.get("", response_model=List[SkillRead])
def list_skills(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[SkillRead]:
    skills = list_owned(session, StudentSkill, current_user.id)
    return [_to_read(s) for s in skills]


@router.post("", response_model=SkillRead, status_code=status.HTTP_201_CREATED)
def create_skill(
    data: SkillCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> SkillRead:
    skill = StudentSkill(user_id=current_user.id, **data.model_dump())
    session.add(skill)
    session.commit()
    session.refresh(skill)
    return _to_read(skill)


@router.patch("/{skill_id}", response_model=SkillRead)
def update_skill(
    skill_id: int,
    data: SkillUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> SkillRead:
    skill = get_owned_or_404(session, StudentSkill, skill_id, current_user.id)
    apply_updates(skill, data.model_dump(exclude_unset=True))
    skill.updated_at = datetime.now(timezone.utc)
    session.add(skill)
    session.commit()
    session.refresh(skill)
    return _to_read(skill)


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    skill = get_owned_or_404(session, StudentSkill, skill_id, current_user.id)
    session.delete(skill)
    session.commit()
