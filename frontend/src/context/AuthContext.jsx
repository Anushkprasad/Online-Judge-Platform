import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

// Configure axios base path
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthErrorMessage = (error, fallback) => {
  if (!error.response) {
    return 'Backend server is not reachable. Please start the backend and try again.';
  }

  const responseData = error.response.data;
  if (typeof responseData === 'string') {
    return responseData;
  }

  return responseData?.message || fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set auth header helper
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Perform automatic token refresh
  const refreshTokens = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      setLoading(false);
      return null;
    }

    try {
      const response = await axios.post('/auth/refresh', { token: refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      localStorage.setItem('refreshToken', newRefreshToken);
      setAuthHeader(accessToken);
      
      // Get user profile using active token
      const profileResponse = await axios.get('/users/dashboard');
      setUser(profileResponse.data.data);
      setLoading(false);
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed, logging out:', error);
      logout();
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    refreshTokens();

    // Set up interceptor to catch expired access tokens
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const token = await refreshTokens();
          if (token) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email: email.trim(), password });
      const { accessToken, refreshToken, user: userData } = response.data;
      
      localStorage.setItem('refreshToken', refreshToken);
      setAuthHeader(accessToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getAuthErrorMessage(error, 'Login failed'),
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/auth/register', {
        username: username.trim(),
        email: email.trim(),
        password,
      });
      const { accessToken, refreshToken, user: userData } = response.data;
      
      localStorage.setItem('refreshToken', refreshToken);
      setAuthHeader(accessToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getAuthErrorMessage(error, 'Registration failed'),
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/users/profile', profileData);
      setUser((prev) => ({ ...prev, ...response.data.data }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('refreshToken');
    setAuthHeader(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
