import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Welcome Back</h2>
          <p className="text-slate-400 mt-2">Elevate your coding skills on CodeRank</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-white rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-blue-500 hover:text-blue-400">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-white rounded-lg pl-10 pr-10 py-2.5 outline-none transition-all placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-8">
          New to the platform?{' '}
          <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
