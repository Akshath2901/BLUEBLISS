// Client-side: client/src/pages/ComboBuilder.jsx
import { useState, useEffect, useRef } from 'react';
import { Heart, Zap, TrendingUp, AlertCircle } from 'lucide-react';

export default function ComboBuilder() {
  const [allDishes, setAllDishes] = useState([]);
  const [cart, setCart] = useState([]);
  const [combos, setCombos] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [suggestedCombo, setSuggestedCombo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");
  const suggestionsRef = useRef(null);

  // Load dishes on mount
  useEffect(() => {
    const loadDishes = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/menus");
        if (response.ok) {
          const data = await response.json();
          setAllDishes(data.flat());
        }
      } catch (error) {
        console.error("Error loading dishes:", error);
      }
    };

    const loadCombos = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/combo/combos");
        if (response.ok) {
          const data = await response.json();
          setCombos(data.combos || []);
        }
      } catch (error) {
        console.error("Error loading combos:", error);
      }
    };

    loadDishes();
    loadCombos();
  }, []);

  // Analyze cart whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      analyzeCartWithAI();
    } else {
      setAiSuggestion("");
      setSuggestedCombo(null);
    }
  }, [cart]);

  const analyzeCartWithAI = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/combo/analyze-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItems: cart })
      });

      const data = await response.json();
      if (data.success) {
        setAiSuggestion(data.aiSuggestion);
        setSuggestedCombo(data.suggestedCombo);
        suggestionsRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error analyzing cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (dish) => {
    setCart([...cart, { ...dish, cartId: Date.now() + Math.random() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  const cartItemCount = cart.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <style>{`
        .combo-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .combo-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .combo-container {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 20px;
          padding: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .combo-container {
            grid-template-columns: 1fr;
          }
        }

        .combo-dishes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .combo-dish-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #e8e8e8;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .combo-dish-card:hover {
          border-color: #667eea;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
        }

        .combo-dish-img {
          width: 100%;
          height: 180px;
          background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }

        .combo-dish-info {
          padding: 16px;
        }

        .combo-dish-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .combo-dish-category {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }

        .combo-dish-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .combo-dish-price {
          font-weight: 700;
          color: #667eea;
          font-size: 16px;
        }

        .combo-add-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .combo-add-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .combo-sidebar {
          position: sticky;
          top: 20px;
          height: fit-content;
        }

        .combo-cart-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 20px;
        }

        .combo-cart-title {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .combo-cart-items {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .combo-cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .combo-cart-item-price {
          color: #667eea;
          font-weight: 600;
        }

        .combo-remove-btn {
          background: #ff4757;
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .combo-cart-total {
          border-top: 2px solid #e8e8e8;
          padding-top: 12px;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .combo-suggestion-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          border-left: 4px solid rgba(255, 255, 255, 0.3);
        }

        .combo-suggestion-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .combo-suggestion-text {
          font-size: 13px;
          line-height: 1.5;
          opacity: 0.95;
        }

        .combo-suggestion-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          margin-top: 10px;
          transition: all 0.3s ease;
        }

        .combo-suggestion-button:hover {
          transform: scale(1.05);
        }

        .combo-preset-combos {
          background: white;
          border-radius: 12px;
          padding: 16px;
          border: 2px solid #e8e8e8;
        }

        .combo-preset-title {
          font-weight: 700;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #333;
        }

        .combo-preset-item {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
        }

        .combo-preset-item:hover {
          background: #667eea;
          color: white;
          border-left-color: white;
        }

        .combo-preset-name {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .combo-preset-price {
          font-size: 12px;
          opacity: 0.8;
        }

        .combo-preset-save {
          color: #2ecc71;
          font-weight: 600;
        }

        .combo-empty {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }

        .combo-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .combo-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          width: 100%;
          transition: all 0.3s ease;
        }

        .combo-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .combo-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .combo-loading {
          display: inline-block;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .combo-alert {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          border-radius: 6px;
          font-size: 13px;
          color: #333;
          margin-bottom: 16px;
          display: flex;
          align-items: start;
          gap: 10px;
        }

        .combo-alert-icon {
          color: #ffc107;
          flex-shrink: 0;
          margin-top: 2px;
        }
      `}</style>

      {/* Header */}
      <div className="combo-header">
        <h1 style={{ margin: 0, position: 'relative', zIndex: 1, fontSize: '32px', fontWeight: '700' }}>
          🍕 Create Your Perfect Combo
        </h1>
        <p style={{ margin: '10px 0 0 0', position: 'relative', zIndex: 1, opacity: 0.9 }}>
          Mix & match dishes or choose from our curated combinations!
        </p>
      </div>

      {/* Main Container */}
      <div className="combo-container">
        {/* Dishes Grid */}
        <div>
          {allDishes.length === 0 ? (
            <div className="combo-empty">
              <div className="combo-empty-icon">🍽️</div>
              <p>Loading dishes...</p>
            </div>
          ) : (
            <div className="combo-dishes-grid">
              {allDishes.map((dish, idx) => (
                <div key={idx} className="combo-dish-card">
                  <div className="combo-dish-img">
                    {dish.img ? <img src={dish.img} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
                  </div>
                  <div className="combo-dish-info">
                    <div className="combo-dish-name">{dish.name}</div>
                    <div className="combo-dish-category">{dish.category}</div>
                    <div className="combo-dish-bottom">
                      <div className="combo-dish-price">₹{dish.price}</div>
                      <button className="combo-add-btn" onClick={() => addToCart(dish)}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="combo-sidebar">
          {/* Cart */}
          <div className="combo-cart-card">
            <div className="combo-cart-title">
              🛒 Your Cart ({cartItemCount})
            </div>

            {cartItemCount === 0 ? (
              <div className="combo-empty">
                <p>Add items to get started!</p>
              </div>
            ) : (
              <>
                <div className="combo-cart-items">
                  {cart.map((item) => (
                    <div key={item.cartId} className="combo-cart-item">
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.name}</div>
                        <div className="combo-cart-item-price">₹{item.price}</div>
                      </div>
                      <button className="combo-remove-btn" onClick={() => removeFromCart(item.cartId)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="combo-cart-total">
                  <span>Total:</span>
                  <span style={{ color: '#667eea' }}>₹{cartTotal}</span>
                </div>

                <button className="combo-button">Add to Cart</button>
              </>
            )}
          </div>

          {/* AI Suggestions */}
          {cartItemCount > 0 && aiSuggestion && (
            <div ref={suggestionsRef} className="combo-suggestion-box">
              <div className="combo-suggestion-title">
                <Zap size={16} />
                Smart Suggestion {loading && <span className="combo-loading"></span>}
              </div>
              <div className="combo-suggestion-text">
                {aiSuggestion}
              </div>
              {suggestedCombo && (
                <button className="combo-suggestion-button">
                  👍 Choose "{suggestedCombo.name}"
                </button>
              )}
            </div>
          )}

          {/* Preset Combos */}
          <div className="combo-preset-combos">
            <div className="combo-preset-title">
              <TrendingUp size={16} />
              Popular Combos
            </div>
            {combos.slice(0, 3).map((combo) => (
              <div key={combo.id} className="combo-preset-item">
                <div className="combo-preset-name">{combo.name}</div>
                <div className="combo-preset-price">
                  ₹{combo.comboPrice}
                  <span className="combo-preset-save"> Save ₹{combo.savings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}