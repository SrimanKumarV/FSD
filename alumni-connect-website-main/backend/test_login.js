const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  await User.updateOne({ email: 'test_auto_user@example.com' }, { $set: { isVerified: true } });
  
  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Login Status:', res.statusCode, 'Body:', data.substring(0, 500));
      process.exit(0);
    });
  });
  req.on('error', e => console.error(e));
  req.write(JSON.stringify({email: 'test_auto_user@example.com', password: 'password123'}));
  req.end();
}).catch(console.error);
