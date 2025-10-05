import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BarChart3, TrendingUp, Clock, RefreshCw, Filter, Download } from 'lucide-react';
import { fetchComprehensiveForecast } from '../features/forecastSlice';

const Forecast = () => {
  const dispatch = useDispatch();
  const { comprehensiveForecast, loading, error } = useSelector(state => state.forecast);
  const [selectedHours, setSelectedHours] = useState(24);
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');

  const fetchForecastData = useCallback(() => {
    dispatch(fetchComprehensiveForecast({
      lat: 40.7128,
      lon: -74.0060,
      hours: selectedHours
    }));
  }, [dispatch, selectedHours]);

  useEffect(() => {
    fetchForecastData();
  }, [fetchForecastData]);

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'text-green-600 bg-green-100';
    if (aqi <= 100) return 'text-yellow-600 bg-yellow-100';
    if (aqi <= 150) return 'text-orange-600 bg-orange-100';
    if (aqi <= 200) return 'text-red-600 bg-red-100';
    return 'text-purple-600 bg-purple-100';
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    return 'Very Unhealthy';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'deteriorating': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default: return <TrendingUp className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'deteriorating': return 'Deteriorating';
      default: return 'Stable';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'deteriorating': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Air Quality Forecast</h1>
              <p className="text-gray-600 mt-2">
                Multi-hour air quality predictions powered by NASA TEMPO data and machine learning
              </p>
            </div>
            <button
              onClick={fetchForecastData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Forecast
            </button>
          </div>
        </div>

        {/* Forecast Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Forecast Controls</h2>
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Hours:</span>
              <select
                value={selectedHours}
                onChange={(e) => setSelectedHours(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={6}>6 Hours</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours</option>
                <option value={48}>48 Hours</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Pollutant:</span>
              <select
                value={selectedPollutant}
                onChange={(e) => setSelectedPollutant(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PM2.5">PM2.5</option>
                <option value="PM10">PM10</option>
                <option value="NO2">NO2</option>
                <option value="O3">O3</option>
                <option value="SO2">SO2</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Forecast Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedHours}-Hour AQI Forecast
              </h2>
              
              {comprehensiveForecast && comprehensiveForecast.aqi ? (
                <div className="space-y-4">
                  {/* Simple Bar Chart */}
                  <div className="h-64 flex items-end justify-between space-x-2 p-4 bg-gray-50 rounded-lg">
                    {comprehensiveForecast.aqi.slice(0, Math.min(selectedHours, 12)).map((prediction, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-full rounded-t ${getAQIColor(prediction.aqi).split(' ')[1]} transition-all duration-300 hover:opacity-80`}
                          style={{ height: `${Math.max(20, (prediction.aqi / 200) * 200)}px` }}
                          title={`Hour ${prediction.hour}: AQI ${prediction.aqi}`}
                        ></div>
                        <div className="text-xs text-gray-600 mt-2 text-center">
                          <div>+{prediction.hour}h</div>
                          <div className="font-semibold">{prediction.aqi}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Chart Legend */}
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                      <span className="text-gray-600">Good (0-50)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-100 rounded mr-2"></div>
                      <span className="text-gray-600">Moderate (51-100)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-100 rounded mr-2"></div>
                      <span className="text-gray-600">Unhealthy (101-150)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
                      <span className="text-gray-600">Very Unhealthy (151+)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Forecast Data</h3>
                    <p className="text-gray-600">
                      Fetching air quality predictions...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Forecast Table */}
            {comprehensiveForecast && comprehensiveForecast.aqi && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Forecast</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          AQI
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {comprehensiveForecast.aqi.slice(0, 8).map((prediction, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            +{prediction.hour} hours
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {prediction.aqi}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAQIColor(prediction.aqi)}`}>
                              {getAQILevel(prediction.aqi)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Math.round((prediction.confidence || 0.8) * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Forecast Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Forecast Summary</h2>
              {comprehensiveForecast && comprehensiveForecast.summary ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getTrendIcon(comprehensiveForecast.summary.trend)}
                      <span className="font-medium text-gray-700 ml-2">Trend</span>
                    </div>
                    <span className={`font-semibold ${getTrendColor(comprehensiveForecast.summary.trend)}`}>
                      {getTrendText(comprehensiveForecast.summary.trend)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-700">Peak AQI</span>
                    </div>
                    <span className="text-blue-600 font-semibold">
                      {comprehensiveForecast.summary.maxAQI}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-gray-700">Average AQI</span>
                    </div>
                    <span className="text-green-600 font-semibold">
                      {comprehensiveForecast.summary.averageAQI}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="font-medium text-gray-700">Confidence</span>
                    </div>
                    <span className="text-purple-600 font-semibold">
                      {comprehensiveForecast.summary.confidence}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-gray-700">Trend</span>
                    </div>
                    <span className="text-green-600 font-semibold">Loading...</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-700">Peak AQI</span>
                    </div>
                    <span className="text-blue-600 font-semibold">Loading...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Model Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Model Information</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="font-medium">Statistical ML</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Sources:</span>
                  <span className="font-medium">TEMPO + Ground</span>
                </div>
                <div className="flex justify-between">
                  <span>Update Frequency:</span>
                  <span className="font-medium">15 min</span>
                </div>
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-medium text-green-600">85%+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  {typeof error === 'string' ? error : JSON.stringify(error)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forecast;
