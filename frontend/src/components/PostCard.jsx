import { useState, useEffect, useRef } from 'react';
import { Heart, Repeat2, MessageCircle, MoreHorizontal } from 'lucide-react';
import { getMediaUrl } from '../services/api';
import { renderContentWithLinks } from '../utils/linkify';
import './PostCard.css';

export default function PostCard({ post, currentUserId, isAdmin, onUserClick, onPostClick, onAction }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

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
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (type, e) => {
    e.stopPropagation();
    setShowMenu(false);
    onAction?.(type, post.id);
  };

  const isMyPost = post.user?.id === currentUserId;
  const canDelete = isMyPost || isAdmin;

  return (
    <article
      className={`post-card ${showMenu ? 'post-card--menu-open' : ''}`}
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
          <img
            src={post.user?.avatar ? getMediaUrl(post.user.avatar) : '/default_avatar.png'}
            alt={post.user?.name || 'User'}
          />
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
          <p className="post-card__text">{renderContentWithLinks(post.content)}</p>

          {/* Image */}
          {post.image && (
            <div className="post-card__image">
              <img src={getMediaUrl(post.image)} alt="投稿画像" />
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
            <div className="post-card__more-container" ref={menuRef}>
              <button
                className="post-card__action post-card__action--more"
                onClick={handleMore}
                aria-label="その他"
              >
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <div className="post-card__dropdown-menu">
                  {canDelete && (
                    <button
                      className="post-card__dropdown-item post-card__dropdown-item--danger"
                      onClick={(e) => handleMenuAction('delete', e)}
                    >
                      削除する
                    </button>
                  )}
                  {!isMyPost && (
                    <button
                      className="post-card__dropdown-item post-card__dropdown-item--danger"
                      onClick={(e) => handleMenuAction('block', e)}
                    >
                      ブロック
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
