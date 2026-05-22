# モジュール設計

## フロントエンド

```
frontend/
├── index.html        # エントリーポイント
├── style.css         # グローバルスタイル
├── index.js          # アプリ初期化
├── router.js         # URLに応じてページを切り替えるSPAルーター
├── state.js          # ログインユーザー情報・テーマ設定などグローバル状態管理
├── pages/            # 各画面の描画ロジック
│   ├── login.js
│   ├── timeline.js
│   ├── post_detail.js
│   ├── profile.js
│   ├── search.js
│   ├── notifications.js
│   └── settings.js
├── components/       # 複数画面で使い回すUIパーツ
│   ├── sidebar.js
│   ├── post_card.js
│   └── post_form.js
├── api/              # バックエンドへのfetchをまとめる（画面側は直接fetchを書かない）
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── timelines.js
│   ├── notifications.js
│   ├── search.js
│   └── admin.js
└── utils/            # 汎用処理
    └── image.js      # 画像リサイズ・AVIF変換・ドット処理（wasm）
```

---

## バックエンド

```
backend/
├── main.py                  # FastAPIインスタンス生成・全routerの読み込み
├── routers/                 # エンドポイント定義（APIDesignのグループと対応）
│   ├── auth.py
│   ├── users.py
│   ├── posts.py
│   ├── timelines.py
│   ├── follows.py
│   ├── blocks.py
│   ├── notifications.py
│   ├── search.py
│   └── admin.py
├── services/                # ビジネスロジック（routersから分離）
│   ├── auth.py
│   ├── users.py
│   ├── posts.py
│   ├── timelines.py
│   ├── follows.py
│   ├── blocks.py
│   ├── notifications.py
│   ├── search.py
│   └── admin.py
├── models/                  # DBテーブル定義（SQLAlchemy ORMモデル）
│   ├── user.py
│   ├── post.py
│   ├── like.py
│   ├── repost.py
│   ├── follow.py
│   ├── block.py
│   ├── notification.py
│   └── mute.py
├── schemas/                 # リクエスト・レスポンスの型定義（Pydantic）
│   ├── user.py
│   ├── post.py
│   └── notification.py
├── core/                    # アプリ全体の設定・共通処理
│   ├── config.py            # 環境変数管理
│   ├── auth.py              # JWT検証・管理者照合
│   └── database.py          # DB接続
└── admin/                   # 管理者コマンドハンドラー（随時追加できる構造）
    └── command_handler.py   # /mute・/unmute・/mute list の処理
```