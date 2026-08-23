const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

class AuthService {
  async processGoogleLogin(credential) {
    const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${credential}` }
    });
    
    if (!googleResponse.ok) {
      throw { status: 401, message: 'Failed to fetch user info from Google' };
    }
    
    const payload = await googleResponse.json();
    const { email, name, picture, sub } = payload;
    
    let user = await User.findOne({ email });
    let isNewUser = false;
    
    if (!user) {
      const tempToken = jwt.sign(
        { email, name, picture, sub, provider: 'google' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
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
    const isMobile = clientId === 'Ov23liziKGoBWdUOVmxJ' || clientId === process.env.GITHUB_MOBILE_CLIENT_ID;
    const activeClientId = isMobile ? 'Ov23liziKGoBWdUOVmxJ' : process.env.GITHUB_CLIENT_ID;
    const activeClientSecret = isMobile ? '4439829704a6990d66d64877e2429eb4dba0f9b0' : process.env.GITHUB_CLIENT_SECRET;

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
        { expiresIn: '15m' }
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

  async completeOAuth(tempToken, role) {
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
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
      password: await bcrypt.hash(decoded.sub + process.env.JWT_SECRET, 10),
      role: role,
      photo: decoded.picture,
      isVerified: true,
      studentInfo: role === 'student' ? {} : undefined,
      alumniInfo: role === 'alumni' ? {} : undefined,
      isApproved: role === 'student' ? true : false
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

    // Validate email deliverability using Disify
    try {
      const emailCheck = await axios.get(`https://www.disify.com/api/email/${email}`);
      if (emailCheck.data && (emailCheck.data.format === false || emailCheck.data.disposable === true)) {
        throw { status: 400, message: 'Invalid or disposable email address not allowed' };
      }
    } catch (err) {
      if (err.status === 400) throw err;
      console.error('Email validation error:', err.message);
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
    const user = await User.findOne({ email }).select('+password');
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw { status: 401, message: 'User not found or deactivated' };
    }

    return generateToken(user._id);
  }

  async changePassword(userId, currentPassword, newPassword) {
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
    const user = await User.findOne({ email });
    if (!user) {
      return { message: 'If an account with that email exists, an OTP has been sent.' };
    }

    const otp = generateOTP();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
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
      return { message: 'OTP sent to your email' };
    } catch (err) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      throw { status: 500, message: 'Email could not be sent' };
    }
  }

  async resetPassword(email, otp, newPassword) {
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(email, otp) {
    const user = await User.findOne({
      email,
      verificationOtp: otp,
      verificationOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    if (user.isVerified) {
      throw { status: 400, message: 'Email already verified' };
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
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
    const user = await User.findOne({ email });

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

    return { message: 'A new verification OTP has been sent to your email.' };
  }

  async send2FA(email, method) {
    const user = await User.findOne({ email });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    
    if (!user.twoFactorOtp || user.twoFactorOtpExpires < Date.now()) {
      user.twoFactorOtp = generateOTP();
      user.twoFactorOtpExpires = Date.now() + 15 * 60 * 1000;
      await user.save();
    }

    if (method === 'sms') {
      if (!user.phoneNumber) {
        throw { status: 400, message: 'No phone number associated with this account' };
      }
      console.log(`[SMS OTP SIMULATION] Sending OTP ${user.twoFactorOtp} to ${user.phoneNumber}`);
    } else {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Alumnex Connect - 2FA Login Verification',
          message: `<p>Your secure verification code is: <strong>${user.twoFactorOtp}</strong></p>`
        });
      } catch (err) {
        throw { status: 500, message: 'Failed to send OTP via email' };
      }
    }

    return { message: `2FA OTP sent via ${method}` };
  }

  async verify2FA(email, otp) {
    const user = await User.findOne({
      email,
      twoFactorOtp: otp,
      twoFactorOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    user.twoFactorOtp = undefined;
    user.twoFactorOtpExpires = undefined;
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
