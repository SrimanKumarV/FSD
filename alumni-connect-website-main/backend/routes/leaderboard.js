const express = require('express');
const router = express.Router();
const DevProfile = require('../models/DevProfile');
const { protect } = require('../middleware/auth');

// @route   GET /api/leaderboard
// @desc    Get top developers by Alumnex Score
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { country, college } = req.query;

    // Find profiles with an Alumnex Score greater than 0, sort descending
    const topProfiles = await DevProfile.find({ alumnexScore: { $gt: 0 } })
      .sort({ alumnexScore: -1 })
      .populate('user', 'name photo role department batch isVerified country college');

    // Filter out profiles where user might have been deleted or doesn't match filters
    const validProfiles = topProfiles.filter(p => {
      if (!p.user) return false;
      if (country && country !== 'Global' && p.user.country !== country) return false;
      if (college && p.user.college !== college) return false;
      return true;
    }).slice(0, 50); // Limit to top 50 after filtering

    res.json({
      leaderboard: validProfiles.map((p, index) => ({
        rank: index + 1,
        userId: p.user._id,
        name: p.user.name,
        photo: p.user.photo,
        department: p.user.department,
        batch: p.user.batch,
        country: p.user.country,
        college: p.user.college,
        alumnexScore: p.alumnexScore,
        stats: {
          github: p.stats?.github?.publicRepos || 0,
          leetcode: p.stats?.leetcode?.totalSolved || 0,
          hackerrank: p.stats?.hackerrank?.badgesCount || 0,
          gfg: p.stats?.gfg?.problemsSolved || 0
        },
        usernames: p.usernames
      }))
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

module.exports = router;
