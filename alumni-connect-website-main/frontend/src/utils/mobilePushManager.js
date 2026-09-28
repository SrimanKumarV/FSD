import { Capacitor } from '@capacitor/core';
import api from './api';
import { getOrCreateDeviceId } from './webPushManager';

/**
 * Alumnex Connect — Android APK Push Notification Manager
 * Handles FCM registration, token delivery to Alumnex backend,
 * and deep link routing for the native Android Capacitor APK.
 */

let PushNotificationsPlugin = null;

async function getPushPlugin() {
  if (PushNotificationsPlugin) return PushNotificationsPlugin;
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const mod = await import('@capacitor/push-notifications');
    PushNotificationsPlugin = mod.PushNotifications;
    return PushNotificationsPlugin;
  } catch (err) {
    console.warn('[MobilePush] @capacitor/push-notifications not dynamically loaded:', err.message);
    return null;
  }
}

export const mobilePushManager = {
  isSupported() {
    return Capacitor.isNativePlatform();
  },

  async checkPermission() {
    if (!this.isSupported()) return 'unsupported';
    const plugin = await getPushPlugin();
    if (!plugin) return 'unavailable';

    try {
      const status = await plugin.checkPermissions();
      return status.receive; // 'granted' | 'denied' | 'prompt'
    } catch (err) {
      console.warn('[MobilePush] checkPermissions failed:', err.message);
      return 'prompt';
    }
  },

  async requestPermissionAndRegister() {
    if (!this.isSupported()) {
      return { success: false, reason: 'unsupported' };
    }

    const plugin = await getPushPlugin();
    if (!plugin) {
      return { success: false, reason: 'plugin_missing' };
    }

    try {
      const permResult = await plugin.requestPermissions();
      if (permResult.receive !== 'granted') {
        return { success: false, reason: 'permission_denied' };
      }

      // Register device with FCM
      await plugin.register();

      // Listen for registration token
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, reason: 'token_timeout' });
        }, 15000);

        plugin.addListener('registration', async (token) => {
          clearTimeout(timeout);
          try {
            const deviceId = getOrCreateDeviceId();
            await api.post('/notifications/devices/register', {
              platform: 'android',
              pushProvider: 'fcm',
              pushToken: token.value,
              deviceId,
              deviceName: 'Android Device (Alumnex APK)'
            });
            console.log('[MobilePush] Device registered with Alumnex backend');
            resolve({ success: true, token: token.value });
          } catch (regErr) {
            console.error('[MobilePush] Backend device registration failed:', regErr);
            resolve({ success: false, reason: 'backend_sync_failed' });
          }
        });

        plugin.addListener('registrationError', (err) => {
          clearTimeout(timeout);
          console.error('[MobilePush] FCM registration error:', err);
          resolve({ success: false, reason: 'fcm_error', error: err });
        });
      });
    } catch (err) {
      console.error('[MobilePush] requestPermissionAndRegister exception:', err);
      return { success: false, reason: err.message };
    }
  },

  /**
   * Set up incoming notification & click listeners
   */
  async setupListeners(navigate) {
    if (!this.isSupported()) return;
    const plugin = await getPushPlugin();
    if (!plugin) return;

    try {
      plugin.addListener('pushNotificationReceived', (notification) => {
        console.log('[MobilePush] Notification received in foreground:', notification);
      });

      plugin.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[MobilePush] Notification action performed:', action);
        const data = action.notification?.data || {};
        const targetUrl = data.url || data.deepLink;
        if (targetUrl && typeof navigate === 'function') {
          navigate(targetUrl);
        }
      });
    } catch (err) {
      console.warn('[MobilePush] Could not attach listeners:', err.message);
    }
  }
};

export default mobilePushManager;
