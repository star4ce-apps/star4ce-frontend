'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';

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

// Mock data - in real app, this would come from API
const mockCandidates: Record<number, CandidateProfile> = {
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

export default function CandidateProfilePage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id ? parseInt(params.id as string) : NaN;
  const [activeTab, setActiveTab] = useState('performance-overview');
  const [notes, setNotes] = useState('');
  const [hiringDecision, setHiringDecision] = useState<'continue' | 'stop' | null>(null);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);

  useEffect(() => {
    if (isNaN(candidateId) || !candidateId) {
      setCandidate(null);
      return;
    }
    const candidateData = mockCandidates[candidateId];
    if (candidateData) {
      setCandidate(candidateData);
      setNotes(candidateData.notes);
      const allIds = Object.keys(mockCandidates).map(Number).sort((a, b) => a - b);
      setCurrentCandidateIndex(allIds.indexOf(candidateId));
    } else {
      setCandidate(null);
    }
  }, [candidateId]);

  const allCandidateIds = Object.keys(mockCandidates).map(Number);
  const totalCandidates = allCandidateIds.length;

  const navigateCandidate = (direction: 'prev' | 'next') => {
    const currentIndex = allCandidateIds.indexOf(candidateId);
    if (direction === 'prev' && currentIndex > 0) {
      router.push(`/candidates/${allCandidateIds[currentIndex - 1]}`);
    } else if (direction === 'next' && currentIndex < allCandidateIds.length - 1) {
      router.push(`/candidates/${allCandidateIds[currentIndex + 1]}`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.1) return '#10B981'; // Excellent - green
    if (score >= 7.0) return '#3B82F6'; // Good - blue
    if (score >= 6.1) return '#F59E0B'; // Average - orange
    return '#EF4444'; // Poor - red
  };

  if (!candidate) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="text-center py-12">
              <p style={{ color: '#6B7280' }}>Candidate not found</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header with Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateCandidate('prev')}
                    disabled={currentCandidateIndex === 0}
                    className="cursor-pointer p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                    style={{ border: '1px solid #E5E7EB' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigateCandidate('next')}
                    disabled={currentCandidateIndex >= totalCandidates - 1}
                    className="cursor-pointer p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                    style={{ border: '1px solid #E5E7EB' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <span className="text-sm" style={{ color: '#6B7280' }}>
                  {currentCandidateIndex + 1} out of {totalCandidates}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <select
                    value={candidate.stage}
                    onChange={(e) => {
                      // TODO: Update stage via API
                      setCandidate({ ...candidate, stage: e.target.value });
                    }}
                    className="text-sm font-semibold appearance-none cursor-pointer focus:outline-none"
                    style={{ color: '#232E40' }}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Review">Review</option>
                    <option value="Offer">Offer</option>
                    <option value="Reject">Reject</option>
                    <option value="Ready">Ready</option>
                  </select>
                </div>
                <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Overall Score:</span>
                    <span className="text-sm font-bold">⭐ {candidate.overallScore.toFixed(2)} / 10.00</span>
                  </div>
                </div>
                <button
                  className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </div>
                </button>
              </div>
            </div>

            {/* Candidate Info Header */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
              >
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1" style={{ color: '#232E40' }}>{candidate.name}</h1>
                <div className="flex items-center gap-4 text-sm" style={{ color: '#6B7280' }}>
                  <span>ID: #{candidate.id.toString().padStart(8, '0')}</span>
                  <span>Origin: {candidate.origin}</span>
                  <span>Applied on: {candidate.appliedDate}</span>
                  <span>Job Position: {candidate.jobPosition}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
            {['Performance Overview', 'Job Application', 'Resume', 'Assessment', 'Hiring Process'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                className="cursor-pointer px-4 py-3 text-sm font-semibold transition-all relative"
                style={{
                  color: activeTab === tab.toLowerCase().replace(' ', '-') ? '#4D6DBE' : '#6B7280',
                }}
              >
                {tab}
                {activeTab === tab.toLowerCase().replace(' ', '-') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#4D6DBE' }}></div>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-4">
              {activeTab === 'performance-overview' && (
                <>
                  {/* Interview History Cards */}
                  {candidate.interviewHistory.map((interview) => (
                    <div
                      key={interview.id}
                      className="rounded-xl p-5 relative"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                    >
                      <button
                        className="cursor-pointer absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-all"
                        style={{ color: '#6B7280' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold mb-1" style={{ color: '#232E40' }}>{interview.date}</div>
                            <div className="text-xs" style={{ color: '#6B7280' }}>{interview.date.split(' ')[1]}</div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold mb-1" style={{ color: '#232E40' }}>{interview.title}</h3>
                            <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                              {interview.time} with {interview.interviewer}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span style={{ color: '#6B7280' }}>Category: <span className="font-semibold" style={{ color: '#232E40' }}>{interview.category}</span></span>
                              <span style={{ color: '#6B7280' }}>Hiring Manager: <span className="font-semibold" style={{ color: '#232E40' }}>{interview.hiringManager}</span></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm mb-1" style={{ color: '#6B7280' }}>Candidate Score</div>
                            <div className="text-2xl font-bold" style={{ color: getScoreColor(interview.score) }}>
                              {interview.score.toFixed(1)}
                            </div>
                          </div>
                          <button
                            className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                            style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add New Score Card */}
                  <button
                    className="cursor-pointer w-full rounded-xl p-5 border-2 border-dashed transition-all hover:border-solid hover:bg-gray-50"
                    style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-semibold">+ Add New Score Card</span>
                    </div>
                  </button>

                  {/* Hiring Decision */}
                  <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={hiringDecision !== null}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setHiringDecision(null);
                          }
                        }}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#4D6DBE' }}
                      />
                      <label className="text-sm font-bold" style={{ color: '#232E40' }}>Hiring Decision</label>
                    </div>
                    <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                      Would you like to advance this candidate to the next step in the hiring process?
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setHiringDecision('continue')}
                        className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                          hiringDecision === 'continue' ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                        }`}
                        style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Continue Process
                      </button>
                      <button
                        onClick={() => setHiringDecision('stop')}
                        className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                          hiringDecision === 'stop' ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                        }`}
                        style={{ backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #E5E7EB' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Stop Process
                      </button>
                    </div>
                    {hiringDecision === 'continue' && (
                      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Candidate approved to continue hiring process
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab !== 'performance-overview' && (
                <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <p style={{ color: '#6B7280' }}>Content for {activeTab} tab coming soon</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Personal Information */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.birthday}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.address}</span>
                  </div>
                </div>
              </div>

              {/* Education Information */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Education Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.university || 'Not Provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v9M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.degree || 'Not Provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span style={{ color: '#374151' }}>Referral: {candidate.referral || 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write note..."
                  className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={{
                    border: '1px solid #D1D5DB',
                    color: '#374151',
                    backgroundColor: '#FFFFFF',
                    minHeight: '100px',
                  }}
                />
                <div className="flex items-center gap-2 mt-3">
                  <button className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-all" style={{ color: '#6B7280' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-all" style={{ color: '#6B7280' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </button>
                  <button className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-all" style={{ color: '#6B7280' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

