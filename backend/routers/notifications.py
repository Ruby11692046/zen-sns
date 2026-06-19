from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import User, Notification, Post
from schemas import NotificationResponse
from dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ログイン中のユーザー宛ての通知一覧を最新順に取得する。
    joinedload を用いて N+1 クエリを解消しています。
    """
    notifications = db.query(Notification).options(
        joinedload(Notification.sender),
        joinedload(Notification.post),
    ).filter(
        Notification.receiver_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    response = []
    for notif in notifications:
        # joinedload により sender / post は既にメモリ上にある
        sender = notif.sender
        sender_name = sender.name if sender else "Unknown"
        sender_avatar_url = sender.avatar_url if sender else None

        # 関連する投稿のプレビューを取得
        post_content_preview = None
        if notif.post:
            post_content_preview = notif.post.content[:50] + ("..." if len(notif.post.content) > 50 else "")

        response.append({
            "id": notif.id,
            "receiver_id": notif.receiver_id,
            "sender_id": notif.sender_id,
            "sender_name": sender_name,
            "sender_avatar_url": sender_avatar_url,
            "type": notif.type,
            "post_id": notif.post_id,
            "post_content_preview": post_content_preview,
            "is_read": notif.is_read,
            "created_at": notif.created_at
        })

    return response


@router.patch("/read")
def read_all_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    自分宛ての未読通知をすべて既読にする。
    """
    db.query(Notification).filter(
        Notification.receiver_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}


@router.patch("/{notification_id}/read")
def read_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    指定された通知を既読にする。
    """
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.receiver_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}
