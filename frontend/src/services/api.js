import axios from 'axios';

// APIのベースURL（ローカル開発時のFastAPIポート。環境変数などから読み込めるように設計）
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ローカルストレージのヘルパー
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// リクエストインターセプター: 送信前にアクセストークンをヘッダーへ自動付与する
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// レスポンスインターセプター: 401 (Unauthorized) を検知した際に自動トークンリフレッシュを試みる
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 エラーであり、かつリクエストがリフレッシュAPI自体ではない場合
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      if (isRefreshing) {
        // 現在他のリクエストでリフレッシュ処理中の場合、完了を待つキューに追加する
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        tokenStorage.clearTokens();
        // リフレッシュトークンがない場合はログイン画面に遷移させる等のカスタムイベントを発行する
        window.dispatchEvent(new Event('auth_session_expired'));
        return Promise.reject(error);
      }

      try {
        // リフレッシュトークンを用いて新しいトークンをリクエスト
        // クエリパラメータまたはbodyで渡す。バックエンドの仕様に合わせてクエリパラメータで渡す
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
          params: { refresh_token: refreshToken },
        });

        const { access_token, refresh_token: new_refresh_token } = response.data;
        tokenStorage.setTokens(access_token, new_refresh_token);

        // キューに溜まっている他のリクエストを解決
        processQueue(null, access_token);
        
        // 今回失敗したリクエストを新しいトークンで再試行
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // リフレッシュ自体に失敗した場合はトークンをクリアしてログアウト状態にする
        processQueue(refreshError, null);
        tokenStorage.clearTokens();
        window.dispatchEvent(new Event('auth_session_expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  // /static/ で始まる相対パスをバックエンドのベースURLと結合
  const backendBase = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000';
  return `${backendBase}${path}`;
};

export default api;
