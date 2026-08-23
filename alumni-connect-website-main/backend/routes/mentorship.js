const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, alumni, student, verified, approved } = require('../middleware/auth');
const Mentorship = require('../models/Mentorship');
const MentorshipSession = require('../models/MentorshipSession');
const User = require('../models/User');
const Notification = require('../models/Notification');
const MentorReward = require('../models/MentorReward');
const { isHoliday } = require('../utils/holidays');
const { getMentors, autoAssignMentor, createMentorshipRequest, updateMentorshipStatus } = require('../services/mentorshipService');
// @desc    Get all mentorship requests for a user
// @route   GET /api/mentorship
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = {};

    if (req.user.role === 'alumni') {
      query.mentor = req.user.id;
    } else {
      query.student = req.user.id;
    }

    if (status) query.status = status;
    if (type === 'active') query.status = { $in: ['active', 'pending'] };
    if (type === 'completed') query.status = 'completed';
    if (type === 'cancelled') query.status = 'cancelled';

    const mentorships = await Mentorship.find(query)
      .populate('student', 'name email photo role studentInfo')
      .populate('mentor', 'name email photo role alumniInfo')
      .sort({ createdAt: -1 });

    res.json({ mentorships });
  } catch (error) {
    console.error('Error fetching mentorships:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// @desc    Get available mentors
// @route   GET /api/mentorship/mentors
// @access  Private
router.get('/mentors', protect, async (req, res) => {
  try {
    const { skills, industry, location, availability } = req.query;
    // Determine target role based on current user's role
    const targetRole = req.user.role === 'alumni' ? 'student' : 'alumni';
    let query = { role: targetRole };

    const currentUser = await User.findById(req.user.id);
    
    const mentors = await getMentors(currentUser, {
      skills,
      industry,
      location,
      availability,
      targetRole
    });

    res.json({ mentors });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get mentor leaderboard
// @route   GET /api/mentorship/leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const topMentors = await User.find({ role: 'alumni', 'alumniInfo.studentsPlaced': { $gt: 0 } })
      .select('name email photo alumniInfo bio location')
      .sort({ 'alumniInfo.studentsPlaced': -1 })
      .limit(10);
    res.json({ topMentors });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get mentorship by ID
// @route   GET /api/mentorship/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id)
      .populate('student', 'name email photo role studentInfo')
      .populate('mentor', 'name email photo role alumniInfo');

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship request not found' });
    }

    // Check if user has access to this mentorship
    if (mentorship.student._id.toString() !== req.user.id && 
        mentorship.mentor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ mentorship });
  } catch (error) {
    console.error('Error fetching mentorship:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create mentorship request
// @route   POST /api/mentorship
// @access  Private
router.post('/', [protect], [
  body('targetUserId').isMongoId().withMessage('Valid target user ID is required'),
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 20, max: 1000 }).withMessage('Description must be 20-1000 characters'),
  body('focusAreas').isArray({ min: 1 }).withMessage('At least one focus area is required'),
  body('goals').isArray({ min: 1 }).withMessage('At least one goal is required'),
  body('expectedDuration').isNumeric().withMessage('Invalid duration in weeks'),
  body('communicationMethod').isIn(['email', 'video_call', 'chat', 'in_person']).withMessage('Invalid communication method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const io = req.app.get('io');
    const mentorship = await createMentorshipRequest(req.user, req.body, io);
    res.status(201).json({ mentorship });
  } catch (error) {
    console.error('Error creating mentorship request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Auto-assign best mentor for student
// @route   POST /api/mentorship/auto-assign
// @access  Private (Student only)
router.post('/auto-assign', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can auto-assign mentors' });
    }

    const studentUser = await User.findById(req.user.id);
    const college = studentUser.college;
    if (!college) {
      return res.status(400).json({ message: 'College information missing from your profile.' });
    }

    const mentorship = await autoAssignMentor(req.user.id, college);

    if (!mentorship) {
      return res.status(404).json({ message: 'All mentors from your college are currently at full capacity or you already have a mentor.' });
    }

    res.json({ success: true, message: 'Mentor auto-assigned successfully!', mentorship });
  } catch (error) {
    console.error('Error auto-assigning mentor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @desc    Update mentorship status
// @route   PUT /api/mentorship/:id/status
// @access  Private
router.put('/:id/status', [protect], [
  body('status').isIn(['accepted', 'rejected', 'active', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const io = req.app.get('io');
    const mentorship = await updateMentorshipStatus(req.user, req.params.id, req.body, io);
    res.json({ mentorship });
  } catch (error) {
    console.error('Error updating mentorship status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Submit student feedback + rating for a completed mentorship
// @route   POST /api/mentorship/:id/feedback
// @access  Private (Student only)
router.post('/:id/feedback', [protect], [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('review').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the student can give feedback' });
    }
    if (mentorship.status !== 'completed') {
      return res.status(400).json({ message: 'Feedback can only be given after mentorship is completed' });
    }
    if (mentorship.feedbackGiven) {
      return res.status(400).json({ message: 'Feedback already submitted for this mentorship' });
    }

    const { rating, review } = req.body;
    mentorship.feedback.studentRating = rating;
    mentorship.feedback.studentReview = review || '';
    mentorship.feedback.submittedAt = new Date();
    mentorship.feedbackGiven = true;
    await mentorship.save();

    // Award MentorReward feedback points
    try {
      const mentor = await User.findById(mentorship.mentor).select('college');
      await MentorReward.addPoints(mentorship.mentor, 'feedback', rating, mentor?.college || '');
    } catch (e) { console.error('MentorReward feedback error:', e.message); }

    res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get mentor reward leaderboard
// @route   GET /api/mentorship/rewards/leaderboard
// @access  Private
router.get('/rewards/leaderboard', protect, async (req, res) => {
  try {
    const { college } = req.query;
    const filter = college ? { college } : {};

    const records = await MentorReward.find({ ...filter, totalPoints: { $gt: 0 } })
      .sort({ totalPoints: -1 })
      .limit(50)
      .populate('mentor', 'name photo college alumniInfo.company alumniInfo.position alumniInfo.industry');

    const leaderboard = records
      .filter(r => r.mentor) // skip deleted users
      .map((r, index) => ({
        rank: index + 1,
        mentorId: r.mentor._id,
        name: r.mentor.name,
        photo: r.mentor.photo,
        college: r.mentor.college || r.college,
        company: r.mentor.alumniInfo?.company,
        position: r.mentor.alumniInfo?.position,
        industry: r.mentor.alumniInfo?.industry,
        totalPoints: r.totalPoints,
        breakdown: r.breakdown
      }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Reward leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add milestone to mentorship
// @route   POST /api/mentorship/:id/milestones
// @access  Private (Mentor only)
router.post('/:id/milestones', [protect, alumni], [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('points').optional().isInt({ min: 1, max: 100 }).withMessage('Points must be 1-100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const milestone = {
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      points: req.body.points || 10,
      createdAt: new Date()
    };

    mentorship.progress.milestones.push(milestone);
    await mentorship.save();

    // Create notification for student
    await Notification.createNotification({
      recipient: mentorship.student,
      sender: req.user.id,
      type: 'new_milestone',
      title: 'New Milestone Added',
      content: `A new milestone "${req.body.title}" has been added to your mentorship`,
      relatedData: { mentorshipId: mentorship._id }
    });

    res.json({ mentorship });
  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Complete milestone
// @route   PUT /api/mentorship/:id/milestones/:milestoneId
// @access  Private (Student only)
router.put('/:id/milestones/:milestoneId', [protect, student], [
  body('notes').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const milestone = mentorship.progress.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    milestone.isCompleted = true;
    milestone.completedAt = new Date();
    milestone.notes = req.body.notes;

    await mentorship.save();

    res.json({ mentorship });
  } catch (error) {
    console.error('Error completing milestone:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add note to mentorship
// @route   POST /api/mentorship/:id/notes
// @access  Private
router.post('/:id/notes', protect, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Note content is required and must be under 1000 characters'),
  body('type').isIn(['general', 'feedback', 'suggestion', 'question']).withMessage('Invalid note type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.student.toString() !== req.user.id && 
        mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const note = {
      author: req.user.id,
      content: req.body.content,
      type: req.body.type,
      createdAt: new Date()
    };

    mentorship.progress.notes.push(note);
    await mentorship.save();

    res.json({ mentorship });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// @desc    Update mentor availability
// @route   PUT /api/mentorship/availability
// @access  Private (Alumni only)
router.put('/availability', [protect, alumni], [
  body('isAvailable').isBoolean().withMessage('Availability status is required'),
  body('expertise').optional().isArray().withMessage('Expertise must be an array'),
  body('maxMentees').optional().isInt({ min: 1, max: 10 }).withMessage('Max mentees must be 1-10'),
  body('availabilityNotes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    user.status = req.body.isAvailable ? 'available' : 'busy';
    
    if (req.body.expertise) {
      user.alumniInfo.expertise = req.body.expertise;
    }
    
    if (req.body.maxMentees) {
      user.alumniInfo.maxMentees = req.body.maxMentees;
    }
    
    if (req.body.availabilityNotes) {
      user.alumniInfo.availabilityNotes = req.body.availabilityNotes;
    }

    await user.save();

    res.json({ user: user.toObject() });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Cancel mentorship
// @route   PUT /api/mentorship/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, [
  body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Cancellation reason is required (10-500 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.student.toString() !== req.user.id && 
        mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (mentorship.status === 'cancelled') {
      return res.status(400).json({ message: 'Mentorship is already cancelled' });
    }

    mentorship.status = 'cancelled';
    mentorship.cancellationReason = req.body.reason;
    mentorship.cancelledBy = req.user.id;
    mentorship.cancelledAt = new Date();

    mentorship.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user.id,
      reason: req.body.reason,
      changedAt: new Date()
    });

    await mentorship.save();

    // Create notification for the other party
    const recipientId = mentorship.student.toString() === req.user.id ? 
      mentorship.mentor : mentorship.student;

    await Notification.createNotification({
      recipient: recipientId,
      sender: req.user.id,
      type: 'mentorship_cancelled',
      title: 'Mentorship Cancelled',
      content: `The mentorship "${mentorship.title}" has been cancelled`,
      relatedData: { mentorshipId: mentorship._id }
    });

    res.json({ mentorship });
  } catch (error) {
    console.error('Error cancelling mentorship:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Book a 1:1 session
// @route   POST /api/mentorship/sessions
// @access  Private
router.post('/sessions', protect, [
  body('mentorId').isMongoId().withMessage('Valid mentor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').trim().notEmpty().withMessage('Time slot is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mentorId, date, time } = req.body;
    
    // Check if mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'alumni') {
      return res.status(400).json({ message: 'Valid mentor not found' });
    }

    // Check if date is a public holiday
    const isPublicHoliday = await isHoliday(date, mentor.country || 'IN');
    if (isPublicHoliday) {
      return res.status(400).json({ message: 'Mentorship sessions cannot be scheduled on public holidays in the mentor\'s country.' });
    }

    const session = new MentorshipSession({
      mentor: mentorId,
      student: req.user.id,
      date,
      time,
      status: 'pending'
    });

    await session.save();
    await session.populate('mentor', 'name email photo');
    await session.populate('student', 'name email photo');

    await Notification.createNotification({
      recipient: mentorId,
      sender: req.user.id,
      type: 'mentorship_session',
      title: 'New Session Request',
      content: `${req.user.name} has booked a 1:1 session with you`,
      relatedData: { sessionId: session._id }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(mentorId.toString()).emit('mentorship:session_booked', { session });
    }

    res.status(201).json({ session, message: 'Session booked successfully' });
  } catch (error) {
    console.error('Error booking session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
