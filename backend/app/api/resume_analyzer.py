"""Authenticated, rate-limited resume analysis endpoint."""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session

from app.ai.errors import AIInputTooLargeError
from app.ai.rate_limit import ai_rate_limit
from app.ai.service import AIService, get_ai_service
from app.core.database import get_session
from app.models.user import User
from app.schemas.resume_analyzer import ResumeAnalysisResponse
from app.services.resume_analyzer_service import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_BYTES,
    analyze_resume,
    extract_resume_text,
    ROLE_SKILLS,
)

router = APIRouter(prefix="/resume-analyzer", tags=["resume-analyzer"])


@router.get("/roles", response_model=list[str])
def list_resume_roles(
    current_user: User = Depends(ai_rate_limit),
) -> list[str]:
    """Return supported target roles."""
    return list(ROLE_SKILLS.keys())


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_uploaded_resume(
    target_role: str = Form(..., min_length=1, max_length=120),
    file: UploadFile = File(...),
    current_user: User = Depends(ai_rate_limit),
    session: Session = Depends(get_session),
    ai: AIService = Depends(get_ai_service),
) -> ResumeAnalysisResponse:
    del session  # This endpoint is stateless and does not persist resume contents.
    filename = file.filename or "resume"
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=415, detail="Upload a PDF, DOCX, or TXT resume.")
    content = await file.read(MAX_FILE_BYTES + 1)
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="The resume must be 5 MB or smaller.")

    try:
        text = extract_resume_text(filename, content)
        return analyze_resume(
            filename=filename,
            resume_text=text,
            target_role=target_role.strip(),
            ai=ai,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        await file.close()
