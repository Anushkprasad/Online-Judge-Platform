import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: vi.fn(),
}));

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

describe('ProtectedRoute', () => {
  it('should render protected content when user is authenticated', () => {
    useAuth.mockReturnValue({
      user: { id: '123', username: 'testuser' },
      loading: false,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
