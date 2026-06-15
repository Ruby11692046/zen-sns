from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Block, Follow, User
from dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["blocks"])

@router.post("/{user_id}/block")
def block_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    対象ユーザーをブロックする。
    
    - ブロックと同時に、お互いのフォロー関係は自動的に強制解除されます。
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot block yourself."
        )
        
    # 対象ユーザーの存在確認
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # すでにブロックしているかチェック
    existing_block = db.query(Block).filter(
        Block.blocker_id == current_user.id,
        Block.blocked_id == user_id
    ).first()
    
    if existing_block:
        return {"message": "Already blocking this user"}
        
    # 新規ブロック作成
    new_block = Block(
        blocker_id=current_user.id,
        blocked_id=user_id
    )
    db.add(new_block)
    
    # 相互フォロー関係を強制解除
    db.query(Follow).filter(
        ((Follow.follower_id == current_user.id) & (Follow.following_id == user_id)) |
        ((Follow.follower_id == user_id) & (Follow.following_id == current_user.id))
    ).delete()
    
    db.commit()
    
    return {"message": "Successfully blocked user and removed mutual follows"}


@router.delete("/{user_id}/block")
def unblock_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    対象ユーザーのブロックを解除する。
    """
    block = db.query(Block).filter(
        Block.blocker_id == current_user.id,
        Block.blocked_id == user_id
    ).first()
    
    if not block:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not blocking this user."
        )
        
    db.delete(block)
    db.commit()
    
    return {"message": "Successfully unblocked user"}
