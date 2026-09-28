const cron = require('node-cron');
const GoogleCalendarConnection = require('../models/GoogleCalendarConnection');
const googleCalendarService = require('../services/googleCalendarService');
const calendarSyncService = require('../services/calendarSyncService');

/**
 * Daily job to renew expiring Google Calendar watch channels and
 * run low-frequency health sync for connected users.
 * Runs once every 12 hours.
 */
function initCalendarWatchRenewalCron() {
  // Run at minute 0 past every 12th hour
  cron.schedule('0 */12 * * *', async () => {
    console.log('[CalendarWatchCron] Checking for expiring watch channels and running maintenance sync...');
    try {
      const webhookUrl = process.env.GOOGLE_CALENDAR_WEBHOOK_URL;
      const connections = await GoogleCalendarConnection.find({
        status: { $in: ['connected', 'syncing'] },
        syncEnabled: true
      }).select('+accessToken +refreshToken');

      for (const conn of connections) {
        try {
          if (webhookUrl && webhookUrl.startsWith('https://')) {
            await googleCalendarService.refreshWatchChannel(conn, webhookUrl);
          }
          // Incremental maintenance sync
          await calendarSyncService.syncUserCalendar(conn.userId);
        } catch (err) {
          console.warn(`[CalendarWatchCron] Maintenance sync warning for user ${conn.userId}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[CalendarWatchCron] Error in calendar maintenance cron:', error.message);
    }
  });

  console.log('[CalendarWatchCron] Calendar watch renewal and sync cron scheduled (every 12 hours).');
}

module.exports = initCalendarWatchRenewalCron;
