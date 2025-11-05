'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerApi, saveSession } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState<'corporate' | 'manager' | ''>('');
  const [company, setCompany] = useState('');
  const [companyType, setCompanyType] = useState<'select' | 'other'>('select');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 3;

  // Known dealerships list
  const knownDealerships = [
    'ABC Auto Group',
    'Premier Motors',
    'Elite Automotive',
    'Metro Car Dealers',
    'Coastal Auto Group',
    'Mountain View Motors',
    'Sunset Dealership',
    'Riverside Automotive',
    'Valley Motors',
    'City Center Auto',
  ];

  function nextStep() {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate confirm password
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Backend only uses email/password today; keep sending other fields for future use
      const data = await registerApi(email, password);
      saveSession({ token: data.token, email: data.email, role: data.role });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="fixed inset-0 flex items-start justify-center overflow-y-auto pt-32 md:pt-40"
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

      {/* Register Modal */}
      <div className="relative z-[2000] w-full max-w-2xl mx-5 mb-8">
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
          <div className="bg-[#E6E6E6] flex-1 p-10 md:p-12 flex flex-col justify-center overflow-hidden">
            {/* Logo and Tagline */}
            <div className="text-center mb-6">
              <Link href="/" className="inline-block">
                <img 
                  src="/images/Logo 4.png" 
                  alt="Star4ce" 
                  className="h-12 md:h-16 mx-auto mb-4"
                />
              </Link>
              <p className="text-gray-700 text-lg font-medium">
                Start your Star4ce trial.
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center items-center gap-2 mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${
                      step === currentStep
                        ? 'bg-[#0B2E65] scale-125'
                        : step < currentStep
                        ? 'bg-[#0B2E65]'
                        : 'bg-gray-300'
                    }`}
                  />
                  {step < totalSteps && (
                    <div
                      className={`w-8 h-0.5 mx-1 ${
                        step < currentStep ? 'bg-[#0B2E65]' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={currentStep === totalSteps ? onSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
              {/* Step 1: Role Selection */}
              {currentStep === 1 && (
                <>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-4">
                      Select your account type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole('corporate')}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          role === 'corporate'
                            ? 'border-[#0B2E65] bg-[#0B2E65]/10'
                            : 'border-gray-300 hover:border-[#0B2E65]/50'
                        }`}
                      >
                        <div className={`font-semibold text-lg mb-2 ${role === 'corporate' ? 'text-[#0B2E65]' : 'text-gray-700'}`}>
                          Corporate
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Oversee all your dealerships</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('manager')}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          role === 'manager'
                            ? 'border-[#0B2E65] bg-[#0B2E65]/10'
                            : 'border-gray-300 hover:border-[#0B2E65]/50'
                        }`}
                      >
                        <div className={`font-semibold text-lg mb-2 ${role === 'manager' ? 'text-[#0B2E65]' : 'text-gray-700'}`}>
                          Manager
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Manage your own dealership</p>
                        </div>
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!role}
                    className="w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </>
              )}

              {/* Step 2: Company & Address */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={companyType === 'other' ? 'other' : company}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          setCompanyType('other');
                          setCompany('');
                        } else {
                          setCompanyType('select');
                          setCompany(e.target.value);
                        }
                      }}
                      required={companyType === 'select'}
                    >
                      <option value="">Select Dealership / Company</option>
                      {knownDealerships.map((dealership) => (
                        <option key={dealership} value={dealership}>
                          {dealership}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                    {companyType === 'other' && (
                      <input
                        type="text"
                        placeholder="Enter Dealership / Company name"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                      />
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Address"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="City"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="State"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Zip Code"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Account Details */}
              {currentStep === 3 && (
                <>
                  <div>
                    <input
                      type="email"
                      placeholder="Work Email"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password (min 8 chars)"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating…' : 'Create account'}
                    </button>
                  </div>
                </>
              )}

              {/* Login Link - Only show on last step */}
              {currentStep === totalSteps && (
                <div className="text-center text-sm text-gray-700">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#0B2E65] hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
