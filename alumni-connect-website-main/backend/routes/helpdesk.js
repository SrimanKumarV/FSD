const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { helpdeskLimiter } = require('../middleware/rateLimiters');
const HelpDesk = require('../models/HelpDesk');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_STATUSES = new Set(['open', 'in-progress', 'resolved', 'closed']);

// @route   POST /api/helpdesk
// @desc    Submit a help desk / contact message (auth or public)
// @access  Public (rate-limited)
router.post('/', helpdeskLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'A valid name is required.' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ message: 'Name cannot exceed 100 characters.' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }
    if (email.trim().length > 150) {
      return res.status(400).json({ message: 'Email address cannot exceed 150 characters.' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'A message is required.' });
    }
    if (message.trim().length > 3000) {
      return res.status(400).json({ message: 'Message cannot exceed 3000 characters.' });
    }

    const safeSubject = typeof subject === 'string' && subject.trim().length > 0
      ? subject.trim().slice(0, 200)
      : 'General Enquiry';

    const ticket = await HelpDesk.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: safeSubject,
      message: message.trim(),
      // If the sender is logged in, attach their user ID
      user: req.user?._id || req.user?.id || null,
    });

    res.status(201).json({ message: 'Your message has been received. We will get back to you soon!', ticket });
  } catch (error) {
    console.error('HelpDesk submit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/helpdesk (admin only)
// @desc    Get all help desk tickets
// @access  Private/Admin
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 50);
    const rawStatus = req.query.status;

    const filter = {};
    if (rawStatus && typeof rawStatus === 'string' && VALID_STATUSES.has(rawStatus)) {
      filter.status = rawStatus;
    }

    const tickets = await HelpDesk.find(filter)
      .populate('user', 'name email photo role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await HelpDesk.countDocuments(filter);
    res.json({ tickets, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('HelpDesk fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/helpdesk/:id
// @desc    Update ticket status and/or reply
// @access  Private/Admin
router.patch('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { status, adminReply } = req.body;

    const updateFields = { updatedAt: new Date() };

    if (status !== undefined) {
      if (typeof status !== 'string' || !VALID_STATUSES.has(status)) {
        return res.status(400).json({ message: 'Invalid ticket status.' });
      }
      updateFields.status = status;
    }

    if (adminReply !== undefined) {
      if (typeof adminReply === 'string') {
        updateFields.adminReply = adminReply.trim().slice(0, 3000);
      } else if (adminReply === null) {
        updateFields.adminReply = null;
      }
    }

    const ticket = await HelpDesk.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate('user', 'name email photo role');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/helpdesk/:id (admin only)
// @desc    Delete a ticket
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    await HelpDesk.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
