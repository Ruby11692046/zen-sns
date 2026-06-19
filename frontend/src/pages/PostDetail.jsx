import { ArrowLeft, Send } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '../components/PostCard';
import api, { getMediaUrl } from '../services/api';
import { usePostActions } from '../hooks/usePostActions';
import { formatPost } from '../utils/postUtils';
import './PostDetail.css';

export default function PostDetail({ postId: propPostId, onNavigate, onBack, user }) {
  const { postId: paramPostId } = useParams();
  const postId = propPostId !== undefined
    ? propPostId
    : (paramPostId !== undefined ? parseInt(paramPostId, 10) : undefined);
  const [replyText, setReplyText] = useState('');
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPostDetail = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      // 1. 投稿の詳細を取得
      const postResponse = await api.get(`/posts/${postId}`);
      setPost(formatPost(postResponse.data));

      // 2. 返信の一覧を取得
      const repliesResponse = await api.get(`/posts/${postId}/replies`);
      setReplies(repliesResponse.data.map(formatPost));
    } catch (err) {
      console.error('Failed to fetch post detail/replies:', err);
      setError('投稿の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPostDetail();
    });
  }, [fetchPostDetail]);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    if (replyText.length > 300) {
      window.showToast?.('返信は300文字以内で入力してください。', 'error');
      return;
    }
    try {
      await api.post('/posts', {
        content: replyText,
        parent_id: postId,
      });
      setReplyText('');
      fetchPostDetail();
      window.showToast?.('返信を送信しました。');
    } catch (err) {
      console.error('Failed to send reply:', err);
      if (err.response?.data?.detail) {
        window.showToast?.(err.response.data.detail, 'error');
      } else {
        window.showToast?.('返信の送信に失敗しました。', 'error');
      }
    }
  };

  // メイン投稿のアクション（単一オブジェクトモード）
  // 削除時は onBack() で前の画面に戻り、ブロック時も同様
  const handlePostAction = usePostActions({
    posts: post,
    setPosts: setPost,
    onNavigate,
    onDelete: () => onBack(),
    onBlock: () => onBack(),
  });

  // 返信のアクション（リストモード）
  // 返信削除時は親投稿の replies カウントを同時にデクリメント
  const handleReplyAction = usePostActions({
    posts: replies,
    setPosts: setReplies,
    onNavigate,
    onDelete: () => {
      setPost((prev) => (prev ? { ...prev, replies: Math.max(0, prev.replies - 1) } : null));
    },
  });

  return (
    <div className="post-detail" id="post-detail-screen">
      {/* Header */}
      <header className="page-header">
        <button className="page-header__back" onClick={onBack} aria-label="戻る">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-header__title">投稿</h1>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          読み込み中...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
          {error}
        </div>
      ) : !post ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-tertiary)' }}>
          投稿が見つかりませんでした。
        </div>
      ) : (
        <>
          {/* Main post */}
          <div className="post-detail__main">
            <PostCard
              post={post}
              currentUserId={user?.id}
              isAdmin={user?.is_admin}
              onUserClick={(userId) => onNavigate('profile', { userId })}
              onAction={(type, pid) => handlePostAction(type, pid)}
            />
          </div>

          {/* Reply composer */}
          <div className="post-detail__reply-composer">
            <div className="avatar avatar--sm">
              <img src={(user?.avatar_url || user?.avatar) ? getMediaUrl(user.avatar_url || user.avatar) : '/default_avatar.png'} alt={user?.name || 'User'} />
            </div>
            <input
              className="input-field post-detail__reply-input"
              placeholder="返信を入力..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={300}
              id="post-detail-reply-input"
            />
            <button
              className="btn btn--primary btn--sm"
              disabled={!replyText.trim() || replyText.length > 300}
              onClick={handleReplySubmit}
              id="post-detail-reply-submit"
            >
              <Send size={14} />
            </button>
          </div>

          {/* Replies */}
          <div className="post-detail__replies">
            <h2 className="post-detail__replies-title">返信</h2>
            {replies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>
                返信はまだありません
              </div>
            ) : (
              replies.map((reply) => (
                <PostCard
                  key={reply.id}
                  post={reply}
                  currentUserId={user?.id}
                  isAdmin={user?.is_admin}
                  onUserClick={(uid) => onNavigate('profile', { userId: uid })}
                  onPostClick={(pid) => onNavigate('postDetail', { postId: pid })}
                  onAction={(type, pid) => handleReplyAction(type, pid)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
