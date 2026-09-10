"""LocalAIProvider - offline sentence-transformers + imagehash, no API key."""
from __future__ import annotations
from typing import Optional
import structlog

from ...models.schemas import (
    ClassifyReportRequest, ClassifyReportResponse,
    CheckDuplicateRequest, CheckDuplicateResponse,
    PriorityRequest, PriorityResponse,
)
from ..base import BaseAIProvider
from ..utils import score_category, score_severity, priority_factors
from ..deduplicator import build_duplicate_response

log = structlog.get_logger()


class LocalAIProvider(BaseAIProvider):

    def __init__(self) -> None:
        self._embedder = None
        self._loaded   = False

    def _load_embedder(self):
        if self._loaded:
            return self._embedder
        try:
            from sentence_transformers import SentenceTransformer
            self._embedder = SentenceTransformer("all-MiniLM-L6-v2")
            log.info("local_embedder_loaded", model="all-MiniLM-L6-v2")
        except Exception as e:
            log.warning("local_embedder_unavailable", error=str(e))
        self._loaded = True
        return self._embedder

    def _semantic_similarity(self, text_a: str, text_b: str) -> float:
        emb = self._load_embedder()
        if emb is None:
            wa, wb = set(text_a.lower().split()), set(text_b.lower().split())
            u = wa | wb
            return min(0.99, len(wa & wb) / len(u) + 0.30) if u else 0.5
        import numpy as np
        vecs = emb.encode([text_a, text_b], convert_to_numpy=True)
        cos  = float(np.dot(vecs[0], vecs[1]) / (np.linalg.norm(vecs[0]) * np.linalg.norm(vecs[1]) + 1e-9))
        return min(0.99, (cos + 1) / 2 + 0.10)

    def _image_similarity(self, path_a: str, path_b: str) -> Optional[float]:
        try:
            import imagehash
            from PIL import Image
            ha = imagehash.phash(Image.open(path_a))
            hb = imagehash.phash(Image.open(path_b))
            return max(0.0, 1.0 - (ha - hb) / 64)
        except Exception:
            return None

    async def classify_report(self, req: ClassifyReportRequest) -> ClassifyReportResponse:
        cat, conf = score_category(req.description) if req.description else ("Other", 0.60)
        sev, sev_conf = score_severity(req.description) if req.description else ("medium", 0.55)
        rel = min(0.95, conf + 0.12)
        return ClassifyReportResponse(
            image_category=cat, image_category_confidence=round(conf, 2),
            image_relevance=round(rel, 2), image_severity=sev,
            image_severity_confidence=round(sev_conf, 2),
            image_description=f"Local analysis: {cat.lower()} issue detected.",
            text_category=cat if req.description else None,
            text_category_confidence=round(conf, 2) if req.description else None,
            text_sentiment="urgent" if conf > 0.78 else "neutral",
            text_language_detected=req.description_language.value if req.description else None,
        )

    async def check_duplicate(self, req: CheckDuplicateRequest, existing_incidents: list[dict]) -> CheckDuplicateResponse:
        return build_duplicate_response(req, existing_incidents,
            semantic_fn=self._semantic_similarity, image_fn=self._image_similarity)

    async def calculate_priority(self, req: PriorityRequest) -> PriorityResponse:
        score, band, factors = priority_factors(
            req.severity.value, req.report_count, req.latitude, req.longitude, req.created_at)
        return PriorityResponse(priority_score=score, priority_band=band, factors=factors)
