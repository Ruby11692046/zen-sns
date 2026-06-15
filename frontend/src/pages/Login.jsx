import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import './Login.css';

export default function Login({ onLogin }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // テストログイン用の状態
  const [showTestLogin, setShowTestLogin] = useState(false);
  const [testId, setTestId] = useState('');

  // Google OAuth のクライアントID取得
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Google認証成功時のコールバック
  const handleCredentialResponse = async (response) => {
    setLoading(true);
    setError(null);
    try {
      await authService.loginWithGoogle(response.credential);
      onLogin?.();
    } catch (err) {
      console.error(err);
      setError('Googleログインに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // クライアントIDが設定されていない場合はGoogleログインの初期化を行わない
    if (!GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set. Google Sign-In button will be disabled.');
      return;
    }

    // Google APIのロード待ち
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          const buttonParent = document.getElementById('google-signin-btn-container');
          if (buttonParent) {
            window.google.accounts.id.renderButton(buttonParent, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signin_with',
              shape: 'rectangular',
            });
          }

          // One Tapログインのプロンプトを表示
          window.google.accounts.id.prompt();
        } catch (err) {
          console.error('Failed to render Google login button:', err);
        }
      }
    };

    // すでにロードされていれば初期化、そうでなければ少し待つ
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', initializeGoogleSignIn);
      }
    }
  }, [GOOGLE_CLIENT_ID]);

  // テストアカウントログインのハンドラー
  const handleTestLoginSubmit = async (e) => {
    e.preventDefault();
    if (!testId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await authService.loginWithTestAccount(testId.trim());
      onLogin?.();
    } catch (err) {
      console.error(err);
      setError('テストログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login" id="login-screen">
      {/* Background decoration */}
      <div className="login__bg">
        <div className="login__bg-circle login__bg-circle--1" />
        <div className="login__bg-circle login__bg-circle--2" />
        <div className="login__bg-circle login__bg-circle--3" />
      </div>

      <div className="login__container">
        {/* Logo */}
        <div className="login__brand">
          <h1 className="login__logo">ZEN</h1>
          <p className="login__tagline">つながる、棲み分ける、楽しむ。</p>
        </div>

        {/* Card */}
        <div className="login__card">
          <h2 className="login__card-title">ログイン</h2>
          <p className="login__card-desc">
            学校アカウントでログインしてください
          </p>

          {error && <div className="login__error" style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}

          {/* Googleログインボタンのコンテナ */}
          {GOOGLE_CLIENT_ID ? (
            <div id="google-signin-btn-container" className="login__google-container" style={{ minHeight: '44px' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Google OAuthクライアントIDが設定されていません。<br />下の「開発用テストログイン」を使用してください。
            </div>
          )}

          <p className="login__note">
            ※ 学校ドメイン（@xxx.ac.jp）のアカウントのみ利用可能です（検証中は一時的に制限が緩和されています）
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />

          {/* 開発用テストログイントグル */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowTestLogin(!showTestLogin)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {showTestLogin ? 'テストログインを閉じる' : '⚙️ 開発用テストログイン'}
            </button>
          </div>

          {showTestLogin && (
            <form onSubmit={handleTestLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                placeholder="テストユーザーID (例: alice, user1)"
                required
                disabled={loading}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-strong)',
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                }}
              />
              <button
                type="submit"
                disabled={loading || !testId.trim()}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--color-accent)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'ログイン中...' : 'テストアカウントでログイン'}
              </button>
            </form>
          )}
        </div>

        <p className="login__footer">
          ログインすることで<a href="#terms">利用規約</a>に同意したとみなされます
        </p>
      </div>
    </div>
  );
}
