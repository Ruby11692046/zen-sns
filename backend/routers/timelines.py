from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Post, Follow
from schemas import PostResponse
from dependencies import get_current_user
from services.posts import get_blocked_user_ids, get_formatted_posts

router = APIRouter(prefix="/timelines", tags=["timelines"])

@router.get("/global", response_model=list[PostResponse])
def get_global_timeline(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    全体タイムラインを取得する。
    """
    blocked_ids = get_blocked_user_ids(db, current_user.id)
    query = db.query(Post)
    if blocked_ids:
        query = query.filter(Post.user_id.notin_(blocked_ids))
    posts = query.order_by(Post.created_at.desc()).all()
    return get_formatted_posts(db, posts, current_user.id)


@router.get("/recommend", response_model=list[PostResponse])
def get_recommend_timeline(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    おすすめタイムラインを取得する（検証中は全体TLと同じ結果を返します）。
    """
    return get_global_timeline(current_user, db)


@router.get("/follow", response_model=list[PostResponse])
def get_follow_timeline(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    フォロータイムラインを取得する。
    
    - 自分がフォローしているユーザーと自分自身の投稿を取得します。
    - ブロック関係にあるユーザーの投稿は除外されます。
    - 最新の投稿順で取得します。
    """
    # 自分がフォローしているユーザーのID一覧
    following_ids = [
        r[0] for r in db.query(Follow.following_id).filter(Follow.follower_id == current_user.id).all()
    ]
    
    # 自分も含める
    target_user_ids = following_ids + [current_user.id]
    
    # ブロック関係にあるユーザーを除外
    blocked_ids = get_blocked_user_ids(db, current_user.id)
    target_user_ids = [uid for uid in target_user_ids if uid not in blocked_ids]
    
    posts = db.query(Post).filter(
        Post.user_id.in_(target_user_ids)
    ).order_by(Post.created_at.desc()).all()
    
    return get_formatted_posts(db, posts, current_user.id)
