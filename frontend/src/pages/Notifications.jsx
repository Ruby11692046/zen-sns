import { Heart, Repeat2, MessageCircle, UserPlus } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
import './Notifications.css';

const NOTIF_CONFIG = {
  like: { icon: Heart, color: 'var(--color-like)', label: 'いいねしました' },
  repost: { icon: Repeat2, color: 'var(--color-repost)', label: 'リポストしました' },
  reply: { icon: MessageCircle, color: 'var(--color-reply)', label: '返信しました' },
  follow: { icon: UserPlus, color: 'var(--color-accent)', label: 'フォローしました' },
};

export default function Notifications({ onNavigate }) {
  return (
    <div className="notifications" id="notifications-screen">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-header__title">通知</h1>
      </header>

      {/* Notification list */}
      <div className="notifications__list">
        {MOCK_NOTIFICATIONS.map((notif) => {
          const config = NOTIF_CONFIG[notif.type];
          const Icon = config.icon;

          return (
            <button
              key={notif.id}
              className="notification-item"
              onClick={() => {
                if (notif.type === 'follow') {
                  onNavigate('profile', { userId: notif.user.id });
                } else {
                  onNavigate('postDetail', { postId: 1 });
                }
              }}
              id={`notification-${notif.id}`}
            >
              <div
                className="notification-item__icon"
                style={{ color: config.color }}
              >
                <Icon
                  size={18}
                  fill={notif.type === 'like' ? 'currentColor' : 'none'}
                />
              </div>
              <div className="avatar avatar--sm">
                {notif.user.name[0]}
              </div>
              <div className="notification-item__content">
                <p className="notification-item__text">
                  <strong>{notif.user.name}</strong>
                  <span className="notification-item__action">
                    が{config.label}
                  </span>
                </p>
                {notif.postPreview && (
                  <p className="notification-item__preview truncate">
                    {notif.postPreview}
                  </p>
                )}
              </div>
              <span className="notification-item__time">{notif.createdAt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
