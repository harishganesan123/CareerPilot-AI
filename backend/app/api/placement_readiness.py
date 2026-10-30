
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.placement_readiness import PlacementReadinessResponse
from app.services.placement_readiness_service import calculate_placement_readiness

router = APIRouter(prefix="/placement-readiness", tags=["placement-readiness"])


@router.get("", response_model=PlacementReadinessResponse)
def get_placement_readiness(
    target_role: str | None = Query(
        default=None,
        description="Optional role from the configured role catalogue",
    ),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PlacementReadinessResponse:
    try:
        result = calculate_placement_readiness(
            session,
            current_user,
            target_role,
        )
        return PlacementReadinessResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
