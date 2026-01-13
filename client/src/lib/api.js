import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
// ↑ Changed to 5001

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Calculate delivery details
export const calculateDelivery = async (destination) => {
  try {
    const response = await api.post('/api/delivery/calculate', {
      destination,
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating delivery:', error);
    throw error;
  }
};

// Get restaurant location
export const getRestaurantLocation = async () => {
  try {
    const response = await api.get('/api/delivery/restaurant-location');
    return response.data;
  } catch (error) {
    console.error('Error getting restaurant location:', error);
    throw error;
  }
};

export default api;