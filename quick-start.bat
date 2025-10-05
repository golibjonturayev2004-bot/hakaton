@echo off
echo ========================================
echo NASA TEMPO Air Quality Forecast
echo Quick Start Guide
echo ========================================
echo.

echo 1. Get API Keys:
echo    - NASA Earthdata: https://urs.earthdata.nasa.gov/
echo    - OpenWeatherMap: https://openweathermap.org/api
echo    - AirNow: https://www.airnowapi.org/aq/observation/zipCode/current/
echo.

echo 2. Create .env file:
echo    - Copy env.example to .env
echo    - Add your API keys to .env file
echo.

echo 3. Test APIs:
echo    - Run: node test-apis.js
echo.

echo 4. Start the application:
echo    - Backend: npm start
echo    - Frontend: cd client && npm start
echo.

echo 5. Open in browser:
echo    - http://localhost:3000
echo.

echo For detailed instructions, see: API_KEYS_GUIDE.md
echo.

pause
