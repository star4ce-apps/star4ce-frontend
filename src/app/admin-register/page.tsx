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
  const [billingPlan, setBillingPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for plan parameter from pricing page
  useEffect(() => {
    const plan = searchParams?.get('plan');
    if (plan === 'annual') {
      setBillingPlan('annual');
    } else if (plan === 'monthly') {
      setBillingPlan('monthly');
    }
  }, [searchParams]);

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
      // First, create the user account (will be upgraded to admin after payment)
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

      // Then create checkout session with user_id and billing plan
      const checkoutRes = await fetch(`${API_BASE}/subscription/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          user_id: registerData.user_id,  // Pass user_id from registration
          billing_plan: billingPlan,  // 'monthly' or 'annual'
          dealership_name: dealershipName.trim(),
          dealership_address: dealershipAddress.trim(),
          dealership_city: dealershipCity.trim(),
          dealership_state: dealershipState.trim(),
          dealership_zip_code: dealershipZipCode.trim(),
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (checkoutRes.ok && checkoutData.checkout_url) {
        window.location.href = checkoutData.checkout_url;
      } else {
        setError(checkoutData.error || 'Failed to create checkout session');
        toast.error(checkoutData.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError('Failed to process registration. Please try again.');
      toast.error('Failed to process registration');
      console.error(err);
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
          <div className="bg-[#E6E6E6] flex-1 p-10 md:p-12 flex flex-col justify-center overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Logo and Tagline */}
            <div className="text-center mb-10">
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <input
                  type="text"
                  placeholder="Full Name *"
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <input
                  type="email"
                  placeholder="Email *"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {/* Dealership Information Section */}
              <div className="border-t border-gray-300 pt-5 mt-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dealership Information</h3>
                
                {/* Dealership Name */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Dealership Name *"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                    value={dealershipName}
                    onChange={(e) => setDealershipName(e.target.value)}
                    required
                  />
                </div>

                {/* Address */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    autoComplete="street-address"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                    value={dealershipAddress}
                    onChange={(e) => setDealershipAddress(e.target.value)}
                  />
                </div>

                {/* City, State, Zip */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="City"
                      autoComplete="address-level2"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={dealershipCity}
                      onChange={(e) => setDealershipCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="State"
                      autoComplete="address-level1"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={dealershipState}
                      onChange={(e) => setDealershipState(e.target.value)}
                    />
                  </div>
                </div>

                {/* Zip Code */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Zip Code"
                    autoComplete="postal-code"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                    value={dealershipZipCode}
                    onChange={(e) => setDealershipZipCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Billing Plan Selection */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700">
                  Select Billing Plan *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingPlan('monthly')}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      billingPlan === 'monthly'
                        ? 'border-[#0B2E65] bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">Monthly</span>
                        {billingPlan === 'monthly' && (
                          <svg className="w-5 h-5 text-[#0B2E65]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">$199</p>
                      <p className="text-xs text-gray-600">per month</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPlan('annual')}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      billingPlan === 'annual'
                        ? 'border-[#0B2E65] bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">Annual</span>
                        {billingPlan === 'annual' && (
                          <svg className="w-5 h-5 text-[#0B2E65]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">$166</p>
                      <p className="text-xs text-gray-600">per month</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">Save $396/year</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs text-emerald-800">
                  <strong>What's Included:</strong> After payment, you'll automatically become an admin with full access to create and manage your dealership, employees, analytics, and more.
                </p>
              </div>

              {/* Subscribe Button */}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Subscribe & Register as Admin'}
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

