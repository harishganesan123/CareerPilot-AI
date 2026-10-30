from pydantic import BaseModel, Field


class RecommendedSkillMatch(BaseModel):
    skill_name: str
    student_skill_name: str
    proficiency: str
    proficiency_percent: int


class CareerRecommendationItem(BaseModel):
    role_name: str
    description: str
    readiness_score: int = Field(ge=0, le=100)
    readiness_level: str
    matched_count: int
    missing_count: int
    total_required_skills: int
    matched_skills: list[RecommendedSkillMatch]
    missing_skills: list[str]
    recommended_next_skills: list[str]
    score_note: str


class CareerRecommendationsResponse(BaseModel):
    recommendations: list[CareerRecommendationItem]
    note: str
