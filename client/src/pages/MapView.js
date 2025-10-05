import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RefreshCw, Layers, Eye, EyeOff, MapPin } from 'lucide-react';
import { fetchAirQualityData, fetchTempoData, fetchOpenAQData } from '../features/airQualitySlice';

const MapView = () => {
  const dispatch = useDispatch();
  const { currentData, tempoData, openaqData, loading, error } = useSelector(state => state.airQuality);
  const [selectedLayer, setSelectedLayer] = useState('aqi');
  const [showStations, setShowStations] = useState(true);
  const [mapCenter] = useState({ lat: 40.7128, lng: -74.0060 });

  const fetchData = useCallback(() => {
    dispatch(fetchAirQualityData({
      lat: mapCenter.lat,
      lon: mapCenter.lng
    }));
    dispatch(fetchTempoData({
      lat: mapCenter.lat,
      lon: mapCenter.lng
    }));
    dispatch(fetchOpenAQData({
      lat: mapCenter.lat,
      lon: mapCenter.lng
    }));
  }, [dispatch, mapCenter.lat, mapCenter.lng]);

  useEffect(() => {
    fetchData();
  }, [mapCenter, fetchData]);

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    return 'bg-purple-500';
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    return 'Very Unhealthy';
  };

  // Interactive map state
  const [mapState, setMapState] = useState({
    zoom: 10,
    center: { lat: mapCenter.lat, lng: mapCenter.lng },
    dragging: false,
    dragStart: null
  });

  // Handle map interactions
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click position to lat/lng (simplified)
    const lat = mapState.center.lat + (rect.height/2 - y) * 0.001;
    const lng = mapState.center.lng + (x - rect.width/2) * 0.001;
    
    console.log('Map clicked at:', { lat, lng });
  };

  const handleMouseDown = (e) => {
    setMapState(prev => ({
      ...prev,
      dragging: true,
      dragStart: { x: e.clientX, y: e.clientY }
    }));
  };

  const handleMouseMove = (e) => {
    if (mapState.dragging && mapState.dragStart) {
      const deltaX = e.clientX - mapState.dragStart.x;
      const deltaY = e.clientY - mapState.dragStart.y;
      
      setMapState(prev => ({
        ...prev,
        center: {
          lat: prev.center.lat - deltaY * 0.0001,
          lng: prev.center.lng + deltaX * 0.0001
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setMapState(prev => ({
      ...prev,
      dragging: false,
      dragStart: null
    }));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    setMapState(prev => ({
      ...prev,
      zoom: Math.max(5, Math.min(15, prev.zoom + delta * 0.5))
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-3xl font-bold text-gray-900">Interactive Air Quality Map</h1>
          <p className="text-gray-600 mt-2">
            Real-time air quality data from NASA TEMPO satellite and ground stations
          </p>
        </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Map Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Map Controls</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowStations(!showStations)}
                className={`flex items-center px-3 py-2 rounded-md ${
                  showStations ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {showStations ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                Stations
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Layer:</span>
            </div>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="aqi">Air Quality Index</option>
              <option value="tempo">TEMPO Satellite</option>
              <option value="openaq">OpenAQ Ground</option>
              <option value="comparison">Data Comparison</option>
              <option value="pollutants">Pollutants</option>
            </select>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative h-96 rounded-lg overflow-hidden">
            <div 
              className="w-full h-full bg-gradient-to-br from-blue-100 via-green-50 to-yellow-100 cursor-move select-none"
              onClick={handleMapClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 40% 60%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)
                `,
                transform: `scale(${1 + (mapState.zoom - 10) * 0.1})`,
                transformOrigin: 'center center'
              }}
            >
              {/* Map Grid */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9CA3AF" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Interactive Markers */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Current Location Marker */}
                {currentData && (selectedLayer === 'aqi' || selectedLayer === 'comparison') && (
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer hover:scale-110 transition-transform duration-200"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                    title={`Current Location - AQI: ${currentData.aqi || 0} (${getAQILevel(currentData.aqi || 0)})`}
                  >
                    <div className={`w-10 h-10 rounded-full ${getAQIColor(currentData.aqi || 0)} flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white`}>
                      {currentData.aqi || 0}
                    </div>
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                      Current Location
                    </div>
                  </div>
                )}

                {/* TEMPO Satellite Marker */}
                {tempoData && tempoData.pollutants && showStations && (selectedLayer === 'tempo' || selectedLayer === 'comparison') && (
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer hover:scale-110 transition-transform duration-200"
                    style={{
                      left: '60%',
                      top: '40%',
                      transform: 'translate(-50%, -50%)'
                    }}
                    title={`TEMPO Satellite - AQI: ${tempoData.aqi || 'N/A'} (${getAQILevel(tempoData.aqi || 0)})`}
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
                      T
                    </div>
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                      TEMPO
                    </div>
                  </div>
                )}

                {/* OpenAQ Ground Station Marker */}
                {openaqData && openaqData.pollutants && showStations && (selectedLayer === 'openaq' || selectedLayer === 'comparison') && (
                  <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer hover:scale-110 transition-transform duration-200"
                    style={{
                      left: '40%',
                      top: '60%',
                      transform: 'translate(-50%, -50%)'
                    }}
                    title={`OpenAQ Ground - AQI: ${openaqData.aqi || 'N/A'} (${getAQILevel(openaqData.aqi || 0)})`}
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
                      O
                    </div>
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                      OpenAQ
                    </div>
                  </div>
                )}

                {/* Additional Mock Stations */}
                {showStations && selectedLayer === 'pollutants' && (
                  <>
                    <div 
                      className="absolute w-4 h-4 bg-green-500 rounded-full shadow-lg pointer-events-auto cursor-pointer hover:scale-125 transition-transform duration-200"
                      style={{ left: '65%', top: '35%' }}
                      title="Station A - AQI: 45 (Good)"
                    ></div>
                    <div 
                      className="absolute w-4 h-4 bg-yellow-500 rounded-full shadow-lg pointer-events-auto cursor-pointer hover:scale-125 transition-transform duration-200"
                      style={{ left: '35%', top: '65%' }}
                      title="Station B - AQI: 78 (Moderate)"
                    ></div>
                    <div 
                      className="absolute w-4 h-4 bg-orange-500 rounded-full shadow-lg pointer-events-auto cursor-pointer hover:scale-125 transition-transform duration-200"
                      style={{ left: '70%', top: '70%' }}
                      title="Station C - AQI: 125 (Unhealthy for Sensitive)"
                    ></div>
                  </>
                )}
              </div>

              {/* Map Controls */}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow p-2 space-y-2">
                <button 
                  onClick={() => setMapState(prev => ({ ...prev, zoom: Math.min(15, prev.zoom + 1) }))}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600"
                  title="Zoom In"
                >
                  +
                </button>
                <button 
                  onClick={() => setMapState(prev => ({ ...prev, zoom: Math.max(5, prev.zoom - 1) }))}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600"
                  title="Zoom Out"
                >
                  -
                </button>
                <div className="text-xs text-center text-gray-500">
                  {Math.round(mapState.zoom)}x
                </div>
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">AQI Legend</h4>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Good (0-50)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Moderate (51-100)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Unhealthy for Sensitive (101-150)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Unhealthy (151-200)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-600">Very Unhealthy (201+)</span>
                  </div>
                </div>
                
                {/* Data Sources Legend */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Data Sources</h5>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">T</span>
                      </div>
                      <span className="text-xs text-gray-600">TEMPO Satellite</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">O</span>
                      </div>
                      <span className="text-xs text-gray-600">OpenAQ Ground</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Info */}
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow p-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Interactive Map</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Drag to move • Scroll to zoom • Click markers for info
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Data Summary */}
        {(currentData || tempoData || openaqData) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Location Data</h2>
            
            {/* Data Source Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Ground Station Data */}
              {currentData && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{currentData.aqi || 0}</div>
                  <div className="text-sm text-gray-600">Ground Station AQI</div>
                  <div className={`text-sm font-medium ${getAQIColor(currentData.aqi || 0).replace('bg-', 'text-')}`}>
                    {getAQILevel(currentData.aqi || 0)}
                  </div>
                </div>
              )}
              
              {/* TEMPO Satellite Data */}
              {tempoData && tempoData.aqi && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{tempoData.aqi}</div>
                  <div className="text-sm text-blue-600">TEMPO Satellite AQI</div>
                  <div className={`text-sm font-medium ${getAQIColor(tempoData.aqi).replace('bg-', 'text-')}`}>
                    {getAQILevel(tempoData.aqi)}
                  </div>
                </div>
              )}
              
              {/* OpenAQ Ground Data */}
              {openaqData && openaqData.aqi && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{openaqData.aqi}</div>
                  <div className="text-sm text-green-600">OpenAQ Ground AQI</div>
                  <div className={`text-sm font-medium ${getAQIColor(openaqData.aqi).replace('bg-', 'text-')}`}>
                    {getAQILevel(openaqData.aqi)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Station Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {currentData?.stations ? currentData.stations.length : 0}
                </div>
                <div className="text-sm text-gray-600">Ground Stations</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">
                  {tempoData ? 1 : 0}
                </div>
                <div className="text-sm text-blue-600">TEMPO Satellite</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">
                  {openaqData?.stations ? openaqData.stations.length : 0}
                </div>
                <div className="text-sm text-green-600">OpenAQ Stations</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
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

export default MapView;
