'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import SocialAuthButtons from '@/components/SocialAuthButtons';

export default function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser } = useAuthStore();
  const { isOpen, view, redirectTo, closeModal, switchView } = useAuthModalStore();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', password: '' });

  const finalRedirect = useMemo(() => {
    if (redirectTo) return redirectTo;
    if (pathname && pathname !== '/login' && pathname !== '/signup') return pathname;
    return '/checkout';
  }, [pathname, redirectTo]);

  useEffect(() => {
    if (!isOpen) {
      setShowPassword(false);
      setLoading(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeModal, isOpen]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await authService.login({ email: loginEmail, password: loginPassword });
      setUser(res.data.user);
      toast.success('Welcome back!');
      closeModal();
      if (res.data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push(finalRedirect);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await authService.signup(signupForm);
      toast.success('Account created! Please sign in.');
      switchView('login');
      setLoginEmail(signupForm.email);
      setLoginPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center sm:px-4 sm:py-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
        onClick={closeModal}
        aria-label="Close authentication popup"
      />

      <div className="relative w-full h-full sm:h-auto sm:max-w-md sm:rounded-2xl sm:border border-surface-300 bg-[#f7f7f7] p-5 sm:p-6 sm:shadow-soft-lg animate-slide-up flex flex-col justify-center">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-surface-300 bg-white text-surface-700 hover:bg-surface-100"
          aria-label="Close"
        >
          <FiX className="h-4 w-4" />
        </button>

        <div className="mb-5 text-center">
          <p className="fashion-display text-[34px] leading-none tracking-[0.08em] text-surface-900">TOP THREADZ</p>
          <h2 className="fashion-display mt-1 text-2xl font-semibold uppercase tracking-[0.16em] text-surface-900">
            {view === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="fashion-body mt-1 text-sm text-surface-600">
            {view === 'login'
              ? 'Sign in to continue shopping'
              : 'Join the modern menswear edit'}
          </p>
        </div>

        {view === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4 fashion-body">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-[0.15em] text-surface-600" htmlFor="modal-login-email">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="email"
                  id="modal-login-email"
                  name="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-surface-500"
                  placeholder="you@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-[0.15em] text-surface-600" htmlFor="modal-login-password">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="modal-login-password"
                  name="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-surface-500"
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-surface-700">
              <span>Secure member login</span>
              <Link href="/forgot-password" onClick={closeModal} className="underline underline-offset-4">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="modal-login-submit"
              className="fashion-body w-full rounded-xl bg-surface-900 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-surface-800"
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-surface-300" />
              <span className="text-[11px] uppercase tracking-[0.12em] text-surface-500">or continue with</span>
              <div className="h-px flex-1 bg-surface-300" />
            </div>

            <SocialAuthButtons mode="signin" redirectTo={finalRedirect} />

            <p className="text-center text-sm text-surface-700">
              No account?{' '}
              <button type="button" onClick={() => switchView('signup')} className="font-semibold underline underline-offset-4">
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3.5 fashion-body">
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                id="modal-signup-name"
                name="name"
                autoComplete="name"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                className="w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-surface-500"
                placeholder="Full name"
                required
              />
            </div>

            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="email"
                id="modal-signup-email"
                name="email"
                autoComplete="email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                className="w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-surface-500"
                placeholder="Email"
                required
              />
            </div>

            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="tel"
                id="modal-signup-phone"
                name="phone"
                autoComplete="tel"
                value={signupForm.phone}
                onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                className="w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-surface-500"
                placeholder="Phone"
                required
              />
            </div>

            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="modal-signup-password"
                name="password"
                autoComplete="new-password"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                className="w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-surface-500"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="modal-signup-submit"
              className="w-full rounded-xl bg-surface-900 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-surface-800"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-surface-700 pt-1">
              Already a member?{' '}
              <button type="button" onClick={() => switchView('login')} className="font-semibold underline underline-offset-4">
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
