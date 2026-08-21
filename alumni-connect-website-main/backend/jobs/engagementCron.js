const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Job = require('../models/Job');
const sendEmail = require('../utils/sendEmail');
const { getDevPulseDigestTemplate } = require('../utils/emailTemplates');

// Helper to run weekly (or based on schedule)
// "0 10 * * 1" is Every Monday at 10 AM. We'll use this.
// For testing purposes, you can use "*/5 * * * *" for every 5 mins, but production should be weekly.

const initEngagementCron = () => {
  cron.schedule('0 10 * * 1', async () => {
    console.log('[CRON] Running weekly Dev Pulse engagement job...');
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Find all users who are active and have DevPulse enabled
      const usersToNotify = await User.find({ 
        isActive: true,
        'emailPreferences.devPulse': true
      });

      if (usersToNotify.length === 0) return;

      // Collect globally relevant new items (can be optimized per department/college in a real massive scale app)
      const recentProjects = await Project.find({ createdAt: { $gte: oneWeekAgo } })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(5);
        
      const recentJobs = await Job.find({ createdAt: { $gte: oneWeekAgo }, status: 'active' })
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      if (recentProjects.length === 0 && recentJobs.length === 0) {
        console.log('[CRON] No new activities to report this week.');
        return; // Nothing to notify
      }

      console.log(`[CRON] Found ${recentProjects.length} projects and ${recentJobs.length} jobs. Sending to ${usersToNotify.length} users.`);

      // Dispatch emails
      for (const user of usersToNotify) {
        await sendEmail({
          email: user.email,
          subject: 'Your Weekly Dev Pulse ⚡',
          message: getDevPulseDigestTemplate(user, recentProjects, recentJobs)
        }).catch(err => console.error(`Failed to send DevPulse to ${user.email}:`, err));
      }
      
      console.log('[CRON] Weekly Dev Pulse job completed successfully.');
    } catch (err) {
      console.error('[CRON] Dev Pulse job failed:', err);
    }
  });
};

module.exports = initEngagementCron;
