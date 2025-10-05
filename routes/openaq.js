const express = require('express');
const router = express.Router();
const OpenAQService = require('../services/OpenAQService');

const openAQService = new OpenAQService();

/**
 * GET /api/openaq
 * Fetch air quality data from OpenAQ for a specific location
 * Query parameters:
 * - lat: latitude
 * - lon: longitude
 * - radius: search radius in kilometers (optional, default: 10)
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;

    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon are required'
      });
    }

    // Validate coordinate ranges
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const searchRadius = radius ? parseFloat(radius) : 10;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Invalid coordinates: lat and lon must be valid numbers'
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: 'Invalid latitude: must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid longitude: must be between -180 and 180'
      });
    }

    if (searchRadius < 0.1 || searchRadius > 100) {
      return res.status(400).json({
        error: 'Invalid radius: must be between 0.1 and 100 kilometers'
      });
    }

    console.log(`Fetching OpenAQ data for coordinates: ${latitude}, ${longitude}, radius: ${searchRadius}km`);

    const location = { lat: latitude, lon: longitude };
    const openAQData = await openAQService.fetchAirQualityData(location, searchRadius);

    res.json({
      success: true,
      data: openAQData,
      timestamp: new Date().toISOString(),
      source: 'OpenAQ API',
      parameters: {
        location,
        radius: searchRadius
      }
    });

  } catch (error) {
    console.error('Error in OpenAQ route:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/openaq/countries
 * Get list of available countries from OpenAQ
 */
router.get('/countries', async (req, res) => {
  try {
    const countries = await openAQService.getCountries();
    
    res.json({
      success: true,
      data: countries,
      count: countries.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/openaq/cities
 * Get list of available cities from OpenAQ
 * Query parameters:
 * - country: country code (optional)
 */
router.get('/cities', async (req, res) => {
  try {
    const { country } = req.query;
    const cities = await openAQService.getCities(country);
    
    res.json({
      success: true,
      data: cities,
      count: cities.length,
      country: country || 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/openaq/health
 * Health check endpoint for OpenAQ service
 */
router.get('/health', async (req, res) => {
  try {
    // Test with a known location (New York)
    const testLocation = { lat: 40.7128, lon: -74.0060 };
    const testData = await openAQService.fetchAirQualityData(testLocation, 5);
    
    res.json({
      status: 'healthy',
      service: 'OpenAQ',
      timestamp: new Date().toISOString(),
      test: {
        location: testLocation,
        dataReceived: !!testData,
        aqi: testData.aqi || 0
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'OpenAQ',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
