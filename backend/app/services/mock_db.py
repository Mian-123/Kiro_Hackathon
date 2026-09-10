"""
In-memory mock database for the CivicPulse prototype.
This module provides the same interface as a real DB layer,
but returns realistic mock data. It is kept alongside the real
Supabase integration so the prototype always has working data.
"""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from ..models.enums import StatusEnum, SeverityEnum, PriorityBandEnum, AIStatusEnum

# ── Seed data ─────────────────────────────────────────────────────────────────

NOW = datetime.now(timezone.utc)


def _dt(days_ago: float = 0, hours_ago: float = 0) -> datetime:
    return NOW - timedelta(days=days_ago, hours=hours_ago)


MOCK_CATEGORIES = [
    {"id": "cat-br", "name": "Broken Road",              "icon": "BR", "is_active": True},
    {"id": "cat-gw", "name": "Garbage / Waste",          "icon": "GW", "is_active": True},
    {"id": "cat-sw", "name": "Sewerage / Water",         "icon": "SW", "is_active": True},
    {"id": "cat-sl", "name": "Streetlight",              "icon": "SL", "is_active": True},
    {"id": "cat-en", "name": "Encroachment",             "icon": "EN", "is_active": True},
    {"id": "cat-fl", "name": "Flooding / Standing Water","icon": "FL", "is_active": True},
    {"id": "cat-sh", "name": "Safety Hazard",            "icon": "SH", "is_active": True},
    {"id": "cat-dr", "name": "Drainage",                 "icon": "DR", "is_active": True},
    {"id": "cat-in", "name": "Infrastructure",           "icon": "IN", "is_active": True},
    {"id": "cat-ot", "name": "Other",                    "icon": "OT", "is_active": True},
]

MOCK_DEPARTMENTS = [
    {"id": "dept-wasa",  "name": "WASA Lahore",     "is_active": True},
    {"id": "dept-lda",   "name": "LDA Roads",       "is_active": True},
    {"id": "dept-lwmc",  "name": "LWMC Solid Waste","is_active": True},
    {"id": "dept-lesco", "name": "LESCO",           "is_active": True},
    {"id": "dept-lmc",   "name": "LMC",             "is_active": True},
]

MOCK_INCIDENTS: list[dict] = [
    {
        "id": "inc-001",
        "short_code": "INC-LHR-001",
        "status": StatusEnum.AWAITING_CITIZEN_VERIFICATION,
        "category_id": "cat-sw",
        "category_name": "Sewerage / Water",
        "category_icon": "SW",
        "severity": SeverityEnum.high,
        "priority_score": 78.4,
        "priority_band": PriorityBandEnum.CRITICAL,
        "lat": 31.5134, "lng": 74.3461,
        "area_label": "Gulberg III",
        "report_count": 4,
        "assigned_department_id": "dept-wasa",
        "assigned_department_name": "WASA Lahore",
        "created_at": _dt(days_ago=5),
        "updated_at": _dt(hours_ago=6),
        "description": "Sewage overflow causing health hazard near residential area.",
        "ai_summary": "High-confidence sewerage/drainage issue. Elevated health risk near food market.",
        "ai_status": AIStatusEnum.PROCESSED,
        "rep_verified": True,
        "resolution_description": "Blocked drain cleared and sewage pipe repaired.",
        "timeline": [
            {"status": StatusEnum.SUBMITTED,                     "occurred_at": _dt(days_ago=5),     "label": "Report submitted"},
            {"status": StatusEnum.VERIFIED,                      "occurred_at": _dt(days_ago=4),     "label": "Verified by Street Rep"},
            {"status": StatusEnum.ASSIGNED,                      "occurred_at": _dt(days_ago=4),     "label": "Assigned to WASA Lahore"},
            {"status": StatusEnum.IN_PROGRESS,                   "occurred_at": _dt(days_ago=2),     "label": "Work commenced"},
            {"status": StatusEnum.RESOLUTION_SUBMITTED,          "occurred_at": _dt(hours_ago=12),   "label": "Resolution submitted"},
            {"status": StatusEnum.AWAITING_CITIZEN_VERIFICATION, "occurred_at": _dt(hours_ago=6),    "label": "Awaiting citizen verification"},
        ],
    },
    {
        "id": "inc-002",
        "short_code": "INC-LHR-002",
        "status": StatusEnum.IN_PROGRESS,
        "category_id": "cat-br",
        "category_name": "Broken Road",
        "category_icon": "BR",
        "severity": SeverityEnum.medium,
        "priority_score": 55.2,
        "priority_band": PriorityBandEnum.HIGH,
        "lat": 31.5198, "lng": 74.3392,
        "area_label": "Canal Bank Road",
        "report_count": 7,
        "assigned_department_id": "dept-lda",
        "assigned_department_name": "LDA Roads",
        "created_at": _dt(days_ago=6),
        "updated_at": _dt(days_ago=1),
        "description": "Large pothole cluster causing traffic hazard.",
        "ai_summary": "Road surface damage detected. Multiple citizen reports — high traffic area.",
        "ai_status": AIStatusEnum.PROCESSED,
        "rep_verified": True,
        "timeline": [
            {"status": StatusEnum.SUBMITTED,    "occurred_at": _dt(days_ago=6), "label": "First report"},
            {"status": StatusEnum.VERIFIED,     "occurred_at": _dt(days_ago=5), "label": "Verified by Street Rep"},
            {"status": StatusEnum.ASSIGNED,     "occurred_at": _dt(days_ago=5), "label": "Assigned to LDA Roads"},
            {"status": StatusEnum.IN_PROGRESS,  "occurred_at": _dt(days_ago=1), "label": "Work commenced"},
        ],
    },
    {
        "id": "inc-003",
        "short_code": "INC-LHR-003",
        "status": StatusEnum.ASSIGNED,
        "category_id": "cat-gw",
        "category_name": "Garbage / Waste",
        "category_icon": "GW",
        "severity": SeverityEnum.medium,
        "priority_score": 48.7,
        "priority_band": PriorityBandEnum.MEDIUM,
        "lat": 31.5260, "lng": 74.3650,
        "area_label": "Johar Town",
        "report_count": 6,
        "assigned_department_id": "dept-lwmc",
        "assigned_department_name": "LWMC Solid Waste",
        "created_at": _dt(days_ago=2),
        "updated_at": _dt(hours_ago=4),
        "description": "Overflowing skip containers near Q-Block market.",
        "ai_summary": "Garbage accumulation. Multiple reports — likely collection route delay.",
        "ai_status": AIStatusEnum.PROCESSED,
        "rep_verified": False,
        "timeline": [
            {"status": StatusEnum.SUBMITTED, "occurred_at": _dt(days_ago=2), "label": "First report"},
            {"status": StatusEnum.ASSIGNED,  "occurred_at": _dt(hours_ago=4), "label": "Assigned to LWMC"},
        ],
    },
    {
        "id": "inc-004",
        "short_code": "INC-LHR-004",
        "status": StatusEnum.RESOLVED,
        "category_id": "cat-gw",
        "category_name": "Garbage / Waste",
        "category_icon": "GW",
        "severity": SeverityEnum.low,
        "priority_score": 22.1,
        "priority_band": PriorityBandEnum.LOW,
        "lat": 31.5080, "lng": 74.3720,
        "area_label": "Model Town",
        "report_count": 1,
        "assigned_department_id": "dept-lwmc",
        "assigned_department_name": "LWMC Solid Waste",
        "created_at": _dt(days_ago=10),
        "updated_at": _dt(days_ago=7),
        "description": "Garbage pile blocking pedestrian walkway. Resolved.",
        "ai_status": AIStatusEnum.PROCESSED,
        "rep_verified": True,
        "timeline": [
            {"status": StatusEnum.SUBMITTED,    "occurred_at": _dt(days_ago=10), "label": "Report submitted"},
            {"status": StatusEnum.VERIFIED,     "occurred_at": _dt(days_ago=9),  "label": "Verified by Street Rep"},
            {"status": StatusEnum.ASSIGNED,     "occurred_at": _dt(days_ago=9),  "label": "Assigned"},
            {"status": StatusEnum.IN_PROGRESS,  "occurred_at": _dt(days_ago=8),  "label": "Work commenced"},
            {"status": StatusEnum.RESOLUTION_SUBMITTED, "occurred_at": _dt(days_ago=7), "label": "Resolution submitted"},
            {"status": StatusEnum.RESOLVED,     "occurred_at": _dt(days_ago=7),  "label": "Confirmed resolved"},
        ],
    },
    {
        "id": "inc-005",
        "short_code": "INC-LHR-005",
        "status": StatusEnum.REOPENED,
        "category_id": "cat-fl",
        "category_name": "Flooding / Standing Water",
        "category_icon": "FL",
        "severity": SeverityEnum.critical,
        "priority_score": 88.3,
        "priority_band": PriorityBandEnum.CRITICAL,
        "lat": 31.5310, "lng": 74.3530,
        "area_label": "Ferozepur Road",
        "report_count": 9,
        "assigned_department_id": "dept-wasa",
        "assigned_department_name": "WASA Lahore",
        "created_at": _dt(days_ago=8),
        "updated_at": _dt(hours_ago=3),
        "description": "Persistent flooding on underpass during rain. Previous fix was inadequate.",
        "ai_summary": "Critical flooding. 9 supporting reports. Recurring issue.",
        "ai_status": AIStatusEnum.PROCESSED,
        "rep_verified": True,
        "timeline": [
            {"status": StatusEnum.SUBMITTED,                     "occurred_at": _dt(days_ago=8),     "label": "First report"},
            {"status": StatusEnum.VERIFIED,                      "occurred_at": _dt(days_ago=7),     "label": "Verified by Street Rep"},
            {"status": StatusEnum.ASSIGNED,                      "occurred_at": _dt(days_ago=7),     "label": "Assigned to WASA"},
            {"status": StatusEnum.IN_PROGRESS,                   "occurred_at": _dt(days_ago=5),     "label": "Work commenced"},
            {"status": StatusEnum.RESOLUTION_SUBMITTED,          "occurred_at": _dt(days_ago=1),     "label": "Resolution submitted"},
            {"status": StatusEnum.AWAITING_CITIZEN_VERIFICATION, "occurred_at": _dt(hours_ago=18),   "label": "Awaiting verification"},
            {"status": StatusEnum.REOPENED,                      "occurred_at": _dt(hours_ago=3),    "label": "Citizen rejected: issue persists"},
        ],
    },
]

# Live reports storage (grows at runtime)
_reports_store: list[dict] = []
_notifications_store: list[dict] = []


def get_categories() -> list[dict]:
    return [c for c in MOCK_CATEGORIES if c["is_active"]]


def get_departments() -> list[dict]:
    return [d for d in MOCK_DEPARTMENTS if d["is_active"]]


def get_incidents(status_filter: Optional[str] = None, limit: int = 50) -> list[dict]:
    incs = MOCK_INCIDENTS[:]
    if status_filter:
        incs = [i for i in incs if i["status"].value == status_filter]
    return incs[:limit]


def get_incident(incident_id: str) -> Optional[dict]:
    return next((i for i in MOCK_INCIDENTS if i["id"] == incident_id), None)


def get_incident_by_short_code(short_code: str) -> Optional[dict]:
    return next((i for i in MOCK_INCIDENTS if i["short_code"] == short_code), None)


def get_reports_for_citizen(citizen_id: str) -> list[dict]:
    return [r for r in _reports_store if r.get("citizen_id") == citizen_id]


def get_all_reports() -> list[dict]:
    return _reports_store[:]


def create_report(data: dict) -> dict:
    report_id = str(uuid.uuid4())
    n = len(_reports_store) + 1
    short_code = f"LHR-{report_id[:5].upper()}"
    report = {
        "id": report_id,
        "short_code": short_code,
        "citizen_id": data.get("citizen_id", "unknown"),
        "category_id": data.get("category_id", "cat-ot"),
        "description": data.get("description"),
        "description_language": data.get("description_language", "en"),
        "latitude": data.get("latitude", 31.5204),
        "longitude": data.get("longitude", 74.3587),
        "gps_accuracy_m": data.get("gps_accuracy_m"),
        "is_location_corrected": data.get("is_location_corrected", False),
        "image_path": data.get("image_path"),
        "status": StatusEnum.SUBMITTED,
        "ai_status": AIStatusEnum.PENDING,
        "incident_id": None,
        "submitted_at": datetime.now(timezone.utc),
    }
    _reports_store.append(report)
    return report


def update_report_ai(report_id: str, ai_data: dict) -> None:
    for r in _reports_store:
        if r["id"] == report_id:
            r.update(ai_data)
            r["ai_status"] = AIStatusEnum.PROCESSED
            break


def update_report_incident(report_id: str, incident_id: str) -> None:
    for r in _reports_store:
        if r["id"] == report_id:
            r["incident_id"] = incident_id
            r["status"] = StatusEnum.VERIFIED
            break


def update_incident_status(incident_id: str, new_status: StatusEnum) -> None:
    for inc in MOCK_INCIDENTS:
        if inc["id"] == incident_id:
            inc["status"] = new_status
            inc["updated_at"] = datetime.now(timezone.utc)
            break


def add_notification(user_id: str, event_type: str, title: str, body: str, entity_short_code: Optional[str] = None) -> None:
    _notifications_store.append({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "event_type": event_type,
        "title": title,
        "body": body,
        "entity_short_code": entity_short_code,
        "is_read": False,
        "priority": "high" if "VERIFICATION" in event_type or "REOPENED" in event_type else "normal",
        "created_at": datetime.now(timezone.utc),
    })


def get_notifications_for_user(user_id: str) -> list[dict]:
    return [n for n in _notifications_store if n["user_id"] == user_id]


def mark_notification_read(notification_id: str, user_id: str) -> bool:
    for n in _notifications_store:
        if n["id"] == notification_id and n["user_id"] == user_id:
            n["is_read"] = True
            return True
    return False
