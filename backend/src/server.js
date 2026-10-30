const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { helmetConfig, generalLimiter, authLimiter, executionLimiter, corsOptions, mongoSanitizeOptions } = require('./config/security');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Trust proxy
app.set('trust proxy', 1);

// Logging Middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
}));

// Security Middlewares
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(generalLimiter);

// Body Parser Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data Sanitization
app.use(mongoSanitize(mongoSanitizeOptions));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const problemRoutes = require('./routes/problemRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const courseRoutes = require('./routes/courseRoutes');
const contestRoutes = require('./routes/contestRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const interviewPrepRoutes = require('./routes/interviewPrepRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { getLeaderboard } = require('./controllers/userController');
const { configureSubmissionQueue } = require('./services/submissionQueue');

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', executionLimiter, submissionRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/interview-prep', interviewPrepRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/leaderboard', getLeaderboard);

configureSubmissionQueue({ socketServer: io });

io.on('connection', (socket) => {
  socket.on('user:join', (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on('user:leave', (userId) => {
    if (userId) socket.leave(`user:${userId}`);
  });

  socket.on('contest:join', (contestId) => {
    if (contestId) socket.join(`contest:${contestId}`);
  });

  socket.on('contest:leave', (contestId) => {
    if (contestId) socket.leave(`contest:${contestId}`);
  });
});

// Base Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}\nStack: ${err.stack}`);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server };
