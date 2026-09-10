"""
AI Service Adapter — CivicPulse Lahore
=======================================
Providers:
  mock  — deterministic keyword rules, no external calls, always works
  local — sentence-transformers (offline) for semantic dedup, keyword classify
  groq  — Groq API: Llama 4 Scout vision + Llama 3.3 70B text (best accuracy)

Operations
----------
1. classify_report
   What civic issue is this?
   Input:  citizen description text + optional photo (base64)
   Output: category, severity, confidence, relevance, description
   Groq model: meta-llama/llama-4-scout-17b-16e-instruct (vision+text)

2. check_duplicate
   Is this already reported nearby?
   Input:  GPS coords, category, description, optional image path, timestamp
   Output: candidates list with similarity scores, recommendation merge|review|new
   Method: haversine distance + sentence-transformers semantic sim + imagehash

3. calculate_priority
   How urgent is this? (score 0-100, band LOW/MEDIUM/HIGH/CRITICAL)
   Input:  severity, report count, GPS coords, created timestamp
   Output: priority score, band, 5-factor breakdown + Groq reasoning text
   Groq model: llama-3.3-70b-versatile

All AI runs as FastAPI BackgroundTask — report submission never blocks on AI.
Groq errors fall back to MockAIProvider so reports always succeed.
"""
from __future__ import annotations

import asyncio
import base64
import hashlib
import json
import math
from datetime import datetime, timezone
from typing import Optional

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

# ── Taxonomy ──────────────────────────────────────────────────────────────────

CATEGORIES = [
    "Broken Road", "Garbage / Waste", "Sewerage / Water", "Streetlight",
    "Encroachment", "Flooding / Standing Water", "Safety Hazard",
    "Drainage", "Infrastructure", "Other",
]

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Sewerage / Water":          ["sewage", "sewer", "water", "overflow", "leak", "pipe", "blockage", "wasa"],
    "Broken Road":               ["pothole", "road", "crack", "asphalt", "pavement", "broken", "damage"],
    "Garbage / Waste":           ["garbage", "trash", "waste", "rubbish", "litter", "dump", "bin", "smell"],
    "Streetlight":               ["light", "streetlight", "lamp", "dark", "bulb", "pole", "lesco"],
    "Flooding / Standing Water": ["flood", "standing water", "waterlogged", "rain", "puddle"],
    "Encroachment":              ["encroach", "block", "illegal", "construction", "footpath"],
    "Safety Hazard":             ["hazard", "danger", "unsafe", "risk", "wire", "fire", "accident"],
    "Drainage":                  ["drain", "drainage", "gutter", "channel", "nullah"],
    "Infrastructure":            ["building", "wall", "bridge", "structure", "collapse"],
}

SEVERITY_KEYWORDS = {
    "critical": ["explosion", "fire", "collapse", "emergency", "danger", "accident", "flood", "burst"],
    "high":     ["overflow", "broken", "sewage", "blocked", "damage", "unsafe", "hazard", "leak"],
    "medium":   ["pothole", "garbage", "light", "crack", "encroach", "smell"],
    "low":      ["minor", "small", "slight", "cosmetic", "faded"],
}

CLASSIFY_SYSTEM = """You are an expert civic issue classifier for Lahore, Pakistan.
Analyse the citizen report (text and/or image) and respond ONLY with valid JSON — no markdown, no extra text.

Valid categories (pick exactly one):
Broken Road | Garbage / Waste | Sewerage / Water | Streetlight | Encroachment |
Flooding / Standing Water | Safety Hazard | Drainage | Infrastructure | Other

Severity: low | medium | high | critical

Required JSON format:
{
  "category": "<category>",
  "confidence": <0.0-1.0>,
  "severity": "<severity>",
  "severity_confidence": <0.0-1.0>,
  "relevance": <0.0-1.0>,
  "description": "<one sentence summary of the civic issue in English>"
}"""

PRIORITY_SYSTEM = """You are a civic operations analyst for Lahore, Pakistan.
Given an incident summary, return ONLY valid JSON — no markdown, no extra text.

{
  "priority_score": <integer 0-100>,
  "priority_band": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "reasoning": "<2 sentences explaining this priority level>"
}

Scoring: >=76 CRITICAL, 51-75 HIGH, 26-50 MEDIUM, 0-25 LOW"""


# ── Shared pure helpers ───────────────────────────────────────────────────────

def _score_category(text: str) -> tuple[str, float]:
    tl = text.lower()
    scores = {cat: sum(1 for kw in kws if kw in tl) for cat, kws in CATEGORY_KEYWORDS.items()}
    best = max(scores, key=lambda c: scores[c])
    total = sum(scores.values()) or 1
    conf = min(0.92, max(0.42, scores[best] / total + 0.30))
    return (best if scores[best] > 0 else "Other", conf)


def _score_severity(text: str) -> tuple[str, float]:
    tl = text.lower()
    for level in ("critical", "high", "medium", "low"):
        if any(kw in tl for kw in SEVERITY_KEYWORDS[level]):
            return level, 0.75
    return "medium", 0.55


def _priority_band(score: float) -> PriorityBandEnum:
    if score >= 76: return PriorityBandEnum.CRITICAL
    if score >= 51: return PriorityBandEnum.HIGH
    if score >= 26: return PriorityBandEnum.MEDIUM
    return PriorityBandEnum.LOW


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _parse_json(text: str) -> dict:
    """Strip markdown code fences and parse JSON from LLM response."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        inner = []
        for line in lines[1:]:
            if line.strip() == "```":
                break
            inner.append(line)
        text = "\n".join(inner)
    return json.loads(text)


def _priority_factors(
    severity: str,
    report_count: int,
    latitude: float,
    longitude: float,
    created_at: datetime,
) -> tuple[float, PriorityBandEnum, dict]:
    """Deterministic 5-factor weighted priority formula used by all providers."""
    W = {"sev": 0.30, "sup": 0.20, "pop": 0.20, "loc": 0.15, "dur": 0.15}
    sev_val     = {"low": 0.25, "medium": 0.55, "high": 0.80, "critical": 1.0}.get(severity, 0.55)
    support_val = min(1.0, report_count / 10)
    dist        = _haversine_m(latitude, longitude, 31.5204, 74.3587)
    pop_val     = max(0.2, 1.0 - dist / 25_000)
    loc_val     = 0.65  # moderate sensitivity default

    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    hours_old = (now - created_at).total_seconds() / 3600
    dur_val   = min(1.0, hours_old / 168)

    score = round((
        sev_val * W["sev"] + support_val * W["sup"] +
        pop_val * W["pop"] + loc_val * W["loc"] + dur_val * W["dur"]
    ) * 100, 1)

    factors = {
        "severity":            {"value": severity,       "normalized": sev_val,              "contribution": round(sev_val * W["sev"] * 100, 1),       "weight": W["sev"]},
        "citizen_support":     {"value": report_count,   "normalized": round(support_val, 2), "contribution": round(support_val * W["sup"] * 100, 1),  "weight": W["sup"]},
        "population_context":  {"value": "dense" if pop_val > 0.6 else "moderate", "normalized": round(pop_val, 2), "contribution": round(pop_val * W["pop"] * 100, 1), "weight": W["pop"]},
        "location_sensitivity":{"value": "moderate",     "normalized": loc_val,              "contribution": round(loc_val * W["loc"] * 100, 1),       "weight": W["loc"]},
        "duration":            {"value_hours": round(hours_old, 1), "normalized": round(dur_val, 2), "contribution": round(dur_val * W["dur"] * 100, 1), "weight": W["dur"]},
    }
    return score, _priority_band(score), factors


def _build_dup_response(
    req: CheckDuplicateRequest,
    existing: list[dict],
    semantic_fn=None,
    image_fn=None,
) -> CheckDuplicateResponse:
    """Core duplicate detection logic shared by all providers."""
    R_M = settings.duplicate_search_radius_m
    R_H = settings.duplicate_time_window_hours
    candidates: list[DuplicateCandidate] = []

    for inc in existing:
        dist_m = _haversine_m(
            req.latitude, req.longitude,
            float(inc.get("lat", 0)), float(inc.get("lng", 0)),
        )
        if dist_m > R_M:
            continue

        inc_time = inc.get("created_at")
        if isinstance(inc_time, str):
            inc_time = datetime.fromisoformat(inc_time.replace("Z", "+00:00"))
        sub = req.submitted_at
        if sub.tzinfo is None:
            sub = sub.replace(tzinfo=timezone.utc)
        if inc_time.tzinfo is None:
            inc_time = inc_time.replace(tzinfo=timezone.utc)
        time_mins = abs((sub - inc_time).total_seconds()) / 60
        if time_mins > R_H * 60:
            continue

        cat_match = inc.get("category", "").lower() == req.category_id.lower()

        if semantic_fn and req.description and inc.get("description"):
            sem_sim = semantic_fn(req.description, inc["description"])
        elif req.description and inc.get("description"):
            wa = set(req.description.lower().split())
            wb = set(inc["description"].lower().split())
            u  = wa | wb
            sem_sim = min(0.99, len(wa & wb) / len(u) + 0.30) if u else 0.5
        else:
            sem_sim = 0.5

        img_sim: Optional[float] = None
        if image_fn and req.image_path and inc.get("image_path"):
            img_sim = image_fn(req.image_path, inc["image_path"])

        combined = (
            max(0.0, 1.0 - dist_m / R_M) * 0.25 +
            max(0.0, 1.0 - time_mins / (R_H * 60)) * 0.20 +
            (1.0 if cat_match else 0.0) * 0.20 +
            sem_sim * 0.20 +
            (img_sim if img_sim is not None else 0.5) * 0.15
        )

        candidates.append(DuplicateCandidate(
            incident_id=inc["id"],
            distance_m=round(dist_m, 1),
            time_minutes=round(time_mins, 1),
            category_match=cat_match,
            semantic_similarity=round(sem_sim, 3),
            image_similarity=round(img_sim, 3) if img_sim is not None else None,
            combined_probability=round(combined, 3),
        ))

    candidates.sort(key=lambda c: c.combined_probability, reverse=True)
    top = candidates[0] if candidates else None
    rec = (
        "merge"  if top and top.combined_probability >= settings.duplicate_merge_threshold else
        "review" if top and top.combined_probability >= settings.duplicate_review_threshold else
        "new"
    )
    return CheckDuplicateResponse(
        candidates=candidates[:5],
        top_candidate_id=top.incident_id if top else None,
        recommendation=rec,
        merge_threshold_used=settings.duplicate_merge_threshold,
    )


# ── Provider 1: Mock ──────────────────────────────────────────────────────────

class MockAIProvider:
    """Deterministic keyword rules — no external calls, always works."""

    async def classify_report(self, req: ClassifyReportRequest) -> ClassifyReportResponse:
        await asyncio.sleep(0.05)
        cat, conf = "Other", 0.60
        sev, sev_conf = "medium", 0.55
        rel = 0.80
        if req.description:
            cat, conf = _score_category(req.description)
            sev, sev_conf = _score_severity(req.description)
            rel = min(0.97, conf + 0.10)
        if req.image_path:
            h = int(hashlib.md5(req.image_path.encode()).hexdigest(), 16)
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

    async def check_duplicate(self, req: CheckDuplicateRequest, existing: list[dict]) -> CheckDuplicateResponse:
        await asyncio.sleep(0.02)
        return _build_dup_response(req, existing)

    async def calculate_priority(self, req: PriorityRequest) -> PriorityResponse:
        await asyncio.sleep(0.02)
        score, band, factors = _priority_factors(
            req.severity.value, req.report_count, req.latitude, req.longitude, req.created_at)
        return PriorityResponse(priority_score=score, priority_band=band, factors=factors)


# ── Provider 2: Local ─────────────────────────────────────────────────────────

class LocalAIProvider:
    """
    Fully offline:
    - sentence-transformers all-MiniLM-L6-v2 for semantic duplicate detection
    - imagehash for perceptual image similarity
    - keyword rules for classification (no vision model)
    First run downloads ~80 MB model weights automatically.
    """

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

    def _sem_sim(self, a: str, b: str) -> float:
        emb = self._load_embedder()
        if emb is None:
            wa, wb = set(a.lower().split()), set(b.lower().split())
            u = wa | wb
            return min(0.99, len(wa & wb) / len(u) + 0.30) if u else 0.5
        import numpy as np
        vecs = emb.encode([a, b], convert_to_numpy=True)
        cos  = float(np.dot(vecs[0], vecs[1]) / (np.linalg.norm(vecs[0]) * np.linalg.norm(vecs[1]) + 1e-9))
        return min(0.99, (cos + 1) / 2 + 0.10)

    def _img_sim(self, path_a: str, path_b: str) -> Optional[float]:
        try:
            import imagehash
            from PIL import Image
            ha = imagehash.phash(Image.open(path_a))
            hb = imagehash.phash(Image.open(path_b))
            return max(0.0, 1.0 - (ha - hb) / 64)
        except Exception:
            return None

    async def classify_report(self, req: ClassifyReportRequest) -> ClassifyReportResponse:
        await asyncio.sleep(0.01)
        cat, conf = _score_category(req.description) if req.description else ("Other", 0.60)
        sev, sev_conf = _score_severity(req.description) if req.description else ("medium", 0.55)
        rel = min(0.95, conf + 0.12)
        return ClassifyReportResponse(
            image_category=cat, image_category_confidence=round(conf, 2),
            image_relevance=round(rel, 2), image_severity=sev,
            image_severity_confidence=round(sev_conf, 2),
            image_description=f"Local analysis: {cat.lower()} issue.",
            text_category=cat if req.description else None,
            text_category_confidence=round(conf, 2) if req.description else None,
            text_sentiment="urgent" if conf > 0.78 else "neutral",
            text_language_detected=req.description_language.value if req.description else None,
        )

    async def check_duplicate(self, req: CheckDuplicateRequest, existing: list[dict]) -> CheckDuplicateResponse:
        return _build_dup_response(req, existing, semantic_fn=self._sem_sim, image_fn=self._img_sim)

    async def calculate_priority(self, req: PriorityRequest) -> PriorityResponse:
        score, band, factors = _priority_factors(
            req.severity.value, req.report_count, req.latitude, req.longitude, req.created_at)
        return PriorityResponse(priority_score=score, priority_band=band, factors=factors)


# ── Provider 3: Groq ──────────────────────────────────────────────────────────

class GroqAIProvider:
    """
    Best accuracy. Uses Groq's fast inference API.

    classify_report   → meta-llama/llama-4-scout-17b-16e-instruct
                        Sends image (base64) + text → structured JSON response
    calculate_priority → llama-3.3-70b-versatile
                        Adds human-readable 2-sentence reasoning to the score
    check_duplicate   → LocalAIProvider (sentence-transformers, no API quota)

    Falls back to MockAIProvider on any Groq API error so reports never fail.
    """

    def __init__(self) -> None:
        self._client = None
        self._local  = LocalAIProvider()
        try:
            from groq import AsyncGroq
            self._client = AsyncGroq(api_key=settings.groq_api_key)
            log.info("groq_provider_ready",
                     vision=settings.groq_vision_model,
                     text=settings.groq_text_model)
        except Exception as e:
            log.warning("groq_init_failed", error=str(e), fallback="mock")

    async def classify_report(self, req: ClassifyReportRequest) -> ClassifyReportResponse:
        if not self._client:
            return await MockAIProvider().classify_report(req)
        try:
            user_parts: list[dict] = []

            if req.description:
                user_parts.append({"type": "text", "text": f"Citizen description: {req.description}"})

            if req.image_path:
                try:
                    import aiofiles
                    import filetype
                    async with aiofiles.open(req.image_path, "rb") as f:
                        raw = await f.read()
                    kind = filetype.guess(raw)
                    mime = kind.mime if kind else "image/jpeg"
                    b64  = base64.b64encode(raw).decode()
                    user_parts.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{b64}"},
                    })
                except Exception as img_err:
                    log.warning("groq_image_load_failed", error=str(img_err))

            if not user_parts:
                user_parts.append({"type": "text", "text": "Civic issue — no details provided."})

            resp = await self._client.chat.completions.create(
                model=settings.groq_vision_model,
                messages=[
                    {"role": "system", "content": CLASSIFY_SYSTEM},
                    {"role": "user",   "content": user_parts},
                ],
                temperature=0.1,
                max_tokens=350,
            )
            result = _parse_json(resp.choices[0].message.content or "{}")

            cat = result.get("category", "Other")
            if cat not in CATEGORIES:
                cat = "Other"
            conf     = float(result.get("confidence", 0.72))
            sev      = result.get("severity", "medium")
            sev_conf = float(result.get("severity_confidence", 0.65))
            rel      = float(result.get("relevance", 0.88))
            desc     = result.get("description", f"{cat} issue in Lahore.")

            log.info("groq_classified", category=cat, severity=sev,
                     confidence=conf, model=settings.groq_vision_model)

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

    async def check_duplicate(self, req: CheckDuplicateRequest, existing: list[dict]) -> CheckDuplicateResponse:
        """Local semantic similarity — accurate and uses no API quota."""
        return await self._local.check_duplicate(req, existing)

    async def calculate_priority(self, req: PriorityRequest) -> PriorityResponse:
        """Deterministic formula + Groq reasoning text (best-effort)."""
        score, band, factors = _priority_factors(
            req.severity.value, req.report_count, req.latitude, req.longitude, req.created_at)

        if self._client:
            try:
                prompt = (
                    f"Incident:\n"
                    f"- Severity: {req.severity.value}\n"
                    f"- Citizen reports: {req.report_count}\n"
                    f"- Location: {req.latitude:.4f}, {req.longitude:.4f} (Lahore, Pakistan)\n"
                    f"- Calculated priority score: {score}/100 ({band.value})\n\n"
                    f"Give a 2-sentence reasoning for this priority level."
                )
                resp = await self._client.chat.completions.create(
                    model=settings.groq_text_model,
                    messages=[
                        {"role": "system", "content": PRIORITY_SYSTEM},
                        {"role": "user",   "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=200,
                )
                result = _parse_json(resp.choices[0].message.content or "{}")
                factors["groq_reasoning"] = result.get("reasoning", "")
                log.info("groq_priority_done", score=score, band=band.value)
            except Exception as e:
                log.warning("groq_priority_reasoning_skipped", error=str(e))

        return PriorityResponse(priority_score=score, priority_band=band, factors=factors)


# ── Factory ───────────────────────────────────────────────────────────────────

def get_ai_provider() -> MockAIProvider | LocalAIProvider | GroqAIProvider:
    p = settings.ai_provider.lower()
    if p == "groq" and settings.groq_api_key:
        log.info("ai_provider_selected", provider="groq")
        return GroqAIProvider()
    if p == "local":
        log.info("ai_provider_selected", provider="local")
        return LocalAIProvider()
    log.info("ai_provider_selected", provider="mock")
    return MockAIProvider()


# Module-level singleton imported by all routers
ai_provider = get_ai_provider()
