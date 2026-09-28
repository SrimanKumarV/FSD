const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const GoogleCalendarConnection = require('../models/GoogleCalendarConnection');

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

class GoogleCalendarService {
  /**
   * Returns a configured OAuth2Client instance
   * @param {string} [redirectUri]
   * @returns {OAuth2Client}
   */
  getOAuthClient(redirectUri) {
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
    const activeRedirectUri = (redirectUri || process.env.GOOGLE_CALENDAR_REDIRECT_URI || '').trim();

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are not configured');
    }

    return new OAuth2Client(clientId, clientSecret, activeRedirectUri);
  }

  /**
   * Generates a secure authorization URL with CSRF protection token
   * @param {Object} options
   * @param {string} options.userId
   * @param {string} [options.mode] 'web' | 'mobile'
   * @param {string} [options.redirectUri]
   * @returns {{ url: string, state: string }}
   */
  generateAuthorizationUrl({ userId, mode = 'web', redirectUri }) {
    const client = this.getOAuthClient(redirectUri);

    const nonce = crypto.randomBytes(24).toString('hex');
    const stateToken = jwt.sign(
      {
        userId: userId.toString(),
        mode,
        nonce,
        type: 'google_calendar_oauth',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Ensures refresh token is provided on authorization
      include_granted_scopes: true,
      scope: CALENDAR_SCOPES,
      state: stateToken
    });

    return { url, state: stateToken };
  }

  /**
   * Exchanges authorization code for tokens and extracts Google profile info
   * @param {string} code
   * @param {string} [redirectUri]
   * @returns {Promise<{ tokens: Object, profile: Object }>}
   */
  async exchangeAuthorizationCode(code, redirectUri) {
    const client = this.getOAuthClient(redirectUri);
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Fetch user profile info to capture account email and Google sub
    const userInfoRes = await client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });
    const profile = userInfoRes.data || {};

    return { tokens, profile };
  }

  /**
   * Retrieves connection from database
   * @param {string} userId
   * @param {boolean} [includeTokens=false]
   * @returns {Promise<GoogleCalendarConnection|null>}
   */
  async getConnection(userId, includeTokens = false) {
    let query = GoogleCalendarConnection.findOne({ userId });
    if (includeTokens) {
      query = query.select('+accessToken +refreshToken');
    }
    return query;
  }

  /**
   * Instantiates an authorized OAuth2Client for an existing connection.
   * Refreshes access token automatically if expired.
   * @param {GoogleCalendarConnection} connection
   * @returns {Promise<OAuth2Client>}
   */
  async getAuthorizedClient(connection) {
    // Ensure tokens are loaded
    let conn = connection;
    if (!conn.accessToken || !conn.refreshToken) {
      conn = await GoogleCalendarConnection.findById(connection._id).select('+accessToken +refreshToken');
      if (!conn) throw new Error('Connection not found');
    }

    const { accessToken, refreshToken } = conn.getDecryptedTokens();
    if (!refreshToken && !accessToken) {
      conn.status = 'reauthorization_required';
      await conn.save();
      throw new Error('No valid tokens found for Google Calendar connection');
    }

    const client = this.getOAuthClient();
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: conn.tokenExpiry ? new Date(conn.tokenExpiry).getTime() : undefined
    });

    // Check if token is expired or expiring within 2 minutes
    const now = Date.now();
    const expiry = conn.tokenExpiry ? new Date(conn.tokenExpiry).getTime() : 0;
    if (expiry && expiry - now < 120000 && refreshToken) {
      try {
        const { credentials } = await client.refreshAccessToken();
        conn.accessToken = credentials.access_token;
        if (credentials.expiry_date) {
          conn.tokenExpiry = new Date(credentials.expiry_date);
        }
        await conn.save();
        client.setCredentials(credentials);
      } catch (refreshErr) {
        await this.handleGoogleApiError(refreshErr, conn);
        throw refreshErr;
      }
    }

    return client;
  }

  /**
   * Lists the user's available Google Calendars
   * @param {GoogleCalendarConnection} connection
   * @returns {Promise<Array<Object>>}
   */
  async getCalendars(connection) {
    const client = await this.getAuthorizedClient(connection);
    try {
      const res = await client.request({
        url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        params: { minAccessRole: 'reader' }
      });
      const items = res.data?.items || [];
      return items.map(c => ({
        id: c.id,
        summary: c.summary,
        description: c.description || '',
        primary: Boolean(c.primary),
        timeZone: c.timeZone || 'UTC',
        backgroundColor: c.backgroundColor || '#0284c7',
        accessRole: c.accessRole
      }));
    } catch (err) {
      await this.handleGoogleApiError(err, connection);
      throw err;
    }
  }

  /**
   * Retrieves the user's primary calendar details
   * @param {GoogleCalendarConnection} connection
   * @returns {Promise<Object>}
   */
  async getPrimaryCalendar(connection) {
    const client = await this.getAuthorizedClient(connection);
    try {
      const res = await client.request({
        url: 'https://www.googleapis.com/calendar/v3/calendars/primary'
      });
      return res.data;
    } catch (err) {
      await this.handleGoogleApiError(err, connection);
      throw err;
    }
  }

  /**
   * Queries events from Google Calendar API
   * @param {GoogleCalendarConnection} connection
   * @param {Object} options
   * @returns {Promise<{ items: Array, nextSyncToken?: string, nextPageToken?: string }>}
   */
  async getEvents(connection, options = {}) {
    const client = await this.getAuthorizedClient(connection);
    const {
      calendarId = 'primary',
      timeMin,
      timeMax,
      syncToken,
      pageToken,
      maxResults = 250
    } = options;

    const params = {
      maxResults,
      singleEvents: true, // Expands recurring events into instances
      showDeleted: true
    };

    if (syncToken) {
      params.syncToken = syncToken;
    } else {
      if (timeMin) params.timeMin = new Date(timeMin).toISOString();
      if (timeMax) params.timeMax = new Date(timeMax).toISOString();
      params.orderBy = 'startTime';
    }

    if (pageToken) params.pageToken = pageToken;

    try {
      const res = await client.request({
        url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        params
      });
      return {
        items: res.data?.items || [],
        nextSyncToken: res.data?.nextSyncToken,
        nextPageToken: res.data?.nextPageToken,
        timeZone: res.data?.timeZone
      };
    } catch (err) {
      // 410 Gone: syncToken has expired or is invalidated -> full resync needed
      if (err.response?.status === 410) {
        console.warn(`[GoogleCalendarService] Sync token expired for calendar ${calendarId}. Resetting sync token.`);
        if (connection.syncTokens) {
          connection.syncTokens.delete(calendarId);
          await connection.save();
        }
        // Retry without syncToken
        return this.getEvents(connection, { ...options, syncToken: undefined });
      }
      await this.handleGoogleApiError(err, connection);
      throw err;
    }
  }

  /**
   * Fetches a single event by Google event ID
   * @param {GoogleCalendarConnection} connection
   * @param {string} calendarId
   * @param {string} eventId
   * @returns {Promise<Object>}
   */
  async getEvent(connection, calendarId = 'primary', eventId) {
    const client = await this.getAuthorizedClient(connection);
    try {
      const res = await client.request({
        url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
      });
      return res.data;
    } catch (err) {
      await this.handleGoogleApiError(err, connection);
      throw err;
    }
  }

  /**
   * Creates an event in Google Calendar with optional Google Meet conference
   * @param {GoogleCalendarConnection} connection
   * @param {string} calendarId
   * @param {Object} eventData
   * @param {Object} [options]
   * @param {boolean} [options.createMeet=false]
   * @returns {Promise<Object>}
   */
  async createEvent(connection, calendarId = 'primary', eventData, options = {}) {
    const client = await this.getAuthorizedClient(connection);
    const payload = {
      summary: eventData.summary,
      description: eventData.description || '',
      location: eventData.location || '',
      start: eventData.allDay
        ? { date: eventData.startDateStr || new Date(eventData.start).toISOString().split('T')[0] }
        : { dateTime: new Date(eventData.start).toISOString(), timeZone: eventData.timezone || connection.timezone || 'UTC' },
      end: eventData.allDay
        ? { date: eventData.endDateStr || new Date(eventData.end).toISOString().split('T')[0] }
        : { dateTime: new Date(eventData.end).toISOString(), timeZone: eventData.timezone || connection.timezone || 'UTC' },
      attendees: (eventData.attendees || []).map(a => ({
        email: typeof a === 'string' ? a : a.email,
        displayName: typeof a === 'object' ? a.displayName : undefined
      })),
      reminders: eventData.reminders
        ? { useDefault: false, overrides: eventData.reminders }
        : { useDefault: true }
    };

    if (options.createMeet) {
      payload.conferenceData = {
        createRequest: {
          requestId: `alumnex-meet-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      };
    }

    try {
      const res = await client.request({
        url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        method: 'POST',
        params: options.createMeet ? { conferenceDataVersion: 1 } : {},
        data: payload
      });
      return res.data;
    } catch (err) {
      await this.handleGoogleApiError(err, connection);
      throw err;
    }
  }

  /**
   * Updates an existing Google Calendar event
   * @param {GoogleCalendarConnection} connection
   * @param {string} calendarId
   * @param {string} eventId
   * @param {Object} eventData
   * @returns {Promise<Object>}
   */
  async updateEvent(connection, calendarId = 'primary', eventId, eventData) {
    const client = await this.getAuthorizedClient(connection);
    const payload = {};

    if (eventData.summary !== undefined) payload.summary = eventData.summary;
    if (eventData.description !== undefined) payload.description = eventData.description;
    if (eventData.location !== undefined) payload.location = eventData.location;

    if (eventData.start) {
      payload.start = eventData.allDay
        ? { date: eventData.startDateStr || new Date(eventData.start).toISOString().split('T')[0] }
        : { dateTime: new Date(eventData.start).toISOString(), timeZone: eventData.timezone || connection.timezone || 'UTC' };
    }

    if (eventData.end) {
      payload.end = eventData.allDay
        ? { date: eventData.endDateStr || new Date(eventData.end).toISOString().split('T')[0] }
        : { dateTime: new Date(eventData.end).toISOString(), timeZone: eventData.timezone || connection.timezone || 'UTC' };
    }

    if (eventData.attendees) {
      payload.attendees = eventData.attendees.map(a => ({
        email: typeof a === 'string' ? a : a.email,
        displayName: typeof a === 'object' ? a.displayName : undefined
      }));
    }

    try {
      const res = await client.request({
        url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        method: 'PATCH',
        data: payload
      });
      return res.data;
    } catch (err) {
      await this.handleGoogleApiError(err, connection);
      throw err;
    }
  }

  /**
   * Deletes an event from Google Calendar
   * @param {GoogleCalendarConnection} connection
   * @param {string} calendarId
   * @param {string} eventId
   * @returns {Promise<boolean>}
   */
  async deleteEvent(connection, calendarId = 'primary', eventId) {
    const client = await this.getAuthorizedClient(connection);
    try {
      await client.request({
        url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        method: 'DELETE'
      });
      return true;
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 410) {
        return true; // Already deleted
      }
      await this.handleGoogleApiError(err, connection);
      throw err;
    }
  }

  /**
   * Registers a Google Calendar push watch notification channel
   * @param {GoogleCalendarConnection} connection
   * @param {string} [calendarId='primary']
   * @param {string} webhookUrl
   * @returns {Promise<Object>}
   */
  async createWatchChannel(connection, calendarId = 'primary', webhookUrl) {
    if (!webhookUrl || !webhookUrl.startsWith('https://')) {
      console.warn('[GoogleCalendarService] Push notifications require an HTTPS webhook URL. Skipping watch creation in local non-https dev.');
      return null;
    }

    const client = await this.getAuthorizedClient(connection);
    const channelId = `alumnex-ch-${connection.userId}-${Date.now()}`;
    const token = jwt.sign(
      { userId: connection.userId.toString(), calendarId, channelId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    try {
      const res = await client.request({
        url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
        method: 'POST',
        data: {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          token: token,
          params: {
            ttl: '604800' // 7 days in seconds
          }
        }
      });

      const { resourceId, expiration } = res.data;
      const channelRecord = {
        channelId,
        resourceId,
        expiration: new Date(parseInt(expiration, 10) || Date.now() + 7 * 24 * 60 * 60 * 1000),
        calendarId,
        createdAt: new Date()
      };

      // Filter out older channels for this calendar
      connection.watchChannels = (connection.watchChannels || []).filter(ch => ch.calendarId !== calendarId);
      connection.watchChannels.push(channelRecord);
      connection.pushNotificationsEnabled = true;
      await connection.save();

      return channelRecord;
    } catch (err) {
      console.error('[GoogleCalendarService] Failed to establish watch channel:', err.response?.data || err.message);
      return null;
    }
  }

  /**
   * Stops a Google Calendar push watch notification channel
   * @param {GoogleCalendarConnection} connection
   * @param {string} channelId
   * @param {string} resourceId
   * @returns {Promise<boolean>}
   */
  async stopWatchChannel(connection, channelId, resourceId) {
    const client = await this.getAuthorizedClient(connection);
    try {
      await client.request({
        url: 'https://www.googleapis.com/calendar/v3/channels/stop',
        method: 'POST',
        data: {
          id: channelId,
          resourceId: resourceId
        }
      });

      connection.watchChannels = (connection.watchChannels || []).filter(c => c.channelId !== channelId);
      await connection.save();
      return true;
    } catch (err) {
      console.warn('[GoogleCalendarService] Failed to stop watch channel:', err.message);
      return false;
    }
  }

  /**
   * Renews or re-establishes expiring watch channels
   * @param {GoogleCalendarConnection} connection
   * @param {string} webhookUrl
   */
  async refreshWatchChannel(connection, webhookUrl) {
    const channels = connection.watchChannels || [];
    const now = Date.now();
    for (const ch of channels) {
      const exp = new Date(ch.expiration).getTime();
      // If expiring within 24 hours, recreate
      if (exp - now < 24 * 60 * 60 * 1000) {
        await this.stopWatchChannel(connection, ch.channelId, ch.resourceId).catch(() => {});
        await this.createWatchChannel(connection, ch.calendarId, webhookUrl);
      }
    }
  }

  /**
   * Revokes the connection and OAuth token on Google's servers, then cleans up connection record
   * @param {GoogleCalendarConnection} connection
   */
  async revokeConnection(connection) {
    try {
      const connWithTokens = await GoogleCalendarConnection.findById(connection._id).select('+accessToken +refreshToken');
      if (connWithTokens) {
        const { refreshToken, accessToken } = connWithTokens.getDecryptedTokens();
        const client = this.getOAuthClient();
        const tokenToRevoke = refreshToken || accessToken;
        if (tokenToRevoke) {
          await client.revokeToken(tokenToRevoke).catch(err => {
            console.warn('[GoogleCalendarService] Revocation ping warning:', err.message);
          });
        }
      }
    } catch (e) {
      console.warn('[GoogleCalendarService] Revoke error:', e.message);
    }

    // Stop active watch channels
    for (const ch of (connection.watchChannels || [])) {
      await this.stopWatchChannel(connection, ch.channelId, ch.resourceId).catch(() => {});
    }

    connection.status = 'disconnected';
    connection.accessToken = null;
    connection.refreshToken = null;
    connection.syncEnabled = false;
    connection.pushNotificationsEnabled = false;
    connection.watchChannels = [];
    await connection.save();
  }

  /**
   * Handles Google API errors, marks connection as reauthorization_required if revoked/invalid_grant
   * @param {Error} error
   * @param {GoogleCalendarConnection} connection
   */
  async handleGoogleApiError(error, connection) {
    const status = error.response?.status;
    const errorData = error.response?.data?.error;
    const errorCode = typeof errorData === 'object' ? errorData.message || errorData.status : error.message;

    console.error(`[GoogleCalendarService] API Error (${status}):`, errorCode);

    if (status === 401 || errorCode === 'invalid_grant' || errorCode === 'Token has been expired or revoked.') {
      if (connection) {
        connection.status = 'reauthorization_required';
        connection.lastError = {
          message: 'Google authorization has expired or was revoked. Please reconnect your account.',
          code: 'reauthorization_required',
          timestamp: new Date()
        };
        await connection.save().catch(() => {});
      }
    } else if (connection) {
      connection.lastError = {
        message: errorCode || 'Google Calendar API error',
        code: String(status || 'unknown'),
        timestamp: new Date()
      };
      await connection.save().catch(() => {});
    }
  }

  /**
   * Normalizes a Google Calendar API event item into Alumnex's internal schema
   * @param {Object} item
   * @param {string} calendarId
   * @param {string} userId
   * @returns {Object}
   */
  normalizeGoogleEvent(item, calendarId, userId) {
    const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
    const start = isAllDay
      ? new Date(item.start.date + 'T00:00:00Z')
      : new Date(item.start?.dateTime || item.start?.date);
    const end = isAllDay
      ? new Date(item.end.date + 'T23:59:59Z')
      : new Date(item.end?.dateTime || item.end?.date || start);

    let meetUrl = null;
    if (item.conferenceData?.entryPoints) {
      const videoEntry = item.conferenceData.entryPoints.find(ep => ep.entryPointType === 'video');
      if (videoEntry?.uri) meetUrl = videoEntry.uri;
    }
    if (!meetUrl && item.hangoutLink) {
      meetUrl = item.hangoutLink;
    }

    return {
      userId,
      googleEventId: item.id,
      googleCalendarId: calendarId,
      summary: item.summary || '(No title)',
      description: item.description || '',
      start,
      end,
      timezone: item.start?.timeZone || 'UTC',
      allDay: isAllDay,
      location: item.location || '',
      status: item.status === 'cancelled' ? 'cancelled' : item.status === 'tentative' ? 'tentative' : 'confirmed',
      eventType: 'google',
      recurrence: item.recurrence || [],
      recurringEventId: item.recurringEventId,
      attendees: (item.attendees || []).map(a => ({
        email: a.email,
        displayName: a.displayName || '',
        responseStatus: a.responseStatus || 'unknown',
        self: Boolean(a.self)
      })),
      reminders: (item.reminders?.overrides || []).map(r => ({
        method: r.method,
        minutes: r.minutes
      })),
      conferenceData: {
        conferenceId: item.conferenceData?.conferenceId || null,
        entryPoints: item.conferenceData?.entryPoints || [],
        meetUrl
      },
      htmlLink: item.htmlLink,
      etag: item.etag,
      source: 'google',
      lastSyncedAt: new Date()
    };
  }
}

module.exports = new GoogleCalendarService();
