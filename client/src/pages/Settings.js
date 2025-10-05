import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, Bell, Database, Cloud, Settings, Save, RefreshCw, Download, Upload, Eye } from 'lucide-react';
import { setLocation } from '../features/airQualitySlice';

const SettingsPage = () => {
  const dispatch = useDispatch();
  // const { location: currentLocation } = useSelector(state => state.airQuality);
  
  const [settings, setSettings] = useState({
    location: {
      lat: 40.7128,
      lon: -74.0060,
      name: 'New York, NY',
      radius: 25
    },
    alerts: {
      warningLevel: 100,
      criticalLevel: 150,
      emergencyLevel: 200,
      autoRefresh: true,
      refreshInterval: 5
    },
    dataSources: {
      tempoSatellite: true,
      groundStations: true,
      weatherAPI: true,
      openAQ: true,
      epa: true
    },
    display: {
      theme: 'light',
      units: 'metric',
      language: 'en',
      showAdvanced: false
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load settings from localStorage or Redux store
    const savedSettings = localStorage.getItem('airQualitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('airQualitySettings', JSON.stringify(settings));
      
      // Update Redux store
      dispatch(setLocation(settings.location));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      setSaving(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaving(false);
    }
  };

  const resetSettings = () => {
    const defaultSettings = {
      location: {
        lat: 40.7128,
        lon: -74.0060,
        name: 'New York, NY',
        radius: 25
      },
      alerts: {
        warningLevel: 100,
        criticalLevel: 150,
        emergencyLevel: 200,
        autoRefresh: true,
        refreshInterval: 5
      },
      dataSources: {
        tempoSatellite: true,
        groundStations: true,
        weatherAPI: true,
        openAQ: true,
        epa: true
      },
      display: {
        theme: 'light',
        units: 'metric',
        language: 'en',
        showAdvanced: false
      }
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'air-quality-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          setHasChanges(true);
        } catch (error) {
          console.error('Error importing settings:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-2">
                Configure your air quality monitoring preferences and data sources
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {hasChanges && (
                <div className="flex items-center text-sm text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Unsaved changes
                </div>
              )}
              <button
                onClick={saveSettings}
                disabled={!hasChanges || saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Location Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Location Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={settings.location.name}
                    onChange={(e) => handleSettingChange('location', 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={settings.location.lat}
                      onChange={(e) => handleSettingChange('location', 'lat', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={settings.location.lon}
                      onChange={(e) => handleSettingChange('location', 'lon', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Radius (km)
                  </label>
                  <input
                    type="number"
                    value={settings.location.radius}
                    onChange={(e) => handleSettingChange('location', 'radius', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Data Sources */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Database className="w-5 h-5 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Data Sources</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Cloud className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-700">TEMPO Satellite</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dataSources.tempoSatellite}
                    onChange={(e) => handleSettingChange('dataSources', 'tempoSatellite', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Database className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-gray-700">Ground Stations</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dataSources.groundStations}
                    onChange={(e) => handleSettingChange('dataSources', 'groundStations', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="font-medium text-gray-700">Weather API</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dataSources.weatherAPI}
                    onChange={(e) => handleSettingChange('dataSources', 'weatherAPI', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="font-medium text-gray-700">OpenAQ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dataSources.openAQ}
                    onChange={(e) => handleSettingChange('dataSources', 'openAQ', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-gray-700">EPA Data</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dataSources.epa}
                    onChange={(e) => handleSettingChange('dataSources', 'epa', e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Alert Thresholds */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Bell className="w-5 h-5 text-yellow-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Alert Thresholds</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warning Level (AQI)
                  </label>
                  <input
                    type="number"
                    value={settings.alerts.warningLevel}
                    onChange={(e) => handleSettingChange('alerts', 'warningLevel', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Critical Level (AQI)
                  </label>
                  <input
                    type="number"
                    value={settings.alerts.criticalLevel}
                    onChange={(e) => handleSettingChange('alerts', 'criticalLevel', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Level (AQI)
                  </label>
                  <input
                    type="number"
                    value={settings.alerts.emergencyLevel}
                    onChange={(e) => handleSettingChange('alerts', 'emergencyLevel', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Auto Refresh</span>
                  <input
                    type="checkbox"
                    checked={settings.alerts.autoRefresh}
                    onChange={(e) => handleSettingChange('alerts', 'autoRefresh', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refresh Interval (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.alerts.refreshInterval}
                    onChange={(e) => handleSettingChange('alerts', 'refreshInterval', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Display Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Eye className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Display Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.display.theme}
                    onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units
                  </label>
                  <select
                    value={settings.display.units}
                    onChange={(e) => handleSettingChange('display', 'units', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="metric">Metric</option>
                    <option value="imperial">Imperial</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.display.language}
                    onChange={(e) => handleSettingChange('display', 'language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Show Advanced Options</span>
                  <input
                    type="checkbox"
                    checked={settings.display.showAdvanced}
                    onChange={(e) => handleSettingChange('display', 'showAdvanced', e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
            
            {/* System Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Update:</span>
                  <span className="font-medium">Just now</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Sources:</span>
                  <span className="font-medium">
                    {Object.values(settings.dataSources).filter(Boolean).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium">{settings.location.name}</span>
                </div>
              </div>
            </div>
            
            {/* Import/Export */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup & Restore</h2>
              <div className="space-y-3">
                <button
                  onClick={exportSettings}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Settings
                </button>
                
                <label className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Settings
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={resetSettings}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
