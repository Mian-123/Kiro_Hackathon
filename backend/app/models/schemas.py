"""
Pydantic request/response schemas for CivicPulse Lahore API.
All responses use the stable envelope: { success, data, error }.
"""
from __future__ import annotations
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from .enums import (
    RoleEnum, StatusEnum, SeverityEnum, PriorityBandEnum,
    AIStatusEnum, LanguageEnum
)

T = TypeVar("T")


# ── Envelope ──────────────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    code: str
    message: str


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None

    @classmethod
    def ok(cls, data: T) -> "ApiResponse[T]":
        return cls(success=True, data=data, error=None)

    @classmethod
    def fail(cls, code: str, message: str) -> "ApiResponse[None]":
        return cls(success=False, data=None, error=ErrorDetail(code=code, message=message))


class PaginatedData(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    has_next: bool


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: RoleEnum
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    preferred_language: LanguageEnum = LanguageEnum.en
    is_active: bool = True
    created_at: datetime


# ── Categories ────────────────────────────────────────────────────────────────

class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    icon: str
    description: Optional[str] = None
    is_active: bool = True


# ── Reports ───────────────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    category_id: str
    description: Optional[str] = Field(None, max_length=1000)
    description_language: LanguageEnum = LanguageEnum.en
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    gps_accuracy_m: Optional[float] = Field(None, ge=0)
    is_location_corrected: bool = False
    client_timestamp: Optional[datetime] = None


class AISuggestion(BaseModel):
    name: str
    confidence: float


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    short_code: str
    status: StatusEnum
    category: Optional[CategoryOut] = None
    description: Optional[str] = None
    description_language: LanguageEnum
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    gps_accuracy_m: Optional[float] = None
    is_location_corrected: bool
    ai_status: AIStatusEnum
    ai_suggested_category: Optional[AISuggestion] = None
    incident_id: Optional[str] = None
    incident_short_code: Optional[str] = None
    submitted_at: datetime


# ── Incidents ─────────────────────────────────────────────────────────────────

class PriorityExplanationFactor(BaseModel):
    value: Any
    contribution: float
    weight: float


class PriorityExplanation(BaseModel):
    priority_score: float
    priority_band: PriorityBandEnum
    factors: dict[str, PriorityExplanationFactor]


class TimelineEntry(BaseModel):
    status: StatusEnum
    occurred_at: datetime
    label: str
    actor_role: Optional[str] = None


class ResolutionOut(BaseModel):
    image_url: Optional[str] = None
    description: Optional[str] = None
    submitted_at: Optional[datetime] = None


class AIDetails(BaseModel):
    image_category: Optional[str] = None
    image_category_confidence: Optional[float] = None
    image_severity: Optional[str] = None
    image_severity_confidence: Optional[float] = None
    image_relevance: Optional[float] = None
    text_category: Optional[str] = None
    text_category_confidence: Optional[float] = None
    is_category_overridden: bool = False
    is_severity_overridden: bool = False


class DuplicateSignals(BaseModel):
    top_candidate_id: Optional[str] = None
    distance_m: Optional[float] = None
    time_minutes: Optional[float] = None
    category_match: Optional[bool] = None
    semantic_similarity: Optional[float] = None
    image_similarity: Optional[float] = None
    combined_probability: Optional[float] = None


class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    short_code: str
    status: StatusEnum
    category: Optional[CategoryOut] = None
    severity: Optional[SeverityEnum] = None
    priority_score: Optional[float] = None
    priority_band: Optional[PriorityBandEnum] = None
    priority_explanation: Optional[PriorityExplanation] = None
    latitude: float
    longitude: float
    area_label: Optional[str] = None
    report_count: int
    assigned_department_name: Optional[str] = None
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    timeline: List[TimelineEntry] = []
    original_evidence: Optional[dict] = None
    resolution: Optional[ResolutionOut] = None
    verification_state: Optional[str] = None
    can_verify: bool = False
    # Department/admin only
    ai_details: Optional[AIDetails] = None
    duplicate_signals: Optional[DuplicateSignals] = None


class IncidentPatch(BaseModel):
    status: Optional[StatusEnum] = None
    category_id: Optional[str] = None
    severity: Optional[SeverityEnum] = None
    override_reason: Optional[str] = Field(None, min_length=10)
    assigned_department_id: Optional[str] = None


# ── AI ────────────────────────────────────────────────────────────────────────

class ClassifyReportRequest(BaseModel):
    report_id: str
    image_path: Optional[str] = None
    description: Optional[str] = None
    description_language: LanguageEnum = LanguageEnum.en


class ClassifyReportResponse(BaseModel):
    image_category: Optional[str] = None
    image_category_confidence: Optional[float] = None
    image_relevance: Optional[float] = None
    image_severity: Optional[str] = None
    image_severity_confidence: Optional[float] = None
    image_description: Optional[str] = None
    text_category: Optional[str] = None
    text_category_confidence: Optional[float] = None
    text_sentiment: Optional[str] = None
    text_language_detected: Optional[str] = None


class DuplicateCandidate(BaseModel):
    incident_id: str
    distance_m: float
    time_minutes: float
    category_match: bool
    semantic_similarity: Optional[float] = None
    image_similarity: Optional[float] = None
    combined_probability: float


class CheckDuplicateRequest(BaseModel):
    report_id: str
    latitude: float
    longitude: float
    category_id: str
    description: Optional[str] = None
    image_path: Optional[str] = None
    submitted_at: datetime


class CheckDuplicateResponse(BaseModel):
    candidates: List[DuplicateCandidate] = []
    top_candidate_id: Optional[str] = None
    recommendation: str  # merge | review | new
    merge_threshold_used: float


class PriorityRequest(BaseModel):
    incident_id: str
    severity: SeverityEnum
    report_count: int
    latitude: float
    longitude: float
    created_at: datetime


class PriorityResponse(BaseModel):
    priority_score: float
    priority_band: PriorityBandEnum
    factors: dict


# ── Verification ──────────────────────────────────────────────────────────────

class VerifyResolutionRequest(BaseModel):
    outcome: str  # confirmed | rejected
    rejection_reason: Optional[str] = Field(None, max_length=500)


class VerifyResolutionResponse(BaseModel):
    incident_id: str
    outcome: str
    incident_status: StatusEnum
    verified_at: datetime


# ── Resolution ────────────────────────────────────────────────────────────────

class ResolutionCreateResponse(BaseModel):
    resolution_id: str
    incident_id: str
    status: StatusEnum
    submitted_at: datetime


# ── Ministry ──────────────────────────────────────────────────────────────────

class KPISummary(BaseModel):
    total_active: int
    resolved_this_period: int
    reopened: int
    awaiting_verification: int
    avg_resolution_hours: float
    critical_incidents: int


class CategoryBreakdownItem(BaseModel):
    category: str
    count: int
    percentage: float


class StatusBreakdownItem(BaseModel):
    status: str
    count: int


class DeptPerformanceItem(BaseModel):
    department_id: str
    department_name: str
    assigned: int
    in_progress: int
    resolved: int
    avg_resolution_hours: float
    reopened_rate: float
    verification_acceptance_rate: float


class ResolutionTrendItem(BaseModel):
    date: str
    created: int
    resolved: int


class VerificationOutcomes(BaseModel):
    confirmed: int
    rejected: int
    pending: int


class DashboardResponse(BaseModel):
    kpi: KPISummary
    category_breakdown: List[CategoryBreakdownItem]
    status_breakdown: List[StatusBreakdownItem]
    department_performance: List[DeptPerformanceItem]
    resolution_trend: List[ResolutionTrendItem]
    verification_outcomes: VerificationOutcomes


class HotspotItem(BaseModel):
    cluster_id: str
    center_latitude: float
    center_longitude: float
    area_label: str
    incident_count: int
    dominant_category: str
    avg_priority_score: float
    critical_count: int
    oldest_unresolved_hours: float


class HotspotsResponse(BaseModel):
    hotspots: List[HotspotItem]


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_type: str
    title: str
    body: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    entity_short_code: Optional[str] = None
    is_read: bool
    priority: str
    created_at: datetime
    read_at: Optional[datetime] = None


class UnreadCountResponse(BaseModel):
    unread_count: int


# ── Admin ─────────────────────────────────────────────────────────────────────

class UserPatch(BaseModel):
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    department_id: Optional[str] = None
    preferred_language: Optional[LanguageEnum] = None
    is_active: Optional[bool] = None


class UserCreate(BaseModel):
    email: str
    full_name: str
    role: RoleEnum
    department_id: Optional[str] = None
    preferred_language: LanguageEnum = LanguageEnum.en


class MergeIncidentRequest(BaseModel):
    target_incident_id: str
    reason: str = Field(..., min_length=10)


class MergeIncidentResponse(BaseModel):
    source_incident_id: str
    target_incident_id: str
    reports_moved: int


class SplitIncidentRequest(BaseModel):
    report_ids: List[str]
    reason: str = Field(..., min_length=10)


class SplitIncidentResponse(BaseModel):
    original_incident_id: str
    new_incident_id: str
    reports_split: int


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_type: str
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    entity_type: str
    entity_id: str
    entity_short_code: Optional[str] = None
    before_snapshot: Optional[dict] = None
    after_snapshot: Optional[dict] = None
    metadata: Optional[dict] = None
    created_at: datetime
