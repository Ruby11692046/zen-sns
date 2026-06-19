import { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = type === 'success' ? Check : X;

  return (
    <div className={`toast-container toast-container--${type}`} role="alert">
      <div className="toast-icon">
        <Icon size={18} />
      </div>
      <span className="toast-message">{message}</span>
    </div>
  );
}
