const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User'); // Adjust path if needed

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@alumnex.com' });
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    const admin = new User({
      name: 'System Admin',
      email: 'admin@alumnex.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    await admin.save();
    console.log('Admin user created successfully! Email: admin@alumnex.com, Password: admin123');
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
