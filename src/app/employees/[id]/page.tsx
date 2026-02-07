'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth } from '@/lib/http';
import toast from 'react-hot-toast';

type PerformanceReview = {
  id: number;
  date: string;
  reviewer: string;
  overallScore: number;
  jobKnowledge: number;
  workQuality: number;
  servicePerformance: number;
  teamwork: number;
  attendance: number;
  strengths: string[];
  improvements: string[];
  notes: string;
};

type RoleChange = {
  id: number;
  date: string;
  action: string;
  previousValue: string;
  newValue: string;
  changedBy: string;
};

type EmployeeProfile = {
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
  performanceReviews: PerformanceReview[];
  roleChanges: RoleChange[];
};

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id ? parseInt(params.id as string) : NaN;
  const [activeTab, setActiveTab] = useState('performance-reviews');
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);

  useEffect(() => {
    if (isNaN(employeeId) || !employeeId) {
      setEmployee(null);
      setLoading(false);
      return;
    }
    loadEmployee();
  }, [employeeId]);

  async function loadEmployee() {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Not logged in');
        setEmployee(null);
        setLoading(false);
        return;
      }

      let emp: any = null;
      
      try {
        const empData = await getJsonAuth<{ ok: boolean; employee: any }>(`/employees/${employeeId}`);
        if (empData.ok && empData.employee) {
          emp = empData.employee;
        }
      } catch (apiErr) {
        console.error('API call failed:', apiErr);
        toast.error('Employee not found');
        setEmployee(null);
        setLoading(false);
        return;
      }

      if (!emp) {
        toast.error('Employee not found');
        setEmployee(null);
        setLoading(false);
        return;
      }

      // Load all employees for navigation
      let allEmps: any[] = [];
      try {
        const allEmployeesData = await getJsonAuth<{ ok: boolean; items: any[] }>('/employees');
        if (allEmployeesData.ok && allEmployeesData.items) {
          allEmps = allEmployeesData.items.map((e: any) => ({
            id: e.id,
            name: e.name,
            email: e.email,
            phone: e.phone || null,
            department: e.department,
            position: e.position || null,
            employee_id: e.employee_id,
            hired_date: e.hired_date,
            status: e.status,
            dealership_id: e.dealership_id,
            is_active: e.is_active,
            performanceReviews: [],
            roleChanges: [],
          }));
        }
      } catch (err) {
        console.error('Failed to load all employees:', err);
      }
      setAllEmployees(allEmps);
        
      // Load performance reviews
      let reviews: PerformanceReview[] = [];
      try {
        const reviewsData = await getJsonAuth<{ ok: boolean; reviews: any[] }>(`/employees/${employeeId}/performance-reviews`);
        if (reviewsData.ok && reviewsData.reviews) {
          reviews = reviewsData.reviews.map((r: any) => ({
            id: r.id,
            date: r.review_date || r.date,
            reviewer: r.reviewer_name || r.reviewer || 'Unknown',
            overallScore: r.overall_rating || 0,
            jobKnowledge: r.job_knowledge || 0,
            workQuality: r.work_quality || 0,
            servicePerformance: r.service_performance || 0,
            teamwork: r.teamwork || 0,
            attendance: r.attendance || 0,
            strengths: r.strengths || [],
            improvements: r.improvements || [],
            notes: r.notes || '',
          }));
        }
      } catch (err) {
        console.error('Failed to load performance reviews:', err);
        reviews = [];
      }

      // Load role changes
      let roleChanges: RoleChange[] = [];
      try {
        const historyData = await getJsonAuth<{ ok: boolean; items: any[] }>(`/role-history?employee_id=${employeeId}`);
        if (historyData.ok && historyData.items) {
          roleChanges = historyData.items.map((h: any) => ({
            id: h.id,
            date: h.timestamp || h.date,
            action: h.action,
            previousValue: h.previous_value || h.previousValue,
            newValue: h.new_value || h.newValue,
            changedBy: h.changed_by || h.changedBy || 'Unknown',
          }));
        }
      } catch (err) {
        console.error('Failed to load role changes:', err);
        roleChanges = [];
      }

      const employeeData: EmployeeProfile = {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone || null,
        department: emp.department,
        position: emp.position || null,
        employee_id: emp.employee_id,
        hired_date: emp.hired_date,
        status: emp.status,
        dealership_id: emp.dealership_id,
        is_active: emp.is_active,
        performanceReviews: reviews,
        roleChanges: roleChanges,
      };
      setEmployee(employeeData);
      const sortedIds = allEmps.map(e => e.id).sort((a, b) => a - b);
      setCurrentEmployeeIndex(sortedIds.indexOf(employeeId));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load employee';
      toast.error(errorMsg);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }

  const allEmployeeIds = allEmployees.map(e => e.id).sort((a, b) => a - b);
  const totalEmployees = allEmployeeIds.length;

  const navigateEmployee = (direction: 'prev' | 'next') => {
    const currentIndex = allEmployeeIds.indexOf(employeeId);
    if (direction === 'prev' && currentIndex > 0) {
      router.push(`/employees/${allEmployeeIds[currentIndex - 1]}`);
    } else if (direction === 'next' && currentIndex < allEmployeeIds.length - 1) {
      router.push(`/employees/${allEmployeeIds[currentIndex + 1]}`);
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="text-center py-12">
              <p style={{ color: '#6B7280' }}>Loading employee...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  if (!employee) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="text-center py-12">
              <p style={{ color: '#6B7280' }}>Employee not found</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  const initials = employee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Combine and sort events (performance reviews and role changes)
  const allEvents = [
    ...employee.performanceReviews.map(review => ({
      type: 'review' as const,
      date: review.date,
      title: `Performance Review`,
      description: `Performance review conducted by ${review.reviewer}`,
      reviewer: review.reviewer,
      score: review.overallScore,
      review: review,
    })),
    ...employee.roleChanges.map(change => ({
      type: 'role-change' as const,
      date: change.date,
      title: `Role Change: ${change.action}`,
      description: `Changed from ${change.previousValue} to ${change.newValue}`,
      changedBy: change.changedBy,
      change: change,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header with Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/employees')}
                  className="cursor-pointer p-2 rounded-lg transition-all hover:bg-gray-100"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="Back to Employees"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateEmployee('prev')}
                  disabled={currentEmployeeIndex === 0}
                  className="cursor-pointer p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="Previous Employee"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm px-2" style={{ color: '#6B7280' }}>
                  {currentEmployeeIndex + 1} / {totalEmployees}
                </span>
                <button
                  onClick={() => navigateEmployee('next')}
                  disabled={currentEmployeeIndex >= totalEmployees - 1}
                  className="cursor-pointer p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="Next Employee"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Employee Info Header */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
              >
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-1">
                  <h1 className="text-3xl font-bold" style={{ color: '#232E40' }}>{employee.name}</h1>
                  <div className="px-3 py-1 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                    Status: {employee.status || 'Active'}
                  </div>
                  {employee.performanceReviews.length > 0 && (
                    <div className="px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1" style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}>
                      <span>Average Score:</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#FFFFFF' }}>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>
                        {(employee.performanceReviews.reduce((sum, r) => sum + r.overallScore, 0) / employee.performanceReviews.length).toFixed(1)} / 10
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm" style={{ color: '#6B7280' }}>
                  <span>ID: {employee.employee_id || `#${employee.id.toString().padStart(8, '0')}`}</span>
                  <span>Department: {employee.department}</span>
                  <span>Role: {employee.position || 'N/A'}</span>
                  {employee.hired_date && <span>Hired: {new Date(employee.hired_date).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
            {['Performance Reviews', 'Role History'].map((tab) => (
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
              {activeTab === 'performance-reviews' && (
                <>
                  {/* Add New Performance Review */}
                  <button
                    onClick={() => {
                      router.push(`/employees/performance?employeeId=${employeeId}`);
                    }}
                    className="cursor-pointer w-full rounded-xl p-5 border-2 border-dashed transition-all hover:border-solid hover:bg-gray-50"
                    style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-semibold">Add New Performance Review</span>
                    </div>
                  </button>
                  
                  {/* Performance Reviews Timeline */}
                  <div className="space-y-4">
                    {employee.performanceReviews.length === 0 ? (
                      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                        <p className="text-sm" style={{ color: '#6B7280' }}>No performance reviews yet.</p>
                      </div>
                    ) : (
                      employee.performanceReviews.map((review, index) => (
                        <div
                          key={review.id || index}
                          className="rounded-xl p-6 relative"
                          style={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: '#3B82F6' }}
                              >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-bold mb-1" style={{ color: '#232E40' }}>Performance Review</h3>
                              <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                                Conducted by {review.reviewer} on {new Date(review.date).toLocaleDateString()}
                              </p>
                              
                              {/* Overall Score */}
                              <div className="pt-4 pb-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold" style={{ color: '#232E40' }}>Overall Score:</span>
                                  <div className="px-3 py-1 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#3B82F6', color: '#FFFFFF' }}>
                                    {review.overallScore}/10
                                  </div>
                                </div>
                              </div>

                              {/* Category Scores */}
                              <div className="pt-4 pb-4">
                                <h4 className="text-sm font-semibold mb-3" style={{ color: '#232E40' }}>Category Scores:</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="text-sm py-2 px-3 rounded-md" style={{ backgroundColor: '#F9FAFB' }}>
                                    <span style={{ color: '#6B7280' }}>Job Knowledge:</span>
                                    <span className="ml-2 font-semibold" style={{ color: '#232E40' }}>{review.jobKnowledge}/10</span>
                                  </div>
                                  <div className="text-sm py-2 px-3 rounded-md" style={{ backgroundColor: '#F9FAFB' }}>
                                    <span style={{ color: '#6B7280' }}>Work Quality:</span>
                                    <span className="ml-2 font-semibold" style={{ color: '#232E40' }}>{review.workQuality}/10</span>
                                  </div>
                                  <div className="text-sm py-2 px-3 rounded-md" style={{ backgroundColor: '#F9FAFB' }}>
                                    <span style={{ color: '#6B7280' }}>Service Performance:</span>
                                    <span className="ml-2 font-semibold" style={{ color: '#232E40' }}>{review.servicePerformance}/10</span>
                                  </div>
                                  <div className="text-sm py-2 px-3 rounded-md" style={{ backgroundColor: '#F9FAFB' }}>
                                    <span style={{ color: '#6B7280' }}>Teamwork:</span>
                                    <span className="ml-2 font-semibold" style={{ color: '#232E40' }}>{review.teamwork}/10</span>
                                  </div>
                                  <div className="text-sm py-2 px-3 rounded-md" style={{ backgroundColor: '#F9FAFB' }}>
                                    <span style={{ color: '#6B7280' }}>Attendance:</span>
                                    <span className="ml-2 font-semibold" style={{ color: '#232E40' }}>{review.attendance}/10</span>
                                  </div>
                                </div>
                              </div>

                              {/* Strengths */}
                              {review.strengths && review.strengths.length > 0 && (
                                <div className="pt-4 pb-4">
                                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#232E40' }}>Strengths:</h4>
                                  <ul className="list-disc list-inside space-y-2">
                                    {review.strengths.map((strength, idx) => (
                                      <li key={idx} className="text-sm py-1.5 px-3 rounded-md" style={{ color: '#065F46', backgroundColor: '#D1FAE5' }}>{strength}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Areas for Improvement */}
                              {review.improvements && review.improvements.length > 0 && (
                                <div className="pt-4 pb-4">
                                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#232E40' }}>Areas for Improvement:</h4>
                                  <ul className="list-disc list-inside space-y-2">
                                    {review.improvements.map((improvement, idx) => (
                                      <li key={idx} className="text-sm py-1.5 px-3 rounded-md" style={{ color: '#991B1B', backgroundColor: '#FEE2E2' }}>{improvement}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Notes */}
                              {review.notes && (
                                <div className="pt-4 pb-2">
                                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#232E40' }}>Notes:</h4>
                                  <p className="text-sm py-2.5 px-3 rounded-md" style={{ color: '#6B7280', backgroundColor: '#F9FAFB' }}>{review.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {activeTab === 'role-history' && (
                <>
                  {/* Role Changes Timeline */}
                  <div className="space-y-4">
                    {employee.roleChanges.length === 0 ? (
                      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                        <p className="text-sm" style={{ color: '#6B7280' }}>No role changes recorded.</p>
                      </div>
                    ) : (
                      employee.roleChanges.map((change, index) => (
                        <div
                          key={change.id || index}
                          className="rounded-xl p-5 relative"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: '#10B981' }}
                              >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-bold mb-1" style={{ color: '#232E40' }}>{change.action}</h3>
                              <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                                Changed from <span className="font-semibold">{change.previousValue}</span> to <span className="font-semibold">{change.newValue}</span>
                              </p>
                              <p className="text-sm" style={{ color: '#6B7280' }}>
                                Changed by {change.changedBy} on {new Date(change.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Employee Details */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#232E40' }}>Employee Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Email</span>
                    <p className="text-sm" style={{ color: '#232E40' }}>{employee.email}</p>
                  </div>
                  {employee.phone && (
                    <div>
                      <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Phone</span>
                      <p className="text-sm" style={{ color: '#232E40' }}>{employee.phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Department</span>
                    <p className="text-sm" style={{ color: '#232E40' }}>{employee.department}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Position</span>
                    <p className="text-sm" style={{ color: '#232E40' }}>{employee.position || 'N/A'}</p>
                  </div>
                  {employee.hired_date && (
                    <div>
                      <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Hired Date</span>
                      <p className="text-sm" style={{ color: '#232E40' }}>
                        {new Date(employee.hired_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Status</span>
                    <p className="text-sm" style={{ color: '#232E40' }}>{employee.status || 'Active'}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#232E40' }}>Statistics</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Total Reviews</span>
                    <p className="text-2xl font-bold" style={{ color: '#232E40' }}>{employee.performanceReviews.length}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Role Changes</span>
                    <p className="text-2xl font-bold" style={{ color: '#232E40' }}>{employee.roleChanges.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

