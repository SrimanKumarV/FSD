/**
 * Alumnex Connect — Web Push & Streak At-Risk Notification Engine
 * Manages Service Worker registration and triggers native push notifications
 * when an active streak is within 3 hours of day-boundary reset.
 */

export const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (err) {
    console.warn('[WebPush] ServiceWorker registration skipped/failed:', err.message);
    return null;
  }
};

export const requestPushPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('[WebPush] Permission request error:', error);
    return 'denied';
  }
};

/**
 * Calculates time remaining until midnight in the user's timezone.
 */
export const getTimeUntilMidnight = (timezone = 'Asia/Kolkata') => {
  try {
    const now = new Date();
    // Format current time in user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

    const totalMinutesElapsed = hour * 60 + minute;
    const totalMinutesInDay = 24 * 60;
    const minutesRemaining = totalMinutesInDay - totalMinutesElapsed;
    const hoursRemaining = minutesRemaining / 60;

    return {
      hour,
      minute,
      minutesRemaining,
      hoursRemaining,
      isWithinThreeHours: hoursRemaining <= 3 && hoursRemaining > 0
    };
  } catch (err) {
    // Local fallback
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diffMs = midnight.getTime() - now.getTime();
    const hoursRemaining = diffMs / (1000 * 60 * 60);
    return {
      hoursRemaining,
      minutesRemaining: Math.floor(diffMs / (1000 * 60)),
      isWithinThreeHours: hoursRemaining <= 3 && hoursRemaining > 0
    };
  }
};

/**
 * Evaluates real streak data and dispatches push notification if streak is at risk
 * within 3 hours of day boundary reset.
 */
export const checkAndTriggerStreakPushNotification = async (activity, timezone = 'Asia/Kolkata') => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const currentStreak = activity?.overallStreak?.current || 0;
  const isAtRisk = activity?.streakAtRisk || activity?.overallStreak?.atRisk;

  // Only notify if streak is active (>0) and at risk
  if (currentStreak <= 0 || !isAtRisk) {
    return;
  }

  const { isWithinThreeHours, hoursRemaining, minutesRemaining } = getTimeUntilMidnight(timezone);
  if (!isWithinThreeHours) {
    return;
  }

  // Deduplication: notify at most once per day
  const todayKey = new Date().toISOString().slice(0, 10);
  const dedupStorageKey = `alumnex_streak_notif_${todayKey}`;
  if (localStorage.getItem(dedupStorageKey)) {
    return;
  }

  const hoursDisplay = Math.max(1, Math.round(hoursRemaining));
  const title = `🔥 Your ${currentStreak}-Day Streak is At Risk!`;
  const body = `You have less than ${hoursDisplay} hour${hoursDisplay > 1 ? 's' : ''} left today to complete an activity before midnight. Log a goal to maintain your momentum!`;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_STREAK_NOTIFICATION',
        title,
        body,
        url: '/activity'
      });
    } else {
      new Notification(title, {
        body,
        icon: '/logo.png',
        tag: 'streak-at-risk',
        requireInteraction: true
      });
    }

    localStorage.setItem(dedupStorageKey, 'true');
    console.log('[WebPush] Streak-at-risk notification successfully dispatched.');
  } catch (err) {
    console.warn('[WebPush] Could not trigger streak notification:', err.message);
  }
};

/**
 * Test dispatch helper for UI settings verification.
 */
export const sendTestStreakNotification = async () => {
  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    alert('Please grant notification permission in your browser to enable streak alerts.');
    return false;
  }

  const title = '🔥 Alumnex Streak Notification Test';
  const body = 'Web Push is active! You will receive alerts when your streak is within 3 hours of day boundary reset.';

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    if (reg && reg.showNotification) {
      await reg.showNotification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'test-notification'
      });
      return true;
    }
  }

  new Notification(title, { body, icon: '/logo.png' });
  return true;
};
