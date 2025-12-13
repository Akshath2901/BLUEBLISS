import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, Timestamp, setDoc, doc } from "firebase/firestore";


function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);
  const [saved, setSaved] = useState(false);

  const { orderId, total, address, suggestion, noContact, cart } = location.state || {};

  // ⭐ SAVE ORDER TO FIRESTORE ONCE
  useEffect(() => {
    async function saveOrder() {
      if (!location.state || saved) return;
      setSaved(true);

      const user = auth.currentUser;
      if (!user) {
        console.log("User not logged in");
        return;
      }

      try {
        await setDoc(doc(db, "orders", String(orderId)), {
          orderId,
          userId: user.uid,
          items: cart,
          total,
          address,
          suggestion,
          noContact,
          status: "pending",
          createdAt: Timestamp.now()
        });

        console.log("🔥 Order saved successfully in Firestore!");
      } catch (err) {
        console.error("Error saving order:", err);
      }
    }

    saveOrder();
  }, [location.state, saved, orderId, total, address, suggestion, noContact, cart]);

  if (!location.state) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "18px", color: "#d00" }}>⚠ Order details missing</p>
        <button 
          onClick={() => navigate("/")}
          style={{
            marginTop: "20px",
            padding: "12px 30px",
            background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Go to Home
        </button>
      </div>
    );
  }

  // Share on WhatsApp
  const handleShareWhatsApp = () => {
    const message = `🎉 Order Placed Successfully! 
    
Order ID: #${orderId}
Total Amount: ₹${total}

Delivery Address:
${address?.houseNo ? address.houseNo + ', ' : ''}${address?.street}
${address?.area}, ${address?.city}, ${address?.state} ${address?.pincode}
${address?.landmark ? `📌 Near: ${address.landmark}` : ''}

${noContact ? '🔒 No-contact Delivery Enabled' : ''}
${suggestion ? `📝 Special Instructions: ${suggestion}` : ''}

Track your order: https://bluebliss.com/track-order

Thank you for ordering with BlueBliss! 🌿`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  // Copy order ID
  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    alert("✓ Order ID copied!");
  };

  return (
    <div style={{ background: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{
            fontSize: '80px',
            marginBottom: '20px',
            animation: 'bounce 1s ease-in-out'
          }}>
            ✅
          </div>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '700',
            color: '#4caf50',
            marginBottom: '10px'
          }}>
            Order Placed Successfully!
          </h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Your delicious food is being prepared
          </p>
        </div>

        {/* Order Details Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          marginBottom: '25px'
        }}>
          
          {/* Order ID */}
          <div style={{
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 10px 0' }}>Order ID</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1c1c1c', margin: 0 }}>
                #{orderId}
              </h2>
              <button
                onClick={handleCopyOrderId}
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.8)')}
                onMouseLeave={(e) => (e.target.style.background = 'rgba(255,255,255,0.5)')}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Order Items */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1c1c1c', marginBottom: '15px' }}>
              📦 Order Items
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cart && cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <span>{item.name} × {item.qty}</span>
                  <span style={{ fontWeight: '600' }}>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Breakdown */}
          <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '20px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Subtotal</span>
              <span>₹{cart && cart.reduce((acc, item) => acc + item.price * item.qty, 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Delivery Fee</span>
              <span>₹42</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <span>GST & Charges</span>
              <span>₹{(total - (cart && cart.reduce((acc, item) => acc + item.price * item.qty, 0)) - 42).toFixed(0)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '15px',
              borderTop: '2px solid #e0e0e0',
              fontSize: '18px',
              fontWeight: '700'
            }}>
              <span>Total Amount</span>
              <span style={{ color: '#4caf50' }}>₹{total}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1c1c1c', marginBottom: '12px' }}>
              📍 Delivery Address
            </h3>
            {address ? (
              <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '8px' }}>
                <p style={{ margin: '8px 0', fontSize: '14px', fontWeight: '500' }}>
                  {address.houseNo && `${address.houseNo}, `}{address.street}
                </p>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#666' }}>
                  {address.area}, {address.city}, {address.state} {address.pincode}
                </p>
                {address.landmark && (
                  <p style={{ margin: '6px 0', fontSize: '13px', color: '#666' }}>
                    📌 Near: {address.landmark}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: '#d00' }}>Address not available</p>
            )}
          </div>

          {/* No Contact & Special Instructions */}
          {(noContact || suggestion) && (
            <div style={{ marginBottom: '25px' }}>
              {noContact && (
                <div style={{
                  background: '#f0f7ff',
                  border: '2px solid #bbdefb',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  fontSize: '14px'
                }}>
                  🔒 No-contact Delivery: Order will be left at your door
                </div>
              )}
              {suggestion && (
                <div style={{
                  background: '#fffbf0',
                  border: '2px solid #ffb74d',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  📝 Special Instructions: {suggestion}
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: '2px', background: '#e0e0e0', margin: '25px 0' }}></div>

          {/* Estimated Delivery */}
          <div style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px 0' }}>Estimated Delivery</p>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#1c1c1c', margin: 0 }}>
              🕐 30-40 minutes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          <button
            onClick={handleShareWhatsApp}
            style={{
              padding: '14px',
              background: '#25d366',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => (e.target.style.background = '#1fbb52')}
            onMouseLeave={(e) => (e.target.style.background = '#25d366')}
          >
            💬 Share on WhatsApp
          </button>

          <button
            onClick={() => navigate("/track-order", { state: { orderId, total, address, cart } })}
            style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
              color: '#1c1c1c',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
          >
            📍 Track Order
          </button>
        </div>

        {/* Continue Shopping */}
        <button
          onClick={() => navigate("/")}
          style={{
            width: '100%',
            padding: '14px',
            background: 'white',
            color: '#ffd700',
            border: '2px solid #ffd700',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => (e.target.style.background = '#fffbf0')}
          onMouseLeave={(e) => (e.target.style.background = 'white')}
        >
          🏠 Continue Shopping
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;