const NotificationDevice = require('../models/NotificationDevice');
const firebaseAdmin = require('./firebaseAdmin');

/**
 * Alumnex Connect — Production FCM Push Notification Service
 * Powered by Firebase Admin SDK (HTTP v1 Standard)
 * 
 * Production Standards:
 * 1. Zero fake tokens: Reject 'fcm_dev_*' immediately.
 * 2. Never simulate success when unconfigured or delivery fails.
 * 3. Clean up permanently unregistered/invalid tokens.
 * 4. Retain devices on transient network/Firebase outages.
 * 5. Mask tokens in all structured logs.
 * 6. Guarantee string-only FCM data payload.
 */

class FCMService {
  constructor() {
    this.defaultChannelId = 'alumnex_default';
  }

  /**
   * Safe token masking for logs (e.g. "dK9q1z...mP8x3y")
   */
  maskToken(token) {
    if (!token || typeof token !== 'string') return 'none';
    if (token.length <= 12) return `${token.slice(0, 3)}...`;
    return `${token.substring(0, 6)}...${token.slice(-6)}`;
  }

  isConfigured() {
    return firebaseAdmin.isConfigured();
  }

  getProjectId() {
    return firebaseAdmin.getProjectId();
  }

  /**
   * Sanitizes notification data payload so every key-value pair is strictly a string
   */
  sanitizeData(raw = {}) {
    const stringData = {};
    if (!raw || typeof raw !== 'object') return stringData;

    for (const [key, value] of Object.entries(raw)) {
      if (value === undefined || value === null) continue;
      stringData[String(key)] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return stringData;
  }

  /**
   * Validates if a token is a real FCM registration token
   */
  validateToken(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'missing_token' };
    }
    const trimmed = token.trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
      return { valid: false, reason: 'empty_token' };
    }
    if (trimmed.startsWith('fcm_dev_')) {
      return { valid: false, reason: 'fake_dev_token' };
    }
    if (trimmed.length < 20) {
      return { valid: false, reason: 'token_too_short' };
    }
    return { valid: true, token: trimmed };
  }

  /**
   * Analyzes Firebase errors to distinguish permanent token failure from transient errors
   */
  analyzeError(err) {
    const code = err.code || err.errorInfo?.code || '';
    const msg = String(err.message || '');

    const isUnregistered = (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/invalid-argument' ||
      msg.includes('registration-token-not-registered') ||
      msg.includes('NotRegistered') ||
      msg.includes('Requested entity was not found')
    );

    const isCredentialMismatch = (
      code === 'messaging/mismatched-credential' ||
      code === 'messaging/authentication-error' ||
      msg.includes('mismatched-credential') ||
      msg.includes('SenderId mismatch')
    );

    const isTransient = (
      code === 'messaging/server-unavailable' ||
      code === 'messaging/internal-error' ||
      code === 'messaging/quota-exceeded' ||
      msg.includes('timeout') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('503') ||
      msg.includes('500')
    );

    return {
      code,
      message: msg,
      isUnregistered,
      isCredentialMismatch,
      isTransient
    };
  }

  /**
   * Sends a push notification to an individual Android device via Firebase Admin SDK
   * @param {string} rawToken - Real FCM registration token
   * @param {Object} payload - { title, body, deepLink, type, data, priority }
   * @param {Object} options - { retryCount, deviceDoc }
   */
  async sendToDevice(rawToken, payload = {}, options = {}) {
    const tokenCheck = this.validateToken(rawToken);
    if (!tokenCheck.valid) {
      console.warn(`[FCMService] Token rejected (${tokenCheck.reason}): ${this.maskToken(rawToken)}`);
      // If fake token exists in database, remove it immediately
      if (tokenCheck.reason === 'fake_dev_token' || tokenCheck.reason === 'empty_token') {
        await NotificationDevice.deleteMany({ pushToken: rawToken }).catch(() => {});
      }
      return {
        success: false,
        status: 'invalid-token',
        reason: tokenCheck.reason,
        error: `Invalid FCM registration token (${tokenCheck.reason}). Push notifications require a real token from Google Play Services.`
      };
    }

    const token = tokenCheck.token;

    if (!this.isConfigured()) {
      const unconfiguredMsg = 'Firebase Admin SDK is not configured. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in production.';
      console.error(`[FCMService] Send skipped: ${unconfiguredMsg}`);
      return {
        success: false,
        status: 'failed',
        reason: 'unconfigured',
        error: unconfiguredMsg
      };
    }

    // Prepare string-only data payload
    const safeData = this.sanitizeData({
      url: String(payload.deepLink || '/notifications'),
      type: String(payload.type || 'NOTIFICATION'),
      title: String(payload.title || ''),
      body: String(payload.body || ''),
      timestamp: String(Date.now()),
      ...payload.data
    });

    const fcmMessage = {
      token,
      notification: {
        title: String(payload.title || 'Alumnex Connect').trim(),
        body: String(payload.body || '').trim()
      },
      data: safeData,
      android: {
        priority: payload.priority === 'urgent' || payload.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: this.defaultChannelId,
          sound: 'default',
          icon: 'ic_launcher',
          color: '#4f46e5',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      }
    };

    try {
      const messaging = firebaseAdmin.getMessaging();
      const messageId = await messaging.send(fcmMessage);

      console.log(`[FCMService] Delivered successfully to ${this.maskToken(token)} (msgId: ${messageId})`);

      return {
        success: true,
        status: 'success',
        messageId,
        token: this.maskToken(token)
      };
    } catch (err) {
      const analysis = this.analyzeError(err);
      console.warn(`[FCMService] FCM delivery failed for ${this.maskToken(token)} [${analysis.code || 'UNKNOWN'}]:`, analysis.message);

      // Handle Bounded Transient Retry
      if (analysis.isTransient && (!options.retryCount || options.retryCount < 1)) {
        console.log(`[FCMService] Retrying transient failure for ${this.maskToken(token)} in 600ms...`);
        await new Promise(r => setTimeout(r, 600));
        return this.sendToDevice(rawToken, payload, { ...options, retryCount: (options.retryCount || 0) + 1 });
      }

      // Permanent Invalid Token Cleanup
      if (analysis.isUnregistered) {
        console.log(`[FCMService] Permanent invalid token detected (${this.maskToken(token)}). Removing from database...`);
        await NotificationDevice.deleteMany({ pushToken: token }).catch(() => {});
        return {
          success: false,
          status: 'unregistered',
          permanent: true,
          cleanedUp: true,
          error: 'FCM registration token is expired or no longer registered. The device registration was removed. Reopen the Alumnex APK to register fresh.'
        };
      }

      if (analysis.isCredentialMismatch) {
        return {
          success: false,
          status: 'failed',
          permanent: false,
          error: 'Firebase project mismatch: The Android google-services.json and backend Firebase Admin service account belong to different Firebase projects.'
        };
      }

      return {
        success: false,
        status: analysis.isTransient ? 'temporary-failure' : 'failed',
        permanent: false,
        error: analysis.message
      };
    }
  }

  /**
   * Sends notifications to all registered Android devices for a user
   * @param {string|ObjectId} userId
   * @param {Object} payload
   */
  async sendToUser(userId, payload) {
    if (!userId) return { sent: 0, failed: 0, total: 0, details: [] };

    // Clean up any lingering fake tokens first
    await NotificationDevice.deleteMany({
      userId,
      platform: 'android',
      pushToken: { $regex: /^fcm_dev_/ }
    }).catch(() => {});

    // Fetch active Android devices with real tokens
    const devices = await NotificationDevice.find({
      userId,
      platform: 'android',
      enabled: true,
      pushToken: { $exists: true, $ne: null }
    }).lean();

    const summary = {
      sent: 0,
      failed: 0,
      total: devices.length,
      invalidTokensRemoved: 0,
      details: []
    };

    if (devices.length === 0) {
      return summary;
    }

    for (const dev of devices) {
      const res = await this.sendToDevice(dev.pushToken, payload, { deviceDoc: dev });
      summary.details.push({
        deviceId: dev.deviceId,
        deviceName: dev.deviceName,
        status: res.status,
        success: res.success,
        error: res.error || null
      });

      if (res.success) {
        summary.sent++;
        await NotificationDevice.updateOne(
          { _id: dev._id },
          {
            $set: {
              lastDeliveryAt: new Date(),
              lastSuccessfulDeliveryAt: new Date(),
              lastDeliveryStatus: 'success',
              lastError: null,
              lastSeenAt: new Date()
            }
          }
        ).catch(() => {});
      } else {
        summary.failed++;
        if (res.cleanedUp) {
          summary.invalidTokensRemoved++;
        } else {
          await NotificationDevice.updateOne(
            { _id: dev._id },
            {
              $set: {
                lastDeliveryAt: new Date(),
                lastDeliveryStatus: res.status || 'failed',
                lastError: String(res.error || 'FCM Delivery Failed')
              }
            }
          ).catch(() => {});
        }
      }
    }

    return summary;
  }
}

module.exports = new FCMService();
