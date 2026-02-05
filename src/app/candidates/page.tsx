'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth } from '@/lib/http';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

// Job roles dropdown options
const JOB_ROLES = [
  'Body Shop Manager',
  'Body Shop Technician',
  'Business Manager',
  'Business Office Support',
  'C-Level Executives',
  'Platform Manager',
  'Controller',
  'Finance Manager',
  'Finance Director',
  'General Manager',
  'Human Resources Manager',
  'IT Manager',
  'Loaner Agent',
  'Mobility Manager',
  'Parts Counter Employee',
  'Parts Manager',
  'Parts Support',
  'Drivers',
  'Sales Manager',
  'GSM',
  'Sales People',
  'Sales Support',
  'Receptionist',
  'Service Advisor',
  'Service Director',
  'Service Drive Manager',
  'Service Manager',
  'Parts and Service Director',
  'Service Support',
  'Porters',
  'Technician',
  'Used Car Director',
  'Used Car Manager',
];

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
  const [formStep, setFormStep] = useState(1);
  const itemsPerPage = 20;

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    position: '',
    department: '',
    status: 'Awaiting',
    notes: '',
  });
  const [customDepartment, setCustomDepartment] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const departments = [
    'Sales Department',
    'Service Department',
    'Parts Department',
    'Administration Department',
    'Office Department',
    'Finance Department',
    'Customer Relations',
    'Inventory Management',
    'Marketing Department',
    'Human Resources',
    'Technical Support',
    'Warranty Services',
    'Training and Development',
    'Others',
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

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

      // Use getJsonAuth to include X-Dealership-Id header for corporate users
      const data = await getJsonAuth<{ ok: boolean; items: any[] }>('/candidates');
      setCandidates(data.items || []);
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

    // If on step 1, validate step 1 fields and move to step 2
    if (formStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber || !formData.street || !formData.city || !formData.state || !formData.zipCode) {
        setError('Please fill in all required fields in Step 1');
        return;
      }
      setFormStep(2);
      return;
    }

    // If on step 2, validate step 2 fields and submit
    if (!formData.position || !formData.department) {
      setError('Role and Department are required');
      return;
    }
    if (formData.department === 'Others' && !customDepartment) {
      setError('Please enter a department name');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }

      // Prepare JSON data (backend expects JSON, not FormData)
      // Note: Address fields and resume upload are not currently supported by the backend
      const candidateData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phoneNumber || null,
        position: formData.position,
        status: formData.status || 'Awaiting',
        notes: formData.notes || null,
      };

      const res = await fetch(`${API_BASE}/candidates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidateData),
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
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      position: '',
      department: '',
      status: 'Awaiting',
      notes: '',
    });
    setCustomDepartment('');
    setResumeFile(null);
    setFormStep(1);
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

  const statusOptions = ['All Statuses', 'Awaiting', 'Interviewing', 'Offered', 'Denied'];

  // Block unapproved managers
  if (role === 'manager' && isApproved === false) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#F59E0B' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3" style={{ color: COLORS.gray[900] }}>Waiting for Admin Approval</h2>
              <p className="text-sm mb-1" style={{ color: COLORS.gray[500] }}>
                Your account is pending admin approval.
              </p>
              <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                Please wait for an admin to approve your request to join the dealership.
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
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
              <p style={{ color: COLORS.gray[500] }}>Loading candidates...</p>
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
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Candidates</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Manage and review candidate applications
                </p>
              </div>
              {role !== 'corporate' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(true)}
                    className="cursor-pointer px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    style={{ 
                      backgroundColor: COLORS.primary, 
                      color: '#FFFFFF'
                    }}
                  >
                    + Add a Candidate
                  </button>
                </div>
              )}
              {role === 'corporate' && (
                <div className="px-3 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                  View-Only Mode
                </div>
              )}
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
                        <th className="text-center py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}></th>
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
                              candidate.status === 'Offered' ? 'bg-emerald-100 text-emerald-800' :
                              candidate.status === 'Denied' ? 'bg-red-100 text-red-800' :
                              candidate.status === 'Interviewing' ? 'bg-blue-100 text-blue-800' :
                              candidate.status === 'Awaiting' ? 'bg-yellow-100 text-yellow-800' :
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
                  {/* Step 1: Personal Information */}
                  {formStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>First Name *</label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Last Name *</label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                            style={{ 
                              border: '1px solid #D1D5DB', 
                              color: '#374151', 
                              backgroundColor: '#FFFFFF',
                            }}
                          />
                        </div>
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
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Phone Number *</label>
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          placeholder="(000) 000-0000"
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
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Home Address *</label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={formData.street}
                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            placeholder="Street Address"
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                            style={{ 
                              border: '1px solid #D1D5DB', 
                              color: '#374151', 
                              backgroundColor: '#FFFFFF',
                            }}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              placeholder="City"
                              required
                              className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                              style={{ 
                                border: '1px solid #D1D5DB', 
                                color: '#374151', 
                                backgroundColor: '#FFFFFF',
                              }}
                            />
                            <div className="relative">
                              <select
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                                style={{ 
                                  border: '1px solid #D1D5DB', 
                                  color: '#374151', 
                                  backgroundColor: '#FFFFFF',
                                }}
                              >
                                <option value="">State</option>
                                {states.map(state => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </select>
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={formData.zipCode}
                              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                              placeholder="ZIP Code"
                              required
                              className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                              style={{ 
                                border: '1px solid #D1D5DB', 
                                color: '#374151', 
                                backgroundColor: '#FFFFFF',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Professional Details */}
                  {formStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Role *</label>
                        <div className="relative">
                          <select
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                            style={{ 
                              border: '1px solid #D1D5DB', 
                              color: '#374151', 
                              backgroundColor: '#FFFFFF',
                            }}
                          >
                            <option value="">Select Role</option>
                            {JOB_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Department *</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <select
                              value={formData.department}
                              onChange={(e) => {
                                setFormData({ ...formData, department: e.target.value });
                                if (e.target.value !== 'Others') {
                                  setCustomDepartment('');
                                }
                              }}
                              required
                              className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                              style={{ 
                                border: '1px solid #D1D5DB', 
                                color: '#374151', 
                                backgroundColor: '#FFFFFF',
                              }}
                            >
                              <option value="">Select Department</option>
                              {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          {formData.department === 'Others' && (
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Enter department name"
                                value={customDepartment}
                                onChange={(e) => setCustomDepartment(e.target.value)}
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                                style={{ 
                                  border: '1px solid #D1D5DB', 
                                  color: '#374151', 
                                  backgroundColor: '#FFFFFF',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Resume</label>
                        <div className="mt-1">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setResumeFile(file);
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                            style={{ 
                              border: '1px solid #D1D5DB', 
                              color: '#374151', 
                              backgroundColor: '#FFFFFF',
                            }}
                          />
                          {resumeFile && (
                            <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
                              Selected: {resumeFile.name}
                            </p>
                          )}
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
                  )}
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="flex justify-between gap-3 mt-6 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <div>
                      {formStep === 2 && (
                        <button
                          type="button"
                          onClick={() => setFormStep(1)}
                          className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
                          style={{ 
                            border: '1px solid #E5E7EB',
                            color: '#374151',
                            backgroundColor: '#FFFFFF'
                          }}
                        >
                          ← Back
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
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
                        {loading ? 'Adding...' : formStep === 1 ? 'Next →' : 'Add Candidate'}
                      </button>
                    </div>
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

