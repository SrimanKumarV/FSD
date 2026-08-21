const cache = require('../utils/cache');
const fetchWithTimeout = require('../utils/fetchWithTimeout');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Notification = require('../models/Notification');

const getExternalJobs = async ({ category = '', search = '', limit = 20, region = '' }) => {
  // Enforce max limit of 50
  const safeLimit = Math.min(parseInt(limit) || 20, 50);
  
  // Create a unique cache key based on query params
  const cacheKey = `external_jobs_${category}_${search}_${safeLimit}_${region}`;
  const cachedJobs = await cache.get(cacheKey);

  if (cachedJobs) {
    return cachedJobs;
  }

  // Remotive API URL (No key required)
  let apiUrl = `https://remotive.com/api/remote-jobs?limit=${safeLimit}`;
  
  if (category) {
    apiUrl += `&category=${category}`;
  }
  if (search) {
    apiUrl += `&search=${search}`;
  } else if (region === 'india') {
    apiUrl += `&search=India`;
  }

  const response = await fetchWithTimeout(apiUrl);
  const data = await response.json();
  
  // Map Remotive job format to match our internal Job schema closely
  let mappedJobs = data.jobs ? data.jobs.map(job => ({
    _id: `ext_${job.id}`,
    isExternal: true,
    title: job.title,
    company: job.company_name,
    companyLogo: job.company_logo,
    location: job.candidate_required_location || 'Remote',
    isRemote: true,
    jobType: job.job_type === 'full_time' ? 'full-time' : job.job_type || 'full-time',
    category: job.category || 'other',
    description: job.description ? job.description.replace(/<[^>]*>?/gm, '') : '', // HTML content usually
    applicationLink: job.url,
    createdAt: job.publication_date,
    tags: job.tags || [],
    salary: job.salary ? { min: 0, max: 0, currency: job.salary } : undefined
  })) : [];

  if (region === 'india') {
    mappedJobs = mappedJobs.filter(job => job.location.match(/india|worldwide|anywhere|apac/i));
  } else if (region === 'international') {
    mappedJobs = mappedJobs.filter(job => !job.location.toLowerCase().includes('india'));
  }

  const result = {
    jobs: mappedJobs,
    total: data['job-count'] || mappedJobs.length
  };

  // Cache the response for 30 minutes
  await cache.set(cacheKey, result);

  return result;
};

const getInternalJobs = async (filters) => {
  let {
    q, category, location, jobType, isRemote, company, skills,
    experience, salary, page = 1, limit = 10, sort = 'newest'
  } = filters;

  // Enforce limit cap
  limit = Math.min(parseInt(limit) || 10, 50);

  let query = { status: 'active' };
  const skip = (parseInt(page) - 1) * limit;

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
    .limit(limit)
    .sort(sortOption);

  const total = await Job.countDocuments(query);

  return {
    jobs,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      hasNext: parseInt(page) * limit < total,
      hasPrev: parseInt(page) > 1
    }
  };
};

const createJob = async (user, data, io) => {
  if (data.salary && data.salary.min && data.salary.max && data.salary.min > data.salary.max) {
    throw new Error('Minimum salary cannot be greater than maximum salary');
  }

  const job = new Job({
    ...data,
    applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
    postedBy: user.id
  });

  await job.save();
  await job.populate('postedBy', 'name photo role');

  if (io) {
    io.emit('job:new', job);
  }

  return job;
};

const updateJob = async (user, jobId, data, io) => {
  const job = await Job.findById(jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.status = 404;
    throw err;
  }

  if (job.postedBy.toString() !== user.id) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  const allowedFields = [
    'title', 'description', 'company', 'companyLogo', 'companyWebsite',
    'jobType', 'category', 'location', 'isRemote', 'remoteType',
    'requirements', 'skills', 'experience', 'education', 'salary',
    'benefits', 'applicationDeadline', 'applicationLink', 'applicationMethod',
    'contactEmail', 'contactPhone', 'perks', 'workCulture', 'growthOpportunities'
  ];

  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      job[field] = data[field];
    }
  });

  if (job.salary && job.salary.min && job.salary.max && job.salary.min > job.salary.max) {
    throw new Error('Minimum salary cannot be greater than maximum salary');
  }

  await job.save();
  
  if (io) {
    io.emit('job:updated', job);
  }

  return job;
};

const deleteJob = async (user, jobId, io) => {
  const job = await Job.findById(jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.status = 404;
    throw err;
  }

  if (job.postedBy.toString() !== user.id) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  await Job.findByIdAndDelete(jobId);
  
  if (io) {
    io.emit('job:deleted', { jobId });
  }
};

const applyForJob = async (user, jobId, data, io) => {
  const job = await Job.findById(jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.status = 404;
    throw err;
  }

  if (job.status !== 'active') throw new Error('Job is not accepting applications');
  if (job.applicationDeadline && new Date() > job.applicationDeadline) throw new Error('Application deadline has passed');

  const existingApplication = await JobApplication.findOne({ job: job._id, applicant: user.id });
  if (existingApplication) throw new Error('Already applied for this job');

  const { coverLetter, resumeLink } = data;
  const application = new JobApplication({
    job: job._id,
    applicant: user.id,
    coverLetter,
    resumeLink
  });
  await application.save();
  await job.incrementApplications();

  const notification = await Notification.createNotification({
    recipient: job.postedBy,
    sender: user.id,
    type: 'job_application',
    title: 'New Job Application',
    content: `Someone has applied for your job posting: ${job.title}`,
    relatedData: { jobId: job._id }
  });

  if (io) {
    io.to(job.postedBy.toString()).emit('notification:received', notification);
  }

  return application;
};

module.exports = {
  getExternalJobs,
  getInternalJobs,
  createJob,
  updateJob,
  deleteJob,
  applyForJob
};
