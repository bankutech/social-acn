const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { initSocket, getConnectedUsers } = require('./config/socket');
const { connectDB, isDbConnected } = require('./config/db');
const { initCronJobs } = require('./jobs/cron');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);

// Middleware to check DB status
const checkDbConnection = (req, res, next) => {
  if (!isDbConnected() && !req.path.includes('/health')) {
    return res.status(503).json({
      message: 'Database is currently unavailable. Please check the backend logs.',
      status: 'error',
    });
  }
  next();
};

// Make io available to routes
app.set('io', io);

// Security headers and compression
app.use(compression());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images served cross-origin
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  })
);

// CORS allowlist
const getAllowedOrigins = () => {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== 'production') {
    return [
      ...new Set([
        ...fromEnv,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:4173',
        'http://localhost:3000',
      ]),
    ];
  }
  return fromEnv;
};

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = getAllowedOrigins();
      // Allow non-browser requests (curl, health checks, same-origin) and configured origins
      if (!origin || allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Basic rate limiting for auth and AI endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI rate limit reached, please slow down' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);
app.use('/api/ai', aiLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const reelRoutes = require('./routes/reelRoutes');
const chatRoutes = require('./routes/chatRoutes');
const partnerChatRoutes = require('./routes/partnerChatRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const groupRoutes = require('./routes/groupRoutes');
const storyRoutes = require('./routes/storyRoutes');

app.use(checkDbConnection);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/partner-chat', partnerChatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/stories', storyRoutes);

// Get online users endpoint
app.get('/api/online-users', (req, res) => {
  res.json(Array.from(getConnectedUsers().keys()));
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: isDbConnected() ? 'ok' : 'error',
    database: isDbConnected() ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

// Connect to MongoDB
connectDB();

// Initialize Cron Jobs
initCronJobs();

// Initial Route
app.get('/', (req, res) => {
  res.send('ACN+ API is running');
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  const actualPort = server.address().port;
  console.log(`Server running on port ${actualPort}`);
});
