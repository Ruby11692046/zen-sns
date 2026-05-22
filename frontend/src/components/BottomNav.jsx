import { Home, Search, Bell, User } from 'lucide-react';
import './BottomNav.css';

const NAV_ITEMS = [
  { id: 'timeline', label: 'ホーム', icon: Home },
  { id: 'search', label: '検索', icon: Search },
  { id: 'notifications', label: '通知', icon: Bell, badge: 3 },
  { id: 'profile', label: 'マイページ', icon: User },
];

export default function BottomNav({ currentScreen, onNavigate }) {
  return (
    <nav className="bottom-nav" id="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          currentScreen === item.id ||
          (item.id === 'profile' && currentScreen === 'profile');
        return (
          <button
            key={item.id}
            className={`bottom-nav__item ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (item.id === 'profile') {
                onNavigate('profile', { userId: 0 });
              } else {
                onNavigate(item.id);
              }
            }}
            id={`bottom-nav-${item.id}`}
            aria-label={item.label}
          >
            <div className="bottom-nav__icon">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {item.badge && (
                <span className="badge bottom-nav__badge">{item.badge}</span>
              )}
            </div>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
