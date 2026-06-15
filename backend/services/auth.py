import os
import datetime
from typing import Optional, Any
import jwt
import requests
from fastapi import HTTPException, status

# JWT設定（環境変数から読み込み、デフォルト値を用意）
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-change-in-production")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "super-refresh-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1日
REFRESH_TOKEN_EXPIRE_DAYS = 30  # 30日


def create_access_token(subject: str, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """
    アクセストークン（短寿命）を作成する
    """
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: str, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """
    リフレッシュトークン（長寿命）を作成する
    """
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str) -> Optional[str]:
    """
    アクセストークンを検証し、ユーザーID(sub)を返す
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def verify_refresh_token(token: str) -> Optional[str]:
    """
    リフレッシュトークンを検証し、ユーザーID(sub)を返す
    """
    try:
        payload = jwt.decode(token, JWT_REFRESH_SECRET, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def verify_university_domain(email: str, hd: Optional[str] = None) -> bool:
    """
    学内ドメイン（@以降にzen.ac.jpが含まれる）のみを許可する検証フック。
    
    Google OAuthのhd（Hosted Domain）パラメータ、またはメールアドレスのドメイン部分を検査し、
    'zen.ac.jp' が含まれる（等しい、あるいはサブドメインである）場合のみTrueを返します。
    """
    # 1. Google OAuthのhdパラメータのチェック
    if hd:
        if hd == "zen.ac.jp" or hd.endswith(".zen.ac.jp"):
            return True
            
    # 2. メールアドレスのドメインチェック (@以降にzen.ac.jpが含まれるか)
    if "@" in email:
        domain = email.split("@")[-1]
        return domain == "zen.ac.jp" or domain.endswith(".zen.ac.jp")
        
    return False


def verify_google_credential(credential: str) -> dict[str, Any]:
    """
    フロントエンドから送られてきたGoogle OAuthのcredential (ID Token) を検証し、
    デコードされたユーザー情報を取得する。
    """
    try:
        # Googleの認証エンドポイントを利用してトークン情報を検証する
        response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": credential},
            timeout=10
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google credential"
            )
        
        token_info = response.json()
        
        # 必要な情報の存在確認
        if "sub" not in token_info or "email" not in token_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token missing essential user info"
            )
            
        # 学内ドメイン制限チェック（TODOフックの呼び出し）
        email = token_info.get("email", "")
        hd = token_info.get("hd")  # Hosted Domain パラメータ
        
        if not verify_university_domain(email, hd):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted to university members only"
            )
            
        return token_info
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to reach Google token verification service: {str(e)}"
        )
