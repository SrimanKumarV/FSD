const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/google
// @desc    Login or Register with Google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // useGoogleLogin returns an access_token, so we fetch user info directly from Google
    const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${credential}` }
    });
    
    if (!googleResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }
    
    const payload = await googleResponse.json();
    const { email, name, picture, sub } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    let isNewUser = false;
    if (!user) {
      // Create new student user by default
      user = new User({
        name,
        email,
        password: await bcrypt.hash(sub + process.env.JWT_SECRET, 10), // Random secure password
        role: 'student',
        photo: picture,
        isVerified: true,
        studentInfo: {}
      });
      await user.save();
      isNewUser = true;

      // Send Welcome Email for OAuth
      try {
        await sendEmail({
          email: user.email,
          subject: 'Welcome to Alumnex Connect!',
          message: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #4f46e5;">Welcome to Alumnex Connect!</h1>
              <p>Hi ${user.name},</p>
              <p>Your account has been successfully created via Google.</p>
              <p>We are thrilled to have you on board! You can now explore the platform, connect with peers, find opportunities, and much more.</p>
              <br/>
              <p>Best regards,<br/>The Alumnex Connect Team</p>
            </div>
          `
        });
      } catch (err) {
        console.error('Welcome email send error:', err);
      }
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
    
    // Generate token
    const token = generateToken(user._id);
    const userResponse = user.getPublicProfile();
    
    res.json({
      success: true,
      token,
      user: userResponse,
      isNewUser,
      message: isNewUser ? 'Google account linked! Welcome to Alumnex.' : 'Login successful'
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

// @route   POST /api/auth/github
// @desc    Login or Register with GitHub
// @access  Public
router.post('/github', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'GitHub authorization code is required' });
    }

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('GitHub Token Response:', tokenData);
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to get GitHub token');
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Access token missing from GitHub response');
    }

    // 2. Fetch user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'User-Agent': 'Alumni-Connect-App'
      }
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('GitHub User API Error:', errorText);
      throw new Error('Failed to fetch user info from GitHub');
    }
    
    const githubUser = await userResponse.json();

    // 3. Fetch user email (since email might be private on the profile)
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
      throw new Error('No email found in GitHub account');
    }
    
    const email = primaryEmailObj.email;
    const name = githubUser.name || githubUser.login;
    const picture = githubUser.avatar_url;
    
    // 4. Check if user exists
    let user = await User.findOne({ email });
    
    let isNewUser = false;
    if (!user) {
      // Create new student user by default
      user = new User({
        name,
        email,
        password: await bcrypt.hash(githubUser.id.toString() + process.env.JWT_SECRET, 10), // Random secure password
        role: 'student',
        photo: picture,
        isVerified: true,
        studentInfo: {}
      });
      await user.save();
      isNewUser = true;

      // Send Welcome Email for OAuth
      try {
        await sendEmail({
          email: user.email,
          subject: 'Welcome to Alumnex Connect!',
          message: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #4f46e5;">Welcome to Alumnex Connect!</h1>
              <p>Hi ${user.name},</p>
              <p>Your account has been successfully created via GitHub.</p>
              <p>We are thrilled to have you on board! You can now explore the platform, connect with peers, find opportunities, and much more.</p>
              <br/>
              <p>Best regards,<br/>The Alumnex Connect Team</p>
            </div>
          `
        });
      } catch (err) {
        console.error('Welcome email send error:', err);
      }
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
    
    // Generate token
    const token = generateToken(user._id);
    const publicUser = user.getPublicProfile();
    
    res.json({
      success: true,
      token,
      user: publicUser,
      isNewUser,
      message: isNewUser ? 'GitHub account linked! Welcome to Alumnex.' : 'Login successful'
    });
    
  } catch (error) {
    console.error('GitHub auth error:', error);
    res.status(401).json({ message: error.message || 'Invalid GitHub authentication' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name', 'Name is required').notEmpty().trim().isLength({ min: 2, max: 50 }),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('role', 'Role must be student or alumni').isIn(['student', 'alumni']),
  body('studentInfo.course').optional().trim(),
  body('studentInfo.year').optional().isInt({ min: 1, max: 5 }),
  body('studentInfo.university').optional().trim(),
  body('alumniInfo.graduationYear').optional().isInt({ min: 1950, max: new Date().getFullYear() }),
  body('alumniInfo.company').optional().trim(),
  body('alumniInfo.position').optional().trim(),
  body('alumniInfo.industry').optional().trim(),
  body('alumniInfo.experience').optional().isInt({ min: 0 }),
  body('skills').optional().isArray(),
  body('interests').optional().isArray(),
  body('location').optional().trim(),
  body('bio').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      role,
      studentInfo,
      alumniInfo,
      skills,
      interests,
      location,
      bio
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user object
    const userFields = {
      name,
      email,
      password,
      role,
      skills: skills || [],
      interests: interests || [],
      location,
      bio
    };

    // Add role-specific information
    if (role === 'student') {
      userFields.studentInfo = studentInfo || {};
    } else if (role === 'alumni') {
      userFields.alumniInfo = alumniInfo || {};
      // Alumni accounts need approval
      userFields.isApproved = false;
    }

    // Generate 6-digit OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    userFields.verificationOtp = otp;
    userFields.verificationOtpExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    userFields.isVerified = false;

    // Create new user
    user = new User(userFields);
    await user.save();

    // Send verification email
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

    res.status(201).json({
      success: true,
      requiresVerification: true,
      user: { email: user.email },
      message: 'Registration successful! Please check your email for the verification code.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
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
      
      return res.status(403).json({ 
        message: 'Please verify your email to login. A new OTP has been sent to your email.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check if alumni account is approved
    if (user.role === 'alumni' && !user.isApproved) {
      return res.status(400).json({ 
        message: 'Your alumni account is pending approval. Please wait for admin review.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last active
    try {
      await user.updateLastActive();
    } catch (updateError) {
      console.warn('Failed to update last active:', updateError);
      // Continue with login even if update fails
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    let userResponse;
    try {
      userResponse = user.getPublicProfile();
    } catch (profileError) {
      console.error('Error getting public profile:', profileError);
      // Fallback to basic user info
      userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isApproved: user.isApproved
      };
    }

    res.json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', protect, async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user._id);

    res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  protect,
  body('currentPassword', 'Current password is required').exists(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP email
// @access  Public
router.post('/forgot-password', [
  body('email', 'Please include a valid email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiration (15 minutes)
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send email
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

      res.json({
        success: true,
        message: 'OTP sent to your email'
      });
    } catch (err) {
      console.error('Email send error:', err);
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', [
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('otp', 'OTP is required').exists(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;

    // Find user with matching email and OTP that hasn't expired
    const user = await User.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update password
    user.password = newPassword;
    
    // Clear OTP fields
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // Update last active timestamp
    await req.user.updateLastActive();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email with OTP
// @access  Public
router.post('/verify-email', [
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('otp', 'OTP is required').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      verificationOtp: otp,
      verificationOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    // Send Welcome Email
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

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully! You are now logged in.',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post('/resend-verification', protect, async (req, res) => {
  try {
    // Check if already verified
    if (req.user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // TODO: Send verification email
    // For now, just return success message
    res.json({
      success: true,
      message: 'Verification email sent',
      verificationToken // In production, this should be sent via email
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
