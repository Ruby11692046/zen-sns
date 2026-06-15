from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, users

# テーブルを自動作成
Base.metadata.create_all(bind=engine)

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

# ルーターの登録
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "message": "Zen SNS API is running.",
        "docs": "/docs"
    }