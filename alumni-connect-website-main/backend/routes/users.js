const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, verified, approved, canAccessResource } = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Mentorship = require('../models/Mentorship');
const Job = require('../models/Job');
const Event = require('../models/Event');
const ForumPost = require('../models/ForumPost');
const Message = require('../models/Message');
const sendEmail = require('../utils/sendEmail');

// @desc    Get dashboard stats and activities
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // 1. Fetch Stats
    let stats = [];
    if (role === 'student') {
      const mentorshipCount = await Mentorship.countDocuments({ student: userId });
      const jobsAppliedCount = await Job.countDocuments({ 'applications.applicant': userId });
      const eventsCount = await Event.countDocuments({ attendees: userId });
      const forumPostsCount = await ForumPost.countDocuments({ author: userId });

      stats = [
        { name: 'Mentorship Requests', value: mentorshipCount, change: '+1', changeType: 'increase', iconName: 'Users', color: 'alumni' },
        { name: 'Job Applications', value: jobsAppliedCount, change: '+2', changeType: 'increase', iconName: 'Briefcase', color: 'student' },
        { name: 'Events Registered', value: eventsCount, change: '+1', changeType: 'increase', iconName: 'Calendar', color: 'primary' },
        { name: 'Forum Posts', value: forumPostsCount, change: '+3', changeType: 'increase', iconName: 'MessageSquare', color: 'success' }
      ];
    } else {
      // Alumni stats
      const mentorshipsCount = await Mentorship.countDocuments({ mentor: userId });
      const jobsPostedCount = await Job.countDocuments({ postedBy: userId });
      const eventsCount = await Event.countDocuments({ attendees: userId });
      const forumPostsCount = await ForumPost.countDocuments({ author: userId });

      stats = [
        { name: 'Mentorship Requests', value: mentorshipsCount, change: '+2', changeType: 'increase', iconName: 'Users', color: 'alumni' },
        { name: 'Jobs Posted', value: jobsPostedCount, change: '+1', changeType: 'increase', iconName: 'Briefcase', color: 'student' },
        { name: 'Events Registered', value: eventsCount, change: '+1', changeType: 'increase', iconName: 'Calendar', color: 'primary' },
        { name: 'Forum Posts', value: forumPostsCount, change: '+2', changeType: 'increase', iconName: 'MessageSquare', color: 'success' }
      ];
    }

    // 2. Fetch Recent Activities (Notifications)
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(4);

    const recentActivities = notifications.map(notif => {
      let iconName = 'Info';
      if (notif.type.includes('mentorship')) iconName = 'Users';
      if (notif.type.includes('job')) iconName = 'Briefcase';
      if (notif.type.includes('event')) iconName = 'Calendar';
      if (notif.type.includes('forum')) iconName = 'MessageSquare';

      return {
        id: notif._id,
        type: notif.type,
        title: notif.title,
        description: notif.content,
        time: new Date(notif.createdAt).toLocaleDateString(),
        status: notif.isRead ? 'read' : 'unread',
        iconName: iconName
      };
    });

    // 3. Fetch Upcoming Events
    const upcomingEventsData = await Event.find({
      attendees: userId,
      startDate: { $gte: new Date() }
    })
      .sort({ startDate: 1 })
      .limit(3);

    const upcomingEvents = upcomingEventsData.map(ev => ({
      id: ev._id,
      title: ev.title,
      date: new Date(ev.startDate).toLocaleString(),
      host: ev.organizer?.name || 'Organizer',
      type: ev.eventType
    }));

    res.json({ stats, recentActivities, upcomingEvents });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
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

    let query = { 
      _id: { $ne: req.user.id },
      isVerified: true 
    }; // Exclude current user and require verification

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
  body('socialLinks.linkedin').optional({ checkFalsy: true }).isURL(),
  body('socialLinks.github').optional({ checkFalsy: true }).isURL(),
  body('socialLinks.twitter').optional({ checkFalsy: true }).isURL(),
  body('socialLinks.website').optional({ checkFalsy: true }).isURL()
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
    const allowedFields = ['name', 'bio', 'skills', 'location', 'socialLinks', 'photo'];
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

// @desc    Get user connections, followers, and following
// @route   GET /api/users/:id/connections
// @access  Private
router.get('/:id/connections', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('connections', 'name email photo role location studentInfo alumniInfo')
      .populate('followers', 'name email photo role location studentInfo alumniInfo')
      .populate('following', 'name email photo role location studentInfo alumniInfo')
      .populate('followRequests', 'name email photo role location studentInfo alumniInfo');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      connections: user.connections,
      followers: user.followers,
      following: user.following,
      followRequests: user.followRequests
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser._id.toString() === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself' });

    if (!targetUser.followers) targetUser.followers = [];
    if (!targetUser.followRequests) targetUser.followRequests = [];

    if (targetUser.followers.some(id => id.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Already following' });
    }
    
    if (targetUser.followRequests.some(id => id.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Follow request already sent' });
    }

    targetUser.followRequests.push(req.user.id);
    await targetUser.save();

    // Create notification
    await Notification.createNotification({
      recipient: targetUser._id,
      sender: req.user.id,
      type: 'follow_request',
      title: 'New Follow Request',
      content: `${req.user.name} wants to follow you`,
      relatedData: { userId: req.user.id }
    });

    res.json({ message: 'Follow request sent successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Accept follow request
// @route   POST /api/users/:id/accept-follow
// @access  Private
router.post('/:id/accept-follow', protect, async (req, res) => {
  try {
    const requesterId = req.params.id;
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser.followRequests) currentUser.followRequests = [];
    if (!currentUser.followers) currentUser.followers = [];

    const hasRequest = currentUser.followRequests.some(id => id.toString() === requesterId);
    if (!hasRequest) {
      return res.status(400).json({ message: 'No follow request found' });
    }

    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
    if (!currentUser.followers.some(id => id.toString() === requesterId)) {
      currentUser.followers.push(requesterId);
    }
    await currentUser.save();

    const requesterUser = await User.findById(requesterId);
    if (requesterUser) {
      if (!requesterUser.following) requesterUser.following = [];
      if (!requesterUser.following.some(id => id.toString() === currentUser._id.toString())) {
        requesterUser.following.push(currentUser._id);
        await requesterUser.save();
      }
      
      await Notification.createNotification({
        recipient: requesterId,
        sender: currentUser._id,
        type: 'follow_accept',
        title: 'Follow Request Accepted',
        content: `${currentUser.name} accepted your follow request`,
        relatedData: { connectionUserId: currentUser._id }
      });
    }

    res.json({ message: 'Follow request accepted' });
  } catch (error) {
    console.error('Accept follow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Decline follow request
// @route   POST /api/users/:id/decline-follow
// @access  Private
router.post('/:id/decline-follow', protect, async (req, res) => {
  try {
    const requesterId = req.params.id;
    const currentUser = await User.findById(req.user.id);
    
    if (currentUser.followRequests) {
      currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
      await currentUser.save();
      
      await Notification.createNotification({
        recipient: requesterId,
        sender: currentUser._id,
        type: 'follow_decline',
        title: 'Follow Request Declined',
        content: `${currentUser.name} declined your follow request`,
        relatedData: { connectionUserId: currentUser._id }
      });
    }

    res.json({ message: 'Follow request declined' });
  } catch (error) {
    console.error('Decline follow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Unfollow a user
// @route   POST /api/users/:id/unfollow
// @access  Private
router.post('/:id/unfollow', protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser.followers) {
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.user.id);
      await targetUser.save();
    }

    const currentUser = await User.findById(req.user.id);
    if (currentUser.following) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
      await currentUser.save();
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
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
      _id: { $ne: req.user.id },
      isVerified: true
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

// @desc    Request account deletion (Sends OTP)
// @route   POST /api/users/delete-request
// @access  Private
router.post('/delete-request', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.deleteAccountOtp = otp;
    user.deleteAccountExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const message = `
      <h1>Account Deletion Request</h1>
      <p>You requested to delete your Alumnex Connect account.</p>
      <p>Your 6-digit verification code is: <strong style="color:red">${otp}</strong></p>
      <p>This code is valid for 15 minutes.</p>
      <p>If you did not request this, please change your password immediately.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Alumnex Connect - Account Deletion OTP',
      message
    });

    res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete account permanently
// @route   DELETE /api/users/me
// @access  Private
router.delete('/me', [
  protect,
  body('otp', 'OTP is required').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { otp } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.deleteAccountOtp !== otp || user.deleteAccountExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const userId = user._id;

    // 1. Delete all forum posts authored by user
    await ForumPost.deleteMany({ author: userId });

    // 2. Remove user from likes and comments in other posts
    await ForumPost.updateMany({}, { 
      $pull: { 
        likes: userId, 
        dislikes: userId,
        comments: { author: userId } 
      } 
    });

    // 3. Delete messages
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

    // 4. Delete mentorships
    await Mentorship.deleteMany({ $or: [{ mentor: userId }, { student: userId }] });

    // 5. Delete notifications
    await Notification.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });

    // 6. Remove user from all connections/followers arrays across all other users
    await User.updateMany({}, {
      $pull: {
        connections: userId,
        followers: userId,
        following: userId,
        followRequests: userId
      }
    });

    // Finally delete user
    await user.remove();

    res.json({ message: 'Account permanently deleted' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
