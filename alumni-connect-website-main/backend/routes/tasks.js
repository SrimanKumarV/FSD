const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all active mandatory tasks for the current user
// @route   GET /api/tasks/my-tasks
// @access  Private
router.get('/my-tasks', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Find tasks that match the user's role or 'all'
    const targetAudiences = ['all', user.role];
    const tasks = await Task.find({
      isActive: true,
      targetAudience: { $in: targetAudiences },
      _id: { $nin: user.completedTasks || [] }
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark a task as completed
// @route   POST /api/tasks/:id/complete
// @access  Private
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const taskId = req.params.id;
    const user = await User.findById(req.user.id);
    
    if (!user.completedTasks) {
      user.completedTasks = [];
    }
    
    if (!user.completedTasks.includes(taskId)) {
      user.completedTasks.push(taskId);
      await User.updateOne({ _id: user._id }, { $set: { completedTasks: user.completedTasks } });
    }
    
    res.json({ success: true, message: 'Task marked as completed' });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- ADMIN ROUTES ---

// @desc    Get all tasks (Admin)
// @route   GET /api/tasks
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a new mandatory task
// @route   POST /api/tasks
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, description, actionText, actionUrl, targetAudience, taskType, isActive } = req.body;
    
    const task = new Task({
      title,
      description,
      actionText,
      actionUrl,
      targetAudience: targetAudience || 'all',
      taskType: taskType || 'generic',
      isActive: isActive !== undefined ? isActive : true
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    await task.remove();
    
    // Also remove this task from all users' completedTasks
    await User.updateMany(
      { completedTasks: req.params.id },
      { $pull: { completedTasks: req.params.id } }
    );
    
    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
