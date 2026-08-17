const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Mentorship = require('../models/Mentorship');
const Notification = require('../models/Notification');
const { autoAssignMentor } = require('../services/mentorshipService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Mentorship.deleteMany({});
  await Notification.deleteMany({});
});

describe('Mentorship Service - autoAssignMentor', () => {
  it('should not assign if no college is provided', async () => {
    await autoAssignMentor(new mongoose.Types.ObjectId(), null);
    const count = await Mentorship.countDocuments();
    expect(count).toBe(0);
  });

  it('should assign a mentor with available capacity from the same college', async () => {
    const college = 'Test University';
    const studentId = new mongoose.Types.ObjectId();

    // Create alumni
    const alumni = new User({
      name: 'John Alumni',
      email: 'john@example.com',
      password: 'password123',
      role: 'alumni',
      college,
      isApproved: true,
      alumniInfo: { industry: 'Tech' }
    });
    await alumni.save();

    await autoAssignMentor(studentId, college);

    const mentorships = await Mentorship.find({ student: studentId });
    expect(mentorships.length).toBe(1);
    expect(mentorships[0].mentor.toString()).toBe(alumni._id.toString());
    expect(mentorships[0].isAutoAssigned).toBe(true);

    const notifications = await Notification.find({ recipient: alumni._id });
    expect(notifications.length).toBe(1);
  });

  it('should distribute mentees to the mentor with the most available capacity', async () => {
    const college = 'Capacity University';
    const student1 = new mongoose.Types.ObjectId();
    const student2 = new mongoose.Types.ObjectId();

    const mentor1 = new User({
      name: 'Mentor 1',
      email: 'm1@example.com',
      password: 'password123',
      role: 'alumni',
      college,
      isApproved: true,
      alumniInfo: { industry: 'Tech' }
    });

    const mentor2 = new User({
      name: 'Mentor 2',
      email: 'm2@example.com',
      password: 'password123',
      role: 'alumni',
      college,
      isApproved: true,
      alumniInfo: { industry: 'Finance' }
    });

    await mentor1.save();
    await mentor2.save();

    // Assign one student to mentor1 manually
    await new Mentorship({
      student: new mongoose.Types.ObjectId(),
      mentor: mentor1._id,
      title: 'Manual Mentorship',
      description: 'A manual mentorship for testing',
      status: 'accepted'
    }).save();

    // Now auto-assign should pick mentor2 because they have 0 mentees, while mentor1 has 1
    await autoAssignMentor(student1, college);

    const m2Mentorships = await Mentorship.find({ mentor: mentor2._id });
    expect(m2Mentorships.length).toBe(1);

    // Auto-assign another should pick either, let's say it balances out
    await autoAssignMentor(student2, college);
    
    const m1Mentorships = await Mentorship.find({ mentor: mentor1._id, isAutoAssigned: true });
    expect(m1Mentorships.length).toBe(1); // M1 should get the next one
  });
});
