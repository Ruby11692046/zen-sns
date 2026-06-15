import api, { tokenStorage } from './api';

export const authService = {
  /**
   * Google OAuthのcredentialを使ってログイン/新規登録する
   */
  loginWithGoogle: async (credential) => {
    try {
      const response = await api.post('/auth/google', { credential });
      const { access_token, refresh_token } = response.data;
      tokenStorage.setTokens(access_token, refresh_token);
      return response.data;
    } catch (error) {
      console.error('Failed to login via Google OAuth API:', error);
      throw error;
    }
  },

  /**
   * 開発環境向けのテストログイン。
   * Google OAuth設定がなくても、任意の文字列をID代わりにしてログインできるようにする。
   * 例: credential="test_admin" -> テスト管理者でログイン
   */
  loginWithTestAccount: async (testId) => {
    try {
      // credentialに "test_" 接頭辞をつけてバックエンドのダミーログイン処理を動かす
      const credential = `test_${testId}`;
      const response = await api.post('/auth/google', { credential });
      const { access_token, refresh_token } = response.data;
      tokenStorage.setTokens(access_token, refresh_token);
      return response.data;
    } catch (error) {
      console.error('Failed to login via test account:', error);
      throw error;
    }
  },

  /**
   * ログアウト処理
   */
  logout: async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', null, {
          params: { refresh_token: refreshToken },
        });
      }
    } catch (error) {
      console.error('Failed to logout on server:', error);
    } finally {
      tokenStorage.clearTokens();
    }
  },

  /**
   * ログイン状態の確認（アクセストークンの有無）
   */
  isAuthenticated: () => {
    return !!tokenStorage.getAccessToken();
  },
};
