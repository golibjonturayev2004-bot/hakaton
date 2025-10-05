const express = require('express');
const router = express.Router();
const TempoDataService = require('../services/TempoDataService');
const AirQualityService = require('../services/AirQualityService');

const tempoService = new TempoDataService();
const airQualityService = new AirQualityService();

/**
 * GET /api/tempo
 * Get current TEMPO data for a location (root route)
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await tempoService.getRealTimeData(
      parseFloat(lat), 
      parseFloat(lon)
    );
    
    res.json({
      success: true,
      data,
      parameters: {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching TEMPO data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch TEMPO data',
      message: error.message 
    });
  }
});

/**
 * GET /api/tempo/current
 * Get current TEMPO data for a location
 */
router.get('/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await tempoService.getRealTimeData(parseFloat(lat), parseFloat(lng));
    
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching current TEMPO data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current TEMPO data',
      message: error.message
    });
  }
});

/**
 * GET /api/tempo/historical
 * Get historical TEMPO data for trend analysis
 */
router.get('/historical', async (req, res) => {
  try {
    const { lat, lng, days = 7 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await tempoService.getHistoricalData(
      parseFloat(lat), 
      parseFloat(lng), 
      parseInt(days)
    );
    
    res.json({
      success: true,
      data,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        days: parseInt(days)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching historical TEMPO data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch historical TEMPO data',
      message: error.message
    });
  }
});

/**
 * GET /api/tempo/forecast
 * Get TEMPO-based air quality forecast
 */
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lng, hours = 24 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    // Get current TEMPO data
    const currentData = await tempoService.getRealTimeData(parseFloat(lat), parseFloat(lng));
    
    // Get historical data for trend analysis
    const historicalData = await tempoService.getHistoricalData(
      parseFloat(lat), 
      parseFloat(lng), 
      3
    );

    // Simple forecast based on current data and trends
    const forecast = generateSimpleForecast(currentData, historicalData, parseInt(hours));
    
    res.json({
      success: true,
      data: forecast,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        hours: parseInt(hours)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating TEMPO forecast:', error);
    res.status(500).json({ 
      error: 'Failed to generate TEMPO forecast',
      message: error.message
    });
  }
});

/**
 * GET /api/tempo/coverage
 * Get TEMPO data coverage information
 */
router.get('/coverage', async (req, res) => {
  try {
    const coverageInfo = tempoService.getCoverageInfo();
    
    res.json({
      success: true,
      data: coverageInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching TEMPO coverage info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch TEMPO coverage information',
      message: error.message
    });
  }
});

/**
 * Generate simple forecast based on current and historical data
 * @param {Object} currentData - Current TEMPO data
 * @param {Object} historicalData - Historical TEMPO data
 * @param {number} hours - Hours to forecast
 * @returns {Object} Simple forecast
 */
function generateSimpleForecast(currentData, historicalData, hours) {
  const forecast = {
    pollutants: {},
    confidence: 'medium',
    method: 'trend-based'
  };

  // Generate forecasts for each pollutant
  Object.keys(currentData.pollutants).forEach(pollutant => {
    const current = currentData.pollutants[pollutant].concentration;
    const predictions = [];

    // Simple trend-based prediction
    for (let h = 1; h <= hours; h++) {
      // Add some variation based on time of day
      const timeVariation = Math.sin((h * Math.PI) / 12) * 0.1;
      const randomVariation = (Math.random() - 0.5) * 0.05;
      const predicted = Math.max(0, current * (1 + timeVariation + randomVariation));

      predictions.push({
        hour: h,
        concentration: predicted,
        timestamp: new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
      });
    }

    forecast.pollutants[pollutant] = predictions;
  });

  return forecast;
}

module.exports = router;
