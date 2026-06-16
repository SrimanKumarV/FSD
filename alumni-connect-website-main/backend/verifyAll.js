const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    await User.updateMany({}, { isVerified: true });
    console.log('All users verified!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
