import { Home, Search, Bell, User, ShieldAlert } from 'lucide-react';
import './BottomNav.css';

const BASE_NAV_ITEMS = [
  { id: 'timeline', label: 'ホーム', icon: Home },
  { id: 'search', label: '検索', icon: Search },
  { id: 'notifications', label: '通知', icon: Bell },
  { id: 'profile', label: 'マイページ', icon: User },
];

export default function BottomNav({ currentScreen, onNavigate, unreadCount, user }) {
  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(user?.is_admin ? [{ id: 'admin', label: '管理者', icon: ShieldAlert }] : []),
  ];

  return (
    <nav className="bottom-nav" id="bottom-nav">
      {navItems.map((item) => {
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
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="badge bottom-nav__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </div>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
