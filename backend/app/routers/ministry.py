"""
Ministry intelligence endpoints — city-wide aggregates only, no citizen PII.
"""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
import structlog

from ..core.auth import require_roles, CurrentUser
from ..models.enums import RoleEnum, StatusEnum, PriorityBandEnum
from ..models.schemas import (
    ApiResponse,
    DashboardResponse, KPISummary, CategoryBreakdownItem, StatusBreakdownItem,
    DeptPerformanceItem, ResolutionTrendItem, VerificationOutcomes,
    HotspotsResponse, HotspotItem,
)
from ..services import mock_db as db

log = structlog.get_logger()
router = APIRouter(prefix="/ministry", tags=["ministry"])


@router.get("/dashboard", response_model=ApiResponse[DashboardResponse])
async def get_dashboard(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    user: CurrentUser = Depends(require_roles(RoleEnum.ministry, RoleEnum.admin)),
):
    all_incs = db.get_incidents()
    active = [i for i in all_incs if i["status"] not in (StatusEnum.RESOLVED, StatusEnum.MERGED)]
    resolved = [i for i in all_incs if i["status"] == StatusEnum.RESOLVED]
    reopened = [i for i in all_incs if i["status"] == StatusEnum.REOPENED]
    awaiting = [i for i in all_incs if i["status"] == StatusEnum.AWAITING_CITIZEN_VERIFICATION]
    critical = [i for i in active if i.get("priority_band") == PriorityBandEnum.CRITICAL]

    kpi = KPISummary(
        total_active=len(active),
        resolved_this_period=len(resolved),
        reopened=len(reopened),
        awaiting_verification=len(awaiting),
        avg_resolution_hours=18.6,
        critical_incidents=len(critical),
    )

    # Category breakdown — NO PII, aggregated counts only
    cat_counts: dict[str, int] = {}
    for inc in all_incs:
        name = inc.get("category_name", "Other")
        cat_counts[name] = cat_counts.get(name, 0) + 1
    total_incs = len(all_incs) or 1
    category_breakdown = [
        CategoryBreakdownItem(category=k, count=v, percentage=round(v / total_incs * 100, 1))
        for k, v in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Status breakdown
    status_counts: dict[str, int] = {}
    for inc in all_incs:
        s = inc["status"].value
        status_counts[s] = status_counts.get(s, 0) + 1
    status_breakdown = [StatusBreakdownItem(status=k, count=v) for k, v in status_counts.items()]

    # Department performance
    dept_stats: dict[str, dict] = {}
    for inc in all_incs:
        dept = inc.get("assigned_department_name", "Unassigned")
        dept_id = inc.get("assigned_department_id", "unknown")
        if dept not in dept_stats:
            dept_stats[dept] = {"id": dept_id, "assigned": 0, "in_progress": 0, "resolved": 0}
        dept_stats[dept]["assigned"] += 1
        if inc["status"] == StatusEnum.IN_PROGRESS:
            dept_stats[dept]["in_progress"] += 1
        if inc["status"] == StatusEnum.RESOLVED:
            dept_stats[dept]["resolved"] += 1

    department_performance = [
        DeptPerformanceItem(
            department_id=v["id"],
            department_name=k,
            assigned=v["assigned"],
            in_progress=v["in_progress"],
            resolved=v["resolved"],
            avg_resolution_hours=18.6,
            reopened_rate=0.10,
            verification_acceptance_rate=0.88,
        )
        for k, v in dept_stats.items()
    ]

    # 7-day resolution trend
    now = datetime.now(timezone.utc)
    trend = []
    for days_back in range(6, -1, -1):
        d = now - timedelta(days=days_back)
        label = d.strftime("%b %d")
        trend.append(ResolutionTrendItem(
            date=label,
            created=max(1, 15 - days_back * 2 + (days_back % 3)),
            resolved=max(0, 8 + days_back - (days_back % 2)),
        ))

    verification_outcomes = VerificationOutcomes(
        confirmed=len(resolved),
        rejected=len(reopened),
        pending=len(awaiting),
    )

    return ApiResponse.ok(DashboardResponse(
        kpi=kpi,
        category_breakdown=category_breakdown,
        status_breakdown=status_breakdown,
        department_performance=department_performance,
        resolution_trend=trend,
        verification_outcomes=verification_outcomes,
    ))


@router.get("/hotspots", response_model=ApiResponse[HotspotsResponse])
async def get_hotspots(
    n: int = Query(5, ge=1, le=20),
    user: CurrentUser = Depends(require_roles(RoleEnum.ministry, RoleEnum.admin)),
):
    # Cluster by area_label — simple aggregation
    clusters: dict[str, dict] = {}
    for inc in db.get_incidents():
        area = inc.get("area_label", "Unknown")
        if area not in clusters:
            clusters[area] = {
                "lats": [], "lngs": [], "count": 0, "categories": [],
                "priorities": [], "critical": 0,
                "oldest": inc["created_at"],
            }
        c = clusters[area]
        c["lats"].append(inc["lat"])
        c["lngs"].append(inc["lng"])
        c["count"] += 1
        c["categories"].append(inc.get("category_name", "Other"))
        if inc.get("priority_score"):
            c["priorities"].append(float(inc["priority_score"]))
        if inc.get("priority_band") == PriorityBandEnum.CRITICAL:
            c["critical"] += 1
        if inc["created_at"] < c["oldest"]:
            c["oldest"] = inc["created_at"]

    hotspots: list[HotspotItem] = []
    now = datetime.now(timezone.utc)
    for i, (area, data) in enumerate(
        sorted(clusters.items(), key=lambda x: x[1]["count"], reverse=True)[:n]
    ):
        avg_lat = sum(data["lats"]) / len(data["lats"])
        avg_lng = sum(data["lngs"]) / len(data["lngs"])
        dom_cat = max(set(data["categories"]), key=data["categories"].count)
        avg_prio = sum(data["priorities"]) / len(data["priorities"]) if data["priorities"] else 0
        oldest_h = (now - data["oldest"]).total_seconds() / 3600

        hotspots.append(HotspotItem(
            cluster_id=f"cluster-{i + 1}",
            center_latitude=round(avg_lat, 5),
            center_longitude=round(avg_lng, 5),
            area_label=area,
            incident_count=data["count"],
            dominant_category=dom_cat,
            avg_priority_score=round(avg_prio, 1),
            critical_count=data["critical"],
            oldest_unresolved_hours=round(oldest_h, 1),
        ))

    return ApiResponse.ok(HotspotsResponse(hotspots=hotspots))


@router.get("/statistics", response_model=ApiResponse[dict])
async def get_statistics(
    user: CurrentUser = Depends(require_roles(RoleEnum.ministry, RoleEnum.admin)),
):
    """Extended statistics — superset of dashboard KPI."""
    all_incs = db.get_incidents()
    return ApiResponse.ok({
        "total_incidents": len(all_incs),
        "by_status": {s.value: sum(1 for i in all_incs if i["status"] == s) for s in StatusEnum},
        "by_severity": {
            "low": sum(1 for i in all_incs if i.get("severity") and i["severity"].value == "low"),
            "medium": sum(1 for i in all_incs if i.get("severity") and i["severity"].value == "medium"),
            "high": sum(1 for i in all_incs if i.get("severity") and i["severity"].value == "high"),
            "critical": sum(1 for i in all_incs if i.get("severity") and i["severity"].value == "critical"),
        },
        "privacy_note": "No citizen phone, email, or personal data is exposed in this response.",
    })
