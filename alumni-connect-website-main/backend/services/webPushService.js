const webpush = require('web-push');
const NotificationDevice = require('../models/NotificationDevice');

class WebPushService {
  constructor() {
    this.publicKey = process.env.VAPID_PUBLIC_KEY ? process.env.VAPID_PUBLIC_KEY.trim() : null;
    this.privateKey = process.env.VAPID_PRIVATE_KEY ? process.env.VAPID_PRIVATE_KEY.trim() : null;
    this.subject = process.env.VAPID_SUBJECT ? process.env.VAPID_SUBJECT.trim() : 'mailto:support@alumnex.com';
    this.initialized = false;
    this.isAvailable = false;

    this.init();
  }

  init() {
    if (!this.publicKey || !this.privateKey) {
      if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_PUSH_NOTIFICATIONS === 'true') {
        throw new Error('[WebPushService] Missing required VAPID configuration in production. VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set.');
      }
      this.initialized = false;
      this.isAvailable = false;
      console.warn('[WebPushService] Note: VAPID keys not configured in environment. Web Push notifications are safely disabled.');
      return;
    }

    try {
      webpush.setVapidDetails(this.subject, this.publicKey, this.privateKey);
      this.initialized = true;
      this.isAvailable = true;
      console.log('[WebPushService] VAPID details initialized successfully.');
    } catch (err) {
      this.initialized = false;
      this.isAvailable = false;
      console.error('[WebPushService] Failed to set VAPID details:', err.message);
    }
  }

  isConfigured() {
    return Boolean(this.initialized && this.isAvailable && this.publicKey);
  }

  getPublicKey() {
    return this.isConfigured() ? this.publicKey : null;
  }

  /**
   * Sends a Web Push notification to a specific browser push subscription
   * @param {Object} subscription - { endpoint, keys: { p256dh, auth } }
   * @param {Object} payload - { title, body, icon, badge, tag, url, data }
   * @returns {Promise<{ success: boolean, statusCode?: number, error?: string, expired?: boolean }>}
   */
  async sendPushNotification(subscription, payload) {
    if (!this.isConfigured()) {
      return { success: false, disabled: true, error: 'Web Push notifications are not configured on this server.' };
    }

    if (!subscription || !subscription.endpoint) {
      return { success: false, error: 'Invalid subscription object' };
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

    // Deduplicate by subscription.endpoint (Phase 12 & 34)
    const uniqueDevicesByEndpoint = new Map();
    const duplicateIdsToDelete = [];

    for (const dev of devices) {
      const endpoint = dev.subscription?.endpoint?.trim();
      if (!endpoint) continue;
      if (!uniqueDevicesByEndpoint.has(endpoint)) {
        uniqueDevicesByEndpoint.set(endpoint, dev);
      } else {
        duplicateIdsToDelete.push(dev._id);
      }
    }

    if (duplicateIdsToDelete.length > 0) {
      NotificationDevice.deleteMany({ _id: { $in: duplicateIdsToDelete } }).catch(() => {});
    }

    const uniqueDevices = Array.from(uniqueDevicesByEndpoint.values());
    const summary = { sent: 0, failed: 0, expired: 0, total: uniqueDevices.length, deduplicatedCount: duplicateIdsToDelete.length };

    if (uniqueDevices.length === 0) {
      return summary;
    }

    const pushPromises = uniqueDevices.map(async (device) => {
      const res = await this.sendPushNotification(device.subscription, payload);
      if (res.success) {
        summary.sent++;
        await NotificationDevice.updateOne(
          { _id: device._id },
          { $set: { lastDeliveryAt: new Date(), lastDeliveryStatus: 'success', lastError: null } }
        ).catch(() => {});
      } else {
        summary.failed++;
        if (res.expired) summary.expired++;
        await NotificationDevice.updateOne(
          { _id: device._id },
          { $set: { lastDeliveryAt: new Date(), lastDeliveryStatus: res.expired ? 'expired' : 'failed', lastError: res.error || 'Delivery failed' } }
        ).catch(() => {});
      }
    });

    await Promise.allSettled(pushPromises);
    return summary;
  }
}

module.exports = new WebPushService();
