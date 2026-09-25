/**
 * Activity Hub email templates for Alumnex Connect
 * Reuses the existing email infrastructure (sendEmail.js)
 */

const getPortalUrl = () => {
  const envUrl = process.env.PORTAL_URL || process.env.FRONTEND_URL;
  if (envUrl) {
    const urls = envUrl.split(',').map(u => u.trim().replace(/\/+$/, ''));
    const prod = urls.find(u => u.startsWith('https://'));
    if (prod) return prod;
    if (urls[0] && !urls[0].includes('localhost')) return urls[0];
  }
  return 'https://alumnex-connect.onrender.com';
};

const baseStyle = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const headerStyle = `
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  padding: 32px 24px;
  text-align: center;
  color: #ffffff;
`;

const bodyStyle = `padding: 24px;`;

const btnStyle = `
  display: inline-block;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #ffffff;
  padding: 12px 28px;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
`;

const footerStyle = `
  padding: 16px 24px;
  background: #f9fafb;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  border-top: 1px solid #e5e7eb;
`;

/**
 * Daily Activity Reminder Email
 */
const getDailyReminderTemplate = (user, pendingGoals = [], streakInfo = {}) => {
  const portalUrl = getPortalUrl();
  const goalsList = pendingGoals.map(g => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6;">
        <span style="font-size: 14px; color: #374151;">☐ ${g.title}</span>
        ${g.target ? `<br><span style="font-size: 12px; color: #9ca3af;">${g.target}</span>` : ''}
      </td>
    </tr>
  `).join('');

  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🔔 Daily Activity Reminder</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Stay consistent, stay ahead</p>
      </div>
      <div style="${bodyStyle}">
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">Hi <strong>${user.name}</strong>,</p>
        
        ${streakInfo.currentStreak > 0 ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              🔥 <strong>${streakInfo.currentStreak}-day streak!</strong> Don't break it.
            </p>
          </div>
        ` : ''}
        
        <p style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0;">
          You have <strong>${pendingGoals.length} goal${pendingGoals.length !== 1 ? 's' : ''}</strong> remaining for today:
        </p>
        
        ${goalsList ? `
          <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
            ${goalsList}
          </table>
        ` : ''}
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${portalUrl}/activity" style="${btnStyle}">Open Activity Hub →</a>
        </div>
      </div>
      <div style="${footerStyle}">
        <p style="margin: 0;">You're receiving this because you enabled daily reminders on Alumnex Connect.</p>
        <p style="margin: 4px 0 0 0;">
          <a href="${portalUrl}/activity" style="color: #6366f1; text-decoration: none;">Manage reminder preferences</a>
        </p>
      </div>
    </div>
  `;
};

/**
 * Streak Warning Email
 */
const getStreakWarningTemplate = (user, streakInfo = {}) => {
  const portalUrl = getPortalUrl();
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle.replace('#4f46e5', '#ef4444').replace('#7c3aed', '#f97316')}">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">⚠️ Your Streak Needs Attention</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Don't lose your progress</p>
      </div>
      <div style="${bodyStyle}">
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">Hi <strong>${user.name}</strong>,</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;">
            🔥 Your <strong>${streakInfo.currentStreak || 0}-day streak</strong> hasn't been completed today yet.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">
          You've worked hard to build this habit. Complete at least one activity to keep your streak going.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${portalUrl}/activity" style="${btnStyle.replace('#4f46e5', '#ef4444').replace('#7c3aed', '#f97316')}">Keep My Streak →</a>
        </div>
      </div>
      <div style="${footerStyle}">
        <p style="margin: 0;">
          <a href="${portalUrl}/activity" style="color: #6366f1; text-decoration: none;">Manage reminder preferences</a>
        </p>
      </div>
    </div>
  `;
};

/**
 * Goal Completed Celebration Email
 */
const getGoalCompletedTemplate = (user, goalTitle, streakInfo = {}) => {
  const portalUrl = getPortalUrl();
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle.replace('#4f46e5', '#059669').replace('#7c3aed', '#10b981')}">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🎉 Goal Completed!</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Great work, keep it up</p>
      </div>
      <div style="${bodyStyle}">
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">Hi <strong>${user.name}</strong>,</p>
        
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 14px; color: #065f46;">
            ✓ <strong>${goalTitle}</strong> — completed for today!
          </p>
        </div>
        
        ${streakInfo.currentStreak > 0 ? `
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0;">
            🔥 Current streak: <strong>${streakInfo.currentStreak} day${streakInfo.currentStreak !== 1 ? 's' : ''}</strong>
          </p>
        ` : ''}
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${portalUrl}/activity" style="${btnStyle.replace('#4f46e5', '#059669').replace('#7c3aed', '#10b981')}">View Activity Hub →</a>
        </div>
      </div>
      <div style="${footerStyle}">
        <p style="margin: 0;">
          <a href="${portalUrl}/activity" style="color: #6366f1; text-decoration: none;">Manage notification preferences</a>
        </p>
      </div>
    </div>
  `;
};

/**
 * Streak Milestone Email
 */
const getStreakMilestoneTemplate = (user, milestone, streakType = 'activity') => {
  const portalUrl = getPortalUrl();
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle.replace('#4f46e5', '#7c3aed').replace('#7c3aed', '#a855f7')}">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🏆 Streak Milestone!</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${milestone} days of consistency</p>
      </div>
      <div style="${bodyStyle}">
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">Hi <strong>${user.name}</strong>,</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 50%; width: 80px; height: 80px; line-height: 80px; font-size: 32px;">
            🏆
          </div>
          <h2 style="margin: 12px 0 4px 0; color: #1f2937; font-size: 28px;">${milestone} Days!</h2>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">You've maintained your ${streakType} habit for ${milestone} consecutive days.</p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">
          This is an incredible achievement. Consistency is what separates those who wish from those who do. Keep building! 💪
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${portalUrl}/activity" style="${btnStyle}">Continue Your Journey →</a>
        </div>
      </div>
      <div style="${footerStyle}">
        <p style="margin: 0;">
          <a href="${portalUrl}/activity" style="color: #6366f1; text-decoration: none;">Manage notification preferences</a>
        </p>
      </div>
    </div>
  `;
};

/**
 * Weekly Activity Summary Email
 */
const getWeeklyActivitySummaryTemplate = (user, summary = {}) => {
  const portalUrl = getPortalUrl();

  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">📊 Your Weekly Activity Summary</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${summary.period?.start || ''} → ${summary.period?.end || ''}</p>
      </div>
      <div style="${bodyStyle}">
        <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">Hi <strong>${user.name}</strong>, here's how your week went:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 12px; background: #eff6ff; border-radius: 8px 0 0 0; text-align: center; width: 50%;">
              <div style="font-size: 24px; font-weight: 700; color: #1e40af;">${summary.coding?.activeDays || 0}/7</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Coding Days</div>
            </td>
            <td style="padding: 12px; background: #f0fdf4; border-radius: 0 8px 0 0; text-align: center; width: 50%;">
              <div style="font-size: 24px; font-weight: 700; color: #166534;">${summary.learning?.activeDays || 0}/7</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Learning Days</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; background: #fef3c7; border-radius: 0 0 0 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #92400e;">${summary.goalsCompleted || 0}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Goals Completed</div>
            </td>
            <td style="padding: 12px; background: #faf5ff; border-radius: 0 0 8px 0; text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #7c3aed;">🔥 ${summary.longestStreak || 0}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Longest Streak</div>
            </td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${portalUrl}/activity" style="${btnStyle}">View Full Activity Hub →</a>
        </div>
      </div>
      <div style="${footerStyle}">
        <p style="margin: 0;">You're receiving this weekly summary because you enabled it on Alumnex Connect.</p>
        <p style="margin: 4px 0 0 0;">
          <a href="${portalUrl}/activity" style="color: #6366f1; text-decoration: none;">Manage preferences</a>
        </p>
      </div>
    </div>
  `;
};

module.exports = {
  getDailyReminderTemplate,
  getStreakWarningTemplate,
  getGoalCompletedTemplate,
  getStreakMilestoneTemplate,
  getWeeklyActivitySummaryTemplate
};
