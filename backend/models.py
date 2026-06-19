import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table, UniqueConstraint, LargeBinary
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    """
    ユーザー情報を表すモデル。
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    google_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)  # @ハンドル (例: user_123)
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True, default="")
    is_muted = Column(Boolean, default=False, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # リレーションシップ
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan", foreign_keys="[Post.user_id]")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    reposts = relationship("Repost", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} name={self.name}>"


class RefreshToken(Base):
    """
    JWT認証維持のためのリフレッシュトークンを管理するモデル。
    """
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # リレーションシップ
    user = relationship("User", back_populates="refresh_tokens")


class Post(Base):
    """
    投稿を表すモデル。
    親投稿ID (parent_id) を持つことで返信 (Reply) 構造を実現する。
    """
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # リレーションシップ
    user = relationship("User", back_populates="posts", foreign_keys=[user_id])
    parent = relationship("Post", remote_side=[id], backref="replies")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    reposts = relationship("Repost", back_populates="post", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="post", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Post id={self.id} user_id={self.user_id} content={self.content[:20]}...>"


class Follow(Base):
    """
    ユーザー間のフォロー関係を表すモデル。
    """
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follows_follower_following"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class Block(Base):
    """
    ユーザー間のブロック関係を表すモデル。
    """
    __tablename__ = "blocks"
    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_blocks_blocker_blocked"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    blocker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    blocked_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class Like(Base):
    """
    投稿に対するいいねを表すモデル。
    """
    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_likes_user_post"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # リレーションシップ
    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")


class Repost(Base):
    """
    投稿に対するリポストを表すモデル。
    """
    __tablename__ = "reposts"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_reposts_user_post"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # リレーションシップ
    user = relationship("User", back_populates="reposts")
    post = relationship("Post", back_populates="reposts")


class Notification(Base):
    """
    いいね・フォロー・リポスト・返信に関する通知を表すモデル。
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # 'like', 'repost', 'reply', 'follow'
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # リレーションシップ
    post = relationship("Post", back_populates="notifications")
    # 通知の送信者（N+1クエリ解消のためjoinedloadで一括取得できるよう定義）
    sender = relationship(
        "User",
        foreign_keys=[sender_id],
        primaryjoin="Notification.sender_id == User.id"
    )


class Media(Base):
    """
    画像データをデータベースに保存するためのモデル。
    """
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String, unique=True, index=True, nullable=False) # アクセス用URLキー (UUID)
    original_filename = Column(String, nullable=False)                 # 元のファイル名
    mime_type = Column(String, nullable=False)                         # MIMEタイプ (image/png等)
    data = Column(LargeBinary, nullable=False)                         # バイナリデータ
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Media id={self.id} filename={self.filename}>"
