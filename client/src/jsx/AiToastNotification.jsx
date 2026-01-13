// src/jsx/AiToastNotification.jsx
import { useState, useEffect } from 'react';
import './AiToastNotification.css';

export default function AiToastNotification() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, duration = 8000) => {
    const id = Date.now();
    const newToast = { id, message };

    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  // Expose globally
  useEffect(() => {
    window.showAiToast = showToast;
    
    // ✅ Cleanup to avoid issues
    return () => {
      delete window.showAiToast;
    };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-notification">
          <div className="toast-content">
            <span className="toast-icon">✨</span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <button
            className="toast-close"
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}