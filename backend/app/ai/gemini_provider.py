"""
Google Gemini provider (official `google-genai` SDK).

This is the only module that imports the SDK. It converts SDK exceptions into
the typed errors in `app.ai.errors`.
"""
from pydantic import BaseModel

from app.ai.base import ChatMessage
from app.ai.errors import (
    AINotConfiguredError,
    AIProviderError,
    AIRateLimitError,
    AITimeoutError,
)


class GeminiProvider:
    name = "gemini"

    def __init__(self, api_key: str, model: str, timeout_seconds: float) -> None:
        if not api_key:
            raise AINotConfiguredError("AI_API_KEY is empty")
        # Imported lazily so the app still boots if the SDK is not installed.
        from google import genai
        from google.genai import types

        self._types = types
        self._model = model
        # SDK timeout is in milliseconds.
        self._client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=int(timeout_seconds * 1000)),
        )

    def generate(
        self,
        *,
        system_instruction: str,
        messages: list[ChatMessage],
        max_output_tokens: int,
        temperature: float,
        response_schema: type[BaseModel] | None = None,
    ) -> str:
        from google.genai import errors
        import httpx

        types = self._types
        contents = [
            types.Content(
                role="user" if m.role == "user" else "model",
                parts=[types.Part(text=m.text)],
            )
            for m in messages
        ]
        config_kwargs: dict = {
            "system_instruction": system_instruction,
            "max_output_tokens": max_output_tokens,
            "temperature": temperature,
        }
        if response_schema is not None:
            config_kwargs["response_mime_type"] = "application/json"
            config_kwargs["response_json_schema"] = response_schema.model_json_schema()

        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=contents,
                config=types.GenerateContentConfig(**config_kwargs),
            )
        except errors.APIError as exc:
            code = getattr(exc, "code", None)
            if code == 429:
                raise AIRateLimitError(f"gemini 429") from exc
            if code in (408, 504):
                raise AITimeoutError(f"gemini {code}") from exc
            # Log only the status code — never the message, which may echo prompt content.
            raise AIProviderError(f"gemini api error code={code}") from exc
        except (httpx.TimeoutException, TimeoutError) as exc:
            raise AITimeoutError("gemini client timeout") from exc
        except httpx.HTTPError as exc:
            raise AIProviderError("gemini network error") from exc

        text = response.text
        if not text:
            # Empty text happens on safety blocks or truncation with no output.
            raise AIProviderError("gemini returned no text")
        return text
