from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.ai.rate_limit import ai_rate_limit
from app.ai.service import AIService, get_ai_service
from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.study_recommendation import (
    AIStudyRecommendationRequest,
    AIStudyRecommendationResponse,
    StudyRecommendationResponse,
)
from app.services.study_recommendation_service import (
    generate_ai_study_recommendations,
    get_study_recommendations,
)


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
    """Rule-based suggestions (no AI call). Behaviour unchanged."""
    try:
        result = get_study_recommendations(
            session,
            current_user,
            role_name.strip(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return StudyRecommendationResponse(**result)


@router.post("/ai", response_model=AIStudyRecommendationResponse)
def generate_ai_recommendations(
    data: AIStudyRecommendationRequest,
    current_user: User = Depends(ai_rate_limit),
    session: Session = Depends(get_session),
    ai: AIService = Depends(get_ai_service),
) -> AIStudyRecommendationResponse:
    """
    AI-generated suggestions through the shared AIService. Authenticated and
    rate-limited. Read-only: it never creates or changes tasks or skills.
    """
    try:
        result = generate_ai_study_recommendations(
            session,
            current_user,
            data.role_name.strip(),
            ai,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return AIStudyRecommendationResponse(**result)
