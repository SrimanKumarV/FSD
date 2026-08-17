const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const authService = require('../services/authService');

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const result = await authService.processGoogleLogin(credential);
    
    if (result.requiresRoleSelection) {
      return res.json({ success: true, ...result });
    }
    
    setTokenCookie(res, result.token);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(error.status || 401).json({ message: error.message || 'Invalid Google token' });
  }
});

router.post('/github', async (req, res) => {
  try {
    const { code, clientId } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'GitHub authorization code is required' });
    }

    const result = await authService.processGithubLogin(code, clientId);
    
    if (result.requiresRoleSelection) {
      return res.json({ success: true, ...result });
    }
    
    setTokenCookie(res, result.token);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('GitHub auth error:', error);
    res.status(error.status || 401).json({ message: error.message || 'Invalid GitHub authentication' });
  }
});

router.post('/oauth-complete', [
  body('tempToken', 'Token is required').exists(),
  body('role', 'Role must be student or alumni').isIn(['student', 'alumni'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { tempToken, role } = req.body;
    const result = await authService.completeOAuth(tempToken, role);
    
    setTokenCookie(res, result.token);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('OAuth complete error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
});

router.post('/register', [
  body('name', 'Name is required').notEmpty().trim().isLength({ min: 2, max: 50 }),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('role', 'Role must be student, alumni, or college').isIn(['student', 'alumni', 'college']),
  body('studentInfo.course').optional().trim(),
  body('studentInfo.year').optional().isInt({ min: 1950 }),
  body('studentInfo.university').optional().trim(),
  body('alumniInfo.graduationYear').optional().isInt({ min: 1950, max: new Date().getFullYear() }),
  body('alumniInfo.company').optional().trim(),
  body('alumniInfo.position').optional().trim(),
  body('alumniInfo.industry').optional().trim(),
  body('alumniInfo.experience').optional().isInt({ min: 0 }),
  body('skills').optional().isArray(),
  body('interests').optional().isArray(),
  body('location').optional().trim(),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('collegeInfo.establishedYear').optional().isInt({ min: 1000, max: new Date().getFullYear() }),
  body('collegeInfo.accreditation').optional().trim(),
  body('collegeInfo.officialUrl').optional().isURL(),
  body('college').optional().trim(),
  body('country').optional().trim(),
  body('department').custom((value, { req }) => {
    if ((req.body.role === 'student' || req.body.role === 'alumni') && !value) {
      throw new Error('Department is required');
    }
    return true;
  }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error during registration' });
  }
});

router.post('/login', [
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    setTokenCookie(res, result.token);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.requiresVerification) {
      return res.status(error.status || 403).json(error);
    }
    console.error('Login error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error during login' });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    // Re-use User from models here for simplicity, or we can move it to user service
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    let token;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    const newToken = await authService.refreshToken(token);
    setTokenCookie(res, newToken);
    res.json({ success: true, token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
});

router.post('/change-password', [
  protect,
  body('currentPassword', 'Current password is required').exists(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
});

router.post('/forgot-password', [
  body('email', 'Please include a valid email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
});

router.post('/reset-password', [
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('otp', 'OTP is required').exists(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
});

router.post('/logout', protect, async (req, res) => {
  try {
    await req.user.updateLastActive();
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-email', [
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('otp', 'OTP is required').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, otp } = req.body;
    const result = await authService.verifyEmail(email, otp);
    
    setTokenCookie(res, result.token);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
});

router.post('/resend-verification', [
  body('email', 'Valid email is required').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;
    const result = await authService.resendVerification(email);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
});

router.post('/send-2fa', [
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('method', 'Method must be email or sms').isIn(['email', 'sms'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, method } = req.body;
    const result = await authService.send2FA(email, method);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Send 2FA error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
});

router.post('/verify-2fa', [
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('otp', 'OTP is required').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, otp } = req.body;
    const result = await authService.verify2FA(email, otp);
    
    setTokenCookie(res, result.token);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
});

// Mobile proxy routes
router.get('/mobile/github', (req, res) => {
  const isMobile = true;
  const activeClientId = isMobile ? 'Ov23liziKGoBWdUOVmxJ' : process.env.GITHUB_CLIENT_ID;
  const backendUrl = req.protocol + '://' + req.get('host');
  const redirectUri = `${backendUrl}/api/auth/mobile/github/callback`;
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${activeClientId}&redirect_uri=${redirectUri}&scope=user:email`);
});

router.get('/mobile/github/callback', (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code received from GitHub');
  res.redirect(`com.alumnex.connect://oauth/github?code=${code}`);
});

router.get('/mobile/google', (req, res) => {
  const backendUrl = req.protocol + '://' + req.get('host');
  const redirectUri = `${backendUrl}/api/auth/mobile/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID || '253683997850-ec2t9ae74tnrsadu6enid73lnpeoho7d.apps.googleusercontent.com';
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email profile`);
});

router.get('/mobile/google/callback', (req, res) => {
  res.send(`
    <html>
      <head><title>Authenticating...</title></head>
      <body>
        <script>
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const token = params.get('access_token');
          if (token) {
            window.location.href = 'com.alumnex.connect://oauth/google?credential=' + token;
          } else {
            document.body.innerHTML = 'Authentication failed. Please return to the app.';
          }
        </script>
      </body>
    </html>
  `);
});

module.exports = router;
