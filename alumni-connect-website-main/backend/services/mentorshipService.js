const User = require('../models/User');
const Mentorship = require('../models/Mentorship');
const Notification = require('../models/Notification');

/**
 * Get available mentors with matching scores based on the current user.
 */
const getMentors = async (currentUser, filters) => {
  const { skills, industry, location, availability, targetRole } = filters;
  let query = { role: targetRole };

  if (skills) {
    const skillArray = skills.split(',').map(skill => skill.trim());
    query.skills = { $in: skillArray };
  }

  if (industry && targetRole === 'alumni') {
    query['alumniInfo.industry'] = { $regex: industry, $options: 'i' };
  }

  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  if (availability === 'available' && targetRole === 'alumni') {
    query.status = 'available';
  }

  let selectFields = 'name email photo bio skills location status role department college interests';
  if (targetRole === 'student') {
    selectFields += ' studentInfo';
  } else {
    selectFields += ' alumniInfo';
  }

  const SEAT_LIMIT = 10;
  const mentors = await User.find(query).select(selectFields).sort({ name: 1 });

  // For each mentor, calculate remaining seat capacity
  const mentorIds = mentors.map(m => m._id);
  const activeCounts = await Mentorship.aggregate([
    { $match: { mentor: { $in: mentorIds }, status: { $in: ['pending', 'accepted', 'active'] } } },
    { $group: { _id: '$mentor', count: { $sum: 1 } } }
  ]);
  const countMap = {};
  activeCounts.forEach(entry => { countMap[entry._id.toString()] = entry.count; });

  let mentorsWithCapacity = mentors.map(mentor => {
    const obj = mentor.toObject();
    const usedSeats = countMap[mentor._id.toString()] || 0;
    const maxSeats = SEAT_LIMIT;
    obj.totalSeats = maxSeats;
    obj.usedSeats = usedSeats;
    obj.remainingCapacity = Math.max(0, maxSeats - usedSeats);
    
    // Calculate match score
    let score = 0;
    if (currentUser) {
      if (currentUser.college && obj.college && currentUser.college.toLowerCase() === obj.college.toLowerCase()) score += 3;
      if (currentUser.department && obj.department && currentUser.department.toLowerCase() === obj.department.toLowerCase()) score += 3;
      
      const userInterests = currentUser.interests || [];
      const userSkills = currentUser.skills || [];
      const mentorSkills = obj.skills || [];
      const mentorInterests = obj.interests || [];
      
      const combinedUser = [...new Set([...userInterests, ...userSkills])].map(s => s.toLowerCase());
      const combinedMentor = [...new Set([...mentorSkills, ...mentorInterests])].map(s => s.toLowerCase());
      
      const matches = combinedUser.filter(s => combinedMentor.includes(s));
      score += matches.length;
    }
    obj.matchScore = score;
    return obj;
  });

  mentorsWithCapacity.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return b.remainingCapacity - a.remainingCapacity;
  });

  return mentorsWithCapacity;
};

/**
 * Auto-assign a mentor from the same college to a new student using advanced matching.
 */
const autoAssignMentor = async (studentId, college) => {
  try {
    if (!college) return null;

    const studentUser = await User.findById(studentId);
    if (!studentUser) return null;

    const SEAT_LIMIT = 10;
    const query = {
      role: 'alumni',
      college: college,
      isApproved: true
    };
    if (studentUser.department) {
      query.department = studentUser.department;
    }
    const alumni = await User.find(query).select('_id name college department alumniInfo skills interests');

    if (!alumni.length) return null;

    // Check if student already has a pending or active mentorship
    const existingMentorship = await Mentorship.findOne({
      student: studentId,
      status: { $in: ['pending', 'active', 'accepted'] }
    });
    if (existingMentorship) return null;

    const mentorIds = alumni.map(a => a._id);
    const counts = await Mentorship.aggregate([
      { $match: { mentor: { $in: mentorIds }, status: { $in: ['pending', 'accepted', 'active'] } } },
      { $group: { _id: '$mentor', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const studentCourse = (studentUser.studentInfo?.course || '').toLowerCase();
    const studentInterests = (studentUser.interests || []).map(i => i.toLowerCase());
    const studentSkills = (studentUser.skills || []).map(s => s.toLowerCase());

    let bestMentor = null;
    let highestScore = -1;

    for (const alum of alumni) {
      const used = countMap[alum._id.toString()] || 0;
      const remainingCapacity = SEAT_LIMIT - used;
      
      if (remainingCapacity <= 0) continue;

      let score = remainingCapacity;

      const alumIndustry = (alum.alumniInfo?.industry || '').toLowerCase();
      const alumPosition = (alum.alumniInfo?.position || '').toLowerCase();
      
      if (studentCourse && (
          (alumIndustry && (studentCourse.includes(alumIndustry) || alumIndustry.includes(studentCourse))) ||
          (alumPosition && (studentCourse.includes(alumPosition) || alumPosition.includes(studentCourse)))
      )) {
        score += 20;
      }

      const alumMentorshipAreas = (alum.alumniInfo?.mentorshipAreas || []).map(a => a.toLowerCase());
      const alumSkills = (alum.skills || []).map(s => s.toLowerCase());
      const alumInterests = (alum.interests || []).map(i => i.toLowerCase());

      const allStudentKeywords = new Set([...studentInterests, ...studentSkills]);
      const allAlumKeywords = new Set([...alumMentorshipAreas, ...alumSkills, ...alumInterests]);

      for (const keyword of allStudentKeywords) {
        if (keyword && Array.from(allAlumKeywords).some(k => k.includes(keyword) || keyword.includes(k))) {
          score += 10;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMentor = alum;
      }
    }

    if (!bestMentor) return null;

    const mentorship = new Mentorship({
      student: studentId,
      mentor: bestMentor._id,
      title: 'Auto-Assigned Mentorship',
      description: 'This mentorship was automatically requested via Smart Allocation based on your college affiliation.',
      focusAreas: ['General Guidance'],
      goals: ['Academic & Career Support'],
      expectedDuration: 12,
      communicationMethod: ['chat'],
      status: 'pending',
      isAutoAssigned: true
    });
    await mentorship.save();

    await Notification.createNotification({
      recipient: bestMentor._id,
      sender: studentId,
      type: 'mentorship_request',
      title: 'New Auto-Assigned Student',
      content: `A new student from ${college} has been auto-assigned to you as a mentee.`,
      relatedData: { mentorshipId: mentorship._id }
    });

    console.log(`Auto-assigned mentor ${bestMentor._id} to student ${studentId}`);
    return mentorship;
  } catch (err) {
    console.error('Auto-assign mentor failed:', err.message);
    return null;
  }
};

module.exports = {
  getMentors,
  autoAssignMentor
};
