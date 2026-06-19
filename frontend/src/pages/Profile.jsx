import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, UserPlus, UserMinus, Camera } from 'lucide-react';
import PostCard from '../components/PostCard';
import api, { getMediaUrl } from '../services/api';
import { processImage } from '../services/imageProcessor';
import { usePostActions } from '../hooks/usePostActions';
import { formatPost } from '../utils/postUtils';
import './Profile.css';

const PROFILE_TABS = [
  { id: 'posts', label: '投稿' },
  // { id: 'replies', label: '返信' },
  { id: 'media', label: 'メディア' },
  { id: 'likes', label: 'いいね' },
];

export default function Profile({ userId: propUserId, onNavigate, onBack, user }) {
  const { userId: paramUserId } = useParams();
  const userId = propUserId !== undefined
    ? propUserId
    : (paramUserId !== undefined ? parseInt(paramUserId, 10) : undefined);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  
  // 編集用のステート
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  // APIから取得するプロフィール情報と投稿
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 現在表示しているのが自分自身かどうか
  const [isSelf, setIsSelf] = useState(false);
  const [myId, setMyId] = useState(null);

  // 共通アクションフック（いいね・リポスト・削除・ブロック・返信）
  const handleAction = usePostActions({ posts: userPosts, setPosts: setUserPosts, onNavigate });

  // 編集開始時に初期値をセット
  useEffect(() => {
    if (profile) {
      Promise.resolve().then(() => {
        setEditName(profile.name);
        setEditBio(profile.bio || '');
        setEditAvatarUrl(profile.avatar || '');
      });
    }
  }, [profile, isEditing]);

  // プロフィール情報の取得
  const fetchProfile = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      // 1. まず自分の情報を取得して自分自身か判定
      const meResponse = await api.get('/users/me');
      const currentMyId = meResponse.data.id;
      setMyId(currentMyId);
      const targetId = (userId === undefined || userId === null || userId === 0) ? currentMyId : userId;
      
      const targetIsSelf = currentMyId === targetId;
      setIsSelf(targetIsSelf);

      // 2. 対象ユーザーの詳細情報を取得
      const response = await api.get(`/users/${targetId}`);
      const p = response.data;
      
      setProfile({
        id: p.id,
        name: p.name,
        userId: `@${p.username || p.id}`,
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
    await Promise.resolve();
    setPostsLoading(true);
    try {
      let endpoint = `/users/${profile.id}/posts`;
      if (activeTab === 'replies') {
        endpoint = `/users/${profile.id}/replies`;
      } else if (activeTab === 'media') {
        endpoint = `/users/${profile.id}/media`;
      } else if (activeTab === 'likes') {
        endpoint = `/users/${profile.id}/likes`;
      }
      const response = await api.get(endpoint);
      setUserPosts(response.data.map(formatPost));
    } catch (err) {
      console.error('Failed to fetch user posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [profile, activeTab]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchProfile();
    });
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      Promise.resolve().then(() => {
        fetchUserPosts();
      });
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
      window.showToast?.('フォロー状態の変更に失敗しました。', 'error');
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processed = await processImage(file);
        setAvatarFile(processed);
        // ローカルプレビューURLを作成
        setEditAvatarUrl(URL.createObjectURL(processed));
      } catch (err) {
        console.error(err);
        window.showToast?.("画像の処理に失敗しました。", "error");
      }
    }
  };

  // プロフィール編集の保存
  const handleEditSave = async () => {
    if (!editName || !editName.trim()) {
      window.showToast?.('名前を入力してください。', 'error');
      return;
    }
    if (editName.length > 20) {
      window.showToast?.('名前は20文字以内で入力してください。', 'error');
      return;
    }
    if (editBio && editBio.length > 500) {
      window.showToast?.('自己紹介は500文字以内で入力してください。', 'error');
      return;
    }
    try {
      let finalAvatarUrl = editAvatarUrl;

      // 新しいアバター画像がある場合は先にアップロード
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadResponse = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        finalAvatarUrl = uploadResponse.data.url;
      }

      // プロフィール更新APIの呼び出し
      const updateResponse = await api.put('/users/me', {
        name: editName,
        bio: editBio,
        avatar_url: finalAvatarUrl,
      });

      const updated = updateResponse.data;
      setProfile((prev) => ({
        ...prev,
        name: updated.name,
        bio: updated.bio,
        avatar: updated.avatar_url,
      }));

      setIsEditing(false);
      setAvatarFile(null);
      window.showToast?.('プロフィールを更新しました。');
    } catch (err) {
      console.error('Failed to update profile:', err);
      window.showToast?.('プロフィールの更新に失敗しました。', 'error');
    }
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
        <div className="card profile__info-card">
          <div className="profile__info-top">
            <div className="avatar avatar--xl profile__avatar profile__avatar--editable">
              {isEditing ? (
                <label className="profile__avatar-edit-label" style={{ cursor: 'pointer', position: 'relative', display: 'block', width: '100%', height: '100%' }}>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarSelect}
                  />
                  {/* 小プレビューまたは現在のアバターを常に表示 */}
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl.startsWith('blob:') ? editAvatarUrl : getMediaUrl(editAvatarUrl)} alt={profile.name} />
                  ) : profile.avatar ? (
                    <img src={getMediaUrl(profile.avatar)} alt={profile.name} />
                  ) : (
                    <img src="/default_avatar.png" alt={profile.name} />
                  )}
                  <div className="profile__avatar-edit-overlay">
                    <Camera size={20} />
                  </div>
                </label>
              ) : (
                <img src={profile.avatar ? getMediaUrl(profile.avatar) : '/default_avatar.png'} alt={profile.name} />
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
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="名前"
                  maxLength={20}
                  id="profile-edit-name"
                />
                <textarea
                  className="input-field profile__edit-bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="自己紹介"
                  rows={3}
                  maxLength={500}
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
              <button
                className="profile__stat"
                onClick={() => onNavigate('relations', { userId: profile.id, tab: 'following' })}
                id="profile-stat-following"
              >
                <span className="profile__stat-value">{profile.followingCount}</span>
                <span className="profile__stat-label">フォロー中</span>
              </button>
              <button
                className="profile__stat"
                onClick={() => onNavigate('relations', { userId: profile.id, tab: 'followers' })}
                id="profile-stat-followers"
              >
                <span className="profile__stat-value">{profile.followersCount}</span>
                <span className="profile__stat-label">フォロワー</span>
              </button>
            </div>
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
        ) : userPosts.length === 0 ? (
          <div className="profile__empty">
            <p>{PROFILE_TABS.find((t) => t.id === activeTab).label}はまだありません</p>
          </div>
        ) : (
          userPosts.map((post) => (
            <PostCard
              key={post.repostedBy ? `${post.id}_repost_${post.repostedBy}` : String(post.id)}
              post={post}
              currentUserId={myId}
              isAdmin={user?.is_admin}
              onUserClick={(uid) => onNavigate('profile', { userId: uid })}
              onPostClick={(pid) => onNavigate('postDetail', { postId: pid })}
              onAction={handleAction}
            />
          ))
        )}
      </div>
    </div>
  );
}
