"""
CivicPulse AI Services
======================
Three operations performed by AI on every citizen report:
  1. classify_report    - What kind of civic issue is this?
  2. check_duplicate    - Has this already been reported nearby?
  3. calculate_priority - How urgent is this incident?

Usage:
    from app.ai_services import ai_provider

Provider selected at startup via AI_PROVIDER env var: mock | local | groq
"""
from .providers.factory import get_ai_provider

ai_provider = get_ai_provider()

__all__ = ["ai_provider"]
