from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Post, Follow, Repost, User
from schemas import PostResponse
from dependencies import get_current_user
from services.posts import get_blocked_user_ids, get_formatted_posts, format_post_response

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
    
    # 1. 全てのオリジナル投稿を取得 (返信は除く、ブロックユーザーも除く)
    query = db.query(Post).filter(Post.parent_id == None)
    if blocked_ids:
        query = query.filter(Post.user_id.notin_(blocked_ids))
    original_posts = query.all()
    
    formatted_original_posts = []
    for post in original_posts:
        formatted = format_post_response(db, post, current_user.id)
        formatted["reposted_by"] = None
        formatted["sort_time"] = post.created_at
        formatted_original_posts.append(formatted)
        
    # 2. 全てのリポストを取得 (ブロックユーザーのリポスト、およびブロックユーザーの投稿は除く)
    reposts_query = db.query(Repost)
    if blocked_ids:
        reposts_query = reposts_query.filter(Repost.user_id.notin_(blocked_ids))
    reposts = reposts_query.all()
    
    reposted_posts_data = []
    for r in reposts:
        post = db.query(Post).filter(Post.id == r.post_id).first()
        if not post:
            continue
        # 投稿主がブロック関係にある場合は除外
        if post.user_id in blocked_ids:
            continue
        # リポストした人の情報を取得
        reposter = db.query(User).filter(User.id == r.user_id).first()
        if not reposter:
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
    - フォローしているユーザーがリポストした投稿もタイムラインに含まれます。
    - 最新の投稿順（リポストはリポストした日時順）で取得します。
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
    
    # 1. オリジナル投稿を取得 (返信は除く)
    original_posts = db.query(Post).filter(
        Post.user_id.in_(target_user_ids),
        Post.parent_id == None
    ).all()
    
    formatted_original_posts = []
    for post in original_posts:
        formatted = format_post_response(db, post, current_user.id)
        formatted["reposted_by"] = None
        # ソート用一時キー
        formatted["sort_time"] = post.created_at
        formatted_original_posts.append(formatted)
        
    # 2. ターゲットユーザー達のリポストを取得
    reposts = db.query(Repost).filter(
        Repost.user_id.in_(target_user_ids)
    ).all()
    
    reposted_posts_data = []
    for r in reposts:
        post = db.query(Post).filter(Post.id == r.post_id).first()
        if not post:
            continue
        # 投稿主がブロック関係にある場合は除外
        if post.user_id in blocked_ids:
            continue
        # リポストした人の情報を取得
        reposter = db.query(User).filter(User.id == r.user_id).first()
        if not reposter:
            continue
            
        formatted = format_post_response(db, post, current_user.id)
        formatted["reposted_by"] = reposter.name
        # ソート用一時キー
        formatted["sort_time"] = r.created_at
        reposted_posts_data.append(formatted)
        
    # 3. マージしてソート
    merged_posts = formatted_original_posts + reposted_posts_data
    merged_posts.sort(key=lambda x: x["sort_time"], reverse=True)
    # ソート用の一時キーを削除（PostResponseスキーマに定義されていないため明示的に削除）
    for post_data in merged_posts:
        post_data.pop("sort_time", None)

    # PostResponseスキーマが許容しない不要な一時キーは自動的に切り捨てられる
    return merged_posts
