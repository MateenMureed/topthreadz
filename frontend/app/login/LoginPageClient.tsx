'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FaRegSquare } from 'react-icons/fa';
import toast from 'react-hot-toast';
import SocialAuthButtons from '@/components/SocialAuthButtons';

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setUser(res.data.user);
      toast.success('Welcome back!');
      if (res.data.user.role === 'ADMIN') {
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
    <div className="min-h-[88vh] bg-[#efefef] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-surface-300 bg-[#f4f4f4] px-5 sm:px-6 py-6 shadow-soft">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-semibold tracking-wide uppercase">Welcome</h1>
          <p className="text-surface-700 text-base mt-1.5">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-2xl text-surface-700 block mb-1.5">
              Email <span className="text-sale-600">*</span>
            </label>
            <div className="relative border-b border-surface-300 pb-1.5">
              <FiMail className="absolute left-0 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none pl-6 text-base text-surface-800"
                placeholder=""
                required
                id="login-email"
              />
            </div>
          </div>

          <div>
            <label className="text-2xl text-surface-700 block mb-1.5">
              Password <span className="text-sale-600">*</span>
            </label>
            <div className="relative border-b border-surface-300 pb-1.5">
              <FiLock className="absolute left-0 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none pl-6 pr-8 text-base text-surface-800"
                placeholder=""
                required
                id="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-surface-500"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-surface-800">
            <label className="inline-flex items-center gap-2">
              <FaRegSquare className="w-4 h-4" />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="font-semibold underline underline-offset-4">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2f2d2d] text-white py-3 text-sm font-semibold uppercase"
            id="login-submit"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>

          <div className="flex items-center gap-3 pt-1">
            <div className="h-px bg-surface-300 flex-1" />
            <span className="text-sm font-semibold uppercase text-surface-800">Or continue with</span>
            <div className="h-px bg-surface-300 flex-1" />
          </div>

          <SocialAuthButtons mode="signin" redirectTo={redirectTo} />

          <p className="text-center text-sm text-surface-700 pt-1">
            Don&apos;t have account?{' '}
            <Link href="/signup" className="font-semibold underline underline-offset-4 text-surface-800">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
