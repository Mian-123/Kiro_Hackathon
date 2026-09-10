from fastapi import APIRouter, Depends
from ..core.auth import get_current_user, CurrentUser
from ..models.schemas import ApiResponse, UserProfile
from ..models.enums import LanguageEnum
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=ApiResponse[UserProfile])
async def get_me(user: CurrentUser = Depends(get_current_user)):
    profile = UserProfile(
        id=user.user_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        department_id=user.department_id,
        department_name=None,
        preferred_language=LanguageEnum.en,
        is_active=user.is_active,
        created_at=datetime.now(timezone.utc),
    )
    return ApiResponse.ok(profile)
