const GoogleCalendarConnection = require('../models/GoogleCalendarConnection');
const GoogleCalendarEvent = require('../models/GoogleCalendarEvent');
const Event = require('../models/Event');
const MentorshipSession = require('../models/MentorshipSession');
const googleCalendarService = require('./googleCalendarService');
const cache = require('../utils/cache');

class CalendarSyncService {
  /**
   * Synchronizes Google Calendar events for a given user
   * @param {string} userId
   * @param {Object} [options]
   * @param {boolean} [options.force=false]
   * @param {Array<string>} [options.calendarIds]
   * @param {Object} [options.io] Socket.IO instance
   * @returns {Promise<{ success: boolean, syncedCount: number, deletedCount: number, error?: string }>}
   */
  async syncUserCalendar(userId, options = {}) {
    const lockKey = `lock:calendar:sync:${userId}`;
    const isLocked = await cache.get(lockKey);
    if (isLocked) {
      return { success: true, message: 'Sync already in progress', syncedCount: 0, deletedCount: 0 };
    }
    // Set 30 second lock to avoid concurrent syncs
    await cache.set(lockKey, true, 30);

    try {
      const connection = await GoogleCalendarConnection.findOne({ userId }).select('+accessToken +refreshToken');
      if (!connection) {
        return { success: false, error: 'Google Calendar connection not found' };
      }

      if (!connection.syncEnabled && !options.force) {
        return { success: false, error: 'Calendar sync is disabled for this user' };
      }

      if (connection.status === 'reauthorization_required') {
        return { success: false, error: 'Reauthorization required' };
      }

      connection.status = 'syncing';
      await connection.save().catch(() => {});

      // Determine which calendars to sync
      const selectedCalendars = (connection.selectedCalendarIds && connection.selectedCalendarIds.length > 0)
        ? connection.selectedCalendarIds
        : [connection.primaryCalendarId || 'primary'];

      const calendarsToSync = (options.calendarIds && options.calendarIds.length > 0)
        ? options.calendarIds
        : selectedCalendars;

      let totalSynced = 0;
      let totalDeleted = 0;

      for (const calId of calendarsToSync) {
        try {
          const syncToken = connection.syncTokens?.get?.(calId);
          // If no sync token, pull 30 days backward and 90 days forward
          const now = new Date();
          const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

          let pageToken = undefined;
          let fetchedItems = [];
          let newSyncToken = undefined;

          do {
            const res = await googleCalendarService.getEvents(connection, {
              calendarId: calId,
              timeMin: syncToken ? undefined : timeMin,
              timeMax: syncToken ? undefined : timeMax,
              syncToken: syncToken,
              pageToken: pageToken,
              maxResults: 250
            });

            fetchedItems.push(...(res.items || []));
            pageToken = res.nextPageToken;
            if (res.nextSyncToken) newSyncToken = res.nextSyncToken;
          } while (pageToken);

          // Update primary calendar timezone if retrieved
          if (calId === (connection.primaryCalendarId || 'primary') && fetchedItems[0]?.start?.timeZone) {
            connection.timezone = fetchedItems[0].start.timeZone;
          }

          // Process and upsert normalized events
          for (const item of fetchedItems) {
            if (item.status === 'cancelled') {
              // Delete or mark cancelled
              await GoogleCalendarEvent.deleteOne({
                userId,
                googleCalendarId: calId,
                googleEventId: item.id
              });
              totalDeleted++;
            } else {
              const normalized = googleCalendarService.normalizeGoogleEvent(item, calId, userId);
              await GoogleCalendarEvent.findOneAndUpdate(
                {
                  userId,
                  googleCalendarId: calId,
                  googleEventId: item.id
                },
                { $set: normalized },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
              totalSynced++;
            }
          }

          if (newSyncToken) {
            if (!connection.syncTokens) connection.syncTokens = new Map();
            connection.syncTokens.set(calId, newSyncToken);
          }
        } catch (calErr) {
          console.error(`[CalendarSyncService] Error syncing calendar ${calId}:`, calErr.message);
        }
      }

      // Finalize connection status
      connection.status = 'connected';
      connection.lastSyncedAt = new Date();
      connection.lastSuccessfulSyncAt = new Date();
      connection.lastError = null;
      await connection.save();

      // Invalidate relevant Redis caches for activity intelligence
      await cache.del(`activity:dashboard:${userId}`);
      await cache.del(`calendar:events:${userId}`);

      // Emit Socket.IO realtime update if available
      const io = options.io;
      if (io) {
        io.to(userId.toString()).emit('calendar:sync_completed', {
          syncedCount: totalSynced,
          deletedCount: totalDeleted,
          lastSyncedAt: connection.lastSyncedAt
        });
      }

      return {
        success: true,
        syncedCount: totalSynced,
        deletedCount: totalDeleted,
        lastSyncedAt: connection.lastSyncedAt
      };
    } catch (err) {
      console.error('[CalendarSyncService] Global sync error:', err.message);
      await GoogleCalendarConnection.updateOne(
        { userId },
        {
          $set: {
            status: err.message?.includes('reauthorization') ? 'reauthorization_required' : 'error',
            'lastError.message': err.message,
            'lastError.timestamp': new Date()
          }
        }
      ).catch(() => {});
      return { success: false, error: err.message, syncedCount: 0, deletedCount: 0 };
    } finally {
      await cache.del(lockKey);
    }
  }

  /**
   * Retrieves today's schedule context for Activity Hub & Dashboard
   * Analyzes busy intervals and available free time windows.
   * @param {string} userId
   * @param {string} [timezone='Asia/Kolkata']
   * @param {Date} [referenceDate=new Date()]
   * @returns {Promise<Object>}
   */
  async getScheduleContext(userId, timezone = 'Asia/Kolkata', referenceDate = new Date()) {
    // Determine start of day and end of day in target timezone
    const now = new Date(referenceDate);
    
    // We format UTC bounds for current calendar day in the given timezone
    let dateStr;
    try {
      dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now); // YYYY-MM-DD
    } catch (e) {
      dateStr = now.toISOString().split('T')[0];
    }

    const dayStart = new Date(`${dateStr}T00:00:00Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    // Fetch synchronized Google Calendar events
    const googleEvents = await GoogleCalendarEvent.find({
      userId,
      status: { $ne: 'cancelled' },
      start: { $lte: dayEnd },
      end: { $gte: dayStart }
    }).sort({ start: 1 }).lean();

    // Fetch registered Alumnex events happening today
    const alumnexEvents = await Event.find({
      'registrations.user': userId,
      status: 'published',
      startDate: { $lte: dayEnd },
      endDate: { $gte: dayStart }
    }).select('title description startDate endDate location isVirtual meetingLink').lean();

    // Fetch active mentorship sessions for today
    const mentorshipSessions = await MentorshipSession.find({
      $or: [{ student: userId }, { mentor: userId }],
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['confirmed', 'pending'] }
    }).populate('mentor', 'name').populate('student', 'name').lean();

    // Combine and normalize all schedule items
    const scheduleItems = [];

    googleEvents.forEach(e => {
      scheduleItems.push({
        id: e._id,
        source: 'google',
        title: e.summary,
        description: e.description,
        start: new Date(e.start),
        end: new Date(e.end),
        allDay: e.allDay,
        location: e.location,
        meetUrl: e.conferenceData?.meetUrl || null,
        htmlLink: e.htmlLink,
        eventType: e.eventType
      });
    });

    alumnexEvents.forEach(e => {
      // Avoid duplicate if already linked in googleEvents
      const alreadyLinked = googleEvents.some(ge => ge.alumnexEventId?.toString() === e._id.toString());
      if (!alreadyLinked) {
        scheduleItems.push({
          id: e._id,
          source: 'alumnex',
          title: e.title,
          description: e.description,
          start: new Date(e.startDate),
          end: new Date(e.endDate),
          allDay: false,
          location: e.location || (e.isVirtual ? 'Virtual' : 'Campus'),
          meetUrl: e.meetingLink || null,
          htmlLink: `/events/${e._id}`,
          eventType: 'alumnex_event'
        });
      }
    });

    mentorshipSessions.forEach(s => {
      const alreadyLinked = googleEvents.some(ge => ge.alumnexMentorshipSessionId?.toString() === s._id.toString());
      if (!alreadyLinked) {
        // Parse time if stored as "14:00" string
        let sStart = new Date(s.date);
        let sEnd = new Date(sStart.getTime() + 60 * 60 * 1000); // 1 hour default
        if (s.time && s.time.includes(':')) {
          const [hours, mins] = s.time.split(':').map(Number);
          sStart.setHours(hours, mins, 0, 0);
          sEnd = new Date(sStart.getTime() + 60 * 60 * 1000);
        }
        scheduleItems.push({
          id: s._id,
          source: 'mentorship',
          title: `1:1 Mentorship with ${s.mentor?.name || s.student?.name || 'Mentor'}`,
          description: `Scheduled 1:1 mentorship session`,
          start: sStart,
          end: sEnd,
          allDay: false,
          location: 'Virtual',
          meetUrl: null,
          htmlLink: '/mentorship',
          eventType: 'mentorship'
        });
      }
    });

    // Sort chronologically
    scheduleItems.sort((a, b) => a.start - b.start);

    // Compute busy intervals and available free time windows between 09:00 and 21:00
    const workDayStart = new Date(dayStart);
    workDayStart.setHours(9, 0, 0, 0);
    const workDayEnd = new Date(dayStart);
    workDayEnd.setHours(21, 0, 0, 0);

    const timedEvents = scheduleItems.filter(e => !e.allDay && e.end > workDayStart && e.start < workDayEnd);
    const freeWindows = [];
    let currentPointer = new Date(workDayStart);

    // Merge overlapping busy intervals
    const busyIntervals = [];
    for (const ev of timedEvents) {
      const evStart = new Date(Math.max(ev.start.getTime(), workDayStart.getTime()));
      const evEnd = new Date(Math.min(ev.end.getTime(), workDayEnd.getTime()));

      if (busyIntervals.length === 0) {
        busyIntervals.push({ start: evStart, end: evEnd });
      } else {
        const last = busyIntervals[busyIntervals.length - 1];
        if (evStart <= last.end) {
          if (evEnd > last.end) last.end = evEnd;
        } else {
          busyIntervals.push({ start: evStart, end: evEnd });
        }
      }
    }

    // Derive free windows from merged busy intervals
    for (const busy of busyIntervals) {
      if (busy.start > currentPointer) {
        const diffMinutes = Math.round((busy.start.getTime() - currentPointer.getTime()) / 60000);
        if (diffMinutes >= 15) {
          freeWindows.push({
            start: new Date(currentPointer),
            end: new Date(busy.start),
            durationMinutes: diffMinutes,
            label: `${diffMinutes} mins free`,
            isPast: busy.start <= now
          });
        }
      }
      if (busy.end > currentPointer) {
        currentPointer = new Date(busy.end);
      }
    }

    if (currentPointer < workDayEnd) {
      const remainingMinutes = Math.round((workDayEnd.getTime() - currentPointer.getTime()) / 60000);
      if (remainingMinutes >= 15) {
        freeWindows.push({
          start: new Date(currentPointer),
          end: new Date(workDayEnd),
          durationMinutes: remainingMinutes,
          label: `${remainingMinutes} mins free`,
          isPast: workDayEnd <= now
        });
      }
    }

    // Find next upcoming event
    const upcomingItems = scheduleItems.filter(e => e.start > now);
    const nextEvent = upcomingItems.length > 0 ? upcomingItems[0] : null;

    // Calculate total available minutes remaining today
    const totalFreeMinutes = freeWindows.reduce((acc, w) => acc + w.durationMinutes, 0);
    const remainingFreeMinutes = freeWindows.filter(w => !w.isPast).reduce((acc, w) => acc + w.durationMinutes, 0);

    return {
      date: dateStr,
      timezone,
      eventsCount: scheduleItems.length,
      events: scheduleItems,
      freeWindows,
      totalFreeMinutes,
      remainingFreeMinutes,
      nextEvent,
      hasScheduleConflict: busyIntervals.length < timedEvents.length
    };
  }

  /**
   * Adds an existing Alumnex Event to the user's Google Calendar
   * @param {string} userId
   * @param {string} eventId
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async addAlumnexEventToCalendar(userId, eventId, options = {}) {
    const connection = await GoogleCalendarConnection.findOne({ userId }).select('+accessToken +refreshToken');
    if (!connection) throw new Error('Google Calendar is not connected');

    const event = await Event.findById(eventId);
    if (!event) throw new Error('Alumnex event not found');

    const eventData = {
      summary: `[Alumnex] ${event.title}`,
      description: `${event.description}\n\nEvent link: ${process.env.FRONTEND_URL || 'https://alumnex-connect.onrender.com'}/events`,
      location: event.location || (event.isVirtual ? 'Virtual Event' : ''),
      start: event.startDate,
      end: event.endDate,
      timezone: event.timezone || connection.timezone || 'UTC',
      allDay: false
    };

    const googleEvent = await googleCalendarService.createEvent(
      connection,
      connection.primaryCalendarId || 'primary',
      eventData,
      { createMeet: Boolean(options.createMeet || event.isVirtual) }
    );

    // Save synchronized copy in MongoDB
    const normalized = googleCalendarService.normalizeGoogleEvent(
      googleEvent,
      connection.primaryCalendarId || 'primary',
      userId
    );
    normalized.alumnexEventId = event._id;
    normalized.eventType = 'alumnex_event';
    normalized.source = 'alumnex';

    const savedDoc = await GoogleCalendarEvent.findOneAndUpdate(
      {
        userId,
        googleCalendarId: connection.primaryCalendarId || 'primary',
        googleEventId: googleEvent.id
      },
      { $set: normalized },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      success: true,
      googleEventId: googleEvent.id,
      htmlLink: googleEvent.htmlLink,
      meetUrl: normalized.conferenceData?.meetUrl,
      event: savedDoc
    };
  }

  /**
   * Adds an Alumnex 1:1 Mentorship Session to the user's Google Calendar with optional Meet
   * @param {string} userId
   * @param {string} sessionId
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async addMentorshipSessionToCalendar(userId, sessionId, options = { createMeet: true }) {
    const connection = await GoogleCalendarConnection.findOne({ userId }).select('+accessToken +refreshToken');
    if (!connection) throw new Error('Google Calendar is not connected');

    const session = await MentorshipSession.findById(sessionId).populate('mentor student');
    if (!session) throw new Error('Mentorship session not found');

    let startDate = new Date(session.date);
    if (session.time && session.time.includes(':')) {
      const [h, m] = session.time.split(':').map(Number);
      startDate.setHours(h, m, 0, 0);
    }
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour session

    const otherUser = session.student?._id?.toString() === userId.toString() ? session.mentor : session.student;

    const eventData = {
      summary: `Mentorship Session: ${session.student?.name || 'Student'} & ${session.mentor?.name || 'Mentor'}`,
      description: `Alumnex 1:1 Mentorship Session.\nParticipant: ${otherUser?.name || 'Mentorship Partner'} (${otherUser?.email || ''})`,
      location: 'Google Meet',
      start: startDate,
      end: endDate,
      timezone: connection.timezone || 'UTC',
      allDay: false,
      attendees: otherUser?.email ? [{ email: otherUser.email, displayName: otherUser.name }] : []
    };

    const googleEvent = await googleCalendarService.createEvent(
      connection,
      connection.primaryCalendarId || 'primary',
      eventData,
      { createMeet: options.createMeet !== false }
    );

    const normalized = googleCalendarService.normalizeGoogleEvent(
      googleEvent,
      connection.primaryCalendarId || 'primary',
      userId
    );
    normalized.alumnexMentorshipSessionId = session._id;
    normalized.eventType = 'mentorship';
    normalized.source = 'alumnex';

    const savedDoc = await GoogleCalendarEvent.findOneAndUpdate(
      {
        userId,
        googleCalendarId: connection.primaryCalendarId || 'primary',
        googleEventId: googleEvent.id
      },
      { $set: normalized },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      success: true,
      googleEventId: googleEvent.id,
      htmlLink: googleEvent.htmlLink,
      meetUrl: normalized.conferenceData?.meetUrl,
      event: savedDoc
    };
  }
}

module.exports = new CalendarSyncService();
