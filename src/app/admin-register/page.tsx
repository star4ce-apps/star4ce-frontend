'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/auth';
import toast from 'react-hot-toast';

function AdminRegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dealershipName, setDealershipName] = useState('');
  const [dealershipAddress, setDealershipAddress] = useState('');
  const [dealershipCity, setDealershipCity] = useState('');
  const [dealershipState, setDealershipState] = useState('');
  const [dealershipZipCode, setDealershipZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is coming from verification (already verified, just needs to subscribe)
  useEffect(() => {
    const verified = searchParams?.get('verified');
    const verifiedEmail = searchParams?.get('email');
    if (verified === 'true' && verifiedEmail) {
      setEmail(verifiedEmail);
      // Pre-fill form and show message that they just need to subscribe
      toast.success('Email verified! Please log in and complete your subscription to become an admin.');
      // Redirect to login instead - they need to authenticate first
      setTimeout(() => {
        router.push(`/login?redirect=subscription&admin_registration=true&email=${encodeURIComponent(verifiedEmail)}`);
      }, 2000);
    }
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!dealershipName.trim()) {
      setError('Dealership name is required');
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
      const verified = searchParams?.get('verified');
      let user_id = null;
      
      // If user is already verified, skip registration and go straight to checkout
      if (verified === 'true') {
        // User is already verified, just need to get their user_id for checkout
        // Try to get user info to find user_id
        try {
          const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
            }),
          });
          
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            // User exists and password is correct, proceed to checkout
            // We'll get user_id from checkout endpoint
          } else {
            setError('Invalid email or password. Please check your credentials.');
            toast.error('Invalid email or password');
            setLoading(false);
            return;
          }
        } catch (err) {
          setError('Failed to verify credentials. Please try again.');
          toast.error('Failed to verify credentials');
          setLoading(false);
          return;
        }
      } else {
        // New registration - create the user account
        const registerRes = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            full_name: fullName.trim(),
            is_admin_registration: true,  // Flag for admin registration
          }),
        });

        const registerData = await registerRes.json();
        if (!registerRes.ok) {
          setError(registerData.error || 'Registration failed');
          toast.error(registerData.error || 'Registration failed');
          setLoading(false);
          return;
        }
        
        user_id = registerData.user_id;

        // Store dealership information in localStorage for later use during checkout
        if (dealershipName || dealershipAddress || dealershipCity || dealershipState || dealershipZipCode) {
          localStorage.setItem('pending_dealership_info', JSON.stringify({
            name: dealershipName.trim(),
            address: dealershipAddress.trim() || null,
            city: dealershipCity.trim() || null,
            state: dealershipState.trim() || null,
            zip_code: dealershipZipCode.trim() || null,
            email: email.trim().toLowerCase(),
          }));
        }

        // Redirect to verification page - user must verify email first, then subscribe
        toast.success('Account created! Please check your email for verification code.');
        router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&admin=true`);
        setLoading(false);
        return;
      }

      // If verified, redirect to subscription page (shouldn't happen in normal flow)
      // Normal flow: register -> verify -> subscribe page
      toast.error('Please complete verification first');
      router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&admin=true`);
    } catch (err) {
      const errorMessage = err instanceof TypeError && err.message === 'Failed to fetch'
        ? `Unable to connect to backend server. Please ensure the backend is deployed and the NEXT_PUBLIC_STAR4CE_API_BASE environment variable is set in Vercel.`
        : (err instanceof Error ? err.message : 'Failed to process registration. Please try again.');
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{
        backgroundImage: 'url(/images/header.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        paddingTop: '140px', // Add padding to account for navbar
      }}
    >
      {/* Blurred background overlay */}
      <div 
        className="fixed inset-0 backdrop-blur-sm z-0"
        style={{
          backgroundColor: 'rgba(9, 21, 39, 0.7)',
        }}
      />

      {/* Register Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-5 my-8">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex min-h-[500px] isolate">
          {/* Left Section - Gradient Blue Sidebar */}
          <div 
            className="w-1/4 hidden md:block"
            style={{
              background: 'linear-gradient(180deg, #071F45 0%, #203F70 100%)',
              flexShrink: 0,
            }}
          ></div>

          {/* Right Section - Form */}
          <div className="bg-[#E6E6E6] flex-1 p-10 md:p-12 flex flex-col overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Logo and Tagline */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <img 
                  src="/images/Logo 4.png" 
                  alt="Star4ce" 
                  className="h-12 md:h-16 mx-auto mb-4"
                />
              </Link>
              <p className="text-gray-700 text-lg font-medium mb-2">
                Admin Registration
              </p>
              <p className="text-gray-600 text-sm">
                Subscribe to become an admin and get full access
              </p>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Information Section */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
                
                {/* Full Name Field */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    autoComplete="name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="mb-3">
                  <input
                    type="email"
                    placeholder="Email *"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="mb-3">
                  <input
                    type="password"
                    placeholder="Password (min 8 chars, letters & numbers) *"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
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
                    placeholder="Confirm Password *"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Dealership Information Section */}
              <div className="border-t border-gray-300 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Dealership Information</h3>
                
                {/* Dealership Name */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Dealership Name *"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                    value={dealershipName}
                    onChange={(e) => setDealershipName(e.target.value)}
                    required
                  />
                </div>

                {/* Address */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Street Address"
                    autoComplete="street-address"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                    value={dealershipAddress}
                    onChange={(e) => setDealershipAddress(e.target.value)}
                  />
                </div>

                {/* City, State, Zip */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="City"
                      autoComplete="address-level2"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                      value={dealershipCity}
                      onChange={(e) => setDealershipCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="State"
                      autoComplete="address-level1"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                      value={dealershipState}
                      onChange={(e) => setDealershipState(e.target.value)}
                    />
                  </div>
                </div>

                {/* Zip Code */}
                <div>
                  <input
                    type="text"
                    placeholder="Zip Code"
                    autoComplete="postal-code"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-transparent"
                    value={dealershipZipCode}
                    onChange={(e) => setDealershipZipCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mt-4">
                <p className="text-xs text-blue-800">
                  <strong>Next Steps:</strong> After registration, you'll receive a verification email. Once verified, you'll be able to choose your subscription plan and become an admin.
                </p>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'Processing...' : 'Register as Admin'}
              </button>

              {/* Links */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-700">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
                <p className="text-sm text-gray-700">
                  Want to register as manager instead?{' '}
                  <Link href="/manager-register" className="text-[#0B2E65] hover:underline font-medium">
                    Register as Manager
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

export default function AdminRegisterPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AdminRegisterPageContent />
    </Suspense>
  );
}

