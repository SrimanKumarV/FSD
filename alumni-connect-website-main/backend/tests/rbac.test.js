const { admin, alumni, student, isResourceOwner } = require('../middleware/auth');

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
