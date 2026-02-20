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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [codeInfo, setCodeInfo] = useState<{ dealership_name: string } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Prevent body scrolling when corporate registration page is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  async function validateJoinCode() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setValidatingCode(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/validate-join-code?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.role !== 'corporate') {
          setError('This code is not for corporate registration. Use the manager registration page for manager/hiring manager codes.');
          setCodeInfo(null);
          toast.error('Wrong code type');
          return;
        }
        setCodeInfo({ dealership_name: data.dealership_name || '' });
        toast.success(`Code valid. You will join: ${data.dealership_name || 'dealership'}`);
      } else {
        setCodeInfo(null);
        setError(data.error || 'Invalid or expired code');
        toast.error(data.error || 'Invalid or expired code');
      }
    } catch (err) {
      setCodeInfo(null);
      setError('Failed to validate code');
      toast.error('Failed to validate code');
    } finally {
      setValidatingCode(false);
    }
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation for step 1
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }

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

    setCurrentStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError('Dealership code is required');
      return;
    }

    if (!codeInfo) {
      setError('Please validate your dealership code first');
      return;
    }

    setLoading(true);
    try {
        // Register with join code (assigns to dealership)
        const res = await fetch(`${API_BASE}/auth/register-corporate-with-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            email: email.trim().toLowerCase(),
            password,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          }),
        }).catch((fetchError) => {
          console.error('Network error:', fetchError);
          throw new Error('Unable to connect to server. Please check if the backend is running.');
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Registration failed');
          toast.error(errData.error || 'Registration failed');
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (data.ok) {
          toast.success(data.message || 'Registration successful! Please check your email for the verification code.');
          router.push(`/verify?email=${encodeURIComponent(email)}`);
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
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex max-h-[90vh] isolate">
          {/* Left Section - Gradient Blue Sidebar */}
          <div 
            className="w-1/4 hidden md:block"
            style={{
              background: 'linear-gradient(180deg, #071F45 0%, #203F70 100%)',
              flexShrink: 0,
            }}
          ></div>

          {/* Right Section - Form */}
          <div className="bg-[#E6E6E6] flex-1 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[90vh] relative">
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
            <div className="text-center mb-4 flex-shrink-0">
              <Link href="/" className="inline-block">
                <Logo size="md" className="justify-center mb-3" />
              </Link>
              <p className="text-gray-700 text-base font-medium mb-1">
                Corporate Registration
              </p>
              <p className="text-gray-600 text-sm">
                Create your corporate account to view multiple dealerships
              </p>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex-shrink-0">
                <p className="font-medium mb-0.5">Error:</p>
                <p className="text-xs">{error}</p>
                {error.includes('connect to server') && (
                  <p className="mt-1.5 text-red-600 text-xs">
                    Make sure the backend server is running on {process.env.NEXT_PUBLIC_STAR4CE_API_BASE || 'http://127.0.0.1:5000'}
                  </p>
                )}
              </div>
            )}

            {/* Progress Dots */}
            <div className="flex justify-center items-center gap-3 mb-6">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-all ${
                    step === currentStep
                      ? 'bg-[#0B2E65]'
                      : step < currentStep
                      ? 'bg-[#0B2E65]'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Registration Form - like admin register */}
            {currentStep === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-4 flex-1 min-h-0">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Account Information</h3>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        placeholder="First Name"
                        autoComplete="given-name"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        placeholder="Last Name"
                        autoComplete="family-name"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      placeholder="Password (min 8 chars, letters & numbers)"
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="submit"
                  className="cursor-pointer w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                >
                  Next
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 flex-1 min-h-0">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Enter Dealership code
                    <div className="group relative">
                      <svg
                        className="w-4 h-4 text-gray-400 cursor-help"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-white border border-gray-300 text-gray-700 text-xs rounded-lg shadow-lg z-10">
                        <p className="mb-1 font-semibold">Where to find your code:</p>
                        <p>Your dealership code is provided by your admin. Contact your dealership administrator or check your email invitation for the code.</p>
                      </div>
                    </div>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Code"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent uppercase"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase());
                        setCodeInfo(null);
                      }}
                      maxLength={12}
                      required
                    />
                    <button
                      type="button"
                      onClick={validateJoinCode}
                      disabled={!joinCode.trim() || validatingCode}
                      className="cursor-pointer px-4 py-2.5 rounded-lg font-medium bg-[#0B2E65] text-white hover:bg-[#2c5aa0] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {validatingCode ? 'Checking...' : 'Validate'}
                    </button>
                  </div>
                  {codeInfo && (
                    <p className="mt-2 text-xs text-green-700">You will be assigned to: {codeInfo.dealership_name}</p>
                  )}
                </div>

                {/* Info Box */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex-shrink-0">
                  <h3 className="text-xs font-semibold text-[#0B2E65] mb-1">Note:</h3>
                  <p className="text-xs text-gray-700">
                    Please enter a valid dealership code to register. Corporate accounts can view multiple dealerships assigned by admins. 
                    After registration, verify your email. Your account will be automatically assigned to the dealership associated with your code.
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !codeInfo}
                    className="cursor-pointer flex-1 bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register as Corporate'}
                  </button>
                </div>
              </form>
            )}

            {/* Links */}
            <div className="text-center space-y-2 mt-4">
              <p className="text-gray-700">
                Already have an account?{' '}
                <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

