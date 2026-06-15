import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Timeline from './pages/Timeline';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Report from './pages/Report';
import Terms from './pages/Terms';
import api, { tokenStorage } from './services/api';
import { authService } from './services/authService';
import './App.css';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [screenParams, setScreenParams] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  
  // ログイン中のユーザー情報を管理するステート
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 画面遷移関数
  const navigate = useCallback((screen, params = {}) => {
    setHistory((prev) => [...prev, { screen: currentScreen, params: screenParams }]);
    setCurrentScreen(screen);
    setScreenParams(params);
    window.scrollTo(0, 0);
  }, [currentScreen, screenParams]);

  // 前の画面に戻る関数
  const goBack = useCallback(() => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setCurrentScreen(prev.screen);
      setScreenParams(prev.params);
    } else {
      setCurrentScreen('timeline');
      setScreenParams({});
    }
  }, [history]);

  // 現在ログイン中のユーザー情報をバックエンドから取得して復元する
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      setCurrentUser(response.data);
      setCurrentScreen('timeline');
    } catch (err) {
      console.error('Failed to fetch current user profile:', err);
      // エラー時はセッションをクリアしてログイン画面へ
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // ログイン成功時のハンドラー
  const handleLogin = () => {
    setLoading(true);
    fetchCurrentUser();
  };

  // ログアウトのハンドラー
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error(err);
    } finally {
      setCurrentUser(null);
      setCurrentScreen('login');
      setHistory([]);
    }
  };

  // 初期ロード時：すでに有効なトークンがあるかチェック
  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    // セッション切れイベントの監視
    const handleSessionExpired = () => {
      alert('セッションの有効期限が切れました。再度ログインしてください。');
      handleLogout();
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  // ロード中表示
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>読み込み中...</div>
      </div>
    );
  }

  // ログイン画面はサイドバーやナビゲーションを表示しない
  if (currentScreen === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  // 画面のレンダリング
  const renderScreen = () => {
    switch (currentScreen) {
      case 'timeline':
        return (
          <Timeline
            onNavigate={navigate}
            onOpenSidebar={() => setSidebarOpen(true)}
            user={currentUser}
          />
        );
      case 'postDetail':
        return (
          <PostDetail
            postId={screenParams.postId}
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      case 'profile':
        return (
          <Profile
            userId={screenParams.userId}
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      case 'search':
        return <Search onNavigate={navigate} />;
      case 'notifications':
        return <Notifications onNavigate={navigate} />;
      case 'settings':
        // 設定画面でログアウト処理を渡せるようにする
        return <Settings onNavigate={navigate} onLogout={handleLogout} />;
      case 'report':
        return <Report />;
      case 'terms':
        return <Terms />;
      default:
        return (
          <Timeline
            onNavigate={navigate}
            onOpenSidebar={() => setSidebarOpen(true)}
            user={currentUser}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay active"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={navigate}
        user={currentUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="app-main">
        <div className="app-content">
          {renderScreen()}
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <BottomNav currentScreen={currentScreen} onNavigate={navigate} />
    </div>
  );
}
