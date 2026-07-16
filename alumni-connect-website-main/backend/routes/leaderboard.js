const express = require('express');
const router = express.Router();
const DevProfile = require('../models/DevProfile');
const { protect } = require('../middleware/auth');

// @route   GET /api/leaderboard
// @desc    Get top developers by Alumnex Score
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Find profiles with an Alumnex Score greater than 0, sort descending
    const topProfiles = await DevProfile.find({ alumnexScore: { $gt: 0 } })
      .sort({ alumnexScore: -1 })
      .limit(50) // Top 50
      .populate('user', 'name photo role department batch isVerified');

    // Filter out profiles where user might have been deleted
    const validProfiles = topProfiles.filter(p => p.user != null);

    res.json({
      leaderboard: validProfiles.map((p, index) => ({
        rank: index + 1,
        userId: p.user._id,
        name: p.user.name,
        photo: p.user.photo,
        department: p.user.department,
        batch: p.user.batch,
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
