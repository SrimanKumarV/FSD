const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, param, query, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const GoogleCalendarConnection = require('../models/GoogleCalendarConnection');
const GoogleCalendarEvent = require('../models/GoogleCalendarEvent');
const googleCalendarService = require('../services/googleCalendarService');
const calendarSyncService = require('../services/calendarSyncService');
const Notification = require('../models/Notification');

// Validation helper
const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation error', errors: errors.array() });
    return false;
  }
  return true;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. OAUTH AUTHORIZATION INITIATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/google-calendar/connect
 * @desc    Generate Google OAuth authorization URL for Calendar integration
 * @access  Private
 */
router.get('/connect', protect, (req, res) => {
  try {
    const mode = req.query.mode === 'mobile' ? 'mobile' : 'web';
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/google-calendar/callback`;

    const { url, state } = googleCalendarService.generateAuthorizationUrl({
      userId: req.user._id,
      mode,
      redirectUri
    });

    res.cookie('gcal_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({ success: true, authorizationUrl: url });
  } catch (error) {
    console.error('[Google Calendar] Connect initiation error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to initiate Calendar authorization' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. OAUTH CALLBACK HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/google-calendar/callback
 * @desc    Google OAuth callback for Calendar integration
 * @access  Public (validated via secure state token)
 */
router.get('/callback', async (req, res) => {
  const { code, state, error: oauthError, error_description } = req.query;

  const renderMobileResult = (deepLinkUrl, title, message, isError = false) => `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            text-align: center;
          }
          .card {
            background: rgba(30, 41, 59, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 36px 28px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
          .icon {
            width: 52px;
            height: 52px;
            margin: 0 auto 16px auto;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)'};
            color: ${isError ? '#ef4444' : '#38bdf8'};
            font-size: 24px;
            font-weight: bold;
          }
          h2 { margin: 0 0 12px; font-size: 20px; color: ${isError ? '#f87171' : '#ffffff'}; }
          p { margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.5; }
          .btn {
            display: inline-block;
            width: 100%;
            padding: 14px 20px;
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            color: #ffffff;
            font-weight: 600;
            font-size: 15px;
            text-decoration: none;
            border-radius: 12px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${isError ? '!' : '✓'}</div>
          <h2>${title}</h2>
          <p>${message}</p>
          <a class="btn" href="${deepLinkUrl}">Return to Alumnex Connect</a>
        </div>
        <script>
          setTimeout(function() {
            window.location.href = ${JSON.stringify(deepLinkUrl)};
          }, 200);
        </script>
      </body>
    </html>
  `;

  // 1. Check for user denial or Google error
  if (oauthError) {
    const msg = error_description || oauthError;
    console.warn('[Google Calendar] OAuth access denied by user:', msg);
    const isMobile = req.cookies?.gcal_oauth_state?.includes('mobile');
    if (isMobile) {
      return res.status(400).send(renderMobileResult(
        `com.alumnex.connect://oauth/google-calendar?error=${encodeURIComponent(msg)}`,
        'Calendar Authorization Cancelled',
        'You declined Google Calendar access. No calendar data was connected.',
        true
      ));
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/calendar?error=${encodeURIComponent(msg)}`);
  }

  // 2. Validate state token
  if (!state) {
    return res.status(403).json({ message: 'Missing OAuth security state token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(state, process.env.JWT_SECRET);
    if (decoded.type !== 'google_calendar_oauth') {
      throw new Error('Invalid state token type');
    }
  } catch (err) {
    console.warn('[Google Calendar] Invalid state in callback:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/calendar?error=${encodeURIComponent('OAuth security state expired or invalid. Please retry connecting.')}`);
  }

  const { userId, mode } = decoded;
  const isMobile = mode === 'mobile';

  if (!code) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/calendar?error=${encodeURIComponent('No authorization code returned from Google')}`);
  }

  try {
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/google-calendar/callback`;
    const { tokens, profile } = await googleCalendarService.exchangeAuthorizationCode(code, redirectUri);

    // Find existing connection or create a new one
    let connection = await GoogleCalendarConnection.findOne({ userId }).select('+accessToken +refreshToken');
    if (!connection) {
      connection = new GoogleCalendarConnection({ userId });
    }

    connection.googleAccountEmail = profile.email || connection.googleAccountEmail;
    connection.googleUserId = profile.id || connection.googleUserId;
    connection.accessToken = tokens.access_token;
    if (tokens.refresh_token) {
      connection.refreshToken = tokens.refresh_token;
    }
    if (tokens.expiry_date) {
      connection.tokenExpiry = new Date(tokens.expiry_date);
    }
    connection.scopes = tokens.scope ? tokens.scope.split(' ') : [];
    connection.status = 'connected';
    connection.syncEnabled = true;
    connection.lastError = null;

    // Retrieve primary calendar to set timezone & primary id
    try {
      const primaryCal = await googleCalendarService.getPrimaryCalendar(connection);
      if (primaryCal) {
        connection.primaryCalendarId = primaryCal.id || 'primary';
        if (primaryCal.timeZone) connection.timezone = primaryCal.timeZone;
      }
    } catch (e) {
      console.warn('[Google Calendar] Primary calendar fetch warning:', e.message);
    }

    if (!connection.selectedCalendarIds || connection.selectedCalendarIds.length === 0) {
      connection.selectedCalendarIds = [connection.primaryCalendarId || 'primary'];
    }

    await connection.save();

    // Trigger initial asynchronous synchronization
    const io = req.app.get('io');
    calendarSyncService.syncUserCalendar(userId, { force: true, io }).catch(syncErr => {
      console.error('[Google Calendar] Initial background sync error:', syncErr.message);
    });

    // Attempt push notification watch channel registration if HTTPS webhook configured
    const webhookUrl = process.env.GOOGLE_CALENDAR_WEBHOOK_URL;
    if (webhookUrl && webhookUrl.startsWith('https://')) {
      googleCalendarService.createWatchChannel(connection, connection.primaryCalendarId || 'primary', webhookUrl).catch(wErr => {
        console.warn('[Google Calendar] Watch establishment warning:', wErr.message);
      });
    }

    // In-app Notification for successful connection
    await Notification.createNotification({
      recipient: userId,
      type: 'CALENDAR_CONNECTED',
      title: 'Google Calendar Connected',
      content: `Successfully connected Google Calendar (${connection.googleAccountEmail || 'Personal'}). Your schedule is now synchronized with Alumnex.`,
      relatedData: { data: { email: connection.googleAccountEmail } }
    }).catch(() => {});

    // Clear state cookie
    res.clearCookie('gcal_oauth_state');

    // Return to mobile app or web frontend
    if (isMobile) {
      const deepLinkUrl = `com.alumnex.connect://oauth/google-calendar?status=success&email=${encodeURIComponent(connection.googleAccountEmail || '')}`;
      return res.send(renderMobileResult(deepLinkUrl, 'Calendar Connected!', 'Google Calendar has been linked to your Alumnex account.'));
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/calendar?connected=true`);
  } catch (err) {
    console.error('[Google Calendar] Callback exchange error:', err.message);
    if (isMobile) {
      const deepLinkUrl = `com.alumnex.connect://oauth/google-calendar?error=${encodeURIComponent(err.message || 'Token exchange failed')}`;
      return res.status(500).send(renderMobileResult(deepLinkUrl, 'Connection Error', err.message, true));
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/calendar?error=${encodeURIComponent(err.message || 'Failed to exchange Google authorization code')}`);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. CONNECTION STATUS & CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/google-calendar/status
 * @desc    Get current Google Calendar connection status (no secrets exposed)
 * @access  Private
 */
router.get('/status', protect, async (req, res) => {
  try {
    const connection = await GoogleCalendarConnection.findOne({ userId: req.user._id });
    if (!connection) {
      return res.json({
        connected: false,
        status: 'disconnected',
        syncEnabled: false
      });
    }

    // Count synced events
    const eventCount = await GoogleCalendarEvent.countDocuments({
      userId: req.user._id,
      status: { $ne: 'cancelled' }
    });

    res.json({
      connected: connection.status === 'connected' || connection.status === 'syncing',
      ...connection.toSafeJSON(),
      eventCount
    });
  } catch (error) {
    console.error('[Google Calendar] Status error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve calendar connection status' });
  }
});

/**
 * @route   POST /api/google-calendar/disconnect
 * @desc    Disconnect Google Calendar and revoke tokens
 * @access  Private
 */
router.post('/disconnect', protect, async (req, res) => {
  try {
    const connection = await GoogleCalendarConnection.findOne({ userId: req.user._id });
    if (connection) {
      await googleCalendarService.revokeConnection(connection);
    }
    res.json({ success: true, message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('[Google Calendar] Disconnect error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to disconnect Google Calendar' });
  }
});

/**
 * @route   GET /api/google-calendar/calendars
 * @desc    List user's available Google calendars
 * @access  Private
 */
router.get('/calendars', protect, async (req, res) => {
  try {
    const connection = await GoogleCalendarConnection.findOne({ userId: req.user._id });
    if (!connection || connection.status === 'disconnected') {
      return res.status(400).json({ message: 'Google Calendar is not connected' });
    }

    const calendars = await googleCalendarService.getCalendars(connection);
    res.json({ calendars });
  } catch (error) {
    console.error('[Google Calendar] Calendars fetch error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to fetch Google calendars' });
  }
});

/**
 * @route   PUT /api/google-calendar/settings
 * @desc    Update selected calendars or sync preferences
 * @access  Private
 */
router.put('/settings', protect, [
  body('selectedCalendarIds').optional().isArray(),
  body('syncEnabled').optional().isBoolean(),
  body('timezone').optional().isString()
], async (req, res) => {
  if (!checkValidation(req, res)) return;

  try {
    const connection = await GoogleCalendarConnection.findOne({ userId: req.user._id });
    if (!connection) {
      return res.status(404).json({ message: 'Calendar connection not found' });
    }

    if (req.body.selectedCalendarIds !== undefined) {
      connection.selectedCalendarIds = req.body.selectedCalendarIds;
    }
    if (req.body.syncEnabled !== undefined) {
      connection.syncEnabled = req.body.syncEnabled;
    }
    if (req.body.timezone) {
      connection.timezone = req.body.timezone;
    }

    await connection.save();
    res.json({ success: true, ...connection.toSafeJSON() });
  } catch (error) {
    console.error('[Google Calendar] Update settings error:', error.message);
    res.status(500).json({ message: 'Failed to update calendar settings' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. EVENT RETRIEVAL & CRUD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/google-calendar/events
 * @desc    Query synchronized calendar events
 * @access  Private
 */
router.get('/events', protect, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('calendarId').optional().isString(),
  query('eventType').optional().isString()
], async (req, res) => {
  if (!checkValidation(req, res)) return;

  try {
    const { startDate, endDate, calendarId, eventType } = req.query;
    const filter = {
      userId: req.user._id,
      status: { $ne: 'cancelled' }
    };

    if (calendarId && calendarId !== 'all') {
      filter.googleCalendarId = calendarId;
    }

    if (eventType && eventType !== 'all') {
      filter.eventType = eventType;
    }

    if (startDate || endDate) {
      filter.start = {};
      if (startDate) filter.start.$gte = new Date(startDate);
      if (endDate) filter.start.$lte = new Date(endDate);
    }

    const events = await GoogleCalendarEvent.find(filter)
      .sort({ start: 1 })
      .populate('alumnexEventId', 'title description location isVirtual meetingLink')
      .populate('alumnexMentorshipSessionId', 'date time status')
      .lean();

    res.json({ success: true, count: events.length, events });
  } catch (error) {
    console.error('[Google Calendar] Events query error:', error.message);
    res.status(500).json({ message: 'Failed to fetch calendar events' });
  }
});

/**
 * @route   POST /api/google-calendar/events
 * @desc    Create a new event on Google Calendar and sync to Alumnex
 * @access  Private
 */
router.post('/events', protect, [
  body('summary').trim().notEmpty().withMessage('Event title is required'),
  body('start').isISO8601().withMessage('Valid start date is required'),
  body('end').isISO8601().withMessage('Valid end date is required'),
  body('description').optional().trim(),
  body('location').optional().trim(),
  body('allDay').optional().isBoolean(),
  body('createMeet').optional().isBoolean(),
  body('calendarId').optional().trim()
], async (req, res) => {
  if (!checkValidation(req, res)) return;

  try {
    const connection = await GoogleCalendarConnection.findOne({ userId: req.user._id });
    if (!connection || connection.status === 'disconnected') {
      return res.status(400).json({ message: 'Google Calendar is not connected' });
    }

    const calendarId = req.body.calendarId || connection.primaryCalendarId || 'primary';
    const googleEvent = await googleCalendarService.createEvent(
      connection,
      calendarId,
      {
        summary: req.body.summary,
        description: req.body.description,
        location: req.body.location,
        start: req.body.start,
        end: req.body.end,
        allDay: req.body.allDay,
        timezone: req.body.timezone || connection.timezone,
        attendees: req.body.attendees || []
      },
      { createMeet: Boolean(req.body.createMeet) }
    );

    // Normalize and persist into MongoDB
    const normalized = googleCalendarService.normalizeGoogleEvent(googleEvent, calendarId, req.user._id);
    normalized.eventType = req.body.eventType || 'google';

    const localDoc = await GoogleCalendarEvent.findOneAndUpdate(
      {
        userId: req.user._id,
        googleCalendarId: calendarId,
        googleEventId: googleEvent.id
      },
      { $set: normalized },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: localDoc,
      googleEvent
    });
  } catch (error) {
    console.error('[Google Calendar] Create event error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to create event' });
  }
});

/**
 * @route   PUT /api/google-calendar/events/:eventId
 * @desc    Update an event on Google Calendar and sync to Alumnex
 * @access  Private
 */
router.put('/events/:eventId', protect, [
  param('eventId').notEmpty().withMessage('Event ID is required'),
  body('summary').optional().trim(),
  body('description').optional().trim(),
  body('location').optional().trim(),
  body('start').optional().isISO8601(),
  body('end').optional().isISO8601()
], async (req, res) => {
  if (!checkValidation(req, res)) return;

  try {
    const connection = await GoogleCalendarConnection.findOne({ userId: req.user._id });
    if (!connection || connection.status === 'disconnected') {
      return res.status(400).json({ message: 'Google Calendar is not connected' });
    }

    // Locate local event record first to determine calendarId and googleEventId
    let localEvent = await GoogleCalendarEvent.findOne({
      userId: req.user._id,
      $or: [{ _id: req.params.eventId.match(/^[0-9a-fA-F]{24}$/) ? req.params.eventId : null }, { googleEventId: req.params.eventId }]
    });

    const googleEventId = localEvent ? localEvent.googleEventId : req.params.eventId;
    const calendarId = localEvent ? localEvent.googleCalendarId : (connection.primaryCalendarId || 'primary');

    const updatedGoogleEvent = await googleCalendarService.updateEvent(
      connection,
      calendarId,
      googleEventId,
      req.body
    );

    const normalized = googleCalendarService.normalizeGoogleEvent(updatedGoogleEvent, calendarId, req.user._id);

    const updatedDoc = await GoogleCalendarEvent.findOneAndUpdate(
      {
        userId: req.user._id,
        googleCalendarId: calendarId,
        googleEventId
      },
      { $set: normalized },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedDoc || normalized
    });
  } catch (error) {
    console.error('[Google Calendar] Update event error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to update event' });
  }
});

/**
 * @route   DELETE /api/google-calendar/events/:eventId
 * @desc    Delete an event from Google Calendar and Alumnex
 * @access  Private
 */
router.delete('/events/:eventId', protect, [
  param('eventId').notEmpty().withMessage('Event ID is required')
], async (req, res) => {
  if (!checkValidation(req, res)) return;

  try {
    const connection = await GoogleCalendarConnection.findOne({ userId: req.user._id });
    if (!connection || connection.status === 'disconnected') {
      return res.status(400).json({ message: 'Google Calendar is not connected' });
    }

    let localEvent = await GoogleCalendarEvent.findOne({
      userId: req.user._id,
      $or: [{ _id: req.params.eventId.match(/^[0-9a-fA-F]{24}$/) ? req.params.eventId : null }, { googleEventId: req.params.eventId }]
    });

    const googleEventId = localEvent ? localEvent.googleEventId : req.params.eventId;
    const calendarId = localEvent ? localEvent.googleCalendarId : (connection.primaryCalendarId || 'primary');

    await googleCalendarService.deleteEvent(connection, calendarId, googleEventId);
    await GoogleCalendarEvent.deleteOne({
      userId: req.user._id,
      googleCalendarId: calendarId,
      googleEventId
    });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('[Google Calendar] Delete event error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to delete event' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. MANUAL & INCREMENTAL SYNC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   POST /api/google-calendar/sync
 * @desc    Trigger on-demand incremental calendar sync
 * @access  Private
 */
router.post('/sync', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const result = await calendarSyncService.syncUserCalendar(req.user._id, {
      force: true,
      io
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[Google Calendar] Manual sync error:', error.message);
    res.status(500).json({ message: 'Synchronization failed' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. SCHEDULE CONTEXT FOR ACTIVITY HUB & DASHBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/google-calendar/schedule-context
 * @desc    Get today's schedule context, busy intervals & free time windows
 * @access  Private
 */
router.get('/schedule-context', protect, async (req, res) => {
  try {
    const connection = await GoogleCalendarConnection.findOne({ userId: req.user._id });
    const userTimezone = req.query.timezone || connection?.timezone || req.user.timezone || 'Asia/Kolkata';

    const context = await calendarSyncService.getScheduleContext(
      req.user._id,
      userTimezone,
      req.query.date ? new Date(req.query.date) : new Date()
    );

    res.json(context);
  } catch (error) {
    console.error('[Google Calendar] Schedule context error:', error.message);
    res.status(500).json({ message: 'Failed to compute schedule context' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. ALUMNEX ECOSYSTEM EXPORTERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   POST /api/google-calendar/events/from-alumnex
 * @desc    Export an Alumnex Event into the user's Google Calendar
 * @access  Private
 */
router.post('/events/from-alumnex', protect, [
  body('eventId').isMongoId().withMessage('Valid Alumnex Event ID is required'),
  body('createMeet').optional().isBoolean()
], async (req, res) => {
  if (!checkValidation(req, res)) return;

  try {
    const result = await calendarSyncService.addAlumnexEventToCalendar(
      req.user._id,
      req.body.eventId,
      { createMeet: req.body.createMeet }
    );
    res.json(result);
  } catch (error) {
    console.error('[Google Calendar] Export Alumnex event error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to export event to Google Calendar' });
  }
});

/**
 * @route   POST /api/google-calendar/events/from-mentorship
 * @desc    Export an Alumnex Mentorship session into Google Calendar
 * @access  Private
 */
router.post('/events/from-mentorship', protect, [
  body('sessionId').isMongoId().withMessage('Valid Mentorship Session ID is required'),
  body('createMeet').optional().isBoolean()
], async (req, res) => {
  if (!checkValidation(req, res)) return;

  try {
    const result = await calendarSyncService.addMentorshipSessionToCalendar(
      req.user._id,
      req.body.sessionId,
      { createMeet: req.body.createMeet !== false }
    );
    res.json(result);
  } catch (error) {
    console.error('[Google Calendar] Export Mentorship session error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to export mentorship session to Google Calendar' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. PUSH NOTIFICATION WEBHOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   POST /api/google-calendar/webhook
 * @desc    Receives Google Calendar push notification pings
 * @access  Public (Google Webhook)
 */
router.post('/webhook', async (req, res) => {
  // Google webhook pings send state in headers:
  // X-Goog-Channel-ID, X-Goog-Resource-ID, X-Goog-Resource-State, X-Goog-Channel-Token
  const channelId = req.headers['x-goog-channel-id'];
  const resourceId = req.headers['x-goog-resource-id'];
  const resourceState = req.headers['x-goog-resource-state'];
  const channelToken = req.headers['x-goog-channel-token'];

  // Acknowledge receipt to Google immediately with 200 OK
  res.status(200).send('OK');

  if (resourceState === 'sync') {
    // Initial handshake ping
    console.log('[Google Calendar Webhook] Handshake verified for channel:', channelId);
    return;
  }

  if (!channelToken) {
    console.warn('[Google Calendar Webhook] Received webhook without channel token');
    return;
  }

  try {
    const decoded = jwt.verify(channelToken, process.env.JWT_SECRET);
    const { userId, calendarId } = decoded;

    if (userId) {
      const io = req.app.get('io');
      // Trigger incremental delta sync for this user
      calendarSyncService.syncUserCalendar(userId, {
        calendarIds: calendarId ? [calendarId] : undefined,
        io
      }).catch(err => {
        console.error('[Google Calendar Webhook] Async sync error:', err.message);
      });
    }
  } catch (err) {
    console.error('[Google Calendar Webhook] Token verification failed:', err.message);
  }
});

module.exports = router;
