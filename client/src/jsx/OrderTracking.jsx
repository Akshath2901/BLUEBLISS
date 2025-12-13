import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GoogleMapsTracking from './GoogleMapsTracking';
import { X } from 'lucide-react';

export default function OrderTracking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, total, address, cart } = location.state || {};

  // Order Status States
  const [orderStatus, setOrderStatus] = useState('preparing');
  const [timeRemaining, setTimeRemaining] = useState(35);
  const [showDetails, setShowDetails] = useState(false);

  // Restaurant location (hardcoded - update with your restaurant's actual location)
  const restaurantLocation = {
    latitude: 17.3850,
    longitude: 78.4867,
    name: "BlueBliss Cloud Kitchen"
  };

  // Simulate order status progression
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setOrderStatus(prev => {
        if (prev === 'preparing') return 'on-way';
        if (prev === 'on-way') return 'delivered';
        return prev;
      });
    }, 8000);

    return () => clearInterval(statusInterval);
  }, []);

  // Simulate time countdown
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  if (!location.state) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#d00' }}>⚠ Order details missing</p>
        <button onClick={() => navigate('/')} style={{
          marginTop: '20px', padding: '12px 30px', background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
          border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer'
        }}>
          Go to Home
        </button>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'preparing': return '👨‍🍳';
      case 'on-way': return '🚴';
      case 'delivered': return '✅';
      default: return '📦';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'preparing': return 'Preparing your order';
      case 'on-way': return 'Your order is on the way';
      case 'delivered': return 'Order delivered';
      default: return 'Processing';
    }
  };

  const handleCall = () => {
    window.location.href = 'tel:+919876543210';
  };

  const handleWhatsApp = () => {
    const message = `Hi, I have placed an order (ID: #${orderId}). Please update on my order status.`;
    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Convert address to coordinates (basic lat/lng for demo)
  const userLocation = {
    latitude: address?.latitude || 17.3950,
    longitude: address?.longitude || 78.4956,
    address: address
  };

  return (
    <div style={{ background: 'linear-gradient(to bottom, #f0f2f5, #e8eaed)', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1c1c1c 0%, #2c2c2c 100%)',
        color: 'white',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Order Tracking</h1>
            <p style={{ fontSize: '14px', opacity: 0.8, margin: '4px 0 0 0' }}>Order #{orderId}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>

        {/* Google Maps Section */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          marginBottom: '20px',
          position: 'relative'
        }}>
          <GoogleMapsTracking 
            restaurantLocation={restaurantLocation}
            userLocation={userLocation}
            orderStatus={orderStatus}
          />

          {/* Floating Time Badge */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            padding: '12px 20px',
            borderRadius: '20px',
            fontWeight: '600',
            color: '#1c1c1c',
            boxShadow: '0 4px 12px rgba(218, 165, 32, 0.3)',
            zIndex: 10
          }}>
            ⏱ {timeRemaining} min
          </div>
        </div>

        {/* Status Progress */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1c1c1c', margin: '0 0 20px 0' }}>
            {getStatusIcon(orderStatus)} {getStatusText(orderStatus)}
          </h2>

          {/* Status Steps */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            {/* Step 1 */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: orderStatus === 'preparing' ? '#ffd700' : orderStatus !== 'preparing' ? '#4caf50' : '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                color: '#1c1c1c',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                {orderStatus !== 'preparing' ? '✓' : '1'}
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1c1c1c', margin: 0 }}>Order Confirmed</p>
              <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>Just now</p>
            </div>

            {/* Step 2 */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: orderStatus === 'on-way' ? '#ffd700' : orderStatus === 'delivered' ? '#4caf50' : '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                color: '#1c1c1c',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                {orderStatus === 'delivered' ? '✓' : '2'}
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1c1c1c', margin: 0 }}>On the Way</p>
              <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>3 mins</p>
            </div>

            {/* Step 3 */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: orderStatus === 'delivered' ? '#4caf50' : '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                color: 'white',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                3
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1c1c1c', margin: 0 }}>Delivered</p>
              <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>{timeRemaining} mins</p>
            </div>
          </div>
        </div>

        {/* Contact Driver */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px'
            }}>
              👨
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#1c1c1c', margin: 0 }}>Delivery Partner</p>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>Rajesh Kumar • 4.9 ⭐</p>
            </div>
            <div style={{
              background: '#e0e0e0',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#1c1c1c'
            }}>
              🚴 Bike
            </div>
          </div>

          {/* Contact Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={handleCall}
              style={{
                padding: '12px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📞 Call
            </button>
            <button
              onClick={handleWhatsApp}
              style={{
                padding: '12px',
                background: '#25d366',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              💬 WhatsApp
            </button>
          </div>
        </div>

        {/* Order Details */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          <div
            onClick={() => setShowDetails(!showDetails)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              paddingBottom: '15px',
              borderBottom: '2px solid #f0f0f0'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1c1c1c', margin: 0 }}>📦 Order Details</h3>
            <span style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </div>

          {showDetails && (
            <div style={{ marginTop: '15px' }}>
              {cart && cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>{item.name} × {item.qty}</span>
                  <span style={{ fontWeight: '600', color: '#1c1c1c' }}>₹{item.price * item.qty}</span>
                </div>
              ))}
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Address */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1c1c1c', margin: '0 0 15px 0' }}>📍 Delivery Address</h3>
          {address ? (
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '10px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1c1c1c', margin: '0 0 6px 0' }}>
                {address.houseNo && `${address.houseNo}, `}{address.street}
              </p>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px 0' }}>
                {address.area}, {address.city}, {address.state} {address.pincode}
              </p>
              {address.landmark && (
                <p style={{ fontSize: '13px', color: '#999', margin: '4px 0 0 0' }}>
                  📌 Near: {address.landmark}
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: '#d00' }}>Address not available</p>
          )}
        </div>
      </div>
    </div>
  );
}