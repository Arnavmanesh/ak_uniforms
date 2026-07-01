import React from 'react';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { Page } from '../types';

interface AdminLoginPageProps {
  onLogin: (password: string) => boolean;
  onNavigate: (page: Page) => void;
  error: string | null;
}

export function AdminLoginPage({ onLogin, onNavigate, error }: AdminLoginPageProps) {
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError('Please enter the admin password');
      return;
    }
    setLocalError(null);
    onLogin(password);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="glass rounded-2xl p-8 border border-white/5 glow">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-400 text-sm">Enter the admin password to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-dark-900 border border-white/10 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{displayError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-500/30"
            >
              <Lock className="w-5 h-5" />
              Login to Admin Panel
            </button>
          </form>

          {/* Back to Home */}
          <button
            onClick={() => onNavigate('home')}
            className="w-full mt-4 px-6 py-3 glass text-gray-300 rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            Back to Home
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-gray-500 text-sm mt-4">
          Contact the administrator if you don't have the password
        </p>
      </div>
    </div>
  );
}
