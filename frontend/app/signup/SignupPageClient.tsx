'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import SocialAuthButtons from '@/components/SocialAuthButtons';

export default function SignupPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirectTo = searchParams.get('redirect') || '/checkout';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.signup(form);
      toast.success('Account created! Please sign in.');
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold">Create Account</h1>
          <p className="text-surface-500 mt-2">Join MensWear.pk today</p>
        </div>

        <form onSubmit={handleSignup} className="card p-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-surface-700 block mb-2" htmlFor="signup-name">Full Name</label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
              <input
                type="text"
                id="signup-name"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field !pl-11"
                placeholder="Muhammad Ali"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-surface-700 block mb-2" htmlFor="signup-email">Email</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
              <input
                type="email"
                id="signup-email"
                name="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field !pl-11"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-surface-700 block mb-2" htmlFor="signup-phone">Phone</label>
            <div className="relative">
              <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
              <input
                type="tel"
                id="signup-phone"
                name="phone"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field !pl-11"
                placeholder="03001234567"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-surface-700 block mb-2" htmlFor="signup-password">Password</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="signup-password"
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field !pl-11 !pr-11"
                placeholder="Min 8 chars, 1 upper, 1 number"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full" id="signup-submit">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="relative py-1">
            <div className="border-t border-surface-200" />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-3 text-xs text-surface-400">OR</span>
          </div>

          <SocialAuthButtons mode="signup" redirectTo={redirectTo} />

          <p className="text-center text-sm text-surface-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
