const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');

// This will be injected by the main server
let notificationService = null;

/**
 * Set notification service instance
 * @param {NotificationService} service - Notification service instance
 */
function setNotificationService(service) {
  notificationService = service;
}

/**
 * POST /api/notifications/subscribe
 * Subscribe to location-based notifications
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, location, preferences } = req.body;
    
    if (!userId || !location || !location.lat || !location.lng) {
      return res.status(400).json({ 
        error: 'User ID and location (lat, lng) are required' 
      });
    }

    if (!notificationService) {
      return res.status(500).json({ 
        error: 'Notification service not initialized' 
      });
    }

    notificationService.subscribeToLocation(userId, location, preferences);
    
    res.json({
      success: true,
      message: 'Successfully subscribed to notifications',
      data: {
        userId,
        location,
        preferences: preferences || {}
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({ 
      error: 'Failed to subscribe to notifications',
      message: error.message
    });
  }
});

/**
 * DELETE /api/notifications/unsubscribe
 * Unsubscribe from notifications
 */
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (!notificationService) {
      return res.status(500).json({ 
        error: 'Notification service not initialized' 
      });
    }

    notificationService.unsubscribeFromLocation(userId);
    
    res.json({
      success: true,
      message: 'Successfully unsubscribed from notifications',
      data: { userId },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    res.status(500).json({ 
      error: 'Failed to unsubscribe from notifications',
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    if (!userId || !preferences) {
      return res.status(400).json({ 
        error: 'User ID and preferences are required' 
      });
    }

    if (!notificationService) {
      return res.status(500).json({ 
        error: 'Notification service not initialized' 
      });
    }

    notificationService.updatePreferences(userId, preferences);
    
    res.json({
      success: true,
      message: 'Successfully updated notification preferences',
      data: {
        userId,
        preferences
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ 
      error: 'Failed to update notification preferences',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/history
 * Get notification history for user
 */
router.get('/history', async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (!notificationService) {
      return res.status(500).json({ 
        error: 'Notification service not initialized' 
      });
    }

    const history = notificationService.getNotificationHistory(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: history,
      parameters: {
        userId,
        limit: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notification history',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics
 */
router.get('/stats', async (req, res) => {
  try {
    if (!notificationService) {
      return res.status(500).json({ 
        error: 'Notification service not initialized' 
      });
    }

    const stats = notificationService.getNotificationStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notification statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/test
 * Send test notification
 */
router.post('/test', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (!notificationService) {
      return res.status(500).json({ 
        error: 'Notification service not initialized' 
      });
    }

    await notificationService.testNotification(userId);
    
    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: { userId },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ 
      error: 'Failed to send test notification',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/alerts
 * Get active alerts for a location
 */
router.get('/alerts', async (req, res) => {
  try {
    const { lat, lng, radius = 25 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    // This would typically fetch alerts from a database
    // For now, we'll return mock data
    const alerts = generateMockAlerts(parseFloat(lat), parseFloat(lng), parseInt(radius));
    
    res.json({
      success: true,
      data: alerts,
      parameters: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseInt(radius)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

/**
 * Generate mock alerts for demonstration
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius
 * @returns {Array} Mock alerts
 */
function generateMockAlerts(lat, lng, radius) {
  const alerts = [];
  
  // Generate some random alerts
  const alertTypes = [
    {
      type: 'high-aqi',
      severity: 'warning',
      message: 'Air Quality Index is elevated in your area',
      aqi: 120
    },
    {
      type: 'pollutant-spike',
      pollutant: 'PM2.5',
      severity: 'warning',
      message: 'High PM2.5 concentration detected',
      concentration: 45
    },
    {
      type: 'weather-alert',
      severity: 'info',
      message: 'Low wind conditions may trap pollutants',
      windSpeed: 1.5
    }
  ];

  alertTypes.forEach((alert, index) => {
    alerts.push({
      id: `alert-${index + 1}`,
      ...alert,
      location: {
        lat: lat + (Math.random() - 0.5) * 0.01,
        lng: lng + (Math.random() - 0.5) * 0.01
      },
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      recommendations: [
        'Avoid outdoor activities',
        'Use air purifiers indoors',
        'Check for updates regularly'
      ]
    });
  });

  return alerts;
}

module.exports = { router, setNotificationService };
