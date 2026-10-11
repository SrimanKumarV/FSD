/**
 * Alumnex Connect — Global User-Safe Error Handler & Response Sanitizer
 * 
 * CORE CONTRACT:
 * 1. NEVER returns raw stack traces, Mongo error codes, Google Cloud project IDs,
 *    Axios errors, or secrets to ordinary users.
 * 2. Normal users receive calm, reassuring, actionable UX messages.
 * 3. Structured technical diagnostics are recorded into AdminIncident and system logs.
 */

const { classifyError, toUserSafeResponse, redactSensitiveData } = require('../utils/errorClassification');
const incidentService = require('../services/incidentService');

/**
 * Controller helper to classify, record, and return user-safe errors synchronously
 * @param {Object} res Express response object
 * @param {Error|Object|string} err Raw error
 * @param {Object} [context={}] Extra context
 */
function sendUserSafeError(res, err, context = {}) {
  const req = context.req || res.req;
  const classified = classifyError(err, { ...context, req, userId: req?.user?._id });

  // Record into Admin Incident log if this is a systemic/infrastructure or severe failure
  if (
    classified.severity === 'high' ||
    classified.severity === 'critical' ||
    classified.category === 'CONFIGURATION_FAILURE' ||
    classified.category === 'THIRD_PARTY_FAILURE'
  ) {
    incidentService.recordIncident(classified, { ...context, req, userId: req?.user?._id }).catch(e => {
      console.warn('[ErrorHandler] Incident record warning:', e.message);
    });
  }

  // Safe server-side diagnostic logging (redacts sensitive tokens & passwords)
  const logDiagnostic = {
    correlationId: classified.correlationId,
    internalCode: classified.internalCode,
    category: classified.category,
    severity: classified.severity,
    provider: classified.provider,
    operation: classified.operation,
    httpStatus: classified.httpStatus,
    adminMessage: classified.adminMessage,
    userId: req?.user?._id || 'unauthenticated',
    endpoint: req?.originalUrl || 'unknown'
  };
  console.error('[DIAGNOSTIC]', JSON.stringify(redactSensitiveData(logDiagnostic)));

  const safePayload = toUserSafeResponse(classified);
  return res.status(classified.httpStatus).json(safePayload);
}

/**
 * Global Express Error Handling Middleware (catches next(err) and unhandled errors)
 */
function globalErrorHandler(err, req, res, next) {
  // If headers were already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const classified = classifyError(err, { req, userId: req.user?._id });

  // Record incident asynchronously
  if (
    classified.severity === 'high' ||
    classified.severity === 'critical' ||
    classified.category === 'CONFIGURATION_FAILURE' ||
    classified.category === 'THIRD_PARTY_FAILURE'
  ) {
    incidentService.recordIncident(classified, { req, userId: req.user?._id }).catch(() => {});
  }

  // Log redacted diagnostic to local log
  try {
    const fs = require('fs');
    const logLine = `[${new Date().toISOString()}] [${classified.correlationId}] [${classified.internalCode}] ${classified.adminMessage}\n${err.stack || ''}\n`;
    fs.appendFile('error.log', redactSensitiveData(logLine), () => {});
  } catch (fsErr) { }

  console.error(`[SYSTEM_ERROR] [${classified.correlationId}] ${classified.internalCode}: ${classified.adminMessage}`);

  const safePayload = toUserSafeResponse(classified);
  res.status(classified.httpStatus).json(safePayload);
}

module.exports = {
  globalErrorHandler,
  sendUserSafeError
};
