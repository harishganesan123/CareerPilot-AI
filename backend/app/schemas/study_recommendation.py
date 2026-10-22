from pydantic import BaseModel


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
