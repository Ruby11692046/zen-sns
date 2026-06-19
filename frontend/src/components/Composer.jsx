import { useState } from 'react';
import { ImagePlus, Send, X, AlertTriangle } from 'lucide-react';
import { processImage } from '../services/imageProcessor';
import { getMediaUrl } from '../services/api';
import './Composer.css';

export default function Composer({ user, isMuted, onSubmit }) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processed = await processImage(file);
        setImageFile(processed);
        setImagePreview(URL.createObjectURL(processed));
      } catch (err) {
        console.error("Failed to process image:", err);
        window.showToast?.("画像の処理に失敗しました。", "error");
      }
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = () => {
    if (!text.trim() && !imageFile) return;
    onSubmit?.({ text: text.trim(), imageFile });
    setText('');
    handleRemoveImage();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  if (isMuted) {
    return (
      <div className="composer composer--muted" id="composer">
        <div className="composer__muted-overlay">
          <AlertTriangle size={20} />
          <p className="composer__muted-text">
            あなたはミュートされています
          </p>
          <a
            href="https://forms.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="composer__muted-link"
          >
            異議申し立てはこちら
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="composer" id="composer">
      <div className="avatar composer__avatar">
        <img src={(user?.avatar_url || user?.avatar) ? getMediaUrl(user.avatar_url || user.avatar) : '/default_avatar.png'} alt={user?.name || 'User'} />
      </div>
      <div className="composer__input-area">
        <textarea
          className="composer__textarea"
          placeholder="いまどうしてる？"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={300}
          rows={1}
          id="composer-textarea"
        />
        {imagePreview && (
          <div className="composer__image-preview">
            <div className="composer__image-container">
              <img src={imagePreview} alt="アップロードプレビュー" />
            </div>
            <button
              className="composer__image-remove"
              onClick={handleRemoveImage}
              aria-label="画像を削除"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="composer__toolbar">
          <label className="composer__tool-btn" aria-label="画像を添付">
            <ImagePlus size={20} />
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {text.length > 0 && (
              <span className={`composer__counter ${text.length >= 280 ? 'warning' : ''}`} style={{ fontSize: '0.75rem', color: text.length >= 280 ? 'var(--color-accent)' : 'var(--color-text-secondary)', transition: 'color 0.2s' }}>
                {text.length}/300
              </span>
            )}
            <button
              className="btn btn--primary btn--sm composer__submit"
              onClick={handleSubmit}
              disabled={(!text.trim() && !imageFile) || text.length > 300}
              id="composer-submit"
            >
              <Send size={14} />
              <span>投稿</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
