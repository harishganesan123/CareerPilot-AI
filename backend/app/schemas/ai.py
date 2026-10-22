from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class AIStatusResponse(BaseModel):
    configured: bool
    provider: str
    model: str
    # Why AI is unavailable, if it is. Never contains credentials.
    problem: str | None = None


class AIPingResult(BaseModel):
    """Schema the model must fill in. Also used to verify structured output end to end."""

    message: str = Field(max_length=100)


class AIPingResponse(BaseModel):
    ok: bool
    provider: str
    model: str
    reply: str
    latency_ms: int
    note: str = "AI-generated. Connectivity check only."


# ---------------------------------------------------------------------------
# AI Learning Assistant chat
# ---------------------------------------------------------------------------
CHAT_MESSAGE_MAX_CHARS = 2000
CHAT_HISTORY_TURN_MAX_CHARS = 4000
CHAT_HISTORY_MAX_TURNS = 20
CHAT_HISTORY_MAX_TOTAL_CHARS = 12000


def _clean(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Message must not be empty.")
    return value


class ChatTurn(BaseModel):
    """One previous message. Only user/assistant roles exist: clients cannot inject system turns."""

    role: Literal["user", "assistant"]
    content: str = Field(max_length=CHAT_HISTORY_TURN_MAX_CHARS)

    _strip = field_validator("content")(_clean)


class ChatRequest(BaseModel):
    message: str = Field(max_length=CHAT_MESSAGE_MAX_CHARS)
    conversation_history: list[ChatTurn] = Field(default_factory=list, max_length=CHAT_HISTORY_MAX_TURNS)

    _strip = field_validator("message")(_clean)

    @model_validator(mode="after")
    def _bound_history_size(self) -> "ChatRequest":
        if sum(len(t.content) for t in self.conversation_history) > CHAT_HISTORY_MAX_TOTAL_CHARS:
            raise ValueError("Conversation history is too long. Start a new conversation.")
        return self


class ChatResponse(BaseModel):
    answer: str
    model: str
    # Phase 2 has no document retrieval: answers come from general model knowledge only.
    source: Literal["general_knowledge"] = "general_knowledge"
    latency_ms: int
    note: str = "AI-generated and may be inaccurate. Verify important information."
