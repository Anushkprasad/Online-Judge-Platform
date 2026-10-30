import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await register(username, email, password);
    setLoading(false);

    if (result.success) {
      setSuccess('Account created successfully! Verification email simulated.');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl mb-4">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Create Account</h2>
          <p className="text-slate-400 mt-2">Start practicing and learning coding today</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-900/50 text-emerald-200 px-4 py-3 rounded-lg text-sm mb-6">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="codemaster"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-white rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
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
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
