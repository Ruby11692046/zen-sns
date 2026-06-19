import { useState, useEffect, useCallback } from 'react';
import { VolumeX, Volume2, Shield, User } from 'lucide-react';
import api, { getMediaUrl } from '../services/api';
import './Admin.css';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 全ユーザーリストの取得
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      setError('ユーザー一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchUsers();
    });
  }, [fetchUsers]);

  // ミュート状態のトグル
  const handleToggleMute = async (userId, userName) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const actionText = user.is_muted ? 'ミュート解除' : 'ミュート';
    window.showConfirm?.(
      `ユーザー ${userName} を${actionText}しますか？`,
      async () => {
        try {
          const response = await api.post(`/admin/users/${userId}/mute`);
          const updatedMute = response.data.is_muted;
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, is_muted: updatedMute } : u))
          );
          window.showToast?.(
            `${userName} を${updatedMute ? 'ミュートしました' : 'ミュート解除しました'}。`,
            updatedMute ? 'error' : 'success'
          );
        } catch (err) {
          console.error('Failed to toggle mute status:', err);
          window.showToast?.(`${actionText}に失敗しました。`, 'error');
        }
      }
    );
  };

  return (
    <div className="admin" id="admin-screen">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-header__title">管理者モデレーション</h1>
      </header>

      <div className="admin__content">
        {loading ? (
          <div className="admin__status">読み込み中...</div>
        ) : error ? (
          <div className="admin__status admin__status--error">{error}</div>
        ) : (
          <div className="card admin__card">
            <h2 className="admin__section-title">ユーザーアカウント管理</h2>
            <div className="admin__table-wrapper">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>アバター</th>
                    <th>ユーザー</th>
                    <th>メールアドレス</th>
                    <th>ステータス</th>
                    <th>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="admin__tr">
                      <td>
                        <div className="avatar avatar--sm">
                          <img
                            src={u.avatar_url ? getMediaUrl(u.avatar_url) : '/default_avatar.png'}
                            alt={u.name}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="admin__user-cell">
                          <span className="admin__user-name truncate">{u.name}</span>
                          <span className="admin__user-handle truncate">@{u.username || u.id}</span>
                        </div>
                      </td>
                      <td>
                        <span className="admin__email truncate">{u.email}</span>
                      </td>
                      <td>
                        <div className="admin__status-cell">
                          {u.is_admin ? (
                            <span className="admin__badge admin__badge--admin">
                              <Shield size={12} />
                              管理者
                            </span>
                          ) : (
                            <span className="admin__badge admin__badge--user">
                              <User size={12} />
                              一般
                            </span>
                          )}
                          {u.is_muted && (
                            <span className="admin__badge admin__badge--muted">
                              <VolumeX size={12} />
                              ミュート中
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {!u.is_admin && (
                          <button
                            className={`btn btn--sm ${u.is_muted ? 'btn--secondary' : 'btn--danger'}`}
                            onClick={() => handleToggleMute(u.id, u.name)}
                            id={`admin-mute-btn-${u.id}`}
                          >
                            {u.is_muted ? (
                              <>
                                <Volume2 size={12} />
                                <span>解除</span>
                              </>
                            ) : (
                              <>
                                <VolumeX size={12} />
                                <span>ミュート</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
