from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Follow, Block, User
from schemas import UserResponse
from dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["follows"])

@router.post("/{user_id}/follow")
def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    対象ユーザーをフォローする。
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself."
        )
        
    # 対象ユーザーの存在確認
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # ブロック関係のチェック (ブロックしている、またはされている場合はフォロー不可)
    block_exists = db.query(Block).filter(
        ((Block.blocker_id == current_user.id) & (Block.blocked_id == user_id)) |
        ((Block.blocker_id == user_id) & (Block.blocked_id == current_user.id))
    ).first()
    
    if block_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow due to a block relationship."
        )
        
    # すでにフォローしているかチェック
    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()
    
    if existing_follow:
        return {"message": "Already following this user"}
        
    new_follow = Follow(
        follower_id=current_user.id,
        following_id=user_id
    )
    db.add(new_follow)
    db.commit()
    
    return {"message": "Successfully followed user"}


@router.delete("/{user_id}/follow")
def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    対象ユーザーのフォローを解除する。
    """
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()
    
    if not follow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not following this user."
        )
        
    db.delete(follow)
    db.commit()
    
    return {"message": "Successfully unfollowed user"}


@router.get("/{user_id}/followers", response_model=list[UserResponse])
def get_followers(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    指定ユーザーのフォロワー一覧を取得する。
    """
    # 存在チェック
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # フォロワーのUserオブジェクトを取得
    followers = db.query(User).join(
        Follow, User.id == Follow.follower_id
    ).filter(Follow.following_id == user_id).all()
    
    return followers


@router.get("/{user_id}/following", response_model=list[UserResponse])
def get_following(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    指定ユーザーがフォローしているユーザー一覧を取得する。
    """
    # 存在チェック
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # フォロー中ユーザーのUserオブジェクトを取得
    following = db.query(User).join(
        Follow, User.id == Follow.following_id
    ).filter(Follow.follower_id == user_id).all()
    
    return following
