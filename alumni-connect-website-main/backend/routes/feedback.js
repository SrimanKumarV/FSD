const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Feedback = require('../models/Feedback');

// @route   POST /api/feedback
// @desc    Submit new feedback
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { category, rating, subject, message } = req.body;
    if (!category || !rating || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const feedback = await Feedback.create({
      user: req.user._id,
      category,
      rating: Number(rating),
      subject,
      message,
    });
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/feedback/mine
// @desc    Get current user's feedback history
// @access  Private
router.get('/mine', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ feedbacks });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/feedback (admin)
// @desc    Get all feedback (admin only)
// @access  Private/Admin
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status || '';
    const limit = 20;
    const filter = status ? { status } : {};
    
    const feedbacks = await Feedback.find(filter)
      .populate('user', 'name email photo role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Feedback.countDocuments(filter);
    res.json({ feedbacks, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/feedback/:id/status (admin)
// @desc    Update feedback status and optionally reply
// @access  Private/Admin
router.patch('/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { status, adminReply } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(adminReply !== undefined && { adminReply }) },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ feedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
