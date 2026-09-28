const webpush = require('web-push');
const NotificationDevice = require('../models/NotificationDevice');

// Standard VAPID credentials
const DEFAULT_VAPID_PUBLIC = 'BB4GQdXt_2Zh6UtcNI4hakKYtAKXzjHDTIqyn7UzxLTxPf_sHunFQ9cn-JerqeTb4df0F9IWBFa2K9cEAuADp1Y';
const DEFAULT_VAPID_PRIVATE = 'A25DaMua84sNKE29lJAoqk2hlVuaaGyY48vl7R4fp9s';
const DEFAULT_VAPID_SUBJECT = 'mailto:support@alumnex.com';

class WebPushService {
  constructor() {
    this.publicKey = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC;
    this.privateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE;
    this.subject = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;
    this.initialized = false;

    this.init();
  }

  init() {
    try {
      webpush.setVapidDetails(this.subject, this.publicKey, this.privateKey);
      this.initialized = true;
      console.log('[WebPushService] VAPID details initialized successfully.');
    } catch (err) {
      console.error('[WebPushService] Failed to set VAPID details:', err.message);
    }
  }

  getPublicKey() {
    return this.publicKey;
  }

  /**
   * Sends a Web Push notification to a specific browser push subscription
   * @param {Object} subscription - { endpoint, keys: { p256dh, auth } }
   * @param {Object} payload - { title, body, icon, badge, tag, url, data }
   * @returns {Promise<{ success: boolean, statusCode?: number, error?: string, expired?: boolean }>}
   */
  async sendPushNotification(subscription, payload) {
    if (!subscription || !subscription.endpoint) {
      return { success: false, error: 'Invalid subscription object' };
    }

    if (!this.initialized) {
      this.init();
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || 'Alumnex Connect',
      body: payload.body || 'You have a new update.',
      icon: payload.icon || '/logo.png',
      badge: payload.badge || '/logo.png',
      tag: payload.tag || 'general-notification',
      url: payload.deepLink || payload.url || '/activity',
      data: {
        ...payload.data,
        url: payload.deepLink || payload.url || '/activity',
        type: payload.type || 'NOTIFICATION'
      }
    });

    const pushOptions = {
      TTL: payload.ttl || 86400, // 24 hours
      urgency: payload.priority === 'urgent' || payload.priority === 'high' ? 'high' : 'normal'
    };

    try {
      const response = await webpush.sendNotification(subscription, notificationPayload, pushOptions);
      return {
        success: true,
        statusCode: response.statusCode,
        headers: response.headers
      };
    } catch (err) {
      const statusCode = err.statusCode || err.status;
      const isExpired = statusCode === 410 || statusCode === 404;

      if (isExpired) {
        console.warn(`[WebPushService] Subscription expired or unsubscribed (${statusCode}). Removing endpoint:`, subscription.endpoint);
        // Clean up dead subscription from database
        try {
          await NotificationDevice.deleteOne({ 'subscription.endpoint': subscription.endpoint });
        } catch (cleanupErr) {
          console.warn('[WebPushService] Endpoint cleanup warning:', cleanupErr.message);
        }
      } else {
        console.error(`[WebPushService] Push error (${statusCode || 'unknown'}):`, err.message);
      }

      return {
        success: false,
        statusCode,
        expired: isExpired,
        error: err.message
      };
    }
  }

  /**
   * Dispatches push notifications to all active web endpoints for a user
   * @param {string|ObjectId} userId
   * @param {Object} payload
   * @returns {Promise<{ sent: number, failed: number, expired: number, total: number }>}
   */
  async sendToUser(userId, payload) {
    const devices = await NotificationDevice.find({
      userId,
      platform: 'web',
      enabled: true,
      'subscription.endpoint': { $exists: true, $ne: null }
    }).lean();

    const summary = { sent: 0, failed: 0, expired: 0, total: devices.length };

    if (devices.length === 0) {
      return summary;
    }

    const pushPromises = devices.map(async (device) => {
      const res = await this.sendPushNotification(device.subscription, payload);
      if (res.success) {
        summary.sent++;
      } else {
        summary.failed++;
        if (res.expired) summary.expired++;
      }
    });

    await Promise.allSettled(pushPromises);
    return summary;
  }
}

module.exports = new WebPushService();
