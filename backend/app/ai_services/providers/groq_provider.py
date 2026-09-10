"""GroqAIProvider - Groq API: Llama 4 Scout vision + Llama 3.3 70B text."""
from __future__ import annotations
import base64
import structlog

from ...config import settings
from ...models.schemas import (
    ClassifyReportRequest, ClassifyReportResponse,
    CheckDuplicateRequest, CheckDuplicateResponse,
    PriorityRequest, PriorityResponse,
)
from ..base import BaseAIProvider
from ..classifier import CLASSIFY_SYSTEM_PROMPT
from ..priority_scorer import PRIORITY_SYSTEM_PROMPT
from ..utils import CATEGORIES, priority_factors, parse_llm_json
from .local_provider import LocalAIProvider
from .mock_provider import MockAIProvider

log = structlog.get_logger()


class GroqAIProvider(BaseAIProvider):

    def __init__(self) -> None:
        self._client = None
        self._local  = LocalAIProvider()
        try:
            from groq import AsyncGroq
            self._client = AsyncGroq(api_key=settings.groq_api_key)
            log.info("groq_provider_ready",
                     vision_model=settings.groq_vision_model,
                     text_model=settings.groq_text_model)
        except Exception as e:
            log.warning("groq_init_failed", error=str(e), fallback="mock")

    async def classify_report(self, req: ClassifyReportRequest) -> ClassifyReportResponse:
        if not self._client:
            return await MockAIProvider().classify_report(req)
        try:
            user_parts: list[dict] = []
            if req.description:
                user_parts.append({"type": "text", "text": f"Citizen report description: {req.description}"})
            if req.image_path:
                try:
                    import aiofiles
                    import filetype
                    async with aiofiles.open(req.image_path, "rb") as f:
                        raw = await f.read()
                    kind = filetype.guess(raw)
                    mime = kind.mime if kind else "image/jpeg"
                    b64  = base64.b64encode(raw).decode()
                    user_parts.append({"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}})
                except Exception as img_err:
                    log.warning("groq_image_load_failed", error=str(img_err))
            if not user_parts:
                user_parts.append({"type": "text", "text": "Civic issue reported - no details provided."})

            resp = await self._client.chat.completions.create(
                model=settings.groq_vision_model,
                messages=[
                    {"role": "system", "content": CLASSIFY_SYSTEM_PROMPT},
                    {"role": "user",   "content": user_parts},
                ],
                temperature=0.1,
                max_tokens=350,
            )
            result   = parse_llm_json(resp.choices[0].message.content or "{}")
            cat      = result.get("category", "Other")
            if cat not in CATEGORIES:
                cat = "Other"
            conf     = float(result.get("confidence", 0.72))
            sev      = result.get("severity", "medium")
            sev_conf = float(result.get("severity_confidence", 0.65))
            rel      = float(result.get("relevance", 0.88))
            desc     = result.get("description", f"{cat} issue in Lahore.")

            log.info("groq_classified", category=cat, severity=sev, confidence=conf,
                     model=settings.groq_vision_model)

            return ClassifyReportResponse(
                image_category=cat, image_category_confidence=round(conf, 2),
                image_relevance=round(rel, 2), image_severity=sev,
                image_severity_confidence=round(sev_conf, 2),
                image_description=desc,
                text_category=cat if req.description else None,
                text_category_confidence=round(conf, 2) if req.description else None,
                text_sentiment="urgent" if conf > 0.80 else "neutral",
                text_language_detected=req.description_language.value if req.description else None,
            )
        except Exception as e:
            log.error("groq_classify_failed", error=str(e), fallback="mock")
            return await MockAIProvider().classify_report(req)

    async def check_duplicate(self, req: CheckDuplicateRequest, existing_incidents: list[dict]) -> CheckDuplicateResponse:
        return await self._local.check_duplicate(req, existing_incidents)

    async def calculate_priority(self, req: PriorityRequest) -> PriorityResponse:
        score, band, factors = priority_factors(
            req.severity.value, req.report_count, req.latitude, req.longitude, req.created_at)
        if self._client:
            try:
                prompt = (
                    f"Incident details:\n"
                    f"- Severity: {req.severity.value}\n"
                    f"- Citizen reports: {req.report_count}\n"
                    f"- Location: {req.latitude:.4f}, {req.longitude:.4f} (Lahore, Pakistan)\n"
                    f"- Calculated priority score: {score}/100 ({band.value})\n\n"
                    f"Provide 2-sentence reasoning for this priority level."
                )
                resp = await self._client.chat.completions.create(
                    model=settings.groq_text_model,
                    messages=[
                        {"role": "system", "content": PRIORITY_SYSTEM_PROMPT},
                        {"role": "user",   "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=200,
                )
                result = parse_llm_json(resp.choices[0].message.content or "{}")
                factors["groq_reasoning"] = result.get("reasoning", "")
                log.info("groq_priority_done", score=score, band=band.value)
            except Exception as e:
                log.warning("groq_priority_reasoning_skipped", error=str(e))
        return PriorityResponse(priority_score=score, priority_band=band, factors=factors)
