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
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/network" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Network</a>
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
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Explore More on Alumnex Connect</a>
    </div>

    <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 40px;">
      You received this email because you have Dev Pulse enabled in your email preferences.<br/>
      To unsubscribe, update your profile settings on Alumnex Connect.
    </p>
  </div>
`;

module.exports = {
  getNewPeerEmailTemplate,
  getDevPulseDigestTemplate
};
