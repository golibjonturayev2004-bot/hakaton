const express = require('express');
const router = express.Router();
const AirQualityService = require('../services/AirQualityService');

const airQualityService = new AirQualityService();

/**
 * GET /api/air-quality
 * Get current air quality data (root route)
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lon, radius = 25 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await airQualityService.getRealTimeAirQuality(
      parseFloat(lat), 
      parseFloat(lon)
    );
    
    res.json({
      success: true,
      data,
      parameters: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        radius: parseInt(radius)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch air quality data',
      message: error.message 
    });
  }
});

/**
 * GET /api/air-quality/current
 * Get current ground-based air quality data
 */
router.get('/current', async (req, res) => {
  try {
    const { lat, lng, radius = 25 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await airQualityService.getRealTimeAirQuality(
      parseFloat(lat), 
      parseFloat(lng)
    );
    
    res.json({
      success: true,
      data,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseInt(radius)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching current air quality data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current air quality data',
      message: error.message
    });
  }
});

/**
 * GET /api/air-quality/stations
 * Get air quality monitoring stations near a location
 */
router.get('/stations', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await airQualityService.fetchGroundBasedData({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseInt(radius)
    });
    
    res.json({
      success: true,
      stations: data.stations || [],
      sources: data.sources || [],
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseInt(radius)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching air quality stations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch air quality stations',
      message: error.message
    });
  }
});

/**
 * GET /api/air-quality/aqi
 * Get AQI information and health recommendations
 */
router.get('/aqi', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await airQualityService.getRealTimeAirQuality(
      parseFloat(lat), 
      parseFloat(lng)
    );
    
    const aqiInfo = {
      value: data.aqi || 0,
      level: data.overallQuality || 'unknown',
      healthRecommendations: getHealthRecommendations(data.aqi || 0),
      sensitiveGroups: getSensitiveGroupsInfo(data.aqi || 0),
      pollutants: data.pollutants || {}
    };
    
    res.json({
      success: true,
      data: aqiInfo,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching AQI information:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AQI information',
      message: error.message
    });
  }
});

/**
 * GET /api/air-quality/trends
 * Get air quality trends for a location
 */
router.get('/trends', async (req, res) => {
  try {
    const { lat, lng, days = 7 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    // For demo purposes, generate mock trend data
    const trends = generateMockTrends(parseInt(days));
    
    res.json({
      success: true,
      data: trends,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        days: parseInt(days)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching air quality trends:', error);
    res.status(500).json({ 
      error: 'Failed to fetch air quality trends',
      message: error.message
    });
  }
});

/**
 * GET /api/air-quality/alerts
 * Get active air quality alerts for a location
 */
router.get('/alerts', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await airQualityService.getRealTimeAirQuality(
      parseFloat(lat), 
      parseFloat(lng)
    );
    
    const alerts = generateAlerts(data);
    
    res.json({
      success: true,
      data: alerts,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching air quality alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch air quality alerts',
      message: error.message
    });
  }
});

/**
 * Get health recommendations based on AQI
 * @param {number} aqi - AQI value
 * @returns {Array} Health recommendations
 */
function getHealthRecommendations(aqi) {
  if (aqi <= 50) {
    return [
      'Air quality is good. Enjoy outdoor activities.',
      'No health impacts expected for the general population.'
    ];
  } else if (aqi <= 100) {
    return [
      'Air quality is acceptable for most people.',
      'Sensitive individuals may experience minor symptoms.',
      'Consider reducing prolonged outdoor exertion if you are sensitive.'
    ];
  } else if (aqi <= 150) {
    return [
      'Sensitive groups should reduce prolonged outdoor exertion.',
      'Children and elderly should limit outdoor activities.',
      'People with heart or lung disease should avoid outdoor activities.'
    ];
  } else if (aqi <= 200) {
    return [
      'Everyone should avoid prolonged outdoor exertion.',
      'Sensitive groups should avoid outdoor activities.',
      'Consider using air purifiers indoors.',
      'Keep windows closed and use air conditioning if available.'
    ];
  } else if (aqi <= 300) {
    return [
      'Avoid all outdoor activities.',
      'Stay indoors with windows closed.',
      'Use air purifiers and masks if going outside.',
      'Consider evacuating if possible.'
    ];
  } else {
    return [
      'EMERGENCY CONDITIONS: Avoid all outdoor activities.',
      'Stay indoors with windows closed.',
      'Use air purifiers and masks if going outside.',
      'Consider evacuating the area if possible.',
      'Follow emergency instructions from local authorities.'
    ];
  }
}

/**
 * Get sensitive groups information
 * @param {number} aqi - AQI value
 * @returns {Object} Sensitive groups information
 */
function getSensitiveGroupsInfo(aqi) {
  const groups = [
    'Children',
    'Elderly',
    'People with asthma',
    'People with heart disease',
    'People with lung disease',
    'Pregnant women'
  ];

  let riskLevel = 'low';
  if (aqi > 100) riskLevel = 'moderate';
  if (aqi > 150) riskLevel = 'high';
  if (aqi > 200) riskLevel = 'very-high';

  return {
    groups,
    riskLevel,
    recommendations: getHealthRecommendations(aqi)
  };
}

/**
 * Generate mock trend data
 * @param {number} days - Number of days
 * @returns {Object} Trend data
 */
function generateMockTrends(days) {
  const trends = {
    aqi: [],
    pollutants: {
      PM2_5: [],
      PM10: [],
      O3: [],
      NO2: []
    },
    summary: {
      trend: 'stable',
      change: 0,
      period: `${days} days`
    }
  };

  const now = new Date();
  const baseAQI = 75;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const variation = Math.sin(i * Math.PI / 7) * 10 + (Math.random() - 0.5) * 20;
    const aqi = Math.max(0, Math.min(500, baseAQI + variation));

    trends.aqi.push({
      date: date.toISOString().split('T')[0],
      aqi: Math.round(aqi),
      level: getAQILevel(aqi)
    });

    // Add pollutant trends
    Object.keys(trends.pollutants).forEach(pollutant => {
      trends.pollutants[pollutant].push({
        date: date.toISOString().split('T')[0],
        concentration: Math.round(aqi * 0.3 + Math.random() * 10),
        unit: pollutant.includes('PM') ? 'μg/m³' : 'ppb'
      });
    });
  }

  return trends;
}

/**
 * Generate alerts based on air quality data
 * @param {Object} data - Air quality data
 * @returns {Array} Alerts
 */
function generateAlerts(data) {
  const alerts = [];

  if (data.aqi > 150) {
    alerts.push({
      type: 'high-aqi',
      severity: data.aqi > 200 ? 'critical' : 'warning',
      message: `Air Quality Index is ${data.aqi} - ${getAQILevel(data.aqi)}`,
      timestamp: new Date().toISOString(),
      recommendations: getHealthRecommendations(data.aqi)
    });
  }

  // Check individual pollutants
  Object.keys(data.pollutants || {}).forEach(pollutant => {
    const pollutantData = data.pollutants[pollutant];
    if (pollutantData && pollutantData.quality === 'unhealthy') {
      alerts.push({
        type: 'pollutant-warning',
        pollutant: pollutant,
        severity: 'warning',
        message: `High ${pollutant} concentration detected: ${pollutantData.concentration} ${pollutantData.unit}`,
        timestamp: new Date().toISOString(),
        recommendations: [`Avoid outdoor activities due to high ${pollutant} levels`]
      });
    }
  });

  return alerts;
}

/**
 * Get AQI level description
 * @param {number} aqi - AQI value
 * @returns {string} AQI level
 */
function getAQILevel(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

module.exports = router;
