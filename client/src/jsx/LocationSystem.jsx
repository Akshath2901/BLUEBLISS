import React, { useState, useEffect } from 'react';
import { MapPin, Loader, AlertCircle, Check, Home, Briefcase, Heart, Plus, Trash2, X } from 'lucide-react';

export default function LocationSystem() {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState({
    label: 'home',
    street: '',
    area: '',
    landmark: '',
    houseNo: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    detectUserLocation();
    loadSavedAddresses();
  }, []);

  const detectUserLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        getReverseGeocode(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setError(`Unable to get location: ${err.message}`);
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const getReverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "User-Agent": "bluebliss/1.0 (contact: info@blueblissfoods.com)",
            "Accept-Language": "en",
          }
        }
      );
      const data = await response.json();
      
      const address = data.address || {};
      
      setFormData(prev => ({
        ...prev,
        street: address.road || '',
        area: address.neighbourhood || address.suburb || '',
        landmark: address.amenity || '',
        houseNo: address.house_number || '',
        city: address.city || address.town || address.village || '',
        state: address.state || '',
        pincode: address.postcode || ''
      }));
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      setError('Could not fetch address details. Please fill manually.');
    }
  };

  const loadSavedAddresses = () => {
    try {
      const saved = localStorage.getItem('bluebliss_addresses');
      if (saved) {
        const parsedAddresses = JSON.parse(saved);
        setAddresses(parsedAddresses);
        if (parsedAddresses.length > 0) {
          setSelectedAddress(parsedAddresses[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    }
  };

  const saveAddress = () => {
    if (!formData.street.trim() || !formData.area.trim() || !formData.city.trim()) {
      setError('Please fill in Street, Area, and City');
      return;
    }

    const newAddress = {
      id: Date.now(),
      ...formData,
      fullAddress: `${formData.houseNo} ${formData.street}, ${formData.area}, ${formData.city}, ${formData.state} ${formData.pincode}`.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    
    try {
      localStorage.setItem('bluebliss_addresses', JSON.stringify(updatedAddresses));
    } catch (err) {
      console.error('Error saving address:', err);
    }

    setSelectedAddress(newAddress.id);
    setShowAddressForm(false);
    setFormData({ label: 'home', street: '', area: '', landmark: '', houseNo: '', city: '', state: '', pincode: '' });
    setError(null);
  };

  const deleteAddress = (id) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    setAddresses(updatedAddresses);
    
    try {
      localStorage.setItem('bluebliss_addresses', JSON.stringify(updatedAddresses));
    } catch (err) {
      console.error('Error updating addresses:', err);
    }

    if (selectedAddress === id) {
      setSelectedAddress(updatedAddresses[0]?.id || null);
    }
  };

  const getLabelIcon = (label) => {
    switch(label) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      case 'favorite': return <Heart className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const currentAddress = addresses.find(addr => addr.id === selectedAddress);

  return (
    <div className="location-page" style={{ background: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '50px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '700', background: 'linear-gradient(135deg, #1c1c1c 0%, #4a4a4a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '10px' }}>
            📍 Delivery Address
          </h1>
          <p style={{ fontSize: '16px', color: '#666' }}>Manage your delivery locations</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fee', border: '2px solid #f99', borderRadius: '12px', padding: '16px', marginBottom: '30px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertCircle style={{ color: '#d00', marginTop: '2px', flexShrink: 0 }} />
            <span style={{ color: '#d00', fontSize: '15px' }}>{error}</span>
          </div>
        )}

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

          {/* Left Column - Address List */}
          <div>
            {/* Detect Location Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1c1c1c', margin: 0 }}>Current Location</h2>
                <button
                  onClick={detectUserLocation}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: loading ? '#999' : 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                    color: '#1c1c1c',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
                >
                  {loading ? <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <MapPin style={{ width: '16px', height: '16px' }} />}
                  {loading ? 'Detecting...' : 'Detect'}
                </button>
              </div>

              {userLocation && (
                <div style={{ background: '#e3f2fd', border: '2px solid #bbdefb', borderRadius: '10px', padding: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#1c1c1c', margin: '0', fontWeight: '500' }}>✓ Location detected successfully</p>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>Coordinates: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</p>
                </div>
              )}
            </div>

            {/* Saved Addresses */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1c1c1c', margin: '0 0 20px 0' }}>Saved Addresses</h2>
              
              {addresses.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '30px 0', margin: 0 }}>No addresses saved yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: selectedAddress === addr.id ? '3px solid #ffd700' : '2px solid #e0e0e0',
                        background: selectedAddress === addr.id ? '#fffbf0' : '#f5f5f5',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => selectedAddress !== addr.id && (e.currentTarget.style.borderColor = '#ddd')}
                      onMouseLeave={(e) => selectedAddress !== addr.id && (e.currentTarget.style.borderColor = '#e0e0e0')}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                          <div style={{ color: '#ffd700', marginTop: '2px' }}>{getLabelIcon(addr.label)}</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1c1c1c', margin: 0, textTransform: 'capitalize' }}>{addr.label}</p>
                            <p style={{ fontSize: '13px', color: '#666', marginTop: '6px', lineHeight: '1.4' }}>
                              {addr.houseNo && `${addr.houseNo}, `}{addr.street}
                            </p>
                            <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                              {addr.area}, {addr.city}
                            </p>
                            {addr.landmark && <p style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>📌 Near: {addr.landmark}</p>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '10px' }}>
                          {selectedAddress === addr.id && <Check style={{ width: '20px', height: '20px', color: '#4caf50' }} />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAddress(addr.id);
                            }}
                            style={{
                              background: '#fee',
                              border: 'none',
                              color: '#d00',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => (e.target.style.background = '#fdd')}
                            onMouseLeave={(e) => (e.target.style.background = '#fee')}
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ffd700',
                  background: 'white',
                  color: '#ffd700',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fffbf0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                <Plus style={{ width: '18px', height: '18px' }} />
                {showAddressForm ? 'Close' : 'Add New Address'}
              </button>
            </div>
          </div>

          {/* Right Column - Form & Summary */}
          <div>
            {/* Add Address Form */}
            {showAddressForm && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1c1c1c', margin: 0 }}>Add New Address</h2>
                  <button
                    onClick={() => setShowAddressForm(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
                  >
                    <X style={{ width: '24px', height: '24px', color: '#666' }} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Label Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1c1c1c', marginBottom: '8px' }}>📍 Address Type</label>
                    <select
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #ddd',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#ffd700')}
                      onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                    >
                      <option value="home">🏠 Home</option>
                      <option value="work">💼 Work</option>
                      <option value="favorite">❤️ Favorite</option>
                      <option value="other">📍 Other</option>
                    </select>
                  </div>

                  {/* House Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1c1c1c', marginBottom: '8px' }}>House No. / Building</label>
                    <input
                      type="text"
                      value={formData.houseNo}
                      onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
                      placeholder="e.g., 123, Flat 5-B"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #ddd',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#ffd700')}
                      onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                    />
                  </div>

                  {/* Street */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1c1c1c', marginBottom: '8px' }}>Street Address *</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="e.g., Main Road, Street name"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #ddd',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#ffd700')}
                      onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                    />
                  </div>

                  {/* Area */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1c1c1c', marginBottom: '8px' }}>Area / Locality *</label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="e.g., Kokatat Colony, Hyderabad"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #ddd',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#ffd700')}
                      onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                    />
                  </div>

                  {/* Landmark */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1c1c1c', marginBottom: '8px' }}>📌 Landmark (Optional)</label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="e.g., Near XYZ School, opposite Police Station"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #ddd',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#ffd700')}
                      onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                    />
                  </div>

                  {/* City & State Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1c1c1c', marginBottom: '8px' }}>City *</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g., Hyderabad"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '2px solid #ddd',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#ffd700')}
                        onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1c1c1c', marginBottom: '8px' }}>State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="e.g., Telangana"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '2px solid #ddd',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#ffd700')}
                        onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                      />
                    </div>
                  </div>

                  {/* Pincode */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1c1c1c', marginBottom: '8px' }}>Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="e.g., 500064"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #ddd',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#ffd700')}
                      onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                    />
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button
                      onClick={saveAddress}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                        color: '#1c1c1c',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => (e.target.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
                    >
                      Save Address
                    </button>
                    <button
                      onClick={() => setShowAddressForm(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'white',
                        color: '#666',
                        border: '2px solid #ddd',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => (e.target.style.borderColor = '#ffd700')}
                      onMouseLeave={(e) => (e.target.style.borderColor = '#ddd')}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Address Summary */}
            {currentAddress && (
              <div style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                borderRadius: '16px',
                padding: '24px',
                color: '#1c1c1c',
                boxShadow: '0 8px 24px rgba(218, 165, 32, 0.3)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0' }}>📍 Delivery Address</h3>
                <p style={{ fontSize: '15px', margin: '8px 0', fontWeight: '500' }}>
                  {currentAddress.houseNo && `${currentAddress.houseNo}, `}{currentAddress.street}
                </p>
                <p style={{ fontSize: '13px', margin: '6px 0' }}>
                  {currentAddress.area}, {currentAddress.city}, {currentAddress.state} {currentAddress.pincode}
                </p>
                {currentAddress.landmark && (
                  <p style={{ fontSize: '13px', margin: '6px 0', opacity: 0.85 }}>
                    📌 Near: {currentAddress.landmark}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}