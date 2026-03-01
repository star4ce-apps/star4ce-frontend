'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE, getToken, saveSession } from '@/lib/auth';
import Logo from '@/components/Logo';

export default function VerifyPage() {
  const search = useSearchParams();
  const router = useRouter();
  const devCode = search.get('code') || '';

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

  // Pre-fill email from ?email=...
  const [emailFromUrl, setEmailFromUrl] = useState(false);

  useEffect(() => {
    const qEmail = search.get('email');
    const subscriptionParam = search.get('subscription');
    
    // If user is already logged in and coming from subscription success, redirect to subscription page
    if (subscriptionParam === 'success') {
      const token = getToken();
      if (token) {
        // User is already logged in, redirect to subscription page
        router.replace('/subscription?subscription=success');
        return;
      }
    }
    
    if (qEmail) {
      // Next.js searchParams automatically decodes URL parameters
      setEmail(qEmail);
      setEmailFromUrl(true);
    }
    if (devCode) {
      setCode(devCode);
    }
    
    if (subscriptionParam === 'success') {
      setMessage('🎉 Subscription successful! Your admin account has been created. Please check your email for the verification code to complete setup.');
    }
  }, [search, router, email, devCode]);

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

      // Check if this is an admin registration that needs to subscribe
      if (data.redirect_to_subscription || search.get('admin') === 'true') {
        // If backend returned token (post-verify auto-login), save session and go straight to subscribe
        if (data.token && data.email && data.role) {
          saveSession({
            token: String(data.token || '').trim(),
            email: String(data.email || '').trim(),
            role: String(data.role || 'manager').trim(),
          });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth-session-updated'));
          }
          setMessage('Your email has been verified! Redirecting to choose a plan...');
          // Full page navigation so admin-subscribe loads with the saved token in localStorage
          setTimeout(() => {
            window.location.href = '/admin-subscribe';
          }, 1000);
        } else {
          setMessage('Your email has been verified! Redirecting to sign in and choose a plan...');
          setTimeout(() => {
            router.push('/login?redirect=' + encodeURIComponent('/admin-subscribe'));
          }, 1500);
        }
      } else if (data.is_manager_pending) {
        // Manager with pending request - show waiting message
        setMessage('Your email has been verified! Your request to join the dealership is pending admin approval. Please wait for an admin to approve your request before logging in.');
        // Don't auto-redirect, let them read the message
      } else {
        setMessage('Your email has been verified. You can now sign in.');
        // Auto-redirect to login after a moment
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Count down resend cooldown every second
  useEffect(() => {
    if (resendCooldownSeconds <= 0) return;
    const t = setInterval(() => {
      setResendCooldownSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldownSeconds]);

  async function handleResend() {
    setError('');
    setMessage('');
    setResendLoading(true);
    try {
      const endpoint = '/auth/resend-verify';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const cooldown = data.cooldown_seconds;
        if (res.status === 429 && typeof cooldown === 'number' && cooldown > 0) {
          setResendCooldownSeconds(cooldown);
        }
        throw new Error(data.error || 'Could not resend code');
      }

      setMessage('A new verification code has been sent to your email. It expires in 10 minutes.');
      setResendCooldownSeconds(30);
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
                <Logo size="lg" className="justify-center mb-4" />
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
            {devCode && (
              <div className="mb-4 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold">Verification code:</span> {devCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCode(devCode)}
                    className="px-2 py-1 rounded border border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                  >
                    Use code
                  </button>
                </div>
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
                  readOnly={emailFromUrl}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none ${
                    emailFromUrl ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter your email"
                />
                {emailFromUrl && (
                  <p className="mt-1 text-xs text-gray-500">
                    Email pre-filled from verification link
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(value);
                  }}
                  required
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none tracking-[0.3em] text-center text-lg font-semibold"
                  placeholder="000000"
                  inputMode="numeric"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Enter the 6-digit code we sent to your email. The code expires in 10 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying…' : 'Verify Email'}
              </button>
            </form>

            {/* Resend + Back to Login */}
            <div className="mt-4 flex flex-col gap-3 text-sm text-center text-gray-700">
              <p className="text-xs text-gray-500">
                Code expired or didn&apos;t receive it?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || !email || resendCooldownSeconds > 0}
                className="cursor-pointer px-4 py-2 rounded-lg border-2 border-[#0B2E65] text-[#0B2E65] font-medium hover:bg-[#0B2E65] hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resendLoading
                  ? 'Sending new code…'
                  : resendCooldownSeconds > 0
                    ? `Resend available in ${resendCooldownSeconds}s`
                    : 'Resend verification code'}
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
