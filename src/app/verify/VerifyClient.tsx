'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/auth';

export default function VerifyPage() {
  const search = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Pre-fill email from ?email=...
  useEffect(() => {
    const qEmail = search.get('email');
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [search]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setMessage('Your email has been verified. You can now sign in.');
      // Optionally auto-redirect to login after a moment
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setMessage('');
    setResendLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Could not resend code');
      }

      setMessage('A new verification code has been sent to your email.');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not resend code. Please try again.'
      );
    } finally {
      setResendLoading(false);
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
        style={{
          backgroundColor: 'rgba(9, 21, 39, 0.7)',
        }}
      />

      {/* Verify Modal */}
      <div className="relative z-[2000] w-full max-w-2xl mx-5">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex min-height-[500px] isolate">
          {/* Left Section - Gradient Blue Sidebar */}
          <div
            className="w-1/4 hidden md:block"
            style={{
              background: 'linear-gradient(180deg, #071F45 0%, #203F70 100%)',
              flexShrink: 0,
            }}
          ></div>

          {/* Right Section - Form */}
          <div className="bg-[#E6E6E6] flex-1 p-10 md:p-12 flex flex-col justify-center overflow-hidden">
            {/* Logo and Title */}
            <div className="text-center mb-6">
              <Link href="/" className="inline-block">
                <img
                  src="/images/Logo 4.png"
                  alt="Star4ce"
                  className="h-12 md:h-16 mx-auto mb-4"
                />
              </Link>
              <p className="text-gray-700 text-lg font-medium">
                Verify your email to activate your account.
              </p>
            </div>

            {/* Status Messages */}
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

            {/* Verify Form */}
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none tracking-[0.3em] text-center uppercase"
                  placeholder="123456"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Enter the 6-digit code we sent to your email.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying…' : 'Verify Email'}
              </button>
            </form>

            {/* Resend Link + Back to Login */}
            <div className="mt-4 flex flex-col gap-2 text-sm text-center text-gray-700">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || !email}
                className="text-[#0B2E65] hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Resending…' : 'Resend verification code'}
              </button>
              <div>
                Already verified?{' '}
                <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
                  Go to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
