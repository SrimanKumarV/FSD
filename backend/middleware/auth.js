const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      // Update last active timestamp
      req.user.updateLastActive();

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Middleware to check if user is alumni
const alumni = (req, res, next) => {
  if (req.user && req.user.role === 'alumni') {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as alumni' });
  }
};

// Middleware to check if user is student
const student = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as student' });
  }
};

// Middleware to check if user is alumni or admin
const alumniOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'alumni' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as alumni or admin' });
  }
};

// Middleware to check if user is student or admin
const studentOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'student' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as student or admin' });
  }
};

// Middleware to check if user is verified
const verified = (req, res, next) => {
  if (req.user && req.user.isVerified) {
    next();
  } else {
    return res.status(403).json({ message: 'Account not verified' });
  }
};

// Middleware to check if user is approved (for alumni)
const approved = (req, res, next) => {
  if (req.user && req.user.isApproved) {
    next();
  } else {
    return res.status(403).json({ message: 'Account not approved' });
  }
};

// Middleware to check if user can access resource
const canAccessResource = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    
    if (!resourceUserId) {
      return res.status(400).json({ message: 'Resource user ID not provided' });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can access their own resource
    if (req.user._id.toString() === resourceUserId.toString()) {
      return next();
    }

    return res.status(403).json({ message: 'Not authorized to access this resource' });
  };
};

// Middleware to check if user is resource owner
const isResourceOwner = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    
    if (!resourceUserId) {
      return res.status(400).json({ message: 'Resource user ID not provided' });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resource
    if (req.user._id.toString() === resourceUserId.toString()) {
      return next();
    }

    return res.status(403).json({ message: 'Not authorized to access this resource' });
  };
};

// Middleware to check if user can moderate content
const canModerate = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'alumni')) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized to moderate content' });
  }
};

// Middleware to check if user can create contests
const canCreateContest = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'alumni')) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized to create contests' });
  }
};

// Middleware to check if user can post jobs
const canPostJob = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'alumni')) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized to post jobs' });
  }
};

// Middleware to check if user can create events
const canCreateEvent = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'alumni')) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized to create events' });
  }
};

// Middleware to check if user can send messages
const canSendMessage = (req, res, next) => {
  if (req.user && req.user.isActive) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized to send messages' });
  }
};

// Middleware to check if user can request mentorship
const canRequestMentorship = (req, res, next) => {
  if (req.user && req.user.role === 'student' && req.user.isActive) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized to request mentorship' });
  }
};

// Middleware to check if user can be a mentor
const canBeMentor = (req, res, next) => {
  if (req.user && req.user.role === 'alumni' && req.user.isActive && req.user.isApproved) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized to be a mentor' });
  }
};

// Middleware to check if user can participate in contests
const canParticipateInContest = (req, res, next) => {
  if (req.user && req.user.isActive) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized to participate in contests' });
  }
};

// Middleware to check if user can post in forum
const canPostInForum = (req, res, next) => {
  if (req.user && req.user.isActive && req.user.isVerified) {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized to post in forum' });
  }
};

// Middleware to check if user can edit their own content
const canEditOwnContent = (contentField = 'author') => {
  return (req, res, next) => {
    const contentAuthorId = req.params[contentField] || req.body[contentField];
    
    if (!contentAuthorId) {
      return res.status(400).json({ message: 'Content author ID not provided' });
    }

    // Admin can edit any content
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only edit their own content
    if (req.user._id.toString() === contentAuthorId.toString()) {
      return next();
    }

    return res.status(403).json({ message: 'Not authorized to edit this content' });
  };
};

// Middleware to check if user can delete their own content
const canDeleteOwnContent = (contentField = 'author') => {
  return (req, res, next) => {
    const contentAuthorId = req.params[contentField] || req.body[contentField];
    
    if (!contentAuthorId) {
      return res.status(400).json({ message: 'Content author ID not provided' });
    }

    // Admin can delete any content
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only delete their own content
    if (req.user._id.toString() === contentAuthorId.toString()) {
      return next();
    }

    return res.status(403).json({ message: 'Not authorized to delete this content' });
  };
};

module.exports = {
  protect,
  admin,
  alumni,
  student,
  alumniOrAdmin,
  studentOrAdmin,
  verified,
  approved,
  canAccessResource,
  isResourceOwner,
  canModerate,
  canCreateContest,
  canPostJob,
  canCreateEvent,
  canSendMessage,
  canRequestMentorship,
  canBeMentor,
  canParticipateInContest,
  canPostInForum,
  canEditOwnContent,
  canDeleteOwnContent
};
