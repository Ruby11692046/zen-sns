from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Follow, Block, Post
from schemas import UserResponse, UserDetailResponse, PostResponse
from dependencies import get_current_user
from services.posts import get_blocked_user_ids, get_formatted_posts

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    現在ログインしている自分のユーザー情報を取得する。
    """
    return current_user


@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    指定したユーザーの詳細情報を取得する。
    
    - フォロー数、フォロワー数、投稿数などの統計情報が含まれます。
    - ログインユーザーからのフォロー状態、ブロック状態も判定します。
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # 統計情報のカウント
    following_count = db.query(func.count(Follow.id)).filter(Follow.follower_id == user_id).scalar() or 0
    followers_count = db.query(func.count(Follow.id)).filter(Follow.following_id == user_id).scalar() or 0
    posts_count = db.query(func.count(Post.id)).filter(Post.user_id == user_id).scalar() or 0
    
    # ログインユーザーからのリレーション状態
    is_following = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first() is not None
    
    is_blocked = db.query(Block).filter(
        Block.blocker_id == current_user.id,
        Block.blocked_id == user_id
    ).first() is not None
    
    # UserDetailResponse 形式にマッピング
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "is_muted": user.is_muted,
        "is_admin": user.is_admin,
        "created_at": user.created_at,
        "following_count": following_count,
        "followers_count": followers_count,
        "posts_count": posts_count,
        "is_following_by_me": is_following,
        "is_blocked_by_me": is_blocked
    }


@router.get("/{user_id}/posts", response_model=list[PostResponse])
def get_user_posts(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    指定したユーザーの投稿一覧を取得する。
    
    - 相互ブロック関係にある場合は、空のリストを返すか、エラーにします（ここでは空を返します）。
    """
    # ブロック関係のチェック
    blocked_ids = get_blocked_user_ids(db, current_user.id)
    if user_id in blocked_ids:
        return []
        
    posts = db.query(Post).filter(
        Post.user_id == user_id
    ).order_by(Post.created_at.desc()).all()
    
    return get_formatted_posts(db, posts, current_user.id)
