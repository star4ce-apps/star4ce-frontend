'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/auth';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

export default function CorporateRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prevent body scrolling when corporate registration page is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters and include both letters and numbers');
      return;
    }

    setLoading(true);
    try {
      // Register as corporate user
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role: 'corporate',
        }),
      }).catch((fetchError) => {
        // Handle network errors (backend not running, CORS, etc.)
        console.error('Network error:', fetchError);
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      });

      // Check if response is ok before parsing JSON
      if (!res.ok) {
        // Try to parse error message
        let errorMessage = 'Registration failed';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || `Registration failed (${res.status})`;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `Registration failed: ${res.statusText || res.status}`;
        }
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Parse successful response
      const data = await res.json().catch((parseError) => {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response from server');
      });

      if (data.ok) {
        toast.success('Registration successful! Please check your email for verification code.');
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.error || 'Registration failed');
        toast.error(data.error || 'Registration failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  }

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

      {/* Register Modal */}
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
          <div className="bg-[#E6E6E6] flex-1 p-6 md:p-8 flex flex-col justify-center overflow-y-auto max-h-[95vh] relative">
            {/* Back Button */}
            <Link
              href="/register"
              className="absolute top-4 left-4 text-[#0B2E65] hover:text-[#2c5aa0] transition-colors"
              aria-label="Back to Registration Options"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* Logo and Tagline */}
            <div className="text-center mb-6">
              <Link href="/" className="inline-block">
                <Logo size="md" className="justify-center mb-4" />
              </Link>
              <p className="text-gray-700 text-base font-medium mb-2">
                Corporate Registration
              </p>
              <p className="text-gray-600">
                Create your corporate account to view multiple dealerships
              </p>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <p className="font-medium mb-1">Error:</p>
                <p>{error}</p>
                {error.includes('connect to server') && (
                  <p className="mt-2 text-red-600">
                    Make sure the backend server is running on {process.env.NEXT_PUBLIC_STAR4CE_API_BASE || 'http://127.0.0.1:5000'}
                  </p>
                )}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <input
                  type="password"
                  placeholder="Password (min 8 chars, letters & numbers)"
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {/* Info Box */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#0B2E65]">Note:</h3>
                <p className="text-sm text-gray-700">
                  Corporate accounts can view multiple dealerships assigned by admins. 
                  After registration, verify your email. An admin will need to assign dealerships to your account.
                </p>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Register as Corporate'}
              </button>

              {/* Links */}
              <div className="text-center space-y-2">
                <p className="text-gray-700">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
                <p className="text-gray-700">
                  Want to register as manager or admin?{' '}
                  <Link href="/manager-register" className="text-[#0B2E65] hover:underline font-medium">
                    Manager
                  </Link>
                  {' or '}
                  <Link href="/admin-register" className="text-[#0B2E65] hover:underline font-medium">
                    Admin
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

