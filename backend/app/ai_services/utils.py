"""
Shared pure utility functions used by all AI providers.
"""
from __future__ import annotations

import json
import math
from datetime import datetime, timezone

from ..models.schemas import PriorityBandEnum


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

SEVERITY_KEYWORDS: dict[str, list[str]] = {
    "critical": ["explosion", "fire", "collapse", "emergency", "danger", "accident", "flood", "burst"],
    "high":     ["overflow", "broken", "sewage", "blocked", "damage", "unsafe", "hazard", "leak"],
    "medium":   ["pothole", "garbage", "light", "crack", "encroach", "smell"],
    "low":      ["minor", "small", "slight", "cosmetic", "faded"],
}


def score_category(text: str) -> tuple[str, float]:
    tl = text.lower()
    scores = {cat: sum(1 for kw in kws if kw in tl) for cat, kws in CATEGORY_KEYWORDS.items()}
    best = max(scores, key=lambda c: scores[c])
    total = sum(scores.values()) or 1
    conf = min(0.92, max(0.42, scores[best] / total + 0.30))
    return (best if scores[best] > 0 else "Other", conf)


def score_severity(text: str) -> tuple[str, float]:
    tl = text.lower()
    for level in ("critical", "high", "medium", "low"):
        if any(kw in tl for kw in SEVERITY_KEYWORDS[level]):
            return level, 0.75
    return "medium", 0.55


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def priority_band(score: float) -> PriorityBandEnum:
    if score >= 76: return PriorityBandEnum.CRITICAL
    if score >= 51: return PriorityBandEnum.HIGH
    if score >= 26: return PriorityBandEnum.MEDIUM
    return PriorityBandEnum.LOW


def priority_factors(severity: str, report_count: int, latitude: float, longitude: float, created_at: datetime):
    W = {"sev": 0.30, "sup": 0.20, "pop": 0.20, "loc": 0.15, "dur": 0.15}
    sev_val     = {"low": 0.25, "medium": 0.55, "high": 0.80, "critical": 1.0}.get(severity, 0.55)
    support_val = min(1.0, report_count / 10)
    dist        = haversine_m(latitude, longitude, 31.5204, 74.3587)
    pop_val     = max(0.2, 1.0 - dist / 25_000)
    loc_val     = 0.65

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
        "severity":            {"value": severity,       "normalized": sev_val,              "contribution": round(sev_val * W["sev"] * 100, 1),      "weight": W["sev"]},
        "citizen_support":     {"value": report_count,   "normalized": round(support_val, 2), "contribution": round(support_val * W["sup"] * 100, 1), "weight": W["sup"]},
        "population_context":  {"value": "dense" if pop_val > 0.6 else "moderate", "normalized": round(pop_val, 2), "contribution": round(pop_val * W["pop"] * 100, 1), "weight": W["pop"]},
        "location_sensitivity":{"value": "moderate",     "normalized": loc_val,              "contribution": round(loc_val * W["loc"] * 100, 1),      "weight": W["loc"]},
        "duration":            {"value_hours": round(hours_old, 1), "normalized": round(dur_val, 2), "contribution": round(dur_val * W["dur"] * 100, 1), "weight": W["dur"]},
    }
    return score, priority_band(score), factors


def parse_llm_json(text: str) -> dict:
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
