from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any
from models import Post, Like, Repost, Block, User
from schemas import PostResponse, UserResponse

def get_blocked_user_ids(db: Session, user_id: int) -> list[int]:
    """
    指定ユーザーがブロックしている、または指定ユーザーをブロックしているユーザーIDの一覧を取得する。
    """
    # 自分がブロックしているユーザー
    blocking = db.query(Block.blocked_id).filter(Block.blocker_id == user_id).all()
    # 自分をブロックしているユーザー
    blocked_by = db.query(Block.blocker_id).filter(Block.blocked_id == user_id).all()
    
    # 平坦なリストに変換
    ids = [r[0] for r in blocking] + [r[0] for r in blocked_by]
    return list(set(ids))


def format_post_response(db: Session, post: Post, current_user_id: int) -> dict[str, Any]:
    """
    単一の Post モデルをメタデータ（いいね数、リポスト数、返信数、自分がアクションしたか）付きの辞書にフォーマットする。
    """
    likes_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
    reposts_count = db.query(func.count(Repost.id)).filter(Repost.post_id == post.id).scalar() or 0
    
    # replies_count は parent_id == post.id である投稿の数
    replies_count = db.query(func.count(Post.id)).filter(Post.parent_id == post.id).scalar() or 0
    
    # 自分がいいね/リポストしたか
    is_liked = db.query(Like).filter(Like.post_id == post.id, Like.user_id == current_user_id).first() is not None
    is_reposted = db.query(Repost).filter(Repost.post_id == post.id, Repost.user_id == current_user_id).first() is not None
    
    # ユーザーモデルの変換
    user_res = UserResponse.model_validate(post.user)
    
    return {
        "id": post.id,
        "user_id": post.user_id,
        "user": user_res,
        "content": post.content,
        "image_url": post.image_url,
        "parent_id": post.parent_id,
        "created_at": post.created_at,
        "likes_count": likes_count,
        "reposts_count": reposts_count,
        "replies_count": replies_count,
        "is_liked_by_me": is_liked,
        "is_reposted_by_me": is_reposted
    }


def get_formatted_posts(db: Session, posts: list[Post], current_user_id: int) -> list[dict[str, Any]]:
    """
    投稿リストを一括でフォーマットする
    """
    return [format_post_response(db, post, current_user_id) for post in posts]
