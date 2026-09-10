"""AI provider implementations - selected at startup via AI_PROVIDER env var."""
from .factory import get_ai_provider

__all__ = ["get_ai_provider"]
