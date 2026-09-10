"""
Incident endpoints — public read, department update, citizen verification.
"""
from __future__ import annotations
import math
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
import structlog

from ..core.auth import get_current_user, require_roles, CurrentUser
from ..models.enums import RoleEnum, StatusEnum
from ..models.schemas import (
    ApiResponse, IncidentOut, IncidentPatch, CategoryOut,
    TimelineEntry, ResolutionOut, AIDetails, DuplicateSignals,
    PriorityExplanation, PriorityExplanationFactor,
    VerifyResolutionRequest, VerifyResolutionResponse,
    PaginatedData,
)
from ..services import mock_db as db

log = structlog.get_logger()
router = APIRouter(prefix="/incidents", tags=["incidents"])

# ── Valid status transitions ──────────────────────────────────────────────────
VALID_TRANSITIONS: dict[StatusEnum, list[StatusEnum]] = {
    StatusEnum.ASSIGNED:                      [StatusEnum.IN_PROGRESS],
    StatusEnum.IN_PROGRESS:                   [StatusEnum.RESOLUTION_SUBMITTED],
    StatusEnum.RESOLUTION_SUBMITTED:          [StatusEnum.AWAITING_CITIZEN_VERIFICATION],
    StatusEnum.AWAITING_CITIZEN_VERIFICATION: [StatusEnum.RESOLVED, StatusEnum.REOPENED],
    StatusEnum.REOPENED:                      [StatusEnum.IN_PROGRESS],
}


def _build_incident_out(inc: dict, user: CurrentUser, include_ai: bool = False) -> IncidentOut:
    cat = next((c for c in db.get_categories() if c["id"] == inc.get("category_id")), None)
    cat_out = CategoryOut(id=cat["id"], name=cat["name"], icon=cat["icon"]) if cat else None

    timeline = [
        TimelineEntry(
            status=t["status"],
            occurred_at=t["occurred_at"],
            label=t["label"],
        )
        for t in inc.get("timeline", [])
    ]

    resolution = None
    if inc.get("resolution_description"):
        resolution = ResolutionOut(description=inc["resolution_description"])

    # Priority explanation mock
    prio_explanation = None
    if inc.get("priority_score") is not None:
        score = float(inc["priority_score"])
        prio_explanation = PriorityExplanation(
            priority_score=score,
            priority_band=inc["priority_band"],
            factors={
                "severity":          PriorityExplanationFactor(value=inc.get("severity", "medium"), contribution=score * 0.30, weight=0.30),
                "citizen_support":   PriorityExplanationFactor(value=inc.get("report_count", 1),   contribution=score * 0.20, weight=0.20),
                "population_context":PriorityExplanationFactor(value="dense",                       contribution=score * 0.20, weight=0.20),
                "location_sensitivity":PriorityExplanationFactor(value="moderate",                  contribution=score * 0.15, weight=0.15),
                "duration":          PriorityExplanationFactor(value="3 days",                      contribution=score * 0.15, weight=0.15),
            },
        )

    ai_details = None
    if include_ai:
        ai_details = AIDetails(
            image_category=cat_out.name if cat_out else None,
            image_category_confidence=0.87,
            image_severity=inc.get("severity", "medium") if inc.get("severity") else "medium",
            image_severity_confidence=0.75,
            image_relevance=0.92,
        )

    return IncidentOut(
        id=inc["id"],
        short_code=inc["short_code"],
        status=inc["status"],
        category=cat_out,
        severity=inc.get("severity"),
        priority_score=inc.get("priority_score"),
        priority_band=inc.get("priority_band"),
        priority_explanation=prio_explanation,
        latitude=inc["lat"],
        longitude=inc["lng"],
        area_label=inc.get("area_label"),
        report_count=inc.get("report_count", 1),
        assigned_department_name=inc.get("assigned_department_name"),
        ai_summary=inc.get("ai_summary"),
        created_at=inc["created_at"],
        updated_at=inc["updated_at"],
        timeline=timeline,
        resolution=resolution,
        verification_state=None,
        can_verify=(
            user.role == RoleEnum.citizen
            and inc["status"] == StatusEnum.AWAITING_CITIZEN_VERIFICATION
        ),
        ai_details=ai_details,
    )


@router.get("", response_model=ApiResponse[PaginatedData[IncidentOut]])
async def list_incidents(
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = Query(None, alias="status"),
    category_id: Optional[str] = None,
    severity: Optional[str] = None,
    user: CurrentUser = Depends(get_current_user),
):
    incs = db.get_incidents(status_filter=status_filter)
    if category_id:
        incs = [i for i in incs if i.get("category_id") == category_id]
    if severity:
        incs = [i for i in incs if i.get("severity") and i["severity"].value == severity]

    total = len(incs)
    start = (page - 1) * page_size
    page_items = incs[start: start + page_size]

    return ApiResponse.ok(PaginatedData(
        items=[_build_incident_out(i, user) for i in page_items],
        total=total, page=page, page_size=page_size,
        has_next=(start + page_size) < total,
    ))


@router.get("/nearby", response_model=ApiResponse[List[IncidentOut]])
async def get_nearby_incidents(
    lat: float,
    lng: float,
    radius_m: float = 1000,
    user: CurrentUser = Depends(get_current_user),
):
    def _dist(inc: dict) -> float:
        R = 6_371_000
        phi1, phi2 = math.radians(lat), math.radians(float(inc["lat"]))
        dphi = math.radians(float(inc["lat"]) - lat)
        dlam = math.radians(float(inc["lng"]) - lng)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    nearby = [i for i in db.get_incidents() if _dist(i) <= radius_m]
    return ApiResponse.ok([_build_incident_out(i, user) for i in nearby[:20]])


@router.get("/{incident_id}", response_model=ApiResponse[IncidentOut])
async def get_incident(
    incident_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Incident not found"})
    include_ai = user.role in (RoleEnum.department, RoleEnum.admin, RoleEnum.street_rep)
    return ApiResponse.ok(_build_incident_out(inc, user, include_ai=include_ai))


@router.patch("/{incident_id}", response_model=ApiResponse[IncidentOut])
async def patch_incident(
    incident_id: str,
    body: IncidentPatch,
    user: CurrentUser = Depends(require_roles(RoleEnum.department, RoleEnum.admin)),
):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Incident not found"})

    # Department can only touch their own assigned incidents
    if user.role == RoleEnum.department:
        if inc.get("assigned_department_id") != user.department_id:
            raise HTTPException(403, detail={"code": "DEPARTMENT_MISMATCH", "message": "Not your department's incident"})

    if body.status:
        current = inc["status"]
        allowed = VALID_TRANSITIONS.get(current, [])
        if body.status not in allowed:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "INVALID_STATUS_TRANSITION", "message": f"Cannot transition from {current} to {body.status}"},
            )
        db.update_incident_status(incident_id, body.status)
        # Add timeline entry
        inc.get("timeline", []).append({
            "status": body.status,
            "occurred_at": datetime.now(timezone.utc),
            "label": f"Status updated to {body.status.value}",
        })

    return ApiResponse.ok(_build_incident_out(inc, user))


@router.get("/{incident_id}/audit", response_model=ApiResponse[list])
async def get_incident_audit(
    incident_id: str,
    user: CurrentUser = Depends(require_roles(RoleEnum.department, RoleEnum.admin, RoleEnum.street_rep)),
):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Incident not found"})
    timeline = [
        {
            "event_type": "INCIDENT_STATUS_CHANGED",
            "occurred_at": t["occurred_at"].isoformat(),
            "actor_role": "system",
            "summary": t["label"],
        }
        for t in inc.get("timeline", [])
    ]
    return ApiResponse.ok(timeline)


@router.post("/{incident_id}/verify-resolution", response_model=ApiResponse[VerifyResolutionResponse])
async def verify_resolution(
    incident_id: str,
    body: VerifyResolutionRequest,
    user: CurrentUser = Depends(require_roles(RoleEnum.citizen)),
):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Incident not found"})
    if inc["status"] != StatusEnum.AWAITING_CITIZEN_VERIFICATION:
        raise HTTPException(409, detail={"code": "CONFLICT", "message": "Incident is not awaiting verification"})
    if body.outcome not in ("confirmed", "rejected"):
        raise HTTPException(422, detail={"code": "VALIDATION_ERROR", "message": "outcome must be confirmed or rejected"})

    new_status = StatusEnum.RESOLVED if body.outcome == "confirmed" else StatusEnum.REOPENED
    db.update_incident_status(incident_id, new_status)

    now = datetime.now(timezone.utc)
    inc.get("timeline", []).append({
        "status": new_status,
        "occurred_at": now,
        "label": "Citizen confirmed resolution" if body.outcome == "confirmed" else f"Citizen rejected: {body.rejection_reason or 'no reason given'}",
    })

    log.info("verification", incident_id=incident_id, outcome=body.outcome, citizen=user.user_id)

    return ApiResponse.ok(VerifyResolutionResponse(
        incident_id=incident_id,
        outcome=body.outcome,
        incident_status=new_status,
        verified_at=now,
    ))
