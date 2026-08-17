const jobService = require('../services/jobService');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Notification = require('../models/Notification');

jest.mock('../models/Job');
jest.mock('../models/JobApplication');
jest.mock('../models/Notification', () => ({
  createNotification: jest.fn().mockResolvedValue(true)
}));

describe('jobService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should successfully create a job', async () => {
      const mockUser = { id: 'user123' };
      const mockData = {
        title: 'Software Engineer',
        company: 'Tech Corp'
      };
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockPopulate = jest.fn().mockResolvedValue(true);

      Job.mockImplementation(() => {
        return {
          ...mockData,
          save: mockSave,
          populate: mockPopulate
        };
      });

      const result = await jobService.createJob(mockUser, mockData, null);

      expect(mockSave).toHaveBeenCalled();
      expect(mockPopulate).toHaveBeenCalledWith('postedBy', 'name photo role');
      expect(result.title).toBe('Software Engineer');
    });

    it('should throw error if salary min > max', async () => {
      const mockUser = { id: 'user123' };
      const mockData = {
        title: 'Software Engineer',
        salary: { min: 100000, max: 50000 }
      };

      await expect(jobService.createJob(mockUser, mockData, null)).rejects.toThrow('Minimum salary cannot be greater than maximum salary');
    });
  });

  describe('applyForJob', () => {
    it('should throw error if job not found', async () => {
      Job.findById = jest.fn().mockResolvedValue(null);

      await expect(jobService.applyForJob({ id: 'user1' }, 'job1', {}, null)).rejects.toThrow('Job not found');
    });

    it('should throw error if job is not active', async () => {
      Job.findById = jest.fn().mockResolvedValue({ status: 'closed' });

      await expect(jobService.applyForJob({ id: 'user1' }, 'job1', {}, null)).rejects.toThrow('Job is not accepting applications');
    });

    it('should throw error if already applied', async () => {
      Job.findById = jest.fn().mockResolvedValue({ _id: 'job1', status: 'active' });
      JobApplication.findOne = jest.fn().mockResolvedValue({ _id: 'app1' });

      await expect(jobService.applyForJob({ id: 'user1' }, 'job1', {}, null)).rejects.toThrow('Already applied for this job');
    });

    it('should successfully apply for a job', async () => {
      const mockIncrement = jest.fn().mockResolvedValue(true);
      Job.findById = jest.fn().mockResolvedValue({ _id: 'job1', status: 'active', incrementApplications: mockIncrement });
      JobApplication.findOne = jest.fn().mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(true);
      JobApplication.mockImplementation(() => {
        return {
          save: mockSave
        };
      });

      const result = await jobService.applyForJob({ id: 'user1' }, 'job1', { coverLetter: 'Hello' }, null);

      expect(mockSave).toHaveBeenCalled();
      expect(mockIncrement).toHaveBeenCalled();
      expect(Notification.createNotification).toHaveBeenCalled();
    });
  });
});
