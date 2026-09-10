"""
Backward-compatibility shim.
The real AI implementation now lives in app/ai_services/.
Existing imports (from ..services.ai_adapter import ai_provider) keep working.
"""
from ..ai_services import ai_provider  # noqa: F401

__all__ = ["ai_provider"]
