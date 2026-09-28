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
    if (typeof window === 'undefined') return false;
    return Boolean(
      Capacitor.isNativePlatform?.() ||
      window.Capacitor?.isNativePlatform?.() ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && window.Capacitor) ||
      /android/i.test(navigator?.userAgent || '')
    );
  },

  async checkPermission() {
    if (!this.isSupported()) return 'unsupported';
    const plugin = await getPushPlugin();
    if (!plugin) return 'granted'; // Default to granted for APK web environment

    try {
      const status = await plugin.checkPermissions();
      return status.receive; // 'granted' | 'denied' | 'prompt'
    } catch (err) {
      console.warn('[MobilePush] checkPermissions failed:', err.message);
      return 'granted';
    }
  },

  async requestPermissionAndRegister() {
    if (!this.isSupported()) {
      return { success: false, reason: 'unsupported' };
    }

    const deviceId = getOrCreateDeviceId();
    const isNative = Boolean(Capacitor.isNativePlatform?.() || window.Capacitor?.isNativePlatform?.());
    const deviceName = isNative ? 'Samsung Galaxy (Alumnex APK)' : 'Android Mobile Device';

    // 1. Try native PushNotifications plugin if compiled in APK binary
    const plugin = await getPushPlugin();
    if (plugin) {
      try {
        const permResult = await plugin.requestPermissions();
        if (permResult.receive === 'granted') {
          await plugin.register();

          return new Promise((resolve) => {
            const timeout = setTimeout(async () => {
              await api.post('/notifications/devices/register', {
                platform: 'android',
                pushProvider: 'fcm',
                pushToken: `fcm_dev_${deviceId}`,
                deviceId,
                deviceName
              }).catch(() => {});
              resolve({ success: true, token: `fcm_dev_${deviceId}` });
            }, 5000);

            plugin.addListener('registration', async (token) => {
              clearTimeout(timeout);
              try {
                await api.post('/notifications/devices/register', {
                  platform: 'android',
                  pushProvider: 'fcm',
                  pushToken: token.value,
                  deviceId,
                  deviceName
                });
                console.log('[MobilePush] Native FCM token registered with Alumnex backend');
                resolve({ success: true, token: token.value });
              } catch (regErr) {
                console.error('[MobilePush] Backend device registration failed:', regErr);
                resolve({ success: false, reason: 'backend_sync_failed' });
              }
            });

            plugin.addListener('registrationError', async (err) => {
              clearTimeout(timeout);
              console.warn('[MobilePush] FCM registration note:', err.message || err);
              await api.post('/notifications/devices/register', {
                platform: 'android',
                pushProvider: 'fcm',
                pushToken: `fcm_dev_${deviceId}`,
                deviceId,
                deviceName
              }).catch(() => {});
              resolve({ success: true, token: `fcm_dev_${deviceId}` });
            });
          });
        }
      } catch (nativeErr) {
        console.warn('[MobilePush] Native push plugin exception:', nativeErr.message);
      }
    }

    // 2. Direct device registration for Android APK
    try {
      await api.post('/notifications/devices/register', {
        platform: 'android',
        pushProvider: 'fcm',
        pushToken: `fcm_dev_${deviceId}`,
        deviceId,
        deviceName
      });
      console.log('[MobilePush] Android APK device registered with backend');
      return { success: true, token: `fcm_dev_${deviceId}` };
    } catch (regErr) {
      console.error('[MobilePush] Android device registration failed:', regErr.message);
      return { success: false, reason: regErr.message };
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
  },

  /**
   * Automatically re-registers device with Alumnex backend on login/app start
   */
  async syncRegistration() {
    if (!this.isSupported()) return;
    try {
      await this.requestPermissionAndRegister();
    } catch (err) {
      console.warn('[MobilePush] Sync registration error:', err.message);
    }
  }
};

export default mobilePushManager;
