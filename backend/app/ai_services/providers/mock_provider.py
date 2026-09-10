"""MockAIProvider - deterministic keyword rules, no external API calls."""
from __future__ import annotations
import asyncio
import hashlib

from ...models.schemas import (
    ClassifyReportRequest, ClassifyReportResponse,
    CheckDuplicateRequest, CheckDuplicateResponse,
    PriorityRequest, PriorityResponse,
)
from ..base import BaseAIProvider
from ..utils import CATEGORIES, score_category, score_severity, priority_factors
from ..deduplicator import build_duplicate_response


class MockAIProvider(BaseAIProvider):

    async def classify_report(self, req: ClassifyReportRequest) -> ClassifyReportResponse:
        await asyncio.sleep(0.05)
        cat, conf = "Other", 0.60
        sev, sev_conf = "medium", 0.55
        rel = 0.80
        if req.description:
            cat, conf = score_category(req.description)
            sev, sev_conf = score_severity(req.description)
            rel = min(0.97, conf + 0.10)
        if req.image_path:
            h   = int(hashlib.md5(req.image_path.encode()).hexdigest(), 16)
            cat = CATEGORIES[h % len(CATEGORIES)]
            conf = round(0.60 + (h % 30) / 100, 2)
            sev  = ("low", "medium", "high", "critical")[(h >> 4) % 4]
            rel  = round(0.75 + (h % 20) / 100, 2)
        return ClassifyReportResponse(
            image_category=cat, image_category_confidence=round(conf, 2),
            image_relevance=round(rel, 2), image_severity=sev,
            image_severity_confidence=round(sev_conf, 2),
            image_description=f"Civic issue: {cat.lower()} requiring attention.",
            text_category=cat if req.description else None,
            text_category_confidence=round(conf, 2) if req.description else None,
            text_sentiment="urgent" if conf > 0.80 else "neutral",
            text_language_detected=req.description_language.value if req.description else None,
        )

    async def check_duplicate(self, req: CheckDuplicateRequest, existing_incidents: list[dict]) -> CheckDuplicateResponse:
        await asyncio.sleep(0.02)
        return build_duplicate_response(req, existing_incidents)

    async def calculate_priority(self, req: PriorityRequest) -> PriorityResponse:
        await asyncio.sleep(0.02)
        score, band, factors = priority_factors(
            req.severity.value, req.report_count, req.latitude, req.longitude, req.created_at)
        return PriorityResponse(priority_score=score, priority_band=band, factors=factors)
