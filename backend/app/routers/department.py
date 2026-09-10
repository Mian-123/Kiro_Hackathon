"""
Department operational endpoints — queue, status update, resolution submission.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
import structlog

from ..core.auth import require_roles, CurrentUser
from ..models.enums import RoleEnum, StatusEnum
from ..models.schemas import (
    ApiResponse, IncidentOut, IncidentPatch,
    ResolutionCreateResponse, PaginatedData, CategoryOut,
    TimelineEntry, ResolutionOut,
)
from ..services import mock_db as db
from .incidents import _build_incident_out, VALID_TRANSITIONS

log = structlog.get_logger()
router = APIRouter(prefix="/department", tags=["department"])


@router.get("/incidents", response_model=ApiResponse[PaginatedData[IncidentOut]])
async def get_department_incidents(
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = Query(None, alias="status"),
    user: CurrentUser = Depends(require_roles(RoleEnum.department)),
):
    if not user.department_id:
        raise HTTPException(403, detail={"code": "DEPARTMENT_NOT_ASSIGNED", "message": "No department assigned"})

    all_incs = db.get_incidents()
    dept_incs = [i for i in all_incs if i.get("assigned_department_id") == user.department_id]
    if status_filter:
        dept_incs = [i for i in dept_incs if i["status"].value == status_filter]

    dept_incs.sort(key=lambda i: i.get("priority_score") or 0, reverse=True)
    total = len(dept_incs)
    start = (page - 1) * page_size
    items = dept_incs[start: start + page_size]

    return ApiResponse.ok(PaginatedData(
        items=[_build_incident_out(i, user, include_ai=True) for i in items],
        total=total, page=page, page_size=page_size,
        has_next=(start + page_size) < total,
    ))


@router.patch("/incidents/{incident_id}", response_model=ApiResponse[IncidentOut])
async def update_dept_incident(
    incident_id: str,
    body: IncidentPatch,
    user: CurrentUser = Depends(require_roles(RoleEnum.department)),
):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Incident not found"})
    if inc.get("assigned_department_id") != user.department_id:
        raise HTTPException(403, detail={"code": "DEPARTMENT_MISMATCH", "message": "Not your department's incident"})

    if body.status:
        current = inc["status"]
        allowed = VALID_TRANSITIONS.get(current, [])
        if body.status not in allowed:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "INVALID_STATUS_TRANSITION", "message": f"{current} → {body.status} not allowed"},
            )
        db.update_incident_status(incident_id, body.status)
        inc.get("timeline", []).append({
            "status": body.status,
            "occurred_at": datetime.now(timezone.utc),
            "label": f"Department: {body.status.value}",
        })

    log.info("dept_incident_patched", incident_id=incident_id, user=user.user_id)
    return ApiResponse.ok(_build_incident_out(inc, user, include_ai=True))


@router.post("/incidents/{incident_id}/resolution", response_model=ApiResponse[ResolutionCreateResponse], status_code=201)
async def submit_resolution(
    incident_id: str,
    resolution_description: str = Form(..., min_length=20),
    resolution_image: Optional[UploadFile] = File(None),
    user: CurrentUser = Depends(require_roles(RoleEnum.department)),
):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Incident not found"})
    if inc.get("assigned_department_id") != user.department_id:
        raise HTTPException(403, detail={"code": "DEPARTMENT_MISMATCH", "message": "Not your department"})
    if inc["status"] not in (StatusEnum.IN_PROGRESS, StatusEnum.REOPENED):
        raise HTTPException(409, detail={"code": "CONFLICT", "message": "Incident must be IN_PROGRESS or REOPENED to submit resolution"})

    if not resolution_image:
        raise HTTPException(422, detail={"code": "RESOLUTION_IMAGE_REQUIRED", "message": "Resolution photo is required"})

    content_type = resolution_image.content_type or ""
    if content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(422, detail={"code": "VALIDATION_ERROR", "message": "Invalid image format"})

    import uuid
    resolution_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    inc["resolution_description"] = resolution_description
    inc["resolution_image_path"] = f"resolutions/{incident_id}/{resolution_id}.jpg"

    db.update_incident_status(incident_id, StatusEnum.RESOLUTION_SUBMITTED)
    inc.get("timeline", []).append({
        "status": StatusEnum.RESOLUTION_SUBMITTED,
        "occurred_at": now,
        "label": "Department submitted resolution evidence",
    })
    db.update_incident_status(incident_id, StatusEnum.AWAITING_CITIZEN_VERIFICATION)
    inc.get("timeline", []).append({
        "status": StatusEnum.AWAITING_CITIZEN_VERIFICATION,
        "occurred_at": now,
        "label": "Awaiting citizen verification",
    })

    log.info("resolution_submitted", incident_id=incident_id, dept=user.department_id)

    return ApiResponse.ok(ResolutionCreateResponse(
        resolution_id=resolution_id,
        incident_id=incident_id,
        status=StatusEnum.AWAITING_CITIZEN_VERIFICATION,
        submitted_at=now,
    ))
