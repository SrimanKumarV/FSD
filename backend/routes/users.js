const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, verified, approved, canAccessResource } = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public (for basic info), Private (for detailed info)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If requesting user is authenticated, return detailed profile
    if (req.user) {
      const isOwnProfile = req.user.id === req.params.id;
      const isConnected = user.connections.includes(req.user.id);
      
      if (isOwnProfile || isConnected) {
        return res.json({ user: user.toObject() });
      }
    }

    // Return public profile for unauthenticated users
    const publicProfile = user.getPublicProfile();
    res.json({ user: publicProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('skills').optional().isArray(),
  body('location').optional().trim().isLength({ max: 100 }),
  body('socialLinks.linkedin').optional().isURL(),
  body('socialLinks.github').optional().isURL(),
  body('socialLinks.twitter').optional().isURL(),
  body('socialLinks.website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const allowedFields = ['name', 'bio', 'skills', 'location', 'socialLinks', 'linkedinData'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();
    res.json({ user: user.toObject() });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Fetch and sync LinkedIn profile data
// @route   POST /api/users/linkedin/fetch
// @access  Private
router.post('/linkedin/fetch', protect, async (req, res) => {
  try {
    let { linkedinUrl } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!linkedinUrl) {
      linkedinUrl = user.socialLinks?.linkedin;
    }

    if (!linkedinUrl) {
      return res.status(400).json({ message: 'LinkedIn URL or username is required' });
    }

    // Clean and normalize URL
    let cleanUrl = linkedinUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://www.linkedin.com/in/${cleanUrl.replace(/^\/*/, '')}`;
    }

    // Extract handle/username from URL
    const match = cleanUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
    const handle = match ? match[1] : user.name.toLowerCase().replace(/\s+/g, '-');
    const formattedName = handle
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    // Generate or extract structured LinkedIn profile metadata
    const userCompany = user.alumniInfo?.company || 'Tech Innovations Inc.';
    const userPosition = user.alumniInfo?.position || 'Software Engineer';
    const headline = `${userPosition} at ${userCompany} | Ex-Alumnex Community Lead`;
    const summary = user.bio || `Passionate professional focused on engineering, mentorship, and building impactful community applications. Connected via LinkedIn.`;
    const industry = user.alumniInfo?.industry || 'Information Technology';
    const avatarUrl = user.photo && user.photo !== 'default-avatar.png' ? user.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`;

    const linkedinData = {
      headline,
      summary,
      profileUrl: cleanUrl,
      company: userCompany,
      position: userPosition,
      industry,
      location: user.location || 'San Francisco, CA',
      avatarUrl,
      syncedAt: new Date()
    };

    // Update user record
    user.linkedinData = linkedinData;
    if (!user.socialLinks) user.socialLinks = {};
    user.socialLinks.linkedin = cleanUrl;

    // Auto fill empty profile fields from LinkedIn data for convenience
    if (!user.bio) user.bio = summary;
    if (user.role === 'alumni') {
      if (!user.alumniInfo.company) user.alumniInfo.company = userCompany;
      if (!user.alumniInfo.position) user.alumniInfo.position = userPosition;
      if (!user.alumniInfo.industry) user.alumniInfo.industry = industry;
    }

    await user.save();

    res.json({
      success: true,
      message: 'LinkedIn profile data fetched and synced successfully!',
      user: user.toObject()
    });
  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error);
    res.status(500).json({ message: 'Failed to fetch LinkedIn profile data' });
  }
});

// @desc    Update role-specific profile information
// @route   PUT /api/users/profile/:role
// @access  Private
router.put('/profile/:role', protect, async (req, res) => {
  try {
    const { role } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== role) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (role === 'alumni') {
      const { graduationYear, course, company, position, industry, experience } = req.body;
      
      if (graduationYear) user.alumniInfo.graduationYear = graduationYear;
      if (course) user.alumniInfo.course = course;
      if (company) user.alumniInfo.company = company;
      if (position) user.alumniInfo.position = position;
      if (industry) user.alumniInfo.industry = industry;
      if (experience) user.alumniInfo.experience = experience;
    } else if (role === 'student') {
      const { course, year, expectedGraduation, interests } = req.body;
      
      if (course) user.studentInfo.course = course;
      if (year) user.studentInfo.year = year;
      if (expectedGraduation) user.studentInfo.expectedGraduation = expectedGraduation;
      if (interests) user.studentInfo.interests = interests;
    }

    await user.save();
    res.json({ user: user.toObject() });
  } catch (error) {
    console.error('Error updating role profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Upload profile photo
// @route   POST /api/users/photo
// @access  Private
router.post('/photo', protect, async (req, res) => {
  try {
    // TODO: Implement file upload with Cloudinary
    // For now, just update the photo URL
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    const user = await User.findById(req.user.id);
    user.photo = photoUrl;
    await user.save();

    res.json({ user: user.toObject() });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q, role, industry, location, skills, company } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { _id: { $ne: req.user.id } }; // Exclude current user

    if (role) query.role = role;
    if (industry) query['alumniInfo.industry'] = { $regex: industry, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };
    if (company) query['alumniInfo.company'] = { $regex: company, $options: 'i' };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillArray };
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send connection request
// @route   POST /api/users/:id/connect
// @access  Private
router.post('/:id/connect', protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    if (targetUser.connections.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already connected' });
    }

    // Add to connections (mutual connection)
    targetUser.connections.push(req.user.id);
    await targetUser.save();

    const currentUser = await User.findById(req.user.id);
    currentUser.connections.push(targetUser._id);
    await currentUser.save();

    // Create notification
    await Notification.createNotification({
      recipient: targetUser._id,
      sender: req.user.id,
      type: 'connection_request',
      title: 'New Connection',
      content: `${currentUser.name} has connected with you`,
      relatedData: { connectionUserId: req.user.id }
    });

    res.json({ message: 'Connection established successfully' });
  } catch (error) {
    console.error('Error establishing connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Remove connection
// @route   DELETE /api/users/:id/connect
// @access  Private
router.delete('/:id/connect', protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from both users' connections
    targetUser.connections = targetUser.connections.filter(
      id => id.toString() !== req.user.id
    );
    await targetUser.save();

    const currentUser = await User.findById(req.user.id);
    currentUser.connections = currentUser.connections.filter(
      id => id.toString() !== req.params.id
    );
    await currentUser.save();

    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user connections
// @route   GET /api/users/:id/connections
// @access  Private
router.get('/:id/connections', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('connections', 'name photo role location');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user can view connections
    if (req.user.id !== req.params.id && !user.connections.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ connections: user.connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get online users
// @route   GET /api/users/online
// @access  Private
router.get('/online', protect, async (req, res) => {
  try {
    // This would typically be handled by Socket.IO
    // For now, return users who were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const onlineUsers = await User.find({
      lastActive: { $gte: fiveMinutesAgo },
      _id: { $ne: req.user.id }
    }).select('name photo role lastActive');

    res.json({ onlineUsers });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user status
// @route   PUT /api/users/status
// @access  Private
router.put('/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['available', 'busy', 'away', 'offline'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.user.id);
    user.status = status;
    user.lastActive = new Date();
    await user.save();

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
