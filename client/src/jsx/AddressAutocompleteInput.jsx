import { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { calculateDelivery } from '../lib/api';

const libraries = ['places'];

const AddressAutocompleteInput = ({ 
  onAddressSelect, 
  placeholder = "🔍 Search for your location",
  showDeliveryInfo = true,
  initialValue = ""
}) => {
  const [address, setAddress] = useState(initialValue);
  const [coordinates, setCoordinates] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: 'in' },
          fields: ['address_components', 'geometry', 'formatted_address'],
          types: ['address'],
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }
  }, [isLoaded]);

  const handlePlaceSelect = async () => {
    const place = autocompleteRef.current.getPlace();

    if (!place.geometry) {
      setError('Please select a valid address from the dropdown');
      return;
    }

    const selectedAddress = place.formatted_address;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Extract address components
    const components = {};
    place.address_components.forEach(component => {
      const types = component.types;
      if (types.includes('street_number')) components.houseNo = component.long_name;
      if (types.includes('route')) components.street = component.long_name;
      if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        components.area = component.long_name;
      }
      if (types.includes('locality')) components.city = component.long_name;
      if (types.includes('administrative_area_level_1')) components.state = component.long_name;
      if (types.includes('postal_code')) components.pincode = component.long_name;
    });

    setAddress(selectedAddress);
    setCoordinates({ lat, lng });
    setError(null);

    // Calculate delivery details if needed
    let calculatedDeliveryInfo = null;
    if (showDeliveryInfo) {
      calculatedDeliveryInfo = await fetchDeliveryDetails(lat, lng);
    }

    // Send data to parent component
    if (onAddressSelect) {
      onAddressSelect({
        fullAddress: selectedAddress,
        coordinates: { lat, lng },
        components: {
          houseNo: components.houseNo || '',
          street: components.street || '',
          area: components.area || '',
          city: components.city || '',
          state: components.state || '',
          pincode: components.pincode || '',
        },
        deliveryInfo: calculatedDeliveryInfo,
      });
    }
  };

  const fetchDeliveryDetails = async (lat, lng) => {
    setLoading(true);
    setError(null);

    try {
      const response = await calculateDelivery({ lat, lng });

      if (response.success) {
        setDeliveryInfo(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      setError('Failed to calculate delivery details');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <div style={{ padding: '12px', background: '#fee', borderRadius: '8px', color: '#c33' }}>
        ❌ Error loading Google Maps. Please refresh the page.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
        Loading address search...
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', marginBottom: showDeliveryInfo ? '15px' : '0' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 45px 12px 16px',
            fontSize: '14px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            outline: 'none',
            transition: 'all 0.3s ease',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#ffd700';
            e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e0e0e0';
            e.target.style.boxShadow = 'none';
          }}
        />
        {loading && (
          <div
            style={{
              position: 'absolute',
              right: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '18px',
              height: '18px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #ffd700',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '10px 12px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            marginBottom: '12px',
            fontSize: '13px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {showDeliveryInfo && coordinates && deliveryInfo && (
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            border: '2px solid',
            background: deliveryInfo.isDeliverable ? '#e8f5e9' : '#ffebee',
            borderColor: deliveryInfo.isDeliverable ? '#4caf50' : '#f44336',
            marginTop: '12px',
          }}
        >
          {deliveryInfo.isDeliverable ? (
            <div>
              <p style={{ fontSize: '13px', color: '#4caf50', fontWeight: '700', margin: '0 0 8px 0' }}>
                ✅ We deliver to this area!
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#666' }}>Distance:</span>
                  <strong style={{ marginLeft: '4px' }}>{deliveryInfo.distance}</strong>
                </div>
                <div>
                  <span style={{ color: '#666' }}>Delivery in:</span>
                  <strong style={{ marginLeft: '4px', color: '#4caf50' }}>{deliveryInfo.deliveryTime}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: '#d32f2f', fontWeight: '700', margin: '0 0 4px 0' }}>
                ❌ Sorry, we don't deliver here yet
              </p>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                We currently deliver within {deliveryInfo.maxDistance}
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddressAutocompleteInput;