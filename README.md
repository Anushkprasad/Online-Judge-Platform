# CodeRank - Online Judge Platform

[![CI/CD Pipeline](https://github.com/your-username/oj/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-username/oj/actions/workflows/ci-cd.yml)
[![codecov](https://codecov.io/gh/your-username/oj/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/oj)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CodeRank is a comprehensive online judge platform for competitive programming and interview preparation, featuring a full-stack architecture with admin capabilities, real-time notifications, and interactive learning features.

## Features

### For Users
- 🎯 **Problem Solving** - Browse and solve problems by difficulty and category
- 💬 **Discussions** - Collaborative problem discussion threads
- 📊 **Contests** - Participate in timed coding contests
- 📚 **Courses** - Learn from structured programming courses
- 🎓 **Interview Prep** - Dedicated interview preparation resources
- 🏆 **Leaderboard** - Compete with other users
- 📧 **Notifications** - Stay updated with real-time notifications
- 👤 **Profile** - Track achievements and badges

### For Admins
- 👥 **User Management** - Create, update, and manage users
- 📝 **Content Management** - CRUD for problems, courses, contests
- 📊 **Analytics Dashboard** - Real-time platform statistics
- 💬 **Discussion Moderation** - Flag and moderate discussions
- 📮 **Notification System** - Send targeted and broadcast notifications
- 📈 **Platform Insights** - Track user engagement and performance

### Security & Reliability
- 🔐 **Rate Limiting** - 3-tier protection against abuse
- 🛡️ **Input Sanitization** - MongoDB injection prevention
- 🔒 **Helmet Security** - HTTP security headers
- 🔑 **JWT Authentication** - Secure token-based auth
- 📝 **Comprehensive Logging** - Winston + Morgan
- 🐳 **Containerized** - Docker & Docker Compose
- ✅ **Test Coverage** - Jest + Vitest with CI/CD

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-username/oj.git
cd oj

# Option 1: Local Development
cd backend && npm install && npm run dev  # Terminal 1
cd frontend && npm install && npm run dev # Terminal 2

# Option 2: Docker Compose
docker-compose up -d
```

Visit `http://localhost:5173` for frontend and `http://localhost:5000/api` for backend.

[📖 Detailed Setup Guide](./QUICKSTART.md)

---

## Documentation

| Document | Purpose |
|----------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | Development environment setup and basic commands |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment to Render & Vercel, security config |
| [TESTING.md](./TESTING.md) | Test writing guide, best practices, coverage goals |

---

## Project Structure

```
oj/
├── backend/                      # Node.js Express server
│   ├── src/
│   │   ├── config/              # Security, database, logging configs
│   │   ├── controllers/         # Route handlers (9 controllers)
│   │   ├── models/              # Mongoose schemas (10 models)
│   │   ├── routes/              # API endpoints (9 route files)
│   │   ├── middlewares/         # Auth, error handling
│   │   ├── utils/               # Email, code executor, notifications
│   │   ├── __tests__/           # Jest tests
│   │   └── server.js            # Main app initialization
│   ├── Dockerfile               # Production image
│   ├── jest.config.js           # Test configuration
│   └── package.json
│
├── frontend/                     # React + Vite
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── context/             # AuthContext for state management
│   │   ├── pages/               # Page components (14 pages)
│   │   ├── __tests__/           # Vitest + React Testing Library
│   │   ├── App.jsx              # Main router
│   │   └── main.jsx
│   ├── Dockerfile.dev           # Development image
│   ├── vitest.config.js         # Test configuration
│   ├── vite.config.js           # Build configuration
│   ├── tailwind.config.js       # TailwindCSS setup
│   └── package.json
│
├── .github/workflows/           # GitHub Actions CI/CD
│   └── ci-cd.yml               # Automated testing & deployment
│
├── docker-compose.yml           # Local development orchestration
├── render.yaml                  # Render deployment config
├── QUICKSTART.md               # Quick start guide
├── DEPLOYMENT.md               # Production deployment guide
├── TESTING.md                  # Testing guide & best practices
└── README.md                   # This file
```

---

## API Architecture

### Core Endpoints

**Authentication**
```
POST   /api/auth/register      # Create account
POST   /api/auth/login         # Login user
POST   /api/auth/logout        # Logout
```

**Problems**
```
GET    /api/problems            # List all problems
GET    /api/problems/:slug      # Get problem details
POST   /api/problems/:slug/submit # Submit solution
POST   /api/problems/:slug/like  # Like problem
```

**Admin Panel** (Protected)
```
GET    /api/admin/analytics     # Platform analytics
GET    /api/admin/users         # User management
POST   /api/admin/users/:id     # Update user
DELETE /api/admin/users/:id     # Delete user

GET    /api/admin/problems      # Problem management
POST   /api/admin/problems      # Create problem
PUT    /api/admin/problems/:id  # Update problem
DELETE /api/admin/problems/:id  # Delete problem

GET    /api/admin/discussions   # Moderation queue
PATCH  /api/admin/discussions/:id # Approve/flag discussion

POST   /api/admin/notifications/send # Send notification
```

[Full API Documentation](./DEPLOYMENT.md#api-endpoints)

---

## Security Features

### Protection Layers

| Layer | Implementation |
|-------|-----------------|
| **Rate Limiting** | 3 tiers: General (100/15min), Auth (5/1hr), Execution (10/1min) |
| **Input Sanitization** | Express Mongo Sanitize blocks $ and . characters |
| **HTTP Headers** | Helmet with CSP, X-Frame-Options, HSTS, etc. |
| **CORS** | Strict origin validation, credentials support |
| **Authentication** | JWT tokens with 7-day expiration |
| **Password** | bcryptjs hashing, min 6 characters |
| **Logging** | Winston file logs + Morgan HTTP logging |
| **Admin Access** | Role-based authorization on all admin routes |

[Security Hardening Details](./DEPLOYMENT.md#security-hardening)

---

## Testing

### Coverage Summary

- **Backend**: Jest + Supertest
  - Auth tests (register, login)
  - Problem listing and details
  - Admin endpoints (in progress)

- **Frontend**: Vitest + React Testing Library
  - Login page interaction
  - Route protection
  - Component tests (in progress)

- **Current Coverage**: 50% baseline
- **Target Coverage**: 80%+

```bash
# Run all tests
npm test              # Backend
npm run test:coverage # With report

# Frontend
npm run test          # Frontend
npm run test:coverage # With report
```

[Testing Guide](./TESTING.md)

---

## Deployment

### Render (Backend)

1. **Connect GitHub**: Authorize Render access
2. **Configure Environment**: Set MONGODB_URI, JWT_SECRET, etc.
3. **Deploy**: Automatic on push to main branch
4. **Monitoring**: View logs and metrics in Render dashboard

### Vercel (Frontend)

1. **Connect GitHub**: Authorize Vercel
2. **Set Environment**: VITE_API_URL points to backend
3. **Deploy**: Automatic production builds
4. **Performance**: Built-in optimization and CDN

[Deployment Guide](./DEPLOYMENT.md)

---

## Performance Metrics

### Frontend (Vite)
- ⚡ ~200KB gzipped bundle
- 🎯 Code splitting with React.lazy()
- 💾 Tailwind CSS optimization
- 📊 Performance insights via Vite

### Backend (Node.js)
- 🚀 Sub-100ms API response times
- 🔄 Connection pooling optimized
- 📈 Horizontal scaling ready
- 🐳 Docker container optimization

---

## Development Workflow

### Local Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: MongoDB (if not using Docker)
mongod
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Making Changes

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test locally
3. Run test suite: `npm test`
4. Commit changes: `git commit -m "message"`
5. Push: `git push origin feature/name`
6. Create Pull Request
7. CI/CD runs tests and deploys on merge

---

## Technology Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Express.js** | Web framework |
| **MongoDB** | Document database |
| **Mongoose** | MongoDB ODM |
| **JWT** | Authentication |
| **Socket.io** | Real-time notifications |
| **Winston** | Structured logging |
| **Helmet** | Security headers |
| **Jest** | Testing framework |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **TailwindCSS** | Styling |
| **Axios** | HTTP client |
| **React Router** | Navigation |
| **Vitest** | Testing framework |
| **Lucide Icons** | Icon library |

### DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local orchestration |
| **GitHub Actions** | CI/CD |
| **Render** | Backend hosting |
| **Vercel** | Frontend hosting |
| **MongoDB Atlas** | Managed database |

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/oj_db
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
LOG_LEVEL=debug
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

[Environment Details](./QUICKSTART.md#environment-configuration)

---

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Verify MongoDB is running
- Check connection string in .env
- Ensure credentials are correct

**Port Already in Use**
- Change port in .env
- Kill process: `lsof -i :5000`

**Tests Failing**
- Ensure MongoDB test instance is running
- Check test database configuration
- Run with `--verbose` flag

**Memory Issues**
- Check for memory leaks in logs
- Optimize database queries
- Monitor with `docker stats`

[Full Troubleshooting Guide](./DEPLOYMENT.md#troubleshooting)

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- Follow existing code style
- Write tests for new features
- Update documentation
- Ensure CI/CD passes

---

## Performance Optimization

### Current
- ✅ Rate limiting to prevent abuse
- ✅ Database indexing on frequently queried fields
- ✅ Gzip compression
- ✅ JWT caching

### Future
- ⏳ Redis caching layer
- ⏳ Database query optimization
- ⏳ Frontend lazy loading
- ⏳ CDN for static assets

---

## Monitoring & Analytics

### Integrated
- ✅ Winston structured logging
- ✅ Morgan HTTP request logging
- ✅ Admin analytics dashboard
- ✅ Test coverage reports

### Recommended Additions
- Sentry for error tracking
- DataDog for performance monitoring
- LogRocket for frontend debugging
- New Relic for application insights

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support & Resources

- 📖 [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- 🛡️ [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- 🐳 [Docker Documentation](https://docs.docker.com)
- ⚛️ [React Documentation](https://react.dev)
- 🧪 [Testing Library Documentation](https://testing-library.com)

---

## Roadmap

### Phase 1 ✅
- Core user authentication
- Problem CRUD operations
- Basic admin panel
- Docker containerization

### Phase 2 ⏳
- Enhanced testing coverage
- Real-time notifications via Socket.io
- Discussion moderation system
- Contest management

### Phase 3 📋
- Advanced analytics
- Performance optimization
- Mobile app
- AI-powered code review

---

## Contact

For questions or support:
- Create an Issue: [GitHub Issues](https://github.com/your-username/oj/issues)
- Email: your-email@example.com

---

**Made with ❤️ for the programming community**
