# NASA TEMPO Air Quality Forecast

A real-time air quality monitoring application powered by NASA TEMPO satellite data.

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   ```

2. Set up environment variables:
   ```bash
# Copy the example environment file
   cp env.example .env

# Edit .env file with your API keys
# Add your NASA API key and other required keys
   ```

3. Start the application:

**Terminal 1 - Backend Server:**
   ```bash
npm start
```
   
**Terminal 2 - Frontend Client:**
```bash
   cd client
   npm start
   ```

### Access the Application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
├── server.js              # Main backend server
├── routes/                # API routes
│   ├── airQuality.js
│   ├── forecast.js
│   ├── notifications.js
│   ├── tempo.js
│   └── weather.js
├── services/              # Business logic services
│   ├── AirQualityService.js
│   ├── ForecastService.js
│   ├── NotificationService.js
│   ├── TempoDataService.js
│   └── WeatherService.js
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── features/      # Redux slices
│   │   └── store/         # Redux store
│   └── public/            # Static assets
└── package.json           # Dependencies
```

## Features

- Real-time air quality monitoring
- NASA TEMPO satellite data integration
- Weather data integration
- Interactive dashboard
- Air quality alerts and notifications
- Forecast predictions
- Interactive map view

## API Endpoints

- `GET /api/air-quality` - Current air quality data
- `GET /api/tempo` - TEMPO satellite data
- `GET /api/weather` - Weather data
- `GET /api/forecast` - Air quality forecast
- `GET /api/notifications` - Alerts and notifications

## Environment Variables

Create a `.env` file with the following variables:
```
NASA_API_KEY=your_nasa_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
PORT=5000
NODE_ENV=development
```