'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

// Modern color palette - matching surveys page
const COLORS = {
  primary: '#3B5998',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    900: '#0F172A',
  }
};

type Dealership = {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  is_assigned?: boolean;
  has_pending_request?: boolean;
};

export default function DealershipsPage() {
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [managers, setManagers] = useState<Array<{ id: number; email: string; is_approved: boolean }>>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [adminFormData, setAdminFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    async function init() {
      await loadUserRole();
      await loadDealerships();
    }
    init();
  }, []);

  useEffect(() => {
    if (userRole) {
      loadDealerships();
    }
  }, [userRole]);

  async function loadUserRole() {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role || null);
      }
    } catch (err) {
      console.error('Failed to load user role:', err);
    }
  }

  async function loadDealerships() {
    if (!userRole) return; // Wait for role to load
    
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      // For corporate users, show all dealerships with assignment status
      // For other users, show only their assigned dealership
      const endpoint = userRole === 'corporate' ? '/corporate/all-dealerships' : '/corporate/dealerships';
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      setLoading(false);
    }
  }

  async function handleAssign(dealershipId: number) {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/corporate/dealerships/${dealershipId}/assign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Dealership assigned successfully');
        await loadDealerships(); // Reload to update assignment status
      } else {
        toast.error(data.error || 'Failed to assign dealership');
      }
    } catch (err) {
      toast.error('Failed to assign dealership');
      console.error(err);
    }
  }

  async function handleRequestAccess(dealershipId: number) {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/corporate/dealerships/${dealershipId}/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Access request submitted successfully');
        await loadDealerships(); // Reload to update request status
      } else {
        toast.error(data.error || 'Failed to submit access request');
      }
    } catch (err) {
      toast.error('Failed to submit access request');
      console.error(err);
    }
  }

  async function handleUnassign(dealershipId: number) {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/corporate/dealerships/${dealershipId}/unassign`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Dealership unassigned successfully');
        await loadDealerships(); // Reload to update assignment status
      } else {
        toast.error(data.error || 'Failed to unassign dealership');
      }
    } catch (err) {
      toast.error('Failed to unassign dealership');
      console.error(err);
    }
  }

  async function handleCreateDealership() {
    if (!createFormData.name.trim()) {
      toast.error('Dealership name is required');
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/corporate/dealerships`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFormData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Dealership created successfully');
        setShowCreateModal(false);
        setCreateFormData({ name: '', address: '', city: '', state: '', zip_code: '' });
        await loadDealerships();
      } else {
        toast.error(data.error || 'Failed to create dealership');
      }
    } catch (err) {
      toast.error('Failed to create dealership');
      console.error(err);
    }
  }

  async function handleCreateAdmin(dealershipId: number) {
    if (!adminFormData.email.trim() || !adminFormData.password.trim()) {
      toast.error('Email and password are required');
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/corporate/dealerships/${dealershipId}/admins`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminFormData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Admin account created successfully');
        setShowAdminModal(false);
        setSelectedDealership(null);
        setAdminFormData({ email: '', password: '' });
      } else {
        toast.error(data.error || 'Failed to create admin account');
      }
    } catch (err) {
      toast.error('Failed to create admin account');
      console.error(err);
    }
  }

  async function loadManagers(dealershipId: number) {
    setLoadingManagers(true);
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/corporate/dealerships/${dealershipId}/managers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setManagers(data.managers || []);
      } else {
        toast.error(data.error || 'Failed to load managers');
        setManagers([]);
      }
    } catch (err) {
      toast.error('Failed to load managers');
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  }

  async function handlePromoteManager(managerId: number, dealershipId: number) {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/corporate/managers/${managerId}/promote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dealership_id: dealershipId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Manager promoted to admin successfully');
        await loadManagers(dealershipId);
      } else {
        toast.error(data.error || 'Failed to promote manager');
      }
    } catch (err) {
      toast.error('Failed to promote manager');
      console.error(err);
    }
  }

  const filteredDealerships = dealerships.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.city && d.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.state && d.state.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
              <p style={{ color: COLORS.gray[500] }}>Loading dealerships...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  // Only show this page to corporate users
  if (userRole !== 'corporate') {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
            <div className="rounded-xl p-8" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                This page is only available to corporate users.
              </p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
        <HubSidebar />
        
        <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>
                  {userRole === 'corporate' ? 'Dealership Overview' : 'Dealership Management'}
                </h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  {userRole === 'corporate' 
                    ? 'View assigned dealerships and their status' 
                    : 'Create and manage dealerships, assign admins'}
                </p>
              </div>
              {userRole !== 'corporate' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="cursor-pointer px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                  style={{ 
                    backgroundColor: COLORS.primary, 
                    color: '#FFFFFF'
                  }}
                >
                  Create Dealership
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search dealerships by name, city, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-lg border"
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#E5E7EB',
                  color: '#232E40'
                }}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#9CA3AF' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Dealerships List */}
          <div className="rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Dealership Name</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Location</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Subscription</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Status</th>
                    {userRole !== 'corporate' && (
                      <th className="text-center py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredDealerships.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm" style={{ color: '#9CA3AF' }}>
                        {searchQuery ? 'No dealerships found matching your search.' : 'No dealerships available.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDealerships.map((dealership) => (
                      <tr key={dealership.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td className="py-4 px-6">
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{dealership.name}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>
                            {[dealership.city, dealership.state].filter(Boolean).join(', ') || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            dealership.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            dealership.subscription_status === 'trial' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {dealership.subscription_status === 'active' ? 'Active' :
                             dealership.subscription_status === 'trial' ? 'Trial' :
                             dealership.subscription_status || 'None'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-sm font-medium ${
                            dealership.is_assigned ? 'text-emerald-600' : 
                            dealership.has_pending_request ? 'text-amber-600' : 
                            'text-gray-500'
                          }`}>
                            {dealership.is_assigned ? '✓ Assigned to You' : 
                             dealership.has_pending_request ? '⏳ Request Pending' : 
                             'Not Assigned'}
                          </span>
                        </td>
                        {userRole === 'corporate' ? (
                          <td className="py-4 px-6 text-center">
                            {!dealership.is_assigned && !dealership.has_pending_request && (
                              <button
                                onClick={() => handleRequestAccess(dealership.id)}
                                className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                                style={{ 
                                  backgroundColor: '#0B2E65', 
                                  color: '#FFFFFF'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c5aa0'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0B2E65'}
                              >
                                Request Access
                              </button>
                            )}
                            {dealership.has_pending_request && (
                              <span className="text-xs text-amber-600 font-medium">Request Sent</span>
                            )}
                          </td>
                        ) : userRole !== 'corporate' && (
                          <td className="py-4 px-6 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedDealership(dealership);
                                  setShowAdminModal(true);
                                }}
                                className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-lg transition-colors"
                                style={{ 
                                  backgroundColor: '#10B981', 
                                  color: '#FFFFFF'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                              >
                                Create Admin
                              </button>
                              <button
                                onClick={async () => {
                                  setSelectedDealership(dealership);
                                  setShowPromoteModal(true);
                                  await loadManagers(dealership.id);
                                }}
                                className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-lg transition-colors"
                                style={{ 
                                  backgroundColor: '#3B82F6', 
                                  color: '#FFFFFF'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                              >
                                Promote Manager
                              </button>
                              {dealership.is_assigned ? (
                                <button
                                  onClick={() => handleUnassign(dealership.id)}
                                  className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-lg transition-colors"
                                  style={{ 
                                    backgroundColor: '#EF4444', 
                                    color: '#FFFFFF'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                                >
                                  Remove
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAssign(dealership.id)}
                                  className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-lg transition-colors"
                                  style={{ 
                                    backgroundColor: '#0B2E65', 
                                    color: '#FFFFFF'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c5aa0'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0B2E65'}
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 rounded-xl p-6" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              <span className="font-semibold" style={{ color: '#232E40' }}>
                {dealerships.filter(d => d.is_assigned).length}
              </span> of{' '}
              <span className="font-semibold" style={{ color: '#232E40' }}>
                {dealerships.length}
              </span> dealerships assigned
            </p>
            <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
              You can view analytics and data only for assigned dealerships.
            </p>
          </div>

          {/* Create Dealership Modal - Admin Only */}
          {showCreateModal && userRole !== 'corporate' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#232E40' }}>Create New Dealership</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Dealership Name *</label>
                    <input
                      type="text"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#232E40' }}
                      placeholder="Enter dealership name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Address</label>
                    <input
                      type="text"
                      value={createFormData.address}
                      onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#232E40' }}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>City</label>
                      <input
                        type="text"
                        value={createFormData.city}
                        onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#232E40' }}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>State</label>
                      <input
                        type="text"
                        value={createFormData.state}
                        onChange={(e) => setCreateFormData({ ...createFormData, state: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#232E40' }}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Zip Code</label>
                    <input
                      type="text"
                      value={createFormData.zip_code}
                      onChange={(e) => setCreateFormData({ ...createFormData, zip_code: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#232E40' }}
                      placeholder="Zip code"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateFormData({ name: '', address: '', city: '', state: '', zip_code: '' });
                    }}
                    className="cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDealership}
                    className="cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#0B2E65', color: '#FFFFFF' }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Promote Manager Modal - Admin Only */}
          {showPromoteModal && selectedDealership && userRole !== 'corporate' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#232E40' }}>Promote Manager to Admin</h2>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>for {selectedDealership.name}</p>
                
                {loadingManagers ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: '#6B7280' }}>Loading managers...</p>
                  </div>
                ) : managers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>No managers found for this dealership.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {managers.map((manager) => (
                      <div key={manager.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#232E40' }}>{manager.email}</p>
                          {!manager.is_approved && (
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>Pending approval</p>
                          )}
                        </div>
                        <button
                          onClick={() => handlePromoteManager(manager.id, selectedDealership.id)}
                          className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                          style={{ 
                            backgroundColor: '#3B82F6', 
                            color: '#FFFFFF'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                        >
                          Promote
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPromoteModal(false);
                      setSelectedDealership(null);
                      setManagers([]);
                    }}
                    className="cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Admin Modal - Admin Only */}
          {showAdminModal && selectedDealership && userRole !== 'corporate' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#232E40' }}>Create Admin Account</h2>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>for {selectedDealership.name}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Email *</label>
                    <input
                      type="email"
                      value={adminFormData.email}
                      onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#232E40' }}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Password *</label>
                    <input
                      type="password"
                      value={adminFormData.password}
                      onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#232E40' }}
                      placeholder="Minimum 8 characters"
                    />
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Must include letters and numbers</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAdminModal(false);
                      setSelectedDealership(null);
                      setAdminFormData({ email: '', password: '' });
                    }}
                    className="cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCreateAdmin(selectedDealership.id)}
                    className="cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#0B2E65', color: '#FFFFFF' }}
                  >
                    Create Admin
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

