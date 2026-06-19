from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Follow, Block, Post, Like, Repost
from schemas import UserResponse, UserDetailResponse, PostResponse, UserUpdate
from dependencies import get_current_user
from services.posts import get_blocked_user_ids, get_formatted_posts, format_post_response

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    現在ログインしている自分のユーザー情報を取得する。
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ログイン中のユーザーのプロフィール（名前、アバター画像、自己紹介）を更新する。
    """
    if body.name is not None:
        if len(body.name) > 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="名前は20文字以内で入力してください。"
            )
        current_user.name = body.name
    if body.username is not None:
        # usernameの重複チェック
        existing = db.query(User).filter(
            User.username == body.username,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="このユーザーネームはすでに使われています"
            )
        current_user.username = body.username
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url
    if body.bio is not None:
        if len(body.bio) > 500:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="自己紹介は500文字以内で入力してください。"
            )
        current_user.bio = body.bio
        
    db.commit()
    db.refresh(current_user)
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
        "username": user.username,
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
        
    # 1. ユーザーのオリジナル投稿を取得 (返信は除く)
    original_posts = db.query(Post).filter(
        Post.user_id == user_id,
        Post.parent_id == None
    ).all()
    
    formatted_original_posts = []
    for post in original_posts:
        formatted = format_post_response(db, post, current_user.id)
        formatted["reposted_by"] = None
        formatted["sort_time"] = post.created_at
        formatted_original_posts.append(formatted)
        
    # 2. ユーザーがリポストした投稿を取得
    reposts = db.query(Repost).filter(
        Repost.user_id == user_id
    ).all()
    
    reposted_posts_data = []
    reposter = db.query(User).filter(User.id == user_id).first()
    if reposter:
        for r in reposts:
            post = db.query(Post).filter(Post.id == r.post_id).first()
            if not post:
                continue
            # 投稿主がブロック関係にある場合は除外
            if post.user_id in blocked_ids:
                continue
                
            formatted = format_post_response(db, post, current_user.id)
            formatted["reposted_by"] = reposter.name
            formatted["sort_time"] = r.created_at
            reposted_posts_data.append(formatted)
            
    # 3. マージしてソート
    merged_posts = formatted_original_posts + reposted_posts_data
    merged_posts.sort(key=lambda x: x["sort_time"], reverse=True)
    # ソート用の一時キーを削除（PostResponseスキーマに定義されていないため明示的に削除）
    for post_data in merged_posts:
        post_data.pop("sort_time", None)

    return merged_posts


@router.get("/{user_id}/replies", response_model=list[PostResponse])
def get_user_replies(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    指定したユーザーの返信（コメント）一覧を取得する。
    """
    blocked_ids = get_blocked_user_ids(db, current_user.id)
    if user_id in blocked_ids:
        return []
        
    posts = db.query(Post).filter(
        Post.user_id == user_id,
        Post.parent_id != None
    ).order_by(Post.created_at.desc()).all()
    
    return get_formatted_posts(db, posts, current_user.id)


@router.get("/{user_id}/media", response_model=list[PostResponse])
def get_user_media(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    指定したユーザーの画像付き投稿一覧を取得する。
    """
    blocked_ids = get_blocked_user_ids(db, current_user.id)
    if user_id in blocked_ids:
        return []
        
    posts = db.query(Post).filter(
        Post.user_id == user_id,
        Post.image_url != None,
        Post.image_url != ""
    ).order_by(Post.created_at.desc()).all()
    
    return get_formatted_posts(db, posts, current_user.id)


@router.get("/{user_id}/likes", response_model=list[PostResponse])
def get_user_likes(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    指定したユーザーがいいねした投稿一覧を取得する。
    """
    blocked_ids = get_blocked_user_ids(db, current_user.id)
    if user_id in blocked_ids:
        return []
        
    # ユーザーがいいねした Like レコードを、作成日の降順で取得
    likes = db.query(Like).filter(Like.user_id == user_id).order_by(Like.created_at.desc()).all()
    
    posts = []
    for l in likes:
        post = db.query(Post).filter(Post.id == l.post_id).first()
        if post and post.user_id not in blocked_ids:
            posts.append(post)
            
    return get_formatted_posts(db, posts, current_user.id)
