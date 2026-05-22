import { useState } from 'react';
import { ImagePlus, Send, X, AlertTriangle } from 'lucide-react';
import './Composer.css';

export default function Composer({ user, isMuted, onSubmit }) {
  const [text, setText] = useState('');
  const [imageName, setImageName] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && !imageName) return;
    onSubmit?.({ text: text.trim(), image: imageName });
    setText('');
    setImageName(null);
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
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} />
        ) : (
          user?.name?.[0] || '?'
        )}
      </div>
      <div className="composer__input-area">
        <textarea
          className="composer__textarea"
          placeholder="いまどうしてる？"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          id="composer-textarea"
        />
        {imageName && (
          <div className="composer__image-preview">
            <span className="composer__image-name truncate">📎 {imageName}</span>
            <button
              className="composer__image-remove"
              onClick={() => setImageName(null)}
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
              className="sr-only"
              onChange={handleImageSelect}
            />
          </label>
          <button
            className="btn btn--primary btn--sm composer__submit"
            onClick={handleSubmit}
            disabled={!text.trim() && !imageName}
            id="composer-submit"
          >
            <Send size={14} />
            <span>投稿</span>
          </button>
        </div>
      </div>
    </div>
  );
}
