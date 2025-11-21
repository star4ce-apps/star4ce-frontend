'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import toast from 'react-hot-toast';

type Candidate = {
  id: number;
  name: string;
  email: string;
  avgScore: number | null;
  job: string;
  createdDate: string;
  interviewer: string;
  stage: string;
};

type InterviewHistory = {
  id: string;
  date: string;
  title: string;
  time: string;
  interviewer: string;
  category: string;
  score: number;
  hiringManager: string;
};

type CandidateProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  birthday: string;
  address: string;
  overallScore: number;
  stage: string;
  origin: string;
  appliedDate: string;
  jobPosition: string;
  university?: string;
  degree?: string;
  referral?: string;
  interviewHistory: InterviewHistory[];
  notes: string;
};

// TODO: Replace with real candidate data from API endpoint
// NOTE: There is currently no candidates API endpoint in the backend
// This mock data should be removed once the API is implemented
const mockCandidateProfiles: Record<number, CandidateProfile> = {
  1: {
    id: 1,
    name: 'Priscilla Lopez',
    email: 'Pris.lez@gmail.com',
    phone: '+1-555-0001',
    gender: 'Female',
    birthday: 'January 15, 1990',
    address: 'New York, NY, 10001, United States',
    overallScore: 7.2,
    stage: 'Interviewing',
    origin: 'Career Site',
    appliedDate: '08 Sep 2025',
    jobPosition: 'Technician',
    university: 'State University',
    degree: 'Bachelor of Science',
    referral: 'Not Provided',
    interviewHistory: [
      {
        id: '1',
        date: '01 Oct',
        title: 'First Interview',
        time: '11:00AM - 12:00PM',
        interviewer: 'Mike Long',
        category: 'Service Technicians',
        score: 7.3,
        hiringManager: 'Mike Long',
      },
    ],
    notes: '',
  },
  2: {
    id: 2,
    name: 'Ryan Clark',
    email: 'Ryry.cl@gmail.com',
    phone: '+1-555-0002',
    gender: 'Male',
    birthday: 'March 20, 1988',
    address: 'Los Angeles, CA, 90001, United States',
    overallScore: 5.3,
    stage: 'Review',
    origin: 'Career Site',
    appliedDate: '01 Jul 2025',
    jobPosition: 'Sales Manager',
    university: 'Business School',
    degree: 'MBA',
    referral: 'Not Provided',
    interviewHistory: [],
    notes: '',
  },
  3: {
    id: 3,
    name: 'Jaehun Lee',
    email: 'Jaehun.L@gmail.com',
    phone: '+1-555-0003',
    gender: 'Male',
    birthday: 'June 10, 1992',
    address: 'Chicago, IL, 60601, United States',
    overallScore: 5.3,
    stage: 'Interviewing',
    origin: 'Career Site',
    appliedDate: '19 Jun 2025',
    jobPosition: 'Office Staff',
    interviewHistory: [],
    notes: '',
  },
  4: {
    id: 4,
    name: 'Klein Morreti',
    email: 'kmtti@gmail.com',
    phone: '+1-555-0004',
    gender: 'Male',
    birthday: 'April 5, 1985',
    address: 'Houston, TX, 77001, United States',
    overallScore: 9.7,
    stage: 'Offer',
    origin: 'Career Site',
    appliedDate: '15 Jun 2025',
    jobPosition: 'Parts Manager',
    interviewHistory: [],
    notes: '',
  },
  5: {
    id: 5,
    name: 'John Johnson',
    email: 'JJsonsn@gmail.com',
    phone: '+1-555-0005',
    gender: 'Male',
    birthday: 'September 12, 1993',
    address: 'Phoenix, AZ, 85001, United States',
    overallScore: 2.2,
    stage: 'Reject',
    origin: 'Career Site',
    appliedDate: '12 Jun 2025',
    jobPosition: 'IT',
    interviewHistory: [],
    notes: '',
  },
  6: {
    id: 6,
    name: 'Quinn Smith',
    email: 'Quinni.smith@gmail.com',
    phone: '+1-555-0006',
    gender: 'Female',
    birthday: 'November 8, 1991',
    address: 'Philadelphia, PA, 19101, United States',
    overallScore: 8.8,
    stage: 'Ready',
    origin: 'Career Site',
    appliedDate: '12 Jun 2025',
    jobPosition: 'Receptionist',
    interviewHistory: [],
    notes: '',
  },
  7: {
    id: 7,
    name: 'Jose Porras',
    email: 'hosayPP@gmail.com',
    phone: '+1-555-0007',
    gender: 'Male',
    birthday: 'December 25, 1989',
    address: 'San Antonio, TX, 78201, United States',
    overallScore: 0,
    stage: 'Applied',
    origin: 'Career Site',
    appliedDate: '31 May 2025',
    jobPosition: 'Technician',
    interviewHistory: [],
    notes: '',
  },
};

export default function CandidateListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('All Job Titles');
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const itemsPerPage = 20;

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    email: '',
    jobTitle: '',
    applicationDate: '',
    department: '',
    stage: '',
  });

  // TODO: Replace with real candidate data from API endpoint
  // NOTE: Backend API endpoint for candidates does not exist yet
  // This is mock data - remove once API is implemented
  const [candidates] = useState<Candidate[]>([]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.job.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesJobTitle = selectedJobTitle === 'All Job Titles' || candidate.job === selectedJobTitle;
    const matchesStage = selectedStage === 'All Stages' || candidate.stage === selectedStage;

    return matchesSearch && matchesJobTitle && matchesStage;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let aVal: number | string = a[sortColumn as keyof Candidate] as number | string;
    let bVal: number | string = b[sortColumn as keyof Candidate] as number | string;

    if (sortColumn === 'name' || sortColumn === 'email' || sortColumn === 'job' || sortColumn === 'interviewer' || sortColumn === 'stage') {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCandidates = sortedCandidates.slice(startIndex, endIndex);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FFFFFF' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
    );
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Interviewing':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'Review':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'Offer':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'Reject':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'Ready':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'Applied':
        return { bg: '#FED7AA', text: '#9A3412' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const jobTitles = Array.from(new Set(candidates.map(c => c.job))) as string[];
  const stages = Array.from(new Set(candidates.map(c => c.stage))) as string[];

  const states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
  const departments = ['Sales', 'Service', 'Parts', 'Finance', 'Administration', 'IT', 'HR', 'Marketing'];

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      dateOfBirth: '',
      gender: '',
      phoneNumber: '',
      email: '',
      jobTitle: '',
      applicationDate: '',
      department: '',
      stage: '',
    });
    setResumeFile(null);
    setError(null);
    setShowModal(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode', 'dateOfBirth', 'gender', 'phoneNumber', 'email', 'jobTitle', 'applicationDate', 'department', 'stage'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      setError('All fields must be filled');
      return;
    }

    if (!resumeFile) {
      setError('Please upload a resume PDF');
      return;
    }
    
    // Validate file type
    if (resumeFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setLoading(true);
    try {
      // Here you would typically upload the file and create the candidate
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add the new candidate to the list (in a real app, this would come from the API)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB');
        return;
      }
      setResumeFile(file);
      setError(null);
    }
  };

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Candidate List</h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  This is the data of all candidates who applied
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                style={{ 
                  backgroundColor: '#4D6DBE',
                  color: '#FFFFFF'
                }}
              >
                + Add Candidate
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1" style={{ maxWidth: '400px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates..."
                className="w-full text-sm rounded-full px-4 py-2.5 pl-10 transition-all focus:outline-none focus:ring-2" 
                style={{ 
                  border: '1px solid #E5E7EB', 
                  color: '#374151', 
                  backgroundColor: '#FFFFFF',
                  focusRingColor: '#4D6DBE'
                }}
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#9CA3AF' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="relative">
              <select
                value={selectedJobTitle}
                onChange={(e) => setSelectedJobTitle(e.target.value)}
                className="text-sm py-2.5 appearance-none cursor-pointer transition-all rounded-lg"
                style={{ 
                  border: '1px solid #E5E7EB', 
                  color: '#374151', 
                  backgroundColor: '#FFFFFF', 
                  paddingLeft: '1rem', 
                  paddingRight: '2.5rem',
                  minWidth: '160px'
                }}
              >
                <option>All Job Titles</option>
                {jobTitles.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="text-sm py-2.5 appearance-none cursor-pointer transition-all rounded-lg"
                style={{ 
                  border: '1px solid #E5E7EB', 
                  color: '#374151', 
                  backgroundColor: '#FFFFFF', 
                  paddingLeft: '1rem', 
                  paddingRight: '2.5rem',
                  minWidth: '140px'
                }}
              >
                <option>All Stages</option>
                {stages.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl p-6 transition-all duration-200" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#4D6DBE' }}>
                    <th 
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1.5">
                        Name
                        <SortIcon column="name" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('avgScore')}
                    >
                      <div className="flex items-center gap-1.5">
                        Avg. Score
                        <SortIcon column="avgScore" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('job')}
                    >
                      <div className="flex items-center gap-1.5">
                        Job
                        <SortIcon column="job" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('createdDate')}
                    >
                      <div className="flex items-center gap-1.5">
                        Created Date
                        <SortIcon column="createdDate" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('interviewer')}
                    >
                      <div className="flex items-center gap-1.5">
                        Interviewer
                        <SortIcon column="interviewer" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('stage')}
                    >
                      <div className="flex items-center gap-1.5">
                        Stage
                        <SortIcon column="stage" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>
                        No candidates found.
                      </td>
                    </tr>
                  ) : (
                    paginatedCandidates.map((candidate) => {
                      const stageColors = getStageColor(candidate.stage);
                      return (
                        <tr 
                          key={candidate.id} 
                          className="hover:bg-blue-50 transition-colors cursor-pointer"
                          style={{ 
                            borderBottom: '1px solid #F3F4F6'
                          }}
                          onClick={() => {
                            const profile = mockCandidateProfiles[candidate.id];
                            if (profile) {
                              setSelectedCandidate(profile);
                              setShowProfileModal(true);
                            }
                          }}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm font-semibold mb-0.5" style={{ color: '#232E40' }}>{candidate.name}</div>
                              <div className="text-xs" style={{ color: '#6B7280' }}>{candidate.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold" style={{ color: '#232E40' }}>
                            {candidate.avgScore !== null ? candidate.avgScore.toFixed(1) : 'NA'}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>{candidate.job}</td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>{candidate.createdDate}</td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>{candidate.interviewer}</td>
                          <td className="py-3 px-4">
                            <span 
                              className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                              style={{ 
                                backgroundColor: stageColors.bg,
                                color: stageColors.text
                              }}
                            >
                              {candidate.stage}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Showing {startIndex + 1} to {Math.min(endIndex, sortedCandidates.length)} of {sortedCandidates.length} entries
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
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
                    let pageNum;
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
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-gray-50"
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
                  className="px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
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
          </div>

          {/* Modal */}
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
                  maxWidth: '950px', 
                  maxHeight: '95vh', 
                  overflowY: 'auto',
                  border: '1px solid #E5E7EB'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#4D6DBE' }}>
                  <h2 className="text-xl font-bold mb-0.5" style={{ color: '#FFFFFF' }}>Add a Candidate</h2>
                  <p className="text-xs" style={{ color: '#E0E7FF' }}>All fields must be filled *</p>
                </div>
                <form onSubmit={handleSubmit} className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>First Name *</label>
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
                          focusRingColor: '#4D6DBE'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Last Name *</label>
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
                          focusRingColor: '#4D6DBE'
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Home Address *</label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Street"
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                            focusRingColor: '#4D6DBE'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                            focusRingColor: '#4D6DBE'
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
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
                              focusRingColor: '#4D6DBE'
                            }}
                          >
                            <option value="">Select State</option>
                            {states.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder="Zip Code"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                            focusRingColor: '#4D6DBE'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Date of Birth *</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                          focusRingColor: '#4D6DBE'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Gender *</label>
                      <div className="relative">
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                            focusRingColor: '#4D6DBE'
                          }}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="(000) 000-0000"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                          focusRingColor: '#4D6DBE'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Email *</label>
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
                          focusRingColor: '#4D6DBE'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Job Title *</label>
                      <input
                        type="text"
                        placeholder="e.g., Sales Consultant"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                          focusRingColor: '#4D6DBE'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Application Date *</label>
                      <input
                        type="date"
                        value={formData.applicationDate}
                        onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                          focusRingColor: '#4D6DBE'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Department *</label>
                      <div className="relative">
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                            focusRingColor: '#4D6DBE'
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
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Stage *</label>
                      <div className="relative">
                        <select
                          value={formData.stage}
                          onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                            focusRingColor: '#4D6DBE'
                          }}
                        >
                          <option value="">Select Stage</option>
                          {stages.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Resume PDF *</label>
                      <div className="relative">
                        <label htmlFor="resume-upload" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="resume-upload"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="flex-1 px-3 py-2 text-sm rounded-lg transition-all flex items-center justify-between"
                            style={{ 
                              border: '1px solid #D1D5DB', 
                              color: resumeFile ? '#374151' : '#9CA3AF', 
                              backgroundColor: '#FFFFFF'
                            }}
                          >
                            <span>{resumeFile ? resumeFile.name : 'Choose file...'}</span>
                            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                              Browse
                            </span>
                          </div>
                        </label>
                        {resumeFile && (
                          <div className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#6B7280' }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {error && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-5 py-2 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
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
                      className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#4D6DBE' }}
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Candidate Profile Modal */}
          {showProfileModal && selectedCandidate && (
            <CandidateProfileModal
              candidate={selectedCandidate}
              onClose={() => {
                setShowProfileModal(false);
                setSelectedCandidate(null);
              }}
              onUpdateStage={(newStage) => {
                setSelectedCandidate({ ...selectedCandidate, stage: newStage });
              }}
            />
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

// Candidate Profile Modal Component
function CandidateProfileModal({
  candidate,
  onClose,
  onUpdateStage,
}: {
  candidate: CandidateProfile;
  onClose: () => void;
  onUpdateStage: (stage: string) => void;
}) {
  const [notes, setNotes] = useState(candidate.notes);

  const getScoreColor = (score: number) => {
    if (score >= 8.1) return '#10B981'; // Excellent - green
    if (score >= 7.0) return '#3B82F6'; // Good - blue
    if (score >= 6.1) return '#F59E0B'; // Average - orange
    return '#EF4444'; // Poor - red
  };

  const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl my-8"
        style={{
          maxHeight: '95vh',
          overflowY: 'auto',
          border: 'none',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-10 px-8 py-6" style={{ borderColor: '#F3F4F6' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ 
                  backgroundColor: '#4D6DBE', 
                  color: '#FFFFFF'
                }}
              >
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1.5" style={{ color: '#232E40', letterSpacing: '-0.01em' }}>{candidate.name}</h2>
                <div className="flex items-center gap-5 text-sm" style={{ color: '#6B7280' }}>
                  <span>ID: #{candidate.id.toString().padStart(8, '0')}</span>
                  <span>Origin: {candidate.origin}</span>
                  <span>Applied: {candidate.appliedDate}</span>
                  <span>Position: {candidate.jobPosition}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Overall Score:</span>
                  <span className="text-sm font-bold flex items-center gap-1" style={{ color: '#FFFFFF' }}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#FFFFFF' }}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {candidate.overallScore.toFixed(2)} / 10.00
                  </span>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </div>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                style={{ color: '#6B7280' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: '#232E40' }}>Interview History</h3>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Review past interviews and scores</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium" style={{ color: '#6B7280' }}>Current Stage:</label>
                  <div className="relative">
                    <select
                      value={candidate.stage}
                      onChange={(e) => onUpdateStage(e.target.value)}
                      className="text-sm font-semibold appearance-none cursor-pointer focus:outline-none bg-transparent pr-6 px-3 py-1.5 rounded-lg"
                      style={{ color: '#232E40', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Review">Review</option>
                      <option value="Offer">Offer</option>
                      <option value="Reject">Reject</option>
                      <option value="Ready">Ready</option>
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {/* Interview History Cards */}
              {candidate.interviewHistory.length > 0 ? (
                candidate.interviewHistory.map((interview) => (
                  <div
                    key={interview.id}
                    className="rounded-xl p-5 transition-all hover:shadow-md border-l-4"
                    style={{ 
                      backgroundColor: '#FFFFFF', 
                      borderLeftColor: getScoreColor(interview.score),
                      borderTop: '1px solid #F3F4F6',
                      borderRight: '1px solid #F3F4F6',
                      borderBottom: '1px solid #F3F4F6',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-center min-w-[60px]">
                          <div className="text-sm font-bold mb-0.5" style={{ color: '#232E40' }}>{interview.date.split(' ')[0]}</div>
                          <div className="text-xs" style={{ color: '#6B7280' }}>{interview.date.split(' ')[1]}</div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold mb-1.5" style={{ color: '#232E40' }}>{interview.title}</h3>
                          <div className="space-y-1.5 text-xs" style={{ color: '#6B7280' }}>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {interview.time} with {interview.interviewer}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5">
                                <span style={{ color: '#9CA3AF' }}>Category:</span>
                                <span className="font-medium" style={{ color: '#374151' }}>{interview.category}</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span style={{ color: '#9CA3AF' }}>Manager:</span>
                                <span className="font-medium" style={{ color: '#374151' }}>{interview.hiringManager}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className="text-2xl font-bold mb-0.5" style={{ color: getScoreColor(interview.score) }}>
                          {interview.score.toFixed(1)}
                        </div>
                        <div className="text-xs" style={{ color: '#9CA3AF' }}>/ 10</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl p-10 text-center" style={{ backgroundColor: '#F9FAFB', border: '1px dashed #E5E7EB' }}>
                  <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#D1D5DB' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>No interview history available</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Personal Information */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <h3 className="text-xs font-bold mb-4 uppercase tracking-wider" style={{ color: '#6B7280' }}>Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-xs">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Email</div>
                      <span className="text-xs font-medium" style={{ color: '#232E40' }}>{candidate.email}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Phone</div>
                      <span className="text-xs font-medium" style={{ color: '#232E40' }}>{candidate.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Gender</div>
                      <span className="text-xs font-medium" style={{ color: '#232E40' }}>{candidate.gender}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Birthday</div>
                      <span className="text-xs font-medium" style={{ color: '#232E40' }}>{candidate.birthday}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Address</div>
                      <span className="text-xs font-medium" style={{ color: '#232E40' }}>{candidate.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Education Information */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <h3 className="text-xs font-bold mb-4 uppercase tracking-wider" style={{ color: '#6B7280' }}>Education</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-xs">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>University</div>
                      <span className="text-xs font-medium" style={{ color: '#232E40' }}>{candidate.university || 'Not Provided'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v9M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Degree</div>
                      <span className="text-xs font-medium" style={{ color: '#232E40' }}>{candidate.degree || 'Not Provided'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Referral</div>
                      <span className="text-xs font-medium" style={{ color: '#232E40' }}>{candidate.referral || 'Not Provided'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#6B7280' }}>Comments</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add comments..."
                  className="w-full px-3 py-2.5 text-xs rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={{
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                    backgroundColor: '#FFFFFF',
                    minHeight: '100px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
