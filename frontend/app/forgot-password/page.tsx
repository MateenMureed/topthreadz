'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch {
      toast.error('Unable to request a password reset. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[78vh] bg-[#efefef] px-4 py-10 sm:py-16 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-surface-300 bg-[#f4f4f4] p-6 sm:p-8 shadow-soft">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-surface-700 hover:text-surface-950">
          <FiArrowLeft aria-hidden="true" /> Back to login
        </Link>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-wide uppercase text-surface-950">Reset password</h1>
        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {submitted
            ? 'If an account matches that email address, password-reset instructions will be sent shortly.'
            : 'Enter your account email and we’ll send password-reset instructions if it exists.'}
        </p>
        {!submitted ? (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label htmlFor="forgot-password-email" className="text-sm font-semibold text-surface-800">Email address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" aria-hidden="true" />
              <input
                id="forgot-password-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-surface-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-surface-700"
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm font-semibold uppercase disabled:opacity-60">
              {submitting ? 'Sending…' : 'Send reset instructions'}
            </button>
          </form>
        ) : (
          <Link href="/login" className="btn-primary mt-6 block w-full py-3 text-center text-sm font-semibold uppercase">Return to login</Link>
        )}
      </section>
    </main>
  );
}
