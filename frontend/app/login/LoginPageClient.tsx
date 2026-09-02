'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import SocialAuthButtons from '@/components/SocialAuthButtons';

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirectTo = searchParams.get('redirect') || '/checkout';

  useEffect(() => {
    const oauthError = searchParams.get('oauthError');
    if (oauthError) {
      toast.error(decodeURIComponent(oauthError));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      // Do not mark the client authenticated until the browser has returned
      // the just-issued session cookie. This catches cookie-policy failures
      // instead of leaving an admin page backed only by persisted local state.
      const session = await authService.session();
      const user = session.data?.user || res.data.user;
      setUser(user);
      toast.success('Welcome back!');
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] bg-[#F7F6F3] flex items-stretch justify-center">
      <div className="w-full max-w-5xl my-4 sm:my-8 mx-4 rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(15,31,61,0.25)] grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] bg-white">
        {/* Brand Panel — desktop only */}
        <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-b from-[#0F1F3D] to-[#081020] text-white p-10 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#D4A84B]/[0.08] blur-[100px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-white/[0.04] blur-[100px]"
          />

          <Link href="/" className="relative inline-flex items-center">
            <div className="relative h-9 w-32">
              <Image
                src="/images/topthreadz-logo-light.png"
                alt="Top Threadz"
                width={160}
                height={50}
                className="h-full w-auto object-contain brightness-125"
              />
            </div>
          </Link>

          <div className="relative space-y-4 max-w-sm">
            <div className="h-px w-10 bg-gradient-to-r from-[#D4A84B] to-[#E8C86A]" />
            <h2 className="font-display text-[26px] leading-tight font-semibold text-white">
              Crafted fabric, made for the way you dress.
            </h2>
            <p className="text-[13.5px] leading-relaxed text-white/55">
              Sign in to track orders, save your favourite brands, and check out faster next
              time.
            </p>
          </div>

          <p className="relative text-[11.5px] text-white/35">
            © {new Date().getFullYear()} Top Threadz. All rights reserved.
          </p>
        </div>

        {/* Form Panel */}
        <div className="px-5 sm:px-10 lg:px-12 py-8 sm:py-10 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile-only brand mark */}
            <Link href="/" className="lg:hidden inline-flex items-center mb-6">
              <div className="relative h-8 w-28">
                <Image
                  src="/images/topthreadz-logo.png"
                  alt="Top Threadz"
                  width={140}
                  height={44}
                  className="h-full w-auto object-contain"
                />
              </div>
            </Link>

            <div className="mb-7">
              <h1 className="font-display text-[26px] sm:text-[28px] font-semibold text-[#0F1F3D]">
                Welcome back
              </h1>
              <p className="text-[13.5px] text-surface-600 mt-1.5">
                Sign in to continue to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="text-[12.5px] font-medium text-surface-700 block mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 rounded-xl border border-surface-300 bg-white pl-10 pr-3.5 text-[14.5px] text-[#0F1F3D] outline-none transition-colors focus:border-[#D4A84B] focus:ring-4 focus:ring-[#D4A84B]/10"
                    placeholder="you@example.com"
                    required
                    id="login-email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="text-[12.5px] font-medium text-surface-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[12px] font-semibold text-[#0F1F3D] hover:text-[#D4A84B] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 rounded-xl border border-surface-300 bg-white pl-10 pr-11 text-[14.5px] text-[#0F1F3D] outline-none transition-colors focus:border-[#D4A84B] focus:ring-4 focus:ring-[#D4A84B]/10"
                    placeholder="••••••••"
                    required
                    id="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none pt-0.5">
                <span className="relative flex h-4.5 w-4.5 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-4.5 w-4.5 rounded-md border border-surface-300 bg-white transition-colors peer-checked:border-[#0F1F3D] peer-checked:bg-[#0F1F3D]" />
                  <FiCheck className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </span>
                <span className="text-[13px] text-surface-700">Remember me</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="group w-full h-12 rounded-xl bg-[#0F1F3D] text-white text-[13.5px] font-semibold uppercase tracking-wide inline-flex items-center justify-center gap-2 transition-colors hover:bg-[#0a1730] disabled:opacity-60 disabled:cursor-not-allowed"
                id="login-submit"
              >
                {loading ? (
                  'Logging In...'
                ) : (
                  <>
                    Login
                    <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 pt-1">
                <div className="h-px bg-surface-300 flex-1" />
                <span className="text-[11.5px] font-semibold uppercase tracking-wide text-surface-500">
                  Or continue with
                </span>
                <div className="h-px bg-surface-300 flex-1" />
              </div>

              <SocialAuthButtons mode="signin" redirectTo={redirectTo} />

              <p className="text-center text-[13.5px] text-surface-600 pt-1">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold text-[#0F1F3D] hover:text-[#D4A84B] transition-colors">
                  Sign Up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}