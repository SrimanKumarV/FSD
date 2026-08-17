const { admin, alumni, student, verified, approved, isResourceOwner } = require('../middleware/auth');

describe('Auth Middleware - RBAC', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: {},
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('admin middleware', () => {
    it('should call next if user is admin', () => {
      mockReq.user.role = 'admin';
      admin(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', () => {
      mockReq.user.role = 'student';
      admin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized as admin' });
    });
  });

  describe('alumni middleware', () => {
    it('should call next if user is alumni', () => {
      mockReq.user.role = 'alumni';
      alumni(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user is not alumni', () => {
      mockReq.user.role = 'student';
      alumni(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized as alumni' });
    });
  });

  describe('student middleware', () => {
    it('should call next if user is student', () => {
      mockReq.user.role = 'student';
      student(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user is not student', () => {
      mockReq.user.role = 'alumni';
      student(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized as student' });
    });
  });

  describe('verified middleware', () => {
    it('should call next if user is verified', () => {
      mockReq.user.isVerified = true;
      verified(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user is not verified', () => {
      mockReq.user.isVerified = false;
      verified(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Account not verified' });
    });
  });

  describe('approved middleware', () => {
    it('should call next if user is approved', () => {
      mockReq.user.isApproved = true;
      approved(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user is not approved', () => {
      mockReq.user.isApproved = false;
      approved(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Account not approved' });
    });
  });

  describe('isResourceOwner middleware', () => {
    it('should allow admin to access any resource', () => {
      mockReq.user = { _id: 'adminId123', role: 'admin' };
      mockReq.params.userId = 'studentId123';
      
      const middleware = isResourceOwner('userId');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow user to access their own resource', () => {
      mockReq.user = { _id: 'studentId123', role: 'student' };
      mockReq.params.userId = 'studentId123';
      
      const middleware = isResourceOwner('userId');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user tries to access another user resource', () => {
      mockReq.user = { _id: 'studentId123', role: 'student' };
      mockReq.params.userId = 'anotherStudentId456';
      
      const middleware = isResourceOwner('userId');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
