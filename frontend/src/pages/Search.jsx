import { useState } from 'react';
import { Search as SearchIcon, X, Clock, ArrowLeft } from 'lucide-react';
import PostCard from '../components/PostCard';
import { MOCK_POSTS, MOCK_USERS, MOCK_SEARCH_HISTORY } from '../data/mockData';
import './Search.css';

const SEARCH_TABS = [
  { id: 'posts', label: '投稿' },
  { id: 'media', label: 'メディア' },
  { id: 'accounts', label: 'アカウント' },
];

export default function Search({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const handleSearch = () => {
    if (query.trim()) {
      setIsSearching(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setQuery('');
    setIsSearching(false);
  };

  return (
    <div className="search" id="search-screen">
      {/* Header with search bar */}
      <header className="page-header search__header">
        {isSearching && (
          <button
            className="page-header__back"
            onClick={handleClear}
            aria-label="戻る"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="search__input-wrapper">
          <SearchIcon size={18} className="search__input-icon" />
          <input
            className="search__input"
            placeholder="投稿やユーザーを検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            id="search-input"
          />
          {query && (
            <button className="search__input-clear" onClick={handleClear} aria-label="クリア">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className="btn btn--primary btn--sm"
          onClick={handleSearch}
          id="search-submit"
        >
          検索
        </button>
      </header>

      {isSearching ? (
        <>
          {/* Search result tabs */}
          <div className="tabs">
            {SEARCH_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tabs__item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                id={`search-tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="search__results">
            {activeTab === 'posts' &&
              MOCK_POSTS.slice(0, 3).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUserClick={(userId) => onNavigate('profile', { userId })}
                  onPostClick={(postId) => onNavigate('postDetail', { postId })}
                />
              ))}
            {activeTab === 'accounts' && (
              <div className="search__accounts">
                {MOCK_USERS.slice(0, 3).map((user) => (
                  <button
                    key={user.id}
                    className="search__account-item"
                    onClick={() => onNavigate('profile', { userId: user.id })}
                  >
                    <div className="avatar">{user.name[0]}</div>
                    <div className="search__account-info">
                      <span className="search__account-name">{user.name}</span>
                      <span className="search__account-id">{user.userId}</span>
                      <span className="search__account-bio truncate">{user.bio}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'media' && (
              <div className="search__empty">
                <p>メディアが見つかりませんでした</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Search history */
        <div className="search__history">
          <h2 className="search__history-title">最近の検索</h2>
          {MOCK_SEARCH_HISTORY.map((term, i) => (
            <button
              key={i}
              className="search__history-item"
              onClick={() => {
                setQuery(term);
                setIsSearching(true);
              }}
            >
              <Clock size={16} className="search__history-icon" />
              <span>{term}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
