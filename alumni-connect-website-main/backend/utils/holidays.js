const axios = require('axios');

/**
 * Checks if a given date is a public holiday using Nager.Date API.
 * @param {Date|string} date - The date to check.
 * @param {string} countryCode - The ISO 3166-1 alpha-2 country code (default 'IN').
 * @returns {Promise<boolean>} - True if it's a holiday, false otherwise.
 */
const isHoliday = async (date, countryCode = 'IN') => {
  try {
    const checkDate = new Date(date);
    if (isNaN(checkDate.getTime())) return false;
    
    const year = checkDate.getFullYear();
    const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
    
    const dateString = checkDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (response.data && Array.isArray(response.data)) {
      // API returns an array of holiday objects with 'date' property
      return response.data.some(holiday => holiday.date === dateString);
    }
    return false;
  } catch (error) {
    console.error('Error checking holiday:', error.message);
    // Fail open if the API fails
    return false;
  }
};

module.exports = {
  isHoliday
};
