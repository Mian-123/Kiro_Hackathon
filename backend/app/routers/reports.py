"""
Report submission, retrieval, and AI processing pipeline.
Report submission NEVER blocks on AI — AI runs as a background task.
"""
from __future__ import annotations
import asyncio
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form, Header, status
import structlog

from ..core.auth import get_current_user, require_roles, CurrentUser
from ..models.enums import RoleEnum, StatusEnum, LanguageEnum, AIStatusEnum
from ..models.schemas import (
    ApiResponse, ReportOut, CategoryOut, AISuggestion,
    ClassifyReportRequest, CheckDuplicateRequest,
    PriorityRequest, PaginatedData,
)
from ..services import mock_db as db
from ..services.ai_adapter import ai_provider

log = structlog.get_logger()

router = APIRouter(prefix="/reports", tags=["reports"])


def _report_to_out(r: dict) -> ReportOut:
    cat = next((c for c in db.get_categories() if c["id"] == r.get("category_id")), None)
    cat_out = CategoryOut(id=cat["id"], name=cat["name"], icon=cat["icon"]) if cat else None

    ai_sug = None
    if r.get("ai_category_name"):
        ai_sug = AISuggestion(name=r["ai_category_name"], confidence=r.get("ai_category_confidence", 0.0))

    return ReportOut(
        id=r["id"],
        short_code=r["short_code"],
        status=r["status"],
        category=cat_out,
        description=r.get("description"),
        description_language=LanguageEnum(r.get("description_language", "en")),
        image_url=None,  # signed URL would be generated here from storage
        latitude=r["latitude"],
        longitude=r["longitude"],
        gps_accuracy_m=r.get("gps_accuracy_m"),
        is_location_corrected=r.get("is_location_corrected", False),
        ai_status=r.get("ai_status", AIStatusEnum.PENDING),
        ai_suggested_category=ai_sug,
        incident_id=r.get("incident_id"),
        incident_short_code=None,
        submitted_at=r["submitted_at"],
    )


async def _run_ai_pipeline(report_id: str, report: dict) -> None:
    """Background task: classify → duplicate check → priority calculation."""
    try:
        # Step 1: Classify
        classify_req = ClassifyReportRequest(
            report_id=report_id,
            image_path=report.get("image_path"),
            description=report.get("description"),
            description_language=LanguageEnum(report.get("description_language", "en")),
        )
        classification = await ai_provider.classify_report(classify_req)

        ai_update = {
            "ai_category_name": classification.image_category,
            "ai_category_confidence": classification.image_category_confidence,
            "ai_relevance": classification.image_relevance,
            "ai_severity": classification.image_severity,
        }
        db.update_report_ai(report_id, ai_update)
        log.info("ai_classified", report_id=report_id, category=classification.image_category)

        # Step 2: Duplicate detection
        dup_req = CheckDuplicateRequest(
            report_id=report_id,
            latitude=report["latitude"],
            longitude=report["longitude"],
            category_id=report.get("category_id", "cat-ot"),
            description=report.get("description"),
            image_path=report.get("image_path"),
            submitted_at=report["submitted_at"],
        )
        existing = [
            {
                "id": inc["id"],
                "lat": inc["lat"],
                "lng": inc["lng"],
                "category": inc["category_name"],
                "description": inc["description"],
                "created_at": inc["created_at"].isoformat(),
            }
            for inc in db.get_incidents()
            if inc["status"] not in (StatusEnum.RESOLVED, StatusEnum.MERGED, StatusEnum.REJECTED)
        ]
        dup_result = await ai_provider.check_duplicate(dup_req, existing)
        log.info("dup_check", report_id=report_id, recommendation=dup_result.recommendation)

        # Step 3: Link to incident or create new
        if dup_result.recommendation == "merge" and dup_result.top_candidate_id:
            db.update_report_incident(report_id, dup_result.top_candidate_id)
            log.info("report_merged", report_id=report_id, incident_id=dup_result.top_candidate_id)
        else:
            # Priority calculation for new/review incident
            incident = db.get_incident(dup_result.top_candidate_id or "") if dup_result.top_candidate_id else None
            if not incident:
                prio_req = PriorityRequest(
                    incident_id=report_id,
                    severity=classification.image_severity or "medium",  # type: ignore
                    report_count=1,
                    latitude=report["latitude"],
                    longitude=report["longitude"],
                    created_at=report["submitted_at"],
                )
                await ai_provider.calculate_priority(prio_req)

    except Exception as e:
        log.error("ai_pipeline_failed", report_id=report_id, error=str(e))
        db.update_report_ai(report_id, {"ai_status": AIStatusEnum.FAILED})


@router.post("", response_model=ApiResponse[ReportOut], status_code=201)
async def submit_report(
    background_tasks: BackgroundTasks,
    category_id: str = Form(...),
    description: Optional[str] = Form(None),
    description_language: str = Form("en"),
    latitude: float = Form(...),
    longitude: float = Form(...),
    gps_accuracy_m: Optional[float] = Form(None),
    is_location_corrected: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    x_idempotency_key: Optional[str] = Header(default=None),
    user: CurrentUser = Depends(require_roles(RoleEnum.citizen)),
):
    # Basic validation
    if not description and not image:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "At least one of image or description is required"},
        )

    # Image validation (MIME type check)
    image_path = None
    if image:
        content_type = image.content_type or ""
        if content_type not in ("image/jpeg", "image/png", "image/webp"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "VALIDATION_ERROR", "message": "Invalid image format. Use JPEG, PNG, or WEBP."},
            )
        # In production: upload to Supabase Storage and get path
        image_path = f"reports/{user.user_id}/{x_idempotency_key or 'upload'}.jpg"

    report_data = {
        "citizen_id": user.user_id,
        "category_id": category_id,
        "description": description,
        "description_language": description_language,
        "latitude": latitude,
        "longitude": longitude,
        "gps_accuracy_m": gps_accuracy_m,
        "is_location_corrected": is_location_corrected,
        "image_path": image_path,
    }

    report = db.create_report(report_data)

    # Queue AI processing — does NOT block the response
    background_tasks.add_task(_run_ai_pipeline, report["id"], report)

    log.info("report_submitted", report_id=report["id"], citizen=user.user_id)
    return ApiResponse.ok(_report_to_out(report))


@router.get("/my", response_model=ApiResponse[PaginatedData[ReportOut]])
async def get_my_reports(
    page: int = 1,
    page_size: int = 20,
    user: CurrentUser = Depends(require_roles(RoleEnum.citizen)),
):
    all_reports = db.get_reports_for_citizen(user.user_id)
    all_reports.sort(key=lambda r: r["submitted_at"], reverse=True)
    total = len(all_reports)
    start = (page - 1) * page_size
    items = all_reports[start: start + page_size]
    return ApiResponse.ok(PaginatedData(
        items=[_report_to_out(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(start + page_size) < total,
    ))


@router.get("/nearby", response_model=ApiResponse[List[ReportOut]])
async def get_nearby_reports(
    lat: float,
    lng: float,
    radius_m: float = 1000,
    user: CurrentUser = Depends(get_current_user),
):
    import math
    def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6_371_000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    nearby = [
        r for r in db.get_all_reports()
        if haversine(lat, lng, r["latitude"], r["longitude"]) <= radius_m
    ]
    return ApiResponse.ok([_report_to_out(r) for r in nearby[:20]])


@router.get("/{report_id}", response_model=ApiResponse[ReportOut])
async def get_report(
    report_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    all_reports = db.get_all_reports()
    report = next((r for r in all_reports if r["id"] == report_id), None)
    if not report:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Report not found"})
    # Citizens can only see their own reports
    if user.role == RoleEnum.citizen and report.get("citizen_id") != user.user_id:
        raise HTTPException(403, detail={"code": "FORBIDDEN", "message": "Access denied"})
    return ApiResponse.ok(_report_to_out(report))
