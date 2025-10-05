import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RefreshCw, Layers, Eye, EyeOff, MapPin } from 'lucide-react';
import { fetchAirQualityData, fetchTempoData, fetchOpenAQData } from '../features/airQualitySlice';

const MapView = () => {
  const dispatch = useDispatch();
  const { currentData, tempoData, openaqData, loading, error } = useSelector(state => state.airQuality);
  const [selectedLayer, setSelectedLayer] = useState('aqi');
  const [showStations, setShowStations] = useState(true);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  const mapRef = useRef(null);
  const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York

  // AQI ranglari
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#10b981'; // green
    if (aqi <= 100) return '#f59e0b'; // yellow/orange
    if (aqi <= 150) return '#f97316'; // orange
    if (aqi <= 200) return '#ef4444'; // red
    return '#8b5cf6'; // purple
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    return 'Very Unhealthy';
  };

  // Google Map ni ishga tushirish
  useEffect(() => {
    if (window.google && window.google.maps && !map) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
        center: defaultCenter,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
      });
      setMap(newMap);
    }
  }, [map]);

  // Markerlarni yangilash
  useEffect(() => {
    if (!map) return;

    // Eski markerlarni o'chirish
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    // Current Location Marker
    if (currentData && (selectedLayer === 'aqi' || selectedLayer === 'comparison')) {
      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map: map,
        label: {
          text: String(currentData.aqi || 0),
          color: 'white',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: getAQIColor(currentData.aqi || 0),
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          scale: 15,
        },
        title: `Current Location - AQI: ${currentData.aqi || 0} (${getAQILevel(currentData.aqi || 0)})`,
      });
      newMarkers.push(marker);
    }

    // TEMPO Marker (bir oz surilgan)
    if (tempoData && showStations && (selectedLayer === 'tempo' || selectedLayer === 'comparison')) {
      const tempoPos = { lat: defaultCenter.lat + 0.02, lng: defaultCenter.lng + 0.02 };
      const marker = new window.google.maps.Marker({
        position: tempoPos,
        map: map,
        label: 'T',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          scale: 12,
        },
        title: `TEMPO Satellite - AQI: ${tempoData.aqi || 'N/A'} (${getAQILevel(tempoData.aqi || 0)})`,
      });
      newMarkers.push(marker);
    }

    // OpenAQ Marker
    if (openaqData && showStations && (selectedLayer === 'openaq' || selectedLayer === 'comparison')) {
      const openaqPos = { lat: defaultCenter.lat - 0.02, lng: defaultCenter.lng - 0.02 };
      const marker = new window.google.maps.Marker({
        position: openaqPos,
        map: map,
        label: 'O',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          scale: 12,
        },
        title: `OpenAQ Ground - AQI: ${openaqData.aqi || 'N/A'} (${getAQILevel(openaqData.aqi || 0)})`,
      });
      newMarkers.push(marker);
    }

    setMarkers(newMarkers);
  }, [map, currentData, tempoData, openaqData, selectedLayer, showStations]);

  const fetchData = () => {
    dispatch(fetchAirQualityData({ lat: defaultCenter.lat, lon: defaultCenter.lng }));
    dispatch(fetchTempoData({ lat: defaultCenter.lat, lon: defaultCenter.lng }));
    dispatch(fetchOpenAQData({ lat: defaultCenter.lat, lon: defaultCenter.lng }));
  };

  useEffect(() => {
    fetchData();
  }, []);

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

        {/* Google Map */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div ref={mapRef} className="h-96 w-full rounded-lg" />
        </div>

        {/* Current Data Summary */}
        {(currentData || tempoData || openaqData) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Location Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {currentData && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{currentData.aqi || 0}</div>
                  <div className="text-sm text-gray-600">Ground Station AQI</div>
                  <div className="text-sm font-medium" style={{ color: getAQIColor(currentData.aqi || 0) }}>
                    {getAQILevel(currentData.aqi || 0)}
                  </div>
                </div>
              )}
              {tempoData?.aqi && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{tempoData.aqi}</div>
                  <div className="text-sm text-blue-600">TEMPO Satellite AQI</div>
                  <div className="text-sm font-medium" style={{ color: getAQIColor(tempoData.aqi) }}>
                    {getAQILevel(tempoData.aqi)}
                  </div>
                </div>
              )}
              {openaqData?.aqi && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{openaqData.aqi}</div>
                  <div className="text-sm text-green-600">OpenAQ Ground AQI</div>
                  <div className="text-sm font-medium" style={{ color: getAQIColor(openaqData.aqi) }}>
                    {getAQILevel(openaqData.aqi)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;