const express = require('express');
const router = express.Router();
const { TechAssistanceQuestion, TechAssistanceReply } = require('../models/TechHub');
const { protect } = require('../middleware/auth');

// @route   POST /api/tech-hub/questions
// @desc    Create a new question
// @access  Private
router.post('/questions', protect, async (req, res) => {
  try {
    const { title, description, techStack } = req.body;

    const newQuestion = new TechAssistanceQuestion({
      author: req.user._id,
      title,
      description,
      techStack
    });

    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tech-hub/questions
// @desc    Get all questions
// @access  Private
router.get('/questions', protect, async (req, res) => {
  try {
    const questions = await TechAssistanceQuestion.find()
      .populate('author', 'name photo role')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tech-hub/questions/:id
// @desc    Get question by ID with replies
// @access  Private
router.get('/questions/:id', protect, async (req, res) => {
  try {
    const question = await TechAssistanceQuestion.findById(req.params.id)
      .populate('author', 'name photo role')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'name photo role' }
      });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.views += 1;
    await question.save();

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tech-hub/questions/:id/replies
// @desc    Add a reply to a question
// @access  Private
router.post('/questions/:id/replies', protect, async (req, res) => {
  try {
    const { content } = req.body;

    const newReply = new TechAssistanceReply({
      questionId: req.params.id,
      author: req.user._id,
      content
    });

    await newReply.save();
    
    // Award Gamification Points for replying
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { $inc: { rewardPoints: 10 } });

    res.status(201).json(newReply);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
