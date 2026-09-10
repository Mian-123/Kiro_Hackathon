from enum import Enum


class RoleEnum(str, Enum):
    citizen = "citizen"
    street_rep = "street_rep"
    department = "department"
    ministry = "ministry"
    admin = "admin"


class StatusEnum(str, Enum):
    SUBMITTED = "SUBMITTED"
    AI_REVIEW = "AI_REVIEW"
    VERIFIED = "VERIFIED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLUTION_SUBMITTED = "RESOLUTION_SUBMITTED"
    AWAITING_CITIZEN_VERIFICATION = "AWAITING_CITIZEN_VERIFICATION"
    RESOLVED = "RESOLVED"
    REOPENED = "REOPENED"
    FLAGGED = "FLAGGED"
    REJECTED = "REJECTED"
    MERGED = "MERGED"


class SeverityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class PriorityBandEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AIStatusEnum(str, Enum):
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"


class LanguageEnum(str, Enum):
    en = "en"
    ur = "ur"
    roman_ur = "roman_ur"
