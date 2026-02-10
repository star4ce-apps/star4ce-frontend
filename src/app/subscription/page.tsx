'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/layout/RequireAuth';
import HubSidebar from '@/components/sidebar/HubSidebar';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

/** Format Stripe-backed renewal date in user's local timezone. Optional addDays (e.g. 1 for "switch on" date). */
function formatRenewalOrInvoiceDate(isoEndsAt: string | null | undefined, addDays: number = 0): string {
  if (!isoEndsAt) return '';
  const d = new Date(isoEndsAt);
  if (addDays !== 0) {
    d.setDate(d.getDate() + addDays);
  }
  return d.toLocaleDateString();
}

type SubscriptionStatus = {
  ok: boolean;
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  days_remaining_in_trial: number;
  is_active: boolean;
  cancel_at_period_end?: boolean;
  current_plan?: string | null;
  scheduled_plan?: string | null;
};

type CorporateSubscription = {
  dealership_id: number;
  dealership_name: string;
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  days_remaining_in_trial: number;
  is_active: boolean;
  cancel_at_period_end?: boolean;
};

function SubscriptionPageContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [corporateSubscriptions, setCorporateSubscriptions] = useState<CorporateSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [canceling, setCanceling] = useState<{ [key: number]: boolean }>({});
  const [resuming, setResuming] = useState<{ [key: number]: boolean }>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState<{ [key: number]: boolean }>({});
  const [selectedDealershipId, setSelectedDealershipId] = useState<number | null>(null);
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState<{ [key: number]: boolean }>({});
  const [upgrading, setUpgrading] = useState<{ [key: number]: boolean }>({});
  const [changingPlan, setChangingPlan] = useState<'monthly' | 'annual' | null>(null);
  const [revertingPlan, setRevertingPlan] = useState(false);

  useEffect(() => {
    loadUserRole();
    
    // Check for subscription success/cancel from URL
    const subscriptionParam = search.get('subscription');
    if (subscriptionParam === 'success') {
      toast.success('Subscription activated! You are now an admin.');
      loadSubscriptionStatus();
      router.replace('/subscription');
    } else if (subscriptionParam === 'canceled') {
      toast.error('Subscription canceled. You can try again anytime.');
      router.replace('/subscription');
    }
    
    // Check if coming from admin registration verification
    const adminReg = search.get('admin_registration');
    const adminEmail = search.get('email');
    if (adminReg === 'true' && adminEmail) {
      toast.success('Email verified! Please complete your subscription below.');
    }
  }, [search, router]);

  async function loadUserRole() {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const role = data.user?.role || data.role;
        setUserRole(role);
        
        if (role === 'corporate') {
          loadCorporateSubscriptions();
        } else {
          loadSubscriptionStatus();
        }
      }
    } catch (err) {
      console.error('Failed to load user role:', err);
    }
  }

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

  async function loadCorporateSubscriptions() {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/corporate/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setCorporateSubscriptions(data.subscriptions || []);
      } else {
        toast.error(data.error || 'Failed to load subscriptions');
      }
    } catch (err) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(plan?: 'monthly' | 'annual', dealershipId?: number) {
    setCreatingCheckout(true);
    try {
      const token = getToken();
      
      // Get user email for new admin registration
      let userEmail = '';
      if (token) {
        try {
          const meRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            userEmail = meData.user?.email || meData.email || '';
          }
        } catch (e) {
          // Ignore errors
        }
      }

      const body: any = dealershipId ? { dealership_id: dealershipId } : {};
      if (userEmail) {
        body.email = userEmail;
      }
      if (plan) {
        body.billing_plan = plan;
      }
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/subscription/create-checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.checkout_url) {
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

  async function handleChangePlan(plan: 'monthly' | 'annual') {
    setChangingPlan(plan);
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch(`${API_BASE}/subscription/change-plan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billing_plan: plan }),
      });
      const data = await res.json();
      if (res.ok) {
        const dateStr = data.subscription_ends_at ? formatRenewalOrInvoiceDate(data.subscription_ends_at) : 'the end of your billing period';
        const planLabel = plan === 'annual' ? 'Yearly' : 'Monthly';
        const currentLabel = plan === 'annual' ? 'Monthly' : 'Yearly';
        toast.success(
          `Plan change scheduled. Your ${currentLabel} plan will end on ${dateStr}, and ${planLabel} will start then. To cancel before being charged, use "Switch back to ${currentLabel}" on this page or cancel the subscription.`
        );
        await loadSubscriptionStatus();
      } else {
        toast.error(data.error || 'Failed to change plan');
      }
    } catch (err) {
      toast.error('Failed to change plan');
    } finally {
      setChangingPlan(null);
    }
  }

  async function handleRevertPlanChange() {
    setRevertingPlan(true);
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch(`${API_BASE}/subscription/revert-plan-change`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userRole === 'corporate' && selectedDealershipId ? { dealership_id: selectedDealershipId } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Plan change reverted. You will stay on your current plan.');
        await loadSubscriptionStatus();
      } else {
        toast.error(data.error || 'Failed to revert plan change');
      }
    } catch {
      toast.error('Failed to revert plan change');
    } finally {
      setRevertingPlan(false);
    }
  }

  async function handleCancel(dealershipId: number) {
    setCanceling({ ...canceling, [dealershipId]: true });
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
        body: JSON.stringify({ 
          cancel_at_period_end: true,
          dealership_id: dealershipId 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Subscription will be canceled at the end of the billing period.');
        setShowCancelConfirm({ ...showCancelConfirm, [dealershipId]: false });
        if (userRole === 'corporate') {
          await loadCorporateSubscriptions();
        } else {
          await loadSubscriptionStatus();
        }
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      toast.error('Failed to cancel subscription');
    } finally {
      setCanceling({ ...canceling, [dealershipId]: false });
    }
  }

  async function handleResume(dealershipId: number) {
    setResuming({ ...resuming, [dealershipId]: true });
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/subscription/resume`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dealership_id: dealershipId 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Subscription resumed successfully. Your subscription will continue to renew.');
        if (userRole === 'corporate') {
          await loadCorporateSubscriptions();
        } else {
          await loadSubscriptionStatus();
        }
      } else {
        toast.error(data.error || 'Failed to resume subscription');
      }
    } catch (err) {
      toast.error('Failed to resume subscription');
    } finally {
      setResuming({ ...resuming, [dealershipId]: false });
    }
  }

  async function handleUpgrade(dealershipId?: number) {
    setUpgrading({ ...upgrading, [dealershipId || 0]: true });
    try {
      // For now, redirect to subscribe - in the future this could be a different endpoint
      await handleSubscribe('monthly', dealershipId);
    } finally {
      setUpgrading({ ...upgrading, [dealershipId || 0]: false });
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

  // Corporate View - Show all dealership subscriptions
  if (userRole === 'corporate') {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="mb-8">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-1" style={{ color: '#232E40' }}>Subscription Management</h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>Manage subscriptions for all assigned dealerships</p>
              </div>
            </div>

            {corporateSubscriptions.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <p className="text-base" style={{ color: '#9CA3AF' }}>No dealerships assigned yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {corporateSubscriptions.map((sub) => (
                  <div key={sub.dealership_id} className="rounded-2xl p-6 transition-all duration-200 hover:shadow-xl" style={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-4" style={{ color: '#232E40' }}>{sub.dealership_name}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Status:</span>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                            sub.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              sub.is_active ? 'bg-emerald-500' : 'bg-red-500'
                            }`}></div>
                            {sub.subscription_status === 'trial' && 'Free Trial'}
                            {sub.subscription_status === 'active' && 'Active'}
                            {sub.subscription_status === 'canceled' && 'Canceled'}
                            {sub.subscription_status === 'expired' && 'Expired'}
                            {!sub.subscription_status && 'No Subscription'}
                          </span>
                        </div>
                        {sub.subscription_plan && (
                          <div className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
                            <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Plan:</span>
                            <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{
                              (sub.subscription_plan.toLowerCase() === 'monthly' || sub.subscription_plan.toLowerCase() === 'pro') 
                                ? 'Monthly' 
                                : (sub.subscription_plan.toLowerCase() === 'annual' || sub.subscription_plan.toLowerCase() === 'yearly') 
                                  ? 'Yearly' 
                                  : sub.subscription_plan.charAt(0).toUpperCase() + sub.subscription_plan.slice(1)
                            }</span>
                          </div>
                        )}
                        {sub.subscription_status === 'trial' && sub.days_remaining_in_trial > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Trial Days:</span>
                            <span className="text-sm font-semibold text-amber-600">{sub.days_remaining_in_trial} days</span>
                          </div>
                        )}
                        {sub.subscription_ends_at && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Renews On:</span>
                            <span className="text-sm font-semibold" style={{ color: '#232E40' }}>
                              {formatRenewalOrInvoiceDate(sub.subscription_ends_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      {!sub.is_active && (
                        <button
                          onClick={() => handleSubscribe('monthly', sub.dealership_id)}
                          disabled={creatingCheckout}
                          className="flex-1 cursor-pointer bg-[#0B2E65] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2c5aa0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                          Subscribe
                        </button>
                      )}
                      {sub.is_active && (
                        <>
                          {sub.cancel_at_period_end ? (
                            <button
                              onClick={() => handleResume(sub.dealership_id)}
                              disabled={resuming[sub.dealership_id]}
                              className="flex-1 cursor-pointer bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            >
                              {resuming[sub.dealership_id] ? 'Resuming...' : 'Continue Renewal'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleUpgrade(sub.dealership_id)}
                                disabled={upgrading[sub.dealership_id]}
                                className="flex-1 cursor-pointer bg-[#0B2E65] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2c5aa0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                              >
                                {upgrading[sub.dealership_id] ? 'Processing...' : 'Upgrade'}
                              </button>
                              <button
                                onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [sub.dealership_id]: true })}
                                className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 border-2 cursor-pointer"
                                style={{ 
                                  borderColor: '#D1D5DB',
                                  color: '#6B7280',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#9CA3AF';
                                  e.currentTarget.style.color = '#4B5563';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#D1D5DB';
                                  e.currentTarget.style.color = '#6B7280';
                                }}
                              >
                                View Details
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Subscription Details Modal for Corporate */}
                    {showSubscriptionDetails[sub.dealership_id] && (
                      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(245, 247, 250, 0.8)', backdropFilter: 'blur(2px)' }} onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [sub.dealership_id]: false })}>
                        <div className="rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl" style={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }} onClick={(e) => e.stopPropagation()}>
                          <div className="px-8 py-6" style={{ backgroundColor: '#0B2E65' }}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h2 className="text-2xl font-bold mb-1" style={{ color: '#FFFFFF' }}>Subscription Information</h2>
                                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{sub.dealership_name}</p>
                              </div>
                              <button
                                onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [sub.dealership_id]: false })}
                                className="cursor-pointer p-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-20"
                                style={{ color: '#FFFFFF' }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                            <div className="space-y-6">
                              <div className="p-6 rounded-xl" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                <h3 className="text-lg font-semibold mb-4" style={{ color: '#232E40' }}>Current Plan Details</h3>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Status:</span>
                                    <span className={`text-sm font-semibold ${sub.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {sub.subscription_status === 'trial' && 'Free Trial'}
                                      {sub.subscription_status === 'active' && 'Active'}
                                      {sub.subscription_status === 'canceled' && 'Canceled'}
                                      {sub.subscription_status === 'expired' && 'Expired'}
                                      {!sub.subscription_status && 'No Subscription'}
                                    </span>
                                  </div>
                                  {sub.subscription_plan && (
                                    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                                      <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Plan:</span>
                                      <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{
                                        (sub.subscription_plan.toLowerCase() === 'monthly' || sub.subscription_plan.toLowerCase() === 'pro') 
                                          ? 'Monthly' 
                                          : (sub.subscription_plan.toLowerCase() === 'annual' || sub.subscription_plan.toLowerCase() === 'yearly') 
                                            ? 'Yearly' 
                                            : sub.subscription_plan.charAt(0).toUpperCase() + sub.subscription_plan.slice(1)
                                      }</span>
                                    </div>
                                  )}
                                  {sub.subscription_ends_at && (
                                    <div className="flex justify-between items-center py-2">
                                      <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
                                        {sub.cancel_at_period_end ? 'Cancels On:' : 'Renews On:'}
                                      </span>
                                      <span className={`text-sm font-semibold ${sub.cancel_at_period_end ? 'text-amber-600' : ''}`} style={!sub.cancel_at_period_end ? { color: '#232E40' } : {}}>
                                        {formatRenewalOrInvoiceDate(sub.subscription_ends_at)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {sub.cancel_at_period_end ? (
                                <div className="p-6 rounded-xl" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
                                  <p className="text-sm mb-4" style={{ color: '#92400E' }}>
                                    Subscription is scheduled to cancel on {sub.subscription_ends_at ? formatRenewalOrInvoiceDate(sub.subscription_ends_at) : 'the renewal date'}.
                                  </p>
                                  <button
                                    onClick={async () => {
                                      setShowSubscriptionDetails({ ...showSubscriptionDetails, [sub.dealership_id]: false });
                                      await handleResume(sub.dealership_id);
                                    }}
                                    disabled={resuming[sub.dealership_id]}
                                    className="w-full cursor-pointer bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {resuming[sub.dealership_id] ? 'Resuming...' : 'Continue Renewal'}
                                  </button>
                                </div>
                              ) : (
                                <div className="p-6 rounded-xl border-2 border-red-200" style={{ backgroundColor: '#FEF2F2' }}>
                                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#991B1B' }}>Cancel Subscription</h3>
                                  <p className="text-sm mb-4" style={{ color: '#7F1D1D' }}>
                                    If you cancel, the subscription will remain active until {sub.subscription_ends_at ? formatRenewalOrInvoiceDate(sub.subscription_ends_at) : 'the end of the billing period'}.
                                  </p>
                                  <button
                                    onClick={() => {
                                      setShowSubscriptionDetails({ ...showSubscriptionDetails, [sub.dealership_id]: false });
                                      setShowCancelConfirm({ ...showCancelConfirm, [sub.dealership_id]: true });
                                    }}
                                    className="w-full cursor-pointer bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
                                  >
                                    Cancel Subscription
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cancel Confirmation Modal */}
                    {showCancelConfirm[sub.dealership_id] && (
                      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(245, 247, 250, 0.8)', backdropFilter: 'blur(2px)' }} onClick={() => setShowCancelConfirm({ ...showCancelConfirm, [sub.dealership_id]: false })}>
                        <div className="rounded-2xl max-w-md w-full mx-4 shadow-2xl" style={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }} onClick={(e) => e.stopPropagation()}>
                          <div className="p-8">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-center mb-2" style={{ color: '#232E40' }}>Cancel Subscription?</h3>
                            <p className="text-base text-center mb-2" style={{ color: '#6B7280' }}>
                              Cancel subscription for {sub.dealership_name}?
                            </p>
                            <p className="text-base text-center mb-6" style={{ color: '#6B7280' }}>
                              The subscription will remain active until {sub.subscription_ends_at ? formatRenewalOrInvoiceDate(sub.subscription_ends_at) : 'the end of the billing period'}.
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowCancelConfirm({ ...showCancelConfirm, [sub.dealership_id]: false })}
                                className="flex-1 cursor-pointer px-6 py-3 rounded-xl font-semibold transition-all duration-200 border-2"
                                style={{ 
                                  borderColor: '#D1D5DB',
                                  color: '#6B7280',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#9CA3AF';
                                  e.currentTarget.style.color = '#4B5563';
                                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#D1D5DB';
                                  e.currentTarget.style.color = '#6B7280';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                Keep Subscription
                              </button>
                              <button
                                onClick={() => handleCancel(sub.dealership_id)}
                                disabled={canceling[sub.dealership_id]}
                                className="flex-1 cursor-pointer bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                              >
                                {canceling[sub.dealership_id] ? 'Canceling...' : 'Yes, Cancel'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </RequireAuth>
    );
  }

  // Admin/Manager View - Show only their own dealership subscription
  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-1" style={{ color: '#232E40' }}>Subscription & Billing</h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>Manage your subscription, billing, and access to Star4ce features</p>
            </div>
          </div>

          {status && (
            <div className="space-y-4">
              {/* Current Status - Simple Text Display */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Status:</span>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                    status.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      status.is_active ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-semibold">
                      {status.subscription_status === 'trial' && 'Free Trial'}
                      {status.subscription_status === 'active' && 'Active'}
                      {status.subscription_status === 'canceled' && 'Canceled'}
                      {status.subscription_status === 'expired' && 'Expired'}
                      {!status.subscription_status && 'No Subscription'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#6B7280' }}>
                  {status.subscription_plan && (
                    <span>
                      <span className="font-medium" style={{ color: '#232E40' }}>Plan:</span> {
                        (status.subscription_plan.toLowerCase() === 'monthly' || status.subscription_plan.toLowerCase() === 'pro') 
                          ? 'Monthly' 
                          : (status.subscription_plan.toLowerCase() === 'annual' || status.subscription_plan.toLowerCase() === 'yearly') 
                            ? 'Yearly' 
                            : status.subscription_plan.charAt(0).toUpperCase() + status.subscription_plan.slice(1)
                      }
                    </span>
                  )}
                  {status.subscription_status === 'trial' && status.days_remaining_in_trial > 0 && (
                    <span>
                      <span className="font-medium" style={{ color: '#232E40' }}>Trial Days:</span> {status.days_remaining_in_trial} days remaining
                    </span>
                  )}
                  {status.subscription_ends_at && (
                    <span>
                      <span className="font-medium" style={{ color: '#232E40' }}>
                        {status.cancel_at_period_end
                          ? 'Cancels On:'
                          : (status.subscription_status === 'canceled' || status.subscription_status === 'expired')
                            ? 'Ended:'
                            : status.scheduled_plan === 'annual'
                              ? 'Switching to Yearly on'
                              : status.scheduled_plan === 'monthly'
                                ? 'Switching to Monthly on'
                                : 'Renews On:'}
                      </span> {formatRenewalOrInvoiceDate(status.subscription_ends_at, (status.scheduled_plan === 'annual' || status.scheduled_plan === 'monthly') ? 1 : 0)}
                    </span>
                  )}
                </div>
                </div>

              {/* Pricing Plans Comparison */}
              {(status.is_active || status.subscription_status === 'trial') && (
                <>
                  {status.cancel_at_period_end && (
                    <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-sm" style={{ color: '#92400E' }}>
                        Your subscription is scheduled to cancel on {status.subscription_ends_at ? formatRenewalOrInvoiceDate(status.subscription_ends_at) : 'the renewal date'}. 
                        <button
                          onClick={() => handleResume(0)}
                          disabled={resuming[0]}
                          className="ml-2 text-amber-700 font-semibold hover:text-amber-800 underline cursor-pointer"
                        >
                          {resuming[0] ? 'Resuming...' : 'Continue renewal'}
                        </button>
                      </p>
                    </div>
                  )}
                  {(() => {
                    const effectivePlan = (status.current_plan || status.subscription_plan || '').toLowerCase();
                    const isMonthlyCurrent = effectivePlan === 'monthly' || effectivePlan === 'pro';
                    const isYearlyCurrent = effectivePlan === 'annual' || effectivePlan === 'yearly';
                    const scheduledToYearly = status.scheduled_plan === 'annual' && isMonthlyCurrent;
                    const scheduledToMonthly = status.scheduled_plan === 'monthly' && isYearlyCurrent;
                    return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Monthly Plan */}
                    <div className={`bg-white rounded-xl border-2 p-6 transition-all flex flex-col ${
                      isMonthlyCurrent ? 'border-[#0B2E65] shadow-lg' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="text-center mb-4 flex-shrink-0">
                        <h3 className="text-2xl font-bold mb-2" style={{ color: '#232E40' }}>Monthly</h3>
                        <div className="mb-2">
                          <span className="text-4xl font-bold" style={{ color: '#0B2E65' }}>$199</span>
                          <span className="text-gray-600 ml-2">/ month</span>
                        </div>
                        <p className="text-sm text-gray-600 min-h-[20px]">Billed monthly, cancel anytime</p>
                      </div>
                      <div className="mt-auto">
                        {scheduledToYearly ? (
                          <div className="text-center">
                            <div className="inline-block bg-[#0B2E65] text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                              Current Plan
                            </div>
                            <button
                              onClick={handleRevertPlanChange}
                              disabled={revertingPlan}
                              className="w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer"
                            >
                              {revertingPlan ? 'Reverting...' : 'Switch back to Monthly'}
                            </button>
                          </div>
                        ) : isMonthlyCurrent ? (
                          <div className="text-center">
                            <div className="inline-block bg-[#0B2E65] text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                              Current Plan
                            </div>
                            <button
                              onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [0]: true })}
                              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                            >
                              View Details
                            </button>
                          </div>
                        ) : scheduledToMonthly ? (
                          <div className="text-center">
                            <button
                              onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [0]: true })}
                              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                            >
                              View Details
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">Switching to this plan at end of billing period</p>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => (status.subscription_status === 'active' ? handleChangePlan('monthly') : handleSubscribe('monthly'))}
                              disabled={creatingCheckout || changingPlan !== null}
                              className="w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer"
                            >
                              {changingPlan === 'monthly' ? 'Updating...' : creatingCheckout ? 'Processing...' : status.subscription_status === 'trial' ? 'Subscribe to Monthly' : 'Switch to Monthly'}
                            </button>
                            {status.subscription_status === 'active' && (
                              <p className="text-xs text-gray-500 mt-2 text-center">Takes effect at end of billing period</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Yearly Plan */}
                    <div className={`bg-white rounded-xl border-2 p-6 transition-all relative flex flex-col ${
                      isYearlyCurrent ? 'border-[#0B2E65] shadow-lg' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                        BEST VALUE
                      </div>
                      <div className="text-center mb-4 flex-shrink-0">
                        <h3 className="text-2xl font-bold mb-2" style={{ color: '#232E40' }}>Yearly</h3>
                        <div className="mb-2">
                          <span className="text-4xl font-bold" style={{ color: '#0B2E65' }}>$166</span>
                          <span className="text-gray-600 ml-2">/ month</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Billed annually</p>
                        <p className="text-sm font-semibold text-red-600 min-h-[20px]">Save $396/year!</p>
                      </div>
                      <div className="mt-auto">
                        {scheduledToYearly ? (
                          <div className="text-center">
                            <button
                              onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [0]: true })}
                              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                            >
                              View Details
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">Switching to this plan at end of billing period</p>
                          </div>
                        ) : isYearlyCurrent ? (
                          <div className="text-center">
                            <div className="inline-block bg-[#0B2E65] text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                              Current Plan
                            </div>
                            {scheduledToMonthly ? (
                              <>
                                <button
                                  onClick={handleRevertPlanChange}
                                  disabled={revertingPlan}
                                  className="w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer"
                                >
                                  {revertingPlan ? 'Reverting...' : 'Switch back to Yearly'}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [0]: true })}
                                className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        ) : scheduledToMonthly ? (
                          <div className="text-center">
                            <button
                              onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [0]: true })}
                              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm cursor-pointer"
                            >
                              View Details
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">Switching to this plan at end of billing period</p>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => (status.subscription_status === 'active' ? handleChangePlan('annual') : handleSubscribe('annual'))}
                              disabled={creatingCheckout || changingPlan !== null}
                              className="w-full bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer"
                            >
                              {changingPlan === 'annual' ? 'Updating...' : creatingCheckout ? 'Processing...' : status.subscription_status === 'trial' ? 'Subscribe to Yearly' : 'Switch to Yearly'}
                            </button>
                            {status.subscription_status === 'active' && (
                              <p className="text-xs text-gray-500 mt-2 text-center">Takes effect at end of billing period</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                    );
                  })()}
                </>
              )}

              {/* Subscription Actions */}
              {!status.is_active && (
                <div className="rounded-xl p-6 transition-all duration-200" style={{ 
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-1" style={{ color: '#1f2937' }}>
                        {userRole === 'manager' ? 'Upgrade to Admin' : 'Subscribe to Star4ce'}
                      </h2>
                      <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
                        {status.subscription_status === 'trial' 
                          ? `Your ${status.days_remaining_in_trial}-day trial is ending soon. Subscribe now to continue using all features.`
                          : userRole === 'manager'
                          ? 'Subscribe now to upgrade your account to admin. You\'ll get full access to manage your dealership, create employees, view analytics, and more.'
                          : 'Subscribe to unlock all features and become an admin of your dealership.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-sm font-medium" style={{ color: '#374151' }}>Choose plan:</span>
                    <button
                      onClick={() => handleSubscribe('monthly')}
                      disabled={creatingCheckout}
                      className="cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm"
                    >
                      {creatingCheckout ? 'Processing...' : 'Subscribe Monthly ($199/mo)'}
                    </button>
                    <button
                      onClick={() => handleSubscribe('annual')}
                      disabled={creatingCheckout}
                      className="cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm"
                    >
                      {creatingCheckout ? 'Processing...' : 'Subscribe Yearly ($166/mo)'}
                    </button>
                  </div>
                </div>
              )}


              {/* Features List */}
              <div className="rounded-xl p-6 transition-all duration-200" style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#1f2937' }}>What's Included</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Full admin access to your dealership',
                    'Unlimited employee management',
                    'Unlimited survey access codes',
                    'Advanced analytics and insights',
                    'Email notifications and survey invites',
                    'Priority customer support'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 border border-transparent hover:border-indigo-200">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium" style={{ color: '#374151' }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subscription Details Modal */}
          {showSubscriptionDetails[0] && status && (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(245, 247, 250, 0.8)', backdropFilter: 'blur(2px)' }} onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [0]: false })}>
              <div className="rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl" style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }} onClick={(e) => e.stopPropagation()}>
                {/* Blue Header Bar */}
                <div className="px-8 py-6" style={{ backgroundColor: '#0B2E65' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1" style={{ color: '#FFFFFF' }}>Subscription Information</h2>
                      <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>View and manage your subscription details</p>
                    </div>
                    <button
                      onClick={() => setShowSubscriptionDetails({ ...showSubscriptionDetails, [0]: false })}
                      className="cursor-pointer p-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-20"
                      style={{ color: '#FFFFFF' }}
                      title="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Content Area */}
                <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: '#232E40' }}>Current Plan Details</h3>
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
                            <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{
                              (status.subscription_plan.toLowerCase() === 'monthly' || status.subscription_plan.toLowerCase() === 'pro') 
                                ? 'Monthly' 
                                : (status.subscription_plan.toLowerCase() === 'annual' || status.subscription_plan.toLowerCase() === 'yearly') 
                                  ? 'Yearly' 
                                  : status.subscription_plan.charAt(0).toUpperCase() + status.subscription_plan.slice(1)
                            }</span>
                          </div>
                        )}

                        {status.subscription_ends_at && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
                              {status.cancel_at_period_end
                                ? 'Cancels On:'
                                : (status.subscription_status === 'canceled' || status.subscription_status === 'expired')
                                  ? 'Ended:'
                                    : status.scheduled_plan === 'annual'
                                    ? 'Switching to Yearly on'
                                    : status.scheduled_plan === 'monthly'
                                      ? 'Switching to Monthly on'
                                      : 'Renews On:'}
                            </span>
                            <span className={`text-sm font-semibold ${status.cancel_at_period_end ? 'text-amber-600' : ''}`} style={!status.cancel_at_period_end ? { color: '#232E40' } : {}}>
                              {formatRenewalOrInvoiceDate(status.subscription_ends_at, (status.scheduled_plan === 'annual' || status.scheduled_plan === 'monthly') ? 1 : 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {status.cancel_at_period_end ? (
                      <div className="p-6 rounded-xl" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
                        <p className="text-sm mb-4" style={{ color: '#92400E' }}>
                          Your subscription is scheduled to cancel on {status.subscription_ends_at ? formatRenewalOrInvoiceDate(status.subscription_ends_at) : 'the renewal date'}. You'll continue to have full access until then.
                        </p>
                        <button
                          onClick={async () => {
                            setShowSubscriptionDetails({ ...showSubscriptionDetails, [0]: false });
                            await handleResume(0);
                          }}
                          disabled={resuming[0]}
                          className="w-full cursor-pointer bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {resuming[0] ? 'Resuming...' : 'Continue Renewal'}
                        </button>
                      </div>
                    ) : (
                      <>
                        {status.is_active && !status.cancel_at_period_end && (
                          <div className="text-center pt-2 pb-4">
                            <button
                              onClick={() => {
                                setShowSubscriptionDetails({ ...showSubscriptionDetails, [0]: false });
                                setShowCancelConfirm({ ...showCancelConfirm, [0]: true });
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors cursor-pointer"
                            >
                              Cancel subscription
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {showCancelConfirm[0] && (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(245, 247, 250, 0.8)', backdropFilter: 'blur(2px)' }} onClick={() => setShowCancelConfirm({ ...showCancelConfirm, [0]: false })}>
              <div className="rounded-2xl max-w-md w-full mx-4 shadow-2xl" style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }} onClick={(e) => e.stopPropagation()}>
                <div className="p-8">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-center mb-2" style={{ color: '#232E40' }}>Cancel Subscription?</h3>
                  <p className="text-base text-center mb-2" style={{ color: '#6B7280' }}>
                    Your subscription will remain active until {status?.subscription_ends_at ? formatRenewalOrInvoiceDate(status.subscription_ends_at) : 'the end of your billing period'}.
                  </p>
                  <p className="text-base text-center mb-6" style={{ color: '#6B7280' }}>
                    You'll continue to have full access to all features until then. After that date, your subscription will be canceled and you'll lose admin access.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelConfirm({ ...showCancelConfirm, [0]: false })}
                      className="flex-1 cursor-pointer px-6 py-3 rounded-xl font-semibold transition-all duration-200 border-2"
                      style={{ 
                        borderColor: '#D1D5DB',
                        color: '#6B7280',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#9CA3AF';
                        e.currentTarget.style.color = '#4B5563';
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB';
                        e.currentTarget.style.color = '#6B7280';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Keep Subscription
                    </button>
                    <button
                      onClick={async () => {
                        setCanceling({ ...canceling, [0]: true });
                        try {
                          const token = getToken();
                          if (!token) return;

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
                            toast.success(data.message || 'Subscription will be canceled at the end of the billing period.');
                            setShowCancelConfirm({ ...showCancelConfirm, [0]: false });
                            await loadSubscriptionStatus();
                          } else {
                            toast.error(data.error || 'Failed to cancel subscription');
                          }
                        } catch (err) {
                          toast.error('Failed to cancel subscription');
                        } finally {
                          setCanceling({ ...canceling, [0]: false });
                        }
                      }}
                      disabled={canceling[0]}
                      className="flex-1 cursor-pointer bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      {canceling[0] ? 'Canceling...' : 'Yes, Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

export default function SubscriptionPage() {
  return (
    <RequireAuth>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      }>
        <SubscriptionPageContent />
      </Suspense>
    </RequireAuth>
  );
}
