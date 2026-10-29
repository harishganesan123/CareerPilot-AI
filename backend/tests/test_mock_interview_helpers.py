"""Basic schema and role-catalogue tests for Mock Interview."""
import pytest
from pydantic import ValidationError
from app.schemas.mock_interview import AnswerEvaluationRequest, QuestionRequest, SummaryRequest
from app.services.mock_interview_service import supported_roles

def test_roles_use_existing_role_catalogue():
    roles = supported_roles()
    assert "AI Engineer" in roles and "Data Analyst" in roles

def test_question_count_is_bounded():
    assert QuestionRequest(role="Data Analyst", question_count=5).question_count == 5
    with pytest.raises(ValidationError): QuestionRequest(role="Data Analyst", question_count=2)
    with pytest.raises(ValidationError): QuestionRequest(role="Data Analyst", question_count=9)

def test_answer_requires_minimum_content():
    with pytest.raises(ValidationError):
        AnswerEvaluationRequest(role="Data Analyst", interview_type="mixed", difficulty="intermediate",
                               question="Tell me about SQL.", answer="ok")

def test_summary_requires_answers():
    with pytest.raises(ValidationError):
        SummaryRequest(role="Data Analyst", interview_type="mixed", difficulty="intermediate", answers=[])
