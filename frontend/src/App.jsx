import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import Admin from './pages/Admin';
import Relations from './pages/Relations';
import api from './services/api';
import { authService } from './services/authService';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import './App.css';

// ログイン必須ルートの保護用コンポーネント
function ProtectedRoute({ currentUser, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// 管理者専用ルートの保護用コンポーネント
function AdminRoute({ currentUser, children }) {
  if (!currentUser || !currentUser.is_admin) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

// ログアウト処理用コンポーネント
function LogoutHandler({ handleLogout }) {
  useEffect(() => {
    handleLogout();
  }, [handleLogout]);
  return null;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // ログイン中のユーザー情報を管理するステート
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // トーストと確認モーダルのステート
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmState, setConfirmState] = useState({ show: false, message: '', onConfirm: null, onCancel: null, hasCancel: false });

  const reactNavigate = useNavigate();
  const location = useLocation();

  // パスから currentScreen にマッピングする
  const getCurrentScreenFromPath = (pathname) => {
    if (pathname.startsWith('/home') || pathname === '/') return 'timeline';
    if (pathname.startsWith('/search')) return 'search';
    if (pathname.startsWith('/notifications')) return 'notifications';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/report')) return 'report';
    if (pathname.startsWith('/terms')) return 'terms';
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/users/') && (pathname.endsWith('/following') || pathname.endsWith('/followers'))) return 'relations';
    if (pathname.startsWith('/users/')) return 'profile';
    if (pathname.startsWith('/posts/')) return 'postDetail';
    if (pathname.startsWith('/login')) return 'login';
    return 'timeline';
  };

  const currentScreen = getCurrentScreenFromPath(location.pathname);

  // 画面遷移関数
  const navigate = useCallback((screen, params = {}) => {
    switch (screen) {
      case 'login':
        reactNavigate('/login');
        break;
      case 'timeline':
        reactNavigate('/home');
        break;
      case 'search':
        reactNavigate('/search');
        break;
      case 'notifications':
        reactNavigate('/notifications');
        break;
      case 'settings':
        reactNavigate('/settings');
        break;
      case 'report':
        reactNavigate('/report');
        break;
      case 'terms':
        reactNavigate('/terms');
        break;
      case 'admin':
        reactNavigate('/admin');
        break;
      case 'profile':
        const uid = params.userId === 0 ? currentUser?.id : params.userId;
        if (uid) {
          reactNavigate(`/users/${uid}`);
        } else {
          reactNavigate('/home');
        }
        break;
      case 'relations':
        const relUid = params.userId === 0 ? currentUser?.id : params.userId;
        const defaultTab = params.tab || 'following';
        if (relUid) {
          reactNavigate(`/users/${relUid}/${defaultTab}`);
        } else {
          reactNavigate('/home');
        }
        break;
      case 'postDetail':
        reactNavigate(`/posts/${params.postId}`);
        break;
      default:
        reactNavigate('/home');
    }
    window.scrollTo(0, 0);
  }, [reactNavigate, currentUser]);

  // 前の画面に戻る関数
  const goBack = useCallback(() => {
    reactNavigate(-1);
  }, [reactNavigate]);

  // ログアウトのハンドラー
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error(err);
    } finally {
      setCurrentUser(null);
      reactNavigate('/login', { replace: true });
    }
  }, [reactNavigate]);

  // 未読通知数を取得する
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      const count = response.data.filter((n) => !n.is_read).length;
      setUnreadCount(count);
    } catch {
      // サイレントに失敗を無視
    }
  }, []);

  // 現在ログイン中のユーザー情報をバックエンドから取得して復元する
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      setCurrentUser(response.data);
      // ログイン完了時に /login やルートにいる場合は /home へリダイレクト
      if (location.pathname === '/login' || location.pathname === '/') {
        reactNavigate('/home', { replace: true });
      }
      // 未読通知数も取得
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to fetch current user profile:', err);
      // エラー時はセッションをクリアしてログイン画面へ
      handleLogout();
    } finally {
      setLoading(false);
    }
  }, [handleLogout, fetchUnreadCount, location.pathname, reactNavigate]);

  // ログイン成功時のハンドラー
  const handleLogin = () => {
    setLoading(true);
    fetchCurrentUser();
  };

  // 初期ロード時：すでに有効なトークンがあるかチェックおよびテーマ設定の適用
  useEffect(() => {
    // テーマの初期化
    const savedTheme = localStorage.getItem('zen-theme') || 'system';
    const root = document.documentElement;
    if (savedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.setAttribute('data-theme', 'light');
      }
    }

    if (authService.isAuthenticated()) {
      Promise.resolve().then(() => {
        fetchCurrentUser();
      });
    } else {
      Promise.resolve().then(() => {
        setLoading(false);
      });
    }

    // セッション切れイベントの監視
    const handleSessionExpired = () => {
      window.showToast?.('セッションの有効期限が切れました。再度ログインしてください。', 'error');
      handleLogout();
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, [fetchCurrentUser, handleLogout]);

  // トースト・確認モーダルのグローバルイベント設定
  useEffect(() => {
    const handleShowToast = (e) => {
      setToast({ show: true, message: e.detail.message, type: e.detail.type || 'success' });
    };
    const handleShowConfirm = (e) => {
      const { message, onConfirm, onCancel } = e.detail;
      const hasCancel = onCancel !== false;
      setConfirmState({
        show: true,
        message,
        onConfirm: () => {
          onConfirm?.();
          setConfirmState({ show: false, message: '', onConfirm: null, onCancel: null, hasCancel: false });
        },
        onCancel: () => {
          if (typeof onCancel === 'function') {
            onCancel();
          }
          setConfirmState({ show: false, message: '', onConfirm: null, onCancel: null, hasCancel: false });
        },
        hasCancel
      });
    };

    window.addEventListener('show-toast', handleShowToast);
    window.addEventListener('show-confirm', handleShowConfirm);

    window.showToast = (message, type = 'success') => {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
    };
    window.showConfirm = (message, onConfirm, onCancel) => {
      window.dispatchEvent(new CustomEvent('show-confirm', { detail: { message, onConfirm, onCancel } }));
    };

    return () => {
      window.removeEventListener('show-toast', handleShowToast);
      window.removeEventListener('show-confirm', handleShowConfirm);
      try {
        delete window.showToast;
        delete window.showConfirm;
      } catch {
        window.showToast = undefined;
        window.showConfirm = undefined;
      }
    };
  }, []);

  // 通知画面に移動したときに未読数をリセット
  useEffect(() => {
    if (currentScreen === 'notifications') {
      Promise.resolve().then(() => setUnreadCount(0));
    }
  }, [currentScreen]);

  // ロード中表示
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>読み込み中...</div>
      </div>
    );
  }

  // 共通レイアウトを表示するかどうか
  const showLayout = currentUser !== null && currentScreen !== 'login';

  const renderScreen = () => {
    return (
      <Routes>
        <Route path="/" element={<Navigate to={currentUser ? "/home" : "/login"} replace />} />
        <Route path="/login" element={currentUser ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/logout" element={<LogoutHandler handleLogout={handleLogout} />} />
        
        {/* 利用規約 */}
        <Route path="/terms" element={<Terms />} />

        {/* ログイン必須ルート */}
        <Route path="/home" element={
          <ProtectedRoute currentUser={currentUser}>
            <Timeline
              onNavigate={navigate}
              onOpenSidebar={() => setSidebarOpen(true)}
              user={currentUser}
            />
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute currentUser={currentUser}>
            <Search onNavigate={navigate} user={currentUser} />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute currentUser={currentUser}>
            <Notifications onNavigate={navigate} onViewed={() => setUnreadCount(0)} />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute currentUser={currentUser}>
            <Settings onNavigate={navigate} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute currentUser={currentUser}>
            <Report />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute currentUser={currentUser}>
            <Admin />
          </AdminRoute>
        } />
        <Route path="/users/:userId" element={
          <ProtectedRoute currentUser={currentUser}>
            <Profile
              onNavigate={navigate}
              onBack={goBack}
              user={currentUser}
            />
          </ProtectedRoute>
        } />
        <Route path="/users/:userId/following" element={
          <ProtectedRoute currentUser={currentUser}>
            <Relations
              defaultTab="following"
              onNavigate={navigate}
              onBack={goBack}
              user={currentUser}
            />
          </ProtectedRoute>
        } />
        <Route path="/users/:userId/followers" element={
          <ProtectedRoute currentUser={currentUser}>
            <Relations
              defaultTab="followers"
              onNavigate={navigate}
              onBack={goBack}
              user={currentUser}
            />
          </ProtectedRoute>
        } />
        <Route path="/posts/:postId" element={
          <ProtectedRoute currentUser={currentUser}>
            <PostDetail
              onNavigate={navigate}
              onBack={goBack}
              user={currentUser}
            />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to={currentUser ? "/home" : "/login"} replace />} />
      </Routes>
    );
  };

  if (!showLayout) {
    return (
      <div className="app-layout no-layout">
        <main className="app-main" style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
          <div className="app-content">
            {renderScreen()}
          </div>
        </main>
        {/* Global Overlays */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        )}
      </div>
    );
  }

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
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {/* Main */}
      <main className="app-main">
        <div className="app-content">
          {renderScreen()}
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <BottomNav currentScreen={currentScreen} onNavigate={navigate} unreadCount={unreadCount} user={currentUser} />

      {/* Global Overlays */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
      {confirmState.show && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={confirmState.hasCancel ? confirmState.onCancel : null}
        />
      )}
    </div>
  );
}
