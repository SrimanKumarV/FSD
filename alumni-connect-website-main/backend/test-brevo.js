require('dotenv').config({ path: './.env' });
const sendEmail = require('./utils/sendEmail');

async function test() {
  console.log('Testing Brevo Email API...');
  
  await sendEmail({
    email: process.env.EMAIL_USER || 'alumnexconnect@gmail.com',
    subject: 'Brevo Test',
    message: '<p>This is a test email sent via Brevo API.</p>'
  });

  console.log('Test completed.');
}

test();
