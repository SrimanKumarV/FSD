const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Mentorship = require('./models/Mentorship');
const ForumPost = require('./models/ForumPost');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumnex-connect';

async function cleanupDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Cleaning up mock data...');

    const mockEmails = ['alex.alumni@test.com', 'sam.student@test.com', 'david.alumni@test.com'];
    
    // Find mock users
    const mockUsers = await User.find({ email: { $in: mockEmails } });
    const mockUserIds = mockUsers.map(u => u._id);

    if (mockUserIds.length > 0) {
      // Delete their mentorships
      const deletedMentorships = await Mentorship.deleteMany({
        $or: [
          { student: { $in: mockUserIds } },
          { mentor: { $in: mockUserIds } }
        ]
      });
      console.log(`Deleted ${deletedMentorships.deletedCount} mentorship requests associated with mock users.`);

      // Delete their forum posts
      const deletedPosts = await ForumPost.deleteMany({ author: { $in: mockUserIds } });
      console.log(`Deleted ${deletedPosts.deletedCount} forum posts associated with mock users.`);

      // Delete the users themselves
      const deletedUsers = await User.deleteMany({ _id: { $in: mockUserIds } });
      console.log(`Deleted ${deletedUsers.deletedCount} mock users.`);
    } else {
      console.log('No mock users found to delete.');
    }

    console.log('Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  }
}

cleanupDB();
