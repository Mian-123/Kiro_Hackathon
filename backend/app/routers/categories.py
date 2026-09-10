from fastapi import APIRouter, Depends
from ..core.auth import get_current_user, CurrentUser
from ..models.schemas import ApiResponse, CategoryOut
from ..services.mock_db import get_categories
from typing import List

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=ApiResponse[List[CategoryOut]])
async def list_categories(user: CurrentUser = Depends(get_current_user)):
    cats = [
        CategoryOut(id=c["id"], name=c["name"], icon=c["icon"], is_active=c["is_active"])
        for c in get_categories()
    ]
    return ApiResponse.ok(cats)
