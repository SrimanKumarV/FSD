const escapeRegex = require('../utils/escapeRegex');
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, tag, limit = 20, page = 1 } = req.query;
    
    let query = {};
    
    if (search && typeof search === 'string') {
      const safeSearch = escapeRegex(search.trim());
      query = {
        $or: [
          { title: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } }
        ]
      };
    }
    
    if (tag && typeof tag === 'string') {
      const safeTag = escapeRegex(tag.trim());
      query.tags = { $in: [new RegExp(safeTag, 'i')] };
    }

    const projects = await Project.find(query)
      .populate('user', 'name role photo')
      .populate('teamMembers', 'name photo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      projects,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error in get projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get projects of followers
// @route   GET /api/projects/followers
// @access  Private
router.get('/followers', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find projects where the owner is in the user's followers array
    const projects = await Project.find({ user: { $in: user.followers } })
      .populate('user', 'name role photo')
      .populate('teamMembers', 'name photo')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects,
      total: projects.length,
      pages: 1,
      currentPage: 1
    });
  } catch (error) {
    console.error('Error in get follower projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// @desc    Get projects by user
// @route   GET /api/projects/user/:userId
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const projects = await Project.find({ user: String(req.params.userId) })
      .populate('user', 'name role photo')
      .populate('teamMembers', 'name photo')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error in get user projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('user', 'name role photo headline bio')
      .populate('teamMembers', 'name photo')
      .populate('likes', 'name photo');
      
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error in get single project:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, tags, githubLink, liveLink, thumbnail, teamMembers } = req.body;
    
    // Ensure tags is always a non-empty array
    const safeTags = Array.isArray(tags) && tags.length > 0 ? tags : ['General'];
    
    const project = await Project.create({
      title,
      description,
      tags: safeTags,
      teamMembers: teamMembers || [],
      githubLink,
      liveLink,
      thumbnail,
      user: req.user.id
    });
    
    await project.populate('user', 'name role photo');
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let project = await Project.findById(String(req.params.id));
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Make sure user is project owner
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this project' });
    }
    
    const allowedFields = ['title', 'description', 'tags', 'teamMembers', 'githubLink', 'liveLink', 'thumbnail'];
    const updateData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }
    const safeId = String(req.params.id);
    project = await Project.findByIdAndUpdate(safeId, updateData, {
      new: true,
      runValidators: true
    });
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(String(req.params.id));
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Make sure user is project owner
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this project' });
    }
    
    await project.deleteOne();
    
    res.json({ message: 'Project removed' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Like/Unlike a project
// @route   PUT /api/projects/:id/like
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
  try {
    const project = await Project.findById(String(req.params.id));
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the project has already been liked by this user
    if (project.likes.filter(like => like.toString() === req.user.id).length > 0) {
      // Get remove index
      const removeIndex = project.likes.map(like => like.toString()).indexOf(req.user.id);
      project.likes.splice(removeIndex, 1);
    } else {
      project.likes.unshift(req.user.id);
    }
    
    await project.save();
    
    res.json(project.likes);
  } catch (error) {
    console.error('Error liking project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
