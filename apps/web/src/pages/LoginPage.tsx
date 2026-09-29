import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';

const DEMO_USERS = [
  { name: 'Alex Rivers', identifier: 'alex@pulsechat.io', password: 'Password123!' },
  { name: 'Sarah Chen', identifier: 'sarah@pulsechat.io', password: 'Password123!' },
  { name: 'Marcus Vance', identifier: 'marcus@pulsechat.io', password: 'Password123!' },
  { name: 'Elena Rostova', identifier: 'elena@pulsechat.io', password: 'Password123!' },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ identifier, password, rememberMe });
      navigate('/');
    } catch {
      // error handled in store
    }
  };

  const handleQuickDemo = async (demo: typeof DEMO_USERS[0]) => {
    setIdentifier(demo.identifier);
    setPassword(demo.password);
    try {
      await login({ identifier: demo.identifier, password: demo.password, rememberMe: true });
      navigate('/');
    } catch {
      // error handled
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background selection:bg-primary/20">
      <div className="w-full max-w-md bg-card border rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 mx-auto">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95a1 1 0 0 0 1.258 1.258l4.782-1.388A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-xs text-muted-foreground">Sign in to continue connecting on PulseChat</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Email or Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="name@example.com or @username"
                value={identifier}
                onChange={(e) => {
                  clearError();
                  setIdentifier(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  clearError();
                  setPassword(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/20"
              />
              <span className="text-muted-foreground">Remember me</span>
            </label>
            <a href="#" className="text-primary hover:underline font-medium">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/25 transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Sign In
          </button>
        </form>

        {/* Demo Accounts Quick Login */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Demo Accounts (1-Click Login):
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.identifier}
                type="button"
                onClick={() => handleQuickDemo(demo)}
                disabled={isLoading}
                className="px-2.5 py-1.5 text-left rounded-lg bg-secondary/60 hover:bg-secondary border border-border/60 transition-colors text-[11px]"
              >
                <p className="font-semibold text-foreground truncate">{demo.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{demo.identifier.split('@')[0]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
