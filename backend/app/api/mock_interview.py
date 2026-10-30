"""Authenticated, rate-limited mock interview endpoints; no session persistence."""
from fastapi import APIRouter, Depends, HTTPException
from app.ai.rate_limit import ai_rate_limit
from app.ai.service import AIService, get_ai_service
from app.models.user import User
from app.schemas.mock_interview import (AnswerEvaluation, AnswerEvaluationRequest, InterviewOptions,
    InterviewSummary, QuestionRequest, QuestionSet, SummaryRequest)
from app.services.mock_interview_service import (DIFFICULTIES, INTERVIEW_TYPES, evaluate_answer,
    generate_questions, summarize_interview, supported_roles)

router = APIRouter(prefix="/mock-interview", tags=["mock-interview"])

@router.get("/options", response_model=InterviewOptions)
def get_options(_: User = Depends(ai_rate_limit)) -> InterviewOptions:
    return InterviewOptions(roles=supported_roles(), interview_types=INTERVIEW_TYPES, difficulties=DIFFICULTIES)

@router.post("/questions", response_model=QuestionSet)
def create_questions(data: QuestionRequest, _: User = Depends(ai_rate_limit), ai: AIService = Depends(get_ai_service)) -> QuestionSet:
    try:
        return generate_questions(role=data.role, interview_type=data.interview_type, difficulty=data.difficulty, count=data.question_count, ai=ai)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/evaluate", response_model=AnswerEvaluation)
def evaluate(data: AnswerEvaluationRequest, _: User = Depends(ai_rate_limit), ai: AIService = Depends(get_ai_service)) -> AnswerEvaluation:
    if data.role not in supported_roles():
        raise HTTPException(status_code=400, detail="Choose a supported role.")
    return evaluate_answer(role=data.role, interview_type=data.interview_type, difficulty=data.difficulty,
        question=data.question, answer=data.answer, ai=ai)

@router.post("/summary", response_model=InterviewSummary)
def summary(data: SummaryRequest, _: User = Depends(ai_rate_limit), ai: AIService = Depends(get_ai_service)) -> InterviewSummary:
    if data.role not in supported_roles():
        raise HTTPException(status_code=400, detail="Choose a supported role.")
    return summarize_interview(data=data, ai=ai)
