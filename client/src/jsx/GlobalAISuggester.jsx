// client/src/jsx/GlobalAISuggester.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function GlobalAISuggester() {
  const [suggestion, setSuggestion] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { cart } = useContext(CartContext);
  const location = useLocation();
  const userIdRef = useRef(localStorage.getItem('userId') || 'guest-' + Math.random());
  const lastSuggestionTimeRef = useRef(0);
  const currentPageRef = useRef('');

  // Inject styles once on mount
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideOutUp {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }

      .global-ai-banner {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        max-width: 600px;
        width: 90%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
        z-index: 997;
        animation: slideInDown 0.5s ease-out;
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .global-ai-banner.hiding {
        animation: slideOutUp 0.5s ease-out forwards;
      }

      .global-ai-icon {
        font-size: 24px;
        min-width: 24px;
      }

      .global-ai-content {
        flex: 1;
      }

      .global-ai-text {
        font-size: 14px;
        line-height: 1.5;
        font-weight: 500;
      }

      .global-ai-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.3s ease;
      }

      .global-ai-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }

      @media (max-width: 768px) {
        .global-ai-banner {
          top: 70px;
          width: 95%;
          padding: 14px 16px;
        }

        .global-ai-text {
          font-size: 13px;
        }
      }
    `;
    document.head.appendChild(styleTag);

    return () => document.head.removeChild(styleTag);
  }, []);

  // Store userId if not present
  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userIdRef.current);
    } else {
      userIdRef.current = localStorage.getItem('userId');
    }
  }, []);

  // Track page visits
  useEffect(() => {
    const pageName = location.pathname.split('/')[1] || 'home';
    currentPageRef.current = pageName;

    // Track the page visit
    trackPageVisit(pageName);

    // Fetch real-time suggestion for this page
    fetchRealTimeSuggestion(pageName);
  }, [location.pathname]);

  // Track cart changes
  useEffect(() => {
    if (cart && cart.length > 0) {
      updateCart();
    }
  }, [cart]);

  const trackPageVisit = async (pageName) => {
    try {
      await fetch('http://localhost:5001/api/ai/track-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdRef.current,
          pageName,
          metadata: {
            cartItems: cart.length,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.error('Track page error:', error);
    }
  };

  const updateCart = async () => {
    try {
      await fetch('http://localhost:5001/api/ai/update-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdRef.current,
          cartItems: cart
        })
      });
    } catch (error) {
      console.error('Update cart error:', error);
    }
  };

  const fetchRealTimeSuggestion = async (pageName) => {
    const now = Date.now();
    // Only fetch suggestions every 10 seconds max
    if (now - lastSuggestionTimeRef.current < 10000) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/ai/real-time-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdRef.current,
          currentPage: pageName
        })
      });

      const data = await response.json();
      if (data.success && data.suggestion) {
        setSuggestion(data.suggestion);
        setIsVisible(true);
        lastSuggestionTimeRef.current = now;

        // Auto-hide after 8 seconds
        setTimeout(() => setIsVisible(false), 8000);
      }
    } catch (error) {
      console.error('Suggestion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible || !suggestion) return null;

  return (
    <div className="global-ai-banner">
      <div className="global-ai-icon">✨</div>
      <div className="global-ai-content">
        <div className="global-ai-text">{suggestion}</div>
      </div>
      <button
        className="global-ai-close"
        onClick={() => setIsVisible(false)}
      >
        ✕
      </button>
    </div>
  );
}