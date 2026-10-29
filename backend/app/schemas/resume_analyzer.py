"""Validated request/response schemas for resume analysis."""
from pydantic import BaseModel, Field


class ResumeFeedback(BaseModel):
    summary: str = Field(min_length=10, max_length=1200)
    strengths: list[str] = Field(min_length=1, max_length=6)
    improvements: list[str] = Field(min_length=1, max_length=8)
    skills_found: list[str] = Field(max_length=30)
    missing_or_unclear_skills: list[str] = Field(max_length=20)
    bullet_rewrites: list[str] = Field(max_length=5)
    ats_tips: list[str] = Field(min_length=1, max_length=6)


class ResumeAnalysisResponse(BaseModel):
    filename: str
    target_role: str
    ats_score: int = Field(ge=0, le=100)
    score_breakdown: dict[str, int]
    detected_sections: list[str]
    feedback: ResumeFeedback
    score_note: str
    source: str = "ai_generated"
