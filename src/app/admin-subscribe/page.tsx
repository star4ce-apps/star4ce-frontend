'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/auth';
import toast from 'react-hot-toast';

function AdminSubscribePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  useEffect(() => {
    const emailParam = searchParams?.get('email');
    const subscriptionParam = searchParams?.get('subscription');
    const userIdParam = searchParams?.get('user_id');
    
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // If no email, redirect back
      router.push('/admin-register');
      return;
    }

    // Check if coming from canceled subscription
    if (subscriptionParam === 'canceled') {
      toast.error('Subscription canceled. Your account will be deleted.');
      // Delete the account
      setTimeout(async () => {
        try {
          await fetch(`${API_BASE}/admin/delete-unsubscribed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: emailParam,
              user_id: userIdParam ? parseInt(userIdParam) : null
            }),
          });
          toast.success('Account deleted. You can register again anytime.');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } catch (err) {
          toast.error('Failed to delete account');
          console.error(err);
        }
      }, 1000);
    }

    // No warning needed - system will handle cleanup automatically
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
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only use if email matches
          if (parsed.email === email.trim().toLowerCase()) {
            dealershipInfo = parsed;
            // Clean up after retrieving
            localStorage.removeItem('pending_dealership_info');
          }
        }
      } catch (e) {
        // Ignore localStorage errors
        console.warn('Failed to retrieve dealership info from localStorage:', e);
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
      }

      const checkoutRes = await fetch(`${API_BASE}/subscription/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutBody),
      });

      if (!checkoutRes.ok) {
        // Try to parse error message
        let errorMsg = 'Failed to create checkout session';
        try {
          const errorData = await checkoutRes.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // If response is not JSON, use status text
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
      const errorMsg = err instanceof Error ? err.message : 'Network error. Please check if the backend server is running.';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      console.error('Checkout error:', err);
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
            <h1 className="text-3xl font-bold mb-2">🎉 Email Verified!</h1>
            <p className="text-lg opacity-90">
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
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-[#0B2E65] shadow-lg scale-105'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#0B2E65]">$199</span>
                    <span className="text-gray-600 ml-2">/ month</span>
                  </div>
                  {selectedPlan === 'monthly' && (
                    <div className="inline-block bg-[#0B2E65] text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                      Selected
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Billed monthly, cancel anytime</p>
                </div>
              </div>

              {/* Annual Plan */}
              <div 
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all relative ${
                  selectedPlan === 'annual'
                    ? 'border-[#0B2E65] shadow-lg scale-105'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedPlan('annual')}
              >
                <div className="absolute top-0 right-0 bg-[#e74c3c] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                  BEST VALUE
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#0B2E65]">$166</span>
                    <span className="text-gray-600 ml-2">/ month</span>
                  </div>
                  {selectedPlan === 'annual' && (
                    <div className="inline-block bg-[#0B2E65] text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                      Selected
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mb-1">Billed annually</p>
                  <p className="text-sm font-semibold text-[#e74c3c]">Save $396/year!</p>
                </div>
              </div>
            </div>

            {/* Subscribe Button */}
            <button
              onClick={() => handleSubscribe(selectedPlan)}
              disabled={loading || !email}
              className="w-full bg-[#0B2E65] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4"
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

