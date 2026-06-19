from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from database import engine, Base, SessionLocal
from routers import auth, users, posts, timelines, follows, blocks, upload, search, notifications, admin, media

# テーブルを自動作成
Base.metadata.create_all(bind=engine)

# 既存ファイルのDB移行処理
def migrate_existing_images_to_db():
    db = SessionLocal()
    try:
        from models import Media, User, Post
        import mimetypes
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        static_uploads_dir = os.path.join(base_dir, "static", "uploads")
        
        if os.path.exists(static_uploads_dir):
            for filename in os.listdir(static_uploads_dir):
                if filename.startswith(".") or os.path.isdir(os.path.join(static_uploads_dir, filename)):
                    continue
                    
                exists = db.query(Media).filter(Media.filename == filename).first()
                if exists:
                    continue
                    
                file_path = os.path.join(static_uploads_dir, filename)
                try:
                    with open(file_path, "rb") as f:
                        data = f.read()
                        
                    mime_type, _ = mimetypes.guess_type(file_path)
                    if not mime_type:
                        ext = os.path.splitext(filename)[1].lower()
                        mime_map = {
                            ".png": "image/png",
                            ".jpg": "image/jpeg",
                            ".jpeg": "image/jpeg",
                            ".gif": "image/gif",
                            ".webp": "image/webp",
                            ".avif": "image/avif"
                        }
                        mime_type = mime_map.get(ext, "application/octet-stream")
                        
                    db_media = Media(
                        filename=filename,
                        original_filename=filename,
                        mime_type=mime_type,
                        data=data
                    )
                    db.add(db_media)
                    db.commit()
                    print(f"Migrated existing file to database: {filename}")
                except Exception as e:
                    db.rollback()
                    print(f"Failed to migrate file {filename} to DB: {e}")
                    
        # 既存DBレコードの /static/uploads/ パスを /media/ に自動置換
        users = db.query(User).filter(User.avatar_url.like("/static/uploads/%")).all()
        for u in users:
            u.avatar_url = u.avatar_url.replace("/static/uploads/", "/media/")
            
        posts = db.query(Post).filter(Post.image_url.like("/static/uploads/%")).all()
        for p in posts:
            p.image_url = p.image_url.replace("/static/uploads/", "/media/")
            
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to run startup migration: {e}")
    finally:
        db.close()

migrate_existing_images_to_db()

app = FastAPI(
    title="Zen SNS API",
    description="学内向けSNSのバックエンドAPI",
    version="1.0.0"
)

# CORS設定 (Reactフロントエンドからの接続を許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発のため一旦全許可。本番時は適切なドメインに制限
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 画像保存用のディレクトリを作成し、静的ファイルとしてマウント
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ルーターの登録
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")
app.include_router(timelines.router, prefix="/api/v1")
app.include_router(follows.router, prefix="/api/v1")
app.include_router(blocks.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(media.router)

from fastapi.responses import HTMLResponse

@app.get("/")
def read_root():
    return {
        "message": "Zen SNS API is running.",
        "docs": "/docs"
    }

@app.get("/posts/{post_id}", response_class=HTMLResponse)
def get_post_ogp(post_id: int):
    """
    外部共有用の OGP タグを含む HTML を返却し、ブラウザからのアクセスの場合は
    フロントエンドの投稿詳細 URL へクライアントサイドリダイレクトする。
    """
    db = SessionLocal()
    try:
        from models import Post
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return HTMLResponse(
                content="<!DOCTYPE html><html><body><h1>Post not found</h1></body></html>",
                status_code=404
            )
        
        # 投稿情報とメタデータの構築
        author_name = post.user.name if post.user else "ユーザー"
        content_preview = post.content[:200] + "..." if len(post.content) > 200 else post.content
        
        title = f"{author_name}さんの投稿 - Mist"
        description = content_preview
        
        # 画像の設定 (投稿画像があればそれ、なければアバター、それもなければデフォルト)
        image_url = None
        if post.image_url:
            image_url = post.image_url
        elif post.user and post.user.avatar_url:
            image_url = post.user.avatar_url
            
        base_url = "http://localhost:8000"
        full_image_url = f"{base_url}{image_url}" if image_url else f"{base_url}/static/default_avatar.png"
        page_url = f"http://localhost:8000/posts/{post_id}"
        
        html_content = f"""<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <!-- Open Graph Protocol (OGP) -->
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="article">
    <meta property="og:image" content="{full_image_url}">
    <meta property="og:url" content="{page_url}">
    <meta property="og:site_name" content="Mist">
    
    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">
    <meta name="twitter:image" content="{full_image_url}">
    
    <!-- クローラー以外の一般ブラウザはフロントエンド(Port 5173)へリダイレクト -->
    <script>
        window.location.href = "http://localhost:5173/posts/{post_id}";
    </script>
</head>
<body>
    <article>
        <h1>{title}</h1>
        <p>{description}</p>
        {f'<img src="{full_image_url}" alt="投稿画像">' if image_url else ''}
    </article>
</body>
</html>
"""
        return HTMLResponse(content=html_content)
    finally:
        db.close()