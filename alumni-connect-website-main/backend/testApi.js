const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const User = require('./models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user1 = await User.findOne({ email: 'srimankumar06@gmail.com' });
  const user2 = await User.findOne({ role: 'alumni' });

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  try {
    const res = await fetch('http://localhost:5000/api/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        receiver: user2._id.toString(),
        content: 'Hello world',
        messageType: 'text'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
};
run();
