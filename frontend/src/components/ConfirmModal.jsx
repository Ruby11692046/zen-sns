import './ConfirmModal.css';

export default function ConfirmModal({ message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'キャンセル' }) {
  return (
    <div className="confirm-modal-overlay" onClick={onCancel || onConfirm}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          {onCancel && (
            <button
              className="btn btn--secondary confirm-modal-btn"
              onClick={onCancel}
              id="confirm-cancel-btn"
            >
              {cancelText}
            </button>
          )}
          <button
            className="btn btn--primary confirm-modal-btn"
            onClick={onConfirm}
            id="confirm-ok-btn"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
