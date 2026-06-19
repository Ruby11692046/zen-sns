import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Post, User, Like, Repost, Notification
from schemas import PostCreate, PostResponse
from dependencies import get_current_user
from services.posts import format_post_response, get_formatted_posts

router = APIRouter(prefix="/posts", tags=["posts"])

@router.post("", response_model=PostResponse)
def create_post(
    body: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    新規投稿を作成する。
    
    - ユーザーが管理者ミュートされている場合、投稿は保存されず弾かれます。
    - 投稿先頭に `/` がある場合、管理者コマンド判定を行います（チェックポイント5で詳細実装）。
    """
    # 1. 管理者ミュート状態のチェック
    if current_user.is_muted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is muted by administrator and cannot create posts."
        )

    # 2. 投稿文字数のチェック (300文字制限)
    if len(body.content) > 300:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="投稿は300文字以内で入力してください。"
        )

    # 3. 過去24時間以内の投稿数制限 (1日100回)
    one_day_ago = datetime.datetime.utcnow() - datetime.timedelta(days=1)
    daily_posts_count = db.query(Post).filter(
        Post.user_id == current_user.id,
        Post.created_at >= one_day_ago
    ).count()

    if daily_posts_count >= 100:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="1日の投稿上限（100回）に達しました。明日また投稿してください。"
        )
        
    # 4. 投稿の保存
    new_post = Post(
        user_id=current_user.id,
        content=body.content,
        image_url=body.image_url,
        parent_id=body.parent_id
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # 4. 返信（Reply）の場合、親投稿の所有者に通知を自動作成
    if new_post.parent_id:
        parent_post = db.query(Post).filter(Post.id == new_post.parent_id).first()
        if parent_post and parent_post.user_id != current_user.id:
            notification = Notification(
                receiver_id=parent_post.user_id,
                sender_id=current_user.id,
                type="reply",
                post_id=new_post.id,
                is_read=False
            )
            db.add(notification)
            db.commit()
    
    return format_post_response(db, new_post, current_user.id)


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    指定した自分の投稿を削除する。
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
        
    # 自分の投稿であるかチェック (管理者は他人の投稿も消せるようにするならここで条件追加)
    if post.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this post."
        )
        
    db.delete(post)
    db.commit()
    
    return {"message": "Post successfully deleted"}


@router.get("/{post_id}", response_model=PostResponse)
def get_post_detail(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    指定した投稿の詳細情報を1件取得する。
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    return format_post_response(db, post, current_user.id)


@router.get("/{post_id}/replies", response_model=list[PostResponse])
def get_post_replies(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    指定した投稿に対する返信（コメント）一覧を取得する。
    """
    replies = db.query(Post).filter(
        Post.parent_id == post_id
    ).order_by(Post.created_at.asc()).all()
    
    return get_formatted_posts(db, replies, current_user.id)


@router.post("/{post_id}/likes")
def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    投稿に「いいね」をする。
    
    - 二重いいねは防止。
    - 自分の投稿以外であれば、投稿者に通知（type='like'）を作成。
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
        
    # 重複チェック
    existing_like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.post_id == post_id
    ).first()
    
    if existing_like:
        return {"message": "Already liked"}
        
    new_like = Like(user_id=current_user.id, post_id=post_id)
    db.add(new_like)
    db.commit()
    
    # 自分の投稿以外の場合、通知を自動生成
    if post.user_id != current_user.id:
        notification = Notification(
            receiver_id=post.user_id,
            sender_id=current_user.id,
            type="like",
            post_id=post_id,
            is_read=False
        )
        db.add(notification)
        db.commit()
        
    return {"message": "Liked successfully"}


@router.delete("/{post_id}/likes")
def unlike_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    投稿の「いいね」を解除する。
    """
    like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.post_id == post_id
    ).first()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found"
        )
        
    db.delete(like)
    db.commit()
    return {"message": "Unliked successfully"}


@router.post("/{post_id}/reposts")
def repost_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    投稿を「リポスト」する。
    
    - 二重リポストは防止。
    - 自分の投稿以外であれば、投稿者に通知（type='repost'）を作成。
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
        
    # 重複チェック
    existing_repost = db.query(Repost).filter(
        Repost.user_id == current_user.id,
        Repost.post_id == post_id
    ).first()
    
    if existing_repost:
        return {"message": "Already reposted"}
        
    new_repost = Repost(user_id=current_user.id, post_id=post_id)
    db.add(new_repost)
    db.commit()
    
    # 自分の投稿以外の場合、通知を自動生成
    if post.user_id != current_user.id:
        notification = Notification(
            receiver_id=post.user_id,
            sender_id=current_user.id,
            type="repost",
            post_id=post_id,
            is_read=False
        )
        db.add(notification)
        db.commit()
        
    return {"message": "Reposted successfully"}


@router.delete("/{post_id}/reposts")
def unrepost_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    投稿の「リポスト」を解除する。
    """
    repost = db.query(Repost).filter(
        Repost.user_id == current_user.id,
        Repost.post_id == post_id
    ).first()
    
    if not repost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repost not found"
        )
        
    db.delete(repost)
    db.commit()
    return {"message": "Unreposted successfully"}
