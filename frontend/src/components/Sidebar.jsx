import { getMediaUrl } from '../services/api';
import {
  Home,
  Search,
  Bell,
  Settings,
  Flag,
  FileText,
  LogOut,
  X,
  ShieldAlert,
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'timeline', label: 'ホーム', icon: Home },
  { id: 'search', label: '検索', icon: Search },
  { id: 'notifications', label: '通知', icon: Bell },
  { id: 'settings', label: '設定', icon: Settings },
  { id: 'report', label: '報告', icon: Flag },
  { id: 'terms', label: '利用規約', icon: FileText },
];

export default function Sidebar({ currentScreen, onNavigate, user, isOpen, onClose, onLogout, unreadCount }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
      <div className="sidebar__inner">
        {/* Close button (mobile) */}
        <button className="sidebar__close" onClick={onClose} aria-label="サイドバーを閉じる">
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="sidebar__logo">
          <span className="sidebar__logo-text">Mist</span>
        </div>

        {/* Account */}
        <button
          className="sidebar__account"
          onClick={() => { onNavigate('profile', { userId: user?.id }); onClose?.(); }}
          id="sidebar-account"
        >
          <div className="avatar">
            <img src={(user?.avatar_url || user?.avatar) ? getMediaUrl(user.avatar_url || user.avatar) : '/default_avatar.png'} alt={user?.name || 'User'} />
          </div>
          <div className="sidebar__account-info">
            <span className="sidebar__account-name truncate">{user?.name || 'ユーザー'}</span>
            <span className="sidebar__account-id truncate">{user?.username ? `@${user.username}` : `@${user?.id || ''}`}</span>
          </div>
        </button>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {[
            ...NAV_ITEMS,
            ...(user?.is_admin ? [{ id: 'admin', label: '管理者', icon: ShieldAlert }] : [])
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar__nav-item ${isActive ? 'active' : ''}`}
                onClick={() => { onNavigate(item.id); onClose?.(); }}
                id={`sidebar-nav-${item.id}`}
              >
                <div className="sidebar__nav-icon">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="badge sidebar__nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </div>
                <span className="sidebar__nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button className="sidebar__logout" onClick={onLogout} id="sidebar-logout">
          <LogOut size={20} />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
