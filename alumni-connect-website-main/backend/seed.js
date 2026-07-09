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

    // Create Dummy Users
    const mockUsers = [
      {
        name: 'Alex Johnson',
        email: 'alex.alumni@test.com',
        password: 'password123',
        role: 'alumni',
        isVerified: true,
        isApproved: true,
        skills: ['React', 'Node.js', 'System Design'],
        alumniInfo: {
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          industry: 'Software',
          availableForMentorship: true,
        }
      },
      {
        name: 'Samantha Lee',
        email: 'sam.student@test.com',
        password: 'password123',
        role: 'student',
        isVerified: true,
        isApproved: true,
        skills: ['JavaScript', 'HTML', 'CSS'],
        studentInfo: {
          course: 'Computer Science',
          year: 3,
          university: 'State University'
        }
      },
      {
        name: 'David Chen',
        email: 'david.alumni@test.com',
        password: 'password123',
        role: 'alumni',
        isVerified: true,
        isApproved: true,
        skills: ['Python', 'Data Science', 'Machine Learning'],
        alumniInfo: {
          company: 'DataWorks Inc',
          position: 'Data Scientist',
          industry: 'Data Analytics',
          availableForMentorship: true,
        }
      }
    ];

    const createdUsers = [];
    for (const u of mockUsers) {
      // Check if exists
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
        console.log(`Created user: ${user.name}`);
      }
      createdUsers.push(user);
    }

    // Set up some followers/connections between them
    const alex = createdUsers[0];
    const sam = createdUsers[1];
    const david = createdUsers[2];

    if (!alex.followers.includes(sam._id)) {
      alex.followers.push(sam._id);
      sam.following.push(alex._id);
      await alex.save();
      await sam.save();
      console.log('Sam is now following Alex.');
    }

    // Create a forum post
    const existingPost = await ForumPost.findOne({ title: 'Welcome to the new Alumnex Connect!' });
    if (!existingPost) {
      await ForumPost.create({
        title: 'Welcome to the new Alumnex Connect!',
        content: 'This is a test post to populate the forum. Feel free to reply and interact!',
        author: alex._id,
        tags: ['General', 'Announcement'],
        category: 'general'
      });
      console.log('Created forum post.');
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
