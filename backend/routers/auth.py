import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, RefreshToken
from schemas import Token, GoogleLoginRequest
from services.auth import (
    verify_google_credential,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/google", response_model=Token)
def login_google(body: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Google OAuthログイン / 新規登録エンドポイント
    
    フロントから送られてきた `credential` (ID Token) を検証し、
    対応するユーザーがDBに存在しなければ新規作成、存在すればログイン処理を行います。
    """
    credential = body.credential
    
    # 開発環境向け：デバッグやテストを容易にするためのダミートークン対応
    # credential が "test-user-id" 等で始まる場合は、ダミーログインとして扱う
    if credential.startswith("test_"):
        # ダミーのユーザー情報を作成
        user_id_str = credential.replace("test_", "", 1)
        google_id = f"test_google_{user_id_str}"
        email = f"{user_id_str}@zen.ac.jp"
        # hd (hosted domain) はダミー
        name = f"Test User {user_id_str}"
        picture = None
        
        token_info = {
            "sub": google_id,
            "email": email,
            "name": name,
            "picture": picture
        }
    else:
        # 本番/通常: GoogleのID Token検証
        token_info = verify_google_credential(credential)
        
    google_id = token_info.get("sub")
    email = token_info.get("email")
    
    # ユーザーがDBに存在するか検索
    user = db.query(User).filter(User.google_id == google_id).first()
    
    if not user:
        # 新規作成（会員登録フロー）
        # 要件定義: 「初回ログイン時はサーバー側でDBの連番IDをユーザーIDとして自動採番し、新規ユーザーを作成。初期表示名はユーザーID、アイコンはなし（空）」
        # 一旦プレースホルダーで作成し、ID決定後に更新する
        user = User(
            google_id=google_id,
            email=email,
            name="TemporaryName",  # 後でID付きに更新
            avatar_url=None,       # アイコンはなし（空）
            bio=""
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # 初期表示名は「ユーザーID」にする (例: "User 123" または単に "123")
        user.name = f"User {user.id}"
        db.commit()
        db.refresh(user)
        
    # トークンの生成
    access_token = create_access_token(subject=str(user.id))
    refresh_token_val = create_refresh_token(subject=str(user.id))
    
    # リフレッシュトークンをDBに保存（古いものは削除して複数端末での重複を防ぐ、または端末毎に持つ設計）
    # ここではシンプルに古いトークンを掃除して新規保存
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
    
    # 有効期限の計算
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_val,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_val,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """
    アクセストークンをリフレッシュするエンドポイント
    """
    user_id = verify_refresh_token(refresh_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    # DB内でトークンの存在を確認
    db_token = db.query(RefreshToken).filter(
        RefreshToken.user_id == int(user_id),
        RefreshToken.token == refresh_token
    ).first()
    
    if not db_token or db_token.expires_at < datetime.datetime.utcnow():
        if db_token:
            db.delete(db_token)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked"
        )
        
    # 新しいアクセストークンとリフレッシュトークンを発行 (回転させる)
    new_access_token = create_access_token(subject=user_id)
    new_refresh_token_val = create_refresh_token(subject=user_id)
    
    # DBを更新
    db_token.token = new_refresh_token_val
    db_token.expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    db.commit()
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token_val,
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(refresh_token: str, db: Session = Depends(get_db)):
    """
    ログアウト処理（リフレッシュトークンの破棄）
    """
    db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if db_token:
        db.delete(db_token)
        db.commit()
        
    return {"message": "Successfully logged out"}
