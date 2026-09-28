const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const authService = require('../services/authService');

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
  body('role', 'Role must be student or alumni').isIn(['student', 'alumni']),
  body('country').optional().trim(),
  body('college').optional().trim(),
  body('department').optional().trim(),
  body('interests').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { tempToken, role, country, college, department, interests } = req.body;
    const result = await authService.completeOAuth(tempToken, role, { country, college, department, interests });
    
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
  body('department').optional().trim()
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
    res.cookie('token', '', { 
      httpOnly: true, 
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
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
  const activeClientId = process.env.GITHUB_MOBILE_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  if (!activeClientId) {
    return res.status(500).json({ message: 'GitHub OAuth not configured' });
  }
  const backendUrl = req.protocol + '://' + req.get('host');
  const redirectUri = `${backendUrl}/api/auth/mobile/github/callback`;
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${activeClientId}&redirect_uri=${redirectUri}&scope=user:email`);
});

router.get('/mobile/github/callback', (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code received from GitHub');
  res.send(`
    <html>
      <head>
        <title>Authenticating...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; background: white; margin: 0; }
          a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h3>Authentication Successful!</h3>
        <p>Returning to app...</p>
        <a href="com.alumnex.connect://oauth/github?code=${code}">Click here if not redirected automatically</a>
        <script>
          window.location.href = 'com.alumnex.connect://oauth/github?code=${code}';
        </script>
      </body>
    </html>
  `);
});

const resolveGoogleCredentials = () => {
  let clientId = (process.env.MOBILE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').trim();
  let clientSecret = (process.env.MOBILE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '').trim();

  // Guard against swapped or misconfigured credentials
  if (clientId.startsWith('GOCSPX-')) {
    if (clientSecret && clientSecret.endsWith('.apps.googleusercontent.com')) {
      const temp = clientId;
      clientId = clientSecret;
      clientSecret = temp;
    } else {
      if (!clientSecret) clientSecret = clientId;
      if (process.env.REACT_APP_GOOGLE_CLIENT_ID && process.env.REACT_APP_GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com')) {
        clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID.trim();
      }
    }
  }

  return { clientId, clientSecret };
};

const getGoogleRedirectUri = (req) => {
  if (process.env.MOBILE_GOOGLE_REDIRECT_URI) {
    return process.env.MOBILE_GOOGLE_REDIRECT_URI.trim();
  }
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host');
  return `${proto}://${host}/api/auth/mobile/google/callback`;
};

router.get('/mobile/google', (req, res) => {
  const { clientId, clientSecret } = resolveGoogleCredentials();
  if (!clientId || clientId.startsWith('GOCSPX-')) {
    return res.status(500).json({ message: 'Google OAuth client ID not properly configured' });
  }
  const redirectUri = getGoogleRedirectUri(req);

  // Generate secure CSRF state token signed with JWT_SECRET (15-minute expiration)
  const stateNonce = crypto.randomBytes(24).toString('hex');
  const stateToken = jwt.sign(
    { nonce: stateNonce, type: 'mobile_google_oauth', iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.cookie('oauth_state', stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 15 * 60 * 1000
  });

  // Prefer standard Authorization Code flow if client secret is configured; fallback to token flow
  const responseType = clientSecret ? 'code' : 'token';
  const scope = clientSecret ? 'openid email profile' : 'email profile';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: responseType,
    scope: scope,
    state: stateToken,
    prompt: 'select_account'
  });

  if (clientSecret) {
    params.append('access_type', 'offline');
  }

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/mobile/google/callback', async (req, res) => {
  const renderMobileHandoff = (deepLinkUrl, title, message, isError = false) => `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
            text-align: center;
          }
          .card {
            background: rgba(30, 41, 59, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 36px 28px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
          .icon {
            width: 52px;
            height: 52px;
            margin: 0 auto 16px auto;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)'};
            color: ${isError ? '#ef4444' : '#38bdf8'};
            font-size: 24px;
            font-weight: bold;
          }
          h2 { margin: 0 0 12px; font-size: 22px; color: ${isError ? '#f87171' : '#ffffff'}; }
          p { margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.5; }
          .btn {
            display: inline-block;
            width: 100%;
            padding: 14px 20px;
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            color: #ffffff;
            font-weight: 600;
            font-size: 15px;
            text-decoration: none;
            border-radius: 12px;
            box-sizing: border-box;
            transition: opacity 0.2s;
          }
          .btn:active { opacity: 0.85; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${isError ? '!' : '✓'}</div>
          <h2>${title}</h2>
          <p>${message}</p>
          <a class="btn" id="return-btn" href="${deepLinkUrl}">Return to Alumnex Connect</a>
        </div>
        <script>
          setTimeout(function() {
            window.location.href = ${JSON.stringify(deepLinkUrl)};
          }, 150);
        </script>
      </body>
    </html>
  `;

  // 1. Check for OAuth error / cancellation in query parameters
  if (req.query.error) {
    const errorDesc = req.query.error_description || req.query.error;
    console.warn('[Mobile Google OAuth] Error received from Google:', errorDesc);
    const deepLinkUrl = `com.alumnex.connect://oauth/google?error=${encodeURIComponent(errorDesc)}`;
    return res.status(400).send(renderMobileHandoff(deepLinkUrl, 'Sign In Cancelled', 'Google sign-in was not completed. Please return to the app to try again.', true));
  }

  // 2. Authorization Code Flow (Server-side token exchange)
  if (req.query.code) {
    const { code, state } = req.query;

    // Validate CSRF state
    if (!state) {
      console.warn('[Mobile Google OAuth] Missing state in callback');
      const deepLinkUrl = `com.alumnex.connect://oauth/google?error=${encodeURIComponent('Missing OAuth security state')}`;
      return res.status(403).send(renderMobileHandoff(deepLinkUrl, 'Security Verification Failed', 'Missing OAuth state token. Please retry logging in.', true));
    }

    try {
      const decoded = jwt.verify(state, process.env.JWT_SECRET);
      if (decoded.type !== 'mobile_google_oauth') {
        throw new Error('Invalid state type');
      }
    } catch (stateErr) {
      console.warn('[Mobile Google OAuth] State verification failed:', stateErr.message);
      const deepLinkUrl = `com.alumnex.connect://oauth/google?error=${encodeURIComponent('Expired or invalid OAuth state')}`;
      return res.status(403).send(renderMobileHandoff(deepLinkUrl, 'Session Expired', 'Your sign-in request expired. Please return to the app and try again.', true));
    }

    const { clientId, clientSecret } = resolveGoogleCredentials();
    const redirectUri = getGoogleRedirectUri(req);

    if (!clientSecret) {
      console.error('[Mobile Google OAuth] GOOGLE_CLIENT_SECRET not configured on server');
      const deepLinkUrl = `com.alumnex.connect://oauth/google?error=${encodeURIComponent('GOOGLE_CLIENT_SECRET not configured on backend')}`;
      return res.status(500).send(renderMobileHandoff(deepLinkUrl, 'Server Setup Required', 'GOOGLE_CLIENT_SECRET must be configured on the backend server for authorization code flow.', true));
    }

    try {
      // Exchange authorization code for tokens securely at Google token endpoint
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      const { access_token, id_token } = tokenResponse.data;
      const credential = access_token || id_token;

      // Authenticate / create the Alumnex user
      const result = await authService.processGoogleLogin(credential);

      if (result.requiresRoleSelection) {
        const deepLinkUrl = `com.alumnex.connect://oauth/google?requiresRoleSelection=true&tempToken=${encodeURIComponent(result.tempToken)}`;
        return res.send(renderMobileHandoff(deepLinkUrl, 'Welcome to Alumnex!', 'Finalizing account setup. Redirecting to select your role...'));
      }

      // Establish session cookie
      setTokenCookie(res, result.token);

      const deepLinkUrl = `com.alumnex.connect://oauth/google?token=${encodeURIComponent(result.token)}`;
      return res.send(renderMobileHandoff(deepLinkUrl, 'Authentication Successful!', 'Returning to Alumnex Connect...'));
    } catch (err) {
      console.error('[Mobile Google OAuth] Code exchange error:', err.response?.data || err.message);
      const errMsg = err.response?.data?.error_description || err.message || 'Google token exchange failed';
      const deepLinkUrl = `com.alumnex.connect://oauth/google?error=${encodeURIComponent(errMsg)}`;
      return res.status(500).send(renderMobileHandoff(deepLinkUrl, 'Sign In Error', errMsg, true));
    }
  }

  // 3. Fallback for client-side hash fragment (Implicit token grant)
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Authenticating...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
            text-align: center;
          }
          .card {
            background: rgba(30, 41, 59, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 36px 28px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
          h2 { margin: 0 0 12px; font-size: 22px; color: #ffffff; }
          p { margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.5; }
          .btn {
            display: inline-block;
            width: 100%;
            padding: 14px 20px;
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            color: #ffffff;
            font-weight: 600;
            font-size: 15px;
            text-decoration: none;
            border-radius: 12px;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 id="status-title">Authenticating...</h2>
          <p id="status-desc">Transferring session to Alumnex Connect app...</p>
          <a class="btn" id="return-link" href="#" style="display:none;">Return to App</a>
        </div>
        <script>
          try {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');
            const error = params.get('error') || params.get('error_description');

            if (token) {
              const redirectUrl = 'com.alumnex.connect://oauth/google?credential=' + encodeURIComponent(token);
              document.getElementById('return-link').href = redirectUrl;
              document.getElementById('return-link').style.display = 'inline-block';
              window.location.href = redirectUrl;
            } else if (error) {
              document.getElementById('status-title').innerText = 'Authentication Failed';
              document.getElementById('status-desc').innerText = error;
              const redirectUrl = 'com.alumnex.connect://oauth/google?error=' + encodeURIComponent(error);
              document.getElementById('return-link').href = redirectUrl;
              document.getElementById('return-link').style.display = 'inline-block';
              window.location.href = redirectUrl;
            } else {
              document.getElementById('status-title').innerText = 'No Credentials Received';
              document.getElementById('status-desc').innerText = 'No authorization details received from Google. Please return to the app and retry.';
              document.getElementById('return-link').href = 'com.alumnex.connect://';
              document.getElementById('return-link').style.display = 'inline-block';
            }
          } catch (e) {
            document.getElementById('status-title').innerText = 'Processing Error';
            document.getElementById('status-desc').innerText = e.message;
          }
        </script>
      </body>
    </html>
  `);
});

module.exports = router;
