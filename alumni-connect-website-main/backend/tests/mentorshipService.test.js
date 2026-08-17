const { autoAssignMentor } = require('../services/mentorshipService');
const User = require('../models/User');
const Mentorship = require('../models/Mentorship');
const Notification = require('../models/Notification');

jest.mock('../models/User');

const mockSave = jest.fn().mockResolvedValue(true);
jest.mock('../models/Mentorship', () => {
  const MentorshipMock = function(data) {
    Object.assign(this, data);
    this.save = mockSave;
  };
  MentorshipMock.findOne = jest.fn().mockResolvedValue(null);
  MentorshipMock.aggregate = jest.fn().mockResolvedValue([]);
  return MentorshipMock;
});

jest.mock('../models/Notification', () => ({
  createNotification: jest.fn().mockResolvedValue(true)
}));

describe('mentorshipService - autoAssignMentor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a mentor from the same college and assign them', async () => {
    const mockStudentId = 'student123';
    const mockCollege = 'Test University';
    const mockMentorId = 'mentor456';

    User.findById = jest.fn().mockResolvedValue({ _id: mockStudentId, studentInfo: { course: 'CS' } });

    User.find = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { 
          _id: mockMentorId, 
          name: 'Test Mentor', 
          college: mockCollege,
          alumniInfo: { industry: 'Tech' }
        }
      ])
    });

    Mentorship.findOne.mockResolvedValue(null);
    Mentorship.aggregate.mockResolvedValue([]);

    const result = await autoAssignMentor(mockStudentId, mockCollege);

    expect(result).not.toBeNull();
    expect(User.find).toHaveBeenCalledWith({
      role: 'alumni',
      college: mockCollege,
      isApproved: true
    });
  });

  it('should return null if no mentors are available', async () => {
    const mockStudentId = 'student123';
    const mockCollege = 'Test University';

    User.findById = jest.fn().mockResolvedValue({ _id: mockStudentId });

    User.find = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue([])
    });

    const result = await autoAssignMentor(mockStudentId, mockCollege);

    expect(result).toBeNull();
  });

  it('should return null on error', async () => {
    const mockStudentId = 'student123';
    const mockCollege = 'Test University';

    User.findById = jest.fn().mockRejectedValue(new Error('Database error'));

    const result = await autoAssignMentor(mockStudentId, mockCollege);
    expect(result).toBeNull();
  });
});
