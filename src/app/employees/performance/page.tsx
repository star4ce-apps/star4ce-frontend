'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth } from '@/lib/http';

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

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  position: string | null;
  employee_id?: string;
  hired_date?: string;
  status?: string;
  dealership_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PerformanceReview = {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  review_date: string;
  next_review_date: string;
  overall_rating: number;
  job_knowledge: number;
  work_quality: number;
  service_performance: number;
  teamwork: number;
  attendance: number;
  strengths: string[];
  improvements: string[];
  notes: string;
  status: 'overdue' | 'due' | 'completed';
  reviewer_name?: string;
};

export default function PerformanceReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<(Employee & { lastReview?: string; reviewStatus: 'overdue' | 'due' | 'completed' })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [currentPage, setCurrentPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<(Employee & { lastReview?: string; reviewStatus: 'overdue' | 'due' | 'completed' }) | null>(null);
  
  // Review form state
  const [ratings, setRatings] = useState({
    jobKnowledge: 0,
    workQuality: 0,
    servicePerformance: 0,
    teamwork: 0,
    attendance: 0,
  });
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [strengthInput, setStrengthInput] = useState('');
  const [improvementInput, setImprovementInput] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  
  const itemsPerPage = 9;

  useEffect(() => {
    loadEmployees();
  }, []);

  // Auto-open review modal if employeeId is in URL
  useEffect(() => {
    const employeeIdParam = searchParams.get('employeeId');
    if (employeeIdParam && employees.length > 0 && !showReviewModal) {
      const employeeId = parseInt(employeeIdParam);
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        setSelectedEmployee(employee);
        setRatings({ jobKnowledge: 0, workQuality: 0, servicePerformance: 0, teamwork: 0, attendance: 0 });
        setStrengths([]);
        setImprovements([]);
        setStrengthInput('');
        setImprovementInput('');
        setManagerNotes('');
        setShowReviewModal(true);
        // Remove the query parameter from URL
        router.replace('/employees/performance');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, employees]);

  async function loadEmployees() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      const data = await getJsonAuth<{ ok: boolean; items: any[] }>('/employees');
      if (data.items && data.items.length > 0) {
        const employeesWithReviews = data.items.map((emp: Employee) => ({
          ...emp,
          lastReview: 'Never',
          reviewStatus: 'due' as const,
        }));
        setEmployees(employeesWithReviews);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const departments = ['All Departments', ...Array.from(new Set(employees.map(emp => emp.department)))];

  const overdueCount = employees.filter(emp => emp.reviewStatus === 'overdue').length;
  const upcomingCount = employees.filter(emp => emp.reviewStatus === 'due').length;
  const averageScore = 0; // TODO: Calculate from actual review data when available

  function openReviewModal(employee?: (Employee & { lastReview?: string; reviewStatus: 'overdue' | 'due' | 'completed' })) {
    setSelectedEmployee(employee || null);
    setRatings({ jobKnowledge: 0, workQuality: 0, servicePerformance: 0, teamwork: 0, attendance: 0 });
    setStrengths([]);
    setImprovements([]);
    setStrengthInput('');
    setImprovementInput('');
    setManagerNotes('');
    setShowReviewModal(true);
  }

  function closeReviewModal() {
    setShowReviewModal(false);
    setSelectedEmployee(null);
  }

  function handleAddStrength(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && strengthInput.trim()) {
      e.preventDefault();
      if (!strengths.includes(strengthInput.trim())) {
        setStrengths([...strengths, strengthInput.trim()]);
      }
      setStrengthInput('');
    }
  }

  function handleAddImprovement(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && improvementInput.trim()) {
      e.preventDefault();
      if (!improvements.includes(improvementInput.trim())) {
        setImprovements([...improvements, improvementInput.trim()]);
      }
      setImprovementInput('');
    }
  }

  function removeStrength(strength: string) {
    setStrengths(strengths.filter(s => s !== strength));
  }

  function removeImprovement(improvement: string) {
    setImprovements(improvements.filter(i => i !== improvement));
  }

  function handleSubmitReview() {
    // TODO: Submit review to API
    console.log('Submitting review:', {
      employee: selectedEmployee,
      ratings,
      strengths,
      improvements,
      managerNotes,
    });
    closeReviewModal();
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
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Performance Reviews</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Track employee evaluations, review reminders, and monitor progress.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>{overdueCount}</div>
              <div className="text-sm" style={{ color: COLORS.gray[500] }}>Employees needing review</div>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>{upcomingCount}</div>
              <div className="text-sm" style={{ color: COLORS.gray[500] }}>Upcoming (30 Days)</div>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>{averageScore.toFixed(1)}</div>
              <div className="text-sm" style={{ color: COLORS.gray[500] }}>Avg Performance Score</div>
            </div>
          </div>

          {/* Main Content */}
          <div>
            {/* Employee Table */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: '#232E40' }}>Employees</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="text-sm rounded-lg px-3 py-2 pl-3 w-40 transition-all focus:outline-none focus:ring-2"
                      style={{ border: '1px solid #E5E7EB', color: '#374151', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                  <div className="relative inline-block">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="text-sm py-2 pr-8 pl-3 appearance-none cursor-pointer transition-all rounded-lg"
                      style={{ border: '1px solid #E5E7EB', color: '#374151', backgroundColor: '#FFFFFF' }}
                    >
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
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#6B7280' }}>Name</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#6B7280' }}>Department</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#6B7280' }}>Role</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#6B7280' }}>Last Review</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold" style={{ color: '#6B7280' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm" style={{ color: '#6B7280' }}>
                          Loading employees...
                        </td>
                      </tr>
                    ) : paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm" style={{ color: '#6B7280' }}>
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((emp) => (
                        <tr 
                          key={emp.id} 
                          className="hover:bg-gray-50 transition-colors"
                          style={{ borderBottom: '1px solid #F3F4F6' }}
                        >
                          <td className="py-3 px-2">
                            <button
                              onClick={() => router.push(`/employees/${emp.id}`)}
                              className="text-sm font-medium hover:underline cursor-pointer text-left"
                              style={{ color: '#232E40' }}
                            >
                              {emp.name}
                            </button>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-sm" style={{ color: '#6B7280' }}>{emp.department}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-sm" style={{ color: '#6B7280' }}>{emp.position || '—'}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-sm" style={{ color: '#6B7280' }}>{emp.lastReview}</span>
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => openReviewModal(emp)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90 cursor-pointer text-white"
                              style={{ backgroundColor: '#4D6DBE' }}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                    style={{ border: '1px solid #E5E7EB', color: '#374151', backgroundColor: '#FFFFFF' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:bg-gray-100"
                      style={{ 
                        border: '1px solid #E5E7EB',
                        color: currentPage === page ? '#FFFFFF' : '#374151',
                        backgroundColor: currentPage === page ? '#4D6DBE' : '#FFFFFF'
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                    style={{ border: '1px solid #E5E7EB', color: '#374151', backgroundColor: '#FFFFFF' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Review Modal */}
        {showReviewModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeReviewModal();
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl"
              style={{ 
                width: '90%', 
                maxWidth: '700px', 
                maxHeight: '90vh', 
                overflowY: 'auto',
                border: '1px solid #E5E7EB'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#232E40' }}>Employee Performance</h2>
                
                {/* Employee Selector */}
                <div className="mb-6">
                  <div className="relative inline-block">
                    <select
                      value={selectedEmployee?.id || ''}
                      onChange={(e) => {
                        const emp = employees.find(emp => emp.id === parseInt(e.target.value));
                        setSelectedEmployee(emp || null);
                      }}
                      className="w-64 pl-3 pr-8 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                      style={{ border: '1px solid #D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="">Select Employee...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Employee Overview */}
                {selectedEmployee && (
                  <div className="rounded-lg p-4 mb-6" style={{ border: '1px dashed #D1D5DB' }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: '#232E40' }}>Employee Overview</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-base font-semibold" style={{ color: '#232E40' }}>{selectedEmployee.name}</div>
                        <div className="text-sm" style={{ color: '#6B7280' }}>{selectedEmployee.position || 'No position'}</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#9CA3AF' }}>Date Hired</div>
                        <div className="text-sm" style={{ color: '#232E40' }}>
                          {selectedEmployee.hired_date 
                            ? new Date(selectedEmployee.hired_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                            : 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#9CA3AF' }}>Last Review Date</div>
                        <div className="text-sm" style={{ color: '#232E40' }}>{selectedEmployee.lastReview || 'Never'}</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#9CA3AF' }}>Department</div>
                        <div className="text-sm" style={{ color: '#232E40' }}>{selectedEmployee.department}</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#9CA3AF' }}>Last Review Date</div>
                        <div className="text-sm" style={{ color: '#232E40' }}>
                          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: '#9CA3AF' }}>Hiring Manager</div>
                        <div className="text-sm" style={{ color: '#232E40' }}>Jane Smith</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rating Categories */}
                <div className="rounded-lg p-4 mb-6" style={{ border: '1px dashed #D1D5DB' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: '#232E40' }}>Rating Categories</h3>
                  
                  {[
                    { key: 'jobKnowledge', label: 'Job Knowledge & Skills' },
                    { key: 'workQuality', label: 'Work Quality' },
                    { key: 'servicePerformance', label: 'Service Performance' },
                    { key: 'teamwork', label: 'Teamwork & Collaboration' },
                    { key: 'attendance', label: 'Attendance & Punctuality' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between mb-3">
                      <span className="text-sm" style={{ color: '#374151' }}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>Weak</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRatings({ ...ratings, [key]: num })}
                              className="flex flex-col items-center"
                            >
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                                style={{
                                  borderColor: ratings[key as keyof typeof ratings] === num ? '#4D6DBE' : '#D1D5DB',
                                  backgroundColor: ratings[key as keyof typeof ratings] === num ? '#4D6DBE' : 'transparent',
                                }}
                              >
                                {ratings[key as keyof typeof ratings] === num && (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                              </div>
                              <span className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{num}</span>
                            </button>
                          ))}
                        </div>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>Strong</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Employee Skillset */}
                <div className="rounded-lg p-4 mb-6" style={{ border: '1px dashed #D1D5DB' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: '#232E40' }}>Employee Skillset</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Strengths</label>
                      <input
                        type="text"
                        value={strengthInput}
                        onChange={(e) => setStrengthInput(e.target.value)}
                        onKeyDown={handleAddStrength}
                        placeholder="Type here..."
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 mb-2"
                        style={{ border: '1px solid #D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                      />
                      <div className="space-y-1">
                        {strengths.map((strength, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeStrength(strength)}
                              className="text-xs hover:opacity-70"
                              style={{ color: '#6B7280' }}
                            >
                              ×
                            </button>
                            <span className="text-sm" style={{ color: '#374151' }}>{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Areas for Improvement */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Areas for Improvement</label>
                      <input
                        type="text"
                        value={improvementInput}
                        onChange={(e) => setImprovementInput(e.target.value)}
                        onKeyDown={handleAddImprovement}
                        placeholder="Type here..."
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 mb-2"
                        style={{ border: '1px solid #D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                      />
                      <div className="space-y-1">
                        {improvements.map((improvement, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeImprovement(improvement)}
                              className="text-xs hover:opacity-70"
                              style={{ color: '#6B7280' }}
                            >
                              ×
                            </button>
                            <span className="text-sm" style={{ color: '#374151' }}>{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager Feedback & Notes */}
                <div className="rounded-lg p-4 mb-6" style={{ border: '1px dashed #D1D5DB' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#232E40' }}>Manager Feedback & Notes</h3>
                  <textarea
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="Type here..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 resize-none"
                    style={{ border: '1px solid #D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    className="px-6 py-2 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
                    style={{ color: '#4D6DBE' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    className="px-6 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: '#4D6DBE' }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
