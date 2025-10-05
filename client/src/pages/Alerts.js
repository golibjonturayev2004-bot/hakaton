import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AlertTriangle, Bell, Mail, Phone, Settings, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { initializeSocketConnection } from '../features/notificationSlice';

const Alerts = () => {
  const dispatch = useDispatch();
  const { socketConnected } = useSelector(state => state.notifications);
  const { currentData } = useSelector(state => state.airQuality);
  
  const [notificationSettings, setNotificationSettings] = useState({
    webNotifications: true,
    emailAlerts: false,
    smsAlerts: false,
    aqiThreshold: 100,
    location: 'New York, NY'
  });

  const [alertHistory, setAlertHistory] = useState([
    {
      id: 1,
      type: 'warning',
      message: 'Air quality is deteriorating in your area',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      aqi: 85,
      location: 'New York, NY',
      read: false
    },
    {
      id: 2,
      type: 'info',
      message: 'TEMPO satellite data updated',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      aqi: null,
      location: 'North America',
      read: true
    },
    {
      id: 3,
      type: 'alert',
      message: 'High PM2.5 levels detected',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      aqi: 120,
      location: 'New York, NY',
      read: true
    }
  ]);

  useEffect(() => {
    dispatch(initializeSocketConnection());
  }, [dispatch]);

  const handleSettingChange = (setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const markAsRead = (alertId) => {
    setAlertHistory(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const deleteAlert = (alertId) => {
    setAlertHistory(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Bell className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'alert': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = alertHistory.filter(alert => !alert.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Air Quality Alerts</h1>
              <p className="text-gray-600 mt-2">
                Manage your air quality notifications and alert preferences
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {socketConnected ? 'Connected' : 'Disconnected'}
              </div>
              {unreadCount > 0 && (
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount} unread
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Active Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Mark all as read
                </button>
              </div>
              
              {alertHistory.length > 0 ? (
                <div className="space-y-3">
                  {alertHistory.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                        !alert.read ? 'ring-2 ring-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimestamp(alert.timestamp)}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {alert.location}
                              </div>
                              {alert.aqi && (
                                <div className="font-medium">
                                  AQI: {alert.aqi}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!alert.read && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteAlert(alert.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete alert"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No recent alerts</p>
                  <p className="text-sm mt-1">You'll be notified when air quality conditions change</p>
                </div>
              )}
            </div>

            {/* Current Air Quality Status */}
            {currentData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Current AQI</span>
                    <span className={`font-semibold ${
                      currentData.aqi <= 50 ? 'text-green-600' :
                      currentData.aqi <= 100 ? 'text-yellow-600' :
                      currentData.aqi <= 150 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {currentData.aqi || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Alert Threshold</span>
                    <span className="font-semibold text-blue-600">
                      {notificationSettings.aqiThreshold}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Status</span>
                    <span className={`font-semibold ${
                      (currentData.aqi || 0) >= notificationSettings.aqiThreshold 
                        ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {(currentData.aqi || 0) >= notificationSettings.aqiThreshold 
                        ? 'Alert Active' : 'Normal'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Notification Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-700">Web Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.webNotifications}
                    onChange={(e) => handleSettingChange('webNotifications', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-gray-700">Email Alerts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailAlerts}
                    onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="font-medium text-gray-700">SMS Alerts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.smsAlerts}
                    onChange={(e) => handleSettingChange('smsAlerts', e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
            </div>

            {/* Alert Threshold Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Thresholds</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AQI Alert Threshold
                  </label>
                  <select
                    value={notificationSettings.aqiThreshold}
                    onChange={(e) => handleSettingChange('aqiThreshold', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={50}>Good (0-50)</option>
                    <option value={100}>Moderate (51-100)</option>
                    <option value={150}>Unhealthy for Sensitive (101-150)</option>
                    <option value={200}>Unhealthy (151-200)</option>
                    <option value={300}>Very Unhealthy (201+)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={notificationSettings.location}
                    onChange={(e) => handleSettingChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter location"
                  />
                </div>
              </div>
            </div>

            {/* Test Notification */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Notifications</h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Send Test Alert
                </button>
                <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                  Request Permission
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
