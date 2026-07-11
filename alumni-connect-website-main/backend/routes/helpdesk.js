const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const HelpDesk = require('../models/HelpDesk');

// @route   POST /api/helpdesk
// @desc    Submit a help desk / contact message (auth or public)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    const ticket = await HelpDesk.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || 'General Enquiry',
      message: message.trim(),
      // If the sender is logged in, attach their user ID
      user: req.user?._id || null,
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

    const page = parseInt(req.query.page) || 1;
    const status = req.query.status || '';
    const limit = 20;

    const filter = status ? { status } : {};
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
    const ticket = await HelpDesk.findByIdAndUpdate(
      req.params.id,
      {
        ...(status && { status }),
        ...(adminReply !== undefined && { adminReply }),
        updatedAt: new Date(),
      },
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
