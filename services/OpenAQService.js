const axios = require('axios');

class OpenAQService {
  constructor() {
    this.baseURL = 'https://api.openaq.org/v2';
    this.timeout = 10000; // 10 seconds
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch air quality data from OpenAQ for a specific location
   * @param {Object} location - { lat, lon }
   * @param {number} radius - Search radius in kilometers (default: 10)
   * @returns {Promise<Object>} OpenAQ data
   */
  async fetchAirQualityData(location, radius = 10) {
    try {
      // Create cache key based on location and radius
      const cacheKey = `${location.lat.toFixed(4)}_${location.lon.toFixed(4)}_${radius}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < this.cacheTimeout) {
          console.log(`Using cached OpenAQ data for location: ${location.lat}, ${location.lon}`);
          return cachedData.data;
        } else {
          this.cache.delete(cacheKey);
        }
      }

      console.log(`Fetching OpenAQ data for location: ${location.lat}, ${location.lon}`);
      
      // OpenAQ uses coordinates in decimal degrees
      const params = {
        coordinates: `${location.lon},${location.lat}`, // Note: OpenAQ uses lon,lat format
        radius: radius * 1000, // Convert km to meters
        limit: 100,
        page: 1,
        order_by: 'distance',
        sort: 'asc'
      };

      const response = await axios.get(`${this.baseURL}/measurements`, {
        params,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NASA-TEMPO-AirQuality/1.0'
        }
      });

      if (response.data && response.data.results) {
        const processedData = this.processOpenAQData(response.data.results, location);
        // Cache the result
        this.cache.set(cacheKey, {
          data: processedData,
          timestamp: Date.now()
        });
        return processedData;
      }

      throw new Error('No data received from OpenAQ API');
    } catch (error) {
      console.error('Error fetching OpenAQ data:', error.message);
      
      // Return mock data if API fails
      const mockData = this.generateMockOpenAQData(location);
      
      // Cache mock data too to ensure consistency
      const cacheKey = `${location.lat.toFixed(4)}_${location.lon.toFixed(4)}_${radius}`;
      this.cache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now()
      });
      
      return mockData;
    }
  }

  /**
   * Process raw OpenAQ data into standardized format
   * @param {Array} measurements - Raw OpenAQ measurements
   * @param {Object} location - Target location
   * @returns {Object} Processed data
   */
  processOpenAQData(measurements, location) {
    const pollutants = {};
    const stations = new Map();
    let latestTimestamp = null;

    // Group measurements by pollutant and station
    measurements.forEach(measurement => {
      const { parameter, value, unit, date, location: stationLocation, city, country } = measurement;
      
      // Update latest timestamp
      const measurementDate = new Date(date.utc);
      if (!latestTimestamp || measurementDate > latestTimestamp) {
        latestTimestamp = measurementDate;
      }

      // Store station information
      const stationKey = `${stationLocation}-${city}-${country}`;
      if (!stations.has(stationKey)) {
        stations.set(stationKey, {
          name: stationLocation,
          city,
          country,
          coordinates: {
            lat: measurement.coordinates?.latitude || location.lat,
            lon: measurement.coordinates?.longitude || location.lon
          },
          distance: measurement.distance || 0
        });
      }

      // Group by pollutant
      if (!pollutants[parameter]) {
        pollutants[parameter] = {
          concentration: value,
          unit: unit,
          station: stationKey,
          timestamp: date.utc,
          distance: measurement.distance || 0
        };
      } else {
        // Keep the closest measurement for each pollutant
        if (measurement.distance < pollutants[parameter].distance) {
          pollutants[parameter] = {
            concentration: value,
            unit: unit,
            station: stationKey,
            timestamp: date.utc,
            distance: measurement.distance || 0
          };
        }
      }
    });

    // Calculate overall AQI
    const aqi = this.calculateOverallAQI(pollutants);

    return {
      aqi,
      pollutants,
      stations: Array.from(stations.values()),
      timestamp: latestTimestamp?.toISOString() || new Date().toISOString(),
      source: 'OpenAQ',
      dataQuality: {
        confidence: 'High',
        resolution: 'Ground Station',
        coverage: `${stations.size} stations within ${Math.max(...Array.from(stations.values()).map(s => s.distance))}m`
      },
      location: {
        lat: location.lat,
        lon: location.lon,
        name: `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
      }
    };
  }

  /**
   * Calculate overall AQI from pollutant concentrations
   * @param {Object} pollutants - Pollutant data
   * @returns {number} Overall AQI
   */
  calculateOverallAQI(pollutants) {
    const aqiBreakpoints = {
      'pm25': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 12.0 },
        { aqiLow: 51, aqiHigh: 100, concLow: 12.1, concHigh: 35.4 },
        { aqiLow: 101, aqiHigh: 150, concLow: 35.5, concHigh: 55.4 },
        { aqiLow: 151, aqiHigh: 200, concLow: 55.5, concHigh: 150.4 },
        { aqiLow: 201, aqiHigh: 300, concLow: 150.5, concHigh: 250.4 },
        { aqiLow: 301, aqiHigh: 400, concLow: 250.5, concHigh: 350.4 },
        { aqiLow: 401, aqiHigh: 500, concLow: 350.5, concHigh: 500.4 }
      ],
      'pm10': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 54 },
        { aqiLow: 51, aqiHigh: 100, concLow: 55, concHigh: 154 },
        { aqiLow: 101, aqiHigh: 150, concLow: 155, concHigh: 254 },
        { aqiLow: 151, aqiHigh: 200, concLow: 255, concHigh: 354 },
        { aqiLow: 201, aqiHigh: 300, concLow: 355, concHigh: 424 },
        { aqiLow: 301, aqiHigh: 400, concLow: 425, concHigh: 504 },
        { aqiLow: 401, aqiHigh: 500, concLow: 505, concHigh: 604 }
      ],
      'o3': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 54 },
        { aqiLow: 51, aqiHigh: 100, concLow: 55, concHigh: 70 },
        { aqiLow: 101, aqiHigh: 150, concLow: 71, concHigh: 85 },
        { aqiLow: 151, aqiHigh: 200, concLow: 86, concHigh: 105 },
        { aqiLow: 201, aqiHigh: 300, concLow: 106, concHigh: 200 }
      ],
      'no2': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 53 },
        { aqiLow: 51, aqiHigh: 100, concLow: 54, concHigh: 100 },
        { aqiLow: 101, aqiHigh: 150, concLow: 101, concHigh: 360 },
        { aqiLow: 151, aqiHigh: 200, concLow: 361, concHigh: 649 },
        { aqiLow: 201, aqiHigh: 300, concLow: 650, concHigh: 1249 },
        { aqiLow: 301, aqiHigh: 400, concLow: 1250, concHigh: 1649 },
        { aqiLow: 401, aqiHigh: 500, concLow: 1650, concHigh: 2049 }
      ],
      'so2': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 35 },
        { aqiLow: 51, aqiHigh: 100, concLow: 36, concHigh: 75 },
        { aqiLow: 101, aqiHigh: 150, concLow: 76, concHigh: 185 },
        { aqiLow: 151, aqiHigh: 200, concLow: 186, concHigh: 304 },
        { aqiLow: 201, aqiHigh: 300, concLow: 305, concHigh: 604 }
      ],
      'co': [
        { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 4.4 },
        { aqiLow: 51, aqiHigh: 100, concLow: 4.5, concHigh: 9.4 },
        { aqiLow: 101, aqiHigh: 150, concLow: 9.5, concHigh: 12.4 },
        { aqiLow: 151, aqiHigh: 200, concLow: 12.5, concHigh: 15.4 },
        { aqiLow: 201, aqiHigh: 300, concLow: 15.5, concHigh: 30.4 },
        { aqiLow: 301, aqiHigh: 400, concLow: 30.5, concHigh: 40.4 },
        { aqiLow: 401, aqiHigh: 500, concLow: 40.5, concHigh: 50.4 }
      ]
    };

    let maxAQI = 0;

    Object.entries(pollutants).forEach(([pollutant, data]) => {
      const breakpoints = aqiBreakpoints[pollutant.toLowerCase()];
      if (breakpoints && data.concentration !== undefined) {
        const aqi = this.calculatePollutantAQI(data.concentration, breakpoints);
        maxAQI = Math.max(maxAQI, aqi);
      }
    });

    return maxAQI || 0;
  }

  /**
   * Calculate AQI for a specific pollutant
   * @param {number} concentration - Pollutant concentration
   * @param {Array} breakpoints - AQI breakpoints for the pollutant
   * @returns {number} AQI value
   */
  calculatePollutantAQI(concentration, breakpoints) {
    for (const bp of breakpoints) {
      if (concentration >= bp.concLow && concentration <= bp.concHigh) {
        const aqi = Math.round(
          ((bp.aqiHigh - bp.aqiLow) / (bp.concHigh - bp.concLow)) * 
          (concentration - bp.concLow) + bp.aqiLow
        );
        return Math.min(aqi, 500);
      }
    }
    return 500; // If concentration is above highest breakpoint
  }

  /**
   * Generate deterministic mock OpenAQ data based on coordinates
   * @param {Object} location - Target location
   * @returns {Object} Mock data
   */
  generateMockOpenAQData(location) {
    // Create a simple hash from coordinates to ensure consistent values
    const latHash = Math.abs(Math.floor(location.lat * 1000) % 100);
    const lonHash = Math.abs(Math.floor(location.lon * 1000) % 100);
    const baseValue = (latHash + lonHash) % 50;
    
    const mockPollutants = {
      'PM2.5': {
        concentration: Math.floor(baseValue * 0.8) + 15, // 15-55 µg/m³
        unit: 'µg/m³',
        station: 'OpenAQ Ground Station 1',
        timestamp: new Date().toISOString(),
        distance: Math.floor(baseValue * 20) + 500
      },
      'PM10': {
        concentration: Math.floor(baseValue * 1.2) + 20, // 20-80 µg/m³
        unit: 'µg/m³',
        station: 'OpenAQ Ground Station 2',
        timestamp: new Date().toISOString(),
        distance: Math.floor(baseValue * 25) + 800
      },
      'O3': {
        concentration: Math.floor(baseValue * 1.5) + 25, // 25-100 ppb
        unit: 'ppb',
        station: 'OpenAQ Ground Station 3',
        timestamp: new Date().toISOString(),
        distance: Math.floor(baseValue * 30) + 600
      },
      'NO2': {
        concentration: Math.floor(baseValue * 0.6) + 12, // 12-42 ppb
        unit: 'ppb',
        station: 'OpenAQ Ground Station 4',
        timestamp: new Date().toISOString(),
        distance: Math.floor(baseValue * 15) + 700
      }
    };

    const aqi = this.calculateOverallAQI(mockPollutants);

    return {
      aqi,
      pollutants: mockPollutants,
      stations: [
        {
          name: 'OpenAQ Ground Station 1',
          city: 'New York',
          country: 'US',
          coordinates: {
            lat: location.lat + (baseValue - 25) * 0.0001,
            lon: location.lon + (baseValue - 25) * 0.0001
          },
          distance: Math.floor(baseValue * 20) + 500
        },
        {
          name: 'OpenAQ Ground Station 2',
          city: 'New York',
          country: 'US',
          coordinates: {
            lat: location.lat + (baseValue - 30) * 0.0001,
            lon: location.lon + (baseValue - 20) * 0.0001
          },
          distance: Math.floor(baseValue * 25) + 800
        }
      ],
      timestamp: new Date().toISOString(),
      source: 'OpenAQ (Mock)',
      dataQuality: {
        confidence: 'High',
        resolution: 'Ground Station',
        coverage: `2 stations within ${Math.floor(baseValue * 25) + 800}m`
      },
      location: {
        lat: location.lat,
        lon: location.lon,
        name: `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
      }
    };
  }

  /**
   * Get available countries from OpenAQ
   * @returns {Promise<Array>} List of countries
   */
  async getCountries() {
    try {
      const response = await axios.get(`${this.baseURL}/countries`, {
        timeout: this.timeout
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching countries:', error.message);
      return [];
    }
  }

  /**
   * Get available cities from OpenAQ
   * @param {string} country - Country code
   * @returns {Promise<Array>} List of cities
   */
  async getCities(country = null) {
    try {
      const params = country ? { country } : {};
      const response = await axios.get(`${this.baseURL}/cities`, {
        params,
        timeout: this.timeout
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching cities:', error.message);
      return [];
    }
  }
}

module.exports = OpenAQService;
