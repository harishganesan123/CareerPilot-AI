"""
Typed errors raised by the AI layer.

Routers never see provider-specific exceptions. Every failure is translated
into one of these, and `app.main` maps them to safe HTTP responses (no prompts,
no provider payloads, no credentials in the message).
"""


class AIError(Exception):
    """Base class. `public_message` is safe to show to end users."""

    status_code: int = 502
    public_message: str = "The AI service failed to process this request."

    def __init__(self, detail: str | None = None) -> None:
        # `detail` is for server-side logs only and must never contain prompt text.
        super().__init__(detail or self.public_message)


class AINotConfiguredError(AIError):
    status_code = 503
    public_message = "AI features are not configured on this server."


class AITimeoutError(AIError):
    status_code = 504
    public_message = "The AI service took too long to respond. Please try again."


class AIRateLimitError(AIError):
    status_code = 429
    public_message = "Too many AI requests right now. Please wait a moment and try again."


class AIProviderError(AIError):
    status_code = 502
    public_message = "The AI provider is currently unavailable. Please try again shortly."


class AIInvalidResponseError(AIError):
    status_code = 502
    public_message = "The AI returned a response that could not be used. Please try again."


class AIInputTooLargeError(AIError):
    status_code = 413
    public_message = "The request is too large for the AI service. Please shorten it."
