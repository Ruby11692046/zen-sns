from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

class GoogleLoginRequest(BaseModel):
    credential: str


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = ""

class UserCreate(UserBase):
    google_id: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_muted: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserDetailResponse(UserResponse):
    following_count: int
    followers_count: int
    posts_count: int
    is_following_by_me: bool = False
    is_blocked_by_me: bool = False


# --- Post Schemas ---
class PostBase(BaseModel):
    content: str
    image_url: Optional[str] = None

class PostCreate(PostBase):
    parent_id: Optional[int] = None

class PostResponse(PostBase):
    id: int
    user_id: int
    user: UserResponse
    parent_id: Optional[int] = None
    created_at: datetime
    likes_count: int
    reposts_count: int
    replies_count: int
    is_liked_by_me: bool = False
    is_reposted_by_me: bool = False
    reposted_by: Optional[str] = None

    class Config:
        from_attributes = True


# --- Follow Schemas ---
class FollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Block Schemas ---
class BlockResponse(BaseModel):
    id: int
    blocker_id: int
    blocked_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    receiver_id: int
    sender_id: int
    sender_name: str
    sender_avatar_url: Optional[str] = None
    type: str  # 'like', 'repost', 'reply', 'follow'
    post_id: Optional[int] = None
    post_content_preview: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
