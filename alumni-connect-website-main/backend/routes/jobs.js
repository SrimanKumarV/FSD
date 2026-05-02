const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, alumni, verified, approved } = require('../middleware/auth');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      q, category, location, jobType, isRemote, company, skills,
      experience, salary, page = 1, limit = 10, sort = 'newest'
    } = req.query;

    let query = { status: 'active' };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search query
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Filters
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (jobType) query.jobType = jobType;
    if (isRemote !== undefined) query.isRemote = isRemote === 'true';
    if (company) query.company = { $regex: company, $options: 'i' };
    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillArray };
    }
    if (experience) query.experience = experience;
    if (salary) {
      const [min, max] = salary.split('-').map(s => parseInt(s));
      if (min && max) {
        query.salary = { $gte: min, $lte: max };
      } else if (min) {
        query.salary = { $gte: min };
      } else if (max) {
        query.salary = { $lte: max };
      }
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'salary_high':
        sortOption = { 'salary.max': -1 };
        break;
      case 'salary_low':
        sortOption = { 'salary.min': 1 };
        break;
      case 'deadline':
        sortOption = { applicationDeadline: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name photo')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOption);

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name photo role alumniInfo');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment views
    await job.incrementViews();

    res.json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new job posting
// @route   POST /api/jobs
// @access  Private (Alumni only)
router.post('/', [protect, alumni, approved], [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 50, max: 5000 }).withMessage('Description must be 50-5000 characters'),
  body('company').trim().isLength({ min: 2, max: 100 }).withMessage('Company name is required'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']).withMessage('Invalid job type'),
  body('category').isIn(['technology', 'business', 'healthcare', 'education', 'finance', 'marketing', 'design', 'other']).withMessage('Invalid category'),
  body('location').trim().isLength({ min: 2, max: 100 }).withMessage('Location is required'),
  body('isRemote').isBoolean().withMessage('Remote status is required'),
  body('requirements').isArray({ min: 1 }).withMessage('At least one requirement is required'),
  body('skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
  body('experience').isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']).withMessage('Invalid experience level'),
  body('education').optional().isIn(['high_school', 'bachelor', 'master', 'phd', 'other']).withMessage('Invalid education level'),
  body('salary.min').optional().isInt({ min: 0 }).withMessage('Minimum salary must be positive'),
  body('salary.max').optional().isInt({ min: 0 }).withMessage('Maximum salary must be positive'),
  body('applicationDeadline').optional().isISO8601().withMessage('Invalid deadline date'),
  body('applicationLink').optional().isURL().withMessage('Invalid application link'),
  body('contactEmail').optional().isEmail().withMessage('Invalid contact email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, company, companyLogo, companyWebsite, jobType, category,
      location, isRemote, remoteType, requirements, skills, experience, education,
      salary, benefits, applicationDeadline, applicationLink, applicationMethod,
      contactEmail, contactPhone, perks, workCulture, growthOpportunities
    } = req.body;

    // Validate salary range
    if (salary && salary.min && salary.max && salary.min > salary.max) {
      return res.status(400).json({ message: 'Minimum salary cannot be greater than maximum salary' });
    }

    const job = new Job({
      title,
      description,
      company,
      companyLogo,
      companyWebsite,
      jobType,
      category,
      location,
      isRemote,
      remoteType,
      requirements,
      skills,
      experience,
      education,
      salary,
      benefits,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
      applicationLink,
      applicationMethod,
      postedBy: req.user.id,
      contactEmail,
      contactPhone,
      perks,
      workCulture,
      growthOpportunities
    });

    await job.save();

    // Populate for response
    await job.populate('postedBy', 'name photo role');

    res.status(201).json({ job });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update job posting
// @route   PUT /api/jobs/:id
// @access  Private (Job poster only)
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }),
  body('description').optional().trim().isLength({ min: 50, max: 5000 }),
  body('company').optional().trim().isLength({ min: 2, max: 100 }),
  body('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
  body('category').optional().isIn(['technology', 'business', 'healthcare', 'education', 'finance', 'marketing', 'design', 'other']),
  body('location').optional().trim().isLength({ min: 2, max: 100 }),
  body('isRemote').optional().isBoolean(),
  body('requirements').optional().isArray({ min: 1 }),
  body('skills').optional().isArray({ min: 1 }),
  body('experience').optional().isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']),
  body('education').optional().isIn(['high_school', 'bachelor', 'master', 'phd', 'other']),
  body('salary.min').optional().isInt({ min: 0 }),
  body('salary.max').optional().isInt({ min: 0 }),
  body('applicationDeadline').optional().isISO8601(),
  body('applicationLink').optional().isURL(),
  body('contactEmail').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'company', 'companyLogo', 'companyWebsite',
      'jobType', 'category', 'location', 'isRemote', 'remoteType',
      'requirements', 'skills', 'experience', 'education', 'salary',
      'benefits', 'applicationDeadline', 'applicationLink', 'applicationMethod',
      'contactEmail', 'contactPhone', 'perks', 'workCulture', 'growthOpportunities'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    // Validate salary range
    if (job.salary && job.salary.min && job.salary.max && job.salary.min > job.salary.max) {
      return res.status(400).json({ message: 'Minimum salary cannot be greater than maximum salary' });
    }

    await job.save();

    res.json({ job });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete job posting
// @route   DELETE /api/jobs/:id
// @access  Private (Job poster only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await job.remove();
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private
router.post('/:id/apply', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ message: 'Job is not accepting applications' });
    }

    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    // Check if already applied
    if (job.applications.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Increment applications count
    await job.incrementApplications();

    // Create notification for job poster
    await Notification.createNotification({
      recipient: job.postedBy,
      sender: req.user.id,
      type: 'job_application',
      title: 'New Job Application',
      content: `Someone has applied for your job posting: ${job.title}`,
      relatedData: { jobId: job._id }
    });

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Save/unsave a job
// @route   POST /api/jobs/:id/save
// @access  Private
router.post('/:id/save', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const isSaved = job.savedBy.includes(req.user.id);
    
    if (isSaved) {
      await job.unsaveJob(req.user.id);
      res.json({ message: 'Job removed from saved list' });
    } else {
      await job.saveJob(req.user.id);
      res.json({ message: 'Job saved successfully' });
    }
  } catch (error) {
    console.error('Error saving/unsaving job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get saved jobs for user
// @route   GET /api/jobs/saved
// @access  Private
router.get('/saved', protect, async (req, res) => {
  try {
    const savedJobs = await Job.find({
      _id: { $in: req.user.savedJobs || [] },
      status: 'active'
    }).populate('postedBy', 'name photo');

    res.json({ savedJobs });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get jobs posted by user
// @route   GET /api/jobs/my-posts
// @access  Private
router.get('/my-posts', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id })
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    console.error('Error fetching user jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Close/reopen a job
// @route   PUT /api/jobs/:id/status
// @access  Private (Job poster only)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status === 'closed') {
      await job.closeJob();
    } else {
      await job.reopenJob();
    }

    res.json({ message: `Job ${status} successfully` });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get job statistics
// @route   GET /api/jobs/stats
// @access  Private (Job poster only)
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = {
      views: job.views,
      applications: job.applications.length,
      savedCount: job.savedBy.length,
      daysPosted: Math.ceil((Date.now() - job.createdAt) / (1000 * 60 * 60 * 24))
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
