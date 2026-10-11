/**
 * Alumnex Connect — Admin Incident & Integration Health Engine
 * 
 * CORE RESPONSIBILITIES:
 * 1. Deduplicates technical failures into unified incident records
 * 2. Escalates severity based on failure frequency / user impact
 * 3. Sanitizes and redacts all secrets before persistence
 * 4. Tracks resolution and automatic recovery
 * 5. Generates high-level Integration Health status for the Admin Panel
 */

const AdminIncident = require('../models/AdminIncident');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { redactSensitiveData } = require('../utils/errorClassification');
const mongoose = require('mongoose');

class IncidentService {
  /**
   * Title generator for structured admin alerts
   */
  getIncidentTitle(classifiedError) {
    const titles = {
      GOOGLE_CALENDAR_API_DISABLED: 'Google Calendar API Disabled in Google Cloud',
      GOOGLE_OAUTH_REDIRECT_MISMATCH: 'Google OAuth Redirect URI Misconfiguration',
      GOOGLE_AUTH_TOKEN_EXPIRED: 'Google OAuth Token Revocation Storm',
      GOOGLE_API_RATE_LIMITED: 'Google Calendar API Rate Limit Throttling',
      GOOGLE_API_TEMPORARY_OUTAGE: 'Google Calendar API Upstream Outage',
      ACTIVITY_PLATFORM_RATE_LIMITED: 'External Activity Platform Rate Limit Exceeded',
      ACTIVITY_PLATFORM_UNAVAILABLE: 'External Activity Platform Endpoint Outage',
      FCM_DELIVERY_FAILURE: 'Firebase Cloud Messaging Push Delivery Failure',
      AI_PROVIDER_UNAVAILABLE: 'AI Inference Provider Upstream Outage',
      DATABASE_TEMPORARILY_UNAVAILABLE: 'MongoDB Operational Health Degradation',
      REDIS_CONNECTION_FAILURE: 'Redis Cache Layer Connection Failure',
      NETWORK_CONNECTION_ISSUE: 'Outbound Network Connectivity Degradation'
    };
    return titles[classifiedError.internalCode] || `${classifiedError.provider.toUpperCase()} Integration Issue (${classifiedError.internalCode})`;
  }

  /**
   * Records or aggregates a technical integration failure into AdminIncident
   * @param {Object} classifiedError Result from classifyError()
   * @param {Object} [context={}] Extra context
   * @returns {Promise<Object>} The active or updated incident
   */
  async recordIncident(classifiedError, context = {}) {
    try {
      // Benign user cancellations or basic client validation do not warrant Admin Incidents
      if (
        classifiedError.category === 'USER_ACTION_REQUIRED' ||
        classifiedError.category === 'VALIDATION_ERROR' ||
        classifiedError.severity === 'info'
      ) {
        return null;
      }

      const {
        internalCode,
        category,
        severity,
        provider,
        operation,
        httpStatus,
        providerErrorCode,
        providerReason,
        retryable,
        requiresAdminAction,
        requiresReauth,
        correlationId,
        adminMessage,
        recommendedAction,
        rawStack
      } = classifiedError;

      const userId = context.userId || context.req?.user?._id;

      // Find an active open/acknowledged/investigating incident for this provider and code
      let incident = await AdminIncident.findOne({
        provider,
        incidentCode: internalCode,
        status: { $in: ['open', 'acknowledged', 'investigating'] }
      });

      const now = new Date();

      if (incident) {
        // ── DEDUPLICATION & OCCURRENCE ACCUMULATION ──
        incident.occurrences += 1;
        incident.lastSeen = now;
        incident.httpStatus = httpStatus || incident.httpStatus;

        if (userId && !incident.affectedUsers.some(id => id.toString() === userId.toString())) {
          incident.affectedUsers.push(userId);
          incident.affectedUserCount = incident.affectedUsers.length;
        }

        if (correlationId && !incident.correlationIds.includes(correlationId)) {
          incident.correlationIds.unshift(correlationId);
          if (incident.correlationIds.length > 20) {
            incident.correlationIds = incident.correlationIds.slice(0, 20);
          }
        }

        // Threshold-based auto-escalation:
        // 5 failures -> MEDIUM; 20 failures -> HIGH; 50 failures -> CRITICAL
        if (incident.occurrences >= 50 && incident.severity !== 'critical') {
          incident.severity = 'critical';
        } else if (incident.occurrences >= 20 && (incident.severity === 'low' || incident.severity === 'medium')) {
          incident.severity = 'high';
        }

        await incident.save();
        return incident;
      }

      // ── CREATE NEW INCIDENT RECORD ──
      const technicalDetails = redactSensitiveData({
        stack: rawStack ? rawStack.split('\n').slice(0, 8).join('\n') : null,
        environment: process.env.NODE_ENV || 'production',
        service: 'alumnex-backend',
        host: context.req?.get('host') || 'unknown',
        userAgent: context.req?.get('user-agent') || 'unknown',
        endpoint: context.req?.originalUrl || null,
        method: context.req?.method || null,
        extra: context.extra || null
      });

      const title = this.getIncidentTitle(classifiedError);

      incident = await AdminIncident.create({
        incidentCode: internalCode,
        category,
        severity,
        status: 'open',
        provider,
        operation,
        title,
        adminMessage: redactSensitiveData(adminMessage),
        recommendedAction,
        httpStatus,
        providerErrorCode,
        providerReason,
        retryable,
        requiresAdminAction,
        requiresReauth,
        firstSeen: now,
        lastSeen: now,
        occurrences: 1,
        affectedUsers: userId ? [userId] : [],
        affectedUserCount: userId ? 1 : 0,
        correlationIds: correlationId ? [correlationId] : [],
        technicalDetails
      });

      // Notify platform administrators for HIGH and CRITICAL incidents
      if (severity === 'high' || severity === 'critical') {
        this.notifyAdmins(incident).catch(err => {
          console.warn('[IncidentService] Admin alert dispatch warning:', err.message);
        });
      }

      return incident;
    } catch (err) {
      console.error('[IncidentService] Failed to record admin incident:', err.message);
      return null;
    }
  }

  /**
   * Automatically marks an active incident as resolved when health returns
   * @param {string} provider
   * @param {string} incidentCode
   * @param {Object} [recoveryDetails={}]
   */
  async recordRecovery(provider, incidentCode, recoveryDetails = {}) {
    try {
      const activeIncidents = await AdminIncident.find({
        provider,
        incidentCode,
        status: { $in: ['open', 'acknowledged', 'investigating'] }
      });

      const now = new Date();

      for (const inc of activeIncidents) {
        const durationMinutes = Math.round((now - new Date(inc.firstSeen)) / (1000 * 60));
        inc.status = 'resolved';
        inc.resolvedAt = now;
        inc.resolvedAutomatically = true;
        inc.durationMinutes = durationMinutes;
        inc.resolutionNotes = recoveryDetails.note || `Integration recovered automatically. Successful operations verified after ${inc.occurrences} failures.`;
        await inc.save();

        console.log(`[IncidentService] Incident resolved automatically: ${inc.title} (Duration: ${durationMinutes} min, Occurrences: ${inc.occurrences})`);
      }
    } catch (err) {
      console.warn('[IncidentService] Recovery recording error:', err.message);
    }
  }

  /**
   * Broadcasts structured notification to all active administrators
   * @param {Object} incident
   */
  async notifyAdmins(incident) {
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (!admins || admins.length === 0) return;

      const notifications = admins.map(adm => ({
        user: adm._id,
        title: `🚨 Admin Alert: ${incident.title}`,
        message: `Severity: ${incident.severity.toUpperCase()} | Provider: ${incident.provider} | Operation: ${incident.operation}. ${incident.recommendedAction}`,
        type: 'admin_alert',
        data: {
          incidentId: incident._id,
          incidentCode: incident.incidentCode,
          severity: incident.severity
        }
      }));

      await Notification.insertMany(notifications);
    } catch (e) {
      console.warn('[IncidentService] Admin notification warning:', e.message);
    }
  }

  /**
   * Produces a comprehensive System Health Overview for Admin Dashboard
   * Evaluates: Google Calendar, Firebase FCM, Web Push, Email, Redis, MongoDB, External Activity, AI
   * Status levels: 'healthy' | 'degraded' | 'failing' | 'configuration_error'
   */
  async getIntegrationHealth() {
    const activeIncidents = await AdminIncident.find({
      status: { $in: ['open', 'acknowledged', 'investigating'] }
    }).sort({ severity: -1, lastSeen: -1 });

    const getProviderStatus = (providerName) => {
      const providerIncidents = activeIncidents.filter(i => i.provider === providerName);
      if (providerIncidents.length === 0) return { status: 'healthy', issues: [] };

      const hasConfigFailure = providerIncidents.some(i => i.category === 'CONFIGURATION_FAILURE');
      const hasCritical = providerIncidents.some(i => i.severity === 'critical');
      const hasHigh = providerIncidents.some(i => i.severity === 'high');

      let status = 'degraded';
      if (hasConfigFailure) status = 'configuration_error';
      else if (hasCritical || hasHigh) status = 'failing';

      return {
        status,
        issues: providerIncidents.map(i => ({
          id: i._id,
          code: i.incidentCode,
          title: i.title,
          severity: i.severity,
          occurrences: i.occurrences,
          affectedUserCount: i.affectedUserCount,
          lastSeen: i.lastSeen,
          recommendedAction: i.recommendedAction
        }))
      };
    };

    // Google Calendar Credentials Validation Check
    const calClientId = (process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').trim();
    const calClientSecret = (process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '').trim();
    const calConfigured = Boolean(calClientId && calClientSecret);

    // MongoDB connection check
    const mongoState = mongoose.connection.readyState; // 1 = connected
    const mongoHealthy = mongoState === 1;

    // Cache / Redis check
    const cacheHealthy = Boolean(global.redisClient?.isReady !== false);

    // Build integration metrics map
    const health = {
      systemOverall: activeIncidents.some(i => i.severity === 'critical') ? 'critical' : activeIncidents.some(i => i.severity === 'high') ? 'degraded' : 'healthy',
      activeIncidentCount: activeIncidents.length,
      integrations: {
        googleCalendar: {
          name: 'Google Calendar Integration',
          provider: 'google-calendar',
          configured: calConfigured,
          ...getProviderStatus('google-calendar')
        },
        firebaseFcm: {
          name: 'Firebase Cloud Messaging (FCM)',
          provider: 'firebase-fcm',
          configured: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_SERVICE_ACCOUNT),
          ...getProviderStatus('firebase-fcm')
        },
        webPush: {
          name: 'Web Push Notifications',
          provider: 'web-push',
          configured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
          ...getProviderStatus('web-push')
        },
        email: {
          name: 'Email Delivery (SMTP/SendGrid)',
          provider: 'email',
          configured: Boolean(process.env.EMAIL_HOST || process.env.SENDGRID_API_KEY),
          ...getProviderStatus('email')
        },
        mongoDb: {
          name: 'MongoDB Database Cluster',
          provider: 'mongodb',
          configured: true,
          status: mongoHealthy ? 'healthy' : 'failing',
          issues: mongoHealthy ? [] : [{ title: 'MongoDB connection state not connected' }]
        },
        redis: {
          name: 'Redis Cache Layer',
          provider: 'redis',
          configured: Boolean(process.env.REDIS_URL),
          status: cacheHealthy ? 'healthy' : 'degraded',
          issues: []
        },
        externalActivity: {
          name: 'External Activity Hub (GitHub, LeetCode, Duolingo)',
          provider: 'activity-hub',
          configured: true,
          ...getProviderStatus('activity-hub')
        },
        aiProviders: {
          name: 'AI Providers (Groq, Gemini, OpenRouter)',
          provider: 'ai-service',
          configured: Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY),
          ...getProviderStatus('ai-service')
        }
      }
    };

    return health;
  }

  /**
   * Filter and query incidents with pagination
   */
  async listIncidents(query = {}) {
    const {
      severity,
      provider,
      status,
      incidentCode,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = query;

    const filter = {};
    if (severity) filter.severity = severity;
    if (provider) filter.provider = provider;
    if (status) filter.status = status;
    if (incidentCode) filter.incidentCode = incidentCode;
    if (startDate || endDate) {
      filter.lastSeen = {};
      if (startDate) filter.lastSeen.$gte = new Date(startDate);
      if (endDate) filter.lastSeen.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [incidents, total] = await Promise.all([
      AdminIncident.find(filter)
        .sort({ lastSeen: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('affectedUsers', 'name email role')
        .populate('resolvedBy', 'name email'),
      AdminIncident.countDocuments(filter)
    ]);

    return {
      incidents,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    };
  }

  /**
   * Updates incident status and logs admin action note
   */
  async updateIncidentStatus(incidentId, newStatus, { adminUser, note, resolutionNotes }) {
    const incident = await AdminIncident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    incident.status = newStatus;

    if (note) {
      incident.notes.push({
        admin: adminUser?._id,
        adminName: adminUser?.name || 'Administrator',
        text: note,
        createdAt: new Date()
      });
    }

    if (newStatus === 'resolved') {
      incident.resolvedAt = new Date();
      incident.resolvedBy = adminUser?._id;
      if (resolutionNotes) incident.resolutionNotes = resolutionNotes;
      incident.durationMinutes = Math.round((new Date() - new Date(incident.firstSeen)) / (1000 * 60));
    }

    await incident.save();
    return incident;
  }
}

module.exports = new IncidentService();
