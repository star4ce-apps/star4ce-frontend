'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/auth';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';
import RegistrationClosed from '@/components/RegistrationClosed';
import { isRegistrationEnabled } from '@/lib/registration';

function VerifyInviteEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkToken = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState(!!linkToken);
  const [error, setError] = useState('');

  // Verify by link (token in URL)
  useEffect(() => {
    if (!linkToken) return;
    setVerifyingLink(true);
    setError('');
    fetch(`${API_BASE}/auth/verify-invite-email?token=${encodeURIComponent(linkToken)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
          return;
        }
        setError(data.error || 'Verification failed');
        setVerifyingLink(false);
      })
      .catch(() => {
        setError('Verification failed. Please try the link again or use the code.');
        setVerifyingLink(false);
      });
  }, [linkToken]);

  async function handleVerifyByCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !code.trim()) {
      setError('Please enter your email and the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-invite-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        toast.error(data.error || 'Verification failed');
        return;
      }
      toast.success(data.message || 'Email verified.');
      const path = data.purpose === 'corporate' ? '/corporate-register' : '/manager-register';
      router.push(`${path}?verified_token=${encodeURIComponent(data.verified_token)}&verified_email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  }

  if (linkToken && verifyingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <Logo size="md" className="mx-auto mb-4" />
          <p className="text-gray-600">Verifying your email...</p>
          <div className="mt-4 inline-block w-8 h-8 border-2 border-[#0B2E65] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <Link href="/register" className="text-[#0B2E65] hover:underline text-sm mb-4 inline-block">
          ← Back to registration
        </Link>
        <Logo size="md" className="mb-4" />
        <h1 className="text-xl font-semibold text-gray-800 mb-1">Verify your email</h1>
        <p className="text-gray-600 text-sm mb-6">
          Enter the 6-digit code we sent to your email, or use the link in the same email to verify instantly.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleVerifyByCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent tracking-widest text-center"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-500 text-xs">
          Didn’t get the email? Check spam, or go back and request a new code.
        </p>
      </div>
    </div>
  );
}

export default function VerifyInviteEmailPage() {
  if (!isRegistrationEnabled()) {
    return <RegistrationClosed />;
  }
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <VerifyInviteEmailContent />
    </Suspense>
  );
}
