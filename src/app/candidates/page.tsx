'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  status: string;
  applied_at: string;
  score?: number;
  notes?: string;
};

export default function CandidatesPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 20;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    status: 'Pending',
    notes: '',
  });

  useEffect(() => {
    // Check user approval status
    async function checkUserStatus() {
      try {
        const token = getToken();
        if (!token) return;
        
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setRole(data.user?.role || data.role);
          setIsApproved(data.user?.is_approved !== false && data.is_approved !== false);
        } else {
          const data = await res.json();
          if (data.error === 'manager_not_approved') {
            setRole('manager');
            setIsApproved(false);
          }
        }
      } catch (err) {
        console.error('Failed to check user status:', err);
      }
    }
    
    checkUserStatus();
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCandidates(data.items || []);
      } else {
        setError(data.error || 'Failed to load candidates');
      }
    } catch (err) {
      setError('Failed to load candidates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name || !formData.email || !formData.position) {
      setError('Name, email, and position are required');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }

      const res = await fetch(`${API_BASE}/candidates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save candidate');
      }

      await loadCandidates();
      resetForm();
      toast.success('Candidate added successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save candidate';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      status: 'Pending',
      notes: '',
    });
    setShowModal(false);
    setError(null);
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All Statuses' || candidate.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + itemsPerPage);

  const statusOptions = ['All Statuses', 'Pending', 'Interview Scheduled', 'Hired', 'Rejected', 'Withdrawn'];

  // Block unapproved managers
  if (role === 'manager' && isApproved === false) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#232E40' }}>Waiting for Admin Approval</h2>
              <p className="text-base mb-2" style={{ color: '#6B7280' }}>
                Your account is pending admin approval.
              </p>
              <p className="text-base" style={{ color: '#6B7280' }}>
                Please wait for an admin to approve your request to join the dealership. You'll be able to access this page once approved.
              </p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-base" style={{ color: '#6B7280' }}>Loading candidates...</p>
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Candidates</h1>
                <p className="text-base" style={{ color: '#6B7280' }}>Manage and review candidate applications</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="cursor-pointer px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
                  style={{ 
                    backgroundColor: '#4D6DBE', 
                    color: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5a9e'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4D6DBE'}
                >
                  + Add a Candidate
                </button>
                <Link
                  href="/candidates/score"
                  className="cursor-pointer px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
                  style={{ 
                    backgroundColor: '#0B2E65', 
                    color: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c5aa0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0B2E65'}
                >
                  Score a Candidate
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search candidates by name, email, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border"
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#E5E7EB',
                  color: '#232E40'
                }}
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 rounded-lg border"
              style={{ 
                backgroundColor: '#FFFFFF', 
                borderColor: '#E5E7EB',
                color: '#232E40'
              }}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Candidates List */}
          <div className="rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
            {paginatedCandidates.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base" style={{ color: '#9CA3AF' }}>
                  {searchQuery || selectedStatus !== 'All Statuses' 
                    ? 'No candidates found matching your filters.' 
                    : 'No candidates available yet.'}
                </p>
                <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                  Candidates will appear here once they are added to the system.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Name</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Email</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Position</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Status</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Score</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Applied</th>
                        <th className="text-center py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCandidates.map((candidate) => (
                        <tr key={candidate.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                          <td className="py-4 px-6">
                            <span className="text-base font-medium" style={{ color: '#232E40' }}>{candidate.name}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm" style={{ color: '#6B7280' }}>{candidate.email}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm" style={{ color: '#6B7280' }}>{candidate.position}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              candidate.status === 'Hired' ? 'bg-emerald-100 text-emerald-800' :
                              candidate.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              candidate.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {candidate.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-semibold" style={{ color: '#232E40' }}>
                              {candidate.score !== undefined ? `${candidate.score}/100` : 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm" style={{ color: '#6B7280' }}>
                              {new Date(candidate.applied_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Link
                              href={`/candidates/${candidate.id}`}
                              className="cursor-pointer text-sm font-semibold"
                              style={{ color: '#0B2E65' }}
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm" style={{ color: '#6B7280' }}>
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCandidates.length)} of {filteredCandidates.length} candidates
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            backgroundColor: currentPage === 1 ? '#F3F4F6' : '#0B2E65',
                            color: currentPage === 1 ? '#9CA3AF' : '#FFFFFF'
                          }}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#0B2E65',
                            color: currentPage === totalPages ? '#9CA3AF' : '#FFFFFF'
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Add Candidate Modal */}
          {showModal && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  resetForm();
                }
              }}
            >
              <div 
                className="bg-white rounded-xl shadow-2xl"
                style={{ 
                  width: '90%', 
                  maxWidth: '600px', 
                  maxHeight: '95vh', 
                  overflowY: 'auto',
                  border: '1px solid #E5E7EB'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#4D6DBE' }}>
                  <h2 className="text-xl font-bold mb-0.5" style={{ color: '#FFFFFF' }}>Add a Candidate</h2>
                  <p className="text-xs" style={{ color: '#E0E7FF' }}>Enter candidate information</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(000) 000-0000"
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Position *</label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        required
                        placeholder="e.g., Sales Consultant"
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Status</label>
                      <div className="relative">
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Interview Scheduled">Interview Scheduled</option>
                          <option value="Hired">Hired</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Withdrawn">Withdrawn</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                        placeholder="Additional notes about the candidate..."
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
                      style={{ 
                        border: '1px solid #E5E7EB',
                        color: '#374151',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="cursor-pointer px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#4D6DBE' }}
                    >
                      {loading ? 'Adding...' : 'Add Candidate'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

