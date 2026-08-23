const axios = require('axios');

/**
 * Checks if the given text contains profanity using the PurgoMalum API.
 * @param {string} text - The text to check.
 * @returns {Promise<boolean>} - True if profanity is detected, false otherwise.
 */
const containsProfanity = async (text) => {
  if (!text) return false;
  try {
    const response = await axios.get(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
    // API returns 'true' or 'false' as a string or boolean
    return response.data === true || response.data === 'true';
  } catch (error) {
    console.error('Error checking profanity:', error.message);
    // Fail open if the API fails, to not block user actions
    return false;
  }
};

module.exports = {
  containsProfanity
};
