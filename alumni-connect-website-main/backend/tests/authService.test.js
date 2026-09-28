const authService = require('../services/authService');
const User = require('../models/User');

jest.mock('../models/User');
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));

describe('authService', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw an error for invalid credentials if user not found', async () => {
      User.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await expect(authService.login('test@example.com', 'password')).rejects.toEqual({
        status: 400,
        message: 'Invalid credentials'
      });
    });

    it('should throw an error if account is deactivated', async () => {
      User.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ isActive: false }) });

      await expect(authService.login('test@example.com', 'password')).rejects.toEqual({
        status: 400,
        message: 'Account is deactivated'
      });
    });

    it('should login successfully for active verified user', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test',
        email: 'test@example.com',
        role: 'student',
        isActive: true,
        isVerified: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        updateLastActive: jest.fn().mockResolvedValue(true),
        getPublicProfile: jest.fn().mockReturnValue({ id: 'user123', email: 'test@example.com' })
      };

      User.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const result = await authService.login('test@example.com', 'password');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password');
      expect(mockUser.updateLastActive).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should throw if user already exists', async () => {
      User.findOne = jest.fn().mockResolvedValue({ _id: 'user123' });

      await expect(authService.register({ email: 'test@example.com' })).rejects.toEqual({
        status: 400,
        message: 'User already exists'
      });
    });

    it('should successfully register a new user', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue(true);
      
      User.mockImplementation(() => {
        return {
          email: 'test@example.com',
          save: mockSave
        };
      });

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student'
      });

      expect(mockSave).toHaveBeenCalled();
      expect(result).toHaveProperty('requiresVerification', true);
      expect(result.message).toContain('Registration successful');
    });
  });

  describe('processGoogleLogin', () => {
    it('should return requiresRoleSelection and tempToken for a new Google user', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          email: 'newuser@google.com',
          name: 'New Google User',
          picture: 'https://example.com/photo.jpg',
          sub: 'google_123456'
        })
      });

      User.findOne = jest.fn().mockResolvedValue(null);

      const result = await authService.processGoogleLogin('valid_google_token');

      expect(result.requiresRoleSelection).toBe(true);
      expect(result).toHaveProperty('tempToken');
      expect(result.message).toContain('Please select your role');
    });

    it('should authenticate an existing Google user and issue token', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          email: 'existing@google.com',
          name: 'Existing Google User',
          picture: 'https://example.com/photo.jpg',
          sub: 'google_789'
        })
      });

      const mockUser = {
        _id: 'user_existing_id',
        email: 'existing@google.com',
        name: 'Existing Google User',
        isVerified: true,
        photo: 'https://example.com/photo.jpg',
        getPublicProfile: jest.fn().mockReturnValue({ id: 'user_existing_id', email: 'existing@google.com' }),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.processGoogleLogin('valid_google_token');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.message).toBe('Login successful');
    });

    it('should throw an error if Google userinfo call fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(authService.processGoogleLogin('bad_token')).rejects.toEqual({
        status: 401,
        message: 'Failed to fetch user info from Google'
      });
    });
  });
});
