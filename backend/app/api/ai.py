"""
AI diagnostics. Both endpoints require authentication; `/ai/ping` also
consumes the user's AI rate-limit budget because it makes a real model call.
"""
import time

from fastapi import APIRouter, Depends

from app.ai.base import ChatMessage
from app.ai.errors import AIInvalidResponseError
from app.ai.prompts import ASSISTANT_SYSTEM_PROMPT
from app.ai.rate_limit import ai_rate_limit
from app.ai.service import AIService, config_problem, get_ai_service
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.ai import (
    AIPingResponse,
    AIPingResult,
    AIStatusResponse,
    ChatRequest,
    ChatResponse,
)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status", response_model=AIStatusResponse)
def ai_status(_: User = Depends(get_current_user)) -> AIStatusResponse:
    """Is AI configured? Reveals provider and model names, never the key."""
    problem = config_problem(settings)
    return AIStatusResponse(
        configured=problem is None,
        provider=settings.AI_PROVIDER,
        model=settings.AI_MODEL,
        problem=problem,
    )


@router.post("/ping", response_model=AIPingResponse)
def ai_ping(
    _: User = Depends(ai_rate_limit),
    ai: AIService = Depends(get_ai_service),
) -> AIPingResponse:
    """Real, minimal structured model call to verify the integration works."""
    started = time.monotonic()
    result = ai.generate_structured(
        system="Reply with a JSON object whose 'message' field is a short friendly greeting.",
        messages=[ChatMessage(role="user", text="Say hello to a CareerPilot AI student.")],
        schema=AIPingResult,
        max_output_tokens=100,
    )
    return AIPingResponse(
        ok=True,
        provider=settings.AI_PROVIDER,
        model=settings.AI_MODEL,
        reply=result.message,
        latency_ms=int((time.monotonic() - started) * 1000),
    )


@router.post("/chat", response_model=ChatResponse)
def ai_chat(
    data: ChatRequest,
    _: User = Depends(ai_rate_limit),
    ai: AIService = Depends(get_ai_service),
) -> ChatResponse:
    """
    AI Learning Assistant. Stateless: the client supplies a bounded history,
    which is treated as untrusted. Nothing is stored and the model has no
    access to the database or any tools.
    """
    started = time.monotonic()
    messages = [ChatMessage(role=t.role, text=t.content) for t in data.conversation_history]
    messages.append(ChatMessage(role="user", text=data.message))

    answer = ai.generate_text(
        system=ASSISTANT_SYSTEM_PROMPT,
        messages=messages,
        max_output_tokens=1024,
    ).strip()
    if not answer:
        raise AIInvalidResponseError("empty chat answer")

    return ChatResponse(
        answer=answer,
        model=settings.AI_MODEL,
        latency_ms=int((time.monotonic() - started) * 1000),
    )
