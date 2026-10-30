# CodeRank - Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Docker and Docker Compose (optional, for containerized setup)

---

## Development Setup

### Option 1: Local Development (Recommended)

#### 1. Clone Repository
```bash
git clone <repository-url>
cd oj
```

#### 2. Backend Setup
```bash
cd backend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start backend (development mode)
npm run dev
```

Backend will run on `http://localhost:5000`

#### 3. Frontend Setup (new terminal)
```bash
cd frontend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start frontend (development mode)
npm run dev
```

Frontend will run on `http://localhost:5173`

---

### Option 2: Docker Compose (All-in-one)

```bash
# From project root
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update .env with your MongoDB credentials if needed

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

Services:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- MongoDB: `mongodb://admin:password@localhost:27017/oj_db`

---

## Environment Configuration

### Backend (.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/oj_db
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@coderank.com
LOG_LEVEL=debug
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Available Scripts

### Backend

```bash
npm run start     # Production
npm run dev       # Development with auto-reload
npm test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Frontend

```bash
npm run dev       # Development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run test      # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

---

## Testing

### Run All Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage

```bash
# Backend
npm run test:coverage

# Frontend
npm run test:coverage
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Problems
- `GET /api/problems` - Get all problems
- `GET /api/problems/:slug` - Get problem details
- `POST /api/problems/:slug/submit` - Submit solution
- `POST /api/problems/:slug/like` - Like problem

### Admin Panel (Admin only)
- `GET /api/admin/dashboard` - Analytics
- `GET /api/admin/users` - User management
- `GET /api/admin/problems` - Problem management
- `GET /api/admin/contests` - Contest management
- `GET /api/admin/discussions` - Discussion moderation
- `POST /api/admin/notifications/send` - Send notifications

---

## Deployment

### Backend: Render

1. Push code to GitHub
2. Create Web Service on Render
3. Connect repository
4. Set environment variables
5. Deploy

[Detailed Deployment Guide](./DEPLOYMENT.md#deployment-to-render-backend)

### Frontend: Vercel

1. Push code to GitHub
2. Import project on Vercel
3. Set `VITE_API_URL` environment variable
4. Deploy

[Detailed Deployment Guide](./DEPLOYMENT.md#deployment-to-vercel-frontend)

---

## Troubleshooting

### MongoDB Connection Error
```
Make sure MongoDB is running and connection string is correct in .env
For local: mongodb://localhost:27017/oj_db
For Atlas: mongodb+srv://user:password@cluster.mongodb.net/oj_db
```

### Port Already in Use
```bash
# Change port in .env (backend) or vite.config.js (frontend)
# Or kill process using the port:
# macOS/Linux: lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill
# Windows: netstat -ano | findstr :5000
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Tests Failing
```bash
# Make sure test database is running
# Check MONGODB_URI environment
# Run with verbose: npm test -- --verbose
```

---

## Project Structure

```
oj/
├── backend/
│   ├── src/
│   │   ├── __tests__/           # Test files
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # Route controllers
│   │   ├── middlewares/         # Express middlewares
│   │   ├── models/              # Database models
│   │   ├── routes/              # API routes
│   │   ├── utils/               # Utility functions
│   │   └── server.js            # Main server file
│   ├── Dockerfile
│   ├── jest.config.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── __tests__/           # Test files
│   │   ├── components/          # React components
│   │   ├── context/             # Context API
│   │   ├── pages/               # Page components
│   │   └── App.jsx              # Main app
│   ├── Dockerfile.dev
│   ├── vitest.config.js
│   └── package.json
│
├── docker-compose.yml
├── render.yaml
├── DEPLOYMENT.md                # Deployment guide
└── README.md
```

---

## Security Features

✅ Rate limiting on auth endpoints  
✅ Input sanitization (MongoDB injection prevention)  
✅ Helmet security headers  
✅ CORS properly configured  
✅ JWT authentication  
✅ Password hashing  
✅ Admin role-based access control  
✅ Request logging  
✅ Error handling  

---

## Performance Tips

1. **Database**
   - Use MongoDB Atlas for production
   - Create indexes for frequently queried fields
   - Monitor query performance

2. **Frontend**
   - Use React.lazy() for code splitting
   - Optimize images
   - Enable gzip compression

3. **Caching**
   - Implement Redis for session management
   - Cache frequent API responses
   - Set appropriate cache headers

---

## Next Steps

1. ✅ Set up development environment
2. ✅ Run tests to verify setup
3. ✅ Explore the codebase
4. ✅ Make your first contribution
5. 🚀 Deploy to production

---

## Support

For issues and questions:
- Check [Troubleshooting](#troubleshooting) section
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides
- Check documentation in code comments

---

**Happy Coding! 🚀**
