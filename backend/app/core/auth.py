"""
JWT validation via Supabase. Extracts and verifies the Bearer token,
resolves user_profile from Supabase DB, enforces RBAC.
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import Depends, HTTPException, Header, status
from jose import jwt, JWTError
import structlog
from ..config import settings
from ..models.enums import RoleEnum

log = structlog.get_logger()

# In a real deployment, fetch JWKS from Supabase; for simplicity use the secret directly
ALGORITHM = "HS256"


def _decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_REQUIRED", "message": str(e)},
        )


class CurrentUser:
    """Resolved user object attached to every authenticated request."""

    def __init__(
        self,
        user_id: str,
        email: str,
        role: RoleEnum,
        department_id: Optional[str],
        full_name: str,
        is_active: bool,
    ):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.department_id = department_id
        self.full_name = full_name
        self.is_active = is_active


# ── Mock user store (used when Supabase is not configured) ────────────────────
MOCK_USERS: dict[str, CurrentUser] = {
    "citizen1@demo.civicpulse": CurrentUser(
        user_id="mock-citizen-1",
        email="citizen1@demo.civicpulse",
        role=RoleEnum.citizen,
        department_id=None,
        full_name="Hammad Ali",
        is_active=True,
    ),
    "citizen2@demo.civicpulse": CurrentUser(
        user_id="mock-citizen-2",
        email="citizen2@demo.civicpulse",
        role=RoleEnum.citizen,
        department_id=None,
        full_name="Fatima Khan",
        is_active=True,
    ),
    "dept.waste@demo.civicpulse": CurrentUser(
        user_id="mock-dept-waste",
        email="dept.waste@demo.civicpulse",
        role=RoleEnum.department,
        department_id="dept-lwmc",
        full_name="Saad Ahmed",
        is_active=True,
    ),
    "dept.roads@demo.civicpulse": CurrentUser(
        user_id="mock-dept-roads",
        email="dept.roads@demo.civicpulse",
        role=RoleEnum.department,
        department_id="dept-lda",
        full_name="Ayesha Malik",
        is_active=True,
    ),
    "ministry@demo.civicpulse": CurrentUser(
        user_id="mock-ministry",
        email="ministry@demo.civicpulse",
        role=RoleEnum.ministry,
        department_id=None,
        full_name="Omar Sheikh",
        is_active=True,
    ),
    "admin@demo.civicpulse": CurrentUser(
        user_id="mock-admin",
        email="admin@demo.civicpulse",
        role=RoleEnum.admin,
        department_id=None,
        full_name="Admin User",
        is_active=True,
    ),
    "rep@demo.civicpulse": CurrentUser(
        user_id="mock-rep",
        email="rep@demo.civicpulse",
        role=RoleEnum.street_rep,
        department_id=None,
        full_name="Ahmed Raza",
        is_active=True,
    ),
}


def get_current_user(
    authorization: Optional[str] = Header(default=None),
) -> CurrentUser:
    """FastAPI dependency — extracts JWT, resolves user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_REQUIRED", "message": "Bearer token required"},
        )
    token = authorization.split(" ", 1)[1]

    # Demo token shortcut: "Bearer demo:<email>"
    if token.startswith("demo:"):
        email = token[5:]
        user = MOCK_USERS.get(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "AUTH_REQUIRED", "message": "Unknown demo user"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "ACCOUNT_DEACTIVATED", "message": "Account deactivated"},
            )
        return user

    # Real JWT validation
    payload = _decode_token(token)
    user_id: str = payload.get("sub", "")

    # When Supabase is configured, look up user_profile.
    # For now fall back to a generic citizen user.
    return CurrentUser(
        user_id=user_id,
        email=payload.get("email", ""),
        role=RoleEnum(payload.get("user_metadata", {}).get("role", "citizen")),
        department_id=payload.get("user_metadata", {}).get("department_id"),
        full_name=payload.get("user_metadata", {}).get("full_name", ""),
        is_active=True,
    )


def require_roles(*roles: RoleEnum):
    """Dependency factory that enforces role-based access."""
    def _check(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": f"Requires one of: {[r.value for r in roles]}"},
            )
        return user
    return _check
