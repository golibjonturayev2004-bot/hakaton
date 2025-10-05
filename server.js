const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const airQualityRoutes = require('./routes/airQuality');
const tempoRoutes = require('./routes/tempo');
const weatherRoutes = require('./routes/weather');
const forecastRoutes = require('./routes/forecast');
const openaqRoutes = require('./routes/openaq');
const { router: notificationRoutes, setNotificationService } = require('./routes/notifications');
const AirQualityService = require('./services/AirQualityService');
const TempoDataService = require('./services/TempoDataService');
const WeatherService = require('./services/WeatherService');
const ForecastService = require('./services/ForecastService');
const NotificationService = require('./services/NotificationService');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/tempo', tempoRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/openaq', openaqRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      tempo: 'operational',
      weather: 'operational',
      forecast: 'operational'
    }
  });
});

// Initialize services
const airQualityService = new AirQualityService();
const tempoDataService = new TempoDataService();
const weatherService = new WeatherService();
const forecastService = new ForecastService();
const notificationService = new NotificationService(io);

// Set notification service for routes
setNotificationService(notificationService);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe-location', (location) => {
    socket.join(`location-${location.lat}-${location.lng}`);
    console.log(`Client ${socket.id} subscribed to location:`, location);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Scheduled tasks for data updates
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled air quality update...');
  try {
    await airQualityService.updateAirQualityData();
    await tempoDataService.updateTempoData();
    await weatherService.updateWeatherData();
    
    // Generate new forecasts
    const forecasts = await forecastService.generateForecasts();
    
    // Send real-time updates to connected clients
    io.emit('air-quality-update', forecasts);
    
    // Check for alerts
    await notificationService.checkAndSendAlerts(forecasts);
    
    console.log('Scheduled update completed successfully');
  } catch (error) {
    console.error('Error in scheduled update:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 TEMPO Air Quality Forecast Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
});

module.exports = { app, server, io };
