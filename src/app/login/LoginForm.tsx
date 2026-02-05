// src/app/login/LoginForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginApi, saveSession } from '@/lib/auth';
import Logo from '@/components/Logo';

export default function LoginForm() {
  const search = useSearchParams();
  const expired = search.get('expired') === '1';
  const redirect = search.get('redirect');
  const adminReg = search.get('admin_registration');
  const adminEmail = search.get('email');
  const subscriptionSuccess = search.get('subscription') === 'success';
  const router = useRouter();

  const [email, setEmail] = useState(adminEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [loading, setLoading] = useState(false);

  // Show success message if coming from subscription
  useEffect(() => {
    if (subscriptionSuccess) {
      setSuccessMessage('🎉 Subscription successful! Your admin account has been created. Please sign in with your email and password.');
      // Clear the URL parameter
      router.replace(`/login?email=${encodeURIComponent(adminEmail || '')}`);
    }
  }, [subscriptionSuccess, adminEmail, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      saveSession(data);
      
      // Check if we need to redirect to subscription after login
      if (redirect === 'subscription' || adminReg === 'true') {
        router.push('/subscription');
      } else {
        // If coming from subscription success, show success message on dashboard
        if (subscriptionSuccess) {
          router.push('/dashboard?subscription=success');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: unknown) {
      let msg = 'Login failed';

      if (err instanceof Error) {
        if (err.message === 'unverified') {
          // Special case: backend said this user is not verified yet
          msg = 'Please verify your email before signing in. A new verification code has been sent to your email.';
          // Send them straight to the verify page with their email filled in
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return; // Don't set error since we're redirecting
        } else {
          msg = err.message;
        }
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Prevent body scrolling when login page is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div 
      className="fixed flex items-center justify-center overflow-hidden"
      style={{
        top: '110px',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/images/header.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blurred background overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-sm z-0"
        style={{
          backgroundColor: 'rgba(9, 21, 39, 0.7)',
        }}
      />

      {/* Login Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[95vh]">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex max-h-[95vh] isolate">
          {/* Left Section - Gradient Blue Sidebar */}
          <div 
            className="w-1/4 hidden md:block"
            style={{
              background: 'linear-gradient(180deg, #071F45 0%, #203F70 100%)',
              flexShrink: 0,
            }}
          ></div>

          {/* Right Section - Form */}
          <div className="bg-[#E6E6E6] flex-1 p-6 md:p-8 flex flex-col justify-center overflow-hidden max-h-[95vh]">
            {/* Logo and Tagline */}
            <div className="text-center mb-6">
              <Link href="/" className="inline-block">
                <Logo size="lg" className="justify-center mb-4" />
              </Link>
              <p className="text-gray-700 text-base font-medium">
                Your Journey of Excellence Starts Here.
              </p>
            </div>

            {/* Success Messages */}
            {(successMessage || subscriptionSuccess) && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-green-800">
                {successMessage || '🎉 Thank you for subscribing! Your admin account has been created. You may now log in.'}
              </div>
            )}
            
            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
                {error.includes('invalid credentials') && (
                  <div className="mt-2 text-red-600">
                    Please check your email and password. If you haven't verified your email, check your inbox for a verification code.
                  </div>
                )}
              </div>
            )}
            {expired && !subscriptionSuccess && (
              <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
                Your session expired. Please sign in again.
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username/Email Field */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link href="/forgot" className="text-[#0B2E65] hover:underline">
                  Forgot your login information?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Register Link */}
              <div className="text-center text-gray-700">
                Don't have an account?{' '}
                <Link href="/register" className="text-[#0B2E65] hover:underline font-medium">
                  Register
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
