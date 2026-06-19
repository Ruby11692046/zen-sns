import { Heart, Repeat2, MessageCircle, UserPlus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import api, { getMediaUrl } from '../services/api';
import { formatDateTime } from '../utils/postUtils';
import './Notifications.css';

const NOTIF_CONFIG = {
  like: { icon: Heart, color: 'var(--color-like)', label: 'いいねしました' },
  repost: { icon: Repeat2, color: 'var(--color-repost)', label: 'リポストしました' },
  reply: { icon: MessageCircle, color: 'var(--color-reply)', label: '返信しました' },
  follow: { icon: UserPlus, color: 'var(--color-accent)', label: 'フォローしました' },
};

export default function Notifications({ onNavigate, onViewed }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchNotifications = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications');
      const formatted = response.data.map((n) => ({
        id: n.id,
        type: n.type,
        senderId: n.sender_id,
        user: {
          id: n.sender_id,
          name: n.sender_name,
          avatar: n.sender_avatar_url,
        },
        postPreview: n.post_content_preview,
        postId: n.post_id,
        isRead: n.is_read,
        createdAt: formatDateTime(n.created_at),
      }));
      setNotifications(formatted);

      // 未読通知があれば既読化
      const hasUnread = formatted.some((n) => !n.isRead);
      if (hasUnread) {
        await api.patch('/notifications/read');
        // 親コンポーネントに既読完了を通知
        onViewed?.();
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('通知の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [onViewed]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchNotifications();
    });
  }, [fetchNotifications]);

  return (
    <div className="notifications" id="notifications-screen">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-header__title">通知</h1>
      </header>

      {/* Notification list */}
      <div className="notifications__list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            読み込み中...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-item" style={{ justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
            通知はありません
          </div>
        ) : (
          notifications.map((notif) => {
            const config = NOTIF_CONFIG[notif.type];
            const Icon = config.icon;

            return (
              <button
                key={notif.id}
                className={`notification-item ${!notif.isRead ? 'notification-item--unread' : ''}`}
                onClick={() => {
                  if (notif.type === 'follow') {
                    onNavigate('profile', { userId: notif.senderId });
                  } else if (notif.postId) {
                    onNavigate('postDetail', { postId: notif.postId });
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
                  <img src={notif.user.avatar ? getMediaUrl(notif.user.avatar) : '/default_avatar.png'} alt={notif.user.name || 'User'} />
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
          })
        )}
      </div>
    </div>
  );
}
