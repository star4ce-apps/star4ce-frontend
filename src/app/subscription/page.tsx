'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/layout/RequireAuth';
import HubSidebar from '@/components/sidebar/HubSidebar';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

type SubscriptionStatus = {
  ok: boolean;
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  days_remaining_in_trial: number;
  is_active: boolean;
  cancel_at_period_end?: boolean;
};

export default function SubscriptionPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
    
    // Check for subscription success/cancel from URL
    const subscriptionParam = search.get('subscription');
    if (subscriptionParam === 'success') {
      toast.success('Subscription activated! You are now an admin.');
      loadSubscriptionStatus();
      // Clean URL
      router.replace('/subscription');
    } else if (subscriptionParam === 'canceled') {
      toast.error('Subscription canceled. You can try again anytime.');
      router.replace('/subscription');
    }
  }, [search, router]);

  async function loadSubscriptionStatus() {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(data);
      } else {
        toast.error(data.error || 'Failed to load subscription status');
      }
    } catch (err) {
      toast.error('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    setCreatingCheckout(true);
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok && data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
        setCreatingCheckout(false);
      }
    } catch (err) {
      toast.error('Failed to create checkout session');
      setCreatingCheckout(false);
    }
  }

  async function handleCancel() {
    setCanceling(true);
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/subscription/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancel_at_period_end: true }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Subscription will be canceled at the end of the billing period. You will continue to have access until then.');
        setShowCancelConfirm(false);
        // Reload subscription status
        await loadSubscriptionStatus();
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      toast.error('Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-base" style={{ color: '#6B7280' }}>Loading subscription status...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Subscription & Billing</h1>
              <p className="text-base" style={{ color: '#6B7280' }}>Manage your subscription, billing, and access to Star4ce features</p>
            </div>
          </div>

          {status && (
            <div className="space-y-6">
              {/* Current Status Card */}
              <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
              }}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#232E40' }}>Current Status</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Status:</span>
                    <span className={`text-sm font-semibold ${
                      status.is_active ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {status.subscription_status === 'trial' && 'Free Trial'}
                      {status.subscription_status === 'active' && 'Active'}
                      {status.subscription_status === 'canceled' && 'Canceled'}
                      {status.subscription_status === 'expired' && 'Expired'}
                      {!status.subscription_status && 'No Subscription'}
                    </span>
                  </div>
                  
                  {status.subscription_plan && (
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Plan:</span>
                      <span className="text-sm font-semibold capitalize" style={{ color: '#232E40' }}>{status.subscription_plan}</span>
                    </div>
                  )}

                  {status.subscription_status === 'trial' && status.days_remaining_in_trial > 0 && (
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Trial Days Remaining:</span>
                      <span className="text-sm font-semibold text-amber-600">
                        {status.days_remaining_in_trial} days
                      </span>
                    </div>
                  )}

                  {status.subscription_ends_at && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
                        {status.cancel_at_period_end ? 'Cancels On:' : 'Renews On:'}
                      </span>
                      <span className={`text-sm font-semibold ${status.cancel_at_period_end ? 'text-amber-600' : ''}`} style={!status.cancel_at_period_end ? { color: '#232E40' } : {}}>
                        {new Date(status.subscription_ends_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
            </div>

              {/* Subscription Actions */}
              {!status.is_active && (
                <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: '#232E40' }}>Subscribe to Star4ce</h2>
                  <p className="text-base mb-6" style={{ color: '#6B7280' }}>
                    {status.subscription_status === 'trial' 
                      ? `Your ${status.days_remaining_in_trial}-day trial is ending soon. Subscribe now to continue using all features.`
                      : 'Subscribe to unlock all features and become an admin of your dealership.'}
                  </p>
                  <button
                    onClick={handleSubscribe}
                    disabled={creatingCheckout}
                    className="cursor-pointer bg-[#0B2E65] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ minWidth: '160px' }}
                  >
                    {creatingCheckout ? 'Processing...' : 'Subscribe Now'}
                  </button>
                </div>
              )}

              {status.is_active && (
                <div className="rounded-xl p-6" style={{ 
                  backgroundColor: '#ECFDF5', 
                  border: '1px solid #A7F3D0',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2" style={{ color: '#065F46' }}>
                        ✓ Active Subscription
                      </h2>
                      <p className="text-base mb-4" style={{ color: '#047857' }}>
                        {status.cancel_at_period_end 
                          ? `Your subscription is active but will be canceled on ${status.subscription_ends_at ? new Date(status.subscription_ends_at).toLocaleDateString() : 'the renewal date'}. You'll continue to have full access until then.`
                          : 'Your subscription is active. You have full access to all features as an admin.'}
                      </p>
                      {status.subscription_ends_at && !status.cancel_at_period_end && (
                        <p className="text-sm" style={{ color: '#059669' }}>
                          Your subscription will automatically renew on {new Date(status.subscription_ends_at).toLocaleDateString()}.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={canceling}
                      className="ml-4 cursor-pointer bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
              }}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#232E40' }}>What's Included</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 mt-1 font-bold">✓</span>
                    <span className="text-base" style={{ color: '#374151' }}>Full admin access to your dealership</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 mt-1 font-bold">✓</span>
                    <span className="text-base" style={{ color: '#374151' }}>Unlimited employee management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 mt-1 font-bold">✓</span>
                    <span className="text-base" style={{ color: '#374151' }}>Unlimited survey access codes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 mt-1 font-bold">✓</span>
                    <span className="text-base" style={{ color: '#374151' }}>Advanced analytics and insights</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-600 mt-1 font-bold">✓</span>
                    <span className="text-base" style={{ color: '#374151' }}>Email notifications and survey invites</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {showCancelConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCancelConfirm(false)}>
              <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 25px 0 rgba(0, 0, 0, 0.15)'
              }} onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#232E40' }}>Cancel Subscription?</h3>
                <p className="text-base mb-2" style={{ color: '#6B7280' }}>
                  Your subscription will remain active until {status?.subscription_ends_at ? new Date(status.subscription_ends_at).toLocaleDateString() : 'the end of your billing period'}.
                </p>
                <p className="text-base mb-6" style={{ color: '#6B7280' }}>
                  You'll continue to have full access to all features until then. After that date, your subscription will be canceled and you'll lose admin access.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 cursor-pointer bg-gray-200 text-gray-800 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Keep Subscription
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={canceling}
                    className="flex-1 cursor-pointer bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {canceling ? 'Canceling...' : 'Yes, Cancel'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

