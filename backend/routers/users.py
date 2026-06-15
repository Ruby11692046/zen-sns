from fastapi import APIRouter, Depends
from models import User
from schemas import UserResponse
from dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    現在ログインしている自分のユーザー情報を取得する
    """
    return current_user
