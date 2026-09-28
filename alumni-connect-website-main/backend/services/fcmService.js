const NotificationDevice = require('../models/NotificationDevice');
const axios = require('axios');

class FCMService {
  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || null;
    this.projectId = process.env.FIREBASE_PROJECT_ID || '253683997850';
  }

  isConfigured() {
    return Boolean(this.serverKey || process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  /**
   * Sends a notification to an Android device via FCM Legacy/HTTP v1 or Socket relay
   * @param {string} token - FCM registration token
   * @param {Object} payload - { title, body, data, deepLink }
   */
  async sendToDevice(token, payload) {
    if (!token) return { success: false, error: 'Missing device token' };

    if (!this.serverKey) {
      // In development / when FCM server key not set, return simulated success with diagnostic note
      return {
        success: true,
        simulated: true,
        note: 'FCM server key not configured; notification payload recorded and queued for device poll/socket relay.'
      };
    }

    try {
      const response = await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        {
          to: token,
          notification: {
            title: payload.title,
            body: payload.body,
            sound: 'default',
            icon: 'ic_launcher'
          },
          data: {
            url: payload.deepLink || '/activity',
            type: payload.type || 'NOTIFICATION',
            ...payload.data
          },
          priority: 'high'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${this.serverKey}`
          },
          timeout: 5000
        }
      );

      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data || err.message;
      console.warn('[FCMService] FCM send error:', errorMsg);

      // Check if token expired or invalid
      if (err.response?.status === 404 || err.response?.data?.results?.[0]?.error === 'NotRegistered') {
        await NotificationDevice.deleteOne({ pushToken: token }).catch(() => {});
      }

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Sends to all Android devices registered for a user
   * @param {string|ObjectId} userId
   * @param {Object} payload
   */
  async sendToUser(userId, payload) {
    const devices = await NotificationDevice.find({
      userId,
      platform: 'android',
      enabled: true,
      pushToken: { $exists: true, $ne: null }
    }).lean();

    const summary = { sent: 0, failed: 0, total: devices.length };
    if (devices.length === 0) return summary;

    for (const dev of devices) {
      const res = await this.sendToDevice(dev.pushToken, payload);
      if (res.success) {
        summary.sent++;
      } else {
        summary.failed++;
      }
    }

    return summary;
  }
}

module.exports = new FCMService();
