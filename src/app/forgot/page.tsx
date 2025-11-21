'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE, saveSession } from '@/lib/auth';

type Step = 'request' | 'reset' | 'done';

function ForgotPageContent() {
  const router = useRouter();
  const search = useSearchParams();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [emailFromUrl, setEmailFromUrl] = useState(false);

  // Pre-fill email from ?email=... (from email link)
  useEffect(() => {
    const qEmail = search.get('email');
    if (qEmail) {
      setEmail(qEmail);
      setEmailFromUrl(true);
    }
  }, [search]);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devCode, setDevCode] = useState(''); // show reset_code while in dev

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Could not send reset code');
      }

      if (data.reset_code) {
        setDevCode(data.reset_code);
      }

      setMessage(
        'A reset code has been generated. Please check your email (or use the code shown below for testing).'
      );
      setStep('reset');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send reset code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Could not reset password');
      }

      if (data.token && data.email && data.role) {
        // Log them in immediately
        saveSession({ token: data.token, email: data.email, role: data.role });
        setMessage('Your password has been reset. Redirecting you to your dashboard…');
        setStep('done');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setMessage('Password reset successful. You can now sign in.');
        setStep('done');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not reset password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url(/images/header.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blurred background overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm z-[1500]"
        style={{ backgroundColor: 'rgba(9, 21, 39, 0.7)' }}
      />

      <div className="relative z-[2000] w-full max-w-2xl mx-5">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex min-h-[420px] isolate">
          {/* Left Section - Gradient Blue Sidebar */}
          <div
            className="w-1/4 hidden md:block"
            style={{
              background: 'linear-gradient(180deg, #071F45 0%, #203F70 100%)',
              flexShrink: 0,
            }}
          ></div>

          {/* Right Section - Content */}
          <div className="bg-[#E6E6E6] flex-1 p-8 md:p-10 flex flex-col justify-center overflow-hidden">
            {/* Logo and Title */}
            <div className="text-center mb-6">
              <Link href="/" className="inline-block">
                <img
                  src="/images/Logo 4.png"
                  alt="Star4ce"
                  className="h-12 md:h-16 mx-auto mb-3"
                />
              </Link>
              <h2 className="text-xl font-semibold text-[#0B2E65] mb-1">
                Forgot your login information?
              </h2>
              <p className="text-gray-700 text-sm">
                Reset your password in two quick steps.
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                {message}
              </div>
            )}

            {/* Step 1: Request reset code */}
            {step === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Work Email
                  </label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none ${
                      emailFromUrl ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    readOnly={emailFromUrl}
                    required
                  />
                  {emailFromUrl && (
                    <p className="mt-1 text-xs text-gray-500">
                      Email pre-filled from reset link
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending code…' : 'Send reset code'}
                </button>

                <div className="text-center text-sm text-gray-700">
                  Remembered your password?{' '}
                  <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
                    Go back to sign in
                  </Link>
                </div>
              </form>
            )}

            {/* Step 2: Enter code + new password */}
            {step === 'reset' && (
              <form onSubmit={handleReset} className="space-y-6">
                <div className="text-sm text-gray-700">
                  Enter the reset code sent to{' '}
                  <span className="font-semibold">{email}</span>.
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none tracking-[0.2em] text-center font-semibold"
                    value={code}
                    onChange={e => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(value);
                    }}
                    maxLength={6}
                    required
                    placeholder="000000"
                    inputMode="numeric"
                  />
                  {devCode && (
                    <p className="text-xs text-gray-600 mt-1">
                      Dev code: <span className="font-mono">{devCode}</span>
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="New password (min 8 chars)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            )}

            {/* Step 3: Done */}
            {step === 'done' && (
              <div className="space-y-6 text-center">
                <p className="text-gray-700">
                  Your password has been reset. You will be redirected to your dashboard.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block bg-[#0B2E65] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                >
                  Go to dashboard now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ForgotPageContent />
    </Suspense>
  );
}
