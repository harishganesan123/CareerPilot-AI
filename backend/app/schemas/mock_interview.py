"""Validated schemas for mock interview practice."""
from typing import Literal
from pydantic import BaseModel, Field, field_validator

InterviewType = Literal["technical", "behavioral", "mixed"]
Difficulty = Literal["beginner", "intermediate", "advanced"]

class InterviewOptions(BaseModel):
    roles: list[str]
    interview_types: list[str]
    difficulties: list[str]

class QuestionRequest(BaseModel):
    role: str = Field(min_length=2, max_length=120)
    interview_type: InterviewType = "mixed"
    difficulty: Difficulty = "intermediate"
    question_count: int = Field(default=5, ge=3, le=8)
    @field_validator("role")
    @classmethod
    def clean_role(cls, value: str) -> str:
        return value.strip()

class InterviewQuestion(BaseModel):
    question: str = Field(min_length=10, max_length=500)
    topic: str = Field(min_length=2, max_length=100)
    what_to_cover: list[str] = Field(min_length=1, max_length=5)

class QuestionSet(BaseModel):
    questions: list[InterviewQuestion] = Field(min_length=3, max_length=8)

class AnswerEvaluationRequest(BaseModel):
    role: str = Field(min_length=2, max_length=120)
    interview_type: InterviewType
    difficulty: Difficulty
    question: str = Field(min_length=10, max_length=500)
    answer: str = Field(min_length=10, max_length=4000)
    @field_validator("role", "question", "answer")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

class AnswerEvaluation(BaseModel):
    score: int = Field(ge=0, le=100)
    rating: Literal["Needs improvement", "Developing", "Good", "Strong"]
    strengths: list[str] = Field(max_length=4)
    improvements: list[str] = Field(min_length=1, max_length=5)
    suggested_answer: str = Field(min_length=10, max_length=1200)
    concise_tip: str = Field(min_length=5, max_length=300)

class InterviewAnswerRecord(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=4000)
    score: int = Field(ge=0, le=100)
    feedback_summary: str = Field(min_length=1, max_length=600)

class SummaryRequest(BaseModel):
    role: str = Field(min_length=2, max_length=120)
    interview_type: InterviewType
    difficulty: Difficulty
    answers: list[InterviewAnswerRecord] = Field(min_length=3, max_length=8)

class InterviewSummary(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    performance_level: Literal["Needs more practice", "Developing", "Interview ready", "Strong performance"]
    key_strengths: list[str] = Field(min_length=1, max_length=5)
    priority_improvements: list[str] = Field(min_length=1, max_length=5)
    practice_plan: list[str] = Field(min_length=2, max_length=5)
    closing_note: str = Field(min_length=10, max_length=500)
