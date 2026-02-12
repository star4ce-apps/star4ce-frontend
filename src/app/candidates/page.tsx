'use client';

import { useEffect, useRef, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getAverageInterviewScore } from '@/lib/candidateNotes';
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

// Helper function to calculate status from notes
function calculateStatusFromNotes(notes: string | null | undefined, defaultStatus: string): string {
  if (!notes || !notes.trim()) {
    return 'Awaiting First Interview';
  }
  
  // Parse interview blocks to find the last interview's recommendation
  const interviewBlocks: string[] = [];
  
  if (notes.includes('--- INTERVIEW ---')) {
    const parts = notes.split(/--- INTERVIEW ---/);
    parts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed && trimmed.includes('Interview Stage:')) {
        interviewBlocks.push(trimmed);
      }
    });
  } else {
    const stageMatches = [...notes.matchAll(/Interview Stage:/g)];
    if (stageMatches.length === 0) {
      return 'Awaiting First Interview';
    }
    if (stageMatches.length === 1) {
      interviewBlocks.push(notes);
    } else {
      for (let i = 0; i < stageMatches.length; i++) {
        const startIndex = stageMatches[i].index || 0;
        const endIndex = i < stageMatches.length - 1 
          ? (stageMatches[i + 1].index || notes.length)
          : notes.length;
        const block = notes.substring(startIndex, endIndex).trim();
        if (block && block.includes('Interview Stage:')) {
          interviewBlocks.push(block);
        }
      }
    }
  }
  
  if (interviewBlocks.length === 0) {
    return 'Awaiting First Interview';
  }
  
  // Get the last interview block
  const lastBlock = interviewBlocks[interviewBlocks.length - 1];
  
  // Normalize and parse the last block
  const normalizedBlock = lastBlock.replace(/(Interviewer Recommendation:)([^\n])/g, '$1\n$2');
  const lines = normalizedBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Find the recommendation
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('Interviewer Recommendation:')) {
      const recommendation = line.replace('Interviewer Recommendation:', '').trim() || 
                            (i + 1 < lines.length ? lines[i + 1].trim() : '');
      
      if (recommendation.toLowerCase() === 'next stage' || recommendation.toLowerCase() === 'next-stage') {
        return 'Awaiting Next Interview';
      } else if (recommendation.toLowerCase() === 'hire') {
        return 'Hire';
      } else if (recommendation.toLowerCase() === 'no hire' || recommendation.toLowerCase() === 'no-hire') {
        return 'No Hire';
      }
    }
  }
  
  // If no recommendation found, return the default status
  return defaultStatus;
}

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
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

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
    dateOfBirth: '',
    position: '',
    department: '',
    status: 'Awaiting',
    notes: '',
    gender: '',
    university: '',
    degreeLevel: '',
    major: '',
  });
  const [customDepartment, setCustomDepartment] = useState('');
  const [referrals, setReferrals] = useState<Array<{ firstName: string; lastName: string; phone: string; email: string; relationship: string }>>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeDragActive, setResumeDragActive] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

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

  const genderOptions = [
    'Male',
    'Female',
    'Non-binary',
    'Prefer not to say',
    'Other',
  ];

  const degreeLevels = [
    'High School',
    'Associate',
    'Bachelor',
    'Master',
    'Doctorate',
    'Professional',
    'Other',
  ];

  // Map roles to departments
  const roleToDepartment: Record<string, string> = {
    'Body Shop Manager': 'Service Department',
    'Body Shop Technician': 'Service Department',
    'Business Manager': 'Sales Department',
    'Business Office Support': 'Office Department',
    'C-Level Executives': 'Administration Department',
    'Platform Manager': 'Administration Department',
    'Controller': 'Finance Department',
    'Finance Manager': 'Finance Department',
    'Finance Director': 'Finance Department',
    'General Manager': 'Administration Department',
    'Human Resources Manager': 'Human Resources',
    'IT Manager': 'Technical Support',
    'Loaner Agent': 'Service Department',
    'Mobility Manager': 'Service Department',
    'Parts Counter Employee': 'Parts Department',
    'Parts Manager': 'Parts Department',
    'Parts Support': 'Parts Department',
    'Drivers': 'Service Department',
    'Sales Manager': 'Sales Department',
    'GSM': 'Sales Department',
    'Sales People': 'Sales Department',
    'Sales Support': 'Sales Department',
    'Receptionist': 'Office Department',
    'Service Advisor': 'Service Department',
    'Service Director': 'Service Department',
    'Service Drive Manager': 'Service Department',
    'Service Manager': 'Service Department',
    'Parts and Service Director': 'Service Department',
    'Service Support': 'Service Department',
    'Porters': 'Service Department',
    'Technician': 'Service Department',
    'Used Car Director': 'Sales Department',
    'Used Car Manager': 'Sales Department',
  };

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

      const name = `${formData.firstName} ${formData.lastName}`;
      const addressParts = [
        formData.street,
        formData.city,
        formData.state ? `${formData.state} ${formData.zipCode}`.trim() : formData.zipCode,
      ].filter(Boolean);
      const address = addressParts.length ? addressParts.join(', ') : null;

      const dateOfBirth = formData.dateOfBirth?.trim() || null;
      
      // Format degree: combine degree level and major
      let degree = null;
      if (formData.degreeLevel || formData.major) {
        const parts = [];
        if (formData.degreeLevel) parts.push(formData.degreeLevel);
        if (formData.major) parts.push(formData.major);
        degree = parts.join(' in ') || null;
      }
      
      // Format referrals: combine multiple referrals into a single string
      let referral = null;
      if (referrals.length > 0) {
        const referralStrings = referrals
          .filter(ref => ref.firstName.trim() || ref.lastName.trim() || ref.phone.trim() || ref.email.trim())
          .map(ref => {
            const nameParts = [];
            if (ref.firstName.trim()) nameParts.push(ref.firstName.trim());
            if (ref.lastName.trim()) nameParts.push(ref.lastName.trim());
            const name = nameParts.length > 0 ? nameParts.join(' ') : '';
            
            const infoParts = [];
            if (ref.relationship.trim()) infoParts.push(`Relationship: ${ref.relationship.trim()}`);
            if (ref.phone.trim()) infoParts.push(`Phone: ${ref.phone.trim()}`);
            if (ref.email.trim()) infoParts.push(`Email: ${ref.email.trim()}`);
            const info = infoParts.length > 0 ? ` - ${infoParts.join(', ')}` : '';
            
            return name + info;
          })
          .filter(s => s.length > 0);
        referral = referralStrings.length > 0 ? referralStrings.join('; ') : null;
      }
      
      const payload = {
        name,
        email: formData.email,
        phone: formData.phoneNumber || null,
        position: formData.position,
        status: formData.status || 'Awaiting',
        notes: formData.notes || null,
        address: address || undefined,
        date_of_birth: dateOfBirth || undefined,
        gender: formData.gender?.trim() || undefined,
        university: formData.university?.trim() || undefined,
        degree: degree || undefined,
        referral: referral || undefined,
      };

      let res: Response;
      if (resumeFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('name', name);
        formDataToSend.append('email', payload.email);
        formDataToSend.append('phone', payload.phone ?? '');
        formDataToSend.append('position', payload.position);
        formDataToSend.append('status', payload.status);
        formDataToSend.append('notes', payload.notes ?? '');
        if (address) formDataToSend.append('address', address);
        if (dateOfBirth) formDataToSend.append('date_of_birth', dateOfBirth);
        if (payload.gender) formDataToSend.append('gender', payload.gender);
        if (payload.university) formDataToSend.append('university', payload.university);
        if (payload.degree) formDataToSend.append('degree', payload.degree);
        if (payload.referral) formDataToSend.append('referral', payload.referral);
        formDataToSend.append('resume', resumeFile);
        res = await fetch(`${API_BASE}/candidates`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formDataToSend,
        });
      } else {
        res = await fetch(`${API_BASE}/candidates`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

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
      dateOfBirth: '',
      position: '',
      department: '',
      status: 'Awaiting',
      notes: '',
      gender: '',
      university: '',
      degreeLevel: '',
      major: '',
    });
    setCustomDepartment('');
    setReferrals([]);
    setResumeFile(null);
    setFormStep(1);
    setShowModal(false);
    setError(null);
  }

  const filteredCandidates = candidates.filter(candidate => {
    // Calculate the actual status from notes
    const calculatedStatus = calculateStatusFromNotes(candidate.notes, candidate.status);
    
    // Filter out hired candidates
    if (calculatedStatus === 'Hired' || calculatedStatus === 'hired') {
      return false;
    }
    
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All Statuses' || calculatedStatus === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    if (sortColumn === 'name' || sortColumn === 'email' || sortColumn === 'position') {
      aVal = String(a[sortColumn as keyof Candidate] || '').toLowerCase();
      bVal = String(b[sortColumn as keyof Candidate] || '').toLowerCase();
    } else if (sortColumn === 'status') {
      // Use calculated status for sorting
      const aStatus = calculateStatusFromNotes(a.notes, a.status);
      const bStatus = calculateStatusFromNotes(b.notes, b.status);
      aVal = aStatus.toLowerCase();
      bVal = bStatus.toLowerCase();
    } else if (sortColumn === 'score') {
      const aScore = getAverageInterviewScore(a.notes);
      const bScore = getAverageInterviewScore(b.notes);
      aVal = aScore !== null ? aScore : -1;
      bVal = bScore !== null ? bScore : -1;
    } else if (sortColumn === 'applied_at') {
      aVal = new Date(a.applied_at).getTime();
      bVal = new Date(b.applied_at).getTime();
    } else {
      aVal = String(a[sortColumn as keyof Candidate] || '');
      bVal = String(b[sortColumn as keyof Candidate] || '');
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCandidates = sortedCandidates.slice(startIndex, startIndex + itemsPerPage);

  const statusOptions = ['All Statuses', 'Awaiting First Interview', 'Awaiting Next Interview', 'Interviewing', 'Hire', 'No Hire', 'Hired', 'Denied'];

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#232E40' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
    );
  };

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
                      backgroundColor: '#4D6DBE', 
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
          <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
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
                      <tr style={{ backgroundColor: '#4D6DBE' }}>
                        <th 
                          className="cursor-pointer text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity text-white"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1.5">
                            Name
                            <SortIcon column="name" />
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                          onClick={() => handleSort('position')}
                        >
                          <div className="flex items-center gap-1.5">
                            Position
                            <SortIcon column="position" />
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1.5">
                            Status
                            <SortIcon column="status" />
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                          onClick={() => handleSort('score')}
                        >
                          <div className="flex items-center gap-1.5">
                            Score
                            <SortIcon column="score" />
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                          onClick={() => handleSort('applied_at')}
                        >
                          <div className="flex items-center gap-1.5">
                            Applied
                            <SortIcon column="applied_at" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCandidates.map((candidate) => (
                        <tr 
                          key={candidate.id} 
                          className="hover:bg-blue-50 transition-colors cursor-pointer"
                          style={{ borderBottom: '1px solid #F3F4F6' }}
                          onClick={() => router.push(`/candidates/${candidate.id}`)}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <Link 
                                href={`/candidates/${candidate.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm font-semibold hover:underline block mb-0.5"
                                style={{ color: '#232E40' }}
                              >
                                {candidate.name}
                              </Link>
                              <div className="text-xs" style={{ color: '#6B7280' }}>{candidate.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>
                            <span className="text-sm" style={{ color: '#6B7280' }}>{candidate.position}</span>
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>
                            {(() => {
                              const calculatedStatus = calculateStatusFromNotes(candidate.notes, candidate.status);
                              return (
                                <span 
                                  className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                                  style={{ 
                                    backgroundColor: calculatedStatus === 'Offered' ? '#D1FAE5' :
                                                    calculatedStatus === 'Denied' ? '#FEE2E2' :
                                                    calculatedStatus === 'Hire' ? '#D1FAE5' :
                                                    calculatedStatus === 'No Hire' ? '#FEE2E2' :
                                                    calculatedStatus === 'Awaiting Next Interview' ? '#FEF3C7' :
                                                    calculatedStatus === 'Awaiting First Interview' ? '#FEF3C7' :
                                                    calculatedStatus === 'Interviewing' ? '#DBEAFE' :
                                                    calculatedStatus === 'Awaiting' ? '#FEF3C7' :
                                                    '#F3F4F6',
                                    color: calculatedStatus === 'Offered' ? '#065F46' :
                                            calculatedStatus === 'Denied' ? '#991B1B' :
                                            calculatedStatus === 'Hire' ? '#065F46' :
                                            calculatedStatus === 'No Hire' ? '#991B1B' :
                                            calculatedStatus === 'Awaiting Next Interview' ? '#92400E' :
                                            calculatedStatus === 'Awaiting First Interview' ? '#92400E' :
                                            calculatedStatus === 'Interviewing' ? '#1E40AF' :
                                            calculatedStatus === 'Awaiting' ? '#92400E' :
                                            '#374151'
                                  }}
                                >
                                  {calculatedStatus}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>
                            {(() => {
                              const avg = getAverageInterviewScore(candidate.notes);
                              return avg !== null ? `${avg}/100` : 'N/A';
                            })()}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>
                            {new Date(candidate.applied_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <div className="text-xs" style={{ color: '#6B7280' }}>
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedCandidates.length)} of {sortedCandidates.length} entries
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="cursor-pointer px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      style={{ 
                        border: '1px solid #E5E7EB',
                        color: currentPage === 1 ? '#9CA3AF' : '#374151',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className="cursor-pointer px-2.5 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-gray-50"
                            style={{ 
                              border: '1px solid #E5E7EB',
                              color: currentPage === pageNum ? '#FFFFFF' : '#374151',
                              backgroundColor: currentPage === pageNum ? '#4D6DBE' : '#FFFFFF'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      style={{ 
                        border: '1px solid #E5E7EB',
                        color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
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
                className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
                style={{ 
                  width: '90%', 
                  maxWidth: '600px', 
                  maxHeight: '95vh',
                  border: '1px solid #E5E7EB'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b flex-shrink-0 rounded-t-xl" style={{ borderColor: '#E5E7EB', backgroundColor: '#4D6DBE' }}>
                  <h2 className="text-xl font-bold mb-0.5" style={{ color: '#FFFFFF' }}>Add a Candidate</h2>
                  <p className="text-xs" style={{ color: '#E0E7FF' }}>Enter candidate information</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 rounded-b-xl" style={{ minHeight: 0 }}>
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
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
                            onChange={(e) => {
                              const selectedRole = e.target.value;
                              const autoDepartment = roleToDepartment[selectedRole] || '';
                              setFormData({ 
                                ...formData, 
                                position: selectedRole,
                                department: autoDepartment
                              });
                              // Clear custom department if a mapped department is selected
                              if (autoDepartment && autoDepartment !== 'Others') {
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
                        <input
                          ref={resumeInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file && !/\.(pdf|doc|docx)$/i.test(file.name)) return;
                            setResumeFile(file);
                          }}
                        />
                        <div
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') resumeInputRef.current?.click(); }}
                          onClick={() => resumeInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setResumeDragActive(true); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setResumeDragActive(false); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setResumeDragActive(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file && /\.(pdf|doc|docx)$/i.test(file.name)) setResumeFile(file);
                            else if (file) toast.error('Please use PDF, DOC, or DOCX.');
                          }}
                          className="mt-1 rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 py-6 px-4 min-h-[120px]"
                          style={{
                            borderColor: resumeDragActive ? '#4D6DBE' : '#D1D5DB',
                            backgroundColor: resumeDragActive ? '#EEF2FF' : '#F9FAFB',
                          }}
                        >
                          {resumeFile ? (
                            <>
                              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#4D6DBE' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm font-medium truncate max-w-full" style={{ color: '#374151' }} title={resumeFile.name}>
                                {resumeFile.name}
                              </p>
                              <p className="text-xs" style={{ color: '#6B7280' }}>PDF, DOC, or DOCX • Click or drag to replace</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm font-medium" style={{ color: '#374151' }}>Drop resume here or click to upload</p>
                              <p className="text-xs" style={{ color: '#6B7280' }}>PDF, DOC, or DOCX</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Optional Information Section */}
                      <div className="pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                        <h3 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>Optional Information</h3>
                        
                        {/* Gender */}
                        <div className="mb-4">
                          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Gender</label>
                          <div className="relative">
                            <select
                              value={formData.gender}
                              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                              className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                              style={{ 
                                border: '1px solid #D1D5DB', 
                                color: '#374151', 
                                backgroundColor: '#FFFFFF',
                              }}
                            >
                              <option value="">Select Gender</option>
                              {genderOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Education */}
                        <div className="mb-4">
                          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Education</label>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>School/University</label>
                              <input
                                type="text"
                                value={formData.university}
                                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                placeholder="School or University name"
                                className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                                style={{ 
                                  border: '1px solid #D1D5DB', 
                                  color: '#374151', 
                                  backgroundColor: '#FFFFFF',
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Degree Level</label>
                                <div className="relative">
                                  <select
                                    value={formData.degreeLevel}
                                    onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value })}
                                    className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                                    style={{ 
                                      border: '1px solid #D1D5DB', 
                                      color: '#374151', 
                                      backgroundColor: '#FFFFFF',
                                    }}
                                  >
                                    <option value="">Select Degree Level</option>
                                    {degreeLevels.map(level => (
                                      <option key={level} value={level}>{level}</option>
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
                                <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Major</label>
                                <input
                                  type="text"
                                  value={formData.major}
                                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                  placeholder="Major or field of study"
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

                        {/* Referrals */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold" style={{ color: '#374151' }}>Referrals</label>
                            <button
                              type="button"
                              onClick={() => setReferrals([...referrals, { firstName: '', lastName: '', phone: '', email: '', relationship: '' }])}
                              className="cursor-pointer px-3 py-1 text-xs font-semibold rounded-lg transition-all hover:opacity-90"
                              style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
                            >
                              + Add Referral
                            </button>
                          </div>
                          {referrals.length === 0 ? (
                            <p className="text-xs" style={{ color: '#6B7280' }}>No referrals added yet. Click "Add Referral" to add one.</p>
                          ) : (
                            <div className="space-y-3">
                              {referrals.map((referral, index) => (
                                <div key={index} className="p-3 rounded-lg border" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Referral {index + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => setReferrals(referrals.filter((_, i) => i !== index))}
                                      className="cursor-pointer p-1 rounded hover:bg-gray-200 transition-colors"
                                      style={{ color: '#6B7280' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input
                                      type="text"
                                      value={referral.firstName}
                                      onChange={(e) => {
                                        const updated = [...referrals];
                                        updated[index].firstName = e.target.value;
                                        setReferrals(updated);
                                      }}
                                      placeholder="First Name"
                                      className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                                      style={{ 
                                        border: '1px solid #D1D5DB', 
                                        color: '#374151', 
                                        backgroundColor: '#FFFFFF',
                                      }}
                                    />
                                    <input
                                      type="text"
                                      value={referral.lastName}
                                      onChange={(e) => {
                                        const updated = [...referrals];
                                        updated[index].lastName = e.target.value;
                                        setReferrals(updated);
                                      }}
                                      placeholder="Last Name"
                                      className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                                      style={{ 
                                        border: '1px solid #D1D5DB', 
                                        color: '#374151', 
                                        backgroundColor: '#FFFFFF',
                                      }}
                                    />
                                  </div>
                                  <div className="mb-2">
                                    <input
                                      type="text"
                                      value={referral.relationship}
                                      onChange={(e) => {
                                        const updated = [...referrals];
                                        updated[index].relationship = e.target.value;
                                        setReferrals(updated);
                                      }}
                                      placeholder="Relationship (e.g., Friend, Colleague, Family)"
                                      className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                                      style={{ 
                                        border: '1px solid #D1D5DB', 
                                        color: '#374151', 
                                        backgroundColor: '#FFFFFF',
                                      }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="tel"
                                      value={referral.phone}
                                      onChange={(e) => {
                                        const updated = [...referrals];
                                        updated[index].phone = e.target.value;
                                        setReferrals(updated);
                                      }}
                                      placeholder="Phone Number"
                                      className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                                      style={{ 
                                        border: '1px solid #D1D5DB', 
                                        color: '#374151', 
                                        backgroundColor: '#FFFFFF',
                                      }}
                                    />
                                    <input
                                      type="email"
                                      value={referral.email}
                                      onChange={(e) => {
                                        const updated = [...referrals];
                                        updated[index].email = e.target.value;
                                        setReferrals(updated);
                                      }}
                                      placeholder="Email"
                                      className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                                      style={{ 
                                        border: '1px solid #D1D5DB', 
                                        color: '#374151', 
                                        backgroundColor: '#FFFFFF',
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
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

