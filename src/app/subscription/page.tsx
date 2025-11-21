'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/layout/RequireAuth';
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
};

export default function SubscriptionPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [canceling, setCanceling] = useState(false);

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
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to all premium features.')) {
      return;
    }

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
        body: JSON.stringify({ cancel_at_period_end: false }), // Cancel immediately
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Subscription canceled successfully');
        // Reload status
        loadSubscriptionStatus();
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
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-600">Loading subscription status...</p>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-0">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Subscription & Billing</h1>

        {status && (
          <div className="space-y-6">
            {/* Current Status Card */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Current Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${
                    status.is_active ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {status.subscription_status === 'trial' && 'Free Trial'}
                    {status.subscription_status === 'active' && 'Active'}
                    {status.subscription_status === 'canceled' && 'Canceled'}
                    {status.subscription_status === 'expired' && 'Expired'}
                    {status.subscription_status === 'past_due' && 'Past Due'}
                    {!status.subscription_status && 'No Subscription'}
                  </span>
                </div>
                
                {status.subscription_plan && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold capitalize">{status.subscription_plan}</span>
                  </div>
                )}

                {status.subscription_status === 'trial' && status.days_remaining_in_trial > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Trial Days Remaining:</span>
                    <span className="font-semibold text-amber-600">
                      {status.days_remaining_in_trial} days
                    </span>
                  </div>
                )}

                {status.subscription_ends_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Renews On:</span>
                    <span className="font-semibold">
                      {new Date(status.subscription_ends_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Actions */}
            {!status.is_active && status.subscription_status !== 'canceled' && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Subscribe to Star4ce</h2>
                <p className="text-gray-600 mb-6">
                  {status.subscription_status === 'trial' 
                    ? `Your ${status.days_remaining_in_trial}-day trial is ending soon. Subscribe now to continue using all features.`
                    : 'Subscribe to unlock all features and become an admin of your dealership.'}
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={creatingCheckout}
                  className="cursor-pointer w-full md:w-auto bg-[#0B2E65] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creatingCheckout ? 'Processing...' : 'Subscribe Now'}
                </button>
              </div>
            )}

            {status.subscription_status === 'canceled' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-red-900 mb-2">
                  Subscription Canceled
                </h2>
                <p className="text-red-700 mb-4">
                  Your subscription has been canceled. You no longer have access to premium features.
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={creatingCheckout}
                  className="cursor-pointer bg-[#0B2E65] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creatingCheckout ? 'Processing...' : 'Resubscribe'}
                </button>
              </div>
            )}

            {status.is_active && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-emerald-900 mb-2">
                      ✓ Active Subscription
                    </h2>
                    <p className="text-emerald-700">
                      Your subscription is active. You have full access to all features as an admin.
                    </p>
                  </div>
                  <button
                    onClick={handleCancel}
                    disabled={canceling}
                    className="cursor-pointer bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {canceling ? 'Canceling...' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            )}

            {/* Features List */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">What's Included</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span>Full admin access to your dealership</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span>Unlimited employee management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span>Unlimited survey access codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span>Advanced analytics and insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span>Email notifications and survey invites</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}

