"""
Operation 2: check_duplicate
Detects whether a new report describes an already-reported incident.
Signals (weighted): distance 25%, time 20%, category 20%, semantic 20%, image 15%.
"""
from __future__ import annotations
from typing import Optional, Callable
from datetime import datetime, timezone

from ..config import settings
from ..models.schemas import CheckDuplicateRequest, CheckDuplicateResponse, DuplicateCandidate
from .utils import haversine_m


def build_duplicate_response(
    req: CheckDuplicateRequest,
    existing_incidents: list[dict],
    semantic_fn: Optional[Callable[[str, str], float]] = None,
    image_fn: Optional[Callable[[str, str], Optional[float]]] = None,
) -> CheckDuplicateResponse:
    R_M = settings.duplicate_search_radius_m
    R_H = settings.duplicate_time_window_hours
    candidates: list[DuplicateCandidate] = []

    for inc in existing_incidents:
        dist_m = haversine_m(req.latitude, req.longitude, float(inc.get("lat", 0)), float(inc.get("lng", 0)))
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
