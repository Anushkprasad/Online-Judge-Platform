import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      login: vi.fn(),
    });
  });

  it('should render login form', () => {
    const { container } = renderWithRouter(<LoginPage />);
    
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    const login = vi.fn();
    useAuth.mockReturnValue({ login });
    renderWithRouter(<LoginPage />);
    
    const loginButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(loginButton);
    
    // Form validation should prevent submission
    expect(login).not.toHaveBeenCalled();
  });

  it('should submit login form with valid data', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValueOnce({ success: true });
    useAuth.mockReturnValue({ login });

    const { container } = renderWithRouter(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = container.querySelector('input[type="password"]');
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should handle login error', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValueOnce({ success: false, message: 'Invalid credentials' });
    useAuth.mockReturnValue({ login });

    const { container } = renderWithRouter(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = container.querySelector('input[type="password"]');
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should have register link', () => {
    renderWithRouter(<LoginPage />);
    
    const registerLink = screen.getByRole('link', { name: /create an account/i });
    expect(registerLink).toBeInTheDocument();
  });
});
