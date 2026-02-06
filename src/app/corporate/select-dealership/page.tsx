'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

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

export default function SelectDealershipPage() {
  const router = useRouter();
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedDealershipId, setSelectedDealershipId] = useState<number | null>(null);
  const [requesting, setRequesting] = useState<{ [key: number]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole === 'corporate') {
      loadDealerships();
      // Load previously selected dealership
      const stored = localStorage.getItem('selected_dealership_id');
      if (stored) {
        setSelectedDealershipId(parseInt(stored));
      }
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
        setUserRole(data.user?.role || data.role);
      }
    } catch (err) {
      console.error('Failed to load user role:', err);
    }
  }

  async function loadDealerships() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      // Load ALL dealerships with assignment status
      const res = await fetch(`${API_BASE}/corporate/all-dealerships`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch((fetchError) => {
        // Handle network errors (backend not running, CORS, etc.)
        console.error('Network error:', fetchError);
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      });

      // Check if response is ok before parsing JSON
      if (!res.ok) {
        // Try to parse error message
        let errorMessage = 'Failed to load dealerships';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || `Failed to load dealerships (${res.status})`;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `Failed to load dealerships: ${res.statusText || res.status}`;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Parse successful response
      const data = await res.json().catch((parseError) => {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response from server');
      });

      if (data.ok !== false) {
        setDealerships(data.dealerships || []);
        // If only one assigned dealership, auto-select it
        const assignedDealerships = (data.dealerships || []).filter((d: Dealership) => d.is_assigned);
        if (assignedDealerships.length === 1) {
          const singleDealership = assignedDealerships[0];
          setSelectedDealershipId(singleDealership.id);
          localStorage.setItem('selected_dealership_id', singleDealership.id.toString());
          localStorage.setItem('selected_dealership_name', singleDealership.name);
        }
      } else {
        setError(data.error || 'Failed to load dealerships');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dealerships. Please try again.';
      setError(errorMessage);
      console.error('Failed to load dealerships:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAccess(dealershipId: number) {
    setRequesting({ ...requesting, [dealershipId]: true });
    try {
      const token = getToken();
      if (!token) {
        toast.error('Not logged in');
        return;
      }

      const res = await fetch(`${API_BASE}/corporate/dealerships/${dealershipId}/request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Access request sent for ${dealerships.find(d => d.id === dealershipId)?.name}`);
        // Reload dealerships to update status
        await loadDealerships();
      } else {
        toast.error(data.error || 'Failed to request access');
      }
    } catch (err) {
      toast.error('Failed to request access');
      console.error(err);
    } finally {
      setRequesting({ ...requesting, [dealershipId]: false });
    }
  }

  const filteredDealerships = dealerships.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.city && d.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.state && d.state.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  function handleSelectDealership(dealership: Dealership) {
    setSelectedDealershipId(dealership.id);
    localStorage.setItem('selected_dealership_id', dealership.id.toString());
    localStorage.setItem('selected_dealership_name', dealership.name);
    toast.success(`Viewing ${dealership.name}`);
    // Redirect to dashboard or back
    router.push('/dashboard');
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-base" style={{ color: '#6B7280' }}>Loading dealerships...</p>
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
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="rounded-xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-base" style={{ color: '#6B7280' }}>
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
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-1" style={{ color: '#232E40' }}>Dealerships</h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>Request access to view dealerships or select one you already have access to</p>
            </div>
            
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dealerships by name, city, or state..."
                className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2E65]"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {filteredDealerships.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-base mb-2" style={{ color: '#9CA3AF' }}>
                {searchQuery ? 'No dealerships found matching your search.' : 'No dealerships available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDealerships.map((dealership) => (
                <div
                  key={dealership.id}
                  className={`rounded-xl p-6 transition-all duration-200 ${
                    selectedDealershipId === dealership.id && dealership.is_assigned
                      ? 'ring-2 ring-[#0B2E65]'
                      : 'hover:shadow-lg'
                  }`}
                  style={{ 
                    backgroundColor: '#FFFFFF', 
                    border: selectedDealershipId === dealership.id && dealership.is_assigned ? '2px solid #0B2E65' : '1px solid #E5E7EB',
                    boxShadow: selectedDealershipId === dealership.id && dealership.is_assigned ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold" style={{ color: '#232E40' }}>{dealership.name}</h3>
                    <div className="flex flex-col gap-1 items-end">
                      {dealership.is_assigned && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                          Access Granted
                        </span>
                      )}
                      {dealership.has_pending_request && !dealership.is_assigned && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                          Pending Approval
                        </span>
                      )}
                      {selectedDealershipId === dealership.id && dealership.is_assigned && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#0B2E65] text-white">
                          Viewing
                        </span>
                      )}
                      {dealership.is_assigned && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                          Access Granted
                        </span>
                      )}
                      {dealership.has_pending_request && !dealership.is_assigned && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                          Pending Request
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span style={{ color: '#6B7280' }}>
                        {[dealership.city, dealership.state].filter(Boolean).join(', ') || 'No location'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        dealership.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        dealership.subscription_status === 'trial' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {dealership.subscription_status === 'active' ? 'Active' :
                         dealership.subscription_status === 'trial' ? 'Trial' :
                         dealership.subscription_status || 'None'}
                      </span>
                    </div>
                  </div>

                  {dealership.is_assigned ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDealership(dealership);
                      }}
                      className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                        selectedDealershipId === dealership.id
                          ? 'bg-[#0B2E65] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedDealershipId === dealership.id ? 'Currently Viewing' : 'View This Dealership'}
                    </button>
                  ) : dealership.has_pending_request ? (
                    <button
                      disabled
                      className="w-full px-4 py-2 rounded-lg font-semibold text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                    >
                      Request Pending
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestAccess(dealership.id);
                      }}
                      disabled={requesting[dealership.id]}
                      className="w-full px-4 py-2 rounded-lg font-semibold text-sm bg-[#0B2E65] text-white hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {requesting[dealership.id] ? 'Requesting...' : 'Request Access'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedDealershipId && dealerships.find(d => d.id === selectedDealershipId)?.is_assigned && (
            <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <p className="text-sm font-medium" style={{ color: '#065F46' }}>
                ✓ You are currently viewing: <span className="font-bold">{dealerships.find(d => d.id === selectedDealershipId)?.name}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: '#047857' }}>
                All dashboard data and analytics will be filtered for this dealership.
              </p>
            </div>
          )}
          
          {dealerships.filter(d => d.has_pending_request && !d.is_assigned).length > 0 && (
            <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <p className="text-sm font-medium" style={{ color: '#92400E' }}>
                ⏳ You have {dealerships.filter(d => d.has_pending_request && !d.is_assigned).length} pending access request(s)
              </p>
              <p className="text-xs mt-1" style={{ color: '#78350F' }}>
                Waiting for admin approval. You'll be notified once access is granted.
              </p>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

