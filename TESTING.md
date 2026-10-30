# Testing Guide

## Overview

This project uses:
- **Backend**: Jest + Supertest for API testing
- **Frontend**: Vitest + React Testing Library for component testing

Both test suites run automatically in CI/CD pipeline and can be run locally.

---

## Backend Testing

### Setup

```bash
cd backend
npm install
```

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run specific test file
npm test auth.test.js

# Run with verbose output
npm test -- --verbose

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
backend/src/__tests__/
├── setup.js              # Test environment setup
├── auth.test.js          # Authentication tests
└── problems.test.js      # Problem management tests
```

### Writing Backend Tests

#### Example: Testing an API Endpoint

```javascript
import request from 'supertest';
import app from '../server';
import User from '../models/User';

describe('POST /api/auth/login', () => {
  it('should login user with valid credentials', async () => {
    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'hashedPassword',
      username: 'testuser'
    });

    // Make request
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password'
      });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data.user.id).toBe(user._id.toString());
  });

  it('should return 401 with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'notfound@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Invalid credentials');
  });
});
```

### Test Conventions

**Naming**: `[resource].test.js` (e.g., `auth.test.js`)

**Structure**:
```javascript
describe('Endpoint/Feature', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

**Assertions**:
```javascript
// Status codes
expect(response.status).toBe(200);
expect(response.status).toBe(401);
expect(response.status).toBe(500);

// Response body
expect(response.body).toHaveProperty('data');
expect(response.body.message).toBe('Success');
expect(response.body.data).toBeArray();
expect(response.body.data[0]).toMatchObject({ id: '123' });

// Headers
expect(response.headers['content-type']).toContain('application/json');
```

### Mocking in Backend Tests

```javascript
// Mock mongoose model
jest.mock('../models/User', () => ({
  find: jest.fn().mockResolvedValue([...mockUsers]),
  findById: jest.fn().mockResolvedValue(mockUser),
  create: jest.fn().mockResolvedValue(mockUser),
}));

// Mock external service
jest.mock('../utils/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));
```

### Coverage Requirements

- **Lines**: 50%
- **Functions**: 50%
- **Branches**: 50%
- **Statements**: 50%

Check coverage:
```bash
npm run test:coverage
# Opens coverage/lcov-report/index.html
```

---

## Frontend Testing

### Setup

```bash
cd frontend
npm install
```

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test LoginPage.test.jsx

# Run with UI dashboard
npm run test -- --ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
frontend/src/__tests__/
├── setup.js                    # Test environment setup
├── LoginPage.test.jsx          # Login page tests
├── ProtectedRoute.test.jsx     # Route protection tests
└── [component].test.jsx        # Component tests
```

### Writing Frontend Tests

#### Example: Testing a Component

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';

describe('LoginPage', () => {
  it('should render login form', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Type in inputs
    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    
    // Click submit
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

### Test Utilities

#### Query Elements

```javascript
// ✅ Preferred (by role)
screen.getByRole('button', { name: /login/i });
screen.getByRole('heading', { name: /problems/i });
screen.getByRole('textbox', { name: /email/i });

// ✅ Good (by label)
screen.getByLabelText(/username/i);

// ✅ Good (by placeholder)
screen.getByPlaceholderText(/email/i);

// ⚠️ Last resort (by text)
screen.getByText(/submit/i);

// ✅ Querying with getAllBy
screen.getAllByRole('button');

// ✅ Querying optional (queryBy)
screen.queryByText(/not found/i); // returns null if not found
```

#### User Interactions

```javascript
const user = userEvent.setup();

// Type text
await user.type(emailInput, 'test@example.com');

// Click elements
await user.click(button);

// Double click
await user.dblClick(button);

// Type and submit
await user.type(input, 'value');
await user.keyboard('{Enter}');

// Select dropdown
await user.selectOptions(select, 'option-value');

// Clear input
await user.clear(input);
```

#### Async Waits

```javascript
import { waitFor } from '@testing-library/react';

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

// Wait with timeout (default 1000ms)
await waitFor(() => {
  expect(screen.getByText(/data/i)).toBeInTheDocument();
}, { timeout: 3000 });
```

### Mocking in Frontend Tests

```javascript
// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import axios from 'axios';

// Mock successful response
axios.get.mockResolvedValueOnce({
  data: { problems: [...] }
});

// Mock error response
axios.post.mockRejectedValueOnce({
  response: { data: { message: 'Error' } }
});
```

#### Mocking Context

```javascript
import { AuthContext } from '../../context/AuthContext';

const mockAuthValue = {
  user: { id: '123', username: 'testuser' },
  login: vi.fn(),
  logout: vi.fn(),
};

render(
  <AuthContext.Provider value={mockAuthValue}>
    <MyComponent />
  </AuthContext.Provider>
);
```

### Component Testing Patterns

#### Testing with Navigation

```javascript
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

renderWithRouter(<MyComponent />);
```

#### Testing with Auth Context

```javascript
const renderWithAuth = (component, user = null) => {
  const mockAuthValue = {
    user,
    login: vi.fn(),
    logout: vi.fn(),
  };
  
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

renderWithAuth(<Dashboard />, { id: '123', role: 'admin' });
```

### Coverage Requirements

- **Lines**: 50%
- **Functions**: 50%
- **Branches**: 50%
- **Statements**: 50%

Generate report:
```bash
npm run test:coverage
# Opens coverage/lcov-report/index.html
```

---

## CI/CD Integration

### GitHub Actions

Workflow file: `.github/workflows/ci-cd.yml`

**On Push/PR**:
1. Backend tests run with MongoDB service
2. Frontend tests run with jsdom
3. Coverage uploaded to Codecov
4. Build verification
5. Deploy to staging/production (main branch only)

### Running Locally Before Push

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
npm run test:coverage

# Build verification
npm run build
```

---

## Best Practices

### Backend

✅ Test both success and error cases  
✅ Use meaningful test names  
✅ Clean up database after tests  
✅ Mock external services  
✅ Test edge cases (empty arrays, null values, etc.)  
✅ Use descriptive assertions  

### Frontend

✅ Test user interactions, not implementation  
✅ Use `getByRole` and `getByLabel` for queries  
✅ Test accessibility (keyboard navigation, screen reader)  
✅ Mock external API calls  
✅ Test error states  
✅ Avoid testing implementation details  

---

## Debugging Tests

### Backend

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test with debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# View actual vs expected
expect(actual).toEqual(expected); // Shows diff in console
```

### Frontend

```bash
# Run with UI dashboard
npm run test -- --ui

# Use .only to run single test
it.only('should test this', () => {
  // ...
});

# Use .skip to skip test
it.skip('should not run', () => {
  // ...
});

# Debug in browser
screen.debug(); // Prints DOM
screen.debug(element); // Prints specific element
```

---

## Common Issues

### "Cannot find module" in tests

```javascript
// Make sure path is relative to test file
import User from '../../models/User';
```

### "act()" warning in React tests

```javascript
// Wrap state updates in act()
await waitFor(() => {
  expect(screen.getByText(/text/i)).toBeInTheDocument();
});
```

### Timeout waiting for async operation

```javascript
// Increase timeout
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 5000 });
```

---

## Test Coverage Goals

### Phase 1 (Current)
- ✅ Core auth endpoints (login, register)
- ✅ Problem listing and details
- ✅ Route protection
- ⏳ Target: 50% coverage

### Phase 2 (Next)
- ⏳ All admin endpoints
- ⏳ Contest management
- ⏳ Course management
- ⏳ Discussion moderation
- ⏳ Target: 70% coverage

### Phase 3 (Future)
- ⏳ Notification system
- ⏳ Socket.io events
- ⏳ Error handling
- ⏳ Target: 80%+ coverage

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

