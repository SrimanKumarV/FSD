/**
 * Helper to get the canonical public portal URL for email hyperlinks
 * Prioritizes production deployment URL https://alumnex-connect.onrender.com
 */
const getPortalUrl = (providedUrl) => {
  if (providedUrl && !providedUrl.includes('localhost')) {
    return providedUrl.replace(/\/+$/, '');
  }
  const envUrl = process.env.PORTAL_URL || process.env.FRONTEND_URL;
  if (envUrl) {
    const urls = envUrl.split(',').map(u => u.trim().replace(/\/+$/, ''));
    const prod = urls.find(u => u.startsWith('https://'));
    if (prod) return prod;
    if (urls[0] && !urls[0].includes('localhost')) return urls[0];
  }
  return 'https://alumnex-connect.onrender.com';
};

const getNewPeerEmailTemplate = (newUser, recipient) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h1 style="color: #4f46e5; text-align: center;">New Peer in Your Department!</h1>
    <p>Hi ${recipient.name},</p>
    <p>We thought you'd like to know that <strong>${newUser.name}</strong> just joined Alumnex Connect!</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Role:</strong> ${newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)}</p>
      <p style="margin: 5px 0 0 0;"><strong>College:</strong> ${newUser.college || 'Not specified'}</p>
      <p style="margin: 5px 0 0 0;"><strong>Department:</strong> ${newUser.department || 'Not specified'}</p>
    </div>

    <p>As part of the same department, this is a great opportunity to connect, share experiences, or offer mentorship.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${getPortalUrl()}/network" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Network</a>
    </div>

    <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 40px;">
      You received this email because you have Network Updates enabled in your email preferences.<br/>
      To unsubscribe, update your profile settings on Alumnex Connect.
    </p>
  </div>
`;

const getDevPulseDigestTemplate = (recipient, recentProjects, recentJobs) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h1 style="color: #4f46e5; text-align: center;">Your Weekly Dev Pulse ⚡</h1>
    <p>Hi ${recipient.name},</p>
    <p>Here's what's been happening in your network recently. Don't miss out on these new opportunities and projects!</p>
    
    ${recentProjects && recentProjects.length > 0 ? `
      <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">🚀 Latest Projects</h2>
      ${recentProjects.map(p => `
        <div style="margin-bottom: 15px;">
          <h3 style="margin: 0 0 5px 0; color: #4f46e5;">${p.title}</h3>
          <p style="margin: 0 0 5px 0; font-size: 14px; color: #4b5563;">By ${p.user?.name || 'A Student'} • ${p.category || 'Tech'}</p>
          <p style="margin: 0; font-size: 14px;">${p.description ? p.description.substring(0, 100) + '...' : ''}</p>
        </div>
      `).join('')}
    ` : ''}

    ${recentJobs && recentJobs.length > 0 ? `
      <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; margin-top: 30px;">💼 New Opportunities</h2>
      ${recentJobs.map(j => `
        <div style="margin-bottom: 15px;">
          <h3 style="margin: 0 0 5px 0; color: #059669;">${j.title} at ${j.company}</h3>
          <p style="margin: 0 0 5px 0; font-size: 14px; color: #4b5563;">Type: ${j.jobType} • Location: ${j.location}</p>
        </div>
      `).join('')}
    ` : ''}

    <div style="text-align: center; margin: 40px 0;">
      <a href="${getPortalUrl()}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Explore More on Alumnex Connect</a>
    </div>

    <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 40px;">
      You received this email because you have Dev Pulse enabled in your email preferences.<br/>
      To unsubscribe, update your profile settings on Alumnex Connect.
    </p>
  </div>
`;

/**
 * Generate weekly engagement & inactivity reminder email template
 * @param {Object} recipient - User document
 * @param {Object} data - Aggregated data (recentJobs, recentProjects, upcomingEvents, featuredMentors, portalUrl)
 * @param {boolean} isInactive - Whether user has been inactive for >= 7 days
 * @param {number} daysInactive - Number of days since user was last active
 */
const getWeeklyEngagementTemplate = (recipient, data = {}, isInactive = false, daysInactive = 7) => {
  const portalUrl = getPortalUrl(data.portalUrl);
  const firstName = (recipient.name || 'there').split(' ')[0];
  const role = recipient.role || 'student';
  const roleName = role.charAt(0).toUpperCase() + role.slice(1);
  const { recentJobs = [], recentProjects = [], upcomingEvents = [], featuredMentors = [] } = data;

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Network Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 30px; text-align: center; color: #ffffff;">
              <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; margin-bottom: 6px;">Alumnex Connect • Weekly Pulse</div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">🎓 Stay Connected & Keep Growing</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.85;">Edition: ${dateStr}</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="font-size: 17px; font-weight: 600; color: #1e293b; margin: 0 0 16px 0;">
                Hi ${firstName},
              </p>

              ${isInactive ? `
              <!-- Inactivity Notice Banner -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px 18px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #1e40af;">
                  👋 We noticed you haven't visited Alumnex Connect in ${daysInactive >= 7 ? `${daysInactive} days` : 'over a week'}!
                </p>
                <p style="margin: 6px 0 0 0; font-size: 14px; color: #3b82f6; line-height: 1.5;">
                  Your peer network and alumni community have been actively sharing new opportunities, project updates, and career advice. Take a moment to catch up on what you've missed!
                </p>
              </div>
              ` : `
              <!-- Active User Greeting -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.5;">
                  ⚡ Here is your curated weekly digest with active opportunities, community highlights, and suggestions tailored for your <strong>${roleName}</strong> journey.
                </p>
              </div>
              `}

              <!-- Personalized Suggestions & Reminders Section -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 26px;">
                <h3 style="margin: 0 0 14px 0; font-size: 16px; color: #0f172a; font-weight: 700; display: flex; align-items: center;">
                  📌 Smart Reminders & Suggestions for You
                </h3>
                
                ${role === 'student' ? `
                <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.7;">
                  <li><strong>Connect with Alumni Mentors:</strong> Get 1-on-1 interview advice, resume feedback, and career guidance from senior alumni.</li>
                  <li><strong>Explore the Job & Internship Board:</strong> Alumni regularly post exclusive internships and entry-level referrals.</li>
                  <li><strong>Contest Arena & Leaderboard:</strong> Solve programming contests, complete mandatory tasks, and boost your campus ranking.</li>
                  <li><strong>Keep Your Profile Updated:</strong> Make sure your skills, GitHub link, and resume are current so mentors and recruiters can discover you.</li>
                </ul>
                ` : role === 'alumni' ? `
                <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.7;">
                  <li><strong>Support a Junior:</strong> Check if any students in your department requested mentorship or have questions about industry transitions.</li>
                  <li><strong>Post an Opportunity:</strong> Hiring at your company? Post an internship or referral to help talented students from your alma mater.</li>
                  <li><strong>Alumni Directory:</strong> Reconnect with batchmates from your graduation year and grow your professional circle.</li>
                </ul>
                ` : `
                <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.7;">
                  <li><strong>Monitor Campus Growth:</strong> Review new alumni registrations and pending verification requests.</li>
                  <li><strong>Institutional Events:</strong> Share campus workshops, webinars, and placement updates with students.</li>
                </ul>
                `}
              </div>

              ${recentJobs && recentJobs.length > 0 ? `
              <!-- Featured Jobs & Internships -->
              <div style="margin-bottom: 26px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a; font-weight: 700;">
                  💼 New Jobs & Internship Openings
                </h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  ${recentJobs.map(job => `
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
                      <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <a href="${portalUrl}/jobs" style="font-size: 15px; font-weight: 600; color: #4f46e5; text-decoration: none;">${job.title}</a>
                        <span style="background-color: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase;">${job.jobType || 'Job'}</span>
                      </div>
                      <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">${job.company} • ${job.location || 'Remote/Onsite'}</p>
                    </div>
                  `).join('')}
                </div>
                <div style="text-align: right; margin-top: 6px;">
                  <a href="${portalUrl}/jobs" style="font-size: 13px; color: #4f46e5; font-weight: 600; text-decoration: none;">Browse all openings &rarr;</a>
                </div>
              </div>
              ` : ''}

              ${recentProjects && recentProjects.length > 0 ? `
              <!-- Recent Projects Showcase -->
              <div style="margin-bottom: 26px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a; font-weight: 700;">
                  🚀 Project Showcase & Innovations
                </h3>
                ${recentProjects.map(proj => `
                  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
                    <a href="${portalUrl}/projects" style="font-size: 15px; font-weight: 600; color: #0f172a; text-decoration: none;">${proj.title}</a>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">By ${proj.user?.name || 'A Student'} • ${proj.category || 'Tech Hub'}</p>
                  </div>
                `).join('')}
              </div>
              ` : ''}

              ${upcomingEvents && upcomingEvents.length > 0 ? `
              <!-- Upcoming Events -->
              <div style="margin-bottom: 26px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a; font-weight: 700;">
                  📅 Upcoming Webinars & Campus Events
                </h3>
                ${upcomingEvents.map(evt => `
                  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
                    <div style="font-size: 15px; font-weight: 600; color: #0f172a;">${evt.title}</div>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Date: ${new Date(evt.startDate).toLocaleDateString()} • ${evt.eventType || 'Event'}</p>
                  </div>
                `).join('')}
              </div>
              ` : ''}

              <!-- Main Call To Action Button -->
              <div style="text-align: center; margin: 34px 0 20px 0;">
                <a href="${portalUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
                  🚀 Jump Back into Alumnex Connect
                </a>
                <p style="font-size: 12px; color: #94a3b8; margin: 10px 0 0 0;">Takes less than a minute to check in and see new updates!</p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #475569;">
                Alumnex Connect — Bridging Students and Alumni
              </p>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                You are receiving this weekly digest to keep your account active and stay connected with campus opportunities.<br/>
                To manage notification preferences, visit <a href="${portalUrl}/settings" style="color: #4f46e5; text-decoration: underline;">Account Settings</a>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Alumnex Connect. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = {
  getNewPeerEmailTemplate,
  getDevPulseDigestTemplate,
  getWeeklyEngagementTemplate
};

