from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.study_recommendation import StudyRecommendationResponse
from app.services.study_recommendation_service import get_study_recommendations


router = APIRouter(
    prefix="/study-recommendations",
    tags=["study-recommendations"],
)


@router.get("", response_model=StudyRecommendationResponse)
def list_study_recommendations(
    role_name: str = Query(min_length=1, max_length=200),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> StudyRecommendationResponse:
    try:
        result = get_study_recommendations(
            session,
            current_user,
            role_name.strip(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return StudyRecommendationResponse(**result)
