import api from './api';

// Helper to convert VAPID base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Generate or retrieve persistent local device ID
export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return 'unknown-device';
  let deviceId = localStorage.getItem('alumnex_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('alumnex_device_id', deviceId);
  }
  return deviceId;
}

// Detect client browser & device name
export function getDeviceDetails() {
  if (typeof window === 'undefined') return { browser: 'Unknown', deviceName: 'Unknown Device' };

  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let deviceName = 'Browser';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  if (ua.includes('Android')) {
    if (ua.includes('SM-S') || ua.includes('Samsung')) deviceName = 'Samsung Galaxy Device';
    else deviceName = 'Android Mobile';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    deviceName = 'Apple iOS Device';
  } else if (ua.includes('Windows')) {
    deviceName = `Windows PC (${browser})`;
  } else if (ua.includes('Macintosh')) {
    deviceName = `Mac (${browser})`;
  } else if (ua.includes('Linux')) {
    deviceName = `Linux PC (${browser})`;
  }

  return { browser, deviceName };
}

export const webPushManager = {
  /**
   * Check if the current browser environment supports ServiceWorker & PushManager
   */
  isSupported() {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  /**
   * Get current notification permission: 'default' | 'granted' | 'denied' | 'unsupported'
   */
  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Get current existing PushSubscription if active
   */
  async getExistingSubscription() {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (!reg.pushManager) return null;
      return await reg.pushManager.getSubscription();
    } catch (err) {
      console.warn('[WebPushManager] Could not read existing subscription:', err.message);
      return null;
    }
  },

  /**
   * Request browser permission, fetch VAPID key, subscribe to push, and register with backend
   */
  async subscribe() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser.');
    }

    // 1. Request Browser Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      if (permission === 'denied') {
        throw new Error('Browser notification permission is blocked. Please enable notifications in your browser settings.');
      }
      throw new Error('Notification permission was dismissed.');
    }

    // 2. Fetch VAPID Public Key from backend
    const keyRes = await api.get('/notifications/vapid-public-key');
    const vapidPublicKey = keyRes.data?.publicKey;
    if (!vapidPublicKey) {
      throw new Error('Server VAPID public key could not be retrieved.');
    }

    // 3. Register / ready service worker
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // 4. Create PushSubscription
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // 5. Send subscription to Alumnex backend
    const deviceId = getOrCreateDeviceId();
    const { browser, deviceName } = getDeviceDetails();

    await api.post('/notifications/web-push/subscribe', {
      subscription: subscription.toJSON(),
      deviceId,
      deviceName,
      browser
    });

    return subscription;
  },

  /**
   * Unsubscribe push from browser and unregister from backend
   */
  async unsubscribe() {
    if (!this.isSupported()) return true;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }

      const deviceId = getOrCreateDeviceId();
      await api.post('/notifications/web-push/unsubscribe', { deviceId });
      return true;
    } catch (err) {
      console.warn('[WebPushManager] Unsubscribe warning:', err.message);
      throw err;
    }
  },

  /**
   * Syncs existing subscription with backend or auto-subscribes if permission was previously granted
   */
  async syncSubscription() {
    if (!this.isSupported()) return null;
    if (Notification.permission !== 'granted') return null;

    try {
      let sub = await this.getExistingSubscription();
      if (!sub) {
        sub = await this.subscribe().catch(err => {
          console.warn('[WebPushManager] Auto-subscribe error:', err.message);
          return null;
        });
        return sub;
      }

      const deviceId = getOrCreateDeviceId();
      const { browser, deviceName } = getDeviceDetails();

      await api.post('/notifications/web-push/subscribe', {
        subscription: sub.toJSON(),
        deviceId,
        deviceName,
        browser
      });
      return sub;
    } catch (err) {
      console.warn('[WebPushManager] Sync subscription error:', err.message);
      return null;
    }
  },

  /**
   * Send a test notification through the backend dispatcher
   */
  async sendTest(channel = 'web') {
    const res = await api.post('/notifications/test', { channel });
    return res.data;
  }
};

export default webPushManager;
