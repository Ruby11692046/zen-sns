import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Edit3, UserPlus, UserMinus } from 'lucide-react';
import PostCard from '../components/PostCard';
import api from '../services/api';
import './Profile.css';

const PROFILE_TABS = [
  { id: 'posts', label: '投稿' },
  { id: 'replies', label: '返信' },
  { id: 'media', label: 'メディア' },
  { id: 'likes', label: 'いいね' },
];

export default function Profile({ userId, onNavigate, onBack }) {
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  
  // APIから取得するプロフィール情報と投稿
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 現在表示しているのが自分自身かどうか
  const [isSelf, setIsSelf] = useState(false);

  // プロフィール情報の取得
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. まず自分の情報を取得して自分自身か判定
      const meResponse = await api.get('/users/me');
      const myId = meResponse.data.id;
      const targetId = (userId === undefined || userId === null || userId === 0) ? myId : userId;
      
      const targetIsSelf = myId === targetId;
      setIsSelf(targetIsSelf);

      // 2. 対象ユーザーの詳細情報を取得
      const response = await api.get(`/users/${targetId}`);
      const p = response.data;
      
      setProfile({
        id: p.id,
        name: p.name,
        userId: `@${p.email.split('@')[0]}`,
        avatar: p.avatar_url,
        bio: p.bio,
        followingCount: p.following_count,
        followersCount: p.followers_count,
        isFollowing: p.is_following_by_me,
        isBlocked: p.is_blocked_by_me,
      });
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError('プロフィールの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ユーザーの投稿一覧を取得
  const fetchUserPosts = useCallback(async () => {
    if (!profile) return;
    setPostsLoading(true);
    try {
      const response = await api.get(`/users/${profile.id}/posts`);
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
      setUserPosts(formatted);
    } catch (err) {
      console.error('Failed to fetch user posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      fetchUserPosts();
    }
  }, [profile, fetchUserPosts]);

  // フォロー・フォロー解除のトグル
  const handleFollowToggle = async () => {
    if (!profile) return;
    const originalFollowing = profile.isFollowing;
    try {
      if (originalFollowing) {
        await api.delete(`/users/${profile.id}/follow`);
        setProfile((prev) => ({
          ...prev,
          isFollowing: false,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
      } else {
        await api.post(`/users/${profile.id}/follow`);
        setProfile((prev) => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1,
        }));
      }
    } catch (err) {
      console.error('Failed to toggle follow status:', err);
      alert('フォロー状態の変更に失敗しました。');
    }
  };

  // プロフィール編集の保存（仮実装、本格対応はチェックポイント3）
  const handleEditSave = () => {
    setIsEditing(false);
    // TODO: PATCH /users/me のAPI接続
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--color-text-secondary)' }}>
        読み込み中...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
        {error || 'ユーザーが見つかりませんでした。'}
      </div>
    );
  }

  return (
    <div className="profile" id="profile-screen">
      {/* Header */}
      <header className="page-header">
        <button className="page-header__back" onClick={onBack} aria-label="戻る">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-header__title">{profile.name}</h1>
      </header>

      {/* Banner */}
      <div className="profile__banner">
        <div className="profile__banner-gradient" />
      </div>

      {/* User info */}
      <div className="profile__info">
        <div className="profile__info-top">
          <div className="avatar avatar--xl profile__avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} />
            ) : (
              profile.name[0]
            )}
          </div>
          <div className="profile__actions">
            {isSelf ? (
              <button
                className="btn btn--secondary"
                onClick={() => setIsEditing(!isEditing)}
                id="profile-edit-btn"
              >
                <Edit3 size={16} />
                <span>プロフィールを編集</span>
              </button>
            ) : (
              <button
                className={`btn ${profile.isFollowing ? 'btn--secondary' : 'btn--primary'}`}
                onClick={handleFollowToggle}
                id="profile-follow-btn"
              >
                {profile.isFollowing ? (
                  <>
                    <UserMinus size={16} />
                    <span>フォロー中</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>フォロー</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="profile__details">
          <h2 className="profile__name">{profile.name}</h2>
          <p className="profile__userid">{profile.userId}</p>

          {isEditing ? (
            <div className="profile__edit-form">
              <input
                className="input-field"
                defaultValue={profile.name}
                placeholder="名前"
                id="profile-edit-name"
              />
              <textarea
                className="input-field profile__edit-bio"
                defaultValue={profile.bio}
                placeholder="自己紹介"
                rows={3}
                id="profile-edit-bio"
              />
              <div className="profile__edit-actions">
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => setIsEditing(false)}
                >
                  キャンセル
                </button>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleEditSave}
                  id="profile-edit-save"
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            <p className="profile__bio">{profile.bio}</p>
          )}

          <div className="profile__stats">
            <button className="profile__stat">
              <span className="profile__stat-value">{profile.followingCount}</span>
              <span className="profile__stat-label">フォロー中</span>
            </button>
            <button className="profile__stat">
              <span className="profile__stat-value">{profile.followersCount}</span>
              <span className="profile__stat-label">フォロワー</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tabs__item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`profile-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="profile__feed">
        {postsLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
            読み込み中...
          </div>
        ) : activeTab === 'posts' && userPosts.length === 0 ? (
          <div className="profile__empty">
            <p>投稿はまだありません</p>
          </div>
        ) : activeTab === 'posts' ? (
          userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUserClick={(uid) => onNavigate('profile', { userId: uid })}
              onPostClick={(pid) => onNavigate('postDetail', { postId: pid })}
              onAction={async (type, pid) => {
                // タイムライン同様のアクション処理を一部適用
                if (type === 'more' && isSelf) {
                  if (window.confirm('この投稿を削除しますか？')) {
                    try {
                      await api.delete(`/posts/${pid}`);
                      setUserPosts((prev) => prev.filter((p) => p.id !== pid));
                    } catch (err) {
                      console.error(err);
                      alert('削除に失敗しました。');
                    }
                  }
                }
              }}
            />
          ))
        ) : (
          <div className="profile__empty">
            <p>{PROFILE_TABS.find((t) => t.id === activeTab).label}はまだありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
