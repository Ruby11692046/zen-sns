import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X, Clock, ArrowLeft } from 'lucide-react';
import PostCard from '../components/PostCard';
import api, { getMediaUrl } from '../services/api';
import { usePostActions } from '../hooks/usePostActions';
import { formatPost } from '../utils/postUtils';
import './Search.css';

const SEARCH_TABS = [
  { id: 'posts', label: '投稿' },
  { id: 'media', label: 'メディア' },
  { id: 'accounts', label: 'アカウント' },
];

export default function Search({ onNavigate, user }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('zen-search-history')) || [];
    } catch {
      return [];
    }
  });

  // 共通アクションフック（検索結果の投稿に対するいいね・リポスト・削除・ブロック・返信）
  const handleAction = usePostActions({ posts: results, setPosts: setResults, onNavigate });

  const saveHistory = useCallback((term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...history.filter((h) => h !== clean)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('zen-search-history', JSON.stringify(updated));
  }, [history]);

  const handleSearch = useCallback(async (searchTerm = query) => {
    if (!searchTerm.trim()) return;
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      saveHistory(searchTerm);
      const searchTypeForApi = activeTab === 'media' ? 'posts' : activeTab;

      const response = await api.get('/search', {
        params: {
          q: searchTerm,
          type: searchTypeForApi,
        },
      });

      if (activeTab === 'posts' || activeTab === 'media') {
        const formatted = response.data.map(formatPost);
        setResults(activeTab === 'media' ? formatted.filter((p) => p.image) : formatted);
      } else {
        const formattedUsers = response.data.map((u) => ({
          id: u.id,
          name: u.name,
          userId: `@${u.username || u.id}`,
          avatar: u.avatar_url,
          bio: u.bio,
        }));
        setResults(formattedUsers);
      }
      setIsSearching(true);
    } catch (err) {
      console.error('Failed to search:', err);
      setError('検索の実行に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [query, activeTab, saveHistory]);

  // タブ切り替え時に再検索
  useEffect(() => {
    if (isSearching && query.trim()) {
      Promise.resolve().then(() => {
        handleSearch();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
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
          onClick={() => handleSearch()}
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
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                検索中...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
                {error}
              </div>
            ) : results.length === 0 ? (
              <div className="search__empty">
                <p>見つかりませんでした</p>
              </div>
            ) : (
              <>
                {(activeTab === 'posts' || activeTab === 'media') &&
                  results.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id}
                      isAdmin={user?.is_admin}
                      onUserClick={(userId) => onNavigate('profile', { userId })}
                      onPostClick={(postId) => onNavigate('postDetail', { postId })}
                      onAction={handleAction}
                    />
                  ))}
                {activeTab === 'accounts' && (
                  <div className="search__accounts">
                    {results.map((u) => (
                      <button
                        key={u.id}
                        className="search__account-item"
                        onClick={() => onNavigate('profile', { userId: u.id })}
                      >
                        <div className="avatar">
                          <img src={u.avatar ? getMediaUrl(u.avatar) : '/default_avatar.png'} alt={u.name || 'User'} />
                        </div>
                        <div className="search__account-info">
                          <span className="search__account-name">{u.name}</span>
                          <span className="search__account-id">{u.userId}</span>
                          <span className="search__account-bio truncate">{u.bio}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        /* Search history */
        <div className="search__history">
          <h2 className="search__history-title">最近の検索</h2>
          {history.map((term, i) => (
            <button
              key={i}
              className="search__history-item"
              onClick={() => {
                setQuery(term);
                handleSearch(term);
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
