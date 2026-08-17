const User = require('../models/User');
const Mentorship = require('../models/Mentorship');
const Notification = require('../models/Notification');

/**
 * Auto-assign a mentor from the same college to a new student.
 * Extracted from auth.js to keep controllers thin and domain logic modular.
 */
const autoAssignMentor = async (studentId, college) => {
  try {
    if (!college) return;

    // Find approved alumni from same college who have available seats
    const SEAT_LIMIT = 10;
    const alumni = await User.find({
      role: 'alumni',
      college: college,
      isApproved: true
    }).select('_id name college');

    if (!alumni.length) return;

    // Count active/pending mentorships per alumni
    const mentorIds = alumni.map(a => a._id);
    const counts = await Mentorship.aggregate([
      { $match: { mentor: { $in: mentorIds }, status: { $in: ['pending', 'accepted', 'active'] } } },
      { $group: { _id: '$mentor', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });

    // Find the mentor with the most available capacity
    let bestMentor = null;
    let maxCapacity = -1;
    for (const alum of alumni) {
      const used = countMap[alum._id.toString()] || 0;
      const remaining = SEAT_LIMIT - used;
      if (remaining > maxCapacity) {
        maxCapacity = remaining;
        bestMentor = alum;
      }
    }

    if (!bestMentor || maxCapacity <= 0) return;

    // Check no existing mentorship between this pair
    const existing = await Mentorship.findOne({
      student: studentId,
      mentor: bestMentor._id,
      status: { $in: ['pending', 'accepted', 'active'] }
    });
    if (existing) return;

    // Create auto-assigned mentorship
    const mentorship = new Mentorship({
      student: studentId,
      mentor: bestMentor._id,
      title: 'Auto-Assigned Mentorship',
      description: 'This mentorship was automatically assigned based on your college affiliation.',
      focusAreas: ['General Guidance'],
      goals: ['Academic & Career Support'],
      expectedDuration: 12,
      communicationMethod: ['chat'],
      status: 'pending',
      isAutoAssigned: true
    });
    await mentorship.save();

    // Notify the mentor
    await Notification.createNotification({
      recipient: bestMentor._id,
      sender: studentId,
      type: 'mentorship_request',
      title: 'New Auto-Assigned Student',
      content: `A new student from ${college} has been auto-assigned to you as a mentee.`,
      relatedData: { mentorshipId: mentorship._id }
    });

    console.log(`Auto-assigned mentor ${bestMentor._id} to student ${studentId}`);
  } catch (err) {
    // Non-critical: log and continue
    console.error('Auto-assign mentor failed:', err.message);
  }
};

module.exports = {
  autoAssignMentor
};
