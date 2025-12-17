'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

type CorporateRequest = {
  id: number;
  corporate_user_id: number;
  corporate_user_email: string;
  dealership_id: number;
  dealership_name: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewer_email: string | null;
  notes: string | null;
};

export default function CorporateRequestsPage() {
  const [pendingRequests, setPendingRequests] = useState<CorporateRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<CorporateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CorporateRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    async function init() {
      await loadUserRole();
      await loadRequests();
    }
    init();
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
        setUserRole(data.user?.role || data.role || null);
      }
    } catch (err) {
      console.error('Failed to load user role:', err);
    }
  }

  async function loadRequests() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/admin/dealership-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch((fetchError) => {
        // Handle network errors (backend not running, CORS, etc.)
        console.error('Network error:', fetchError);
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      });

      // Check if response is ok before parsing JSON
      if (!res.ok) {
        // Try to parse error message
        let errorMessage = 'Failed to load requests';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || `Failed to load requests (${res.status})`;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `Failed to load requests: ${res.statusText || res.status}`;
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
        setPendingRequests(data.pending || []);
        setProcessedRequests(data.processed || []);
      } else {
        setError(data.error || 'Failed to load requests');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load requests. Please try again.';
      setError(errorMessage);
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: number) {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/admin/dealership-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Corporate request approved');
        await loadRequests();
      } else {
        toast.error(data.error || 'Failed to approve request');
      }
    } catch (err) {
      toast.error('Failed to approve request');
      console.error(err);
    }
  }

  async function handleReject() {
    if (!selectedRequest) return;

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/admin/dealership-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: rejectNotes }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Corporate request rejected');
        setShowRejectModal(false);
        setRejectNotes('');
        setSelectedRequest(null);
        await loadRequests();
      } else {
        toast.error(data.error || 'Failed to reject request');
      }
    } catch (err) {
      toast.error('Failed to reject request');
      console.error(err);
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1">
            <div className="flex items-center justify-center h-full">
              <p style={{ color: '#6B7280' }}>Loading corporate requests...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  if (userRole !== 'admin') {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1">
            <div className="rounded-xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <p style={{ color: '#6B7280' }}>Only admins can access this page.</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#232E40' }}>Corporate Access Requests</h1>
            <p style={{ color: '#6B7280' }}>
              Review and approve/reject requests from corporate users to view your dealership (view-only access)
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Pending Requests */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#232E40' }}>
              Pending Requests ({pendingRequests.length})
            </h2>
            {pendingRequests.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <p style={{ color: '#9CA3AF' }}>No pending corporate requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl p-6"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold" style={{ color: '#232E40' }}>
                            {request.corporate_user_email}
                          </h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            Pending
                          </span>
                        </div>
                        <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
                          Requested to view: <strong>{request.dealership_name}</strong>
                        </p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                          Requested: {formatDate(request.requested_at)}
                        </p>
                        <p className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                          <strong>Note:</strong> Corporate users have view-only access. They cannot modify any data.
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:opacity-90"
                          style={{ backgroundColor: '#22C55E', color: '#FFFFFF' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:opacity-90"
                          style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processed Requests */}
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#232E40' }}>
              Processed Requests ({processedRequests.length})
            </h2>
            {processedRequests.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <p style={{ color: '#9CA3AF' }}>No processed requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Corporate User</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Dealership</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Reviewed At</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRequests.map((request) => (
                      <tr key={request.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td className="py-3 px-4 text-sm" style={{ color: '#232E40' }}>{request.corporate_user_email}</td>
                        <td className="py-3 px-4 text-sm" style={{ color: '#232E40' }}>{request.dealership_name}</td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: request.status === 'approved' ? '#D1FAE5' : '#FEE2E2',
                              color: request.status === 'approved' ? '#065F46' : '#991B1B',
                            }}
                          >
                            {request.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm" style={{ color: '#6B7280' }}>{formatDate(request.reviewed_at)}</td>
                        <td className="py-3 px-4 text-sm" style={{ color: '#6B7280' }}>{request.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reject Modal */}
          {showRejectModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#232E40' }}>Reject Request</h3>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                  Reject request from <strong>{selectedRequest.corporate_user_email}</strong> to view <strong>{selectedRequest.dealership_name}</strong>?
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Reason (optional)
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Enter rejection reason..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0B2E65]"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectNotes('');
                      setSelectedRequest(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: '#E5E7EB', color: '#374151' }}
                  >
                    Cancel
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

