const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost",
  "https://localhost",
  "capacitor://localhost",
  "http://10.0.2.2:3000",
  "http://10.0.2.2"
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    if (url.trim()) allowedOrigins.push(url.trim());
  });
}

const { createAdapter } = require('@socket.io/redis-adapter');
const cache = require('./utils/cache');

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

if (process.env.NODE_ENV !== 'test') {
  const pubClient = cache.client.duplicate();
  const subClient = cache.client.duplicate();
  
  pubClient.on('error', (err) => console.log('PubClient Error', err));
  subClient.on('error', (err) => console.log('SubClient Error', err));

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Socket.io Redis adapter connected');
  }).catch(err => console.error('Redis adapter error:', err));
}

app.set('io', io);

// Middleware
app.use(helmet({
  frameguard: {
    action: 'deny'
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(compression());
app.use(morgan('combined'));
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn('CORS Rejected Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['X-CSRF-Token']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // relaxed limit to prevent 429 errors during normal app usage
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later.'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(require('./middleware/csrf'));
app.use(mongoSanitize());
app.use(hpp());

// Database connection
// Uses the MONGODB_URI from your .env or Render environment variables

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumnex-connect', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4, // Force IPv4
  })
    .then(async () => {
      console.log('Connected to MongoDB');

      // Firebase Admin Diagnostics (Section 44)
      const firebaseAdmin = require('./services/firebaseAdmin');
      firebaseAdmin.logDiagnostics();

      // Database Cleanup: Purge legacy fake fcm_dev_* tokens (Section 48)
      try {
        const NotificationDevice = require('./models/NotificationDevice');
        const cleaned = await NotificationDevice.deleteMany({
          platform: 'android',
          pushToken: { $regex: /^fcm_dev_/ }
        });
        if (cleaned.deletedCount > 0) {
          console.log(`[NotificationDevice] Database cleanup: Removed ${cleaned.deletedCount} legacy mock token(s).`);
        }
      } catch (cleanErr) {
        console.warn('[NotificationDevice] Startup cleanup note:', cleanErr.message);
      }
    })
    .catch(err => console.error('MongoDB connection error:', err));
}

// --- API ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/events', require('./routes/events'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/contests', require('./routes/contests'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/dev-activity', require('./routes/devActivity'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/helpdesk', require('./routes/helpdesk'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/tech-hub', require('./routes/tech-hub'));
app.use('/api/business', require('./routes/business'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/google-calendar', require('./routes/googleCalendar'));

// Socket.IO connection handling
require('./socket/socketHandler')(io);

// --- ROOT WELCOME & HEALTH ROUTES ---
// Placed ABOVE 404 handler for fast probing and monitoring
app.get('/', (req, res) => {
  res.send('Alumni Portal Server is up and running!');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Alumnex Connect API is live',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  require('fs').appendFile('error.log', `[${new Date().toISOString()}] ${err.stack}\n`, () => {});
  
  // Never expose internal details in production
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({ message: err.message || 'Something went wrong!', error: err.message, stack: err.stack });
  } else {
    res.status(500).json({ message: 'Something went wrong!' });
  }
});

// Prevent unhandled promise rejections from crashing the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 404 handler
// This matches everything else. It must stay at the very bottom.
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Keep Render free tier awake by pinging itself every 14 minutes
if (process.env.RENDER_EXTERNAL_URL) {
  const https = require('https');
  const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
  
  setInterval(() => {
    https.get(`${process.env.RENDER_EXTERNAL_URL}/`, (resp) => {
      console.log(`[Self-Ping] Keep-awake ping sent to ${process.env.RENDER_EXTERNAL_URL} - Status: ${resp.statusCode}`);
    }).on("error", (err) => {
      console.error("[Self-Ping] Keep-awake ping failed: " + err.message);
    });
  }, PING_INTERVAL);
  console.log(`[Self-Ping] Mechanism enabled for ${process.env.RENDER_EXTERNAL_URL}`);
}

if (process.env.NODE_ENV !== 'test') {
  // Initialize cron jobs
  require('./jobs/engagementCron')();
  require('./jobs/activityReminderCron')();
  require('./jobs/calendarWatchRenewalCron')();
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server, io };