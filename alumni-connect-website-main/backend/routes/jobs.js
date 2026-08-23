const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, alumni, verified, approved } = require('../middleware/auth');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const User = require('../models/User');
const Notification = require('../models/Notification');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { callAIWithFallback } = require('../utils/aiHelper');

const { getExternalJobs, getInternalJobs, createJob, updateJob, deleteJob, applyForJob } = require('../services/jobService');

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const result = await getInternalJobs(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// @desc    Get external jobs from free Remotive API
// @route   GET /api/jobs/external
// @access  Public
router.get('/external', async (req, res) => {
  try {
    const result = await getExternalJobs(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error fetching external jobs:', error);
    res.status(500).json({ message: 'Failed to fetch external jobs' });
  }
});

// Configure multer for memory storage
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// @desc    Parse resume via Groq AI
// @route   POST /api/jobs/parse-resume
// @access  Private
router.post('/parse-resume', protect, memUpload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file uploaded' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim() === '') {
      return res.status(400).json({ message: 'Could not extract text from the PDF' });
    }

    const systemPrompt = "You are a resume parsing AI. Extract the following from the provided text into a strict JSON object: { \"name\": \"string\", \"skills\": [\"string\"], \"experience\": \"string summary\", \"education\": \"string degree\" }. Respond ONLY with JSON.";
    const userPrompt = `Resume text:\n\n${resumeText.substring(0, 4000)}`;

    let aiResponse = await callAIWithFallback([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], systemPrompt, true);

    aiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) aiResponse = jsonMatch[0];

    const parsedData = JSON.parse(aiResponse);
    res.json(parsedData);
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ message: 'Failed to parse resume' });
  }
});

// @desc    Create new job posting
// @route   POST /api/jobs
// @access  Private (Alumni only)
router.post('/', [protect, alumni, approved], [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 50, max: 5000 }).withMessage('Description must be 50-5000 characters'),
  body('company').trim().isLength({ min: 2, max: 100 }).withMessage('Company name is required'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance', 'referral']).withMessage('Invalid job type'),
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

    const io = req.app.get('io');
    const job = await createJob(req.user, req.body, io);
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
  body('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance', 'referral']),
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

    const io = req.app.get('io');
    const job = await updateJob(req.user, req.params.id, req.body, io);
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
    const io = req.app.get('io');
    await deleteJob(req.user, req.params.id, io);
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
    const io = req.app.get('io');
    const application = await applyForJob(req.user, req.params.id, req.body, io);
    res.json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get current user's job applications
// @route   GET /api/jobs/applications/me
// @access  Private
router.get('/applications/me', protect, async (req, res) => {
  try {
    const applications = await JobApplication.find({ applicant: req.user.id })
      .populate('job', 'title company companyLogo location jobType status')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get applicants for a specific job
// @route   GET /api/jobs/:id/applications
// @access  Private
router.get('/:id/applications', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const applications = await JobApplication.find({ job: job._id })
      .populate('applicant', 'name photo email headline skills')
      .sort({ createdAt: -1 });
      
    res.json({ applications });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update application status
// @route   PUT /api/jobs/applications/:appId/status
// @access  Private
router.put('/applications/:appId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await JobApplication.findById(req.params.appId).populate('job');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = status;
    await application.save();

    // Notify applicant
    const notification = await Notification.createNotification({
      recipient: application.applicant,
      sender: req.user.id,
      type: 'job_application_status',
      title: 'Application Status Updated',
      content: `Your application for ${application.job.title} is now ${status}.`,
      relatedData: { jobId: application.job._id, applicationId: application._id }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(application.applicant.toString()).emit('notification:received', notification);
    }

    res.json({ application });
  } catch (error) {
    console.error('Error updating application status:', error);
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
      applications: job.applications, // now just returning the number
      savedCount: job.savedBy.length,
      daysPosted: Math.ceil((Date.now() - job.createdAt) / (1000 * 60 * 60 * 24))
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching job stats:', error);
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

module.exports = router;
