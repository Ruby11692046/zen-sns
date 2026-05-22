import { useState } from 'react';
import { Menu } from 'lucide-react';
import PostCard from '../components/PostCard';
import Composer from '../components/Composer';
import { MOCK_POSTS, CURRENT_USER } from '../data/mockData';
import './Timeline.css';

const TABS = [
  { id: 'recommend', label: 'おすすめ' },
  { id: 'follow', label: 'フォロー' },
  { id: 'global', label: '全体' },
];

export default function Timeline({ onNavigate, onOpenSidebar, user }) {
  const [activeTab, setActiveTab] = useState('recommend');

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
        <h1 className="page-header__title timeline__logo-text">ZEN</h1>
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
      <Composer user={user} isMuted={user?.isMuted} />

      {/* New posts banner */}
      <div className="timeline__new-banner" style={{ display: 'none' }} id="timeline-new-banner">
        <span>新しい投稿があります</span>
      </div>

      {/* Posts */}
      <div className="timeline__feed">
        {MOCK_POSTS.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onUserClick={(userId) => onNavigate('profile', { userId })}
            onPostClick={(postId) => onNavigate('postDetail', { postId })}
          />
        ))}
      </div>
    </div>
  );
}
