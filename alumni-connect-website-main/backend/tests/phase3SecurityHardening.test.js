const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authService = require('../services/authService');
const User = require('../models/User');
const DevProfile = require('../models/DevProfile');

jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));

describe('Phase 3: Authentication, Authorization & Account Security Hardening', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'phase3_test_jwt_secret_value_32_bytes_len';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1: Google OAuth & Fail-Closed Token Verification', () => {
    it('should reject forged Google JWTs without valid cryptographic signatures', async () => {
      const forgedJwt = jwt.sign(
        {
          iss: 'accounts.google.com',
          sub: 'attacker_google_id_9999',
          email: 'attacker@evil.com',
          email_verified: true,
          name: 'Attacker'
        },
        'attacker_private_secret_key'
      );

      await expect(authService.processGoogleLogin(forgedJwt)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Invalid or forged Google authentication token/i)
      });
    });

    it('should fail closed when Google token is missing or malformed', async () => {
      await expect(authService.processGoogleLogin('')).rejects.toMatchObject({
        status: 400
      });
      await expect(authService.processGoogleLogin(null)).rejects.toMatchObject({
        status: 400
      });
    });

    it('should fail closed when Google access token endpoint returns error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(authService.processGoogleLogin('invalid_opaque_token')).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Failed to fetch user info from Google/i)
      });
    });

    it('should generate high-entropy random password on completeOAuth rather than deterministic secret hash', async () => {
      const tempToken = jwt.sign(
        { email: 'newoauth@example.com', name: 'New OAuth', picture: '', sub: 'oauth_sub_123', provider: 'google' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '15m' }
      );

      let savedUser = null;
      User.findOne = jest.fn().mockResolvedValue(null);
      const saveSpy = jest.spyOn(User.prototype, 'save').mockImplementation(async function () {
        savedUser = this;
        return this;
      });

      const result = await authService.completeOAuth(tempToken, 'student', { college: 'Test College' });
      expect(result).toHaveProperty('token');
      expect(savedUser).not.toBeNull();
      expect(savedUser.password).toBeDefined();
      expect(savedUser.password).not.toBe('');
      // Verify password cannot match deterministic sub + JWT_SECRET directly
      const matchesSubSecret = await bcrypt.compare('oauth_sub_123' + process.env.JWT_SECRET, savedUser.password);
      expect(matchesSubSecret).toBe(false);
      saveSpy.mockRestore();
    });
  });

  describe('Step 2: Explicit Allowlist for Public User Profile', () => {
    it('should only return allowlisted fields and never expose OTPs, hashes, or private metadata in getPublicProfile()', () => {
      const rawUserDoc = {
        _id: 'user_12345',
        name: 'Jane Doe',
        email: 'jane@alumnex.com',
        phoneNumber: '+919876543210',
        phoneVerified: true,
        smsNotifications: true,
        password: '$2a$12$compromisedHashShouldNeverLeakToPublicProfile',
        role: 'alumni',
        photo: 'https://example.com/avatar.jpg',
        bio: 'Senior Software Engineer',
        skills: ['Node.js', 'React', 'MongoDB'],
        interests: ['Mentorship', 'Open Source'],
        location: 'Bengaluru',
        country: 'India',
        college: 'National Institute of Technology',
        department: 'Computer Science',
        studentInfo: {
          course: 'B.Tech',
          year: 2024,
          university: 'NIT'
        },
        alumniInfo: {
          graduationYear: 2020,
          company: 'Acme Corp',
          position: 'Tech Lead',
          industry: 'Software',
          experience: 4,
          studentsPlaced: 12,
          employmentProofUrl: 'https://s3.amazonaws.com/private-docs/sensitive_id_card.pdf',
          adminVerifiedMentor: true,
          availableForMentorship: true,
          mentorshipAreas: ['System Design'],
          maxMentees: 5,
          preferredBatches: ['2023', '2024'],
          mentorRating: 4.9,
          mentorReviewCount: 15,
          mentorshipHours: 40
        },
        collegeInfo: {
          establishedYear: 1960,
          accreditation: 'A++',
          officialUrl: 'https://nit.ac.in',
          extractedProfile: { mission: 'Excellence' },
          websiteMetadata: { title: 'NIT' }
        },
        socialLinks: {
          linkedin: 'https://linkedin.com/in/janedoe',
          github: 'https://github.com/janedoe'
        },
        rewardPoints: 350,
        emailPreferences: {
          networkUpdates: true,
          devPulse: false,
          weeklyDigest: true
        },
        status: 'available',
        isVerified: true,
        isApproved: true,
        isActive: true,
        connections: ['conn_1', 'conn_2'],
        followers: ['follower_1'],
        following: ['following_1'],
        followRequests: ['incoming_private_request_id'],
        lastActive: new Date('2026-11-15T12:00:00Z'),
        completedTasks: ['task_1'],
        savedPosts: ['post_1', 'post_2'],
        reportedPosts: ['report_1'],
        resetPasswordOtp: '987654',
        resetPasswordExpires: new Date(Date.now() + 900000),
        resetPasswordOtpAttempts: 2,
        verificationOtp: '123456',
        verificationOtpExpires: new Date(Date.now() + 900000),
        verificationOtpAttempts: 1,
        deleteAccountOtp: '456789',
        deleteAccountExpires: new Date(Date.now() + 900000),
        deleteAccountOtpAttempts: 0,
        twoFactorEnabled: true,
        twoFactorOtp: '654321',
        twoFactorOtpExpires: new Date(Date.now() + 900000),
        twoFactorOtpAttempts: 0,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-11-15T12:00:00Z')
      };

      const userInstance = new User(rawUserDoc);
      // Manually attach fields that might be select: false in schema
      userInstance.password = rawUserDoc.password;
      userInstance.resetPasswordOtp = rawUserDoc.resetPasswordOtp;
      userInstance.verificationOtp = rawUserDoc.verificationOtp;
      userInstance.twoFactorOtp = rawUserDoc.twoFactorOtp;
      userInstance.deleteAccountOtp = rawUserDoc.deleteAccountOtp;

      const publicProfile = userInstance.getPublicProfile();

      // Allowed public fields must exist
      expect(publicProfile._id).toBeDefined();
      expect(publicProfile._id.toString()).toBe(userInstance._id.toString());
      expect(publicProfile.name).toBe('Jane Doe');
      expect(publicProfile.email).toBe('jane@alumnex.com');
      expect(publicProfile.role).toBe('alumni');
      expect(publicProfile.alumniInfo.company).toBe('Acme Corp');
      expect(publicProfile.alumniInfo.position).toBe('Tech Lead');

      // Sensitive fields MUST NOT exist in publicProfile
      expect(publicProfile.password).toBeUndefined();
      expect(publicProfile.resetPasswordOtp).toBeUndefined();
      expect(publicProfile.resetPasswordExpires).toBeUndefined();
      expect(publicProfile.resetPasswordOtpAttempts).toBeUndefined();
      expect(publicProfile.verificationOtp).toBeUndefined();
      expect(publicProfile.verificationOtpExpires).toBeUndefined();
      expect(publicProfile.verificationOtpAttempts).toBeUndefined();
      expect(publicProfile.deleteAccountOtp).toBeUndefined();
      expect(publicProfile.deleteAccountExpires).toBeUndefined();
      expect(publicProfile.deleteAccountOtpAttempts).toBeUndefined();
      expect(publicProfile.twoFactorOtp).toBeUndefined();
      expect(publicProfile.twoFactorOtpExpires).toBeUndefined();
      expect(publicProfile.twoFactorOtpAttempts).toBeUndefined();

      // Private personal & metadata fields MUST NOT exist in publicProfile
      expect(publicProfile.phoneNumber).toBeUndefined();
      expect(publicProfile.phoneVerified).toBeUndefined();
      expect(publicProfile.smsNotifications).toBeUndefined();
      expect(publicProfile.emailPreferences).toBeUndefined();
      expect(publicProfile.followRequests).toBeUndefined();
      expect(publicProfile.savedPosts).toBeUndefined();
      expect(publicProfile.reportedPosts).toBeUndefined();
      expect(publicProfile.completedTasks).toBeUndefined();

      // Private verification proof document URL MUST NOT exist in publicProfile
      expect(publicProfile.alumniInfo.employmentProofUrl).toBeUndefined();
    });

    it('should provide getPrivateProfile() for account owner without leaking passwords or OTPs', () => {
      const userInstance = new User({
        _id: 'owner_user_id',
        name: 'Owner User',
        email: 'owner@alumnex.com',
        phoneNumber: '+919876543210',
        phoneVerified: true,
        smsNotifications: true,
        emailPreferences: { networkUpdates: true },
        twoFactorOtp: '999888',
        resetPasswordOtp: '111222'
      });

      const privateProfile = userInstance.getPrivateProfile();
      // Owner-specific data should be present
      expect(privateProfile.phoneNumber).toBe('+919876543210');
      expect(privateProfile.phoneVerified).toBe(true);
      expect(privateProfile.emailPreferences).toBeDefined();

      // Sensitive OTPs and passwords must still be stripped
      expect(privateProfile.password).toBeUndefined();
      expect(privateProfile.twoFactorOtp).toBeUndefined();
      expect(privateProfile.resetPasswordOtp).toBeUndefined();
      expect(privateProfile.deleteAccountOtp).toBeUndefined();
      expect(privateProfile.verificationOtp).toBeUndefined();
    });
  });

  describe('Step 3: Two-Factor Authentication Security & Pre-Authentication Challenge', () => {
    it('should reject send2FA if pre-authentication challenge is missing', async () => {
      await expect(authService.send2FA('user@test.com', 'email', null)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Pre-authentication challenge is required/i)
      });
    });

    it('should reject normal access tokens as a pre-auth challenge (wrong token type)', async () => {
      const normalAccessToken = jwt.sign(
        { id: 'user_123', email: 'user@test.com' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '7d' }
      );

      await expect(authService.send2FA('user@test.com', 'email', normalAccessToken)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Invalid or expired 2FA pre-authentication challenge/i)
      });
    });

    it('should reject 2FA challenge signed for a different user (identity mismatch)', async () => {
      const challengeForOtherUser = jwt.sign(
        { userId: 'victim_id', email: 'victim@test.com', type: '2fa_pre_auth' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '10m' }
      );

      await expect(authService.verify2FA('attacker@test.com', '123456', challengeForOtherUser)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Invalid or expired 2FA pre-authentication challenge/i)
      });
    });

    it('should enforce max 5 failed OTP attempts and invalidate OTP permanently', async () => {
      const validChallenge = jwt.sign(
        { userId: 'user_2fa_id', email: 'user2fa@test.com', type: '2fa_pre_auth' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '10m' }
      );

      const mockUser = {
        _id: 'user_2fa_id',
        email: 'user2fa@test.com',
        twoFactorOtp: '777888',
        twoFactorOtpExpires: new Date(Date.now() + 600000),
        twoFactorOtpAttempts: 4,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // 5th failed attempt should fail and report remaining
      await expect(authService.verify2FA('user2fa@test.com', 'wrong_code', validChallenge)).rejects.toMatchObject({
        status: 400,
        message: expect.stringMatching(/Invalid OTP. 0 attempt\(s\) remaining/i)
      });

      expect(mockUser.twoFactorOtpAttempts).toBe(5);

      // Next attempt with attempts >= 5 must permanently invalidate OTP
      await expect(authService.verify2FA('user2fa@test.com', 'wrong_code', validChallenge)).rejects.toMatchObject({
        status: 400,
        message: expect.stringMatching(/Maximum failed verification attempts exceeded/i)
      });

      expect(mockUser.twoFactorOtp).toBeUndefined();
      expect(mockUser.twoFactorOtpExpires).toBeUndefined();
    });

    it('should invalidate OTP upon successful one-time consumption', async () => {
      const validChallenge = jwt.sign(
        { userId: 'user_2fa_id', email: 'user2fa@test.com', type: '2fa_pre_auth' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '10m' }
      );

      const mockUser = {
        _id: 'user_2fa_id',
        name: '2FA User',
        email: 'user2fa@test.com',
        twoFactorOtp: '123456',
        twoFactorOtpExpires: new Date(Date.now() + 600000),
        twoFactorOtpAttempts: 0,
        updateLastActive: jest.fn().mockResolvedValue(true),
        getPublicProfile: jest.fn().mockReturnValue({ _id: 'user_2fa_id', email: 'user2fa@test.com' }),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await authService.verify2FA('user2fa@test.com', '123456', validChallenge);
      expect(result).toHaveProperty('token');
      expect(mockUser.twoFactorOtp).toBeUndefined();
      expect(mockUser.twoFactorOtpExpires).toBeUndefined();
      expect(mockUser.twoFactorOtpAttempts).toBe(0);
    });
  });

  describe('Step 4: Password Reset Non-Enumeration & Server-Side Password Validation', () => {
    it('should return the same non-enumerating message for existing and non-existing accounts in forgotPassword', async () => {
      // 1. Non-existent email
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const nonExistentResult = await authService.forgotPassword('nonexistent@alumnex.com');
      expect(nonExistentResult.message).toBe('If an account with that email exists, an OTP has been sent.');

      // 2. Existing email
      const mockUser = {
        email: 'existing@alumnex.com',
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const existingResult = await authService.forgotPassword('existing@alumnex.com');
      expect(existingResult.message).toBe('If an account with that email exists, an OTP has been sent.');
    });

    it('should return non-enumerating message for resendVerification on non-existing accounts', async () => {
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const resendResult = await authService.resendVerification('ghost@alumnex.com');
      expect(resendResult.message).toBe('If an account exists, a new OTP has been sent.');
    });

    it('should reject passwords shorter than 6 characters server-side on resetPassword', async () => {
      await expect(authService.resetPassword('user@test.com', '123456', '123')).rejects.toMatchObject({
        status: 400,
        message: 'Password must be at least 6 characters long'
      });
    });

    it('should reject passwords shorter than 6 characters server-side on changePassword', async () => {
      await expect(authService.changePassword('user_id', 'oldpass', 'short')).rejects.toMatchObject({
        status: 400,
        message: 'Password must be at least 6 characters long'
      });
    });

    it('should enforce 5 failed attempts limit on password reset and invalidate OTP', async () => {
      const mockUser = {
        email: 'reset@alumnex.com',
        resetPasswordOtp: '999111',
        resetPasswordExpires: new Date(Date.now() + 600000),
        resetPasswordOtpAttempts: 5,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(authService.resetPassword('reset@alumnex.com', 'wrong_otp', 'NewValidPass123')).rejects.toMatchObject({
        status: 400,
        message: expect.stringMatching(/Maximum failed verification attempts exceeded/i)
      });

      expect(mockUser.resetPasswordOtp).toBeUndefined();
      expect(mockUser.resetPasswordExpires).toBeUndefined();
    });
  });

  describe('Step 5: Developer Activity Authorization & Information Leak Prevention', () => {
    it('should reject unauthorized access to another user\'s private dev profile via GET /api/dev-activity/:email', async () => {
      const req = {
        params: { email: 'victim@alumnex.com' },
        user: { email: 'attacker@alumnex.com', role: 'student' }
      };

      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status: jest.fn().mockImplementation(s => {
          statusCalled = s;
          return res;
        }),
        json: jest.fn().mockImplementation(j => {
          jsonCalled = j;
          return res;
        })
      };

      const devActivityRouter = require('../routes/devActivity');
      // Find the GET /:email route layer
      const routeLayer = devActivityRouter.stack.find(
        layer => layer.route && layer.route.path === '/:email' && layer.route.methods.get
      );
      expect(routeLayer).toBeDefined();

      const handler = routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;
      await handler(req, res);

      expect(statusCalled).toBe(403);
      expect(jsonCalled).toEqual({ message: 'Not authorized to access this developer profile' });
    });

    it('should allow profile owner to access their own private dev profile via GET /api/dev-activity/:email', async () => {
      DevProfile.findOne = jest.fn().mockResolvedValue({
        email: 'owner@alumnex.com',
        usernames: { github: { username: 'ownergh', isVerified: true } },
        stats: { github: { publicRepos: 10 } },
        lastUpdated: new Date(),
        alumnexScore: 85,
        verificationCode: 'ALUMNEX_VERIFY_A1B2C3'
      });

      const req = {
        params: { email: 'owner@alumnex.com' },
        query: {},
        user: { email: 'owner@alumnex.com', role: 'student' }
      };

      let jsonCalled = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(j => {
          jsonCalled = j;
          return res;
        })
      };

      const devActivityRouter = require('../routes/devActivity');
      const routeLayer = devActivityRouter.stack.find(
        layer => layer.route && layer.route.path === '/:email' && layer.route.methods.get
      );
      const handler = routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;
      await handler(req, res);

      expect(jsonCalled).toBeDefined();
      expect(jsonCalled.usernames.github.username).toBe('ownergh');
      expect(jsonCalled.alumnexScore).toBe(85);
      expect(jsonCalled.verificationCode).toBe('ALUMNEX_VERIFY_A1B2C3');
    });

    it('should preserve public read for any authenticated user on GET /api/dev-activity/public/:userId without leaking verificationCode', async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: 'target_user_id',
          name: 'Target Developer',
          email: 'target@alumnex.com',
          photo: 'https://example.com/photo.jpg'
        })
      });

      DevProfile.findOne = jest.fn().mockResolvedValue({
        email: 'target@alumnex.com',
        usernames: { github: { username: 'targetgh', isVerified: true } },
        stats: { github: { publicRepos: 25 } },
        lastUpdated: new Date(),
        alumnexScore: 150,
        verificationCode: 'SECRET_VERIFICATION_CODE_SHOULD_NEVER_LEAK_IN_PUBLIC'
      });

      const req = {
        params: { userId: 'target_user_id' },
        user: { email: 'viewer@alumnex.com', role: 'student' }
      };

      let jsonCalled = null;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(j => {
          jsonCalled = j;
          return res;
        })
      };

      const devActivityRouter = require('../routes/devActivity');
      const routeLayer = devActivityRouter.stack.find(
        layer => layer.route && layer.route.path === '/public/:userId' && layer.route.methods.get
      );
      const handler = routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;
      await handler(req, res);

      expect(jsonCalled).toBeDefined();
      expect(jsonCalled.name).toBe('Target Developer');
      expect(jsonCalled.usernames.github.username).toBe('targetgh');
      expect(jsonCalled.alumnexScore).toBe(150);
      // Strictly verify verificationCode is not exposed to public viewer
      expect(jsonCalled.verificationCode).toBeUndefined();
    });
  });

  describe('Step 6: Session Security, Logout Handling & Explicit Algorithms', () => {
    it('should clear both token and pre_auth_challenge cookies on logout', async () => {
      const clearedCookies = [];
      const req = {
        headers: {},
        cookies: { token: 'sample_token' }
      };
      const res = {
        clearCookie: jest.fn().mockImplementation((name, options) => {
          clearedCookies.push({ name, options });
        }),
        json: jest.fn()
      };

      const authRouter = require('../routes/auth');
      const logoutLayer = authRouter.stack.find(
        layer => layer.route && layer.route.path === '/logout' && layer.route.methods.post
      );
      const handler = logoutLayer.route.stack[logoutLayer.route.stack.length - 1].handle;
      await handler(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.objectContaining({ httpOnly: true }));
      expect(res.clearCookie).toHaveBeenCalledWith('pre_auth_challenge', expect.objectContaining({ httpOnly: true }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
