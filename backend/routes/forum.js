const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, verified, approved } = require('../middleware/auth');
const ForumPost = require('../models/ForumPost');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all forum posts with filters
// @route   GET /api/forum
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      q, category, postType, author, tags, status, sort = 'latest',
      page = 1, limit = 10
    } = req.query;

    let query = { status: 'active' };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search query
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Filters
    if (category) query.category = category;
    if (postType) query.postType = postType;
    if (author) query.author = author;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    if (status) query.status = status;

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'most_liked':
        sortOption = { 'likes.length': -1 };
        break;
      case 'most_commented':
        sortOption = { 'comments.length': -1 };
        break;
      case 'trending':
        // Sort by engagement score (views + likes + comments)
        sortOption = { $expr: { $add: ['$views', { $size: '$likes' }, { $size: '$comments' }] } };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const posts = await ForumPost.find(query)
      .populate('author', 'name photo role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOption);

    const total = await ForumPost.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get forum post by ID
// @route   GET /api/forum/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'name photo role bio')
      .populate('comments.author', 'name photo role')
      .populate('comments.replies.author', 'name photo role');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment views
    await post.incrementViews();

    res.json({ post });
  } catch (error) {
    console.error('Error fetching forum post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new forum post
// @route   POST /api/forum
// @access  Private (Verified users only)
router.post('/', [protect, verified], [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('content').trim().isLength({ min: 20, max: 10000 }).withMessage('Content must be 20-10000 characters'),
  body('postType').isIn(['question', 'discussion', 'success_story', 'announcement', 'resource']).withMessage('Invalid post type'),
  body('category').isIn(['career_guidance', 'higher_studies', 'tech_skills', 'industry_insights', 'networking', 'job_search', 'personal_development', 'other']).withMessage('Invalid category'),
  body('tags').isArray({ min: 1, max: 10 }).withMessage('1-10 tags are required'),
  body('isAnonymous').optional().isBoolean().withMessage('Anonymous flag must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, content, postType, category, tags, isAnonymous = false,
      attachments, poll, successStory
    } = req.body;

    const post = new ForumPost({
      title,
      content,
      author: req.user.id,
      postType,
      category,
      tags,
      isAnonymous,
      attachments,
      poll,
      successStory
    });

    await post.save();

    // Populate for response
    await post.populate('author', 'name photo role');

    res.status(201).json({ post });
  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update forum post
// @route   PUT /api/forum/:id
// @access  Private (Post author only)
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('content').optional().trim().isLength({ min: 20, max: 10000 }),
  body('category').optional().isIn(['career_guidance', 'higher_studies', 'tech_skills', 'industry_insights', 'networking', 'job_search', 'personal_development', 'other']),
  body('tags').optional().isArray({ min: 1, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (post.status === 'closed') {
      return res.status(400).json({ message: 'Cannot update closed post' });
    }

    // Update allowed fields
    const allowedFields = ['title', 'content', 'category', 'tags', 'attachments'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    res.json({ post });
  } catch (error) {
    console.error('Error updating forum post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete forum post
// @route   DELETE /api/forum/:id
// @access  Private (Post author or admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await post.remove();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting forum post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Like/unlike forum post
// @route   POST /api/forum/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.isLikedBy(req.user.id);
    
    if (isLiked) {
      await post.unlikePost(req.user.id);
      res.json({ message: 'Post unliked', liked: false });
    } else {
      await post.likePost(req.user.id);
      res.json({ message: 'Post liked', liked: true });
    }
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add comment to forum post
// @route   POST /api/forum/:id/comments
// @access  Private
router.post('/:id/comments', [protect, verified], [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment content is required and must be under 2000 characters'),
  body('parentCommentId').optional().isMongoId().withMessage('Invalid parent comment ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.status === 'closed') {
      return res.status(400).json({ message: 'Cannot comment on closed post' });
    }

    const { content, parentCommentId } = req.body;

    if (parentCommentId) {
      // Adding reply to existing comment
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }

      const reply = {
        author: req.user.id,
        content,
        createdAt: new Date()
      };

      parentComment.replies.push(reply);
    } else {
      // Adding new comment
      const comment = {
        author: req.user.id,
        content,
        createdAt: new Date()
      };

      post.comments.push(comment);
    }

    await post.save();

    // Populate for response
    await post.populate('comments.author', 'name photo role');
    await post.populate('comments.replies.author', 'name photo role');

    res.json({ post });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update comment
// @route   PUT /api/forum/:id/comments/:commentId
// @access  Private (Comment author only)
router.put('/:id/comments/:commentId', protect, [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment content is required and must be under 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await post.save();

    res.json({ post });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete comment
// @route   DELETE /api/forum/:id/comments/:commentId
// @access  Private (Comment author or post author only)
router.delete('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id && post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    comment.remove();
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Like/unlike comment
// @route   POST /api/forum/:id/comments/:commentId/like
// @access  Private
router.post('/:id/comments/:commentId/like', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(req.user.id);
    
    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
    } else {
      comment.likes.push(req.user.id);
    }

    await post.save();

    res.json({ 
      message: isLiked ? 'Comment unliked' : 'Comment liked',
      liked: !isLiked 
    });
  } catch (error) {
    console.error('Error liking/unliking comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark comment as solution
// @route   PUT /api/forum/:id/comments/:commentId/solution
// @access  Private (Post author only)
router.put('/:id/comments/:commentId/solution', protect, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Remove solution flag from all comments
    post.comments.forEach(c => c.isSolution = false);

    // Mark this comment as solution
    comment.isSolution = true;

    await post.save();

    res.json({ message: 'Comment marked as solution' });
  } catch (error) {
    console.error('Error marking comment as solution:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Close/reopen forum post
// @route   PUT /api/forum/:id/status
// @access  Private (Post author only)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status === 'closed') {
      await post.closePost();
    } else {
      await post.reopenPost();
    }

    res.json({ message: `Post ${status} successfully` });
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get featured forum posts
// @route   GET /api/forum/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const featuredPosts = await ForumPost.findFeatured(parseInt(limit));
    res.json({ featuredPosts });
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get posts by category
// @route   GET /api/forum/category/:category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10, sort = 'latest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortOption = {};
    switch (sort) {
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'most_liked':
        sortOption = { 'likes.length': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const posts = await ForumPost.findByCategory(category)
      .populate('author', 'name photo role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOption);

    const total = await ForumPost.countDocuments({ category, status: 'active' });

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Search forum posts
// @route   GET /api/forum/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, category, postType, author, tags, sort = 'relevance', page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchResults = await ForumPost.searchPosts(q, {
      category,
      postType,
      author,
      tags,
      sort,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
