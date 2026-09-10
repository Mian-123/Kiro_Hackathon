"""
AI endpoints — server-to-server only (not callable by browser clients).
Protected by a simple API key header in production.
"""
from fastapi import APIRouter, Depends, Header, HTTPException
from typing import Optional
from ..models.schemas import (
    ApiResponse,
    ClassifyReportRequest, ClassifyReportResponse,
    CheckDuplicateRequest, CheckDuplicateResponse,
    PriorityRequest, PriorityResponse,
)
from ..services.ai_adapter import ai_provider
from ..services import mock_db as db
from ..models.enums import StatusEnum

router = APIRouter(prefix="/ai", tags=["ai"])


def _verify_internal(x_internal_key: Optional[str] = Header(default=None)):
    """Light guard — in production replace with a proper API key check."""
    # For demo/hackathon, allow all internal calls
    return True


@router.post("/classify-report", response_model=ApiResponse[ClassifyReportResponse])
async def classify_report(
    req: ClassifyReportRequest,
    _: bool = Depends(_verify_internal),
):
    result = await ai_provider.classify_report(req)
    return ApiResponse.ok(result)


@router.post("/check-duplicate", response_model=ApiResponse[CheckDuplicateResponse])
async def check_duplicate(
    req: CheckDuplicateRequest,
    _: bool = Depends(_verify_internal),
):
    existing = [
        {
            "id": inc["id"],
            "lat": inc["lat"],
            "lng": inc["lng"],
            "category": inc["category_name"],
            "description": inc.get("description", ""),
            "created_at": inc["created_at"].isoformat(),
        }
        for inc in db.get_incidents()
        if inc["status"] not in (StatusEnum.RESOLVED, StatusEnum.MERGED, StatusEnum.REJECTED)
    ]
    result = await ai_provider.check_duplicate(req, existing)
    return ApiResponse.ok(result)


@router.post("/priority", response_model=ApiResponse[PriorityResponse])
async def calculate_priority(
    req: PriorityRequest,
    _: bool = Depends(_verify_internal),
):
    result = await ai_provider.calculate_priority(req)
    return ApiResponse.ok(result)
