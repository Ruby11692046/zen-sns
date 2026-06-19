import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import PostCard from '../components/PostCard';
import Composer from '../components/Composer';
import api from '../services/api';
import { usePostActions } from '../hooks/usePostActions';
import { formatPost } from '../utils/postUtils';
import './Timeline.css';

const TABS = [
  { id: 'recommend', label: 'おすすめ' },
  { id: 'follow', label: 'フォロー' },
  { id: 'global', label: '全体' },
];

export default function Timeline({ onNavigate, onOpenSidebar, user }) {
  const [activeTab, setActiveTab] = useState('recommend');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 共通アクションフック（いいね・リポスト・削除・ブロック・返信）
  const handleAction = usePostActions({ posts, setPosts, onNavigate });

  // タイムラインの投稿を取得する関数
  const fetchTimeline = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/timelines/${activeTab}`);
      setPosts(response.data.map(formatPost));
    } catch (err) {
      console.error('Failed to fetch timeline posts:', err);
      setError('タイムラインの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // マウント時およびタブ切り替え時にタイムラインを再読み込み
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchTimeline();
    });
  }, [fetchTimeline]);

  // 新規投稿送信時のハンドラー
  const handleComposerSubmit = async ({ text, imageFile }) => {
    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResponse = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadResponse.data.url;
      }
      await api.post('/posts', { content: text, image_url: imageUrl });
      // 投稿成功後、タイムラインを再読み込み
      fetchTimeline();
    } catch (err) {
      console.error('Failed to create post:', err);
      if (err.response?.data?.detail) {
        window.showToast?.(err.response.data.detail, 'error');
      } else {
        window.showToast?.('投稿の送信に失敗しました。', 'error');
      }
    }
  };

  return (
    <div className="timeline" id="timeline-screen">
      {/* Header */}
      <header className="page-header timeline__header">
        <button
          className="page-header__menu-btn btn--ghost"
          onClick={onOpenSidebar}
          aria-label="メニュー"
          id="timeline-menu-btn"
        >
          <Menu size={22} />
        </button>
        <h1 className="page-header__title timeline__logo-text">Mist</h1>
      </header>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tabs__item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`timeline-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Composer */}
      <Composer user={user} isMuted={user?.is_muted} onSubmit={handleComposerSubmit} />

      {/* New posts banner */}
      <div className="timeline__new-banner" style={{ display: 'none' }} id="timeline-new-banner">
        <span>新しい投稿があります</span>
      </div>

      {/* Posts */}
      <div className="timeline__feed">
        {loading ? (
          <div className="timeline__status-panel timeline__status-panel--loading">
            <span>読み込み中...</span>
          </div>
        ) : error ? (
          <div className="timeline__status-panel timeline__status-panel--error">
            <span>{error}</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="timeline__status-panel timeline__status-panel--empty">
            <span>投稿がありません</span>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.repostedBy ? `${post.id}_repost_${post.repostedBy}` : String(post.id)}
              post={post}
              currentUserId={user?.id}
              isAdmin={user?.is_admin}
              onUserClick={(userId) => onNavigate('profile', { userId })}
              onPostClick={(postId) => onNavigate('postDetail', { postId })}
              onAction={handleAction}
            />
          ))
        )}
      </div>
    </div>
  );
}
