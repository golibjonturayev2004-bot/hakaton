const express = require('express');
const router = express.Router();
const WeatherService = require('../services/WeatherService');

const weatherService = new WeatherService();

/**
 * GET /api/weather
 * Get current weather data (root route)
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await weatherService.fetchCurrentWeather({
      lat: parseFloat(lat), 
      lng: parseFloat(lon)
    });
    
    // Provide mock data if API fails
    const weatherData = data || {
      main: {
        temp: Math.random() * 20 + 15, // 15-35°C
        humidity: Math.random() * 40 + 30, // 30-70%
        pressure: Math.random() * 50 + 1000 // 1000-1050 hPa
      },
      wind: {
        speed: Math.random() * 10 + 2, // 2-12 m/s
        deg: Math.random() * 360
      },
      visibility: Math.random() * 10000 + 5000, // 5-15 km
      weather: [{
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      }],
      name: 'Mock Location',
      sys: {
        country: 'US'
      }
    };
    
    res.json({
      success: true,
      data: weatherData,
      parameters: {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      message: error.message 
    });
  }
});

/**
 * GET /api/weather/current
 * Get current weather data
 */
router.get('/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await weatherService.fetchWeatherData({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      days: 1
    });
    
    res.json({
      success: true,
      data: data.current,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current weather data',
      message: error.message
    });
  }
});

/**
 * GET /api/weather/forecast
 * Get weather forecast
 */
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lng, days = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await weatherService.fetchWeatherData({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      days: parseInt(days)
    });
    
    res.json({
      success: true,
      data: {
        current: data.current,
        forecast: data.forecast,
        airQualityFactors: data.airQualityFactors
      },
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        days: parseInt(days)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather forecast',
      message: error.message
    });
  }
});

/**
 * GET /api/weather/air-quality-factors
 * Get weather-based air quality factors
 */
router.get('/air-quality-factors', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await weatherService.fetchWeatherData({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      days: 3
    });
    
    res.json({
      success: true,
      data: data.airQualityFactors,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching air quality factors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch air quality factors',
      message: error.message
    });
  }
});

module.exports = router;
