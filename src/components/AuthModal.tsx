import { useState } from 'react';
import { Lock, Mail, Sparkles, User, X } from 'lucide-react';
import { useLanguage } from '../i18n';
import type { UserProfile } from '../types';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, token: string) => void;
}

export function AuthModal({ open, onClose, onAuthSuccess }: AuthModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && name.trim().length < 2) {
      setError(t.authNameError);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.authEmailError);
      return;
    }
    if (password.length < 8) {
      setError(t.authPasswordError);
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { user?: UserProfile; token?: string; error?: string };
      if (!res.ok || !data.user || !data.token) {
        throw new Error(data.error || 'Authentication failed.');
      }
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = (await res.json()) as { user?: UserProfile; token?: string; error?: string };
      if (!res.ok || !data.user || !data.token) {
        throw new Error(data.error || 'Demo sign-in unavailable.');
      }
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 id="auth-modal-title" className="font-display text-xl font-bold text-slate-950 dark:text-white">
            {mode === 'login' ? t.signInTitle : t.signUpTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeMenu}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t.authSubtitle}
        </p>

        {/* Mode Switch */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'login'
                ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.signIn}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'register'
                ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.signUp}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.fullName}
              </label>
              <div className="relative mt-1">
                <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ananya Verma"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.emailAddress}
            </label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.password}
            </label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-xl bg-[#14532D] text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
          >
            {loading ? t.pleaseWait : mode === 'login' ? t.signIn : t.createAccount}
          </button>
        </form>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            {t.demoLoginBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
