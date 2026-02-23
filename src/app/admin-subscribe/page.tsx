'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

function AdminSubscribePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);
  const canceledToastShown = useRef(false);

  useEffect(() => {
    const subscriptionParam = searchParams?.get('subscription');
    if (subscriptionParam === 'canceled' && !canceledToastShown.current) {
      canceledToastShown.current = true;
      toast.error('Subscription canceled. You can try again whenever you\'re ready.');
    }
  }, [searchParams]);

  // Security: require login. Never trust email/user_id from URL — use only authenticated user.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      const redirect = '/admin-subscribe' + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.subscription_required && data.email) {
          setEmail((data.email || '').trim());
          setAuthCheckDone(true);
          return;
        }
        if (data.subscription_active !== false && (data.user?.role === 'admin' || data.role === 'admin')) {
          router.replace('/dashboard');
          return;
        }
        if (data.user?.email) {
          setEmail((data.user.email || '').trim());
        } else if (data.email) {
          setEmail((data.email || '').trim());
        } else {
          router.replace('/admin-register');
          return;
        }
        setAuthCheckDone(true);
      })
      .catch(() => {
        router.replace('/login?redirect=' + encodeURIComponent('/admin-subscribe'));
      });
  }, [searchParams, router]);

  async function handleSubscribe(plan: 'monthly' | 'annual') {
    if (!email) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Retrieve dealership information from localStorage if available
      let dealershipInfo: any = null;
      try {
        const stored = localStorage.getItem('pending_dealership_info');
        console.log('[CHECKOUT] Checking localStorage for dealership info:', stored);
        console.log('[CHECKOUT] Current email from URL:', email);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('[CHECKOUT] Parsed dealership info:', parsed);
          console.log('[CHECKOUT] Stored email:', parsed.email, 'Type:', typeof parsed.email);
          console.log('[CHECKOUT] Current email (normalized):', email.trim().toLowerCase(), 'Type:', typeof email);
          
          // Normalize both emails for comparison
          const storedEmail = (parsed.email || '').trim().toLowerCase();
          const currentEmail = email.trim().toLowerCase();
          
          // Only use if email matches
          if (storedEmail === currentEmail) {
            dealershipInfo = parsed;
            console.log('[CHECKOUT] ✅ Email match! Using dealership info for checkout:', dealershipInfo);
            // Clean up after retrieving
            localStorage.removeItem('pending_dealership_info');
          } else {
            console.warn('[CHECKOUT] ❌ Email mismatch - stored:', storedEmail, 'current:', currentEmail);
            console.warn('[CHECKOUT] Stored email length:', storedEmail.length, 'Current email length:', currentEmail.length);
          }
        } else {
          console.log('[CHECKOUT] No dealership info found in localStorage');
        }
      } catch (e) {
        // Ignore localStorage errors
        console.error('[CHECKOUT] Failed to retrieve dealership info from localStorage:', e);
      }

      // Create checkout session - checkout endpoint will find user by email
      const checkoutBody: any = {
        email: email.trim().toLowerCase(),
        billing_plan: plan,
      };

      // Add dealership information to checkout metadata if available
      if (dealershipInfo) {
        checkoutBody.dealership_name = dealershipInfo.name || null;
        checkoutBody.dealership_address = dealershipInfo.address || null;
        checkoutBody.dealership_city = dealershipInfo.city || null;
        checkoutBody.dealership_state = dealershipInfo.state || null;
        checkoutBody.dealership_zip_code = dealershipInfo.zip_code || null;
        console.log('[CHECKOUT] Sending dealership info to backend:', {
          name: checkoutBody.dealership_name,
          address: checkoutBody.dealership_address,
          city: checkoutBody.dealership_city,
          state: checkoutBody.dealership_state,
          zip_code: checkoutBody.dealership_zip_code,
        });
      } else {
        console.log('[CHECKOUT] No dealership info to send');
      }

      const token = getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const checkoutRes = await fetch(`${API_BASE}/subscription/create-checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(checkoutBody),
      });

      if (!checkoutRes.ok) {
        let errorMsg = 'Failed to create checkout session';
        try {
          const errorData = await checkoutRes.json();
          const backendError = (errorData.error || '').trim();
          if (checkoutRes.status === 400 && (backendError.includes('not eligible') || backendError.includes('already registered') || backendError.includes('sign in to subscribe'))) {
            errorMsg = "This email isn't registered for admin signup. Please create an account and verify your email first.";
          } else {
            errorMsg = backendError || errorMsg;
          }
        } catch (e) {
          errorMsg = `Server error: ${checkoutRes.status} ${checkoutRes.statusText}`;
        }
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const checkoutData = await checkoutRes.json();
      if (checkoutData.checkout_url) {
        // Set flag to prevent any warnings when navigating to checkout
        setIsNavigatingToCheckout(true);
        // Navigate to checkout - use replace to avoid triggering beforeunload
        window.location.replace(checkoutData.checkout_url);
      } else {
        setError(checkoutData.error || 'No checkout URL received');
        toast.error(checkoutData.error || 'No checkout URL received');
        setLoading(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const errorMsg = msg === 'Failed to fetch'
        ? "Couldn't reach the server. If you haven't created an account yet, please register and verify your email first, then try again."
        : msg || 'Network error. Please check your connection and try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      console.error('Checkout error:', err);
    }
  }

  if (!authCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: '#0f172a' }}>
        <div className="flex items-center gap-3 text-white">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!email) {
    return null;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{
        backgroundImage: 'url(/images/header.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        paddingTop: '140px',
      }}
    >
      {/* Blurred background overlay */}
      <div 
        className="fixed inset-0 backdrop-blur-sm z-0"
        style={{
          backgroundColor: 'rgba(9, 21, 39, 0.7)',
        }}
      />

      {/* Subscription Selection Modal */}
      <div className="relative z-10 w-full max-w-4xl mx-5 my-8">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#071F45] to-[#203F70] p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2 text-white">Email Verified!</h1>
            <p className="text-lg opacity-90 text-white">
              Your email has been verified. Please choose a subscription plan to become an admin.
            </p>
             <p className="text-sm text-white opacity-90 mt-2">
               {email}
             </p>
          </div>

          {/* Content */}
          <div className="bg-[#E6E6E6] p-8 md:p-12">
            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}


            {/* Pricing Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Monthly Plan */}
              <div 
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all min-h-[240px] flex flex-col ${
                  selectedPlan === 'monthly'
                    ? 'border-[#0B2E65] shadow-lg'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <div className="text-center flex-grow flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#0B2E65]">$199</span>
                    <span className="text-gray-600 ml-2">/ month</span>
                  </div>
                  <div className="h-8 mb-4 flex items-center justify-center">
                    {selectedPlan === 'monthly' && (
                      <div className="inline-block bg-[#0B2E65] text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Selected
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Billed monthly, cancel anytime</p>
                </div>
              </div>

              {/* Annual Plan */}
              <div 
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all relative min-h-[240px] flex flex-col ${
                  selectedPlan === 'annual'
                    ? 'border-[#0B2E65] shadow-lg'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedPlan('annual')}
              >
                <div className="absolute top-0 right-0 bg-[#e74c3c] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                  BEST VALUE
                </div>
                <div className="text-center flex-grow flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#0B2E65]">$166</span>
                    <span className="text-gray-600 ml-2">/ month</span>
                  </div>
                  <div className="h-8 mb-4 flex items-center justify-center">
                    {selectedPlan === 'annual' && (
                      <div className="inline-block bg-[#0B2E65] text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Selected
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Billed annually</p>
                  <p className="text-sm font-semibold text-[#e74c3c]">Save $396/year!</p>
                </div>
              </div>
            </div>

            {/* Subscribe Button */}
            <button
              onClick={() => handleSubscribe(selectedPlan)}
              disabled={loading || !email}
              className="w-full bg-[#0B2E65] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4 cursor-pointer"
            >
              {loading ? 'Processing...' : `Subscribe to ${selectedPlan === 'monthly' ? 'Monthly' : 'Annual'} Plan`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSubscribePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AdminSubscribePageContent />
    </Suspense>
  );
}

