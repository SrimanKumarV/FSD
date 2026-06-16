const nodemailer = require('nodemailer');

/**
 * Send an email using configured SMTP settings
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email HTML content
 */
const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME || 'Alumnex Connect'} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  // Skip sending if credentials are not fully configured to prevent crashing in development
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(`[Mail] Would have sent to ${options.email} subject: ${options.subject}`);
    return;
  }

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
