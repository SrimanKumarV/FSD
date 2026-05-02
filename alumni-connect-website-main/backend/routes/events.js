const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, alumni, verified, approved } = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all events with filters
// @route   GET /api/events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      q, category, eventType, location, isVirtual, startDate, endDate,
      isFree, page = 1, limit = 10, sort = 'upcoming'
    } = req.query;

    let query = { status: 'published' };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search query
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { organizer: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Filters
    if (category) query.category = category;
    if (eventType) query.eventType = eventType;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (isVirtual !== undefined) query.isVirtual = isVirtual === 'true';
    if (isFree !== undefined) query.isFree = isFree === 'true';

    // Date filters
    if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'upcoming':
        sortOption = { startDate: 1 };
        break;
      case 'recent':
        sortOption = { startDate: -1 };
        break;
      case 'popular':
        sortOption = { registrations: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { startDate: 1 };
    }

    const events = await Event.find(query)
      .populate('organizer', 'name photo role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOption);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name photo role alumniInfo')
      .populate('coOrganizers', 'name photo role');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Increment views
    await event.incrementViews();

    res.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Alumni only)
router.post('/', [protect, alumni, approved], [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('eventType').isIn(['workshop', 'webinar', 'conference', 'meetup', 'hackathon', 'career_fair', 'other']).withMessage('Invalid event type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('timezone').trim().isLength({ min: 1, max: 50 }).withMessage('Timezone is required'),
  body('location').trim().isLength({ min: 2, max: 200 }).withMessage('Location is required'),
  body('isVirtual').isBoolean().withMessage('Virtual status is required'),
  body('category').isIn(['technology', 'business', 'healthcare', 'education', 'finance', 'marketing', 'design', 'career', 'other']).withMessage('Invalid category'),
  body('maxCapacity').optional().isInt({ min: 1 }).withMessage('Max capacity must be positive'),
  body('isRegistrationRequired').isBoolean().withMessage('Registration requirement is required'),
  body('isFree').isBoolean().withMessage('Free status is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('registrationDeadline').optional().isISO8601().withMessage('Invalid registration deadline'),
  body('contactEmail').optional().isEmail().withMessage('Invalid contact email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, eventType, startDate, endDate, timezone, location,
      isVirtual, virtualPlatform, meetingLink, meetingPassword, maxCapacity,
      isRegistrationRequired, registrationDeadline, category, tags, agenda,
      speakers, materials, isFree, price, requirements, whatToBring,
      dressCode, contactEmail, contactPhone, socialLinks
    } = req.body;

    // Validate dates
    if (new Date(startDate) <= new Date()) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    if (registrationDeadline && new Date(registrationDeadline) >= new Date(startDate)) {
      return res.status(400).json({ message: 'Registration deadline must be before start date' });
    }

    const event = new Event({
      title,
      description,
      eventType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timezone,
      location,
      isVirtual,
      virtualPlatform,
      meetingLink,
      meetingPassword,
      organizer: req.user.id,
      maxCapacity,
      isRegistrationRequired,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      category,
      tags,
      agenda,
      speakers,
      materials,
      isFree,
      price,
      requirements,
      whatToBring,
      dressCode,
      contactEmail,
      contactPhone,
      socialLinks
    });

    await event.save();

    // Populate for response
    await event.populate('organizer', 'name photo role');

    res.status(201).json({ event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Event organizer only)
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }),
  body('description').optional().trim().isLength({ min: 20, max: 2000 }),
  body('eventType').optional().isIn(['workshop', 'webinar', 'conference', 'meetup', 'hackathon', 'career_fair', 'other']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('timezone').optional().trim().isLength({ min: 1, max: 50 }),
  body('location').optional().trim().isLength({ min: 2, max: 200 }),
  body('isVirtual').optional().isBoolean(),
  body('category').optional().isIn(['technology', 'business', 'healthcare', 'education', 'finance', 'marketing', 'design', 'career', 'other']),
  body('maxCapacity').optional().isInt({ min: 1 }),
  body('isRegistrationRequired').optional().isBoolean(),
  body('isFree').optional().isBoolean(),
  body('price').optional().isFloat({ min: 0 }),
  body('registrationDeadline').optional().isISO8601(),
  body('contactEmail').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update cancelled event' });
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'eventType', 'startDate', 'endDate', 'timezone',
      'location', 'isVirtual', 'virtualPlatform', 'meetingLink', 'meetingPassword',
      'maxCapacity', 'isRegistrationRequired', 'registrationDeadline', 'category',
      'tags', 'agenda', 'speakers', 'materials', 'isFree', 'price', 'requirements',
      'whatToBring', 'dressCode', 'contactEmail', 'contactPhone', 'socialLinks'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    // Validate dates if updated
    if (event.startDate && event.endDate && new Date(event.endDate) <= new Date(event.startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    await event.save();

    res.json({ event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Event organizer only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await event.remove();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
router.post('/:id/register', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not accepting registrations' });
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    if (event.maxCapacity && event.currentRegistrations >= event.maxCapacity) {
      return res.status(400).json({ message: 'Event is at full capacity' });
    }

    // Check if already registered
    const existingRegistration = event.registrations.find(
      reg => reg.user.toString() === req.user.id
    );

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    await event.registerUser(req.user.id);

    // Create notification for organizer
    await Notification.createNotification({
      recipient: event.organizer,
      sender: req.user.id,
      type: 'event_registration',
      title: 'New Event Registration',
      content: `${req.user.name} has registered for your event: ${event.title}`,
      relatedData: { eventId: event._id }
    });

    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Unregister from event
// @route   DELETE /api/events/:id/register
// @access  Private
router.delete('/:id/register', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.unregisterUser(req.user.id);
    res.json({ message: 'Unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering from event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's registered events
// @route   GET /api/events/registered
// @access  Private
router.get('/registered', protect, async (req, res) => {
  try {
    const registeredEvents = await Event.find({
      'registrations.user': req.user.id
    }).populate('organizer', 'name photo role');

    res.json({ registeredEvents });
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get events organized by user
// @route   GET /api/events/organized
// @access  Private
router.get('/organized', protect, async (req, res) => {
  try {
    const organizedEvents = await Event.find({
      organizer: req.user.id
    }).sort({ startDate: -1 });

    res.json({ organizedEvents });
  } catch (error) {
    console.error('Error fetching organized events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Publish event
// @route   PUT /api/events/:id/publish
// @access  Private (Event organizer only)
router.put('/:id/publish', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await event.publish();
    res.json({ message: 'Event published successfully' });
  } catch (error) {
    console.error('Error publishing event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Cancel event
// @route   PUT /api/events/:id/cancel
// @access  Private (Event organizer only)
router.put('/:id/cancel', protect, [
  body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Cancellation reason is required (10-500 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await event.cancel(req.body.reason);

    // Notify all registered users
    const notificationPromises = event.registrations.map(registration =>
      Notification.createNotification({
        recipient: registration.user,
        sender: req.user.id,
        type: 'event_cancelled',
        title: 'Event Cancelled',
        content: `The event "${event.title}" has been cancelled: ${req.body.reason}`,
        relatedData: { eventId: event._id }
      })
    );

    await Promise.all(notificationPromises);

    res.json({ message: 'Event cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const upcomingEvents = await Event.findUpcoming(parseInt(limit));
    res.json({ upcomingEvents });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get virtual events
// @route   GET /api/events/virtual
// @access  Public
router.get('/virtual', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const virtualEvents = await Event.findVirtual()
      .populate('organizer', 'name photo role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ startDate: 1 });

    const total = await Event.countDocuments({ isVirtual: true, status: 'published' });

    res.json({
      virtualEvents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching virtual events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
