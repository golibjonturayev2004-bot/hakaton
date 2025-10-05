import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  center: {
    lat: 40.7128,
    lng: -74.0060
  },
  zoom: 10,
  selectedLocation: null,
  mapType: 'satellite', // 'satellite', 'street', 'terrain'
  showAirQualityLayer: true,
  showForecastLayer: false,
  showWeatherLayer: true,
  selectedPollutant: 'PM2.5',
  timeRange: 'current', // 'current', '24h', '7d'
  loading: false,
  error: null
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setCenter: (state, action) => {
      state.center = action.payload;
    },
    setZoom: (state, action) => {
      state.zoom = action.payload;
    },
    setSelectedLocation: (state, action) => {
      state.selectedLocation = action.payload;
    },
    setMapType: (state, action) => {
      state.mapType = action.payload;
    },
    toggleAirQualityLayer: (state) => {
      state.showAirQualityLayer = !state.showAirQualityLayer;
    },
    toggleForecastLayer: (state) => {
      state.showForecastLayer = !state.showForecastLayer;
    },
    toggleWeatherLayer: (state) => {
      state.showWeatherLayer = !state.showWeatherLayer;
    },
    setSelectedPollutant: (state, action) => {
      state.selectedPollutant = action.payload;
    },
    setTimeRange: (state, action) => {
      state.timeRange = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetMap: (state) => {
      return { ...initialState };
    }
  }
});

export const {
  setCenter,
  setZoom,
  setSelectedLocation,
  setMapType,
  toggleAirQualityLayer,
  toggleForecastLayer,
  toggleWeatherLayer,
  setSelectedPollutant,
  setTimeRange,
  setLoading,
  setError,
  clearError,
  resetMap
} = mapSlice.actions;

export default mapSlice.reducer;