import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import PostCard from '../components/PostCard';
import Composer from '../components/Composer';
import api from '../services/api';
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

  // タイムラインの投稿を取得する関数
  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/timelines/${activeTab}`);
      // バックエンドのレスポンスに合わせてデータを整形
      // バックエンド: post = { id, content, created_at, user: { id, name, email }, ... }
      // フロントの PostCard が期待する形式:
      // { id, content, createdAt, user: { id, name, userId, avatar }, likes, reposts, replies, isLiked, isReposted }
      const formatted = response.data.map((p) => ({
        id: p.id,
        content: p.content,
        image: p.image_url,
        createdAt: new Date(p.created_at).toLocaleString('ja-JP', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        user: {
          id: p.user.id,
          name: p.user.name,
          userId: `@${p.user.email.split('@')[0]}`,
          avatar: p.user.avatar_url,
        },
        likes: p.likes_count,
        reposts: p.reposts_count,
        replies: p.replies_count,
        isLiked: p.is_liked_by_me,
        isReposted: p.is_reposted_by_me,
      }));
      setPosts(formatted);
    } catch (err) {
      console.error('Failed to fetch timeline posts:', err);
      setError('タイムラインの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // マウント時およびタブ切り替え時にタイムラインを再読み込み
  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // 新規投稿送信時のハンドラー
  const handleComposerSubmit = async ({ text, image }) => {
    try {
      // チェックポイント3で画像アップロードを実装するまでは、image_urlは仮でnull
      await api.post('/posts', {
        content: text,
        image_url: null,
      });
      // 投稿成功後、タイムラインを再読み込み
      fetchTimeline();
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('投稿の送信に失敗しました。');
    }
  };

  // 投稿に対する各種アクションのハンドリング（いいね・リポスト・削除・ブロック）
  const handlePostAction = async (type, postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (type === 'more') {
      const isMyPost = post.user.id === user.id;
      const options = isMyPost
        ? ['削除する']
        : ['このユーザーをブロックする', 'このユーザーをフォローする（または解除）'];

      const promptMsg = isMyPost
        ? 'この投稿を削除しますか？'
        : `ユーザー ${post.user.name} をブロックしますか？\n(お互いの投稿が表示されなくなり、フォロー関係が解除されます)`;

      if (window.confirm(promptMsg)) {
        try {
          if (isMyPost) {
            // 投稿削除
            await api.delete(`/posts/${postId}`);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          } else {
            // ユーザーブロック
            await api.post(`/users/${post.user.id}/block`);
            // ブロックしたユーザーの投稿を現在のタイムラインから即時除外
            setPosts((prev) => prev.filter((p) => p.user.id !== post.user.id));
            alert(`${post.user.name} をブロックしました。`);
          }
        } catch (err) {
          console.error(`Action failed: ${type}`, err);
          alert('処理に失敗しました。');
        }
      }
    } else if (type === 'like') {
      try {
        if (post.isLiked) {
          await api.delete(`/posts/${postId}/likes`);
        } else {
          await api.post(`/posts/${postId}/likes`);
        }
        // UI側のいいねステートを反転（チェックポイント4で詳細化しますが、先行してUIのみ反映）
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: !p.isLiked,
                  likes: p.isLiked ? p.likes - 1 : p.likes + 1,
                }
              : p
          )
        );
      } catch (err) {
        console.error('Failed to toggle like:', err);
      }
    } else if (type === 'repost') {
      try {
        if (post.isReposted) {
          await api.delete(`/posts/${postId}/reposts`);
        } else {
          await api.post(`/posts/${postId}/reposts`);
        }
        // UI側のリポストステートを反転
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isReposted: !p.isReposted,
                  reposts: p.isReposted ? p.reposts - 1 : p.reposts + 1,
                }
              : p
          )
        );
      } catch (err) {
        console.error('Failed to toggle repost:', err);
      }
    } else if (type === 'reply') {
      // 返信は詳細画面（PostDetail）に遷移させて行う
      onNavigate('postDetail', { postId });
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
      <Composer user={user} isMuted={user?.isMuted} onSubmit={handleComposerSubmit} />

      {/* New posts banner */}
      <div className="timeline__new-banner" style={{ display: 'none' }} id="timeline-new-banner">
        <span>新しい投稿があります</span>
      </div>

      {/* Posts */}
      <div className="timeline__feed">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
            読み込み中...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-tertiary)' }}>
            投稿がありません
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUserClick={(userId) => onNavigate('profile', { userId })}
              onPostClick={(postId) => onNavigate('postDetail', { postId })}
              onAction={(type, postId) => handlePostAction(type, postId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
