import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks for API calls
export const fetchAirQualityData = createAsyncThunk(
  'airQuality/fetchData',
  async (location, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/air-quality?lat=${location.lat}&lon=${location.lon}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          'Failed to fetch air quality data';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTempoData = createAsyncThunk(
  'airQuality/fetchTempoData',
  async (location, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/tempo?lat=${location.lat}&lon=${location.lon}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          'Failed to fetch TEMPO data';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchWeatherData = createAsyncThunk(
  'airQuality/fetchWeatherData',
  async (location, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/weather?lat=${location.lat}&lon=${location.lon}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          'Failed to fetch weather data';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOpenAQData = createAsyncThunk(
  'airQuality/fetchOpenAQData',
  async (location, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/openaq?lat=${location.lat}&lon=${location.lon}&radius=10`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          'Failed to fetch OpenAQ data';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  currentData: null,
  tempoData: null,
  weatherData: null,
  openaqData: null,
  loading: false,
  error: null,
  lastUpdated: null,
  location: {
    lat: 40.7128,
    lon: -74.0060,
    name: 'New York, NY'
  }
};

const airQualitySlice = createSlice({
  name: 'airQuality',
  initialState,
  reducers: {
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateCurrentData: (state, action) => {
      state.currentData = action.payload;
      state.lastUpdated = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch air quality data
      .addCase(fetchAirQualityData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAirQualityData.fulfilled, (state, action) => {
        state.loading = false;
        state.currentData = action.payload.data;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchAirQualityData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch TEMPO data
      .addCase(fetchTempoData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTempoData.fulfilled, (state, action) => {
        state.loading = false;
        state.tempoData = action.payload.data;
      })
      .addCase(fetchTempoData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch weather data
      .addCase(fetchWeatherData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeatherData.fulfilled, (state, action) => {
        state.loading = false;
        state.weatherData = action.payload.data;
      })
      .addCase(fetchWeatherData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch OpenAQ data
      .addCase(fetchOpenAQData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpenAQData.fulfilled, (state, action) => {
        state.loading = false;
        state.openaqData = action.payload.data;
      })
      .addCase(fetchOpenAQData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setLocation, clearError, updateCurrentData } = airQualitySlice.actions;
export default airQualitySlice.reducer;