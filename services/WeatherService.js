const axios = require('axios');
const moment = require('moment');

class WeatherService {
  constructor() {
    this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
    this.weatherGovApiKey = process.env.WEATHER_GOV_API_KEY;
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Fetch weather data from multiple sources
   * @param {Object} params - Query parameters
   * @param {number} params.lat - Latitude
   * @param {number} params.lng - Longitude
   * @param {number} params.days - Number of forecast days
   * @returns {Promise<Object>} Weather data
   */
  async fetchWeatherData(params) {
    const cacheKey = `weather-${params.lat}-${params.lng}-${params.days}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Fetch current weather and forecast in parallel
      const [currentWeather, forecast] = await Promise.allSettled([
        this.fetchCurrentWeather(params),
        this.fetchWeatherForecast(params)
      ]);

      const processedData = this.processWeatherData({
        current: currentWeather.status === 'fulfilled' ? currentWeather.value : null,
        forecast: forecast.status === 'fulfilled' ? forecast.value : null
      });

      // Cache the result
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });

      return processedData;
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Fetch current weather from OpenWeatherMap API
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Current weather data
   */
  async fetchCurrentWeather(params) {
    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat: params.lat,
          lon: params.lng,
          appid: this.openWeatherApiKey,
          units: 'metric'
        },
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error('OpenWeatherMap API error:', error.message);
      return null;
    }
  }

  /**
   * Fetch weather forecast from OpenWeatherMap API
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Weather forecast data
   */
  async fetchWeatherForecast(params) {
    try {
      const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: {
          lat: params.lat,
          lon: params.lng,
          appid: this.openWeatherApiKey,
          units: 'metric',
          cnt: params.days ? params.days * 8 : 40 // 8 forecasts per day
        },
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error('OpenWeatherMap Forecast API error:', error.message);
      return null;
    }
  }

  /**
   * Process and standardize weather data
   * @param {Object} rawData - Raw weather data
   * @returns {Object} Processed weather data
   */
  processWeatherData(rawData) {
    const processed = {
      timestamp: new Date().toISOString(),
      current: null,
      forecast: [],
      airQualityFactors: {}
    };

    // Process current weather
    if (rawData.current) {
      processed.current = {
        temperature: rawData.current.main.temp,
        humidity: rawData.current.main.humidity,
        pressure: rawData.current.main.pressure,
        windSpeed: rawData.current.wind.speed,
        windDirection: rawData.current.wind.deg,
        visibility: rawData.current.visibility,
        cloudCover: rawData.current.clouds.all,
        uvIndex: rawData.current.uvi || 0,
        description: rawData.current.weather[0].description,
        icon: rawData.current.weather[0].icon,
        airQualityFactors: this.calculateAirQualityFactors(rawData.current)
      };
    }

    // Process forecast
    if (rawData.forecast && rawData.forecast.list) {
      processed.forecast = rawData.forecast.list.map(item => ({
        datetime: new Date(item.dt * 1000).toISOString(),
        temperature: item.main.temp,
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        windSpeed: item.wind.speed,
        windDirection: item.wind.deg,
        visibility: item.visibility,
        cloudCover: item.clouds.all,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        airQualityFactors: this.calculateAirQualityFactors(item)
      }));
    }

    // Calculate overall air quality factors
    processed.airQualityFactors = this.calculateOverallAirQualityFactors(processed);

    return processed;
  }

  /**
   * Calculate air quality influencing factors from weather data
   * @param {Object} weatherData - Weather data point
   * @returns {Object} Air quality factors
   */
  calculateAirQualityFactors(weatherData) {
    const factors = {
      dispersion: this.calculateDispersionFactor(weatherData),
      stagnation: this.calculateStagnationFactor(weatherData),
      precipitation: this.calculatePrecipitationFactor(weatherData),
      temperature: this.calculateTemperatureFactor(weatherData),
      humidity: this.calculateHumidityFactor(weatherData),
      wind: this.calculateWindFactor(weatherData)
    };

    // Calculate overall air quality impact
    factors.overallImpact = this.calculateOverallImpact(factors);

    return factors;
  }

  /**
   * Calculate atmospheric dispersion factor
   * @param {Object} weather - Weather data
   * @returns {number} Dispersion factor (0-1, higher is better)
   */
  calculateDispersionFactor(weather) {
    const windSpeed = weather.wind?.speed || 0;
    const cloudCover = weather.clouds?.all || 0;
    
    // Higher wind speed and cloud cover improve dispersion
    const windFactor = Math.min(windSpeed / 10, 1); // Normalize to 0-1
    const cloudFactor = cloudCover / 100; // Already 0-1
    
    return (windFactor + cloudFactor) / 2;
  }

  /**
   * Calculate atmospheric stagnation factor
   * @param {Object} weather - Weather data
   * @returns {number} Stagnation factor (0-1, higher means more stagnation)
   */
  calculateStagnationFactor(weather) {
    const windSpeed = weather.wind?.speed || 0;
    const pressure = weather.main?.pressure || 1013;
    
    // Low wind and high pressure indicate stagnation
    const windStagnation = Math.max(0, 1 - (windSpeed / 5)); // Higher when wind < 5 m/s
    const pressureStagnation = pressure > 1020 ? 0.3 : 0; // High pressure systems
    
    return Math.min(windStagnation + pressureStagnation, 1);
  }

  /**
   * Calculate precipitation factor
   * @param {Object} weather - Weather data
   * @returns {number} Precipitation factor (0-1, higher means more precipitation)
   */
  calculatePrecipitationFactor(weather) {
    const description = weather.weather?.[0]?.description?.toLowerCase() || '';
    
    if (description.includes('rain') || description.includes('drizzle')) return 0.8;
    if (description.includes('snow')) return 0.6;
    if (description.includes('storm') || description.includes('thunder')) return 0.9;
    if (description.includes('shower')) return 0.5;
    
    return 0;
  }

  /**
   * Calculate temperature factor
   * @param {Object} weather - Weather data
   * @returns {number} Temperature factor (0-1)
   */
  calculateTemperatureFactor(weather) {
    const temp = weather.main?.temp || 20;
    
    // Temperature affects chemical reactions and pollutant formation
    if (temp < 0) return 0.2; // Very cold, reduced activity
    if (temp < 10) return 0.4; // Cold
    if (temp < 20) return 0.6; // Moderate
    if (temp < 30) return 0.8; // Warm, increased activity
    return 1.0; // Hot, maximum activity
  }

  /**
   * Calculate humidity factor
   * @param {Object} weather - Weather data
   * @returns {number} Humidity factor (0-1)
   */
  calculateHumidityFactor(weather) {
    const humidity = weather.main?.humidity || 50;
    
    // High humidity can trap pollutants
    if (humidity < 30) return 0.3; // Very dry
    if (humidity < 50) return 0.5; // Dry
    if (humidity < 70) return 0.7; // Moderate
    if (humidity < 90) return 0.9; // Humid
    return 1.0; // Very humid
  }

  /**
   * Calculate wind factor
   * @param {Object} weather - Weather data
   * @returns {number} Wind factor (0-1, higher is better for air quality)
   */
  calculateWindFactor(weather) {
    const windSpeed = weather.wind?.speed || 0;
    
    // Wind helps disperse pollutants
    if (windSpeed < 1) return 0.1; // Calm
    if (windSpeed < 3) return 0.3; // Light
    if (windSpeed < 6) return 0.6; // Moderate
    if (windSpeed < 10) return 0.8; // Fresh
    return 1.0; // Strong
  }

  /**
   * Calculate overall air quality impact
   * @param {Object} factors - Individual air quality factors
   * @returns {string} Overall impact assessment
   */
  calculateOverallImpact(factors) {
    const weights = {
      dispersion: 0.25,
      stagnation: -0.2, // Negative weight
      precipitation: 0.15,
      temperature: 0.15,
      humidity: -0.1, // Negative weight
      wind: 0.15
    };

    let score = 0;
    Object.keys(weights).forEach(key => {
      score += factors[key] * weights[key];
    });

    // Normalize to 0-1
    score = Math.max(0, Math.min(1, (score + 1) / 2));

    if (score < 0.3) return 'poor';
    if (score < 0.5) return 'fair';
    if (score < 0.7) return 'good';
    return 'excellent';
  }

  /**
   * Calculate overall air quality factors for the entire dataset
   * @param {Object} weatherData - Complete weather data
   * @returns {Object} Overall air quality factors
   */
  calculateOverallAirQualityFactors(weatherData) {
    const factors = {
      current: weatherData.current?.airQualityFactors || {},
      forecast: weatherData.forecast.map(item => item.airQualityFactors),
      trends: this.calculateTrends(weatherData),
      alerts: this.generateWeatherAlerts(weatherData)
    };

    return factors;
  }

  /**
   * Calculate weather trends
   * @param {Object} weatherData - Weather data
   * @returns {Object} Weather trends
   */
  calculateTrends(weatherData) {
    const trends = {
      temperature: 'stable',
      humidity: 'stable',
      wind: 'stable',
      airQualityImpact: 'stable'
    };

    if (weatherData.forecast.length >= 2) {
      const current = weatherData.current;
      const future = weatherData.forecast[0];

      // Temperature trend
      if (future.temperature > current.temperature + 2) trends.temperature = 'increasing';
      else if (future.temperature < current.temperature - 2) trends.temperature = 'decreasing';

      // Humidity trend
      if (future.humidity > current.humidity + 10) trends.humidity = 'increasing';
      else if (future.humidity < current.humidity - 10) trends.humidity = 'decreasing';

      // Wind trend
      if (future.windSpeed > current.windSpeed + 2) trends.wind = 'increasing';
      else if (future.windSpeed < current.windSpeed - 2) trends.wind = 'decreasing';
    }

    return trends;
  }

  /**
   * Generate weather-based air quality alerts
   * @param {Object} weatherData - Weather data
   * @returns {Array} Weather alerts
   */
  generateWeatherAlerts(weatherData) {
    const alerts = [];

    if (weatherData.current) {
      const current = weatherData.current;

      // High stagnation risk
      if (current.airQualityFactors.stagnation > 0.7) {
        alerts.push({
          type: 'stagnation',
          severity: 'warning',
          message: 'High atmospheric stagnation risk - pollutants may accumulate',
          timestamp: new Date().toISOString()
        });
      }

      // Low wind conditions
      if (current.windSpeed < 2) {
        alerts.push({
          type: 'low-wind',
          severity: 'info',
          message: 'Low wind conditions - limited pollutant dispersion',
          timestamp: new Date().toISOString()
        });
      }

      // High humidity
      if (current.humidity > 80) {
        alerts.push({
          type: 'high-humidity',
          severity: 'info',
          message: 'High humidity may trap pollutants near the surface',
          timestamp: new Date().toISOString()
        });
      }
    }

    return alerts;
  }

  /**
   * Update weather data cache
   */
  async updateWeatherData() {
    console.log('Updating weather data cache...');
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
    console.log(`Weather cache updated. Current entries: ${this.cache.size}`);
  }
}

module.exports = WeatherService;
