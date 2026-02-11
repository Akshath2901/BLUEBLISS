// client/src/jsx/AIChat.jsx
import { useState, useRef, useEffect, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import './AIChat.css';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your BlueBLISS AI assistant. 🍕 Add items to your cart and I'll suggest the perfect combo deals for you!",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const cartContext = useContext(CartContext);
const cart = cartContext?.cart || [];

  const messagesEndRef = useRef(null);
  const lastSuggestionTimeRef = useRef(0);
  const lastCartStateRef = useRef(JSON.stringify(cart));
 const userIdRef = useRef(null);


  // Store userId on mount
// Store userId on mount (SAFE)
useEffect(() => {
  try {
    if (typeof window === "undefined") return;

    const existingId = window.localStorage.getItem("userId");

    if (existingId) {
      userIdRef.current = existingId;
    } else {
      const newId = "guest-" + Math.random().toString(36).slice(2);
      window.localStorage.setItem("userId", newId);
      userIdRef.current = newId;
    }
  } catch (e) {
    console.error("localStorage unavailable, using fallback userId");
    userIdRef.current = "guest-" + Math.random().toString(36).slice(2);
  }
}, []);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Monitor cart changes and get AI suggestions
  useEffect(() => {
     if (!Array.isArray(cart)) return;
    const currentCartState = JSON.stringify(cart);
    
    if (currentCartState !== lastCartStateRef.current) {
      lastCartStateRef.current = currentCartState;
      updateGlobalContext();

      if (cart.length >= 2) {
        const now = Date.now();
        if (now - lastSuggestionTimeRef.current > 5000) {
          suggestComboForCart(cart);
          lastSuggestionTimeRef.current = now;
        }
      }
    }
  }, [cart]);

  // Update cart on backend
  const updateGlobalContext = async () => {
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
      console.error('Context update error:', error);
    }
  };

  // Get combo suggestions
  const suggestComboForCart = async (items) => {
    if (items.length < 2) return;

    setIsLoading(true);
    try {
      const itemNames = items.map(item => `${item.name} (${item.qty}x)`).join(', ');
      const totalPrice = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

      const prompt = `Customer has: ${itemNames}
Cart total: ₹${totalPrice}

Suggest ONE money-saving combo deal (1-2 sentences). Be enthusiastic and mention savings.`;

      const response = await fetch('http://localhost:5001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userIdRef.current,
          message: prompt 
        })
      });

      const data = await response.json();

      if (data.success && data.aiResponse) {
        const aiMessage = {
          id: messages.length + 1,
          text: data.aiResponse,
          sender: 'ai',
          timestamp: new Date(),
          type: 'suggestion'
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Suggestion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send user message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userIdRef.current,
          message: inputValue 
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          id: messages.length + 2,
          text: data.aiResponse,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: messages.length + 2,
          text: `Error: ${data.error}`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: `Failed to connect. Make sure the server is running on http://localhost:5001`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hi! I'm your BlueBLISS AI assistant. 🍕 Add items to your cart and I'll suggest the perfect combo deals for you!",
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className="premium-ai-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with AI Assistant"
      >
        <span className="ai-ring"></span>
        <span className="ai-ring"></span>
        <span className="ai-icon-animated">✨</span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="premium-ai-modal">
          {/* Header */}
          <div className="premium-ai-header">
            <div className="premium-ai-title">
              <span className="ai-icon-animated">🤖</span>
              <h3>BlueBLISS AI</h3>
            </div>
            <div className="premium-ai-actions">
              <button
                className="premium-clear-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                🔄
              </button>
              <button
                className="premium-close-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="premium-ai-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`premium-message ${msg.sender === 'user' ? 'user-msg' : 'ai-msg'} ${msg.type === 'suggestion' ? 'suggestion' : ''}`}
              >
                <div className="premium-message-content">{msg.text}</div>
                <span className="premium-message-time">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="premium-message ai-msg">
                <div className="premium-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="premium-ai-form">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(e)}
              placeholder="Ask about dishes, combos, or recommendations..."
              className="premium-ai-input"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              className="premium-send-btn"
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? '⏳' : '→'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}