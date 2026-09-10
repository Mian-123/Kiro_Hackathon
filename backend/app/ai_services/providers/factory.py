"""Provider factory - reads AI_PROVIDER from config, returns the right instance."""
from __future__ import annotations
import structlog
from ...config import settings

log = structlog.get_logger()


def get_ai_provider():
    p = settings.ai_provider.lower()
    if p == "groq" and settings.groq_api_key:
        from .groq_provider import GroqAIProvider
        log.info("ai_provider_selected", provider="groq",
                 vision_model=settings.groq_vision_model,
                 text_model=settings.groq_text_model)
        return GroqAIProvider()
    if p == "local":
        from .local_provider import LocalAIProvider
        log.info("ai_provider_selected", provider="local")
        return LocalAIProvider()
    from .mock_provider import MockAIProvider
    log.info("ai_provider_selected", provider="mock")
    return MockAIProvider()
