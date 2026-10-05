const Notification = require('../models/Notification');
const ReminderPreference = require('../models/ReminderPreference');
const User = require('../models/User');
const webPushService = require('./webPushService');
const fcmService = require('./fcmService');
const sendEmail = require('../utils/sendEmail');
const cache = require('../utils/cache');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. NOTIFICATION TYPE REGISTRY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NOTIFICATION_TYPES = {
  OTP: 'OTP',
  SECURITY_ALERT: 'SECURITY_ALERT',
  STREAK_AT_RISK: 'STREAK_AT_RISK',
  STREAK_MILESTONE: 'STREAK_MILESTONE',
  GOAL_REMINDER: 'GOAL_REMINDER',
  GOAL_COMPLETED: 'GOAL_COMPLETED',
  WEEKLY_ACTIVITY_SUMMARY: 'WEEKLY_ACTIVITY_SUMMARY',
  MENTORSHIP_REMINDER: 'MENTORSHIP_REMINDER',
  EVENT_REMINDER: 'EVENT_REMINDER',
  INTERVIEW_REMINDER: 'INTERVIEW_REMINDER',
  DEADLINE_REMINDER: 'DEADLINE_REMINDER',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  CONNECTION_REQUEST: 'CONNECTION_REQUEST',
  FORUM_REPLY: 'FORUM_REPLY',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  JOB_ALERT: 'JOB_ALERT',
  CAREER_ALERT: 'CAREER_ALERT',
  DEV_ACTIVITY_UPDATE: 'DEV_ACTIVITY_UPDATE',
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. DEFAULT CHANNEL POLICY MATRIX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DEFAULT_CHANNEL_POLICY = {
  OTP: { email: true, inApp: false, webPush: false, androidPush: false },
  SECURITY_ALERT: { email: true, inApp: true, webPush: true, androidPush: true },
  STREAK_AT_RISK: { email: true, inApp: true, webPush: true, androidPush: true },
  STREAK_MILESTONE: { email: false, inApp: true, webPush: true, androidPush: true },
  GOAL_REMINDER: { email: false, inApp: true, webPush: true, androidPush: true },
  GOAL_COMPLETED: { email: false, inApp: true, webPush: false, androidPush: false },
  MENTORSHIP_REMINDER: { email: true, inApp: true, webPush: true, androidPush: true },
  EVENT_REMINDER: { email: true, inApp: true, webPush: true, androidPush: true },
  INTERVIEW_REMINDER: { email: true, inApp: true, webPush: true, androidPush: true },
  DEADLINE_REMINDER: { email: true, inApp: true, webPush: true, androidPush: true },
  CHAT_MESSAGE: { email: false, inApp: true, webPush: true, androidPush: true },
  CONNECTION_REQUEST: { email: false, inApp: true, webPush: true, androidPush: true },
  FORUM_REPLY: { email: false, inApp: true, webPush: false, androidPush: false },
  PROJECT_UPDATE: { email: false, inApp: true, webPush: false, androidPush: false },
  JOB_ALERT: { email: false, inApp: true, webPush: false, androidPush: false },
  CAREER_ALERT: { email: false, inApp: true, webPush: false, androidPush: false },
  DEV_ACTIVITY_UPDATE: { email: false, inApp: true, webPush: false, androidPush: false },
  WEEKLY_ACTIVITY_SUMMARY: { email: false, inApp: true, webPush: false, androidPush: false },
  SYSTEM_ANNOUNCEMENT: { email: true, inApp: true, webPush: true, androidPush: true }
};

// Type to Category mapping for user preferences
const TYPE_TO_CATEGORY_PREF = {
  STREAK_AT_RISK: 'streakAlert',
  STREAK_MILESTONE: 'milestoneAlert',
  GOAL_REMINDER: 'dailyReminder',
  GOAL_COMPLETED: 'goalCompletion',
  WEEKLY_ACTIVITY_SUMMARY: 'weeklySummary',
  MENTORSHIP_REMINDER: 'mentorshipReminder',
  INTERVIEW_REMINDER: 'interviewReminder',
  DEADLINE_REMINDER: 'interviewReminder',
  JOB_ALERT: 'jobAlerts',
  CAREER_ALERT: 'jobAlerts',
  CHAT_MESSAGE: 'chatMessages',
  CONNECTION_REQUEST: 'connectionRequests',
  FORUM_REPLY: 'socialReactions',
  SECURITY_ALERT: 'securityAlerts',
  SYSTEM_ANNOUNCEMENT: 'systemAnnouncements',
  DEV_ACTIVITY_UPDATE: 'platformUpdates'
};

class NotificationDispatcher {
  /**
   * Check if current time falls within user's quiet hours
   */
  isQuietHours(prefs) {
    if (!prefs?.quietHoursEnabled) return false;
    const tz = prefs.timezone || 'Asia/Kolkata';
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      const nowHour = parseInt(parts.find(p => p.type === 'hour').value, 10);
      const nowMinute = parseInt(parts.find(p => p.type === 'minute').value, 10);

      const [startH, startM] = (prefs.quietHoursStart || '22:00').split(':').map(Number);
      const [endH, endM] = (prefs.quietHoursEnd || '07:00').split(':').map(Number);

      const nowMins = nowHour * 60 + nowMinute;
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      if (startMins <= endMins) {
        return nowMins >= startMins && nowMins < endMins;
      } else {
        return nowMins >= startMins || nowMins < endMins;
      }
    } catch {
      return false;
    }
  }

  /**
   * Normalizes any raw notification trigger into a canonical event schema
   */
  normalizeEvent(raw = {}) {
    let type = NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT;
    const typeStr = (raw.type || '').toUpperCase().replace(/-/g, '_');

    if (NOTIFICATION_TYPES[typeStr]) {
      type = NOTIFICATION_TYPES[typeStr];
    } else if (typeStr.includes('STREAK')) {
      type = NOTIFICATION_TYPES.STREAK_AT_RISK;
    } else if (typeStr.includes('MENTORSHIP')) {
      type = NOTIFICATION_TYPES.MENTORSHIP_REMINDER;
    } else if (typeStr.includes('MESSAGE')) {
      type = NOTIFICATION_TYPES.CHAT_MESSAGE;
    } else if (typeStr.includes('EVENT')) {
      type = NOTIFICATION_TYPES.EVENT_REMINDER;
    } else if (typeStr.includes('JOB')) {
      type = NOTIFICATION_TYPES.JOB_ALERT;
    }

    return {
      id: raw.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      userId: raw.userId || raw.recipient,
      title: String(raw.title || '').trim(),
      body: String(raw.body || raw.content || '').trim(),
      priority: raw.priority || 'normal', // 'low' | 'normal' | 'high' | 'urgent'
      data: raw.data || {},
      deepLink: raw.deepLink || raw.actionUrl || '/activity',
      dedupKey: raw.dedupKey,
      emailHtml: raw.emailHtml,
      channels: raw.channels,
      io: raw.io,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date()
    };
  }

  /**
   * Dispatches a normalized notification event to all eligible channels
   * @param {Object} rawEvent
   * @returns {Promise<Object>} delivery results per channel
   */
  async dispatch(rawEvent) {
    const event = this.normalizeEvent(rawEvent);
    const {
      type,
      userId,
      title,
      body,
      priority,
      data,
      deepLink,
      dedupKey,
      emailHtml,
      channels,
      io
    } = event;

    if (!userId || !title) {
      console.warn('[NotificationDispatcher] Skipped dispatch: Missing userId or title');
      return { success: false, error: 'Missing required event fields' };
    }

    // 1. Atomic Distributed Deduplication Check (Phase 10 & 20)
    if (dedupKey) {
      const claimed = await cache.setNX(`notif:dedup:${dedupKey}`, true, 86400);
      if (!claimed) {
        console.log(`[NotificationDispatcher] Atomic distributed cache claim deduplicated notification: ${dedupKey}`);
        return { success: true, deduplicated: true };
      }
    }

    // 2. Fetch User & Preferences
    const [user, prefs] = await Promise.all([
      User.findById(userId).select('name email').lean(),
      ReminderPreference.findOne({ userId }).lean()
    ]);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const effectivePrefs = prefs || {
      emailEnabled: true,
      inAppEnabled: true,
      webPushEnabled: true,
      mobileAppEnabled: true,
      emailMode: 'important_only'
    };

    // Check category preference
    const categoryKey = TYPE_TO_CATEGORY_PREF[type];
    if (categoryKey && effectivePrefs[categoryKey] === false) {
      console.log(`[NotificationDispatcher] Category ${categoryKey} disabled by user ${userId}`);
      return { success: true, skippedByCategory: true };
    }

    const inQuietHours = priority !== 'urgent' && priority !== 'high' && this.isQuietHours(effectivePrefs);
    const policy = DEFAULT_CHANNEL_POLICY[type] || { email: false, inApp: true, webPush: true, androidPush: true };

    const results = {
      inApp: { attempted: false, success: false },
      webPush: { attempted: false, success: false },
      androidPush: { attempted: false, success: false },
      email: { attempted: false, success: false }
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CHANNEL 1: IN-APP NOTIFICATION (WITH ATOMIC DB CLAIM)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let notifDoc = null;
    if (policy.inApp && effectivePrefs.inAppEnabled !== false) {
      results.inApp.attempted = true;
      try {
        const claimRes = await Notification.createOrClaimNotification({
          recipient: userId,
          type: type.toLowerCase().replace(/_/g, '-'),
          title,
          content: body,
          priority: priority === 'urgent' ? 'urgent' : priority === 'high' ? 'high' : 'normal',
          actionUrl: deepLink,
          relatedData: { data },
          dedupKey: dedupKey || undefined,
          metadata: {
            source: 'system',
            category: categoryKey || 'general'
          }
        });

        // If duplicate was intercepted by DB partial unique index:
        if (claimRes.duplicate && !claimRes.created) {
          console.log(`[NotificationDispatcher] Database unique index prevented duplicate notification event: ${dedupKey}`);
          return { success: true, deduplicated: true, notificationId: claimRes.notification?._id };
        }

        notifDoc = claimRes.notification;

        // Realtime Socket.IO delivery
        if (io && notifDoc) {
          io.to(userId.toString()).emit('new-notification', {
            _id: notifDoc._id,
            title,
            content: body,
            message: title,
            type: notifDoc.type,
            actionUrl: deepLink,
            priority,
            createdAt: notifDoc.createdAt
          });
        }

        results.inApp.success = true;
        results.inApp.id = notifDoc?._id;
      } catch (inAppErr) {
        console.error('[NotificationDispatcher] In-App delivery error:', inAppErr.message);
        results.inApp.error = inAppErr.message;
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CHANNEL 2: WEB PUSH NOTIFICATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (policy.webPush && effectivePrefs.webPushEnabled !== false && !inQuietHours) {
      results.webPush.attempted = true;
      try {
        const webResult = await webPushService.sendToUser(userId, {
          title,
          body,
          deepLink,
          type,
          data,
          priority
        });
        results.webPush.success = webResult.sent > 0;
        results.webPush.summary = webResult;
      } catch (webErr) {
        console.error('[NotificationDispatcher] Web Push delivery error:', webErr.message);
        results.webPush.error = webErr.message;
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CHANNEL 3: ANDROID APK PUSH (FCM)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (policy.androidPush && effectivePrefs.mobileAppEnabled !== false && !inQuietHours) {
      results.androidPush.attempted = true;
      try {
        const fcmResult = await fcmService.sendToUser(userId, {
          title,
          body,
          deepLink,
          type,
          data,
          priority
        });
        results.androidPush.success = fcmResult.sent > 0;
        results.androidPush.summary = fcmResult;
      } catch (fcmErr) {
        console.error('[NotificationDispatcher] Android Push delivery error:', fcmErr.message);
        results.androidPush.error = fcmErr.message;
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CHANNEL 4: SELECTIVE EMAIL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Email Policy: Only OTP, Security, or important alerts if email is enabled and not in 'none' mode
    const isEmailAllowed = (
      type === NOTIFICATION_TYPES.OTP ||
      type === NOTIFICATION_TYPES.SECURITY_ALERT ||
      (policy.email && effectivePrefs.emailEnabled !== false && effectivePrefs.emailMode !== 'none')
    );

    if (isEmailAllowed && user.email) {
      results.email.attempted = true;
      try {
        const subject = `${priority === 'urgent' ? '🚨 ' : ''}${title}`;
        const messageHtml = emailHtml || `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #4f46e5; margin: 0;">Alumnex Connect</h2>
            </div>
            <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #0f172a;">${title}</h3>
              <p style="font-size: 15px; line-height: 1.6; color: #334155;">${body}</p>
              ${deepLink ? `
                <div style="margin-top: 24px;">
                  <a href="https://alumnex-connect.onrender.com${deepLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px;">
                    View in Alumnex
                  </a>
                </div>
              ` : ''}
            </div>
            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px;">
              Manage your email notifications in Alumnex Settings.
            </p>
          </div>
        `;

        await sendEmail({
          email: user.email,
          subject,
          message: messageHtml
        });

        results.email.success = true;
      } catch (emailErr) {
        console.warn(`[NotificationDispatcher] Email delivery failed for ${user.email}:`, emailErr.message);
        results.email.error = emailErr.message;
      }
    }

    // Structured server delivery log (Phase 12)
    const userStr = String(userId);
    const maskedUser = userStr.length > 8 ? `${userStr.substring(0, 4)}...${userStr.slice(-4)}` : userStr;
    const inAppStatus = results.inApp.success ? 'success' : results.inApp.attempted ? 'failed' : 'skipped';
    const webStatus = results.webPush.success ? 'success' : results.webPush.attempted ? 'failed' : 'skipped';
    const fcmStatus = results.androidPush.success ? 'success' : results.androidPush.attempted ? 'failed' : 'skipped';
    const emailStatus = results.email.success ? 'success' : results.email.attempted ? 'failed' : 'skipped';

    console.log(`[NOTIFICATION] type=${type} recipient=${maskedUser} inApp=${inAppStatus} webEndpoints=${results.webPush.summary?.total || 0} webPush=${webStatus} fcmEndpoints=${results.androidPush.summary?.total || 0} fcm=${fcmStatus} email=${emailStatus}`);

    return {
      success: true,
      results
    };
  }

  /**
   * Helper to dispatch directly from an existing Notification document
   * @param {Object} notif
   * @param {Object} io
   */
  async dispatchFromNotification(notif, io = null) {
    if (!notif || !notif.recipient) return;

    let normalizedType = NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT;
    const typeStr = (notif.type || '').toUpperCase().replace(/-/g, '_');

    if (NOTIFICATION_TYPES[typeStr]) {
      normalizedType = NOTIFICATION_TYPES[typeStr];
    } else if (typeStr.includes('STREAK')) {
      normalizedType = NOTIFICATION_TYPES.STREAK_AT_RISK;
    } else if (typeStr.includes('MENTORSHIP')) {
      normalizedType = NOTIFICATION_TYPES.MENTORSHIP_REMINDER;
    } else if (typeStr.includes('MESSAGE')) {
      normalizedType = NOTIFICATION_TYPES.CHAT_MESSAGE;
    } else if (typeStr.includes('EVENT')) {
      normalizedType = NOTIFICATION_TYPES.EVENT_REMINDER;
    } else if (typeStr.includes('JOB')) {
      normalizedType = NOTIFICATION_TYPES.JOB_ALERT;
    }

    // Fetch user preferences with sensible defaults
    const prefs = await ReminderPreference.findOne({ userId: notif.recipient }).lean();
    const effectivePrefs = prefs || {
      webPushEnabled: true,
      mobileAppEnabled: true,
      chatMessages: true,
      emailEnabled: false
    };

    // Category filter
    const categoryKey = TYPE_TO_CATEGORY_PREF[normalizedType];
    if (categoryKey && effectivePrefs[categoryKey] === false) {
      console.log(`[NotificationDispatcher] Category ${categoryKey} disabled for user ${notif.recipient}`);
      return;
    }

    const inQuietHours = notif.priority !== 'urgent' && notif.priority !== 'high' && this.isQuietHours(effectivePrefs);
    const deepLink = notif.actionUrl || '/notifications';

    let webResult = { sent: 0, failed: 0, total: 0 };
    let fcmResult = { sent: 0, failed: 0, total: 0 };

    // Send Web Push if enabled and not in quiet hours
    if (effectivePrefs.webPushEnabled !== false && !inQuietHours) {
      try {
        webResult = await webPushService.sendToUser(notif.recipient, {
          title: notif.title,
          body: notif.content,
          deepLink,
          type: normalizedType,
          priority: notif.priority,
          data: notif.relatedData || {}
        });
      } catch (webErr) {
        console.warn('[NotificationDispatcher] Web Push error in dispatchFromNotification:', webErr.message);
      }
    }

    // Send Android FCM if enabled and not in quiet hours
    if (effectivePrefs.mobileAppEnabled !== false && !inQuietHours) {
      try {
        fcmResult = await fcmService.sendToUser(notif.recipient, {
          title: notif.title,
          body: notif.content,
          deepLink,
          type: normalizedType,
          priority: notif.priority,
          data: notif.relatedData || {}
        });
      } catch (fcmErr) {
        console.warn('[NotificationDispatcher] FCM error in dispatchFromNotification:', fcmErr.message);
      }
    }

    // Structured server delivery log (Phase 12)
    const recipientStr = String(notif.recipient);
    const maskedRecipient = recipientStr.length > 8 ? `${recipientStr.substring(0, 4)}...${recipientStr.slice(-4)}` : recipientStr;
    const webStatus = webResult.sent > 0 ? 'success' : webResult.total === 0 ? 'no_endpoints' : 'failed';
    const fcmStatus = fcmResult.sent > 0 ? 'success' : fcmResult.total === 0 ? 'no_endpoints' : 'failed';

    console.log(`[NOTIFICATION] type=${normalizedType} recipient=${maskedRecipient} inApp=success webEndpoints=${webResult.total} webPush=${webStatus} fcmEndpoints=${fcmResult.total} fcm=${fcmStatus} email=skipped`);
  }
}

const instance = new NotificationDispatcher();
instance.notificationDispatcher = instance;
instance.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
instance.DEFAULT_CHANNEL_POLICY = DEFAULT_CHANNEL_POLICY;

module.exports = instance;
