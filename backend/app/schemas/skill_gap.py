from pydantic import BaseModel, Field


class SkillGapRequest(BaseModel):
    role_name: str = Field(min_length=1, max_length=200)


class MatchedSkill(BaseModel):
    skill_name: str
    student_skill_name: str
    proficiency: str
    proficiency_percent: int


class SkillGapResponse(BaseModel):
    role_name: str
    description: str
    readiness_score: int
    readiness_level: str
    matched_count: int
    missing_count: int
    total_required_skills: int
    matched_skills: list[MatchedSkill]
    missing_skills: list[str]
    recommended_next_skills: list[str]
    score_note: str


class CareerRoleOption(BaseModel):
    role_name: str
    description: str
    required_skills: list[str]