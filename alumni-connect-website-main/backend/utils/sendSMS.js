const axios = require('axios');

/**
 * Send SMS using Fast2SMS API (Free for Indian Numbers with trial credits)
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The message to send
 */
const sendSMS = async (phoneNumber, message) => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  if (!apiKey) {
    console.warn(`[SMS] FAST2SMS_API_KEY is missing. Cannot send SMS to ${phoneNumber}`);
    return false;
  }

  try {
    // Extract just the 10 digit number for Indian numbers (Fast2SMS requirement)
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    const targetNumber = cleanNumber.length > 10 ? cleanNumber.slice(-10) : cleanNumber;

    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'v3',
      sender_id: 'TXTIND',
      message: message,
      language: 'english',
      flash: 0,
      numbers: targetNumber
    }, {
      headers: {
        authorization: apiKey
      }
    });

    if (response.data.return === true) {
      console.log(`SMS sent successfully to ${targetNumber}`);
      return true;
    } else {
      console.error('Fast2SMS Error:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS via Fast2SMS:', error.response?.data || error.message);
    return false;
  }
};

module.exports = sendSMS;
