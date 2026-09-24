const cron = require('node-cron');
const User = require('../models/User');
const Project = require('../models/Project');
const Job = require('../models/Job');
const Event = require('../models/Event');
const sendEmail = require('../utils/sendEmail');
const { getWeeklyEngagementTemplate } = require('../utils/emailTemplates');

/**
 * Run the weekly engagement & inactivity digest job
 * Can be called by cron schedule, admin route, or CLI script
 * 
 * @param {Object} options
 * @param {boolean} [options.forceAll=false] - Ignore lastEngagementEmailSent check
 * @param {string} [options.testEmail=null] - Only send to a specific test email
 * @param {boolean} [options.dryRun=false] - Simulate run without sending emails
 * @param {number} [options.delayMs=250] - Throttling delay between emails
 * @returns {Promise<Object>} Summary of run results
 */
const runWeeklyEngagementJob = async ({ 
  forceAll = false, 
  testEmail = null, 
  dryRun = false,
  delayMs = 250 
} = {}) => {
  const startTime = Date.now();
  console.log(`[Weekly Digest] Starting job (dryRun: ${dryRun}, forceAll: ${forceAll}, testEmail: ${testEmail || 'none'})...`);

  const results = {
    success: true,
    totalEligible: 0,
    sentCount: 0,
    skippedCount: 0,
    failedCount: 0,
    inactiveUsersCount: 0,
    errors: [],
    durationMs: 0
  };

  try {
    const now = Date.now();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000);

    // 1. Fetch dynamic platform highlights
    // Active jobs (prefer recent, fallback to latest active)
    let recentJobs = await Job.find({ status: 'active', createdAt: { $gte: oneWeekAgo } })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    if (recentJobs.length === 0) {
      recentJobs = await Job.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
    }

    // Projects (prefer recent, fallback to latest)
    let recentProjects = await Project.find({ createdAt: { $gte: oneWeekAgo } })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    if (recentProjects.length === 0) {
      recentProjects = await Project.find()
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
    }

    // Upcoming published events
    const upcomingEvents = await Event.find({ 
      status: 'published', 
      startDate: { $gte: new Date() } 
    })
      .sort({ startDate: 1 })
      .limit(3)
      .lean();

    // Featured mentors
    const featuredMentors = await User.find({ 
      role: 'alumni', 
      'alumniInfo.availableForMentorship': true 
    })
      .select('name department alumniInfo')
      .limit(3)
      .lean();

    const envUrl = process.env.PORTAL_URL || process.env.FRONTEND_URL;
    let portalUrl = 'https://alumnex-connect.onrender.com';
    if (envUrl) {
      const urls = envUrl.split(',').map(u => u.trim().replace(/\/+$/, ''));
      const prod = urls.find(u => u.startsWith('https://'));
      portalUrl = prod || (urls[0] && !urls[0].includes('localhost') ? urls[0] : 'https://alumnex-connect.onrender.com');
    }

    const dynamicData = {
      recentJobs,
      recentProjects,
      upcomingEvents,
      featuredMentors,
      portalUrl
    };

    // 2. Fetch target users
    let query = { isActive: true };

    if (testEmail) {
      query.email = testEmail.toLowerCase().trim();
    } else {
      // Respect user's weekly digest preference (default is true if not explicitly set to false)
      query['emailPreferences.weeklyDigest'] = { $ne: false };
    }

    let users = await User.find(query).select('name email role lastActive lastEngagementEmailSent emailPreferences college department');

    // If testEmail was specified but doesn't exist in DB, create a temporary preview recipient
    if (testEmail && users.length === 0) {
      users = [{
        name: 'Test Administrator',
        email: testEmail.toLowerCase().trim(),
        role: 'student',
        lastActive: new Date(now - 10 * 24 * 60 * 60 * 1000), // simulate 10 days inactive
        emailPreferences: { weeklyDigest: true }
      }];
    }

    results.totalEligible = users.length;
    console.log(`[Weekly Digest] Found ${users.length} eligible recipients.`);

    // 3. Process each user with safe throttling
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Check for inactivity (lastActive < 7 days ago or missing)
      const lastActiveTime = user.lastActive ? new Date(user.lastActive).getTime() : 0;
      const isInactive = !user.lastActive || (now - lastActiveTime) >= 7 * 24 * 60 * 60 * 1000;
      const daysInactive = user.lastActive 
        ? Math.floor((now - lastActiveTime) / (24 * 60 * 60 * 1000))
        : 7;

      if (isInactive) {
        results.inactiveUsersCount++;
      }

      // Skip if already sent within the past 6 days, unless forceAll or testEmail
      if (!forceAll && !testEmail && user.lastEngagementEmailSent) {
        const lastSentTime = new Date(user.lastEngagementEmailSent).getTime();
        if (lastSentTime >= sixDaysAgo.getTime()) {
          results.skippedCount++;
          continue;
        }
      }

      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const subject = isInactive
        ? `👋 We missed you on Alumnex Connect! Here's your weekly catch-up`
        : `⚡ Your Alumnex Connect Weekly Pulse & Opportunities (${dateStr})`;

      const htmlMessage = getWeeklyEngagementTemplate(user, dynamicData, isInactive, daysInactive);

      if (dryRun) {
        console.log(`[Weekly Digest Dry-Run] Would send to ${user.email} (Inactive: ${isInactive}, Days: ${daysInactive})`);
        results.sentCount++;
      } else {
        try {
          const sendRes = await sendEmail({
            email: user.email,
            subject: subject,
            message: htmlMessage
          });

          if (sendRes && sendRes.success !== false) {
            results.sentCount++;
            console.log(`[Weekly Digest] [${results.sentCount}/${users.length}] Successfully dispatched to ${user.email} (${isInactive ? 'Inactive' : 'Active'})`);

            // Update user's lastEngagementEmailSent if user exists in DB
            if (user._id && !testEmail) {
              await User.findByIdAndUpdate(user._id, { 
                lastEngagementEmailSent: new Date() 
              }).catch(e => console.warn('Failed to update lastEngagementEmailSent:', e.message));
            }
          } else {
            results.failedCount++;
            results.errors.push({ email: user.email, error: sendRes?.error || 'Send returned false' });
          }
        } catch (err) {
          results.failedCount++;
          results.errors.push({ email: user.email, error: err.message });
          console.error(`[Weekly Digest] Error sending to ${user.email}:`, err.message);
        }

        // Delay between emails to respect provider rate limits
        if (delayMs > 0 && i < users.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    results.durationMs = Date.now() - startTime;
    console.log(`[Weekly Digest] Job completed in ${results.durationMs}ms. Sent: ${results.sentCount}, Inactive: ${results.inactiveUsersCount}, Failed: ${results.failedCount}, Skipped: ${results.skippedCount}`);
    return results;
  } catch (error) {
    console.error('[Weekly Digest] Critical job error:', error);
    results.success = false;
    results.error = error.message;
    results.durationMs = Date.now() - startTime;
    return results;
  }
};

/**
 * Initialize the cron schedule
 * Production: Every Monday at 10:00 AM (0 10 * * 1)
 */
const initEngagementCron = () => {
  // Cron schedule: "0 10 * * 1" is Every Monday at 10:00 AM
  const scheduleStr = process.env.WEEKLY_DIGEST_CRON || '0 10 * * 1';
  
  cron.schedule(scheduleStr, async () => {
    console.log(`[CRON] Triggering scheduled weekly engagement job (${scheduleStr})...`);
    await runWeeklyEngagementJob();
  });

  console.log(`[CRON] Weekly engagement digest scheduled: "${scheduleStr}" (Mondays 10:00 AM)`);
};

module.exports = initEngagementCron;
module.exports.runWeeklyEngagementJob = runWeeklyEngagementJob;
