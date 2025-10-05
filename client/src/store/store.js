import { configureStore } from '@reduxjs/toolkit';
import airQualityReducer from '../features/airQualitySlice';
import forecastReducer from '../features/forecastSlice';
import notificationReducer from '../features/notificationSlice';
import mapReducer from '../features/mapSlice';

export const store = configureStore({
  reducer: {
    airQuality: airQualityReducer,
    forecast: forecastReducer,
    notifications: notificationReducer,
    map: mapReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

