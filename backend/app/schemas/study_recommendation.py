from typing import Literal

from pydantic import BaseModel, Field


class StudyRecommendation(BaseModel):
    skill_name: str
    priority: str
    estimated_minutes: int
    reason: str
    suggested_activity: str


class StudyRecommendationResponse(BaseModel):
    role_name: str
    readiness_score: int
    readiness_level: str
    missing_count: int
    recommendations: list[StudyRecommendation]
    method_note: str
    # Additive field: lets clients label where the suggestions came from.
    source: Literal["rule_based"] = "rule_based"


# ---------------------------------------------------------------------------
# AI-generated recommendations (POST /study-recommendations/ai)
# ---------------------------------------------------------------------------
MAX_AI_RECOMMENDATIONS = 5


class AIStudyRecommendationRequest(BaseModel):
    role_name: str = Field(min_length=1, max_length=200)


class AIGeneratedRecommendation(BaseModel):
    """One item exactly as the model must produce it. Bounds are enforced here."""

    skill_name: str = Field(min_length=1, max_length=120)
    priority: Literal["High", "Medium", "Low"]
    reason: str = Field(min_length=1, max_length=400)
    suggested_activity: str = Field(min_length=1, max_length=400)
    estimated_minutes: int = Field(ge=15, le=240)
    order: int = Field(ge=1, le=MAX_AI_RECOMMENDATIONS)
    prerequisites: list[str] = Field(default_factory=list, max_length=3)
    expected_outcome: str = Field(min_length=1, max_length=300)


class AIGeneratedRecommendations(BaseModel):
    """Schema the model must fill in (sent to the provider as its JSON schema)."""

    recommendations: list[AIGeneratedRecommendation] = Field(
        min_length=1, max_length=MAX_AI_RECOMMENDATIONS
    )


class AIStudyRecommendation(AIGeneratedRecommendation):
    """Validated item returned to clients. Superset of `StudyRecommendation`."""

    # Computed by the server from the student's own tasks, never by the model.
    already_planned: bool = False


class AIStudyRecommendationResponse(BaseModel):
    role_name: str
    readiness_score: int
    readiness_level: str
    missing_count: int
    recommendations: list[AIStudyRecommendation]
    method_note: str
    # "ai" only when the model actually produced the recommendations. A role with
    # nothing missing needs no model call and is reported as "rule_based".
    source: Literal["ai", "rule_based"]
    model: str | None = None
