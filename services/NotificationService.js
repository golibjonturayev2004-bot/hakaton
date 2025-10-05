const axios = require('axios');
const moment = require('moment');

class NotificationService {
  constructor(io) {
    this.io = io;
    this.subscribers = new Map();
    this.alertThresholds = {
      aqi: {
        warning: 100,
        critical: 150,
        emergency: 200
      },
      pollutants: {
        NO2: { warning: 40, critical: 100 },
        O3: { warning: 100, critical: 200 },
        SO2: { warning: 60, critical: 150 },
        HCHO: { warning: 20, critical: 50 },
        'PM2.5': { warning: 35, critical: 55 },
        PM10: { warning: 154, critical: 254 }
      }
    };
    this.notificationHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Subscribe user to location-based notifications
   * @param {string} userId - User ID
   * @param {Object} location - Location coordinates
   * @param {Object} preferences - Notification preferences
   */
  subscribeToLocation(userId, location, preferences = {}) {
    const subscription = {
      userId,
      location: {
        lat: location.lat,
        lng: location.lng,
        radius: location.radius || 25 // km
      },
      preferences: {
        aqiThresholds: preferences.aqiThresholds || this.alertThresholds.aqi,
        pollutantThresholds: preferences.pollutantThresholds || this.alertThresholds.pollutants,
        notificationMethods: preferences.methods || ['websocket', 'email'],
        email: preferences.email || null,
        phone: preferences.phone || null,
        enabled: preferences.enabled !== false
      },
      subscribedAt: new Date().toISOString(),
      lastNotification: null
    };

    this.subscribers.set(userId, subscription);
    console.log(`User ${userId} subscribed to notifications for location:`, location);
  }

  /**
   * Unsubscribe user from notifications
   * @param {string} userId - User ID
   */
  unsubscribeFromLocation(userId) {
    if (this.subscribers.has(userId)) {
      this.subscribers.delete(userId);
      console.log(`User ${userId} unsubscribed from notifications`);
    }
  }

  /**
   * Check forecasts and send alerts
   * @param {Array} forecasts - Air quality forecasts
   */
  async checkAndSendAlerts(forecasts) {
    try {
      console.log('Checking forecasts for alerts...');
      
      for (const [userId, subscription] of this.subscribers) {
        if (!subscription.preferences.enabled) continue;

        const relevantForecasts = this.getRelevantForecasts(forecasts, subscription.location);
        
        for (const forecast of relevantForecasts) {
          const alerts = this.analyzeForecastForAlerts(forecast, subscription.preferences);
          
          if (alerts.length > 0) {
            await this.sendAlerts(userId, alerts, subscription);
          }
        }
      }
      
      console.log('Alert checking completed');
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Get forecasts relevant to user's location
   * @param {Array} forecasts - All forecasts
   * @param {Object} location - User's location
   * @returns {Array} Relevant forecasts
   */
  getRelevantForecasts(forecasts, location) {
    return forecasts.filter(forecast => {
      const distance = this.calculateDistance(
        location.lat, location.lng,
        forecast.location.lat, forecast.location.lng
      );
      return distance <= location.radius;
    });
  }

  /**
   * Calculate distance between two coordinates
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Analyze forecast for alert conditions
   * @param {Object} forecast - Air quality forecast
   * @param {Object} preferences - User preferences
   * @returns {Array} Generated alerts
   */
  analyzeForecastForAlerts(forecast, preferences) {
    const alerts = [];
    const now = moment();

    // Check AQI alerts
    forecast.aqi.forEach(aqiPrediction => {
      const predictionTime = moment(aqiPrediction.timestamp);
      const hoursUntilAlert = predictionTime.diff(now, 'hours');

      // Only alert for predictions within next 24 hours
      if (hoursUntilAlert > 0 && hoursUntilAlert <= 24) {
        if (aqiPrediction.aqi >= preferences.aqiThresholds.emergency) {
          alerts.push({
            type: 'aqi-emergency',
            severity: 'emergency',
            message: `EMERGENCY: AQI predicted to reach ${aqiPrediction.aqi} in ${hoursUntilAlert} hours`,
            forecast: aqiPrediction,
            hoursUntil: hoursUntilAlert,
            timestamp: new Date().toISOString()
          });
        } else if (aqiPrediction.aqi >= preferences.aqiThresholds.critical) {
          alerts.push({
            type: 'aqi-critical',
            severity: 'critical',
            message: `CRITICAL: AQI predicted to reach ${aqiPrediction.aqi} in ${hoursUntilAlert} hours`,
            forecast: aqiPrediction,
            hoursUntil: hoursUntilAlert,
            timestamp: new Date().toISOString()
          });
        } else if (aqiPrediction.aqi >= preferences.aqiThresholds.warning) {
          alerts.push({
            type: 'aqi-warning',
            severity: 'warning',
            message: `WARNING: AQI predicted to reach ${aqiPrediction.aqi} in ${hoursUntilAlert} hours`,
            forecast: aqiPrediction,
            hoursUntil: hoursUntilAlert,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Check pollutant-specific alerts
    Object.keys(forecast.pollutants).forEach(pollutant => {
      const pollutantThresholds = preferences.pollutantThresholds[pollutant];
      if (!pollutantThresholds) return;

      forecast.pollutants[pollutant].forEach(prediction => {
        const predictionTime = moment(prediction.timestamp);
        const hoursUntilAlert = predictionTime.diff(now, 'hours');

        if (hoursUntilAlert > 0 && hoursUntilAlert <= 24) {
          if (prediction.concentration >= pollutantThresholds.critical) {
            alerts.push({
              type: 'pollutant-critical',
              pollutant: pollutant,
              severity: 'critical',
              message: `CRITICAL: High ${pollutant} concentration predicted: ${prediction.concentration.toFixed(1)} in ${hoursUntilAlert} hours`,
              forecast: prediction,
              hoursUntil: hoursUntilAlert,
              timestamp: new Date().toISOString()
            });
          } else if (prediction.concentration >= pollutantThresholds.warning) {
            alerts.push({
              type: 'pollutant-warning',
              pollutant: pollutant,
              severity: 'warning',
              message: `WARNING: Elevated ${pollutant} concentration predicted: ${prediction.concentration.toFixed(1)} in ${hoursUntilAlert} hours`,
              forecast: prediction,
              hoursUntil: hoursUntilAlert,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    });

    return alerts;
  }

  /**
   * Send alerts to user
   * @param {string} userId - User ID
   * @param {Array} alerts - Alerts to send
   * @param {Object} subscription - User subscription
   */
  async sendAlerts(userId, alerts, subscription) {
    try {
      // Check if we should send alerts (avoid spam)
      const now = moment();
      const lastNotification = subscription.lastNotification ? moment(subscription.lastNotification) : null;
      
      // Don't send alerts more than once per hour
      if (lastNotification && now.diff(lastNotification, 'hours') < 1) {
        return;
      }

      // Send via WebSocket
      if (subscription.preferences.notificationMethods.includes('websocket')) {
        this.io.to(`user-${userId}`).emit('air-quality-alert', {
          userId,
          alerts,
          timestamp: new Date().toISOString(),
          location: subscription.location
        });
      }

      // Send via email
      if (subscription.preferences.notificationMethods.includes('email') && subscription.preferences.email) {
        await this.sendEmailAlert(subscription.preferences.email, alerts, subscription.location);
      }

      // Send via SMS
      if (subscription.preferences.notificationMethods.includes('sms') && subscription.preferences.phone) {
        await this.sendSMSAlert(subscription.preferences.phone, alerts, subscription.location);
      }

      // Update last notification time
      subscription.lastNotification = new Date().toISOString();

      // Store in history
      this.addToHistory(userId, alerts);

      console.log(`Sent ${alerts.length} alerts to user ${userId}`);
    } catch (error) {
      console.error('Error sending alerts:', error);
    }
  }

  /**
   * Send email alert
   * @param {string} email - Email address
   * @param {Array} alerts - Alerts
   * @param {Object} location - Location
   */
  async sendEmailAlert(email, alerts, location) {
    try {
      const subject = `Air Quality Alert - ${alerts.length} warning(s)`;
      const body = this.generateEmailBody(alerts, location);

      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      console.log(`Email alert sent to ${email}:`, subject);
      
      // For demo purposes, we'll just log the email
      console.log('Email body:', body);
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  }

  /**
   * Send SMS alert
   * @param {string} phone - Phone number
   * @param {Array} alerts - Alerts
   * @param {Object} location - Location
   */
  async sendSMSAlert(phone, alerts, location) {
    try {
      const message = this.generateSMSBody(alerts, location);

      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log(`SMS alert sent to ${phone}:`, message);
    } catch (error) {
      console.error('Error sending SMS alert:', error);
    }
  }

  /**
   * Generate email body
   * @param {Array} alerts - Alerts
   * @param {Object} location - Location
   * @returns {string} Email body
   */
  generateEmailBody(alerts, location) {
    let body = `Air Quality Alert\n\n`;
    body += `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}\n`;
    body += `Time: ${new Date().toLocaleString()}\n\n`;
    
    body += `You have ${alerts.length} air quality alert(s):\n\n`;
    
    alerts.forEach((alert, index) => {
      body += `${index + 1}. ${alert.message}\n`;
      body += `   Severity: ${alert.severity.toUpperCase()}\n`;
      body += `   Time until alert: ${alert.hoursUntil} hours\n\n`;
    });
    
    body += `Recommendations:\n`;
    body += `- Avoid outdoor activities during high pollution periods\n`;
    body += `- Use air purifiers indoors\n`;
    body += `- Consider wearing masks if going outside\n`;
    body += `- Stay informed with real-time updates\n\n`;
    
    body += `This alert was generated by NASA TEMPO Air Quality Forecast System.\n`;
    body += `For more information, visit our web application.\n`;
    
    return body;
  }

  /**
   * Generate SMS body
   * @param {Array} alerts - Alerts
   * @param {Object} location - Location
   * @returns {string} SMS body
   */
  generateSMSBody(alerts, location) {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency');
    
    if (criticalAlerts.length > 0) {
      return `AIR QUALITY ALERT: ${criticalAlerts.length} critical warning(s). AQI may reach ${Math.max(...criticalAlerts.map(a => a.forecast.aqi || 0))}. Avoid outdoor activities. Check app for details.`;
    } else {
      return `Air Quality Alert: ${alerts.length} warning(s) in your area. Check app for details and recommendations.`;
    }
  }

  /**
   * Add alerts to notification history
   * @param {string} userId - User ID
   * @param {Array} alerts - Alerts
   */
  addToHistory(userId, alerts) {
    const historyEntry = {
      userId,
      alerts,
      timestamp: new Date().toISOString()
    };

    this.notificationHistory.push(historyEntry);

    // Keep only recent history
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get notification history for user
   * @param {string} userId - User ID
   * @param {number} limit - Number of entries to return
   * @returns {Array} Notification history
   */
  getNotificationHistory(userId, limit = 50) {
    return this.notificationHistory
      .filter(entry => entry.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get notification statistics
   * @returns {Object} Statistics
   */
  getNotificationStats() {
    const stats = {
      totalSubscribers: this.subscribers.size,
      totalNotifications: this.notificationHistory.length,
      notificationsBySeverity: {
        emergency: 0,
        critical: 0,
        warning: 0,
        info: 0
      },
      recentActivity: this.notificationHistory.slice(-10)
    };

    // Count notifications by severity
    this.notificationHistory.forEach(entry => {
      entry.alerts.forEach(alert => {
        stats.notificationsBySeverity[alert.severity] = 
          (stats.notificationsBySeverity[alert.severity] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * Update user notification preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - New preferences
   */
  updatePreferences(userId, preferences) {
    if (this.subscribers.has(userId)) {
      const subscription = this.subscribers.get(userId);
      subscription.preferences = { ...subscription.preferences, ...preferences };
      console.log(`Updated preferences for user ${userId}`);
    }
  }

  /**
   * Get pollutant threshold for alerts
   * @param {string} pollutant - Pollutant name
   * @returns {number} Threshold value
   */
  getPollutantThreshold(pollutant) {
    const thresholds = {
      'NO2': 40,
      'O3': 100,
      'SO2': 60,
      'HCHO': 20,
      'PM2.5': 35,
      'PM10': 154
    };
    
    return thresholds[pollutant] || 50;
  }

  /**
   * Test notification system
   * @param {string} userId - User ID
   */
  async testNotification(userId) {
    if (this.subscribers.has(userId)) {
      const subscription = this.subscribers.get(userId);
      const testAlert = {
        type: 'test',
        severity: 'info',
        message: 'This is a test notification from NASA TEMPO Air Quality Forecast System',
        timestamp: new Date().toISOString()
      };

      await this.sendAlerts(userId, [testAlert], subscription);
    }
  }
}

module.exports = NotificationService;
