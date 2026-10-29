from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.career_recommendation import CareerRecommendationsResponse
from app.services.career_recommendation_service import get_career_recommendations

router = APIRouter(
    prefix="/career-recommendations",
    tags=["career-recommendations"],
)


@router.get("", response_model=CareerRecommendationsResponse)
def list_career_recommendations(
    limit: int = Query(default=3, ge=1, le=5),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CareerRecommendationsResponse:
    """Recommend roles based on the authenticated user's saved skills."""
    result = get_career_recommendations(session, current_user, limit=limit)
    return CareerRecommendationsResponse(**result)
