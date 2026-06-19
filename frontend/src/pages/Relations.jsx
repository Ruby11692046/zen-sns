import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { getMediaUrl } from '../services/api';
import './Relations.css';

export default function Relations({ defaultTab, onNavigate, onBack, userId: propUserId }) {
  const { userId: paramUserId } = useParams();
  const userId = propUserId !== undefined
    ? propUserId
    : (paramUserId ? parseInt(paramUserId, 10) : null);
  
  const [activeTab, setActiveTab] = useState(defaultTab || 'following');
  const [targetUser, setTargetUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState(null);

  // URLのdefaultTabが変わったときに内部ステートを同期する
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // 対象ユーザーのプロフィール基本情報を取得（ヘッダー表示用）
  const fetchTargetUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/users/${userId}`);
      setTargetUser(response.data);
    } catch (err) {
      console.error('Failed to fetch target user:', err);
      setError('ユーザー情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // フォロー中またはフォロワー一覧を取得
  const fetchRelationsList = useCallback(async () => {
    if (!userId) return;
    setListLoading(true);
    try {
      const endpoint = activeTab === 'following' 
        ? `/users/${userId}/following` 
        : `/users/${userId}/followers`;
      const response = await api.get(endpoint);
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch relations list:', err);
    } finally {
      setListLoading(false);
    }
  }, [userId, activeTab]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchTargetUser();
    });
  }, [fetchTargetUser]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchRelationsList();
    });
  }, [fetchRelationsList]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    onNavigate('relations', { userId, tab });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--color-text-secondary)' }}>
        読み込み中...
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
        {error || 'ユーザーが見つかりませんでした。'}
      </div>
    );
  }

  return (
    <div className="relations" id="relations-screen">
      {/* Header */}
      <header className="page-header">
        <button className="page-header__back" onClick={onBack} aria-label="戻る">
          <ArrowLeft size={20} />
        </button>
        <div className="relations__header-title">
          <h1 className="page-header__title">{targetUser.name}</h1>
          <span className="relations__header-subtitle">@{targetUser.username || targetUser.id}</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tabs__item ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => handleTabChange('following')}
          id="relations-tab-following"
        >
          フォロー中
        </button>
        <button
          className={`tabs__item ${activeTab === 'followers' ? 'active' : ''}`}
          onClick={() => handleTabChange('followers')}
          id="relations-tab-followers"
        >
          フォロワー
        </button>
      </div>

      {/* User list */}
      <div className="relations__list">
        {listLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
            読み込み中...
          </div>
        ) : users.length === 0 ? (
          <div className="relations__empty">
            <p>{activeTab === 'following' ? 'フォロー中のユーザーはいません' : 'フォロワーはいません'}</p>
          </div>
        ) : (
          <div className="relations__items">
            {users.map((u) => (
              <button
                key={u.id}
                className="relations__item-card card"
                onClick={() => onNavigate('profile', { userId: u.id })}
                id={`relations-user-${u.id}`}
              >
                <div className="avatar">
                  <img src={u.avatar_url ? getMediaUrl(u.avatar_url) : '/default_avatar.png'} alt={u.name || 'User'} />
                </div>
                <div className="relations__item-info">
                  <div className="relations__item-header">
                    <span className="relations__item-name">{u.name}</span>
                    <span className="relations__item-id">@{u.username || u.id}</span>
                  </div>
                  {u.bio && <p className="relations__item-bio truncate">{u.bio}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
