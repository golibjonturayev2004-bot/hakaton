@echo off
echo ========================================
echo NASA TEMPO Air Quality Forecast
echo API Keys Setup Guide
echo ========================================
echo.

echo Step 1: NASA Earthdata Token
echo --------------------------------
echo 1. Go to: https://urs.earthdata.nasa.gov/
echo 2. Create account or login
echo 3. Go to "My Profile" ^> "Application Tokens"
echo 4. Generate new token
echo 5. Copy token and add to .env file
echo.

echo Step 2: OpenWeatherMap API Key
echo --------------------------------
echo 1. Go to: https://openweathermap.org/api
echo 2. Sign up for free account
echo 3. Go to "API Keys" section
echo 4. Copy API key and add to .env file
echo.

echo Step 3: AirNow API Key
echo --------------------------------
echo 1. Go to: https://www.airnowapi.org/aq/observation/zipCode/current/
echo 2. Request API key (usually approved within 24 hours)
echo 3. Copy API key and add to .env file
echo.

echo Step 4: Create .env file
echo --------------------------------
echo 1. Copy env.example to .env
echo 2. Add your API keys to .env file
echo 3. Restart the server
echo.

echo Testing API Connections:
echo --------------------------------
echo Test NASA: curl -H "Authorization: Bearer YOUR_TOKEN" "https://ladsweb.modaps.eosdis.nasa.gov/api/v2/content/details?product=MOD04_L2"
echo Test OpenWeather: curl "https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid=YOUR_API_KEY"
echo Test AirNow: curl "https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=10001&distance=25&API_KEY=YOUR_API_KEY"
echo.

echo For detailed instructions, see: API_KEYS_GUIDE.md
echo.

pause
