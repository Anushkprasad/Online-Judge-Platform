const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');

// ============= HELMET =============
// Set security HTTP headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// ============= RATE LIMITING =============
// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: {
    success: false,
    message: 'Too many login or signup attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Limiter for code execution endpoints
const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 submissions per minute
  message: 'Too many code submissions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// ============= CORS CONFIGURATION =============
const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

// ============= INPUT SANITIZATION =============
// MongoDB query injection prevention
const mongoSanitizeOptions = {
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Potentially malicious data detected in ${key}`);
  },
};

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  executionLimiter,
  corsOptions,
  mongoSanitizeOptions,
};
