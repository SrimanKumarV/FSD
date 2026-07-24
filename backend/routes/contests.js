const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, alumni, verified, approved } = require('../middleware/auth');
const Contest = require('../models/Contest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all contests with filters
// @route   GET /api/contests
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      q, contestType, category, status, difficulty, page = 1, limit = 10, sort = 'upcoming'
    } = req.query;

    let query = { isPublic: true };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search query
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Filters
    if (contestType) query.contestType = contestType;
    if (category) query.category = category;
    if (status) query.status = status;
    if (difficulty) {
      query['problems.difficulty'] = difficulty;
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'upcoming':
        sortOption = { startDate: 1 };
        break;
      case 'ongoing':
        sortOption = { startDate: -1 };
        break;
      case 'popular':
        sortOption = { currentParticipants: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { startDate: 1 };
    }

    const contests = await Contest.find(query)
      .populate('organizer', 'name photo role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOption);

    const total = await Contest.countDocuments(query);

    res.json({
      contests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get contest by ID
// @route   GET /api/contests/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('organizer', 'name photo role alumniInfo')
      .populate('participants.user', 'name photo role');

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check if user is registered
    let isRegistered = false;
    let userSubmission = null;
    
    if (req.user) {
      const participant = contest.participants.find(p => p.user.toString() === req.user.id);
      if (participant) {
        isRegistered = true;
        userSubmission = participant;
      }
    }

    res.json({ contest, isRegistered, userSubmission });
  } catch (error) {
    console.error('Error fetching contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new contest
// @route   POST /api/contests
// @access  Private (Alumni only)
router.post('/', [protect, alumni, approved], [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('contestType').isIn(['practice', 'competitive', 'hackathon', 'workshop']).withMessage('Invalid contest type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('duration').isInt({ min: 30, max: 1440 }).withMessage('Duration must be 30-1440 minutes'),
  body('problems').isArray({ min: 1 }).withMessage('At least one problem is required'),
  body('problems.*.title').trim().isLength({ min: 3, max: 100 }).withMessage('Problem title must be 3-100 characters'),
  body('problems.*.description').trim().isLength({ min: 10, max: 5000 }).withMessage('Problem description must be 10-5000 characters'),
  body('problems.*.difficulty').isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Invalid difficulty level'),
  body('problems.*.points').isInt({ min: 1, max: 1000 }).withMessage('Points must be 1-1000'),
  body('problems.*.timeLimit').isInt({ min: 1, max: 60 }).withMessage('Time limit must be 1-60 seconds'),
  body('problems.*.memoryLimit').isInt({ min: 16, max: 512 }).withMessage('Memory limit must be 16-512 MB'),
  body('problems.*.testCases').isArray({ min: 1 }).withMessage('At least one test case is required'),
  body('problems.*.sampleInput').trim().isLength({ min: 1, max: 1000 }).withMessage('Sample input is required'),
  body('problems.*.sampleOutput').trim().isLength({ min: 1, max: 1000 }).withMessage('Sample output is required'),
  body('maxParticipants').optional().isInt({ min: 10, max: 10000 }).withMessage('Max participants must be 10-10000'),
  body('isRegistrationRequired').isBoolean().withMessage('Registration requirement is required'),
  body('isPublic').isBoolean().withMessage('Public status is required'),
  body('allowPractice').isBoolean().withMessage('Practice mode status is required'),
  body('showLeaderboard').isBoolean().withMessage('Leaderboard visibility is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, contestType, startDate, endDate, duration, problems,
      rules, scoringSystem, penalty, isRegistrationRequired, maxParticipants,
      prizes, isPublic, allowPractice, showLeaderboard, tags, category
    } = req.body;

    // Validate dates
    if (new Date(startDate) <= new Date()) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const contest = new Contest({
      title,
      description,
      organizer: req.user.id,
      contestType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration,
      problems,
      rules,
      scoringSystem,
      penalty,
      isRegistrationRequired,
      maxParticipants,
      prizes,
      isPublic,
      allowPractice,
      showLeaderboard,
      tags,
      category
    });

    await contest.save();

    // Populate for response
    await contest.populate('organizer', 'name photo role');

    res.status(201).json({ contest });
  } catch (error) {
    console.error('Error creating contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update contest
// @route   PUT /api/contests/:id
// @access  Private (Contest organizer only)
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }),
  body('description').optional().trim().isLength({ min: 20, max: 2000 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('duration').optional().isInt({ min: 30, max: 1440 }),
  body('isPublic').optional().isBoolean(),
  body('allowPractice').optional().isBoolean(),
  body('showLeaderboard').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (contest.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (contest.status === 'ongoing' || contest.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update ongoing or completed contest' });
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'startDate', 'endDate', 'duration',
      'rules', 'isPublic', 'allowPractice', 'showLeaderboard', 'tags'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        contest[field] = req.body[field];
      }
    });

    // Validate dates if updated
    if (contest.startDate && contest.endDate && new Date(contest.endDate) <= new Date(contest.startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    await contest.save();

    res.json({ contest });
  } catch (error) {
    console.error('Error updating contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete contest
// @route   DELETE /api/contests/:id
// @access  Private (Contest organizer only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (contest.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (contest.status === 'ongoing' || contest.status === 'completed') {
      return res.status(400).json({ message: 'Cannot delete ongoing or completed contest' });
    }

    await contest.remove();
    res.json({ message: 'Contest deleted successfully' });
  } catch (error) {
    console.error('Error deleting contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Register for contest
// @route   POST /api/contests/:id/register
// @access  Private
router.post('/:id/register', protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (contest.status !== 'upcoming') {
      return res.status(400).json({ message: 'Contest is not accepting registrations' });
    }

    if (contest.isRegistrationRequired && contest.maxParticipants && 
        contest.currentParticipants >= contest.maxParticipants) {
      return res.status(400).json({ message: 'Contest is at full capacity' });
    }

    // Check if already registered
    const existingParticipant = contest.participants.find(
      p => p.user.toString() === req.user.id
    );

    if (existingParticipant) {
      return res.status(400).json({ message: 'Already registered for this contest' });
    }

    await contest.registerParticipant(req.user.id);

    // Create notification for organizer
    await Notification.createNotification({
      recipient: contest.organizer,
      sender: req.user.id,
      type: 'contest_registration',
      title: 'New Contest Registration',
      content: `${req.user.name} has registered for your contest: ${contest.title}`,
      relatedData: { contestId: contest._id }
    });

    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error registering for contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Unregister from contest
// @route   DELETE /api/contests/:id/register
// @access  Private
router.delete('/:id/register', protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (contest.status === 'ongoing' || contest.status === 'completed') {
      return res.status(400).json({ message: 'Cannot unregister from ongoing or completed contest' });
    }

    await contest.unregisterParticipant(req.user.id);
    res.json({ message: 'Unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering from contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Submit solution
// @route   POST /api/contests/:id/submit
// @access  Private
router.post('/:id/submit', protect, async (req, res) => {
  // Validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Additional validation for contest ID mismatch
  if (req.body.contestId && req.body.contestId !== req.params.id) {
    return res.status(400).json({ message: 'Contest ID mismatch' });
  }

  // Validate required fields
  if (!req.body.problemId || !mongoose.Types.ObjectId.isValid(req.body.problemId)) {
    return res.status(400).json({ message: 'Valid problem ID is required' });
  }

  if (!req.body.language || !['c', 'cpp', 'java', 'python', 'javascript'].includes(req.body.language)) {
    return res.status(400).json({ message: 'Invalid programming language' });
  }

  if (!req.body.code || req.body.code.trim().length === 0 || req.body.code.length > 100000) {
    return res.status(400).json({ message: 'Code is required and must be under 100KB' });
  }
  try {

    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (contest.status !== 'ongoing') {
      return res.status(400).json({ message: 'Contest is not active' });
    }

    // Check if user is registered
    const participant = contest.participants.find(p => p.user.toString() === req.user.id);
    if (!participant) {
      return res.status(400).json({ message: 'Not registered for this contest' });
    }

    const { problemId, language, code } = req.body;

    // Find the problem
    const problem = contest.problems.id(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // TODO: Integrate with Judge0 API for code execution
    // For now, create a placeholder submission
    const submission = {
      problemId,
      language,
      code,
      submittedAt: new Date(),
      status: 'pending', // pending, running, accepted, wrong_answer, time_limit, memory_limit, runtime_error
      executionTime: null,
      memoryUsed: null,
      testCasesPassed: 0,
      totalTestCases: problem.testCases.length
    };

    participant.submissions.push(submission);
    await contest.save();

    // TODO: Send to Judge0 for execution
    // const result = await executeCode(code, language, problem.testCases);

    res.json({ message: 'Submission received', submission });
  } catch (error) {
    console.error('Error submitting solution:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get contest leaderboard
// @route   GET /api/contests/:id/leaderboard
// @access  Public
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (!contest.showLeaderboard) {
      return res.status(403).json({ message: 'Leaderboard is not visible' });
    }

    // Sort participants by score and time
    const leaderboard = contest.participants
      .filter(p => p.totalScore > 0)
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return a.totalTime - b.totalTime;
      })
      .slice(0, 100); // Top 100

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Start contest
// @route   PUT /api/contests/:id/start
// @access  Private (Contest organizer only)
router.put('/:id/start', protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (contest.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (contest.status !== 'upcoming') {
      return res.status(400).json({ message: 'Contest cannot be started' });
    }

    await contest.startContest();
    res.json({ message: 'Contest started successfully' });
  } catch (error) {
    console.error('Error starting contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    End contest
// @route   PUT /api/contests/:id/end
// @access  Private (Contest organizer only)
router.put('/:id/end', protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (contest.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (contest.status !== 'ongoing') {
      return res.status(400).json({ message: 'Contest cannot be ended' });
    }

    await contest.endContest();
    res.json({ message: 'Contest ended successfully' });
  } catch (error) {
    console.error('Error ending contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get upcoming contests
// @route   GET /api/contests/upcoming
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const upcomingContests = await Contest.findUpcoming(parseInt(limit));
    res.json({ upcomingContests });
  } catch (error) {
    console.error('Error fetching upcoming contests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get ongoing contests
// @route   GET /api/contests/ongoing
// @access  Public
router.get('/ongoing', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const ongoingContests = await Contest.findOngoing(parseInt(limit));
    res.json({ ongoingContests });
  } catch (error) {
    console.error('Error fetching ongoing contests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
