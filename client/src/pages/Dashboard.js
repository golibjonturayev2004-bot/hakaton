import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAirQualityData, 
  fetchTempoData, 
  fetchWeatherData,
  fetchOpenAQData
} from '../features/airQualitySlice';
import { fetchComprehensiveForecast } from '../features/forecastSlice';
import { initializeSocketConnection } from '../features/notificationSlice';
import { 
  Cloud, 
  Wind, 
  Thermometer, 
  Eye, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { 
    currentData, 
    tempoData, 
    weatherData, 
    openaqData,
    loading, 
    error, 
    location 
  } = useSelector(state => state.airQuality);
  
  const { comprehensiveForecast } = useSelector(state => state.forecast);
  const { alerts } = useSelector(state => state.notifications);
  
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(() => {
    dispatch(fetchAirQualityData({ 
      lat: location.lat, 
      lon: location.lon 
    }));
    dispatch(fetchTempoData({ 
      lat: location.lat, 
      lon: location.lon 
    }));
    dispatch(fetchWeatherData({ 
      lat: location.lat, 
      lon: location.lon 
    }));
    dispatch(fetchOpenAQData({ 
      lat: location.lat, 
      lon: location.lon 
    }));
    dispatch(fetchComprehensiveForecast({ 
      lat: location.lat, 
      lon: location.lon,
      hours: 24
    }));
  }, [dispatch, location.lat, location.lon]);

  useEffect(() => {
    // Initialize socket connection
    dispatch(initializeSocketConnection());
    
    // Fetch initial data
    fetchData();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [dispatch, autoRefresh, fetchData]);

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'text-green-600 bg-green-100';
    if (aqi <= 100) return 'text-yellow-600 bg-yellow-100';
    if (aqi <= 150) return 'text-orange-600 bg-orange-100';
    if (aqi <= 200) return 'text-red-600 bg-red-100';
    if (aqi <= 300) return 'text-purple-600 bg-purple-100';
    return 'text-red-800 bg-red-200';
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  // Calculate AQI for individual pollutants using EPA formula
    const calculatePollutantAQI = (concentration, pollutant) => {
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
        'CO': [
          { aqiLow: 0, aqiHigh: 50, concLow: 0, concHigh: 4.4 },
          { aqiLow: 51, aqiHigh: 100, concLow: 4.5, concHigh: 9.4 },
          { aqiLow: 101, aqiHigh: 150, concLow: 9.5, concHigh: 12.4 },
          { aqiLow: 151, aqiHigh: 200, concLow: 12.5, concHigh: 15.4 },
          { aqiLow: 201, aqiHigh: 300, concLow: 15.5, concHigh: 30.4 },
          { aqiLow: 301, aqiHigh: 400, concLow: 30.5, concHigh: 40.4 },
          { aqiLow: 401, aqiHigh: 500, concLow: 40.5, concHigh: 50.4 }
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
  };

  const StatCard = ({ title, value, unit, icon: Icon, color = 'text-blue-600', bgColor = 'bg-blue-100' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {value} {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  );

  const AlertCard = ({ alert }) => (
    <div className={`p-4 rounded-lg border-l-4 ${
      alert.severity === 'critical' || alert.severity === 'emergency' 
        ? 'bg-red-50 border-red-400' 
        : alert.severity === 'warning'
        ? 'bg-yellow-50 border-yellow-400'
        : 'bg-blue-50 border-blue-400'
    }`}>
      <div className="flex items-start">
        <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${
          alert.severity === 'critical' || alert.severity === 'emergency'
            ? 'text-red-500'
            : alert.severity === 'warning'
            ? 'text-yellow-500'
            : 'text-blue-500'
        }`} />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{alert.message}</h4>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(alert.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Air Quality Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Real-time air quality monitoring powered by NASA TEMPO data
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                Auto-refresh
              </label>
            </div>
          </div>
          
          {/* Location */}
          <div className="mt-4 flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {location.name} ({location.lat.toFixed(4)}, {location.lon.toFixed(4)})
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  {typeof error === 'string' ? error : JSON.stringify(error)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Current Conditions */}
          <div className="lg:col-span-2 space-y-6">
            {/* AQI Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Air Quality Index</h2>
              {currentData ? (
                <div className="flex items-center justify-between">
                  <div className={`px-6 py-4 rounded-lg ${getAQIColor(currentData.aqi || 0)}`}>
                    <div className="text-4xl font-bold">{currentData.aqi || 0}</div>
                    <div className="text-sm font-medium">{getAQILevel(currentData.aqi || 0)}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Last updated</p>
                    <p className="text-sm font-medium">
                      {new Date(currentData.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Loading...' : 'No data available'}
                </div>
              )}
            </div>

            {/* Weather and Air Quality Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weatherData && (
                <>
                  <StatCard
                    title="Temperature"
                    value={Math.round(weatherData.main?.temp || 0)}
                    unit="°C"
                    icon={Thermometer}
                    color="text-red-600"
                    bgColor="bg-red-100"
                  />
                  <StatCard
                    title="Humidity"
                    value={Math.round(weatherData.main?.humidity || 0)}
                    unit="%"
                    icon={Cloud}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                  />
                  <StatCard
                    title="Wind Speed"
                    value={Math.round(weatherData.wind?.speed || 0)}
                    unit="m/s"
                    icon={Wind}
                    color="text-green-600"
                    bgColor="bg-green-100"
                  />
                  <StatCard
                    title="Visibility"
                    value={weatherData.visibility ? (weatherData.visibility / 1000).toFixed(1) : 'N/A'}
                    unit="km"
                    icon={Eye}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                  />
                </>
              )}
            </div>

            {/* Individual Pollutant AQI */}
            {currentData && currentData.pollutants && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Individual Pollutant AQI</h2>
                
                {/* Calculate overall AQI */}
                {(() => {
                  const pollutantAQIs = [];
                  Object.entries(currentData.pollutants).forEach(([pollutant, data]) => {
                    const pollutantAQI = data.aqi || calculatePollutantAQI(data.concentration, pollutant);
                    pollutantAQIs.push(pollutantAQI);
                  });
                  const overallAQI = Math.max(...pollutantAQIs);
                  
                  return (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Overall AQI</h3>
                          <p className="text-sm text-gray-600">Maximum of all pollutant AQIs</p>
                        </div>
                        <div className={`px-6 py-3 rounded-lg ${getAQIColor(overallAQI)}`}>
                          <div className="text-3xl font-bold">{overallAQI}</div>
                          <div className="text-sm font-medium">{getAQILevel(overallAQI)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(currentData.pollutants).map(([pollutant, data]) => {
                    // Calculate AQI for each pollutant
                    const pollutantAQI = data.aqi || calculatePollutantAQI(data.concentration, pollutant);
                    return (
                      <div key={pollutant} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{pollutant}</span>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getAQIColor(pollutantAQI)}`}>
                            AQI {pollutantAQI}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {data.concentration} {data.unit}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Formula:</strong> AQI = max(IO3, INO2, IPM2.5, IPM10, ISO2, ICO)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Each pollutant AQI is calculated using EPA breakpoint formula
                  </p>
                </div>
              </div>
            )}

            {/* TEMPO Data with AQI */}
            {tempoData && tempoData.pollutants && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">TEMPO Satellite Data</h2>
                
                {/* Calculate overall AQI for TEMPO data */}
                {(() => {
                  const tempoAQIs = [];
                  Object.entries(tempoData.pollutants).forEach(([pollutant, data]) => {
                    const pollutantAQI = data.aqi || calculatePollutantAQI(data.concentration, pollutant);
                    tempoAQIs.push(pollutantAQI);
                  });
                  const overallTempoAQI = Math.max(...tempoAQIs);
                  
                  return (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-l-4 border-purple-400">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">TEMPO Overall AQI</h3>
                          <p className="text-sm text-gray-600">Maximum of all TEMPO pollutant AQIs</p>
                        </div>
                        <div className={`px-6 py-3 rounded-lg ${getAQIColor(overallTempoAQI)}`}>
                          <div className="text-3xl font-bold">{overallTempoAQI}</div>
                          <div className="text-sm font-medium">{getAQILevel(overallTempoAQI)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(tempoData.pollutants).map(([pollutant, data]) => {
                    const pollutantAQI = data.aqi || calculatePollutantAQI(data.concentration, pollutant);
                    return (
                      <div key={pollutant} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-gray-700">{pollutant}</span>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getAQIColor(pollutantAQI)}`}>
                            AQI {pollutantAQI}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {data.concentration} {data.unit}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Data Quality: {tempoData.dataQuality.confidence}</p>
                  <p>Resolution: {tempoData.dataQuality.resolution}</p>
                </div>
              </div>
            )}

            {/* OpenAQ Ground Station Data */}
            {openaqData && openaqData.pollutants && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">OpenAQ Ground Station Data</h2>
                
                {/* Calculate overall AQI for OpenAQ data */}
                {(() => {
                  const openaqAQIs = [];
                  Object.entries(openaqData.pollutants).forEach(([pollutant, data]) => {
                    const pollutantAQI = data.aqi || calculatePollutantAQI(data.concentration, pollutant);
                    openaqAQIs.push(pollutantAQI);
                  });
                  const overallOpenAQAQI = Math.max(...openaqAQIs);
                  
                  return (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-l-4 border-green-400">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">OpenAQ Overall AQI</h3>
                          <p className="text-sm text-gray-600">Maximum of all OpenAQ pollutant AQIs</p>
                        </div>
                        <div className={`px-6 py-3 rounded-lg ${getAQIColor(overallOpenAQAQI)}`}>
                          <div className="text-3xl font-bold">{overallOpenAQAQI}</div>
                          <div className="text-sm font-medium">{getAQILevel(overallOpenAQAQI)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(openaqData.pollutants).map(([pollutant, data]) => {
                    const pollutantAQI = data.aqi || calculatePollutantAQI(data.concentration, pollutant);
                    return (
                      <div key={pollutant} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-gray-700">{pollutant}</span>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getAQIColor(pollutantAQI)}`}>
                            AQI {pollutantAQI}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {data.concentration} {data.unit}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Data Quality: {openaqData.dataQuality.confidence}</p>
                  <p>Resolution: {openaqData.dataQuality.resolution}</p>
                  <p>Coverage: {openaqData.dataQuality.coverage}</p>
                </div>
              </div>
            )}

            {/* Data Source Comparison */}
            {tempoData && openaqData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Source Comparison</h2>
                
                {/* Overall AQI Comparison */}
                {(() => {
                  const tempoAQIs = [];
                  const openaqAQIs = [];
                  
                  Object.entries(tempoData.pollutants || {}).forEach(([pollutant, data]) => {
                    const pollutantAQI = data.aqi || calculatePollutantAQI(data.concentration, pollutant);
                    tempoAQIs.push(pollutantAQI);
                  });
                  
                  Object.entries(openaqData.pollutants || {}).forEach(([pollutant, data]) => {
                    const pollutantAQI = data.aqi || calculatePollutantAQI(data.concentration, pollutant);
                    openaqAQIs.push(pollutantAQI);
                  });
                  
                  const overallTempoAQI = Math.max(...tempoAQIs);
                  const overallOpenAQAQI = Math.max(...openaqAQIs);
                  const difference = Math.abs(overallTempoAQI - overallOpenAQAQI);
                  
                  return (
                    <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-400">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall AQI Comparison</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">TEMPO Satellite</div>
                          <div className={`px-4 py-2 rounded-lg ${getAQIColor(overallTempoAQI)}`}>
                            <div className="text-2xl font-bold">{overallTempoAQI}</div>
                            <div className="text-sm">{getAQILevel(overallTempoAQI)}</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">OpenAQ Ground</div>
                          <div className={`px-4 py-2 rounded-lg ${getAQIColor(overallOpenAQAQI)}`}>
                            <div className="text-2xl font-bold">{overallOpenAQAQI}</div>
                            <div className="text-sm">{getAQILevel(overallOpenAQAQI)}</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">Difference</div>
                          <div className="px-4 py-2 rounded-lg bg-gray-100">
                            <div className="text-2xl font-bold text-gray-700">{difference}</div>
                            <div className="text-sm text-gray-600">AQI points</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Pollutant-by-Pollutant Comparison */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Pollutant Comparison</h3>
                  {Object.keys({...tempoData.pollutants, ...openaqData.pollutants}).map((pollutant) => {
                    const tempoPollutantData = tempoData.pollutants?.[pollutant];
                    const openaqPollutantData = openaqData.pollutants?.[pollutant];
                    
                    if (!tempoPollutantData && !openaqPollutantData) return null;
                    
                    const tempoAQI = tempoPollutantData ? (tempoPollutantData.aqi || calculatePollutantAQI(tempoPollutantData.concentration, pollutant)) : null;
                    const openaqAQI = openaqPollutantData ? (openaqPollutantData.aqi || calculatePollutantAQI(openaqPollutantData.concentration, pollutant)) : null;
                    
                    return (
                      <div key={pollutant} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">{pollutant}</span>
                          <div className="flex space-x-4">
                            {tempoAQI && (
                              <div className="text-center">
                                <div className="text-xs text-gray-600">TEMPO</div>
                                <div className={`px-2 py-1 rounded text-sm font-semibold ${getAQIColor(tempoAQI)}`}>
                                  {tempoAQI}
                                </div>
                              </div>
                            )}
                            {openaqAQI && (
                              <div className="text-center">
                                <div className="text-xs text-gray-600">OpenAQ</div>
                                <div className={`px-2 py-1 rounded text-sm font-semibold ${getAQIColor(openaqAQI)}`}>
                                  {openaqAQI}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> TEMPO provides satellite-based measurements with broader coverage, 
                    while OpenAQ provides ground-based measurements with higher precision. 
                    Differences may occur due to measurement methods, timing, and spatial resolution.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Alerts and Forecast */}
          <div className="space-y-6">
            {/* Active Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Alerts</h2>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert, index) => (
                    <AlertCard key={index} alert={alert} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  No active alerts
                </div>
              )}
            </div>

            {/* Quick Forecast */}
            {comprehensiveForecast && comprehensiveForecast.aqi && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">24-Hour Forecast</h2>
                <div className="space-y-3">
                  {comprehensiveForecast.aqi.slice(0, 6).map((prediction, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">
                        +{prediction.hour}h
                      </span>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAQIColor(prediction.aqi)}`}>
                          {prediction.aqi}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">{prediction.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  <span className="text-sm text-gray-600">Trend: Stable</span>
                </div>
              </div>
            )}

            {/* Data Sources */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Sources</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">TEMPO Satellite</span>
                  <span className={`text-sm font-medium ${tempoData ? 'text-green-600' : 'text-red-600'}`}>
                    {tempoData ? 'Active' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">OpenAQ Ground</span>
                  <span className={`text-sm font-medium ${openaqData ? 'text-green-600' : 'text-red-600'}`}>
                    {openaqData ? 'Active' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ground Stations</span>
                  <span className={`text-sm font-medium ${currentData ? 'text-green-600' : 'text-red-600'}`}>
                    {currentData ? 'Active' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Weather Data</span>
                  <span className={`text-sm font-medium ${weatherData ? 'text-green-600' : 'text-red-600'}`}>
                    {weatherData ? 'Active' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
