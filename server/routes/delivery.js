const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get restaurant location from environment variables
const RESTAURANT_LOCATION = {
  lat: parseFloat(process.env.RESTAURANT_LAT) || 17.385044,
  lng: parseFloat(process.env.RESTAURANT_LNG) || 78.486671,
};

// Food preparation time in minutes
const PREP_TIME = 15;

// Maximum delivery distance in meters (10 km)
const MAX_DELIVERY_DISTANCE = 10000;

/**
 * POST /api/delivery/calculate
 * Calculate delivery distance and time
 */
router.post('/calculate', async (req, res) => {
  try {
    const { destination } = req.body;

    // Validation
    if (!destination || !destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        message: 'Destination coordinates are required',
      });
    }

    console.log('🚗 Calculating delivery for:', destination);

    // Call Google Distance Matrix API
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: `${RESTAURANT_LOCATION.lat},${RESTAURANT_LOCATION.lng}`,
          destinations: `${destination.lat},${destination.lng}`,
          mode: 'driving',
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    // Check API response
    if (response.data.status !== 'OK') {
      console.error('❌ Distance Matrix API Error:', response.data);
      return res.status(500).json({
        success: false,
        message: 'Failed to calculate distance',
        error: response.data.status,
      });
    }

    const element = response.data.rows[0].elements[0];

    // Check if route is available
    if (element.status !== 'OK') {
      return res.status(400).json({
        success: false,
        message: 'Unable to calculate route to this address',
        error: element.status,
      });
    }

    // Extract distance and duration
    const distanceInMeters = element.distance.value;
    const durationInSeconds = element.duration.value;

    // Calculate delivery details
    const distanceInKm = (distanceInMeters / 1000).toFixed(1);
    const travelTimeInMinutes = Math.ceil(durationInSeconds / 60);
    const totalDeliveryTime = PREP_TIME + travelTimeInMinutes;

    // Check if address is within delivery range
    const isDeliverable = distanceInMeters <= MAX_DELIVERY_DISTANCE;

    console.log('✅ Delivery calculated:', {
      distance: `${distanceInKm} km`,
      deliveryTime: `${totalDeliveryTime} mins`,
      isDeliverable,
    });

    // Send response
    res.json({
      success: true,
      data: {
        distance: `${distanceInKm} km`,
        distanceInMeters,
        travelTime: `${travelTimeInMinutes} mins`,
        deliveryTime: `${totalDeliveryTime} mins`,
        prepTime: `${PREP_TIME} mins`,
        isDeliverable,
        maxDistance: `${MAX_DELIVERY_DISTANCE / 1000} km`,
      },
    });
  } catch (error) {
    console.error('❌ Error calculating delivery:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating delivery details',
      error: error.message,
    });
  }
});

/**
 * GET /api/delivery/restaurant-location
 * Get restaurant coordinates
 */
router.get('/restaurant-location', (req, res) => {
  res.json({
    success: true,
    data: RESTAURANT_LOCATION,
  });
});

module.exports = router;