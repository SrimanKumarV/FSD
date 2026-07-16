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
    
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }

    const projects = await Project.find(query)
      .populate('user', 'name role avatar')
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

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('user', 'name role avatar headline bio')
      .populate('likes', 'name avatar');
      
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Increment view count
    project.views += 1;
    await project.save();
    
    res.json(project);
  } catch (error) {
    console.error('Error in get single project:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get projects by user
// @route   GET /api/projects/user/:userId
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const projects = await Project.find({ user: req.params.userId })
      .populate('user', 'name role avatar')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error in get user projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, tags, githubLink, liveLink, thumbnail } = req.body;
    
    const project = await Project.create({
      title,
      description,
      tags: tags || [],
      githubLink,
      liveLink,
      thumbnail,
      user: req.user.id
    });
    
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
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Make sure user is project owner
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this project' });
    }
    
    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
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
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Make sure user is project owner
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this project' });
    }
    
    await project.remove();
    
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
    const project = await Project.findById(req.params.id);
    
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
