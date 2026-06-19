/**
 * モックデータ - デモ表示用のダミーデータ
 * 実際のバックエンド実装時にはAPIから取得するデータに置き換える
 */

export const MOCK_USERS = [];

// ログインユーザー
export const CURRENT_USER = {
  id: 0,
  name: '',
  userId: '',
  bio: '',
  avatar: null,
  followersCount: 0,
  followingCount: 0,
  isAdmin: false,
  isMuted: false,
};

export const MOCK_POSTS = [];
export const MOCK_REPLIES = [];
export const MOCK_NOTIFICATIONS = [];
export const MOCK_SEARCH_HISTORY = [];
