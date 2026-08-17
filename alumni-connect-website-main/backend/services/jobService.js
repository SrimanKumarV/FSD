const cache = require('../utils/cache');
const fetchWithTimeout = require('../utils/fetchWithTimeout');
const Job = require('../models/Job');

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

module.exports = {
  getExternalJobs,
  getInternalJobs
};
