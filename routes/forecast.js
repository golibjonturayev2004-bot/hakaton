const express = require('express');
const router = express.Router();
const ForecastService = require('../services/ForecastService');
const TempoDataService = require('../services/TempoDataService');
const AirQualityService = require('../services/AirQualityService');
const WeatherService = require('../services/WeatherService');

const forecastService = new ForecastService();
const tempoService = new TempoDataService();
const airQualityService = new AirQualityService();
const weatherService = new WeatherService();

// Initialize forecast service
forecastService.initializeModels();

/**
 * GET /api/forecast
 * Get air quality forecast (root route)
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lon, hours = 24 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const data = await forecastService.generateForecasts({
      lat: parseFloat(lat), 
      lng: parseFloat(lon),
      hours: parseInt(hours)
    });
    
    res.json({
      success: true,
      data,
      parameters: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        hours: parseInt(hours)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch forecast data',
      message: error.message 
    });
  }
});

/**
 * GET /api/forecast/comprehensive
 * Get comprehensive air quality forecast
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const { lat, lng, hours = 24 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    // Fetch data from all sources in parallel
    const [tempoData, groundData, weatherData] = await Promise.allSettled([
      tempoService.getRealTimeData(parseFloat(lat), parseFloat(lng)),
      airQualityService.getRealTimeAirQuality(parseFloat(lat), parseFloat(lng)),
      weatherService.fetchWeatherData({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        days: Math.ceil(parseInt(hours) / 24)
      })
    ]);

    // Generate comprehensive forecast
    const forecast = await forecastService.generateForecasts({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      hours: parseInt(hours),
      tempoData: tempoData.status === 'fulfilled' ? tempoData.value : null,
      groundData: groundData.status === 'fulfilled' ? groundData.value : null,
      weatherData: weatherData.status === 'fulfilled' ? weatherData.value : null
    });
    
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
    console.error('Error generating comprehensive forecast:', error);
    res.status(500).json({ 
      error: 'Failed to generate comprehensive forecast',
      message: error.message
    });
  }
});

/**
 * GET /api/forecast/pollutant
 * Get forecast for specific pollutant
 */
router.get('/pollutant', async (req, res) => {
  try {
    const { lat, lng, pollutant, hours = 24 } = req.query;
    
    if (!lat || !lng || !pollutant) {
      return res.status(400).json({ 
        error: 'Latitude, longitude, and pollutant are required' 
      });
    }

    const validPollutants = ['NO2', 'O3', 'SO2', 'HCHO', 'PM2.5', 'PM10'];
    if (!validPollutants.includes(pollutant)) {
      return res.status(400).json({ 
        error: 'Invalid pollutant. Must be one of: ' + validPollutants.join(', ')
      });
    }

    // Fetch data from all sources
    const [tempoData, groundData, weatherData] = await Promise.allSettled([
      tempoService.getRealTimeData(parseFloat(lat), parseFloat(lng)),
      airQualityService.getRealTimeAirQuality(parseFloat(lat), parseFloat(lng)),
      weatherService.fetchWeatherData({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        days: Math.ceil(parseInt(hours) / 24)
      })
    ]);

    // Generate forecast
    const forecast = await forecastService.generateForecasts({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      hours: parseInt(hours),
      tempoData: tempoData.status === 'fulfilled' ? tempoData.value : null,
      groundData: groundData.status === 'fulfilled' ? groundData.value : null,
      weatherData: weatherData.status === 'fulfilled' ? weatherData.value : null
    });

    // Extract specific pollutant forecast
    const pollutantForecast = {
      pollutant,
      forecast: forecast.pollutants[pollutant] || [],
      confidence: forecast.confidence[pollutant] || [],
      alerts: forecast.alerts.filter(alert => 
        alert.type === 'pollutant-warning' && alert.pollutant === pollutant
      ),
      recommendations: forecast.recommendations.filter(rec => 
        rec.pollutant === pollutant
      )
    };
    
    res.json({
      success: true,
      data: pollutantForecast,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        pollutant,
        hours: parseInt(hours)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating pollutant forecast:', error);
    res.status(500).json({ 
      error: 'Failed to generate pollutant forecast',
      message: error.message
    });
  }
});

/**
 * GET /api/forecast/aqi
 * Get AQI forecast
 */
router.get('/aqi', async (req, res) => {
  try {
    const { lat, lng, hours = 24 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    // Fetch data from all sources
    const [tempoData, groundData, weatherData] = await Promise.allSettled([
      tempoService.getRealTimeData(parseFloat(lat), parseFloat(lng)),
      airQualityService.getRealTimeAirQuality(parseFloat(lat), parseFloat(lng)),
      weatherService.fetchWeatherData({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        days: Math.ceil(parseInt(hours) / 24)
      })
    ]);

    // Generate forecast
    const forecast = await forecastService.generateForecasts({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      hours: parseInt(hours),
      tempoData: tempoData.status === 'fulfilled' ? tempoData.value : null,
      groundData: groundData.status === 'fulfilled' ? groundData.value : null,
      weatherData: weatherData.status === 'fulfilled' ? weatherData.value : null
    });

    // Extract AQI forecast
    const aqiForecast = {
      forecast: forecast.aqi || [],
      alerts: forecast.alerts.filter(alert => 
        alert.type === 'high-aqi' || alert.type === 'aqi-warning' || 
        alert.type === 'aqi-critical' || alert.type === 'aqi-emergency'
      ),
      recommendations: forecast.recommendations || [],
      summary: generateAQISummary(forecast.aqi || [])
    };
    
    res.json({
      success: true,
      data: aqiForecast,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        hours: parseInt(hours)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating AQI forecast:', error);
    res.status(500).json({ 
      error: 'Failed to generate AQI forecast',
      message: error.message
    });
  }
});

/**
 * GET /api/forecast/alerts
 * Get forecast-based alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const { lat, lng, hours = 24 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    // Fetch data from all sources
    const [tempoData, groundData, weatherData] = await Promise.allSettled([
      tempoService.getRealTimeData(parseFloat(lat), parseFloat(lng)),
      airQualityService.getRealTimeAirQuality(parseFloat(lat), parseFloat(lng)),
      weatherService.fetchWeatherData({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        days: Math.ceil(parseInt(hours) / 24)
      })
    ]);

    // Generate forecast
    const forecast = await forecastService.generateForecasts({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      hours: parseInt(hours),
      tempoData: tempoData.status === 'fulfilled' ? tempoData.value : null,
      groundData: groundData.status === 'fulfilled' ? groundData.value : null,
      weatherData: weatherData.status === 'fulfilled' ? weatherData.value : null
    });

    // Categorize alerts
    const alerts = {
      critical: forecast.alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'emergency'),
      warning: forecast.alerts.filter(alert => alert.severity === 'warning'),
      info: forecast.alerts.filter(alert => alert.severity === 'info'),
      total: forecast.alerts.length,
      summary: generateAlertSummary(forecast.alerts)
    };
    
    res.json({
      success: true,
      data: alerts,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        hours: parseInt(hours)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating forecast alerts:', error);
    res.status(500).json({ 
      error: 'Failed to generate forecast alerts',
      message: error.message
    });
  }
});

/**
 * Generate AQI summary
 * @param {Array} aqiForecast - AQI forecast data
 * @returns {Object} AQI summary
 */
function generateAQISummary(aqiForecast) {
  if (aqiForecast.length === 0) {
    return {
      current: 0,
      peak: 0,
      average: 0,
      trend: 'stable',
      worstHour: null
    };
  }

  const values = aqiForecast.map(item => item.aqi);
  const peak = Math.max(...values);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  const worstHour = aqiForecast.find(item => item.aqi === peak);

  // Calculate trend
  let trend = 'stable';
  if (aqiForecast.length >= 2) {
    const first = aqiForecast[0].aqi;
    const last = aqiForecast[aqiForecast.length - 1].aqi;
    const change = last - first;
    
    if (change > 10) trend = 'increasing';
    else if (change < -10) trend = 'decreasing';
  }

  return {
    current: aqiForecast[0]?.aqi || 0,
    peak,
    average: Math.round(average),
    trend,
    worstHour: worstHour ? {
      hour: worstHour.hour,
      aqi: worstHour.aqi,
      level: worstHour.level
    } : null
  };
}

/**
 * Generate alert summary
 * @param {Array} alerts - Alert data
 * @returns {Object} Alert summary
 */
function generateAlertSummary(alerts) {
  const summary = {
    total: alerts.length,
    bySeverity: {
      emergency: 0,
      critical: 0,
      warning: 0,
      info: 0
    },
    byType: {},
    earliestAlert: null,
    latestAlert: null
  };

  alerts.forEach(alert => {
    // Count by severity
    summary.bySeverity[alert.severity] = (summary.bySeverity[alert.severity] || 0) + 1;
    
    // Count by type
    summary.byType[alert.type] = (summary.byType[alert.type] || 0) + 1;
    
    // Track earliest and latest alerts
    if (!summary.earliestAlert || alert.hoursUntil < summary.earliestAlert.hoursUntil) {
      summary.earliestAlert = alert;
    }
    if (!summary.latestAlert || alert.hoursUntil > summary.latestAlert.hoursUntil) {
      summary.latestAlert = alert;
    }
  });

  return summary;
}

module.exports = router;
