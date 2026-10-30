"""
Per-user sliding-window rate limit for AI endpoints.

In-memory, so it is per process — adequate for a single-instance deployment.
A multi-instance deployment should move this to Redis (documented limitation).
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import Depends

from app.ai.errors import AIRateLimitError
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User

_WINDOW_SECONDS = 60.0
_hits: dict[int, deque[float]] = defaultdict(deque)
_lock = threading.Lock()


def reset_rate_limits() -> None:
    with _lock:
        _hits.clear()


def ai_rate_limit(current_user: User = Depends(get_current_user)) -> User:
    now = time.monotonic()
    with _lock:
        window = _hits[current_user.id]
        while window and now - window[0] > _WINDOW_SECONDS:
            window.popleft()
        if len(window) >= settings.AI_RATE_LIMIT_PER_MINUTE:
            raise AIRateLimitError(f"user {current_user.id} exceeded AI rate limit")
        window.append(now)
    return current_user
