import { useState, useCallback } from 'react';
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
import { CURRENT_USER } from './data/mockData';
import './App.css';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [screenParams, setScreenParams] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);

  const navigate = useCallback((screen, params = {}) => {
    setHistory((prev) => [...prev, { screen: currentScreen, params: screenParams }]);
    setCurrentScreen(screen);
    setScreenParams(params);
    window.scrollTo(0, 0);
  }, [currentScreen, screenParams]);

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

  const handleLogin = () => {
    navigate('timeline');
  };

  // Login screen has no sidebar/nav
  if (currentScreen === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'timeline':
        return (
          <Timeline
            onNavigate={navigate}
            onOpenSidebar={() => setSidebarOpen(true)}
            user={CURRENT_USER}
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
        return <Settings onNavigate={navigate} />;
      case 'report':
        return <Report />;
      case 'terms':
        return <Terms />;
      default:
        return (
          <Timeline
            onNavigate={navigate}
            onOpenSidebar={() => setSidebarOpen(true)}
            user={CURRENT_USER}
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
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={navigate}
          user={CURRENT_USER}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

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
