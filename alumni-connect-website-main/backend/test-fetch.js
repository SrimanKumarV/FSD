require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) return console.log('No admin found');
  
  console.log('Admin ID:', admin._id);
  
  const notifications = await Notification.find({ recipient: admin._id }).sort({ createdAt: -1 }).limit(5);
  console.log('Recent notifications for admin:');
  console.log(JSON.stringify(notifications, null, 2));
  
  process.exit(0);
}
test().catch(console.error);
