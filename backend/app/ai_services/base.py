"""Abstract base class every AI provider implements."""
from __future__ import annotations
from abc import ABC, abstractmethod

from ..models.schemas import (
    ClassifyReportRequest, ClassifyReportResponse,
    CheckDuplicateRequest, CheckDuplicateResponse,
    PriorityRequest, PriorityResponse,
)


class BaseAIProvider(ABC):
    """Three AI operations: classify_report, check_duplicate, calculate_priority."""

    @abstractmethod
    async def classify_report(self, req: ClassifyReportRequest) -> ClassifyReportResponse:
        """Classify report into category + severity + confidence."""
        ...

    @abstractmethod
    async def check_duplicate(self, req: CheckDuplicateRequest, existing_incidents: list[dict]) -> CheckDuplicateResponse:
        """Detect if report matches an existing incident nearby."""
        ...

    @abstractmethod
    async def calculate_priority(self, req: PriorityRequest) -> PriorityResponse:
        """Score incident urgency 0-100 with 5-factor breakdown."""
        ...
