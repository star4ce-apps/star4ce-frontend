'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

type ManagerRequest = {
  id: number;
  manager_id: number;
  manager_email: string;
  dealership_id: number;
  dealership_name: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewer_email: string | null;
  notes: string | null;
};

export default function ManagerRequestsPage() {
  const [pendingRequests, setPendingRequests] = useState<ManagerRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<ManagerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ManagerRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [selectedRole, setSelectedRole] = useState<'manager' | 'hiring_manager'>('manager');

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

      const res = await fetch(`${API_BASE}/admin/manager-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setPendingRequests(data.pending || []);
        setProcessedRequests(data.processed || []);
      } else {
        setError(data.error || 'Failed to load requests');
      }
    } catch (err) {
      setError('Failed to load requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: number, role: 'manager' | 'hiring_manager' = 'manager') {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/admin/manager-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Request approved successfully');
        setShowApproveModal(false);
        setSelectedRequest(null);
        setSelectedRole('manager');
        await loadRequests();
      } else {
        toast.error(data.error || 'Failed to approve request');
      }
    } catch (err) {
      toast.error('Failed to approve request');
      console.error(err);
    }
  }

  async function handleReject(requestId: number, notes: string) {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/admin/manager-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Request rejected');
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectNotes('');
        await loadRequests();
      } else {
        toast.error(data.error || 'Failed to reject request');
      }
    } catch (err) {
      toast.error('Failed to reject request');
      console.error(err);
    }
  }

  // Wait for role to be loaded before checking
  if (loading || userRole === null) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-base" style={{ color: '#6B7280' }}>Loading requests...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  // Only show error if role is explicitly not admin (not null/undefined)
  if (userRole && userRole !== 'admin') {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="rounded-xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-base" style={{ color: '#6B7280' }}>
                This page is only available to admin users.
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
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-1" style={{ color: '#232E40' }}>Manager Requests</h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>Approve or reject manager requests to join your dealership</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Pending Requests */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#232E40' }}>
              Pending Requests ({pendingRequests.length})
            </h2>
            
            {pendingRequests.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <p className="text-base" style={{ color: '#9CA3AF' }}>No pending manager requests</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Manager Email</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Dealership</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Requested</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((request) => (
                      <tr key={request.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td className="py-4 px-6">
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{request.manager_email}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{request.dealership_name}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>
                            {new Date(request.requested_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setSelectedRole('manager');
                                setShowApproveModal(true);
                              }}
                              className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                              style={{ 
                                backgroundColor: '#10B981', 
                                color: '#FFFFFF'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                              className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                              style={{ 
                                backgroundColor: '#EF4444', 
                                color: '#FFFFFF'
                              }}
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
            )}
          </div>

          {/* Processed Requests */}
          {processedRequests.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#232E40' }}>
                Recent Processed Requests ({processedRequests.length})
              </h2>
              
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Manager Email</th>
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
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{request.manager_email}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{request.dealership_name}</span>
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
                          <span className="text-sm" style={{ color: '#6B7280' }}>
                            {request.notes || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Approve Modal */}
          {showApproveModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#232E40' }}>Approve Manager Request</h2>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                  Approving request from <strong>{selectedRequest.manager_email}</strong> for <strong>{selectedRequest.dealership_name}</strong>
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Select Role *</label>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="manager"
                        checked={selectedRole === 'manager'}
                        onChange={(e) => setSelectedRole(e.target.value as 'manager' | 'hiring_manager')}
                        className="mr-2"
                      />
                      <span className="text-sm" style={{ color: '#232E40' }}>Manager</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="hiring_manager"
                        checked={selectedRole === 'hiring_manager'}
                        onChange={(e) => setSelectedRole(e.target.value as 'manager' | 'hiring_manager')}
                        className="mr-2"
                      />
                      <span className="text-sm" style={{ color: '#232E40' }}>Hiring Manager</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedRequest(null);
                      setSelectedRole('manager');
                    }}
                    className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id, selectedRole)}
                    className="cursor-pointer flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Approve as {selectedRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#232E40' }}>Reject Manager Request</h2>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                  Rejecting request from <strong>{selectedRequest.manager_email}</strong> for <strong>{selectedRequest.dealership_name}</strong>
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Rejection Notes (Optional)</label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#232E40' }}
                    placeholder="Add notes for rejection..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedRequest(null);
                      setRejectNotes('');
                    }}
                    className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest.id, rejectNotes)}
                    className="cursor-pointer flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Reject Request
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

