from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.skill_gap import (
    CareerRoleOption,
    SkillGapRequest,
    SkillGapResponse,
)
from app.services.skill_gap_service import (
    analyze_skill_gap,
    get_role_catalogue,
)

router = APIRouter(prefix="/skill-gap", tags=["skill-gap"])


@router.get("/roles", response_model=list[CareerRoleOption])
def list_supported_roles(
    current_user: User = Depends(get_current_user),
) -> list[CareerRoleOption]:
    return get_role_catalogue()


@router.post("/analyze", response_model=SkillGapResponse)
def run_skill_gap_analysis(
    data: SkillGapRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> SkillGapResponse:
    try:
        result = analyze_skill_gap(session, current_user, data.role_name.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return SkillGapResponse(**result)