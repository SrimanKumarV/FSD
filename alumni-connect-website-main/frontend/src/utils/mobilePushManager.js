import { Capacitor } from '@capacitor/core';
import api from './api';
import { getOrCreateDeviceId } from './webPushManager';

/**
 * Alumnex Connect — Android FCM Push Notification Manager
 * 
 * Production Pipeline:
 * Android APK -> Firebase Android SDK -> Real FCM Token -> Backend /devices/register
 * 
 * Production Rules:
 * 1. ZERO fake tokens (no 'fcm_dev_*').
 * 2. Never report success if native registration fails.
 * 3. Listeners installed BEFORE calling register().
 * 4. Android 13+ POST_NOTIFICATIONS runtime permission handling.
 * 5. Channel 'alumnex_default' created on device.
 * 6. FCM token refresh handling.
 */

let PushNotificationsPlugin = null;
let listenersInitialized = false;
let currentToken = null;
let activeNavigateFn = null;

// Multi-subscriber registry for token and error events
const tokenSubscribers = new Set();
const errorSubscribers = new Set();

// Helper to dynamically or directly load @capacitor/push-notifications
async function getPushPlugin() {
  if (PushNotificationsPlugin) return PushNotificationsPlugin;

  // 1. Direct window bridge check (most reliable in Capacitor WebView & remote server.url)
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.PushNotifications) {
    PushNotificationsPlugin = window.Capacitor.Plugins.PushNotifications;
    return PushNotificationsPlugin;
  }

  // 2. Direct dynamic import of @capacitor/push-notifications
  try {
    const mod = await import('@capacitor/push-notifications');
    if (mod?.PushNotifications) {
      PushNotificationsPlugin = mod.PushNotifications;
      return PushNotificationsPlugin;
    }
  } catch (err) {
    console.warn('[MobilePush] Dynamic import of @capacitor/push-notifications failed:', err.message);
  }

  // 3. Fallback to global plugin registry
  if (typeof window !== 'undefined' && window.PushNotifications) {
    PushNotificationsPlugin = window.PushNotifications;
    return PushNotificationsPlugin;
  }

  return null;
}

export const mobilePushManager = {
  /**
   * Only true on native mobile platforms (Android/iOS Capacitor container).
   * Browsers must use Web Push (VAPID).
   */
  isSupported() {
    if (typeof window === 'undefined') return false;
    return Boolean(
      Capacitor.isNativePlatform?.() ||
      window.Capacitor?.isNativePlatform?.() ||
      window.Capacitor?.getPlatform?.() === 'android' ||
      window.Capacitor?.getPlatform?.() === 'ios' ||
      window.location?.protocol === 'capacitor:' ||
      (window.Capacitor && window.Capacitor.platform !== 'web')
    );
  },

  /**
   * Check Android 13+ notification runtime permission
   * Returns: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unsupported'
   */
  async checkPermission() {
    if (!this.isSupported()) return 'unsupported';
    const plugin = await getPushPlugin();
    if (!plugin) return 'unavailable';

    try {
      const status = await plugin.checkPermissions();
      return status?.receive || 'prompt';
    } catch (err) {
      console.error('[MobilePush] checkPermissions failed:', err.message);
      return 'prompt';
    }
  },

  /**
   * Create Android Notification Channel 'alumnex_default'
   */
  async ensureNotificationChannel(plugin) {
    if (!plugin || typeof plugin.createChannel !== 'function') return;

    try {
      await plugin.createChannel({
        id: 'alumnex_default',
        name: 'Alumnex Notifications',
        description: 'Alumnex Connect Announcements, Messages, and Activity Alerts',
        importance: 5, // High importance (heads-up notification)
        visibility: 1, // Public visibility on lockscreen
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#4f46e5'
      });
      console.log('[MobilePush] Android notification channel "alumnex_default" configured');
    } catch (err) {
      console.warn('[MobilePush] Failed to create notification channel:', err.message);
    }
  },

  /**
   * Attach native push notification listeners.
   * MUST be executed before plugin.register().
   */
  async initListeners(plugin) {
    if (listenersInitialized) return;

    try {
      // 1. Channel setup
      await this.ensureNotificationChannel(plugin);

      // 2. Token Registration Listener (FCM token provided by Google Play Services)
      await plugin.addListener('registration', async (token) => {
        console.log('[MobilePush] Native FCM registration token received from Android Firebase SDK');
        if (!token?.value || typeof token.value !== 'string' || token.value.startsWith('fcm_dev_')) {
          const err = new Error('Invalid FCM token received from Firebase SDK');
          console.error('[MobilePush]', err.message);
          errorSubscribers.forEach(cb => cb(err));
          return;
        }

        currentToken = token.value;
        try {
          localStorage.setItem('alumnex_fcm_token', token.value);
        } catch (_) {}

        // Deliver real token to Alumnex backend
        try {
          const deviceId = getOrCreateDeviceId();
          await api.post('/notifications/devices/register', {
            platform: 'android',
            pushProvider: 'fcm',
            pushToken: token.value,
            deviceId,
            deviceName: 'Samsung Galaxy (Alumnex APK)',
            appVersion: '1.0.2'
          });
          console.log('[MobilePush] Real FCM token successfully synchronized with Alumnex backend');
          tokenSubscribers.forEach(cb => cb(token.value));
        } catch (syncErr) {
          console.error('[MobilePush] Backend device registration failed:', syncErr.response?.data?.message || syncErr.message);
          errorSubscribers.forEach(cb => cb(syncErr));
        }
      });

      // 3. Token Registration Error Listener
      await plugin.addListener('registrationError', (error) => {
        const errorReason = error?.error || error?.message || JSON.stringify(error);
        console.error('[MobilePush] Native FCM registration error from Firebase Android SDK:', errorReason);
        errorSubscribers.forEach(cb => cb(new Error(errorReason)));
      });

      // 4. Foreground Message Listener
      await plugin.addListener('pushNotificationReceived', (notification) => {
        console.log('[MobilePush] Foreground notification received:', notification.title, notification.body);
      });

      // 5. User Notification Action / Tap Listener (Deep Link)
      await plugin.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[MobilePush] Notification action tapped:', action.actionId);
        const data = action.notification?.data || {};
        let targetUrl = data.url || data.deepLink;
        if (targetUrl) {
          if (targetUrl.startsWith('https://alumnex-connect.onrender.com')) {
            targetUrl = targetUrl.replace('https://alumnex-connect.onrender.com', '');
          }
          if (targetUrl.startsWith('http://localhost:3000')) {
            targetUrl = targetUrl.replace('http://localhost:3000', '');
          }
          console.log('[MobilePush] Navigating to deep link:', targetUrl);
          if (typeof activeNavigateFn === 'function') {
            activeNavigateFn(targetUrl);
          } else if (typeof window !== 'undefined' && window.location) {
            window.location.href = targetUrl;
          }
        }
      });

      listenersInitialized = true;
    } catch (listenerErr) {
      console.error('[MobilePush] Error attaching native push listeners:', listenerErr.message);
    }
  },

  /**
   * Request Runtime Permission (Android 13+) and register with FCM.
   * Rejects immediately if not a native device or if permission is denied.
   * NEVER returns a fake token.
   */
  async requestPermissionAndRegister() {
    if (!this.isSupported()) {
      return { success: false, reason: 'unsupported_platform' };
    }

    const plugin = await getPushPlugin();
    if (!plugin) {
      return {
        success: false,
        reason: 'push_plugin_not_installed',
        message: 'Capacitor Push Notifications native plugin is not loaded in the APK binary.'
      };
    }

    // Ensure listeners are always active
    await this.initListeners(plugin);

    return new Promise(async (resolve) => {
      let resolved = false;

      // Safe timeout: 15 seconds
      const timeoutTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          tokenSubscribers.delete(handleToken);
          errorSubscribers.delete(handleError);
          console.error('[MobilePush] FCM registration timed out. No token received from Google Play Services.');
          resolve({
            success: false,
            reason: 'fcm_registration_timeout',
            message: 'Firebase Cloud Messaging did not return a registration token within 15 seconds. Ensure Google Play Services and internet connectivity are active.'
          });
        }
      }, 15000);

      const handleToken = (tokenValue) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutTimer);
          tokenSubscribers.delete(handleToken);
          errorSubscribers.delete(handleError);
          resolve({
            success: true,
            token: tokenValue,
            message: 'Real FCM token obtained and registered with backend.'
          });
        }
      };

      const handleError = (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutTimer);
          tokenSubscribers.delete(handleToken);
          errorSubscribers.delete(handleError);
          resolve({
            success: false,
            reason: 'fcm_registration_failed',
            error: error.message || String(error),
            message: `Native FCM registration failed: ${error.message || error}`
          });
        }
      };

      tokenSubscribers.add(handleToken);
      errorSubscribers.add(handleError);

      try {
        // Step 1: Check current permission status
        let permStatus = await plugin.checkPermissions();

        // Step 2: Request permission if not already granted (Android 13+ POST_NOTIFICATIONS)
        if (permStatus?.receive !== 'granted') {
          console.log('[MobilePush] Requesting POST_NOTIFICATIONS runtime permission...');
          permStatus = await plugin.requestPermissions();
        }

        if (permStatus?.receive !== 'granted') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutTimer);
            tokenSubscribers.delete(handleToken);
            errorSubscribers.delete(handleError);
            resolve({
              success: false,
              reason: 'permission_denied',
              permission: permStatus?.receive,
              message: 'Notification permission was denied. Please grant notification permission in Android Settings.'
            });
          }
          return;
        }

        // If we already have a cached token, immediately sync to backend as fast-path
        const cachedToken = currentToken || (typeof localStorage !== 'undefined' && localStorage.getItem('alumnex_fcm_token'));
        if (cachedToken && !cachedToken.startsWith('fcm_dev_') && cachedToken.length >= 20) {
          try {
            const deviceId = getOrCreateDeviceId();
            await api.post('/notifications/devices/register', {
              platform: 'android',
              pushProvider: 'fcm',
              pushToken: cachedToken,
              deviceId,
              deviceName: 'Samsung Galaxy (Alumnex APK)',
              appVersion: '1.0.2'
            });
            handleToken(cachedToken);
          } catch (e) {
            console.warn('[MobilePush] Fast-path cached token sync failed, falling through to native register:', e.message);
          }
        }

        // Step 3: Register with Google Firebase Cloud Messaging via Android SDK
        console.log('[MobilePush] Permission granted. Invoking native PushNotifications.register()...');
        await plugin.register();

      } catch (err) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutTimer);
          tokenSubscribers.delete(handleToken);
          errorSubscribers.delete(handleError);
          console.error('[MobilePush] Exception during FCM registration pipeline:', err.message);
          resolve({
            success: false,
            reason: 'fcm_exception',
            error: err.message,
            message: `FCM registration error: ${err.message}`
          });
        }
      }
    });
  },

  /**
   * Set up incoming notification & click listeners with React Router navigate
   */
  async setupListeners(navigate) {
    activeNavigateFn = navigate;
    if (!this.isSupported()) return;
    const plugin = await getPushPlugin();
    if (!plugin) return;

    await this.initListeners(plugin);
  },

  /**
   * Automatically re-registers device with Alumnex backend on login/app start
   */
  async syncRegistration() {
    if (!this.isSupported()) return { success: false, reason: 'unsupported' };
    try {
      const perm = await this.checkPermission();
      // On native platform, attempt registration if granted OR if pending prompt
      if (perm !== 'denied') {
        return await this.requestPermissionAndRegister();
      }
      return { success: false, reason: 'permission_denied' };
    } catch (err) {
      console.warn('[MobilePush] Sync registration error:', err.message);
      return { success: false, error: err.message };
    }
  },

  getCurrentToken() {
    return currentToken || (typeof localStorage !== 'undefined' && localStorage.getItem('alumnex_fcm_token'));
  }
};

export default mobilePushManager;
