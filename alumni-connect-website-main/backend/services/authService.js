const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getNewPeerEmailTemplate } = require('../utils/emailTemplates');
const { autoAssignMentor } = require('./mentorshipService');
const notifyPeersOfNewUser = async (newUser) => {
  try {
    if (!newUser.college || !newUser.department) return;
    
    // Find up to 50 active users in same college & department who want network updates
    const peers = await User.find({
      _id: { $ne: newUser._id },
      college: newUser.college,
      department: newUser.department,
      isActive: true,
      'emailPreferences.networkUpdates': true
    }).limit(50);
    
    if (peers.length === 0) return;
    
    // Send email to peers
    for (const peer of peers) {
      await sendEmail({
        email: peer.email,
        subject: `New ${newUser.role} joined from your department!`,
        message: getNewPeerEmailTemplate(newUser, peer)
      }).catch(err => console.error('Peer notification email error:', err));
    }
  } catch (err) {
    console.error('Error notifying peers of new user:', err);
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

class AuthService {
  getGoogleClient() {
    if (!this.googleClient) {
      this.googleClient = new OAuth2Client();
    }
    return this.googleClient;
  }

  async processGoogleLogin(credential) {
    if (!credential || typeof credential !== 'string') {
      throw { status: 400, message: 'Google credential is required' };
    }

    let payload = null;

    const allowedClientIds = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.MOBILE_GOOGLE_CLIENT_ID,
      process.env.REACT_APP_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_ID
    ].filter(Boolean).map(id => id.trim());

    // 1. If credential matches JWT format (3 dot-separated parts), verify cryptographically with Google public certificates
    const isJwtFormat = typeof credential === 'string' && credential.split('.').length === 3;
    if (isJwtFormat) {
      try {
        const client = this.getGoogleClient();
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: allowedClientIds.length > 0 ? allowedClientIds : undefined
        });
        const ticketPayload = ticket.getPayload();

        // Cryptographic check: issuer must be Google and email must be verified
        if (
          ticketPayload &&
          (ticketPayload.iss === 'accounts.google.com' || ticketPayload.iss === 'https://accounts.google.com') &&
          ticketPayload.email
        ) {
          if (ticketPayload.email_verified !== false) {
            payload = ticketPayload;
          }
        }
      } catch (idErr) {
        console.warn('[GoogleAuth] Cryptographic ID token verification failed:', idErr.message);
      }
      if (!payload || !payload.email) {
        throw { status: 401, message: 'Invalid or forged Google authentication token' };
      }
    }

    // 2. If not verified as an ID token, check if it is a legitimate Google OAuth2 access token via userinfo endpoint
    if (!payload) {
      try {
        if (typeof global.fetch === 'function') {
          const googleResponse = await global.fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${credential}` }
          });
          if (googleResponse.ok) {
            const data = await googleResponse.json();
            if (data && data.email && data.email_verified !== false) {
              payload = data;
            }
          }
        } else {
          const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${credential}` },
            timeout: 8000
          });
          if (googleResponse.status === 200 && googleResponse.data && googleResponse.data.email) {
            if (googleResponse.data.email_verified !== false) {
              payload = googleResponse.data;
            }
          }
        }
      } catch (accessErr) {
        // Access token endpoint failed or returned non-200
      }
    }

    // Strict fail-closed: NO unverified jwt.decode fallback
    if (!payload || !payload.email) {
      throw { status: 401, message: 'Failed to fetch user info from Google' };
    }

    const { email, name, picture, sub } = payload;
    
    let user = await User.findOne({ email });
    let isNewUser = false;
    
    if (!user) {
      const tempToken = jwt.sign(
        { email, name, picture, sub, provider: 'google' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '15m' }
      );
      
      return {
        requiresRoleSelection: true,
        tempToken,
        message: 'Please select your role to complete registration'
      };
    } else {
      let needsSave = false;
      if (!user.photo && picture) {
        user.photo = picture;
        needsSave = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }
    
    const token = generateToken(user._id);
    return {
      token,
      user: user.getPublicProfile(),
      isNewUser,
      message: 'Login successful'
    };
  }

  async processGithubLogin(code, clientId) {
    const isMobile = clientId === process.env.GITHUB_MOBILE_CLIENT_ID;
    const activeClientId = isMobile ? process.env.GITHUB_MOBILE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
    const activeClientSecret = isMobile ? process.env.GITHUB_MOBILE_CLIENT_SECRET : process.env.GITHUB_CLIENT_SECRET;

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: activeClientId,
        client_secret: activeClientSecret,
        code
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw { status: 401, message: tokenData.error_description || 'Failed to get GitHub token' };
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw { status: 401, message: 'Access token missing from GitHub response' };
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'User-Agent': 'Alumni-Connect-App'
      }
    });
    
    if (!userResponse.ok) {
      throw { status: 401, message: 'Failed to fetch user info from GitHub' };
    }
    
    const githubUser = await userResponse.json();

    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'User-Agent': 'Alumni-Connect-App'
      }
    });
    
    const emails = await emailResponse.json();
    const primaryEmailObj = emails.find(e => e.primary) || emails[0];
    
    if (!primaryEmailObj || !primaryEmailObj.email) {
      throw { status: 401, message: 'No email found in GitHub account' };
    }
    
    const email = primaryEmailObj.email;
    const name = githubUser.name || githubUser.login;
    const picture = githubUser.avatar_url;
    
    let user = await User.findOne({ email });
    let isNewUser = false;
    
    if (!user) {
      const tempToken = jwt.sign(
        { email, name, picture, sub: githubUser.id.toString(), provider: 'github' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '15m' }
      );
      
      return {
        requiresRoleSelection: true,
        tempToken,
        message: 'Please select your role to complete registration'
      };
    } else {
      let needsSave = false;
      if (!user.photo && picture) {
        user.photo = picture;
        needsSave = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }
    
    const token = generateToken(user._id);
    return {
      token,
      user: user.getPublicProfile(),
      isNewUser,
      message: 'Login successful'
    };
  }

  async completeOAuth(tempToken, role, additionalData = {}) {
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      throw { status: 401, message: 'Token is invalid or expired. Please login again.' };
    }

    if (!decoded.email || !decoded.provider) {
      throw { status: 400, message: 'Invalid token payload' };
    }

    let user = await User.findOne({ email: decoded.email });
    if (user) {
      throw { status: 400, message: 'User already exists' };
    }

    user = new User({
      name: decoded.name,
      email: decoded.email,
      password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
      role: role,
      photo: decoded.picture,
      isVerified: true,
      studentInfo: role === 'student' ? {} : undefined,
      alumniInfo: role === 'alumni' ? { mentorshipAreas: additionalData.interests || [] } : undefined,
      isApproved: role === 'student' ? true : false,
      country: additionalData.country || '',
      college: additionalData.college || '',
      department: additionalData.department || '',
      interests: role === 'student' ? (additionalData.interests || []) : undefined
    });
    
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Alumnex Connect!',
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4f46e5;">Welcome to Alumnex Connect!</h1>
            <p>Hi ${user.name},</p>
            <p>Your account has been successfully created via ${decoded.provider === 'google' ? 'Google' : 'GitHub'}.</p>
            <p>We are thrilled to have you on board! You can now explore the platform, connect with peers, find opportunities, and much more.</p>
            <br/>
            <p>Best regards,<br/>The Alumnex Connect Team</p>
          </div>
        `
      });
    } catch (err) {
      console.error('Welcome email send error:', err);
    }

    // Trigger peer notification asynchronously
    notifyPeersOfNewUser(user);

    const token = generateToken(user._id);
    return {
      token,
      user: user.getPublicProfile(),
      isNewUser: true,
      message: `${decoded.provider === 'google' ? 'Google' : 'GitHub'} account linked! Welcome to Alumnex.`
    };
  }

  async register(data) {
    const { name, email, password, role, studentInfo, alumniInfo, skills, interests, location, bio, collegeInfo, college, country, department } = data;

    let user = await User.findOne({ email });
    if (user) {
      throw { status: 400, message: 'User already exists' };
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw { status: 400, message: 'Password must be at least 6 characters long' };
    }
    const userFields = { name, email, password, role, skills: skills || [], interests: interests || [], location, bio, college, country, department };

    if (role === 'student') {
      userFields.studentInfo = studentInfo || {};
    } else if (role === 'alumni') {
      userFields.alumniInfo = alumniInfo || {};
      userFields.isApproved = false;
    } else if (role === 'college') {
      userFields.collegeInfo = collegeInfo || {};
      userFields.isApproved = false; 
    }

    // Validate email deliverability using Disify (skip during automated test runs)
    if (process.env.NODE_ENV !== 'test') {
      try {
        const emailCheck = await axios.get(`https://www.disify.com/api/email/${email}`);
        if (emailCheck.data && (emailCheck.data.format === false || emailCheck.data.disposable === true)) {
          throw { status: 400, message: 'Invalid or disposable email address not allowed' };
        }
      } catch (err) {
        if (err.status === 400) throw err;
        console.error('Email validation error:', err.message);
      }
    }

    const otp = generateOTP();
    userFields.verificationOtp = otp;
    userFields.verificationOtpExpires = Date.now() + 15 * 60 * 1000;
    userFields.isVerified = false;

    user = new User(userFields);
    await user.save();

    const message = `
      <h1>Welcome to Alumnex Connect!</h1>
      <p>Thank you for registering. Please verify your email address to complete your registration.</p>
      <p>Your 6-digit verification code is: <strong>${otp}</strong></p>
      <p>This code is valid for 15 minutes.</p>
    `;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Alumnex Connect - Verify Your Email',
        message
      });
    } catch (err) {
      console.error('Registration email send error:', err);
    }

    return {
      requiresVerification: true,
      user: { email: user.email },
      message: 'Registration successful! Please check your email for the verification code.'
    };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password +twoFactorOtp +twoFactorOtpExpires +twoFactorOtpAttempts');
    if (!user) {
      throw { status: 400, message: 'Invalid credentials' };
    }

    if (!user.isActive) {
      throw { status: 400, message: 'Account is deactivated' };
    }

    if (!user.isVerified) {
      const otp = generateOTP();
      user.verificationOtp = otp;
      user.verificationOtpExpires = Date.now() + 15 * 60 * 1000;
      user.verificationOtpAttempts = 0;
      await user.save();
      
      try {
        await sendEmail({
          email: user.email,
          subject: 'Alumnex Connect - Verify Your Email',
          message: `<p>Your verification code is: <strong>${otp}</strong></p>`
        });
      } catch (e) {
        console.error('Email failed', e);
      }
      
      throw { 
        status: 403, 
        message: 'Please verify your email to login. A new OTP has been sent to your email.',
        requiresVerification: true,
        email: user.email
      };
    }

    if (user.role === 'alumni' && !user.isApproved) {
      throw { status: 400, message: 'Your alumni account is pending approval. Please wait for admin review.' };
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw { status: 400, message: 'Invalid credentials' };
    }

    // Check if 2FA is required for this user
    if (user.twoFactorEnabled || (user.phoneVerified && user.smsNotifications)) {
      const preAuthChallenge = jwt.sign(
        { userId: user._id.toString(), email: user.email, type: '2fa_pre_auth' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '10m' }
      );

      const otp = generateOTP();
      user.twoFactorOtp = otp;
      user.twoFactorOtpExpires = Date.now() + 15 * 60 * 1000;
      user.twoFactorOtpAttempts = 0;
      await user.save();

      const preferredMethod = (user.phoneVerified && user.phoneNumber) ? 'sms' : 'email';
      if (preferredMethod === 'sms') {
        const sendSMS = require('../utils/sendSMS');
        sendSMS(user.phoneNumber, `Your Alumnex Connect 2FA code is ${otp}. Valid for 15 mins.`).catch(() => {});
      } else {
        sendEmail({
          email: user.email,
          subject: 'Alumnex Connect - 2FA Login Verification',
          message: `<p>Your secure verification code is: <strong>${otp}</strong></p>`
        }).catch(() => {});
      }

      return {
        requires2FA: true,
        email: user.email,
        preAuthChallenge,
        availableMethods: user.phoneNumber ? ['email', 'sms'] : ['email'],
        methodSent: preferredMethod,
        message: '2FA verification code dispatched'
      };
    }

    try {
      await user.updateLastActive();
    } catch (updateError) {
      console.warn('Failed to update last active:', updateError);
    }

    const token = generateToken(user._id);
    let userResponse;
    try {
      userResponse = user.getPublicProfile();
    } catch (profileError) {
      userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isApproved: user.isApproved
      };
    }

    return { token, user: userResponse };
  }

  async refreshToken(token) {
    if (!token) {
      throw { status: 401, message: 'No token provided' };
    }

    let decoded;
    try {
      // First try to verify normally (token still valid)
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // Allow session restoration within 30 days of token expiration
        decoded = jwt.decode(token);
        if (!decoded || !decoded.id) {
          throw { status: 401, message: 'Invalid token structure' };
        }
        const expiredAt = (decoded.exp || 0) * 1000;
        const maxRefreshWindow = 30 * 24 * 60 * 60 * 1000; // 30 days
        if (Date.now() - expiredAt > maxRefreshWindow) {
          throw { status: 401, message: 'Session expired. Please log in again.' };
        }
      } else {
        throw { status: 401, message: 'Invalid authentication token' };
      }
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw { status: 401, message: 'User not found or account deactivated' };
    }

    const newToken = generateToken(user._id);
    return { token: newToken, user: user.getPublicProfile() };
  }

  async changePassword(userId, currentPassword, newPassword) {
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw { status: 400, message: 'Password must be at least 6 characters long' };
    }
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw { status: 400, message: 'Current password is incorrect' };
    }

    user.password = newPassword;
    await user.save();
    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email }).select('+resetPasswordOtp +resetPasswordExpires +resetPasswordOtpAttempts');
    if (!user) {
      return { message: 'If an account with that email exists, an OTP has been sent.' };
    }

    const otp = generateOTP();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    user.resetPasswordOtpAttempts = 0;
    await user.save();

    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your Alumnex Connect account.</p>
      <p>Your 6-digit verification code is: <strong>${otp}</strong></p>
      <p>This code is valid for 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Alumnex Connect - Password Reset Verification Code',
        message
      });
      return { message: 'If an account with that email exists, an OTP has been sent.' };
    } catch (err) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      throw { status: 500, message: 'Email could not be sent' };
    }
  }

  async resetPassword(email, otp, newPassword) {
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw { status: 400, message: 'Password must be at least 6 characters long' };
    }
    const user = await User.findOne({ email }).select('+password +resetPasswordOtp +resetPasswordExpires +resetPasswordOtpAttempts');

    if (!user) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    if (!user.resetPasswordOtp || !user.resetPasswordExpires || new Date(user.resetPasswordExpires).getTime() < Date.now()) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    if ((user.resetPasswordOtpAttempts || 0) >= 5) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      user.resetPasswordOtpAttempts = 0;
      await user.save();
      throw { status: 400, message: 'Maximum failed verification attempts exceeded. Please request a new password reset.' };
    }

    if (String(user.resetPasswordOtp).trim() !== String(otp).trim()) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.resetPasswordOtpAttempts;
      throw { status: 400, message: `Invalid OTP. ${remaining} attempt(s) remaining.` };
    }

    // One-time consumption
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordOtpAttempts = 0;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(email, otp) {
    const user = await User.findOne({ email }).select('+verificationOtp +verificationOtpExpires +verificationOtpAttempts');

    if (!user) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    if (user.isVerified) {
      throw { status: 400, message: 'Email already verified' };
    }

    if (!user.verificationOtp || !user.verificationOtpExpires || new Date(user.verificationOtpExpires).getTime() < Date.now()) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    if ((user.verificationOtpAttempts || 0) >= 5) {
      user.verificationOtp = undefined;
      user.verificationOtpExpires = undefined;
      user.verificationOtpAttempts = 0;
      await user.save();
      throw { status: 400, message: 'Maximum failed verification attempts exceeded. Please request a new code.' };
    }

    if (String(user.verificationOtp).trim() !== String(otp).trim()) {
      user.verificationOtpAttempts = (user.verificationOtpAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.verificationOtpAttempts;
      throw { status: 400, message: `Invalid OTP. ${remaining} attempt(s) remaining.` };
    }

    // One-time consumption
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    user.verificationOtpAttempts = 0;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Alumnex Connect!',
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4f46e5;">Welcome to Alumnex Connect!</h1>
            <p>Hi ${user.name},</p>
            <p>Your email has been successfully verified, and your account is now active.</p>
            <p>We are thrilled to have you on board! You can now explore the platform, connect with peers, find opportunities, and much more.</p>
            <br/>
            <p>Best regards,<br/>The Alumnex Connect Team</p>
          </div>
        `
      });
    } catch (err) {
      console.error('Welcome email send error:', err);
    }

    // Trigger peer notification asynchronously
    notifyPeersOfNewUser(user);

    const token = generateToken(user._id);

    if (user.role === 'student') {
      autoAssignMentor(user._id, user.college).catch(e => console.error('Auto-assign error:', e));
    }

    return {
      message: 'Email verified successfully! You are now logged in.',
      token,
      user: user.getPublicProfile()
    };
  }

  async resendVerification(email) {
    const user = await User.findOne({ email }).select('+verificationOtp +verificationOtpExpires +verificationOtpAttempts');

    if (!user) {
      return { message: 'If an account exists, a new OTP has been sent.' };
    }

    if (user.isVerified) {
      throw { status: 400, message: 'Email already verified' };
    }

    const fourteenMinsFromNow = Date.now() + 14 * 60 * 1000;
    if (user.verificationOtpExpires && user.verificationOtpExpires > fourteenMinsFromNow) {
      throw { status: 429, message: 'Please wait a minute before requesting a new OTP.' };
    }

    const otp = generateOTP();
    user.verificationOtp = otp;
    user.verificationOtpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const message = `
      <h1>Alumnex Connect</h1>
      <p>You requested a new verification code.</p>
      <p>Your 6-digit verification code is: <strong>${otp}</strong></p>
      <p>This code is valid for 15 minutes.</p>
    `;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Alumnex Connect - New Verification Code',
        message
      });
    } catch (err) {
      console.error('Resend verification email error:', err);
    }

    return { message: 'If an account exists, a new OTP has been sent.' };
  }

  async send2FA(email, method, preAuthChallenge) {
    if (!preAuthChallenge) {
      throw { status: 401, message: 'Pre-authentication challenge is required to request a 2FA code.' };
    }

    let decoded;
    try {
      decoded = jwt.verify(preAuthChallenge, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded.email !== email || decoded.type !== '2fa_pre_auth') {
        throw new Error('Identity mismatch');
      }
    } catch (err) {
      throw { status: 401, message: 'Invalid or expired 2FA pre-authentication challenge. Please log in again.' };
    }

    const user = await User.findOne({ email }).select('+twoFactorOtp +twoFactorOtpExpires +twoFactorOtpAttempts');
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const otp = generateOTP();
    user.twoFactorOtp = otp;
    user.twoFactorOtpExpires = Date.now() + 15 * 60 * 1000;
    user.twoFactorOtpAttempts = 0;
    await user.save();

    if (method === 'sms') {
      if (!user.phoneNumber) {
        throw { status: 400, message: 'No phone number associated with this account' };
      }
      const sendSMS = require('../utils/sendSMS');
      await sendSMS(user.phoneNumber, `Your Alumnex Connect 2FA code is ${otp}. Valid for 15 mins.`).catch(e => console.error('2FA SMS dispatch error:', e.message));
    } else {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Alumnex Connect - 2FA Login Verification',
          message: `<p>Your secure verification code is: <strong>${otp}</strong></p><p>This code is valid for 15 minutes.</p>`
        });
      } catch (err) {
        throw { status: 500, message: 'Failed to send OTP via email' };
      }
    }

    return { message: `2FA OTP sent via ${method}` };
  }

  async verify2FA(email, otp, preAuthChallenge) {
    if (!preAuthChallenge) {
      throw { status: 401, message: 'Pre-authentication challenge is required for 2FA verification. Please log in first.' };
    }

    let decoded;
    try {
      decoded = jwt.verify(preAuthChallenge, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded.email !== email || decoded.type !== '2fa_pre_auth') {
        throw new Error('Identity mismatch');
      }
    } catch (err) {
      throw { status: 401, message: 'Invalid or expired 2FA pre-authentication challenge. Please log in again.' };
    }

    const user = await User.findOne({ email }).select('+twoFactorOtp +twoFactorOtpExpires +twoFactorOtpAttempts');
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    if (!user.twoFactorOtp || !user.twoFactorOtpExpires || new Date(user.twoFactorOtpExpires).getTime() < Date.now()) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    if ((user.twoFactorOtpAttempts || 0) >= 5) {
      user.twoFactorOtp = undefined;
      user.twoFactorOtpExpires = undefined;
      user.twoFactorOtpAttempts = 0;
      await user.save();
      throw { status: 400, message: 'Maximum failed verification attempts exceeded. This OTP has been invalidated.' };
    }

    if (String(user.twoFactorOtp).trim() !== String(otp).trim()) {
      user.twoFactorOtpAttempts = (user.twoFactorOtpAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.twoFactorOtpAttempts;
      throw { status: 400, message: `Invalid OTP. ${remaining} attempt(s) remaining.` };
    }

    // One-time consumption: immediately clear OTP and attempts
    user.twoFactorOtp = undefined;
    user.twoFactorOtpExpires = undefined;
    user.twoFactorOtpAttempts = 0;
    await user.updateLastActive().catch(() => {});
    await user.save();

    const token = generateToken(user._id);
    let userResponse;
    try {
      userResponse = user.getPublicProfile();
    } catch (profileError) {
      userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isApproved: user.isApproved
      };
    }

    return { token, user: userResponse, message: 'Login successful' };
  }
}

module.exports = new AuthService();
