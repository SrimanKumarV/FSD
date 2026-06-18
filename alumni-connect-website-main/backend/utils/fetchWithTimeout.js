/**
 * Utility to wrap fetch with an AbortController timeout.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options (method, headers, etc.).
 * @param {number} timeout - Timeout in milliseconds (default: 5000ms).
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

module.exports = fetchWithTimeout;
