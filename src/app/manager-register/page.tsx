'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/auth';
import toast from 'react-hot-toast';

type Dealership = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  address: string | null;
};

export default function ManagerRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDealerships, setLoadingDealerships] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDealerships();
  }, []);

  async function loadDealerships() {
    setLoadingDealerships(true);
    try {
      const res = await fetch(`${API_BASE}/public/dealerships`);
      const data = await res.json();
      if (res.ok) {
        setDealerships(data.dealerships || []);
      } else {
        setError(data.error || 'Failed to load dealerships');
      }
    } catch (err) {
      setError('Failed to load dealerships');
      console.error(err);
    } finally {
      setLoadingDealerships(false);
    }
  }

  const filteredDealerships = dealerships.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.city && d.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.state && d.state.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

    if (!dealershipId) {
      setError('Please select a dealership');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          dealership_id: dealershipId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Registration successful! Please check your email for verification code.');
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.error || 'Registration failed');
        toast.error(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to register. Please try again.');
      toast.error('Failed to register. Please try again.');
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
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <img 
                  src="/images/Logo 4.png" 
                  alt="Star4ce" 
                  className="h-12 md:h-16 mx-auto mb-4"
                />
              </Link>
              <p className="text-gray-700 text-lg font-medium mb-2">
                Manager Registration
              </p>
              <p className="text-gray-600 text-sm">
                Create your account and request access to a dealership
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
              {/* Email Field */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
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
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {/* Dealership Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Select Dealership *
                </label>
                {loadingDealerships ? (
                  <div className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-center">
                    <p className="text-sm text-gray-600">Loading dealerships...</p>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="mb-3">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search dealerships by name, city, or state..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none text-sm"
                      />
                    </div>

                    {/* Dealership List */}
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 bg-white">
                      {filteredDealerships.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">
                            {searchQuery ? 'No dealerships found matching your search.' : 'No dealerships available.'}
                          </p>
                        </div>
                      ) : (
                        filteredDealerships.map((dealership) => {
                          const isSelected = dealershipId === dealership.id;
                          return (
                            <button
                              key={dealership.id}
                              type="button"
                              onClick={() => setDealershipId(dealership.id)}
                              className={`cursor-pointer w-full text-left px-4 py-3 border-b transition-colors ${
                                isSelected
                                  ? 'bg-[#0B2E65] text-white'
                                  : 'hover:bg-gray-50 text-gray-900'
                              }`}
                              style={{
                                borderColor: isSelected ? '#0B2E65' : '#E5E7EB',
                                color: isSelected ? '#FFFFFF' : '#111827',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p 
                                    className="font-semibold"
                                    style={{ color: isSelected ? '#FFFFFF' : '#111827' }}
                                  >
                                    {dealership.name}
                                  </p>
                                  {(dealership.city || dealership.state) && (
                                    <p 
                                      className="text-xs mt-1"
                                      style={{ color: isSelected ? '#E0E7FF' : '#6B7280' }}
                                    >
                                      {[dealership.city, dealership.state].filter(Boolean).join(', ')}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <svg 
                                    className="w-5 h-5" 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                    style={{ color: '#FFFFFF' }}
                                  >
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Info Box */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> After registration, verify your email. Your account will be pending admin approval. 
                  Once approved, you can request admin status or subscribe to become an admin.
                </p>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading || !dealershipId}
                className="cursor-pointer w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Register as Manager'}
              </button>

              {/* Login Link */}
              <div className="text-center text-sm text-gray-700">
                Already have an account?{' '}
                <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

