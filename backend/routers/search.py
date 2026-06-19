from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import User, Post
from schemas import PostResponse, UserResponse
from dependencies import get_current_user
from services.posts import get_blocked_user_ids, get_formatted_posts
from typing import List, Union

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=Union[List[PostResponse], List[UserResponse]])
def search(
    q: str = Query("", description="検索キーワード"),
    type: str = Query("posts", description="検索タイプ ('posts' または 'accounts')"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    投稿またはアカウントを部分一致で検索する。
    
    - ブロックしている、またはブロックされているユーザーの投稿およびアカウントは結果から除外されます。
    """
    if not q.strip():
        return []

    # ブロックされているユーザーID一覧を取得
    blocked_ids = get_blocked_user_ids(db, current_user.id)

    if type == "posts":
        # 1. 投稿の検索
        # ブロック関係にないユーザーの投稿で、本文がキーワードを含むものを検索
        posts_query = db.query(Post).filter(Post.content.like(f"%{q}%"))
        if blocked_ids:
            posts_query = posts_query.filter(~Post.user_id.in_(blocked_ids))
        
        posts = posts_query.order_by(Post.created_at.desc()).all()
        return get_formatted_posts(db, posts, current_user.id)
        
    elif type == "accounts":
        # 2. アカウントの検索
        # アカウント名またはメールアドレス（学内アカウントID）にキーワードを含むユーザーを検索
        # 相互ブロック関係にあるユーザーは除外
        users_query = db.query(User).filter(
            or_(
                User.name.like(f"%{q}%"),
                User.email.like(f"%{q}%")
            )
        )
        if blocked_ids:
            users_query = users_query.filter(~User.id.in_(blocked_ids))
            
        users = users_query.order_by(User.name.asc()).all()
        return users
        
    else:
        return []
