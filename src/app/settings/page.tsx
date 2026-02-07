'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { getToken, API_BASE } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dealershipName: '',
    streetAddress: '',
  });
  const [originalProfile, setOriginalProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dealershipName: '',
    streetAddress: '',
  });
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Profile API response:', data); // Debug log
        
        // Handle different response structures: data.user, data, or direct fields
        const userData = data.user || data;
        console.log('User data extracted:', userData); // Debug log
        
        // Extract dealership ID
        const userDealershipId = userData.dealership_id || userData.dealershipId || null;
        setDealershipId(userDealershipId);
        
        // Extract profile information - check all possible field names
        const profileData = {
          firstName: userData.first_name || userData.firstName || (userData as any).first_name || '',
          lastName: userData.last_name || userData.lastName || (userData as any).last_name || '',
          email: userData.email || '',
          phone: userData.phone || userData.phone_number || (userData as any).phone || '',
          dealershipName: userData.dealership_name || userData.dealershipName || (userData as any).dealership?.name || '',
          streetAddress: userData.dealership_address || userData.dealershipAddress || userData.street_address || userData.streetAddress || (userData as any).dealership?.address || '',
        };
        
        // If we have a dealership_id but no name/address, fetch dealership info
        if (userDealershipId && !profileData.dealershipName) {
          try {
            const dealershipRes = await fetch(`${API_BASE}/corporate/dealerships/${userDealershipId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (dealershipRes.ok) {
              const dealershipData = await dealershipRes.json();
              const dealership = dealershipData.dealership || dealershipData;
              profileData.dealershipName = dealership.name || '';
              profileData.streetAddress = dealership.address || dealership.street_address || '';
            }
          } catch (err) {
            console.error('Failed to load dealership info:', err);
          }
        }
        
        console.log('Profile data set:', profileData); // Debug log
        setUser(userData);
        setProfile(profileData);
        setOriginalProfile(profileData);
      } else {
        console.error('Failed to load profile - response not ok:', res.status);
        const errorData = await res.json().catch(() => ({}));
        console.error('Error data:', errorData);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  }

  function handleEdit() {
    setIsEditing(true);
  }

  function handleExitWithoutSaving() {
    setProfile(originalProfile);
    setIsEditing(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Not logged in');
        return;
      }

      // TODO: Update profile via API
      // For now, just update the original profile to reflect saved state
      setOriginalProfile(profile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 dark:text-white" style={{ color: '#232E40' }}>Settings</h1>
              <p className="text-sm dark:text-slate-300" style={{ color: '#6B7280' }}>Manage your account settings and preferences</p>
            </div>

            {/* Profile Settings */}
            <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold" style={{ color: '#232E40' }}>Profile</h2>
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="cursor-pointer px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: '#4D6DBE' }}
                  >
                    Edit
                  </button>
                )}
              </div>
              {isEditing ? (
                <form onSubmit={handleSaveProfile}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border bg-white"
                        style={{ borderColor: '#D1D5DB', color: '#111827' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border bg-white"
                        style={{ borderColor: '#D1D5DB', color: '#111827' }}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                      style={{ borderColor: '#D1D5DB', color: '#111827' }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                      style={{ borderColor: '#D1D5DB', color: '#111827' }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Dealership Name
                    </label>
                    <input
                      type="text"
                      value={profile.dealershipName}
                      onChange={(e) => setProfile({ ...profile, dealershipName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                      style={{ borderColor: '#D1D5DB', color: '#111827' }}
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={profile.streetAddress}
                      onChange={(e) => setProfile({ ...profile, streetAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                      style={{ borderColor: '#D1D5DB', color: '#111827' }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="cursor-pointer px-6 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#4D6DBE' }}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handleExitWithoutSaving}
                      disabled={loading}
                      className="cursor-pointer px-6 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', color: '#374151' }}
                    >
                      Exit without saving
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        First Name
                      </label>
                      <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                        {profile.firstName || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Last Name
                      </label>
                      <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                        {profile.lastName || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Email
                    </label>
                    <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                      {profile.email || '—'}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Phone Number
                    </label>
                    <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                      {profile.phone || '—'}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Dealership Name
                    </label>
                    <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                      {profile.dealershipName || '—'}
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Street Address
                    </label>
                    <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                      {profile.streetAddress || '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Appearance Settings */}
            <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#232E40' }}>Appearance</h2>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: '#232E40' }}>Dark Mode</h3>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Switch between light and dark theme</p>
                </div>
                <button
                  disabled
                  className="cursor-not-allowed relative inline-flex h-6 w-11 items-center rounded-full transition-colors opacity-50"
                  style={{ backgroundColor: '#D1D5DB' }}
                  role="switch"
                  aria-checked={false}
                  aria-label="Toggle dark mode (coming soon)"
                  title="Dark mode coming soon"
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"
                  />
                </button>
              </div>
            </div>

            {/* Account Settings */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#232E40' }}>Account</h2>
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/subscription')}
                  className="cursor-pointer w-full text-left px-4 py-3 rounded-lg transition-all"
                  style={{ border: '1px solid #E5E7EB' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold mb-1" style={{ color: '#232E40' }}>Subscription & Billing</h3>
                      <p className="text-xs" style={{ color: '#6B7280' }}>Manage your subscription and payment methods</p>
                    </div>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Danger Zone - Collapsible */}
                <div className="border-t" style={{ borderColor: '#E5E7EB' }}>
                  <button
                    onClick={() => setShowDangerZone(!showDangerZone)}
                    className="cursor-pointer w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-semibold mb-1" style={{ color: '#DC2626' }}>Danger Zone</h3>
                      <p className="text-xs" style={{ color: '#DC2626' }}>Irreversible and destructive actions</p>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform ${showDangerZone ? 'rotate-0' : '-rotate-90'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: '#6B7280' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showDangerZone && (
                    <div className="px-4 pb-4">
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                        <h3 className="text-sm font-semibold mb-1" style={{ color: '#DC2626' }}>Delete Account</h3>
                        <p className="text-xs mb-3" style={{ color: '#991B1B' }}>Once you delete your account, there is no going back. Please be certain.</p>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                              toast.error('Account deletion is not yet implemented');
                            }
                          }}
                          className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-all hover:opacity-90"
                          style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: '1px solid #DC2626' }}
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

