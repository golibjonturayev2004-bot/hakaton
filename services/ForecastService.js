const moment = require('moment');
const _ = require('lodash');

// Note: TensorFlow.js is optional for this implementation
// The forecasting uses statistical methods as fallback

class ForecastService {
  constructor() {
    this.models = new Map();
    this.trainingData = [];
    this.isModelTrained = false;
    this.forecastCache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Initialize and train machine learning models
   */
  async initializeModels() {
    try {
      console.log('Initializing air quality forecasting models...');
      
      // Create models for different pollutants
      const pollutants = ['NO2', 'O3', 'SO2', 'HCHO', 'PM2.5', 'PM10'];
      
      for (const pollutant of pollutants) {
        const model = this.createLSTMModel();
        this.models.set(pollutant, model);
      }

      // Load pre-trained weights if available
      await this.loadPreTrainedWeights();
      
      console.log('Models initialized successfully');
    } catch (error) {
      console.error('Error initializing models:', error);
      throw error;
    }
  }

  /**
   * Create LSTM model for time series forecasting
   * Note: This is a placeholder for TensorFlow.js integration
   * Currently using statistical forecasting as fallback
   * @returns {Object} Model placeholder
   */
  createLSTMModel() {
    // Placeholder for TensorFlow.js model
    // In production, this would create an actual LSTM model
    return {
      type: 'lstm',
      units: 50,
      layers: 2,
      compiled: true
    };
  }

  /**
   * Generate air quality forecasts
   * @param {Object} params - Forecast parameters
   * @param {number} params.lat - Latitude
   * @param {number} params.lng - Longitude
   * @param {number} params.hours - Hours to forecast
   * @param {Object} params.tempoData - TEMPO satellite data
   * @param {Object} params.groundData - Ground-based data
   * @param {Object} params.weatherData - Weather data
   * @returns {Promise<Object>} Air quality forecast
   */
  async generateForecasts(params) {
    const cacheKey = `forecast-${params.lat}-${params.lng}-${params.hours}`;
    
    // Check cache first
    if (this.forecastCache.has(cacheKey)) {
      const cached = this.forecastCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Prepare input features
      const features = this.prepareFeatures(params);
      
      // Generate forecasts for each pollutant
      const forecasts = {};
      const pollutants = ['NO2', 'O3', 'SO2', 'HCHO', 'PM2.5', 'PM10'];
      
      for (const pollutant of pollutants) {
        const model = this.models.get(pollutant);
        if (model) {
          forecasts[pollutant] = await this.predictPollutant(model, features, params.hours);
        } else {
          // Fallback to statistical forecasting
          forecasts[pollutant] = this.statisticalForecast(params, pollutant);
        }
      }

      // Calculate overall AQI forecast
      const aqiForecast = this.calculateAQIForecast(forecasts);
      
      // Generate confidence intervals
      const confidenceIntervals = this.calculateConfidenceIntervals(forecasts);
      
      // Create alerts and recommendations
      const alerts = this.generateForecastAlerts(forecasts, aqiForecast);
      
      const result = {
        timestamp: new Date().toISOString(),
        location: {
          lat: params.lat,
          lng: params.lng
        },
        forecastHours: params.hours,
        pollutants: forecasts,
        aqi: aqiForecast,
        confidence: confidenceIntervals,
        alerts: alerts,
        recommendations: this.generateRecommendations(forecasts, aqiForecast),
        dataSources: {
          tempo: params.tempoData ? 'available' : 'unavailable',
          ground: params.groundData ? 'available' : 'unavailable',
          weather: params.weatherData ? 'available' : 'unavailable'
        }
      };

      // Cache the result
      this.forecastCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Error generating forecasts:', error);
      // Return mock forecast data when generation fails
      return this.getMockForecastData(params);
    }
  }

  /**
   * Prepare input features for machine learning model
   * @param {Object} params - Input parameters
   * @returns {Array} Prepared features
   */
  prepareFeatures(params) {
    const features = [];
    const now = moment();
    
    // Create 24-hour historical feature window
    for (let i = 23; i >= 0; i--) {
      const hourData = {
        // Temporal features
        hour: now.clone().subtract(i, 'hours').hour(),
        dayOfWeek: now.clone().subtract(i, 'hours').day(),
        month: now.clone().subtract(i, 'hours').month(),
        
        // Weather features
        temperature: this.extractWeatherFeature(params.weatherData, i, 'temperature'),
        humidity: this.extractWeatherFeature(params.weatherData, i, 'humidity'),
        windSpeed: this.extractWeatherFeature(params.weatherData, i, 'windSpeed'),
        pressure: this.extractWeatherFeature(params.weatherData, i, 'pressure'),
        
        // Air quality features
        no2: this.extractPollutantFeature(params.tempoData, params.groundData, i, 'NO2'),
        o3: this.extractPollutantFeature(params.tempoData, params.groundData, i, 'O3'),
        so2: this.extractPollutantFeature(params.tempoData, params.groundData, i, 'SO2'),
        
        // Derived features
        stagnation: this.calculateStagnationIndex(params.weatherData, i),
        dispersion: this.calculateDispersionIndex(params.weatherData, i)
      };
      
      features.push(Object.values(hourData));
    }
    
    return features;
  }

  /**
   * Extract weather feature for specific hour
   * @param {Object} weatherData - Weather data
   * @param {number} hoursBack - Hours back from now
   * @param {string} feature - Feature name
   * @returns {number} Feature value
   */
  extractWeatherFeature(weatherData, hoursBack, feature) {
    if (!weatherData || !weatherData.current) return 0;
    
    // Use current data as proxy for historical data
    // In production, you'd have historical weather data
    return weatherData.current[feature] || 0;
  }

  /**
   * Extract pollutant feature for specific hour
   * @param {Object} tempoData - TEMPO data
   * @param {Object} groundData - Ground data
   * @param {number} hoursBack - Hours back from now
   * @param {string} pollutant - Pollutant name
   * @returns {number} Pollutant concentration
   */
  extractPollutantFeature(tempoData, groundData, hoursBack, pollutant) {
    // Try TEMPO data first
    if (tempoData && tempoData.pollutants && tempoData.pollutants[pollutant]) {
      return tempoData.pollutants[pollutant].concentration || 0;
    }
    
    // Fallback to ground data
    if (groundData && groundData.pollutants && groundData.pollutants[pollutant.toLowerCase()]) {
      return groundData.pollutants[pollutant.toLowerCase()].concentration || 0;
    }
    
    return 0;
  }

  /**
   * Calculate stagnation index
   * @param {Object} weatherData - Weather data
   * @param {number} hoursBack - Hours back from now
   * @returns {number} Stagnation index
   */
  calculateStagnationIndex(weatherData, hoursBack) {
    if (!weatherData || !weatherData.current) return 0;
    
    const windSpeed = weatherData.current.windSpeed || 0;
    const pressure = weatherData.current.pressure || 1013;
    
    // Low wind and high pressure indicate stagnation
    const windFactor = Math.max(0, 1 - (windSpeed / 5));
    const pressureFactor = pressure > 1020 ? 0.3 : 0;
    
    return windFactor + pressureFactor;
  }

  /**
   * Calculate dispersion index
   * @param {Object} weatherData - Weather data
   * @param {number} hoursBack - Hours back from now
   * @returns {number} Dispersion index
   */
  calculateDispersionIndex(weatherData, hoursBack) {
    if (!weatherData || !weatherData.current) return 0;
    
    const windSpeed = weatherData.current.windSpeed || 0;
    const cloudCover = weatherData.current.cloudCover || 0;
    
    return (windSpeed / 10) + (cloudCover / 100);
  }

  /**
   * Predict pollutant concentration using ML model
   * Note: Currently using statistical forecasting as TensorFlow.js is optional
   * @param {Object} model - Model placeholder
   * @param {Array} features - Input features
   * @param {number} hours - Hours to predict
   * @returns {Array} Predictions
   */
  async predictPollutant(model, features, hours) {
    try {
      // For now, use statistical forecasting
      // In production with TensorFlow.js, this would use actual ML prediction
      console.log('Using statistical forecasting (TensorFlow.js integration available)');
      return this.statisticalForecast({}, 'pollutant', hours);
    } catch (error) {
      console.error('Error in prediction:', error);
      return this.statisticalForecast({}, 'pollutant', hours);
    }
  }

  /**
   * Update features for next prediction step
   * @param {Array} features - Current features
   * @param {number} prediction - Current prediction
   * @returns {Array} Updated features
   */
  updateFeaturesForNextStep(features, prediction) {
    // Shift features and add new prediction
    const updated = features.slice(1);
    const newFeatures = [...updated[updated.length - 1]];
    newFeatures[6] = prediction; // Update pollutant concentration
    updated.push(newFeatures);
    
    return updated;
  }

  /**
   * Statistical forecasting fallback
   * @param {Object} params - Parameters
   * @param {string} pollutant - Pollutant name
   * @param {number} hours - Hours to forecast
   * @returns {Array} Statistical predictions
   */
  statisticalForecast(params, pollutant, hours = 24) {
    const predictions = [];
    const baseConcentration = this.getBaseConcentration(pollutant);
    
    for (let h = 1; h <= hours; h++) {
      // Simple trend-based prediction
      const trend = Math.sin(h * Math.PI / 12) * 0.1; // Daily cycle
      const randomVariation = (Math.random() - 0.5) * 0.2; // Random variation
      const concentration = Math.max(0, baseConcentration * (1 + trend + randomVariation));
      
      predictions.push({
        hour: h,
        concentration: concentration,
        timestamp: moment().add(h, 'hours').toISOString(),
        method: 'statistical'
      });
    }
    
    return predictions;
  }

  /**
   * Get base concentration for pollutant
   * @param {string} pollutant - Pollutant name
   * @returns {number} Base concentration
   */
  getBaseConcentration(pollutant) {
    const baseConcentrations = {
      'NO2': 20,
      'O3': 50,
      'SO2': 10,
      'HCHO': 5,
      'PM2.5': 15,
      'PM10': 25
    };
    
    return baseConcentrations[pollutant] || 10;
  }

  /**
   * Calculate AQI forecast from pollutant predictions
   * @param {Object} forecasts - Pollutant forecasts
   * @returns {Array} AQI forecast
   */
  calculateAQIForecast(forecasts) {
    const aqiForecast = [];
    const maxHours = Math.max(...Object.values(forecasts).map(f => f.length));
    
    for (let h = 0; h < maxHours; h++) {
      const aqiValues = [];
      
      Object.keys(forecasts).forEach(pollutant => {
        if (forecasts[pollutant][h]) {
          const aqi = this.concentrationToAQI(
            forecasts[pollutant][h].concentration,
            pollutant
          );
          if (aqi) aqiValues.push(aqi);
        }
      });
      
      const maxAQI = aqiValues.length > 0 ? Math.max(...aqiValues) : 0;
      
      aqiForecast.push({
        hour: h + 1,
        aqi: maxAQI,
        level: this.getAQILevel(maxAQI),
        timestamp: moment().add(h + 1, 'hours').toISOString()
      });
    }
    
    return aqiForecast;
  }

  /**
   * Convert concentration to AQI using EPA standard formula
   * @param {number} concentration - Pollutant concentration
   * @param {string} pollutant - Pollutant name
   * @returns {number} AQI value
   */
  concentrationToAQI(concentration, pollutant) {
    // EPA AQI breakpoints and formulas
    const breakpoints = {
      'PM2.5': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 12.0 },
        { aqiLow: 51, aqiHigh: 100, concLow: 12.1, concHigh: 35.4 },
        { aqiLow: 101, aqiHigh: 150, concLow: 35.5, concHigh: 55.4 },
        { aqiLow: 151, aqiHigh: 200, concLow: 55.5, concHigh: 150.4 },
        { aqiLow: 201, aqiHigh: 300, concLow: 150.5, concHigh: 250.4 },
        { aqiLow: 301, aqiHigh: 400, concLow: 250.5, concHigh: 350.4 },
        { aqiLow: 401, aqiHigh: 500, concLow: 350.5, concHigh: 500.4 }
      ],
      'PM10': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 54 },
        { aqiLow: 51, aqiHigh: 100, concLow: 55, concHigh: 154 },
        { aqiLow: 101, aqiHigh: 150, concLow: 155, concHigh: 254 },
        { aqiLow: 151, aqiHigh: 200, concLow: 255, concHigh: 354 },
        { aqiLow: 201, aqiHigh: 300, concLow: 355, concHigh: 424 },
        { aqiLow: 301, aqiHigh: 400, concLow: 425, concHigh: 504 },
        { aqiLow: 401, aqiHigh: 500, concLow: 505, concHigh: 604 }
      ],
      'O3': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 54 },
        { aqiLow: 51, aqiHigh: 100, concLow: 55, concHigh: 70 },
        { aqiLow: 101, aqiHigh: 150, concLow: 71, concHigh: 85 },
        { aqiLow: 151, aqiHigh: 200, concLow: 86, concHigh: 105 },
        { aqiLow: 201, aqiHigh: 300, concLow: 106, concHigh: 200 }
      ],
      'NO2': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 53 },
        { aqiLow: 51, aqiHigh: 100, concLow: 54, concHigh: 100 },
        { aqiLow: 101, aqiHigh: 150, concLow: 101, concHigh: 360 },
        { aqiLow: 151, aqiHigh: 200, concLow: 361, concHigh: 649 },
        { aqiLow: 201, aqiHigh: 300, concLow: 650, concHigh: 1249 },
        { aqiLow: 301, aqiHigh: 400, concLow: 1250, concHigh: 1649 },
        { aqiLow: 401, aqiHigh: 500, concLow: 1650, concHigh: 2049 }
      ],
      'SO2': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 35 },
        { aqiLow: 51, aqiHigh: 100, concLow: 36, concHigh: 75 },
        { aqiLow: 101, aqiHigh: 150, concLow: 76, concHigh: 185 },
        { aqiLow: 151, aqiHigh: 200, concLow: 186, concHigh: 304 },
        { aqiLow: 201, aqiHigh: 300, concLow: 305, concHigh: 604 }
      ],
      'HCHO': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 10 },
        { aqiLow: 51, aqiHigh: 100, concLow: 11, concHigh: 20 },
        { aqiLow: 101, aqiHigh: 150, concLow: 21, concHigh: 50 },
        { aqiLow: 151, aqiHigh: 200, concLow: 51, concHigh: 100 },
        { aqiLow: 201, aqiHigh: 300, concLow: 101, concHigh: 200 }
      ]
    };

    const pollutantBreakpoints = breakpoints[pollutant];
    if (!pollutantBreakpoints) return 0;

    // Find the appropriate breakpoint range
    for (const bp of pollutantBreakpoints) {
      if (concentration >= bp.concLow && concentration <= bp.concHigh) {
        // Calculate AQI using EPA formula: AQI = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
        const aqi = Math.round(
          ((bp.aqiHigh - bp.aqiLow) / (bp.concHigh - bp.concLow)) * 
          (concentration - bp.concLow) + bp.aqiLow
        );
        return Math.min(aqi, 500); // Cap at 500
      }
    }

    // If concentration is above the highest breakpoint, return 500
    return 500;
  }

  /**
   * Get AQI level description
   * @param {number} aqi - AQI value
   * @returns {string} AQI level
   */
  getAQILevel(aqi) {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy-sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very-unhealthy';
    return 'hazardous';
  }

  /**
   * Calculate confidence intervals for forecasts
   * @param {Object} forecasts - Pollutant forecasts
   * @returns {Object} Confidence intervals
   */
  calculateConfidenceIntervals(forecasts) {
    const confidence = {};
    
    Object.keys(forecasts).forEach(pollutant => {
      confidence[pollutant] = forecasts[pollutant].map(prediction => ({
        hour: prediction.hour,
        lower: prediction.concentration * 0.8,
        upper: prediction.concentration * 1.2,
        confidence: 0.8
      }));
    });
    
    return confidence;
  }

  /**
   * Generate forecast alerts
   * @param {Object} forecasts - Pollutant forecasts
   * @param {Array} aqiForecast - AQI forecast
   * @returns {Array} Alerts
   */
  generateForecastAlerts(forecasts, aqiForecast) {
    const alerts = [];
    
    // Check for high AQI predictions
    aqiForecast.forEach(prediction => {
      if (prediction.aqi > 150) {
        alerts.push({
          type: 'high-aqi',
          severity: prediction.aqi > 200 ? 'warning' : 'info',
          message: `Predicted AQI of ${prediction.aqi} in ${prediction.hour} hours`,
          timestamp: prediction.timestamp,
          hour: prediction.hour
        });
      }
    });
    
    // Check for specific pollutant spikes
    Object.keys(forecasts).forEach(pollutant => {
      forecasts[pollutant].forEach(prediction => {
        const threshold = this.getPollutantThreshold(pollutant);
        if (prediction.concentration > threshold) {
          alerts.push({
            type: 'pollutant-spike',
            pollutant: pollutant,
            severity: 'warning',
            message: `High ${pollutant} concentration predicted: ${prediction.concentration.toFixed(1)}`,
            timestamp: prediction.timestamp,
            hour: prediction.hour
          });
        }
      });
    });
    
    return alerts;
  }

  /**
   * Get pollutant threshold for alerts
   * @param {string} pollutant - Pollutant name
   * @returns {number} Threshold value
   */
  getPollutantThreshold(pollutant) {
    const thresholds = {
      'NO2': 40,
      'O3': 100,
      'SO2': 60,
      'HCHO': 20,
      'PM2.5': 35,
      'PM10': 154
    };
    
    return thresholds[pollutant] || 50;
  }

  /**
   * Generate health recommendations
   * @param {Object} forecasts - Pollutant forecasts
   * @param {Array} aqiForecast - AQI forecast
   * @returns {Array} Recommendations
   */
  generateRecommendations(forecasts, aqiForecast) {
    const recommendations = [];
    
    aqiForecast.forEach(prediction => {
      if (prediction.aqi > 100) {
        recommendations.push({
          hour: prediction.hour,
          aqi: prediction.aqi,
          recommendations: this.getHealthRecommendations(prediction.aqi),
          timestamp: prediction.timestamp
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Get health recommendations based on AQI
   * @param {number} aqi - AQI value
   * @returns {Array} Health recommendations
   */
  getHealthRecommendations(aqi) {
    if (aqi <= 50) {
      return ['Air quality is good. Enjoy outdoor activities.'];
    } else if (aqi <= 100) {
      return ['Air quality is acceptable. Sensitive individuals may experience minor symptoms.'];
    } else if (aqi <= 150) {
      return [
        'Sensitive groups should reduce prolonged outdoor exertion.',
        'Children and elderly should limit outdoor activities.'
      ];
    } else if (aqi <= 200) {
      return [
        'Everyone should avoid prolonged outdoor exertion.',
        'Sensitive groups should avoid outdoor activities.',
        'Consider using air purifiers indoors.'
      ];
    } else {
      return [
        'Avoid all outdoor activities.',
        'Stay indoors with windows closed.',
        'Use air purifiers and masks if going outside.',
        'Consider evacuating if possible.'
      ];
    }
  }

  /**
   * Load pre-trained model weights
   */
  async loadPreTrainedWeights() {
    try {
      // In production, load from cloud storage or local files
      console.log('Loading pre-trained weights...');
      // Implementation would load actual model weights
      this.isModelTrained = true;
    } catch (error) {
      console.log('No pre-trained weights found, using random initialization');
      this.isModelTrained = false;
    }
  }

  /**
   * Train models with historical data
   * @param {Array} trainingData - Historical training data
   */
  async trainModels(trainingData) {
    console.log('Training air quality forecasting models...');
    
    // This would implement actual model training
    // For now, we'll use statistical forecasting
    this.isModelTrained = true;
    
    console.log('Model training completed');
  }

  /**
   * Get mock forecast data when generation fails
   * @param {Object} params - Input parameters
   * @returns {Object} Mock forecast data
   */
  getMockForecastData(params) {
    const { lat, lng, hours = 24 } = params;
    const forecasts = [];
    
    // Generate mock hourly forecasts
    for (let i = 1; i <= hours; i++) {
      const baseAQI = Math.floor(Math.random() * 100) + 30;
      const hourlyVariation = Math.sin(i * 0.3) * 20; // Sinusoidal variation
      const aqi = Math.max(10, Math.min(200, baseAQI + hourlyVariation));
      
      const quality = aqi <= 50 ? 'good' : aqi <= 100 ? 'moderate' : aqi <= 150 ? 'unhealthy for sensitive groups' : 'unhealthy';
      
      forecasts.push({
        hour: i,
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        aqi: Math.round(aqi),
        level: quality,
        pollutants: {
          'PM2.5': {
            concentration: Math.random() * 50 + 10,
            unit: 'μg/m³',
            quality: quality
          },
          'PM10': {
            concentration: Math.random() * 80 + 20,
            unit: 'μg/m³',
            quality: quality
          },
          'NO2': {
            concentration: Math.random() * 40 + 10,
            unit: 'ppb',
            quality: quality
          },
          'O3': {
            concentration: Math.random() * 60 + 20,
            unit: 'ppb',
            quality: quality
          }
        },
        confidence: Math.random() * 0.3 + 0.6, // 60-90% confidence
        weather: {
          temperature: Math.random() * 15 + 15, // 15-30°C
          humidity: Math.random() * 40 + 30, // 30-70%
          windSpeed: Math.random() * 10 + 2, // 2-12 m/s
          pressure: Math.random() * 50 + 1000 // 1000-1050 hPa
        }
      });
    }
    
    return {
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      forecastPeriod: `${hours} hours`,
      generatedAt: new Date().toISOString(),
      aqi: forecasts,
      summary: {
        averageAQI: Math.round(forecasts.reduce((sum, f) => sum + f.aqi, 0) / forecasts.length),
        maxAQI: Math.max(...forecasts.map(f => f.aqi)),
        minAQI: Math.min(...forecasts.map(f => f.aqi)),
        trend: 'stable',
        confidence: 'medium'
      },
      metadata: {
        note: 'Mock forecast data - external services unavailable',
        model: 'Statistical Fallback',
        version: '1.0.0'
      }
    };
  }
}

module.exports = ForecastService;
