from fastapi import APIRouter, Depends, HTTPException
from ..core.auth import get_current_user, CurrentUser
from ..models.schemas import ApiResponse, NotificationOut, UnreadCountResponse, PaginatedData
from ..services import mock_db as db
from datetime import datetime, timezone

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=ApiResponse[PaginatedData[NotificationOut]])
async def list_notifications(
    page: int = 1,
    page_size: int = 20,
    user: CurrentUser = Depends(get_current_user),
):
    notifs = db.get_notifications_for_user(user.user_id)
    notifs.sort(key=lambda n: n["created_at"], reverse=True)
    total = len(notifs)
    start = (page - 1) * page_size
    items = notifs[start: start + page_size]
    return ApiResponse.ok(PaginatedData(
        items=[NotificationOut(**n) for n in items],
        total=total, page=page, page_size=page_size,
        has_next=(start + page_size) < total,
    ))


@router.get("/unread-count", response_model=ApiResponse[UnreadCountResponse])
async def unread_count(user: CurrentUser = Depends(get_current_user)):
    notifs = db.get_notifications_for_user(user.user_id)
    count = sum(1 for n in notifs if not n["is_read"])
    return ApiResponse.ok(UnreadCountResponse(unread_count=count))


@router.patch("/{notification_id}/read", response_model=ApiResponse[dict])
async def mark_read(
    notification_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    ok = db.mark_notification_read(notification_id, user.user_id)
    if not ok:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Notification not found"})
    return ApiResponse.ok({"id": notification_id, "is_read": True, "read_at": datetime.now(timezone.utc).isoformat()})


@router.patch("/read-all", response_model=ApiResponse[dict])
async def mark_all_read(user: CurrentUser = Depends(get_current_user)):
    notifs = db.get_notifications_for_user(user.user_id)
    count = 0
    for n in notifs:
        if not n["is_read"]:
            n["is_read"] = True
            count += 1
    return ApiResponse.ok({"marked_read": count})
