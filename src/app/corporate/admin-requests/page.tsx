'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

type AdminRequest = {
  id: number;
  user_id: number;
  user_email: string | null;
  dealership_id: number;
  dealership_name: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  notes: string | null;
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    loadUserRole();
    loadAdminRequests();
  }, []);

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

  async function loadAdminRequests() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/corporate/admin-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
      } else {
        setError(data.error || 'Failed to load admin requests');
      }
    } catch (err) {
      setError('Failed to load admin requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: number) {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/corporate/admin-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Admin request approved successfully');
        await loadAdminRequests();
      } else {
        toast.error(data.error || 'Failed to approve request');
      }
    } catch (err) {
      toast.error('Failed to approve request');
      console.error(err);
    }
  }

  async function handleReject(requestId: number) {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/corporate/admin-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: rejectNotes[requestId] || null }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Admin request rejected');
        setRejectNotes({ ...rejectNotes, [requestId]: '' });
        await loadAdminRequests();
      } else {
        toast.error(data.error || 'Failed to reject request');
      }
    } catch (err) {
      toast.error('Failed to reject request');
      console.error(err);
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-base" style={{ color: '#6B7280' }}>Loading admin requests...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

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
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Admin Requests</h1>
              <p className="text-base" style={{ color: '#6B7280' }}>Review and approve manager requests to become admins</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-8 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Pending Requests ({pendingRequests.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Manager</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Dealership</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Requested</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((request) => (
                      <tr key={request.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td className="py-4 px-6">
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{request.user_email}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{request.dealership_name || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>
                            {new Date(request.requested_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                              style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const notes = prompt('Enter rejection notes (optional):');
                                if (notes !== null) {
                                  setRejectNotes({ ...rejectNotes, [request.id]: notes });
                                  handleReject(request.id);
                                }
                              }}
                              className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                              style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Processed Requests */}
          {processedRequests.length > 0 && (
            <div className="rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Processed Requests ({processedRequests.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Manager</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Dealership</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Status</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Reviewed</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRequests.map((request) => (
                      <tr key={request.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td className="py-4 px-6">
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{request.user_email}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{request.dealership_name || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            request.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>
                            {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{request.notes || 'N/A'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {requests.length === 0 && (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-base" style={{ color: '#9CA3AF' }}>
                No admin requests available.
              </p>
              <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                Manager requests to become admins will appear here.
              </p>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

