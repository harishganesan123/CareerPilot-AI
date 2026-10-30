"""Provider-neutral interface. Provider SDK details live only in provider modules."""
from dataclasses import dataclass
from typing import Literal, Protocol

from pydantic import BaseModel


@dataclass(frozen=True)
class ChatMessage:
    role: Literal["user", "assistant"]
    text: str


class AIProvider(Protocol):
    name: str

    def generate(
        self,
        *,
        system_instruction: str,
        messages: list[ChatMessage],
        max_output_tokens: int,
        temperature: float,
        response_schema: type[BaseModel] | None = None,
    ) -> str:
        """Return raw model text (JSON text when `response_schema` is given)."""
        ...
