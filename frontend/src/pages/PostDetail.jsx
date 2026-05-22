import { ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';
import PostCard from '../components/PostCard';
import { MOCK_POSTS, MOCK_REPLIES, CURRENT_USER } from '../data/mockData';
import './PostDetail.css';

export default function PostDetail({ postId, onNavigate, onBack }) {
  const [replyText, setReplyText] = useState('');
  const post = MOCK_POSTS.find((p) => p.id === postId) || MOCK_POSTS[0];

  return (
    <div className="post-detail" id="post-detail-screen">
      {/* Header */}
      <header className="page-header">
        <button className="page-header__back" onClick={onBack} aria-label="戻る">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-header__title">投稿</h1>
      </header>

      {/* Main post */}
      <div className="post-detail__main">
        <PostCard
          post={post}
          onUserClick={(userId) => onNavigate('profile', { userId })}
        />
      </div>

      {/* Reply composer */}
      <div className="post-detail__reply-composer">
        <div className="avatar avatar--sm">
          {CURRENT_USER.name[0]}
        </div>
        <input
          className="input-field post-detail__reply-input"
          placeholder="返信を入力..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          id="post-detail-reply-input"
        />
        <button
          className="btn btn--primary btn--sm"
          disabled={!replyText.trim()}
          onClick={() => setReplyText('')}
          id="post-detail-reply-submit"
        >
          <Send size={14} />
        </button>
      </div>

      {/* Replies */}
      <div className="post-detail__replies">
        <h2 className="post-detail__replies-title">返信</h2>
        {MOCK_REPLIES.map((reply) => (
          <div className="post-detail__reply" key={reply.id}>
            <button
              className="avatar avatar--sm"
              onClick={() => onNavigate('profile', { userId: reply.user.id })}
            >
              {reply.user.name[0]}
            </button>
            <div className="post-detail__reply-content">
              <div className="post-detail__reply-header">
                <span className="post-detail__reply-name">{reply.user.name}</span>
                <span className="post-detail__reply-userid">{reply.user.userId}</span>
                <span className="post-detail__reply-time">{reply.createdAt}</span>
              </div>
              <p className="post-detail__reply-text">{reply.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
