from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Post, User
from schemas import PostCreate, PostResponse
from dependencies import get_current_user
from services.posts import format_post_response

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
        
    # 2. 管理者コマンドの簡易判定（チェックポイント5のフック）
    # 先頭が '/' の場合、管理者コマンドとして処理できるか試みる
    if body.content.startswith("/"):
        # TODO: 管理者コマンドハンドラーの呼び出し
        # 今はモックとして通常投稿として処理を継続
        pass
        
    # 3. 投稿の保存
    new_post = Post(
        user_id=current_user.id,
        content=body.content,
        image_url=body.image_url,
        parent_id=body.parent_id
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
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
