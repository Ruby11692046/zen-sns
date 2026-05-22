import { Heart, Repeat2, MessageCircle, MoreHorizontal } from 'lucide-react';
import './PostCard.css';

export default function PostCard({ post, onUserClick, onPostClick, onAction }) {
  const handleLike = (e) => {
    e.stopPropagation();
    onAction?.('like', post.id);
  };
  const handleRepost = (e) => {
    e.stopPropagation();
    onAction?.('repost', post.id);
  };
  const handleReply = (e) => {
    e.stopPropagation();
    onAction?.('reply', post.id);
  };
  const handleMore = (e) => {
    e.stopPropagation();
    onAction?.('more', post.id);
  };

  return (
    <article
      className="post-card"
      onClick={() => onPostClick?.(post.id)}
      id={`post-card-${post.id}`}
    >
      {/* Repost indicator */}
      {post.repostedBy && (
        <div className="post-card__repost-indicator">
          <Repeat2 size={14} />
          <span>{post.repostedBy}がリポスト</span>
        </div>
      )}

      <div className="post-card__body">
        {/* Avatar */}
        <button
          className="avatar post-card__avatar"
          onClick={(e) => {
            e.stopPropagation();
            onUserClick?.(post.user?.id);
          }}
          aria-label={`${post.user?.name}のプロフィール`}
        >
          {post.user?.avatar ? (
            <img src={post.user.avatar} alt={post.user.name} />
          ) : (
            post.user?.name?.[0] || '?'
          )}
        </button>

        {/* Content */}
        <div className="post-card__content">
          {/* Header */}
          <div className="post-card__header">
            <button
              className="post-card__author"
              onClick={(e) => {
                e.stopPropagation();
                onUserClick?.(post.user?.id);
              }}
            >
              <span className="post-card__name truncate">{post.user?.name}</span>
              <span className="post-card__userid truncate">{post.user?.userId}</span>
            </button>
            <span className="post-card__time">{post.createdAt}</span>
          </div>

          {/* Text */}
          <p className="post-card__text">{post.content}</p>

          {/* Image */}
          {post.image && (
            <div className="post-card__image">
              <img src={post.image} alt="投稿画像" />
            </div>
          )}

          {/* Actions */}
          <div className="post-card__actions">
            <button
              className={`post-card__action post-card__action--reply`}
              onClick={handleReply}
              aria-label="返信"
            >
              <MessageCircle size={18} />
              {post.replies > 0 && <span>{post.replies}</span>}
            </button>
            <button
              className={`post-card__action post-card__action--repost ${post.isReposted ? 'active' : ''}`}
              onClick={handleRepost}
              aria-label="リポスト"
            >
              <Repeat2 size={18} />
              {post.reposts > 0 && <span>{post.reposts}</span>}
            </button>
            <button
              className={`post-card__action post-card__action--like ${post.isLiked ? 'active' : ''}`}
              onClick={handleLike}
              aria-label="いいね"
            >
              <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
              {post.likes > 0 && <span>{post.likes}</span>}
            </button>
            <button
              className="post-card__action post-card__action--more"
              onClick={handleMore}
              aria-label="その他"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
