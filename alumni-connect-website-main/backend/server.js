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

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

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
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // relax limit for local testing
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
// Uses the MONGODB_URI from your .env or Render environment variables

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumnex-connect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  family: 4, // Force IPv4
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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

// Socket.IO connection handling
require('./socket/socketHandler')(io);

// --- ROOT WELCOME ROUTE ---
// This is now placed ABOVE the 404 handler so it actually works.
app.get('/', (req, res) => {
  res.send('Alumni Portal Server is up and running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };