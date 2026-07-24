const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, alumni, student, verified, approved } = require('../middleware/auth');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');
const Notification = require('../models/Notification');

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
      .populate('student', 'name photo role studentInfo')
      .populate('mentor', 'name photo role alumniInfo')
      .sort({ createdAt: -1 });

    res.json({ mentorships });
  } catch (error) {
    console.error('Error fetching mentorships:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get mentorship by ID
// @route   GET /api/mentorship/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id)
      .populate('student', 'name photo role studentInfo')
      .populate('mentor', 'name photo role alumniInfo');

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
// @access  Private (Students only)
router.post('/', [protect, student], [
  body('mentorId').isMongoId().withMessage('Valid mentor ID is required'),
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 20, max: 1000 }).withMessage('Description must be 20-1000 characters'),
  body('focusAreas').isArray({ min: 1 }).withMessage('At least one focus area is required'),
  body('goals').isArray({ min: 1 }).withMessage('At least one goal is required'),
  body('expectedDuration').isIn(['1-3 months', '3-6 months', '6-12 months', '1+ years']).withMessage('Invalid duration'),
  body('communicationMethod').isIn(['email', 'video_call', 'chat', 'in_person']).withMessage('Invalid communication method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mentorId, title, description, focusAreas, goals, expectedDuration, communicationMethod } = req.body;

    // Check if mentor exists and is available
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'alumni') {
      return res.status(400).json({ message: 'Invalid mentor' });
    }

    if (!mentor.isApproved) {
      return res.status(400).json({ message: 'Mentor account not approved' });
    }

    // Check if there's already a pending/active mentorship
    const existingMentorship = await Mentorship.findOne({
      student: req.user.id,
      mentor: mentorId,
      status: { $in: ['pending', 'active'] }
    });

    if (existingMentorship) {
      return res.status(400).json({ message: 'Mentorship request already exists' });
    }

    const mentorship = new Mentorship({
      student: req.user.id,
      mentor: mentorId,
      title,
      description,
      focusAreas,
      goals,
      expectedDuration,
      communicationMethod,
      status: 'pending'
    });

    await mentorship.save();

    // Populate for response
    await mentorship.populate('student', 'name photo role');
    await mentorship.populate('mentor', 'name photo role');

    // Create notification for mentor
    await Notification.createNotification({
      recipient: mentorId,
      sender: req.user.id,
      type: 'mentorship_request',
      title: 'New Mentorship Request',
      content: `${req.user.name} has requested mentorship from you`,
      relatedData: { mentorshipId: mentorship._id }
    });

    res.status(201).json({ mentorship });
  } catch (error) {
    console.error('Error creating mentorship request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update mentorship status
// @route   PUT /api/mentorship/:id/status
// @access  Private (Mentor only)
router.put('/:id/status', [protect, alumni], [
  body('status').isIn(['accepted', 'rejected', 'active', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, reason } = req.body;
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship request not found' });
    }

    if (mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = mentorship.status;
    mentorship.status = status;
    
    if (reason) {
      mentorship.statusHistory.push({
        status,
        changedBy: req.user.id,
        reason,
        changedAt: new Date()
      });
    }

    if (status === 'active' && oldStatus === 'accepted') {
      mentorship.startDate = new Date();
    } else if (status === 'completed') {
      mentorship.endDate = new Date();
    }

    await mentorship.save();

    // Create notification for student
    await Notification.createNotification({
      recipient: mentorship.student,
      sender: req.user.id,
      type: 'mentorship_status_update',
      title: 'Mentorship Status Updated',
      content: `Your mentorship request has been ${status}`,
      relatedData: { mentorshipId: mentorship._id }
    });

    res.json({ mentorship });
  } catch (error) {
    console.error('Error updating mentorship status:', error);
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

// @desc    Get available mentors
// @route   GET /api/mentorship/mentors
// @access  Private
router.get('/mentors', protect, async (req, res) => {
  try {
    const { skills, industry, location, availability } = req.query;
    let query = { role: 'alumni', isApproved: true };

    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillArray };
    }

    if (industry) {
      query['alumniInfo.industry'] = { $regex: industry, $options: 'i' };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (availability === 'available') {
      query.status = 'available';
    }

    const mentors = await User.find(query)
      .select('name photo bio skills location alumniInfo status')
      .sort({ name: 1 });

    res.json({ mentors });
  } catch (error) {
    console.error('Error fetching mentors:', error);
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

module.exports = router;
