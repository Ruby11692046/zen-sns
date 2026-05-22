import { useState } from 'react';
import { ArrowLeft, Edit3, UserPlus, UserMinus } from 'lucide-react';
import PostCard from '../components/PostCard';
import { MOCK_USERS, MOCK_POSTS, CURRENT_USER } from '../data/mockData';
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
  const [isFollowing, setIsFollowing] = useState(false);

  const isSelf = userId === 0 || userId === CURRENT_USER.id;
  const user = isSelf
    ? CURRENT_USER
    : MOCK_USERS.find((u) => u.id === userId) || MOCK_USERS[0];

  const userPosts = MOCK_POSTS.filter(
    (p) => isSelf || p.user?.id === userId
  ).slice(0, 3);

  return (
    <div className="profile" id="profile-screen">
      {/* Header */}
      <header className="page-header">
        <button className="page-header__back" onClick={onBack} aria-label="戻る">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-header__title">{user.name}</h1>
      </header>

      {/* Banner */}
      <div className="profile__banner">
        <div className="profile__banner-gradient" />
      </div>

      {/* User info */}
      <div className="profile__info">
        <div className="profile__info-top">
          <div className="avatar avatar--xl profile__avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              user.name[0]
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
                className={`btn ${isFollowing ? 'btn--secondary' : 'btn--primary'}`}
                onClick={() => setIsFollowing(!isFollowing)}
                id="profile-follow-btn"
              >
                {isFollowing ? (
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
          <h2 className="profile__name">{user.name}</h2>
          <p className="profile__userid">{user.userId}</p>

          {isEditing ? (
            <div className="profile__edit-form">
              <input
                className="input-field"
                defaultValue={user.name}
                placeholder="名前"
                id="profile-edit-name"
              />
              <textarea
                className="input-field profile__edit-bio"
                defaultValue={user.bio}
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
                  onClick={() => setIsEditing(false)}
                  id="profile-edit-save"
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            <p className="profile__bio">{user.bio}</p>
          )}

          <div className="profile__stats">
            <button className="profile__stat">
              <span className="profile__stat-value">{user.followingCount}</span>
              <span className="profile__stat-label">フォロー中</span>
            </button>
            <button className="profile__stat">
              <span className="profile__stat-value">{user.followersCount}</span>
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
        {activeTab === 'posts' &&
          userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUserClick={(uid) => onNavigate('profile', { userId: uid })}
              onPostClick={(pid) => onNavigate('postDetail', { postId: pid })}
            />
          ))}
        {activeTab === 'replies' && (
          <div className="profile__empty">
            <p>返信はまだありません</p>
          </div>
        )}
        {activeTab === 'media' && (
          <div className="profile__empty">
            <p>メディアはまだありません</p>
          </div>
        )}
        {activeTab === 'likes' && (
          <div className="profile__empty">
            <p>いいねした投稿はまだありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
