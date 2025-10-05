import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks for API calls
export const fetchForecast = createAsyncThunk(
  'forecast/fetchForecast',
  async (params, { rejectWithValue }) => {
    try {
      const { lat, lon, hours = 24 } = params;
      const response = await axios.get(`/api/forecast?lat=${lat}&lon=${lon}&hours=${hours}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          'Failed to fetch forecast data';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchWeatherData = createAsyncThunk(
  'forecast/fetchWeatherData',
  async (location, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/weather?lat=${location.lat}&lon=${location.lon}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchComprehensiveForecast = createAsyncThunk(
  'forecast/fetchComprehensiveForecast',
  async (params, { rejectWithValue }) => {
    try {
      const { lat, lon, hours = 24 } = params;
      const response = await axios.get(`/api/forecast?lat=${lat}&lon=${lon}&hours=${hours}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          'Failed to fetch comprehensive forecast';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  forecastData: null,
  comprehensiveForecast: null,
  weatherData: null,
  loading: false,
  error: null,
  lastUpdated: null,
  selectedHours: 24,
  selectedPollutant: 'PM2.5'
};

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    setSelectedHours: (state, action) => {
      state.selectedHours = action.payload;
    },
    setSelectedPollutant: (state, action) => {
      state.selectedPollutant = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateForecastData: (state, action) => {
      state.forecastData = action.payload;
      state.lastUpdated = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch forecast data
      .addCase(fetchForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.forecastData = action.payload.data;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchForecast.rejected, (state, action) => {
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
      // Fetch comprehensive forecast
      .addCase(fetchComprehensiveForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComprehensiveForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.comprehensiveForecast = action.payload.data;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchComprehensiveForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  setSelectedHours, 
  setSelectedPollutant, 
  clearError, 
  updateForecastData 
} = forecastSlice.actions;
export default forecastSlice.reducer;