/**
 * Alumnex Connect — Canonical Timezone & Date Intelligence Helper
 * Provides consistent, timezone-aware date, midnight, and scheduling utilities.
 */

/**
 * Get current date as YYYY-MM-DD in the specified timezone
 * @param {string} timezone - IANA timezone string (e.g. 'Asia/Kolkata', 'America/New_York')
 * @returns {string} YYYY-MM-DD
 */
function getTodayInTimezone(timezone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).formatToParts(new Date());
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Format any Date object or timestamp as YYYY-MM-DD in the specified timezone
 * @param {Date|string|number} date
 * @param {string} timezone
 * @returns {string} YYYY-MM-DD
 */
function formatDateInTimezone(date, timezone = 'Asia/Kolkata') {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return getTodayInTimezone(timezone);
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).formatToParts(d);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return new Date(date).toISOString().split('T')[0];
  }
}

/**
 * Get the day of week (0=Sunday, 1=Monday, ..., 6=Saturday) in timezone
 * @param {Date|string|number} date
 * @param {string} timezone
 * @returns {number} 0-6
 */
function getDayOfWeekInTimezone(date = new Date(), timezone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).formatToParts(new Date(date));
    const dayStr = parts.find(p => p.type === 'weekday').value;
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return dayMap[dayStr] ?? new Date(date).getDay();
  } catch (e) {
    return new Date(date).getDay();
  }
}

/**
 * Get the previous calendar date (dateStr - 1 day) in YYYY-MM-DD format
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
function getPreviousDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Get the next calendar date (dateStr + 1 day) in YYYY-MM-DD format
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
function getNextDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split('T')[0];
}

/**
 * Check if lastDate is either today or yesterday in user timezone
 * @param {Date|string} lastDate
 * @param {string} timezone
 * @returns {boolean}
 */
function isConsecutiveDay(lastDate, timezone = 'Asia/Kolkata') {
  if (!lastDate) return false;
  const lastStr = formatDateInTimezone(lastDate, timezone);
  const todayStr = getTodayInTimezone(timezone);
  const yesterdayStr = getPreviousDate(todayStr);
  return lastStr === yesterdayStr || lastStr === todayStr;
}

/**
 * Get the current hour and minute in user's timezone
 * @param {string} timezone
 * @returns {{ hour: number, minute: number, totalMinutes: number }}
 */
function getLocalTimeInfo(timezone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(new Date());
    const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
    return {
      hour,
      minute,
      totalMinutes: hour * 60 + minute
    };
  } catch (e) {
    const now = new Date();
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
      totalMinutes: now.getHours() * 60 + now.getMinutes()
    };
  }
}

/**
 * Calculate minutes remaining until local midnight in the user's timezone
 * @param {string} timezone
 * @returns {{ minutesUntilMidnight: number, localDate: string, isNearMidnight: boolean }}
 */
function getMidnightProximity(timezone = 'Asia/Kolkata') {
  const { totalMinutes } = getLocalTimeInfo(timezone);
  const minutesInDay = 24 * 60; // 1440
  const minutesUntilMidnight = Math.max(0, minutesInDay - totalMinutes);
  return {
    minutesUntilMidnight,
    localDate: getTodayInTimezone(timezone),
    isNearMidnight: minutesUntilMidnight <= 60
  };
}

/**
 * Check if the user is currently within their configured quiet hours
 * @param {Object} prefs - ReminderPreference document or object
 * @returns {boolean}
 */
function isQuietHours(prefs) {
  if (!prefs?.quietHoursEnabled) return false;
  const tz = prefs.timezone || 'Asia/Kolkata';
  const { totalMinutes: nowMins } = getLocalTimeInfo(tz);

  const [startH, startM] = (prefs.quietHoursStart || '22:00').split(':').map(Number);
  const [endH, endM] = (prefs.quietHoursEnd || '07:00').split(':').map(Number);

  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;

  if (startMins <= endMins) {
    return nowMins >= startMins && nowMins < endMins;
  } else {
    // Overnight quiet hours (e.g. 22:00 to 07:00)
    return nowMins >= startMins || nowMins < endMins;
  }
}

/**
 * Check if today is an active reminder day for the user
 * @param {Object} prefs
 * @returns {boolean}
 */
function isReminderDay(prefs) {
  const tz = prefs?.timezone || 'Asia/Kolkata';
  const dayOfWeek = getDayOfWeekInTimezone(new Date(), tz);
  const reminderDays = prefs?.reminderDays || [1, 2, 3, 4, 5];
  return reminderDays.includes(dayOfWeek);
}

module.exports = {
  getTodayInTimezone,
  formatDateInTimezone,
  getDayOfWeekInTimezone,
  getPreviousDate,
  getNextDate,
  isConsecutiveDay,
  getLocalTimeInfo,
  getMidnightProximity,
  isQuietHours,
  isReminderDay
};
