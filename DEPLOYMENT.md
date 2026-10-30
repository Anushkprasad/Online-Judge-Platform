# Deployment & Hardening Guide

## Table of Contents
1. [Docker Setup](#docker-setup)
2. [Security Hardening](#security-hardening)
3. [Deployment to Render (Backend)](#deployment-to-render-backend)
4. [Deployment to Vercel (Frontend)](#deployment-to-vercel-frontend)
5. [Environment Configuration](#environment-configuration)
6. [Testing](#testing)
7. [Monitoring & Logging](#monitoring--logging)

---

## Docker Setup

### Local Development with Docker Compose

#### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured in `.env`

#### Running Locally

```bash
# Clone the repository
git clone <repository-url>
cd oj

# Create environment file
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop containers
docker-compose down
```

#### Services
- **Backend**: Node.js app on port 5000
- **MongoDB**: Database on port 27017
- **Frontend**: Vite dev server on port 5173

#### Health Check
Backend includes health check endpoint: `GET /health`

---

## Security Hardening

### 1. Rate Limiting

Rate limits are applied to:
- **General endpoints**: 100 requests per 15 minutes per IP
- **Auth endpoints** (login/register): 5 attempts per hour per IP
- **Code submission**: 10 submissions per minute per IP

```javascript
// Rate limiting is configured in src/config/security.js
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/submissions', executionLimiter, submissionRoutes);
```

### 2. Input Sanitization

**MongoDB Query Injection Prevention**
```javascript
// Express Mongo Sanitize removes $ and . from user input
app.use(mongoSanitize({
  replaceWith: '_',
}));
```

**Validation**
```javascript
// Use express-validator for comprehensive input validation
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('username').trim().isLength({ min: 3 }),
], validateInput, registerController);
```

### 3. Helmet Security Headers

Helmet sets secure HTTP headers:
```javascript
// Configured in src/config/security.js
- Content Security Policy (CSP)
- X-Frame-Options: DENY (prevent clickjacking)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- X-XSS-Protection
```

### 4. CORS Configuration

```javascript
// Only allow requests from trusted origins
corsOptions: {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
```

### 5. JWT Best Practices

```javascript
// JWT stored in secure, httpOnly cookies (recommended for production)
// Or use Authorization header: Bearer <token>

// Token expiration: 7 days (configurable)
// Refresh tokens for long sessions
```

---

## Deployment to Render (Backend)

### Step 1: Prepare for Deployment

```bash
# Install production dependencies only
npm install --production

# Run tests
npm test

# Check code coverage
npm run test:coverage
```

### Step 2: Create Render Configuration

File: `render.yaml` (already created)

### Step 3: Deploy to Render

1. **Connect GitHub**
   - Push code to GitHub
   - Go to https://dashboard.render.com
   - Click "Create New" → "Web Service"
   - Connect GitHub repository

2. **Configure Environment**
   - In Render dashboard, set environment variables:
     ```
     NODE_ENV=production
     PORT=5000
     MONGODB_URI=<your-mongodb-atlas-uri>
     JWT_SECRET=<generate-strong-secret>
     CLIENT_URL=https://<your-frontend-domain>.vercel.app
     SMTP_HOST=<your-smtp-server>
     SMTP_PORT=587
     SMTP_USER=<your-email>
     SMTP_PASSWORD=<your-password>
     SMTP_FROM=noreply@coderank.com
     LOG_LEVEL=info
     ```

3. **Monitor Deployment**
   - Render will automatically rebuild on git push
   - View logs in dashboard
   - Monitor performance and errors

### Production Checklist

- ✅ Environment variables set correctly
- ✅ Database backups configured
- ✅ SSL certificate enabled (automatic on Render)
- ✅ Rate limiting active
- ✅ Logging configured
- ✅ Error monitoring setup (optional: Sentry, LogRocket)

---

## Deployment to Vercel (Frontend)

### Step 1: Build Optimization

```bash
# Production build
npm run build

# Output directory: dist/
# Size should be optimized with Vite
```

### Step 2: Deploy to Vercel

1. **Connect GitHub**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository

2. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Set Environment Variables**
   - `VITE_API_URL=https://<your-backend-domain>.render.com/api`

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on git push

### Performance Optimization

- ✅ Code splitting with React.lazy()
- ✅ Image optimization
- ✅ CSS minification with Tailwind
- ✅ Gzip compression
- ✅ Cache headers configured

---

## Environment Configuration

### Backend (.env)

```env
# Development
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug

# Production
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Database (use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/oj_db

# Security
JWT_SECRET=<generate-with: openssl rand -base64 32>
CORS_ORIGIN=https://yourdomain.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<app-password>
```

### Frontend (.env)

```env
# Development
VITE_API_URL=http://localhost:5000/api

# Production
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Testing

### Backend Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Files**
- `src/__tests__/auth.test.js` - Authentication endpoints
- `src/__tests__/problems.test.js` - Problem management
- `src/__tests__/setup.js` - Test configuration

**Test Framework**: Jest + Supertest

### Frontend Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Files**
- `src/__tests__/LoginPage.test.jsx` - Login page
- `src/__tests__/ProtectedRoute.test.jsx` - Route protection
- `src/__tests__/setup.js` - Test configuration

**Test Framework**: Vitest + React Testing Library

---

## Monitoring & Logging

### Winston Logger (Backend)

Logs are written to:
- Console (real-time)
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs

```javascript
logger.info('Server started on port 5000');
logger.error('Database connection failed:', error);
logger.warn('Rate limit exceeded for IP:', ipAddress);
```

### Morgan HTTP Logger

Logs all HTTP requests in combined format:
```
::1 - - [18/Jul/2026:10:30:45 +0000] "GET /api/problems HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
```

### Log Levels (Winston)

- `error` - Application errors
- `warn` - Warnings and deprecations
- `info` - General information (production default)
- `http` - HTTP requests
- `debug` - Debugging information (development)

### Production Monitoring

**Recommended Tools**
- **Error Tracking**: Sentry, Rollbar
- **Performance**: New Relic, DataDog
- **Logging**: ELK Stack, LogRocket
- **Uptime**: Uptime Robot, Pingdom

---

## Security Best Practices Checklist

### Backend
- ✅ HTTPS/SSL enabled (automatic on Render/Vercel)
- ✅ Rate limiting active
- ✅ Input validation and sanitization
- ✅ CORS properly configured
- ✅ Helmet security headers
- ✅ JWT tokens with expiration
- ✅ Password hashing (bcryptjs)
- ✅ Environment variables not committed
- ✅ Database credentials secured
- ✅ Logging and monitoring enabled

### Frontend
- ✅ Environment variables for API URL
- ✅ Input validation before sending
- ✅ XSS protection via React
- ✅ Secure cookie handling
- ✅ CORS headers respected
- ✅ Content Security Policy
- ✅ Regular dependency updates

### Deployment
- ✅ Code reviewed before merge
- ✅ Tests passing (CI/CD)
- ✅ Database backups automated
- ✅ Monitoring alerts configured
- ✅ Disaster recovery plan
- ✅ Regular security audits

---

## Troubleshooting

### Database Connection Failed
```bash
# Check MongoDB connection string
# Verify firewall allows connections (Render/Atlas IP whitelist)
# Check credentials in .env
```

### Rate Limit Exceeded
```bash
# Wait for the window to pass
# For development, set LOG_LEVEL=debug to see limits
# Increase limits in src/config/security.js if needed
```

### Tests Failing
```bash
# Ensure test database is running
# Check MONGODB_URI for test environment
# Run with --verbose for details: npm test -- --verbose
```

### High Memory Usage
```bash
# Check for memory leaks in logs
# Review database queries for optimization
# Monitor with: docker stats
```

---

## Next Steps

1. **Enable CI/CD**
   - GitHub Actions for automated testing
   - Deploy only on passing tests

2. **Add Monitoring**
   - Set up error tracking (Sentry)
   - Configure performance monitoring

3. **Security Audit**
   - Run npm audit regularly
   - Use OWASP dependency check

4. **Performance Optimization**
   - Database indexing
   - Query optimization
   - Caching strategy (Redis)

---

## Support & Resources

- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet Documentation](https://helmetjs.github.io/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

