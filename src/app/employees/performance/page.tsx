'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken, getCurrentUser } from '@/lib/auth';
import { deleteJsonAuth, getJsonAuth, postJsonAuth, putJsonAuth } from '@/lib/http';
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

type ReviewLogItem = {
  id: number;
  review_date: string;
  overall_rating: number;
  job_knowledge: number;
  work_quality: number;
  service_performance: number;
  teamwork: number;
  attendance: number;
  strengths?: string[];
  improvements?: string[];
  notes?: string | null;
  created_at?: string | null;
};

export default function PerformanceReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<(Employee & { lastReview?: string; reviewStatus: 'overdue' | 'due' | 'completed'; avg_performance_score?: number | null })[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [currentPage, setCurrentPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<(Employee & { lastReview?: string; reviewStatus: 'overdue' | 'due' | 'completed'; avg_performance_score?: number | null }) | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<(Employee & { lastReview?: string }) | null>(null);
  const [reviewLogs, setReviewLogs] = useState<ReviewLogItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewLogItem | null>(null);
  const [editRatings, setEditRatings] = useState({ jobKnowledge: 0, workQuality: 0, servicePerformance: 0, teamwork: 0, attendance: 0 });
  const [editStrengths, setEditStrengths] = useState<string[]>([]);
  const [editImprovements, setEditImprovements] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editReviewDate, setEditReviewDate] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editStrengthInput, setEditStrengthInput] = useState('');
  const [editImprovementInput, setEditImprovementInput] = useState('');

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
  
  const itemsPerPage = 10;

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
        setError('Not logged in');
        setEmployees([]);
        setLoading(false);
        return;
      }

      const data = await getJsonAuth<{ ok?: boolean; items?: any[]; employees?: any[] }>('/employees');
      const list = data?.items ?? data?.employees ?? [];
      const employeesWithReviews = Array.isArray(list)
        ? list.map((emp: any) => {
            const lastDate = emp.last_review_date;
            return {
              ...emp,
              name: emp.name ?? ([emp.first_name, emp.last_name].filter(Boolean).join(' ') || 'Unknown'),
              department: emp.department ?? '—',
              lastReview: lastDate ? new Date(lastDate).toLocaleDateString() : 'Never',
              reviewStatus: (emp.reviewStatus || 'due') as 'overdue' | 'due' | 'completed',
              avg_performance_score: emp.avg_performance_score ?? null,
            };
          })
        : [];
      setEmployees(employeesWithReviews);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load employees';
      setError(message.includes('403') ? 'You don’t have permission to view employees.' : 'Failed to load employees. Try again.');
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
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const departments = ['All Departments', ...Array.from(new Set(employees.map(emp => emp.department)))];

  const overdueCount = employees.filter(emp => emp.reviewStatus === 'overdue').length;
  const upcomingCount = employees.filter(emp => emp.reviewStatus === 'due').length;
  const scoresWithValue = employees.filter(emp => typeof emp.avg_performance_score === 'number');
  const averageScore = scoresWithValue.length > 0
    ? scoresWithValue.reduce((sum, emp) => sum + (emp.avg_performance_score ?? 0), 0) / scoresWithValue.length
    : 0;

  function openReviewModal(employee?: (Employee & { lastReview?: string; reviewStatus: 'overdue' | 'due' | 'completed'; avg_performance_score?: number | null })) {
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

  async function openHistoryModal(emp: Employee & { lastReview?: string }) {
    setHistoryEmployee(emp);
    setShowHistoryModal(true);
    setReviewLogs([]);
    setLoadingHistory(true);
    try {
      const data = await getJsonAuth<{ ok?: boolean; items?: ReviewLogItem[] }>(`/employees/${emp.id}/performance-reviews`);
      setReviewLogs(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setReviewLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  function closeHistoryModal() {
    setShowHistoryModal(false);
    setHistoryEmployee(null);
    setReviewLogs([]);
    setEditingReview(null);
  }

  function openEditModal(log: ReviewLogItem) {
    setEditingReview(log);
    setEditRatings({
      jobKnowledge: log.job_knowledge ?? 0,
      workQuality: log.work_quality ?? 0,
      servicePerformance: log.service_performance ?? 0,
      teamwork: log.teamwork ?? 0,
      attendance: log.attendance ?? 0,
    });
    setEditStrengths(Array.isArray(log.strengths) ? [...log.strengths] : (log.strengths ? [String(log.strengths)] : []));
    setEditImprovements(Array.isArray(log.improvements) ? [...log.improvements] : (log.improvements ? [String(log.improvements)] : []));
    setEditNotes(log.notes ?? '');
    setEditReviewDate(log.review_date ? new Date(log.review_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  }

  function closeEditModal() {
    setEditingReview(null);
  }

  async function handleSaveEdit() {
    if (!editingReview || !historyEmployee) return;
    setSubmittingEdit(true);
    try {
      await postJsonAuth(
        `/employees/${historyEmployee.id}/performance-reviews/${editingReview.id}`,
        {
          review_date: editReviewDate,
          job_knowledge: editRatings.jobKnowledge || 0,
          work_quality: editRatings.workQuality || 0,
          service_performance: editRatings.servicePerformance || 0,
          teamwork: editRatings.teamwork || 0,
          attendance: editRatings.attendance || 0,
          strengths: editStrengths.length ? editStrengths : undefined,
          improvements: editImprovements.length ? editImprovements : undefined,
          notes: editNotes.trim() || undefined,
        },
        { method: 'PUT' }
      );
      toast.success('Review updated.');
      closeEditModal();
      const data = await getJsonAuth<{ ok?: boolean; items?: ReviewLogItem[] }>(`/employees/${historyEmployee.id}/performance-reviews`);
      setReviewLogs(Array.isArray(data?.items) ? data.items : []);
      await loadEmployees();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update review';
      toast.error(message);
    } finally {
      setSubmittingEdit(false);
    }
  }

  async function handleDeleteReview(log: ReviewLogItem) {
    if (!historyEmployee) return;
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(log.id);
    try {
      await deleteJsonAuth(`/employees/${historyEmployee.id}/performance-reviews/${log.id}`);
      toast.success('Review deleted.');
      setReviewLogs(prev => prev.filter(r => r.id !== log.id));
      await loadEmployees();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete review';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
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

  async function handleSubmitReview() {
    if (!selectedEmployee) return;
    setSubmittingReview(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Not logged in');
        return;
      }

      // Get current user info
      const userData = await getCurrentUser();
      const currentUserFullName = (userData?.user?.full_name && userData.user.full_name.trim()) ||
        (userData?.user?.first_name && userData?.user?.last_name ? `${userData.user.first_name} ${userData.user.last_name}`.trim() : null) ||
        (userData?.user?.first_name || userData?.user?.last_name) ||
        (userData?.full_name && userData.full_name.trim()) ||
        (userData?.first_name && userData?.last_name ? `${userData.first_name} ${userData.last_name}`.trim() : null) ||
        (userData?.first_name || userData?.last_name) ||
        (userData?.user?.email && userData.user.email.includes('@') ? userData.user.email.split('@')[0].replace(/[._]/g, ' ') : null) ||
        (userData?.email && userData.email.includes('@') ? userData.email.split('@')[0].replace(/[._]/g, ' ') : null) ||
        'Unknown Reviewer';

      // Get current employee to access notes
      const employeeData = await getJsonAuth<{ ok?: boolean; employee?: { notes?: string } }>(
        `/employees/${selectedEmployee.id}`
      );
      const existingNotes = employeeData?.employee?.notes ?? '';

      // Count existing performance reviews
      let reviewNumber = 1;
      if (existingNotes && existingNotes.trim()) {
        const reviewMatches = [...existingNotes.matchAll(/Performance Review Stage:/g)];
        reviewNumber = reviewMatches.length + 1;
      }

      // Calculate average score (0-10 scale)
      const categoryScores = [
        ratings.jobKnowledge || 0,
        ratings.workQuality || 0,
        ratings.servicePerformance || 0,
        ratings.teamwork || 0,
        ratings.attendance || 0,
      ].filter(score => score > 0);
      const averageScore = categoryScores.length > 0
        ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
        : 0;
      const scoreOutOf100 = Math.round(averageScore * 10);

      // Format category scores
      const categoryNotes = [
        { name: 'Job Knowledge & Skills', score: ratings.jobKnowledge || 0 },
        { name: 'Work Quality', score: ratings.workQuality || 0 },
        { name: 'Service Performance', score: ratings.servicePerformance || 0 },
        { name: 'Teamwork & Collaboration', score: ratings.teamwork || 0 },
        { name: 'Attendance & Punctuality', score: ratings.attendance || 0 },
      ]
        .filter(cat => cat.score > 0)
        .map(cat => `${cat.name}: ${cat.score}/10`)
        .join('\n');

      // Format strengths and improvements
      const allStrengths = strengths.length ? strengths : (strengthInput.trim() ? [strengthInput.trim()] : []);
      const allImprovements = improvements.length ? improvements : (improvementInput.trim() ? [improvementInput.trim()] : []);

      // Create structured performance review notes
      const newReviewNotes = `Performance Review Stage: ${reviewNumber}
Reviewer: ${currentUserFullName}
Role: ${selectedEmployee.position || 'N/A'}

Scores:
${categoryNotes}

Total Weighted Score: ${averageScore.toFixed(2)}/10 (${scoreOutOf100}/100)${allStrengths.length > 0 ? `

Strengths:
${allStrengths.map(s => `- ${s}`).join('\n')}` : ''}${allImprovements.length > 0 ? `

Areas for Improvement:
${allImprovements.map(i => `- ${i}`).join('\n')}` : ''}${managerNotes.trim() ? `

Additional Notes:
${managerNotes.trim()}` : ''}`;

      // Append new review notes to existing notes
      let updatedNotes: string;
      if (existingNotes && existingNotes.trim()) {
        const trimmedExisting = existingNotes.trim();
        updatedNotes = `${trimmedExisting}\n\n--- PERFORMANCE REVIEW ---\n\n${newReviewNotes}`;
      } else {
        updatedNotes = newReviewNotes;
      }

      // Update employee with notes
      await putJsonAuth<{ ok?: boolean; employee?: { notes?: string }; error?: string }>(
        `/employees/${selectedEmployee.id}`,
        { notes: updatedNotes }
      );

      toast.success('Performance review saved.');
      closeReviewModal();
      await loadEmployees();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save review';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
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

          {error && (
            <div className="mb-6 rounded-lg p-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          )}

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
            {/* Search and Filter Controls */}
            <div className="flex items-center gap-3 mb-4">
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

            {/* Employee Table */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#4D6DBE' }}>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-white">Name</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-white">Department</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-white">Role</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-white">Last Review</th>
                      <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-white">Actions</th>
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
                            <div className="flex gap-2 justify-end items-center">
                              <button
                                type="button"
                                onClick={() => openHistoryModal(emp)}
                                className="cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90 border"
                                style={{ borderColor: '#4D6DBE', color: '#4D6DBE', backgroundColor: 'transparent' }}
                              >
                                History
                              </button>
                              <button
                                onClick={() => openReviewModal(emp)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90 cursor-pointer text-white"
                                style={{ backgroundColor: '#4D6DBE' }}
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} entries
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
              className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
              style={{ 
                width: '90%', 
                maxWidth: '700px', 
                maxHeight: '90vh',
                border: '1px solid #E5E7EB'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 px-6 py-4 rounded-t-xl" style={{ backgroundColor: '#4D6DBE' }}>
                <h2 className="text-xl font-bold text-white">Employee Performance</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
                
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
                    className="cursor-pointer px-6 py-2 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
                    style={{ color: '#4D6DBE' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="cursor-pointer px-6 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#4D6DBE' }}
                  >
                    {submittingReview ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review History Modal */}
        {showHistoryModal && historyEmployee && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => e.target === e.currentTarget && closeHistoryModal()}
          >
            <div
              className="rounded-xl shadow-xl max-h-[85vh] flex flex-col w-full max-w-2xl overflow-hidden"
              style={{ backgroundColor: '#FFFFFF' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#4D6DBE' }}>
                <h2 className="text-xl font-semibold text-white">
                  Review history – {historyEmployee.name}
                </h2>
                <button
                  type="button"
                  onClick={closeHistoryModal}
                  className="cursor-pointer p-2 rounded-lg hover:bg-blue-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {loadingHistory ? (
                  <p className="text-sm text-center py-8" style={{ color: '#6B7280' }}>Loading review history...</p>
                ) : reviewLogs.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: '#6B7280' }}>No reviews recorded yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {reviewLogs.map((log) => (
                      <li
                        key={log.id}
                        className="rounded-lg p-4 border"
                        style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <span className="text-sm font-medium" style={{ color: '#232E40' }}>
                            {log.review_date ? new Date(log.review_date).toLocaleDateString() : '—'}
                          </span>
                          <span className="text-sm font-semibold" style={{ color: '#4D6DBE' }}>
                            Score: {typeof log.overall_rating === 'number' ? log.overall_rating.toFixed(1) : '—'}/5
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2" style={{ color: '#6B7280' }}>
                          <span>Job knowledge: {log.job_knowledge ?? '—'}</span>
                          <span>Work quality: {log.work_quality ?? '—'}</span>
                          <span>Service: {log.service_performance ?? '—'}</span>
                          <span>Teamwork: {log.teamwork ?? '—'}</span>
                          <span>Attendance: {log.attendance ?? '—'}</span>
                        </div>
                        {(log.strengths && log.strengths.length > 0) && (
                          <p className="text-xs mt-2"><span className="font-medium" style={{ color: '#232E40' }}>Strengths:</span> {(log.strengths as string[]).join(', ')}</p>
                        )}
                        {(log.improvements && (log.improvements as string[]).length > 0) && (
                          <p className="text-xs mt-1"><span className="font-medium" style={{ color: '#232E40' }}>Improvements:</span> {(log.improvements as string[]).join(', ')}</p>
                        )}
                        {log.notes && (
                          <p className="text-xs mt-1"><span className="font-medium" style={{ color: '#232E40' }}>Notes:</span> {log.notes}</p>
                        )}
                        <div className="flex gap-2 mt-3 justify-end">
                          <button
                            type="button"
                            onClick={() => openEditModal(log)}
                            className="cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90 border"
                            style={{ borderColor: '#4D6DBE', color: '#4D6DBE', backgroundColor: 'transparent' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(log)}
                            disabled={deletingId === log.id}
                            className="cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
                          >
                            {deletingId === log.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="p-4 border-t flex justify-end" style={{ borderColor: '#E5E7EB' }}>
                <button
                  type="button"
                  onClick={closeHistoryModal}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-90"
                  style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Review Modal */}
        {editingReview && historyEmployee && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => e.target === e.currentTarget && closeEditModal()}
          >
            <div
              className="rounded-xl shadow-xl max-h-[90vh] flex flex-col w-full max-w-2xl overflow-hidden"
              style={{ backgroundColor: '#FFFFFF' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#4D6DBE' }}>
                <h2 className="text-xl font-semibold text-white">
                  Edit review – {historyEmployee.name}
                </h2>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="cursor-pointer p-2 rounded-lg hover:bg-blue-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Review date</label>
                  <input
                    type="date"
                    value={editReviewDate}
                    onChange={(e) => setEditReviewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border"
                    style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                  />
                </div>
                <div className="rounded-lg p-4 mb-4" style={{ border: '1px dashed #D1D5DB' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#232E40' }}>Rating Categories</h3>
                  {[
                    { key: 'jobKnowledge', label: 'Job Knowledge & Skills' },
                    { key: 'workQuality', label: 'Work Quality' },
                    { key: 'servicePerformance', label: 'Service Performance' },
                    { key: 'teamwork', label: 'Teamwork & Collaboration' },
                    { key: 'attendance', label: 'Attendance & Punctuality' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between mb-3">
                      <span className="text-sm" style={{ color: '#374151' }}>{label}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setEditRatings({ ...editRatings, [key]: num })}
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                              style={{
                                borderColor: editRatings[key as keyof typeof editRatings] === num ? '#4D6DBE' : '#D1D5DB',
                                backgroundColor: editRatings[key as keyof typeof editRatings] === num ? '#4D6DBE' : 'transparent',
                              }}
                            >
                              {editRatings[key as keyof typeof editRatings] === num && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{num}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Strengths</label>
                    <input
                      type="text"
                      value={editStrengthInput}
                      onChange={(e) => setEditStrengthInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const v = editStrengthInput.trim();
                          if (v) { setEditStrengths([...editStrengths, v]); setEditStrengthInput(''); }
                        }
                      }}
                      placeholder="Add then press Enter"
                      className="w-full px-3 py-2 text-sm rounded-lg border"
                      style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {editStrengths.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#E5E7EB' }}>
                          {s}
                          <button type="button" onClick={() => setEditStrengths(editStrengths.filter((_, j) => j !== i))} className="cursor-pointer hover:opacity-70">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Improvements</label>
                    <input
                      type="text"
                      value={editImprovementInput}
                      onChange={(e) => setEditImprovementInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const v = editImprovementInput.trim();
                          if (v) { setEditImprovements([...editImprovements, v]); setEditImprovementInput(''); }
                        }
                      }}
                      placeholder="Add then press Enter"
                      className="w-full px-3 py-2 text-sm rounded-lg border"
                      style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {editImprovements.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#E5E7EB' }}>
                          {s}
                          <button type="button" onClick={() => setEditImprovements(editImprovements.filter((_, j) => j !== i))} className="cursor-pointer hover:opacity-70">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border resize-none"
                    style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: '#E5E7EB' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg border hover:bg-gray-50"
                  style={{ borderColor: '#4D6DBE', color: '#4D6DBE' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={submittingEdit}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg text-white hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#4D6DBE' }}
                >
                  {submittingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
