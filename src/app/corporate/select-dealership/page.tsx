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
};

export default function SelectDealershipPage() {
  const router = useRouter();
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedDealershipId, setSelectedDealershipId] = useState<number | null>(null);

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

      const res = await fetch(`${API_BASE}/corporate/dealerships`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setDealerships(data.dealerships || []);
        // If only one dealership, auto-select it
        if (data.dealerships && data.dealerships.length === 1) {
          const singleDealership = data.dealerships[0];
          setSelectedDealershipId(singleDealership.id);
          localStorage.setItem('selected_dealership_id', singleDealership.id.toString());
          localStorage.setItem('selected_dealership_name', singleDealership.name);
        }
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
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Select Dealership</h1>
              <p className="text-base" style={{ color: '#6B7280' }}>Choose which dealership you want to view</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {dealerships.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-base mb-2" style={{ color: '#9CA3AF' }}>No dealerships assigned yet.</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Contact an admin to assign dealerships to your account.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealerships.map((dealership) => (
                <div
                  key={dealership.id}
                  onClick={() => handleSelectDealership(dealership)}
                  className={`cursor-pointer rounded-xl p-6 transition-all duration-200 ${
                    selectedDealershipId === dealership.id
                      ? 'ring-2 ring-[#0B2E65]'
                      : 'hover:shadow-lg'
                  }`}
                  style={{ 
                    backgroundColor: '#FFFFFF', 
                    border: selectedDealershipId === dealership.id ? '2px solid #0B2E65' : '1px solid #E5E7EB',
                    boxShadow: selectedDealershipId === dealership.id ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold" style={{ color: '#232E40' }}>{dealership.name}</h3>
                    {selectedDealershipId === dealership.id && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#0B2E65] text-white">
                        Selected
                      </span>
                    )}
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
                </div>
              ))}
            </div>
          )}

          {selectedDealershipId && (
            <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <p className="text-sm font-medium" style={{ color: '#065F46' }}>
                ✓ You are currently viewing: <span className="font-bold">{dealerships.find(d => d.id === selectedDealershipId)?.name}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: '#047857' }}>
                All dashboard data and analytics will be filtered for this dealership.
              </p>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

