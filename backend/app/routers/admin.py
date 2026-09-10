"""
Admin governance endpoints.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
import structlog

from ..core.auth import require_roles, CurrentUser
from ..models.enums import RoleEnum
from ..models.schemas import (
    ApiResponse,
    UserProfile, UserPatch, UserCreate,
    CategoryOut, MergeIncidentRequest, MergeIncidentResponse,
    SplitIncidentRequest, SplitIncidentResponse,
    AuditLogEntry, PaginatedData,
)
from ..services import mock_db as db
from ..models.enums import LanguageEnum

log = structlog.get_logger()
router = APIRouter(prefix="/admin", tags=["admin"])

# ── Mock user store for admin management ──────────────────────────────────────
from ..core.auth import MOCK_USERS
import uuid

_admin_users = list(MOCK_USERS.values())
_audit_log: list[dict] = []


def _user_to_profile(u) -> UserProfile:
    return UserProfile(
        id=u.user_id,
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        department_id=u.department_id,
        is_active=u.is_active,
        created_at=datetime.now(timezone.utc),
    )


def _log_audit(actor: CurrentUser, event: str, entity_type: str, entity_id: str, before=None, after=None, metadata=None):
    _audit_log.append({
        "id": str(uuid.uuid4()),
        "event_type": event,
        "actor_id": actor.user_id,
        "actor_role": actor.role.value,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "before_snapshot": before,
        "after_snapshot": after,
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc),
    })


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=ApiResponse[PaginatedData[UserProfile]])
async def list_users(
    page: int = 1,
    page_size: int = 20,
    role_filter: Optional[str] = Query(None, alias="role"),
    search: Optional[str] = None,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    users = _admin_users[:]
    if role_filter:
        users = [u for u in users if u.role.value == role_filter]
    if search:
        s = search.lower()
        users = [u for u in users if s in u.email.lower() or s in u.full_name.lower()]
    total = len(users)
    start = (page - 1) * page_size
    items = users[start: start + page_size]
    return ApiResponse.ok(PaginatedData(
        items=[_user_to_profile(u) for u in items],
        total=total, page=page, page_size=page_size,
        has_next=(start + page_size) < total,
    ))


@router.post("/users", response_model=ApiResponse[UserProfile], status_code=201)
async def create_user(
    body: UserCreate,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    from ..core.auth import CurrentUser as CU
    new_user = CU(
        user_id=str(uuid.uuid4()),
        email=body.email,
        role=body.role,
        department_id=body.department_id,
        full_name=body.full_name,
        is_active=True,
    )
    _admin_users.append(new_user)
    _log_audit(user, "ADMIN_USER_CREATED", "user", new_user.user_id, after={"email": body.email, "role": body.role.value})
    return ApiResponse.ok(_user_to_profile(new_user))


@router.patch("/users/{user_id}", response_model=ApiResponse[UserProfile])
async def patch_user(
    user_id: str,
    body: UserPatch,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    # Safety checks
    if user_id == user.user_id and body.is_active is False:
        raise HTTPException(403, detail={"code": "CANNOT_DEACTIVATE_SELF", "message": "Cannot deactivate your own account"})

    active_admins = [u for u in _admin_users if u.role == RoleEnum.admin and u.is_active]
    target = next((u for u in _admin_users if u.user_id == user_id), None)
    if not target:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "User not found"})

    if len(active_admins) == 1 and target.role == RoleEnum.admin and body.is_active is False:
        raise HTTPException(403, detail={"code": "LAST_ADMIN_PROTECTION", "message": "Cannot deactivate the last admin"})

    before = {"role": target.role.value, "is_active": target.is_active}
    if body.full_name is not None:
        target.full_name = body.full_name
    if body.role is not None:
        target.role = body.role
    if body.department_id is not None:
        target.department_id = body.department_id
    if body.is_active is not None:
        target.is_active = body.is_active

    after = {"role": target.role.value, "is_active": target.is_active}
    event = "USER_DEACTIVATED" if body.is_active is False else "USER_ROLE_CHANGED" if body.role else "USER_UPDATED"
    _log_audit(user, event, "user", user_id, before=before, after=after)

    return ApiResponse.ok(_user_to_profile(target))


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=ApiResponse[list])
async def list_all_categories(user: CurrentUser = Depends(require_roles(RoleEnum.admin))):
    return ApiResponse.ok(db.MOCK_CATEGORIES)


@router.post("/categories", response_model=ApiResponse[CategoryOut], status_code=201)
async def create_category(
    name: str,
    icon: str,
    description: Optional[str] = None,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    new_cat = {"id": str(uuid.uuid4()), "name": name, "icon": icon, "description": description, "is_active": True}
    db.MOCK_CATEGORIES.append(new_cat)
    _log_audit(user, "CATEGORY_CREATED", "category", new_cat["id"], after=new_cat)
    return ApiResponse.ok(CategoryOut(**new_cat))


@router.patch("/categories/{category_id}", response_model=ApiResponse[CategoryOut])
async def patch_category(
    category_id: str,
    is_active: Optional[bool] = None,
    name: Optional[str] = None,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    cat = next((c for c in db.MOCK_CATEGORIES if c["id"] == category_id), None)
    if not cat:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Category not found"})
    before = dict(cat)
    if name:
        cat["name"] = name
    if is_active is not None:
        cat["is_active"] = is_active
    _log_audit(user, "CATEGORY_UPDATED", "category", category_id, before=before, after=dict(cat))
    return ApiResponse.ok(CategoryOut(**cat))


# ── Departments ───────────────────────────────────────────────────────────────

@router.get("/departments", response_model=ApiResponse[list])
async def list_all_departments(user: CurrentUser = Depends(require_roles(RoleEnum.admin))):
    return ApiResponse.ok(db.MOCK_DEPARTMENTS)


@router.post("/departments", response_model=ApiResponse[dict], status_code=201)
async def create_department(
    name: str,
    description: Optional[str] = None,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    dept = {"id": str(uuid.uuid4()), "name": name, "description": description, "is_active": True}
    db.MOCK_DEPARTMENTS.append(dept)
    _log_audit(user, "DEPARTMENT_CREATED", "department", dept["id"], after=dept)
    return ApiResponse.ok(dept)


@router.patch("/departments/{dept_id}", response_model=ApiResponse[dict])
async def patch_department(
    dept_id: str,
    is_active: Optional[bool] = None,
    name: Optional[str] = None,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    dept = next((d for d in db.MOCK_DEPARTMENTS if d["id"] == dept_id), None)
    if not dept:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Department not found"})
    if is_active is False:
        active_incidents = [
            i for i in db.get_incidents()
            if i.get("assigned_department_id") == dept_id
            and i["status"].value in ("ASSIGNED", "IN_PROGRESS", "RESOLUTION_SUBMITTED")
        ]
        if active_incidents:
            raise HTTPException(409, detail={
                "code": "DEPARTMENT_HAS_ACTIVE_INCIDENTS",
                "message": f"{len(active_incidents)} active incidents. Pass force=true to override.",
            })
    before = dict(dept)
    if name:
        dept["name"] = name
    if is_active is not None:
        dept["is_active"] = is_active
    _log_audit(user, "DEPARTMENT_UPDATED", "department", dept_id, before=before, after=dict(dept))
    return ApiResponse.ok(dept)


# ── Incident merge/split ──────────────────────────────────────────────────────

@router.post("/incidents/{incident_id}/merge", response_model=ApiResponse[MergeIncidentResponse])
async def merge_incidents(
    incident_id: str,
    body: MergeIncidentRequest,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    from ..models.enums import StatusEnum
    source = db.get_incident(incident_id)
    target = db.get_incident(body.target_incident_id)

    if not source:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Source incident not found"})
    if not target:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Target incident not found"})
    if incident_id == body.target_incident_id:
        raise HTTPException(422, detail={"code": "CANNOT_MERGE_WITH_SELF", "message": "Cannot merge with itself"})
    if source["status"] == StatusEnum.MERGED:
        raise HTTPException(409, detail={"code": "INCIDENT_ALREADY_MERGED", "message": "Source already merged"})

    # Move reports
    moved_count = 0
    for report in db.get_all_reports():
        if report.get("incident_id") == incident_id:
            report["incident_id"] = body.target_incident_id
            moved_count += 1

    db.update_incident_status(incident_id, StatusEnum.MERGED)
    source["merged_into"] = body.target_incident_id
    target["report_count"] = target.get("report_count", 1) + source.get("report_count", 1)

    _log_audit(user, "INCIDENT_MERGED", "incident", incident_id,
               metadata={"target_id": body.target_incident_id, "reason": body.reason, "reports_moved": moved_count})
    log.info("incident_merged", source=incident_id, target=body.target_incident_id, moved=moved_count)

    return ApiResponse.ok(MergeIncidentResponse(
        source_incident_id=incident_id,
        target_incident_id=body.target_incident_id,
        reports_moved=moved_count,
    ))


@router.post("/incidents/{incident_id}/split", response_model=ApiResponse[SplitIncidentResponse])
async def split_incident(
    incident_id: str,
    body: SplitIncidentRequest,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    source = db.get_incident(incident_id)
    if not source:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Incident not found"})
    if not body.report_ids:
        raise HTTPException(422, detail={"code": "VALIDATION_ERROR", "message": "report_ids cannot be empty"})

    new_id = str(uuid.uuid4())
    import copy
    new_inc = copy.deepcopy(source)
    new_inc["id"] = new_id
    new_inc["short_code"] = f"INC-LHR-SPLIT-{new_id[:4].upper()}"
    new_inc["report_count"] = len(body.report_ids)
    db.MOCK_INCIDENTS.append(new_inc)

    # Re-link reports
    for report in db.get_all_reports():
        if report["id"] in body.report_ids:
            report["incident_id"] = new_id

    source["report_count"] = max(1, source.get("report_count", 1) - len(body.report_ids))

    _log_audit(user, "INCIDENT_SPLIT", "incident", incident_id,
               metadata={"new_id": new_id, "report_ids": body.report_ids, "reason": body.reason})

    return ApiResponse.ok(SplitIncidentResponse(
        original_incident_id=incident_id,
        new_incident_id=new_id,
        reports_split=len(body.report_ids),
    ))


# ── Audit log ─────────────────────────────────────────────────────────────────

@router.get("/audit-log", response_model=ApiResponse[PaginatedData[AuditLogEntry]])
async def get_audit_log(
    page: int = 1,
    page_size: int = 50,
    entity_type: Optional[str] = None,
    event_type: Optional[str] = None,
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    entries = _audit_log[:]
    if entity_type:
        entries = [e for e in entries if e["entity_type"] == entity_type]
    if event_type:
        entries = [e for e in entries if e["event_type"] == event_type]
    entries.sort(key=lambda e: e["created_at"], reverse=True)
    total = len(entries)
    start = (page - 1) * page_size
    items = entries[start: start + page_size]
    return ApiResponse.ok(PaginatedData(
        items=[AuditLogEntry(**e) for e in items],
        total=total, page=page, page_size=page_size,
        has_next=(start + page_size) < total,
    ))


# ── Configuration ─────────────────────────────────────────────────────────────

_config_store: dict[str, dict] = {
    "AI_RELEVANCE_THRESHOLD":       {"key": "AI_RELEVANCE_THRESHOLD",       "value": 0.50, "default_value": 0.50, "description": "Min relevance for auto-accept"},
    "DUPLICATE_SEARCH_RADIUS_M":    {"key": "DUPLICATE_SEARCH_RADIUS_M",    "value": 500,  "default_value": 500,  "description": "Spatial search radius (metres)"},
    "DUPLICATE_MERGE_THRESHOLD":    {"key": "DUPLICATE_MERGE_THRESHOLD",    "value": 0.75, "default_value": 0.75, "description": "Auto-merge probability threshold"},
    "DUPLICATE_REVIEW_THRESHOLD":   {"key": "DUPLICATE_REVIEW_THRESHOLD",   "value": 0.50, "default_value": 0.50, "description": "Human-review threshold"},
    "PRIORITY_WEIGHT_SEVERITY":     {"key": "PRIORITY_WEIGHT_SEVERITY",     "value": 0.30, "default_value": 0.30, "description": "Priority weight: severity"},
    "PRIORITY_WEIGHT_CITIZEN":      {"key": "PRIORITY_WEIGHT_CITIZEN",      "value": 0.20, "default_value": 0.20, "description": "Priority weight: citizen support"},
    "PRIORITY_WEIGHT_POPULATION":   {"key": "PRIORITY_WEIGHT_POPULATION",   "value": 0.20, "default_value": 0.20, "description": "Priority weight: population/context"},
    "PRIORITY_WEIGHT_LOCATION":     {"key": "PRIORITY_WEIGHT_LOCATION",     "value": 0.15, "default_value": 0.15, "description": "Priority weight: location sensitivity"},
    "PRIORITY_WEIGHT_DURATION":     {"key": "PRIORITY_WEIGHT_DURATION",     "value": 0.15, "default_value": 0.15, "description": "Priority weight: duration"},
    "CITIZEN_VERIFICATION_TIMEOUT": {"key": "CITIZEN_VERIFICATION_TIMEOUT", "value": 7,    "default_value": 7,    "description": "Citizen verification timeout (days)"},
}


@router.get("/configuration", response_model=ApiResponse[list])
async def get_configuration(user: CurrentUser = Depends(require_roles(RoleEnum.admin))):
    return ApiResponse.ok(list(_config_store.values()))


@router.patch("/configuration", response_model=ApiResponse[list])
async def patch_configuration(
    updates: list[dict],
    user: CurrentUser = Depends(require_roles(RoleEnum.admin)),
):
    # Validate priority weights sum
    weight_keys = {k for k in _config_store if k.startswith("PRIORITY_WEIGHT_")}
    new_weights = {
        u["key"]: float(u["value"])
        for u in updates
        if u.get("key") in weight_keys
    }
    merged = {k: _config_store[k]["value"] for k in weight_keys}
    merged.update(new_weights)
    if abs(sum(merged.values()) - 1.0) > 0.001:
        raise HTTPException(422, detail={
            "code": "INVALID_WEIGHT_SUM",
            "message": f"Priority weights must sum to 1.0 (got {sum(merged.values()):.3f})",
        })

    for u in updates:
        key = u.get("key")
        if key and key in _config_store:
            before = _config_store[key]["value"]
            _config_store[key]["value"] = u["value"]
            _config_store[key]["updated_by"] = user.user_id
            _config_store[key]["updated_at"] = datetime.now(timezone.utc).isoformat()
            _log_audit(user, "CONFIGURATION_CHANGED", "configuration", key,
                       before={"value": before}, after={"value": u["value"]})

    return ApiResponse.ok(list(_config_store.values()))
