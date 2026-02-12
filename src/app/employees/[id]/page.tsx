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
  notes?: string;
  performanceReviews: PerformanceReview[];
  roleChanges: RoleChange[];
  gender?: string;
  date_of_birth?: string;
  address?: string;
  university?: string;
  degree?: string;
  referral?: string;
};

// Parse performance reviews from notes field (similar to interview parsing)
function parsePerformanceReviewsFromNotes(notes: string): PerformanceReview[] {
  const reviews: PerformanceReview[] = [];
  
  if (!notes || !notes.trim()) {
    return reviews;
  }
  
  // Split notes into review blocks
  const reviewBlocks: string[] = [];
  
  // First, try splitting by the separator
  if (notes.includes('--- PERFORMANCE REVIEW ---')) {
    const parts = notes.split(/--- PERFORMANCE REVIEW ---/);
    parts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed && trimmed.includes('Performance Review Stage:')) {
        reviewBlocks.push(trimmed);
      }
    });
  }
  
  // If no separator found, fall back to splitting on "Performance Review Stage:"
  if (reviewBlocks.length === 0) {
    const stageMatches = [...notes.matchAll(/Performance Review Stage:/g)];
    
    if (stageMatches.length === 0) {
      return reviews;
    }
    
    if (stageMatches.length === 1) {
      reviewBlocks.push(notes);
    } else {
      for (let i = 0; i < stageMatches.length; i++) {
        const startIndex = stageMatches[i].index || 0;
        const endIndex = i < stageMatches.length - 1 
          ? (stageMatches[i + 1].index || notes.length)
          : notes.length;
        
        const block = notes.substring(startIndex, endIndex).trim();
        if (block && block.includes('Performance Review Stage:')) {
          reviewBlocks.push(block);
        }
      }
    }
  }
  
  // Parse each review block
  reviewBlocks.forEach((block, blockIndex) => {
    // Normalize the block
    let normalizedBlock = block
      .replace(/(Performance Review Stage:)([^\n])/g, '$1\n$2')
      .replace(/(Reviewer:)([^\n])/g, '$1\n$2')
      .replace(/(Role:)([^\n])/g, '$1\n$2')
      .replace(/(Scores:)([^\n])/g, '$1\n$2')
      .replace(/(Total Weighted Score:)([^\n])/g, '$1\n$2')
      .replace(/(Strengths:)([^\n])/g, '$1\n$2')
      .replace(/(Areas for Improvement:)([^\n])/g, '$1\n$2')
      .replace(/(Additional Notes:)([^\n])/g, '$1\n$2');
    
    const lines = normalizedBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let stage = '';
    let reviewer = '';
    let role = '';
    let totalScore = '';
    let additionalNotes = '';
    let inScoresSection = false;
    let inStrengthsSection = false;
    let inImprovementsSection = false;
    let inNotesSection = false;
    
    const categoryScores: { category: string; score: number }[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    // Parse each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Header fields
      if (line.startsWith('Performance Review Stage:')) {
        stage = line.replace('Performance Review Stage:', '').trim();
      } else if (line.startsWith('Reviewer:')) {
        const afterLabel = line.replace('Reviewer:', '').trim();
        if (afterLabel) {
          reviewer = afterLabel;
        } else if (i + 1 < lines.length) {
          reviewer = lines[i + 1].trim();
          i++;
        }
      } else if (line.startsWith('Role:')) {
        role = line.replace('Role:', '').trim();
      } else if (line.startsWith('Total Weighted Score:')) {
        totalScore = line.replace('Total Weighted Score:', '').trim();
      } else if (line === 'Scores:') {
        inScoresSection = true;
        inStrengthsSection = false;
        inImprovementsSection = false;
        inNotesSection = false;
      } else if (line === 'Strengths:') {
        inStrengthsSection = true;
        inScoresSection = false;
        inImprovementsSection = false;
        inNotesSection = false;
      } else if (line === 'Areas for Improvement:') {
        inImprovementsSection = true;
        inScoresSection = false;
        inStrengthsSection = false;
        inNotesSection = false;
      } else if (line.startsWith('Additional Notes:')) {
        inNotesSection = true;
        inScoresSection = false;
        inStrengthsSection = false;
        inImprovementsSection = false;
        additionalNotes = line.replace('Additional Notes:', '').trim();
      } else if (inScoresSection) {
        // Parse category scores: "Category Name: score/10"
        if (line.includes(':') && line.includes('/10')) {
          const match = line.match(/^(.+?):\s*(\d+(?:\.\d+)?)\/10/);
          if (match) {
            categoryScores.push({
              category: match[1].trim(),
              score: parseFloat(match[2]),
            });
          }
        }
      } else if (inStrengthsSection) {
        // Parse strengths: "- Strength text"
        if (line.startsWith('-')) {
          strengths.push(line.replace('-', '').trim());
        }
      } else if (inImprovementsSection) {
        // Parse improvements: "- Improvement text"
        if (line.startsWith('-')) {
          improvements.push(line.replace('-', '').trim());
        }
      } else if (inNotesSection) {
        // Collect additional notes
        if (additionalNotes) {
          additionalNotes += '\n' + line;
        } else {
          additionalNotes = line;
        }
      }
    }
    
    // Extract overall score from totalScore (e.g. "7.50/10 (75/100)")
    let overallScore = 0;
    if (totalScore) {
      const scoreMatch = totalScore.match(/\((\d+)\/100\)/);
      if (scoreMatch) {
        overallScore = parseInt(scoreMatch[1], 10) / 10; // Convert to 0-10 scale
      } else {
        const fallbackMatch = totalScore.match(/(\d+(?:\.\d+)?)\/10/);
        if (fallbackMatch) {
          overallScore = parseFloat(fallbackMatch[1]);
        }
      }
    }
    // If no total score, calculate average from category scores
    if (overallScore === 0 && categoryScores.length > 0) {
      const sum = categoryScores.reduce((acc, cat) => acc + cat.score, 0);
      overallScore = sum / categoryScores.length;
    }
    
    // Extract individual category scores
    const jobKnowledge = categoryScores.find(c => c.category.includes('Job Knowledge'))?.score || 0;
    const workQuality = categoryScores.find(c => c.category.includes('Work Quality'))?.score || 0;
    const servicePerformance = categoryScores.find(c => c.category.includes('Service Performance'))?.score || 0;
    const teamwork = categoryScores.find(c => c.category.includes('Teamwork'))?.score || 0;
    const attendance = categoryScores.find(c => c.category.includes('Attendance'))?.score || 0;
    
    // Get review date (use current date if not available)
    const reviewDate = new Date().toISOString().split('T')[0];
    
    const reviewNumber = stage ? parseInt(stage, 10) || blockIndex + 1 : blockIndex + 1;
    
    reviews.push({
      id: reviewNumber, // Use review number as ID
      date: reviewDate,
      reviewer: reviewer || 'Unknown Reviewer',
      overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
      jobKnowledge: Math.round(jobKnowledge * 10) / 10,
      workQuality: Math.round(workQuality * 10) / 10,
      servicePerformance: Math.round(servicePerformance * 10) / 10,
      teamwork: Math.round(teamwork * 10) / 10,
      attendance: Math.round(attendance * 10) / 10,
      strengths: strengths,
      improvements: improvements,
      notes: additionalNotes || '',
    });
  });
  
  return reviews;
}

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
        
      // Parse performance reviews from notes field
      let reviews: PerformanceReview[] = [];
      try {
        const notes = emp.notes || '';
        if (notes && notes.trim()) {
          reviews = parsePerformanceReviewsFromNotes(notes);
        }
      } catch (err) {
        console.error('Failed to parse performance reviews:', err);
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
        gender: emp.gender?.trim() || undefined,
        date_of_birth: emp.date_of_birth || undefined,
        address: emp.address?.trim() || undefined,
        university: emp.university?.trim() || undefined,
        degree: emp.degree?.trim() || undefined,
        referral: emp.referral?.trim() || undefined,
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
      title: `Performance Review ${review.id} Completed`,
      description: `Performance Review ${review.id} completed by ${review.reviewer}`,
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
                  {(() => {
                    const status = employee.status || 'Active';
                    const getStatusColors = (status: string) => {
                      switch (status) {
                        case 'Full-Time':
                        case 'Active':
                          return { bg: '#D1FAE5', text: '#065F46' };
                        case 'Part-time':
                          return { bg: '#DBEAFE', text: '#1E40AF' };
                        case 'Intern':
                          return { bg: '#FEF3C7', text: '#92400E' };
                        case 'Onboarding':
                          return { bg: '#F3E8FF', text: '#6B21A8' };
                        case 'Inactive':
                        case 'Terminated':
                          return { bg: '#FEE2E2', text: '#991B1B' };
                        default:
                          return { bg: '#F3F4F6', text: '#374151' };
                      }
                    };
                    const colors = getStatusColors(status);
                    return (
                      <div className="px-3 py-1 rounded-lg text-sm font-semibold" style={{ backgroundColor: colors.bg, color: colors.text }}>
                        Status: {status}
                      </div>
                    );
                  })()}
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
                              <h3 className="text-base font-bold mb-1" style={{ color: '#232E40' }}>Performance Review {review.id} Completed</h3>
                              <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                                Performance Review {review.id} completed by {review.reviewer}
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
              {/* Personal & Education Information */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Information</h3>
                
                {/* Contact Section */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Contact</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Email</span>
                        <span className="text-sm break-words" style={{ color: '#374151' }}>{employee.email}</span>
                      </div>
                    </div>
                    {employee.phone && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Phone</span>
                          <span className="text-sm" style={{ color: '#374151' }}>{employee.phone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Section */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Personal</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Location</span>
                        <span className={`text-sm break-words ${employee.address && employee.address !== 'Not Provided' ? '' : 'italic'}`} style={{ color: employee.address && employee.address !== 'Not Provided' ? '#374151' : '#9CA3AF' }}>
                          {employee.address && employee.address !== 'Not Provided' ? employee.address : 'No data'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Date of Birth</span>
                        <span className={`text-sm ${employee.date_of_birth ? '' : 'italic'}`} style={{ color: employee.date_of_birth ? '#374151' : '#9CA3AF' }}>
                          {employee.date_of_birth 
                            ? new Date(employee.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'No data'}
                        </span>
                      </div>
                    </div>
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

