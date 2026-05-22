# API / URI 設計

## 基本方針

- REST API
- ベースURL: `/api/v1`
- 認証: JWTアクセストークン（Authorizationヘッダー）+ リフレッシュトークン
- レスポンス形式: JSON

---

## エンドポイント一覧

### 認証

| メソッド | URI | 概要 |
|----------|-----|------|
| POST | `/auth/google` | Google OAuthコールバック・トークン発行 |
| POST | `/auth/refresh` | アクセストークンをリフレッシュ |
| POST | `/auth/logout` | トークン破棄・ログアウト |

---

### ユーザー

| メソッド | URI | 概要 |
|----------|-----|------|
| GET | `/users/{user_id}` | ユーザー情報取得 |
| PATCH | `/users/me` | 自分のプロフィール編集（名前・アイコン・自己紹介の一部更新） |
| GET | `/users/{user_id}/posts` | ユーザーの投稿一覧 |
| GET | `/users/{user_id}/replies` | ユーザーの返信一覧 |
| GET | `/users/{user_id}/media` | ユーザーのメディア一覧 |
| GET | `/users/{user_id}/likes` | ユーザーのいいね一覧 |

---

### 投稿

| メソッド | URI | 概要 |
|----------|-----|------|
| POST | `/posts` | 投稿作成 |
| GET | `/posts/{post_id}` | 投稿詳細取得 |
| DELETE | `/posts/{post_id}` | 投稿削除 |
| POST | `/posts/{post_id}/likes` | いいね |
| DELETE | `/posts/{post_id}/likes` | いいね取消 |
| POST | `/posts/{post_id}/reposts` | リポスト |
| DELETE | `/posts/{post_id}/reposts` | リポスト取消 |
| POST | `/posts/{post_id}/replies` | 返信投稿 |

---

### タイムライン

| メソッド | URI | 概要 |
|----------|-----|------|
| GET | `/timelines/follow` | フォローTL |
| GET | `/timelines/recommend` | おすすめTL |
| GET | `/timelines/global` | 全体TL |

---

### フォロー

| メソッド | URI | 概要 |
|----------|-----|------|
| POST | `/users/{user_id}/follow` | フォロー |
| DELETE | `/users/{user_id}/follow` | アンフォロー |
| GET | `/users/{user_id}/followers` | フォロワー一覧 |
| GET | `/users/{user_id}/following` | フォロー中一覧 |

---

### ブロック

| メソッド | URI | 概要 |
|----------|-----|------|
| POST | `/users/{user_id}/block` | ブロック |
| DELETE | `/users/{user_id}/block` | ブロック解除 |

---

### 通知

| メソッド | URI | 概要 |
|----------|-----|------|
| GET | `/notifications` | 通知一覧取得 |

---

### 検索

| メソッド | URI | 概要 |
|----------|-----|------|
| GET | `/search?q={keyword}&type={type}` | 統合検索（type: `posts` / `users` / `media`） |

---

### 管理者コマンド

| メソッド | URI | 概要 |
|----------|-----|------|
| POST | `/admin/commands` | コマンド送信（`/mute (id)` / `/unmute (id)` / `/mute list`） |
| GET | `/admin/mutes` | ミュート中ユーザー一覧取得 |

---

## 備考

- `/admin/*` は管理者以外がアクセスしてもバックエンド側で弾く
- コマンド投稿はフロントエンドがコマンドフラグを付けて送信し、バックエンドで管理者照合後にコマンド処理。管理者でなければ通常投稿として処理する
- タイムラインはページネーションなし、新しい投稿が上に来る形式
- 画像アップロードは `/posts`・`/users/me` のリクエストにマルチパートで含める