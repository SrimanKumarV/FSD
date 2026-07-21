/**
 * Send an email using Brevo (Sendinblue) HTTPS API
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email HTML content
 */
const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_USER || 'alumnexconnect@gmail.com';
  const senderName = process.env.FROM_NAME || 'Alumnex Connect';

  if (!apiKey) {
    console.warn(`[Mail] BREVO_API_KEY is missing. Would have sent to ${options.email} subject: ${options.subject}`);
  }

  // SMS Forwarding logic
  try {
    const User = require('../models/User');
    const user = await User.findOne({ email: options.email });
    if (user && user.phoneVerified && user.smsNotifications && user.phoneNumber) {
      const shortMsg = `Alumnex Alert: ${options.subject} - ${options.message.replace(/<[^>]*>?/gm, '').substring(0, 50)}...`;
      console.log(`[SMS NOTIFICATION FORWARDING] To: ${user.phoneNumber} | Subj: ${options.subject}`);
      
      const sendSMS = require('./sendSMS');
      await sendSMS(user.phoneNumber, shortMsg);
    }
  } catch(e) {
    console.error('Failed to forward SMS notification', e);
  }
  
  if (!apiKey) return;

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [
      {
        email: options.email
      }
    ],
    subject: options.subject,
    htmlContent: options.message
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error:', data);
    } else {
      console.log(`Email sent successfully via Brevo: ${data.messageId}`);
    }
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
  }
};

module.exports = sendEmail;
