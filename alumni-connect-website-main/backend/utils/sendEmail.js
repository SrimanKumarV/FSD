const nodemailer = require('nodemailer');

/**
 * Send an email using Brevo (SMTP Relay or HTTPS API) or Nodemailer fallback
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email HTML content
 * @returns {Promise<{success: boolean, messageId?: string, method?: string}>}
 */
const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;
  const smtpKey = process.env.BREVO_SMTP_KEY || (apiKey && apiKey.startsWith('xsmtpsib-') ? apiKey : null);
  const senderEmail = process.env.EMAIL_USER || 'alumnexconnect@gmail.com';
  const senderName = process.env.FROM_NAME || 'Alumnex Connect';

  // SMS Forwarding logic (safe check - only run if mongoose is connected)
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      const user = await User.findOne({ email: options.email });
      if (user && user.phoneVerified && user.smsNotifications && user.phoneNumber) {
        const cleanText = options.message.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        const shortMsg = `Alumnex: ${options.subject} - ${cleanText.substring(0, 140)}`;
        console.log(`[SMS NOTIFICATION FORWARDING] To: ${user.phoneNumber} | Subj: ${options.subject}`);
        const sendSMS = require('./sendSMS');
        await sendSMS(user.phoneNumber, shortMsg).catch(err => console.error('SMS send error:', err));
      }
    }
  } catch (e) {
    console.error('Failed to forward SMS notification:', e.message);
  }

  // 1. Try Brevo SMTP Relay (keeps Brevo SMTP key active directly on port 587)
  if (smtpKey) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // TLS
        auth: {
          user: senderEmail,
          pass: smtpKey
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: options.email,
        subject: options.subject,
        html: options.message
      });

      console.log(`[Mail] Sent via Brevo SMTP Relay: ${info.messageId}`);
      return { success: true, messageId: info.messageId, method: 'brevo-smtp' };
    } catch (smtpErr) {
      console.warn('[Mail] Brevo SMTP Relay failed, falling back to API:', smtpErr.message);
    }
  }

  // 2. Try Brevo HTTPS API (v3/smtp/email)
  if (apiKey) {
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
        console.error('[Mail] Brevo API Error:', data);
        throw new Error(data.message || 'Brevo API returned error status');
      } else {
        console.log(`[Mail] Sent via Brevo API: ${data.messageId}`);
        return { success: true, messageId: data.messageId, method: 'brevo-api' };
      }
    } catch (apiErr) {
      console.warn('[Mail] Brevo API send failed:', apiErr.message);
    }
  }

  // 3. Fallback to Nodemailer with standard host (e.g. Gmail SMTP)
  if (process.env.EMAIL_HOST && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message
      });

      console.log(`[Mail] Sent via fallback SMTP (${process.env.EMAIL_HOST}): ${info.messageId}`);
      return { success: true, messageId: info.messageId, method: 'fallback-smtp' };
    } catch (fallbackErr) {
      console.error('[Mail] Fallback SMTP failed:', fallbackErr.message);
      throw fallbackErr;
    }
  }

  console.warn(`[Mail] No mail provider succeeded. Email to ${options.email} not sent.`);
  return { success: false, error: 'No active email provider configured' };
};

module.exports = sendEmail;
