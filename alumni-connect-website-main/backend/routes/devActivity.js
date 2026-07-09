const express = require('express');
const router = express.Router();
const DevProfile = require('../models/DevProfile');
const { protect } = require('../middleware/auth');
const {
  fetchGitHubStats,
  fetchLeetCodeStats,
  fetchHackerRankStats,
  fetchGFGStats
} = require('../utils/devStatsFetcher');

// @route   GET /api/dev-activity/:email
// @desc    Get dev activity stats for a user
// @access  Private
router.get('/:email', protect, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find or create profile
    let profile = await DevProfile.findOne({ email });
    
    if (!profile) {
      return res.status(404).json({ message: 'Developer profile not found or no usernames linked yet' });
    }

    // Check if we need to fetch new stats (cache for 2 hours)
    const CACHE_HOURS = 2;
    const now = new Date();
    const isCacheValid = profile.lastUpdated && (now - profile.lastUpdated) < (CACHE_HOURS * 60 * 60 * 1000);

    if (isCacheValid) {
      return res.json({
        usernames: profile.usernames,
        stats: profile.stats,
        lastUpdated: profile.lastUpdated,
        fromCache: true
      });
    }

    // Fetch new stats concurrently
    const [githubStats, leetcodeStats, hackerrankStats, gfgStats] = await Promise.all([
      fetchGitHubStats(profile.usernames.github),
      fetchLeetCodeStats(profile.usernames.leetcode),
      fetchHackerRankStats(profile.usernames.hackerrank),
      fetchGFGStats(profile.usernames.gfg)
    ]);

    // Update profile
    if (githubStats) profile.stats.github = githubStats;
    if (leetcodeStats) profile.stats.leetcode = leetcodeStats;
    if (hackerrankStats) profile.stats.hackerrank = hackerrankStats;
    if (gfgStats) profile.stats.gfg = gfgStats;
    
    profile.lastUpdated = now;
    
    // Mark stats as modified because they use Mixed type
    profile.markModified('stats');
    
    await profile.save();

    res.json({
      usernames: profile.usernames,
      stats: profile.stats,
      lastUpdated: profile.lastUpdated,
      fromCache: false
    });

  } catch (error) {
    console.error('Error fetching dev activity:', error);
    res.status(500).json({ message: 'Server error fetching dev activity' });
  }
});

// @route   POST /api/dev-activity/usernames
// @desc    Save developer usernames
// @access  Private
router.post('/usernames', protect, async (req, res) => {
  try {
    const { github, leetcode, hackerrank, gfg } = req.body;
    const userEmail = req.user.email;
    const userId = req.user._id;

    // Find or create profile
    let profile = await DevProfile.findOne({ email: userEmail });
    
    if (!profile) {
      profile = new DevProfile({
        user: userId,
        email: userEmail,
        usernames: {},
        stats: {}
      });
    }

    // Clean usernames (remove @ or full urls if user pasted them)
    const cleanUsername = (input) => {
      if (!input) return '';
      let str = input.trim();
      if (str.startsWith('@')) str = str.substring(1);
      if (str.includes('/')) {
        const parts = str.split('/');
        str = parts[parts.length - 1] || parts[parts.length - 2];
      }
      return str;
    };

    profile.usernames = {
      github: cleanUsername(github) || profile.usernames.github,
      leetcode: cleanUsername(leetcode) || profile.usernames.leetcode,
      hackerrank: cleanUsername(hackerrank) || profile.usernames.hackerrank,
      gfg: cleanUsername(gfg) || profile.usernames.gfg
    };

    // Force refresh next time by clearing lastUpdated
    profile.lastUpdated = null;
    
    await profile.save();

    res.json({ message: 'Usernames saved successfully', usernames: profile.usernames });
  } catch (error) {
    console.error('Error saving developer usernames:', error);
    res.status(500).json({ message: 'Server error saving usernames' });
  }
});

module.exports = router;
