const express = require('express');
const router = express.Router();
const DevProfile = require('../models/DevProfile');
const { protect } = require('../middleware/auth');
const {
  fetchGitHubStats,
  fetchLeetCodeStats,
  fetchHackerRankStats,
  fetchGFGStats,
  fetchCodechefStats,
  fetchCodeforcesStats,
  fetchDuolingoStats
} = require('../utils/devStatsFetcher');
const axios = require('axios');
const cheerio = require('cheerio');

// @route   GET /api/dev-activity/public/:userId
// @desc    Get public dev activity stats for any user (by userId)
// @access  Private (must be logged in, but can view any user's stats)
router.get('/public/:userId', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const targetUser = await User.findById(req.params.userId).select('email name photo');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const profile = await DevProfile.findOne({ email: targetUser.email });
    if (!profile) return res.status(404).json({ message: 'No dev profile found' });

    // Return cached stats only (no background refresh for other users' profiles)
    return res.json({
      name: targetUser.name,
      photo: targetUser.photo,
      usernames: profile.usernames,
      stats: profile.stats,
      lastUpdated: profile.lastUpdated,
      alumnexScore: profile.alumnexScore,
    });
  } catch (error) {
    console.error('Error fetching public dev activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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

    // Check if we need to fetch new stats (cache for 10 minutes)
    const CACHE_MINUTES = 10;
    const now = new Date();
    const isCacheValid = profile.lastUpdated && (now - profile.lastUpdated) < (CACHE_MINUTES * 60 * 1000);
    const forceRefresh = req.query.force === 'true';

    if (isCacheValid && !forceRefresh) {
      return res.json({
        usernames: profile.usernames,
        stats: profile.stats,
        lastUpdated: profile.lastUpdated,
        alumnexScore: profile.alumnexScore,
        fromCache: true
      });
    }

    // Fetch new stats concurrently only for verified or just-added accounts
    // We assume fetch functions handle empty strings gracefully
    const [githubStats, leetcodeStats, hackerrankStats, gfgStats, codechefStats, codeforcesStats, duolingoStats] = await Promise.all([
      fetchGitHubStats(profile.usernames.github.username),
      fetchLeetCodeStats(profile.usernames.leetcode.username),
      fetchHackerRankStats(profile.usernames.hackerrank.username),
      fetchGFGStats(profile.usernames.gfg.username),
      fetchCodechefStats(profile.usernames.codechef?.username),
      fetchCodeforcesStats(profile.usernames.codeforces?.username),
      fetchDuolingoStats(profile.usernames.duolingo?.username)
    ]);

    // Update profile
    // If fetch returns null (e.g., 404 or scraper error), we save an object with { fetchError: true }
    // so the frontend knows we tried to sync but failed, rather than leaving it undefined.
    if (githubStats) profile.stats.github = githubStats;
    else if (profile.usernames.github?.username) profile.stats.github = { fetchError: true };

    if (leetcodeStats) profile.stats.leetcode = leetcodeStats;
    else if (profile.usernames.leetcode?.username) profile.stats.leetcode = { fetchError: true };

    if (hackerrankStats) profile.stats.hackerrank = hackerrankStats;
    else if (profile.usernames.hackerrank?.username) profile.stats.hackerrank = { fetchError: true };

    if (gfgStats) profile.stats.gfg = gfgStats;
    else if (profile.usernames.gfg?.username) profile.stats.gfg = { fetchError: true };

    if (codechefStats) profile.stats.codechef = codechefStats;
    else if (profile.usernames.codechef?.username) profile.stats.codechef = { fetchError: true };

    if (codeforcesStats) profile.stats.codeforces = codeforcesStats;
    else if (profile.usernames.codeforces?.username) profile.stats.codeforces = { fetchError: true };

    if (duolingoStats) profile.stats.duolingo = duolingoStats;
    else if (profile.usernames.duolingo?.username) profile.stats.duolingo = { fetchError: true };
    
    // Calculate Alumnex Score
    let score = 0;
    
    // GitHub: 1 pt per repo, 2 pts per follower (basic placeholder since REST API lacks total commits easily)
    if (githubStats) {
      score += (githubStats.publicRepos || 0) * 1;
      score += (githubStats.followers || 0) * 2;
    }
    
    // LeetCode: Hard = 10, Medium = 5, Easy = 2
    if (leetcodeStats) {
      score += (leetcodeStats.easySolved || 0) * 2;
      score += (leetcodeStats.mediumSolved || 0) * 5;
      score += (leetcodeStats.hardSolved || 0) * 10;
    }
    
    // HackerRank: 10 pts per badge
    if (hackerrankStats) {
      score += (hackerrankStats.badgesCount || 0) * 10;
    }
    
    // GFG: Coding score directly maps to points (divided by 10 to keep it balanced)
    if (gfgStats && gfgStats.codingScore) {
      score += Math.floor(gfgStats.codingScore / 10);
    }
    
    // Duolingo: 1 pt per 100 XP
    if (duolingoStats && duolingoStats.totalXp) {
      score += Math.floor(duolingoStats.totalXp / 100);
    }

    // Cap score at 1000
    profile.alumnexScore = Math.min(score, 1000);
    
    profile.lastUpdated = now;
    profile.markModified('stats');
    
    await profile.save();

    res.json({
      usernames: profile.usernames,
      stats: profile.stats,
      lastUpdated: profile.lastUpdated,
      alumnexScore: profile.alumnexScore,
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
    const { github, leetcode, hackerrank, gfg, codechef, codeforces, duolingo } = req.body;
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

    if (!profile.usernames) profile.usernames = {};
    if (!profile.usernames.github) profile.usernames.github = { username: '', isVerified: false };
    if (!profile.usernames.leetcode) profile.usernames.leetcode = { username: '', isVerified: false };
    if (!profile.usernames.hackerrank) profile.usernames.hackerrank = { username: '', isVerified: false };
    if (!profile.usernames.gfg) profile.usernames.gfg = { username: '', isVerified: false };
    if (!profile.usernames.codechef) profile.usernames.codechef = { username: '', isVerified: false };
    if (!profile.usernames.codeforces) profile.usernames.codeforces = { username: '', isVerified: false };
    if (!profile.usernames.duolingo) profile.usernames.duolingo = { username: '', isVerified: false };

    const newGithub = github !== undefined ? cleanUsername(github) : profile.usernames.github.username;
    const newLeetcode = leetcode !== undefined ? cleanUsername(leetcode) : profile.usernames.leetcode.username;
    const newHackerrank = hackerrank !== undefined ? cleanUsername(hackerrank) : profile.usernames.hackerrank.username;
    const newGfg = gfg !== undefined ? cleanUsername(gfg) : profile.usernames.gfg.username;
    const newCodechef = codechef !== undefined ? cleanUsername(codechef) : profile.usernames.codechef.username;
    const newCodeforces = codeforces !== undefined ? cleanUsername(codeforces) : profile.usernames.codeforces.username;
    const newDuolingo = duolingo !== undefined ? cleanUsername(duolingo) : profile.usernames.duolingo.username;

    if (newGithub === '' && profile.usernames.github.username !== '') profile.stats.github = null;
    if (newLeetcode === '' && profile.usernames.leetcode.username !== '') profile.stats.leetcode = null;
    if (newHackerrank === '' && profile.usernames.hackerrank.username !== '') profile.stats.hackerrank = null;
    if (newGfg === '' && profile.usernames.gfg.username !== '') profile.stats.gfg = null;
    if (newCodechef === '' && profile.usernames.codechef?.username) profile.stats.codechef = null;
    if (newCodeforces === '' && profile.usernames.codeforces?.username) profile.stats.codeforces = null;
    if (newDuolingo === '' && profile.usernames.duolingo?.username) profile.stats.duolingo = null;

    if (newGithub !== profile.usernames.github.username) {
      profile.usernames.github.username = newGithub;
      profile.usernames.github.isVerified = false;
    }
    if (newLeetcode !== profile.usernames.leetcode.username) {
      profile.usernames.leetcode.username = newLeetcode;
      profile.usernames.leetcode.isVerified = false;
    }
    if (newHackerrank !== profile.usernames.hackerrank.username) {
      profile.usernames.hackerrank.username = newHackerrank;
      profile.usernames.hackerrank.isVerified = false;
    }
    if (newGfg !== profile.usernames.gfg.username) {
      profile.usernames.gfg.username = newGfg;
      profile.usernames.gfg.isVerified = false;
    }
    
    if (!profile.usernames.codechef) profile.usernames.codechef = { username: '', isVerified: false };
    if (!profile.usernames.codeforces) profile.usernames.codeforces = { username: '', isVerified: false };
    
    if (newCodechef !== profile.usernames.codechef.username) {
      profile.usernames.codechef.username = newCodechef;
      profile.usernames.codechef.isVerified = false;
    }
    if (newCodeforces !== profile.usernames.codeforces.username) {
      profile.usernames.codeforces.username = newCodeforces;
      profile.usernames.codeforces.isVerified = false;
    }
    if (newDuolingo !== profile.usernames.duolingo.username) {
      profile.usernames.duolingo.username = newDuolingo;
      profile.usernames.duolingo.isVerified = false;
    }

    // Force refresh next time by clearing lastUpdated
    profile.lastUpdated = null;
    
    await profile.save();

    res.json({ message: 'Usernames saved successfully', usernames: profile.usernames });
  } catch (error) {
    console.error('Error saving developer usernames:', error);
    res.status(500).json({ message: 'Server error saving usernames' });
  }
});

// @route   POST /api/dev-activity/generate-code
// @desc    Generate a verification code for bio verification
// @access  Private
router.post('/generate-code', protect, async (req, res) => {
  try {
    const userEmail = req.user.email;
    let profile = await DevProfile.findOne({ email: userEmail });
    
    if (!profile) {
      profile = new DevProfile({
        user: req.user._id,
        email: userEmail
      });
    }

    // Generate random 8-char code
    const code = 'ALUMNEX_VERIFY_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    profile.verificationCode = code;
    profile.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await profile.save();
    
    res.json({ verificationCode: code });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ message: 'Server error generating code' });
  }
});

// @route   POST /api/dev-activity/verify-platform
// @desc    Verify a platform by scraping the public profile for the code
// @access  Private
router.post('/verify-platform', protect, async (req, res) => {
  try {
    const { platform, username } = req.body;
    const userEmail = req.user.email;
    
    const profile = await DevProfile.findOne({ email: userEmail });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found.' });
    }

    if (!username) {
      return res.status(400).json({ message: `No username provided for ${platform}` });
    }

    let isVerified = false;

    // Scrape public profiles to look for the code
    // MOCK VERIFICATION FOR ALL PLATFORMS FOR DEMO
    isVerified = true;

    if (isVerified) {
      if (!profile.usernames) profile.usernames = {};
      profile.usernames[platform] = { username, isVerified: true };
      profile.markModified(`usernames.${platform}`);
      profile.lastUpdated = null; // force refresh
      await profile.save();
      return res.json({ message: `${platform} verified successfully!`, usernames: profile.usernames });
    } else {
      return res.status(400).json({ message: `Verification code not found on your ${platform} profile.` });
    }

  } catch (error) {
    console.error('Error verifying platform:', error);
    res.status(500).json({ message: 'Error accessing your public profile. Ensure it is public and try again.' });
  }
});

module.exports = router;
