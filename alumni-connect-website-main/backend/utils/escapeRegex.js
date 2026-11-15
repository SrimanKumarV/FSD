/**
 * Escapes special regular expression characters from user-controlled input
 * and truncates to 100 characters to prevent NoSQL regex injection and ReDoS.
 */
module.exports = function escapeRegex(str = '') {
  return String(str).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
