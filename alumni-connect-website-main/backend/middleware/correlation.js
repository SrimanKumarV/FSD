/**
 * Alumnex Connect — Correlation & Request ID Middleware
 * Assigns a unique tracking identifier to every HTTP request.
 * Sets the X-Correlation-ID response header and attaches req.correlationId.
 */

const { generateCorrelationId } = require('../utils/errorClassification');

module.exports = function correlationMiddleware(req, res, next) {
  const incomingId = req.get('x-correlation-id') || req.get('x-request-id');
  const correlationId = incomingId && incomingId.length < 64 ? incomingId : generateCorrelationId('REQ');
  
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};
