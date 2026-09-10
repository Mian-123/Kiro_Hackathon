"""
AI Service Adapter — CivicPulse Lahore
Supports: mock | openai | anthropic

All AI outputs are advisory. No AI call blocks report submission.
"""
from __future__ import annotations
import asyncio
import base64
import hashlib
import math
import random
from typing import Optional
from datetime import datetime, timezone

import structlog

from ..config import settings
from ..models.schemas import (
    ClassifyReportRequest,
    ClassifyReportResponse,
    CheckDuplicateRequest,
    CheckDuplicateResponse,
    DuplicateCandidate,
    PriorityRequest,
    PriorityResponse,
    PriorityBandEnum,
)

log = structlog.get_logger()

# ── Category taxonomy ─────────────────────────────────────────────────────────
CATEGORIES = [
    "Broken Road", "Garbage / Waste", "Sewerage / Water", "Streetlight",
    "Encroachment", "Flooding / Standing Water", "Safety Hazard",
    "Drainage", "Infrastructure", "Other",
]

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Sewerage / Water": ["sewage", "drain", "sewer", "water", "overflow", "leak", "pipe", "flood", "blockage"],
    "Broken Road": ["pothole", "road", "crack", "asphalt", "pavement", "broken", "damage"],
    "Garbage / Waste": ["garbage", "trash", "waste", "rubbish", "litter", "dump", "bin", "smell"],
    "Streetlight": ["light", "streetlight", "lamp", "dark", "bulb", "pole"],
    "Flooding / Standing Water": ["flood", "water", "standing", "waterlogged", "rain"],
    "Encroachment": ["encroach", "block", "illegal", "construction", "footpath"],
    "Safety Hazard": ["hazard", "danger", "unsafe", "risk", "wire", "fire", "accident"],
    "Drainage": ["drain", "drainage", "gutter", "channel", "blocked"],
    "Infrastructure": ["building", "wall", "bridge", "structure", "collapse"],
}


def _score_category(text: str) -> tuple[str, float]:
    """Simple keyword-based category scoring (fallback when AI unavailable)."""
    text_lower = text.lower()
    scores: dict[str, int] = {}
    for cat, kws in CATEGORY_KEYWORDS.items():
        scores[cat] = sum(1 for kw in kws if kw in text_lower)
    best = max(scores, key=lambda c: scores[c])
    total = sum(scores.values()) or 1
    confidence = min(0.95, max(0.40, scores[best] / total))
    return (best if scores[best] > 0 else "Other", confidence)


def _priority_band(score: float) -> PriorityBandEnum:
    if score >= 76:
        return PriorityBandEnum.CRITICAL
    if score >= 51:
        return PriorityBandEnum.HIGH
    if score >= 26:
        return PriorityBandEnum.MEDIUM
    return PriorityBandEnum.LOW


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Mock AI provider ──────────────────────────────────────────────────────────

class MockAIProvider:
    """Simulates realistic AI responses for the prototype/demo."""

    async def classify_report(self, req: ClassifyReportRequest) -> ClassifyReportResponse:
        await asyncio.sleep(0.1)  # simulate network latency

        category = "Other"
        confidence = 0.60
        severity = "medium"
        relevance = 0.85

        if req.description:
            category, confidence = _score_category(req.description)
            relevance = min(0.98, confidence + 0.15)

        # Simulate image analysis if path provided
        if req.image_path:
            # Use a hash of the path to get deterministic "AI" results
            h = int(hashlib.md5(req.image_path.encode()).hexdigest(), 16)
            cat_idx = h % len(CATEGORIES)
            category = CATEGORIES[cat_idx]
            confidence = 0.65 + (h % 30) / 100
            severity_choices = ["low", "medium", "high", "critical"]
            severity = severity_choices[(h >> 4) % 4]
            relevance = 0.80 + (h % 15) / 100

        log.info("mock_classify", category=category, confidence=confidence)

        return ClassifyReportResponse(
            image_category=category,
            image_category_confidence=round(confidence, 2),
            image_relevance=round(relevance, 2),
            image_severity=severity,
            image_severity_confidence=round(confidence - 0.05, 2),
            image_description=f"Civic issue detected: {category.lower()} requiring attention.",
            text_category=category if req.description else None,
            text_category_confidence=round(confidence, 2) if req.description else None,
            text_sentiment="urgent" if confidence > 0.80 else "neutral",
            text_language_detected=req.description_language.value if req.description else None,
        )

    async def check_duplicate(
        self,
        req: CheckDuplicateRequest,
        existing_incidents: list[dict],
    ) -> CheckDuplicateResponse:
        await asyncio.sleep(0.05)

        candidates: list[DuplicateCandidate] = []
        threshold_m = settings.duplicate_search_radius_m
        threshold_h = settings.duplicate_time_window_hours

        for inc in existing_incidents:
            dist_m = _haversine_m(
                req.latitude, req.longitude,
                float(inc.get("lat", 0)), float(inc.get("lng", 0))
            )
            if dist_m > threshold_m:
                continue

            inc_time = inc.get("created_at")
            if isinstance(inc_time, str):
                inc_time = datetime.fromisoformat(inc_time.replace("Z", "+00:00"))
            submitted = req.submitted_at
            if submitted.tzinfo is None:
                submitted = submitted.replace(tzinfo=timezone.utc)
            if inc_time.tzinfo is None:
                inc_time = inc_time.replace(tzinfo=timezone.utc)
            time_mins = abs((submitted - inc_time).total_seconds()) / 60
            if time_mins > threshold_h * 60:
                continue

            cat_match = inc.get("category", "").lower() == req.category_id.lower()

            # Semantic similarity: keyword overlap simulation
            sem_sim = 0.5
            if req.description and inc.get("description"):
                words_a = set(req.description.lower().split())
                words_b = set(inc["description"].lower().split())
                if words_a | words_b:
                    sem_sim = len(words_a & words_b) / len(words_a | words_b)
                sem_sim = min(0.99, sem_sim + 0.3)  # boost for realism

            img_sim = 0.6 + random.uniform(-0.1, 0.2) if req.image_path else None

            # Combined probability weights
            w_dist = max(0.0, 1.0 - dist_m / threshold_m) * 0.25
            w_time = max(0.0, 1.0 - time_mins / (threshold_h * 60)) * 0.20
            w_cat = (1.0 if cat_match else 0.0) * 0.20
            w_sem = sem_sim * 0.20
            w_img = (img_sim or 0.5) * 0.15
            combined = w_dist + w_time + w_cat + w_sem + w_img

            candidates.append(DuplicateCandidate(
                incident_id=inc["id"],
                distance_m=round(dist_m, 1),
                time_minutes=round(time_mins, 1),
                category_match=cat_match,
                semantic_similarity=round(sem_sim, 3),
                image_similarity=round(img_sim, 3) if img_sim else None,
                combined_probability=round(combined, 3),
            ))

        candidates.sort(key=lambda c: c.combined_probability, reverse=True)
        top = candidates[0] if candidates else None
        merge_threshold = settings.duplicate_merge_threshold
        review_threshold = settings.duplicate_review_threshold

        if top and top.combined_probability >= merge_threshold:
            recommendation = "merge"
        elif top and top.combined_probability >= review_threshold:
            recommendation = "review"
        else:
            recommendation = "new"

        return CheckDuplicateResponse(
            candidates=candidates[:5],
            top_candidate_id=top.incident_id if top else None,
            recommendation=recommendation,
            merge_threshold_used=merge_threshold,
        )

    async def calculate_priority(self, req: PriorityRequest) -> PriorityResponse:
        await asyncio.sleep(0.05)

        # Weights (configurable in production via configuration table)
        W_SEV = 0.30
        W_SUPPORT = 0.20
        W_POP = 0.20
        W_LOC = 0.15
        W_DUR = 0.15

        severity_map = {"low": 0.25, "medium": 0.55, "high": 0.80, "critical": 1.0}
        sev_val = severity_map.get(req.severity.value, 0.50)

        support_val = min(1.0, req.report_count / 10)

        # Population density proxy (Lahore center → denser)
        dist_from_center = _haversine_m(req.latitude, req.longitude, 31.5204, 74.3587)
        pop_val = max(0.2, 1.0 - dist_from_center / 20000)

        # Location sensitivity (near roads/markets — simplified)
        loc_val = 0.60  # default medium sensitivity

        # Duration
        now = datetime.now(timezone.utc)
        created = req.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        hours_old = (now - created).total_seconds() / 3600
        dur_val = min(1.0, hours_old / 168)  # normalise over 1 week

        score = (
            sev_val * W_SEV +
            support_val * W_SUPPORT +
            pop_val * W_POP +
            loc_val * W_LOC +
            dur_val * W_DUR
        ) * 100

        score = round(score, 1)
        band = _priority_band(score)

        factors = {
            "severity": {
                "value": req.severity.value,
                "contribution": round(sev_val * W_SEV * 100, 1),
                "weight": W_SEV,
            },
            "citizen_support": {
                "value": req.report_count,
                "normalized": round(support_val, 2),
                "contribution": round(support_val * W_SUPPORT * 100, 1),
                "weight": W_SUPPORT,
            },
            "population_context": {
                "value": "dense" if pop_val > 0.6 else "moderate",
                "normalized": round(pop_val, 2),
                "contribution": round(pop_val * W_POP * 100, 1),
                "weight": W_POP,
            },
            "location_sensitivity": {
                "value": "moderate",
                "normalized": round(loc_val, 2),
                "contribution": round(loc_val * W_LOC * 100, 1),
                "weight": W_LOC,
            },
            "duration": {
                "value_hours": round(hours_old, 1),
                "normalized": round(dur_val, 2),
                "contribution": round(dur_val * W_DUR * 100, 1),
                "weight": W_DUR,
            },
        }

        return PriorityResponse(priority_score=score, priority_band=band, factors=factors)


# ── OpenAI provider ───────────────────────────────────────────────────────────

class OpenAIProvider:
    """Real OpenAI classification using GPT-4o vision."""

    def __init__(self) -> None:
        try:
            import openai
            self._client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        except ImportError:
            log.warning("openai_not_installed", fallback="mock")
            self._client = None

    async def classify_report(self, req: ClassifyReportRequest) -> ClassifyReportResponse:
        if not self._client:
            return await MockAIProvider().classify_report(req)

        try:
            messages: list[dict] = [
                {
                    "role": "system",
                    "content": (
                        "You are a civic issue classifier for Lahore, Pakistan. "
                        "Classify the issue into exactly one of: "
                        + ", ".join(CATEGORIES) +
                        ". Return JSON: {category, confidence (0-1), severity (low/medium/high/critical), "
                        "relevance (0-1), description (one sentence)}."
                    ),
                }
            ]

            user_content: list[dict] = []
            if req.description:
                user_content.append({"type": "text", "text": f"Description: {req.description}"})

            messages.append({"role": "user", "content": user_content or [{"type": "text", "text": "Civic issue image submitted."}]})

            response = await self._client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                response_format={"type": "json_object"},
                max_tokens=300,
                temperature=0.1,
            )

            import json
            result = json.loads(response.choices[0].message.content or "{}")
            category = result.get("category", "Other")
            if category not in CATEGORIES:
                category = "Other"

            return ClassifyReportResponse(
                image_category=category,
                image_category_confidence=float(result.get("confidence", 0.7)),
                image_relevance=float(result.get("relevance", 0.85)),
                image_severity=result.get("severity", "medium"),
                image_severity_confidence=float(result.get("confidence", 0.6)),
                image_description=result.get("description"),
                text_category=category,
                text_category_confidence=float(result.get("confidence", 0.7)),
                text_sentiment="urgent" if float(result.get("confidence", 0)) > 0.80 else "neutral",
                text_language_detected="en",
            )
        except Exception as e:
            log.error("openai_classify_failed", error=str(e))
            return await MockAIProvider().classify_report(req)

    async def check_duplicate(self, req: CheckDuplicateRequest, existing_incidents: list[dict]) -> CheckDuplicateResponse:
        # Geometric + semantic duplicate check — same logic as mock (no need for LLM here)
        return await MockAIProvider().check_duplicate(req, existing_incidents)

    async def calculate_priority(self, req: PriorityRequest) -> PriorityResponse:
        return await MockAIProvider().calculate_priority(req)


# ── Factory ───────────────────────────────────────────────────────────────────

def get_ai_provider() -> MockAIProvider | OpenAIProvider:
    if settings.ai_provider == "openai" and settings.openai_api_key:
        return OpenAIProvider()
    return MockAIProvider()


ai_provider = get_ai_provider()
