const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const ForumPost = require('./models/ForumPost');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumnex-connect';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Seeding data...');

    // Clean existing mock data if needed (optional, keeping it additive for now or wiping specific docs)
    // await User.deleteMany({ email: { $in: ['mock1@test.com', 'mock2@test.com', 'mock3@test.com'] } });

    // Mock users have been removed per request.
    // If you need to seed other data (like default roles or settings), it can be added here.
    
    console.log('Database seeding completed successfully (no mock users created).');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
