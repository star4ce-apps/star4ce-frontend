'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { getToken, API_BASE, clearSession } from '@/lib/auth';
import { deleteJsonAuth, patchJsonAuth, putJsonAuth } from '@/lib/http';
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
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [originalProfile, setOriginalProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dealershipName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
        const userData = data.user || data;
        const userDealershipId = userData.dealership_id || userData.dealershipId || null;
        setDealershipId(userDealershipId);

        const profileData = {
          firstName: (userData.first_name ?? userData.firstName ?? (userData as any).first_name ?? '').toString().trim(),
          lastName: (userData.last_name ?? userData.lastName ?? (userData as any).last_name ?? '').toString().trim(),
          email: (userData.email ?? '').toString().trim(),
          phone: (userData.phone ?? userData.phone_number ?? (userData as any).phone ?? '').toString().trim(),
          dealershipName: (userData.dealership_name ?? userData.dealershipName ?? (userData as any).dealership?.name ?? '').toString().trim(),
          address: (userData.dealership_street ?? (userData as any).dealership?.address ?? '').toString().trim(),
          city: (userData.dealership_city ?? (userData as any).dealership?.city ?? '').toString().trim(),
          state: (userData.dealership_state ?? (userData as any).dealership?.state ?? '').toString().trim(),
          zipCode: (userData.dealership_zip_code ?? (userData as any).dealership?.zip_code ?? '').toString().trim(),
        };

        // Always sync address from DB when user has a dealership (single source of truth)
        if (userDealershipId) {
          try {
            const dealershipRes = await fetch(`${API_BASE}/corporate/dealerships/${userDealershipId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (dealershipRes.ok) {
              const dealershipData = await dealershipRes.json();
              const dealership = dealershipData.dealership || dealershipData;
              profileData.dealershipName = (dealership.name ?? profileData.dealershipName ?? '').toString().trim();
              profileData.address = (dealership.address ?? profileData.address ?? '').toString().trim();
              profileData.city = (dealership.city ?? profileData.city ?? '').toString().trim();
              profileData.state = (dealership.state ?? profileData.state ?? '').toString().trim();
              profileData.zipCode = (dealership.zip_code ?? profileData.zipCode ?? '').toString().trim();
            }
          } catch (err) {
            console.error('Failed to load dealership info:', err);
          }
        }

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

      // Update user profile (first name, last name) in DB
      await patchJsonAuth('/auth/me', {
        first_name: profile.firstName || null,
        last_name: profile.lastName || null,
      });

      // If user is admin and has a dealership, update dealership name and address fields in DB
      const role = (user as any)?.role;
      if (role === 'admin' && dealershipId) {
        await putJsonAuth('/admin/dealership', {
          name: profile.dealershipName,
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zip_code: profile.zipCode || '',
        });
      }

      setOriginalProfile(profile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
      // Refetch from DB so UI shows persisted address (and role/dealership from server)
      await loadUserProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(msg);
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
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Address
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="Street address"
                      className="w-full px-3 py-2 rounded-lg border bg-white"
                      style={{ borderColor: '#D1D5DB', color: '#111827' }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        City
                      </label>
                      <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border bg-white"
                        style={{ borderColor: '#D1D5DB', color: '#111827' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        State
                      </label>
                      <input
                        type="text"
                        value={profile.state}
                        onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border bg-white"
                        style={{ borderColor: '#D1D5DB', color: '#111827' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={profile.zipCode}
                        onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border bg-white"
                        style={{ borderColor: '#D1D5DB', color: '#111827' }}
                      />
                    </div>
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
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Address
                    </label>
                    <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                      {profile.address || '—'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        City
                      </label>
                      <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                        {profile.city || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        State
                      </label>
                      <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                        {profile.state || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Zip Code
                      </label>
                      <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                        {profile.zipCode || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                          disabled={deletingAccount}
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
                            setDeletingAccount(true);
                            try {
                              await deleteJsonAuth('/auth/me');
                              toast.success('Account deleted');
                              clearSession();
                              router.push('/login');
                            } catch (err: unknown) {
                              const msg = err instanceof Error ? err.message : 'Failed to delete account';
                              toast.error(msg);
                            } finally {
                              setDeletingAccount(false);
                            }
                          }}
                          className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: '1px solid #DC2626' }}
                        >
                          {deletingAccount ? 'Deleting…' : 'Delete Account'}
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

