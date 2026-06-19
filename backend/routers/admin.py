from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Post
from schemas import UserResponse
from dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    全ユーザーのリストを取得する（管理者専用）。
    """
    users = db.query(User).order_by(User.id.asc()).all()
    return users


@router.post("/users/{user_id}/mute")
def toggle_user_mute(
    user_id: int,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    ユーザーのミュート（投稿不能）状態をトグルする（管理者専用）。
    """
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身をミュートすることはできません。"
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません。"
        )
        
    user.is_muted = not user.is_muted
    db.commit()
    db.refresh(user)
    
    status_str = "muted" if user.is_muted else "unmuted"
    return {
        "message": f"User successfully {status_str}.",
        "is_muted": user.is_muted,
        "user_id": user.id
    }


@router.delete("/posts/{post_id}")
def admin_delete_post(
    post_id: int,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    管理者が任意の投稿を強制的に削除するモデレーションAPI（管理者専用）。
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="投稿が見つかりません。"
        )
        
    db.delete(post)
    db.commit()
    return {"message": "Post successfully deleted by administrator."}
