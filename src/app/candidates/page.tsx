'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const itemsPerPage = 20;

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

      // TODO: Replace with actual API endpoint when backend is ready
      // const res = await fetch(`${API_BASE}/candidates`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      // const data = await res.json();
      // if (res.ok) {
      //   setCandidates(data.candidates || []);
      // } else {
      //   setError(data.error || 'Failed to load candidates');
      // }
      
      // Temporary: Empty array until API is ready
      setCandidates([]);
    } catch (err) {
      setError('Failed to load candidates');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        </main>
      </div>
    </RequireAuth>
  );
}

