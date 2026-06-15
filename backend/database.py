import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# データベース接続文字列の取得。デフォルトはローカルのSQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zen_sns.db")

# Supabase等から提供される "postgresql://" を "postgresql+psycopg://" に変換して SQLAlchemy 2.0 / psycopg v3 に対応させる
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# SQLiteの場合はスレッド接続チェックを無効にするオプションが必要
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# エンジンの作成
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=True  # 開発時にSQLクエリをログ出力するため有効化
)

# セッション作成関数
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# モデル定義のベースクラス
Base = declarative_base()

# 依存関係（Dependency Injection）用：リクエスト毎にDBセッションを取得・返却する
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
