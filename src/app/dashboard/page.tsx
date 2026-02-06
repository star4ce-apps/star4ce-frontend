'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth } from '@/lib/http';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type AnalyticsSummary = {
  ok: boolean;
  scope: string;
  dealership_id?: number;
  total_answers: number;
  total_responses: number;
  last_30_days: number;
  by_status: {
    'newly-hired': number;
    termination: number;
    leave: number;
    none: number;
  };
  turnover_rate?: number | null;
  retention_rate?: number | null;
};

// Modern color palette - matching surveys page
const COLORS = {
  primary: '#3B5998',
  primaryLight: '#5B7BB8',
  secondary: '#6366F1',
  tertiary: '#8B5CF6',
  negative: '#e74c3c',
  success: '#22C55E',
  warning: '#F59E0B',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
};

const CHART_COLORS = ['#3B5998', '#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#e74c3c', '#94A3B8'];

// Color mappings
const feedbackColors: Record<string, string> = {
  'Extremely Negative': COLORS.negative,
  'Semi Negative': '#f97316',
  'Neutral': COLORS.gray[400],
  'Semi Positive': COLORS.secondary,
  'Extremely Positive': COLORS.primary,
};

const roleColors = CHART_COLORS;

function DashboardContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<null | boolean>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  
  // Date range state - matching surveys page
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear(), 0, 1); // Start of year
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]; // Today
  });
  const [dateRangePreset, setDateRangePreset] = useState<string>('Year');
  // Corporate "VIEWING" dealership – refetch when changed from sidebar
  const [selectedDealershipId, setSelectedDealershipId] = useState<number | null>(null);

  const handleDatePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'Month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case '3-Month':
        start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case '6-Month':
        start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'Year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };
  
  // Real data states
  const [terminatedQuitData, setTerminatedQuitData] = useState<{ name: string; value: number; percentage: number; color: string }[]>([]);
  const [roleBreakdown, setRoleBreakdown] = useState<{ role: string; terminated: number; quit: number; total: number }[]>([]);
  const [surveyFeedback, setSurveyFeedback] = useState<{ name: string; value: number; color: string }[]>([]);
  const [turnoverTimeSeries, setTurnoverTimeSeries] = useState<{ month: string; value: number; retention_rate?: number | null }[]>([]);
  const [interviewingProcessData, setInterviewingProcessData] = useState<{ name: string; value: number }[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Read email from localStorage and check user role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('email');
      setEmail(storedEmail);
      if (storedEmail) {
        const emailParts = storedEmail.split('@')[0].split('.');
        const firstName = emailParts[0]?.charAt(0).toUpperCase() + emailParts[0]?.slice(1) || 'User';
        const lastName = emailParts[1]?.charAt(0).toUpperCase() + emailParts[1]?.slice(1) || '';
        setName(`${firstName} ${lastName}`.trim() || 'User');
      }
      
      // Check user role and approval status
      async function checkUserStatus() {
        try {
          const token = getToken();
          if (!token) return;
          
          // Check localStorage first for quick display
          const storedRole = localStorage.getItem('role');
          if (storedRole === 'manager') {
            setUserRole('manager');
            // Don't set isApproved yet, wait for API response
          }
          
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const data = await res.json().catch(() => ({}));
          
          if (res.ok) {
            setUserRole(data.user?.role || data.role);
            setIsApproved(data.user?.is_approved !== false && data.is_approved !== false);
          } else {
            // Handle manager_not_approved error
            console.log('Auth check failed:', res.status, data);
            
            // If we get a 403, check if it's manager_not_approved
            if (res.status === 403) {
              if (data.error === 'manager_not_approved') {
                // Explicitly manager not approved
                setUserRole('manager');
                setIsApproved(false);
                localStorage.setItem('role', 'manager');
                console.log('Manager not approved - showing waiting message');
              } else if (storedRole === 'manager') {
                // 403 error and we know we're a manager - assume not approved
                setUserRole('manager');
                setIsApproved(false);
                console.log('Manager with 403 error - showing waiting message');
              }
            } else if (storedRole === 'manager') {
              // Other error but we're a manager - assume not approved
              setUserRole('manager');
              setIsApproved(false);
            }
          }
        } catch (err) {
          console.error('Failed to check user status:', err);
          // On error, check localStorage
          const storedRole = localStorage.getItem('role');
          if (storedRole === 'manager') {
            setUserRole('manager');
            setIsApproved(false);
          }
        }
      }
      
      checkUserStatus();
      
      // Check for subscription success message
      const subscriptionSuccess = searchParams?.get('subscription') === 'success';
      if (subscriptionSuccess) {
        toast.success('🎉 Thank you for subscribing! Your admin account has been created and you are now logged in.', {
          duration: 6000,
        });
        // Remove the parameter from URL
        window.history.replaceState({}, '', '/dashboard');
      }
    }
  }, [searchParams]);

  // Sync selected dealership from localStorage on mount (corporate)
  useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem('selected_dealership_id') : null;
    setSelectedDealershipId(id ? parseInt(id, 10) : null);
  }, []);

  // Refetch when corporate user changes dealership in sidebar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ dealershipId: number }>).detail;
      if (detail?.dealershipId != null) setSelectedDealershipId(detail.dealershipId);
    };
    window.addEventListener('dealership-changed', handler);
    return () => window.removeEventListener('dealership-changed', handler);
  }, []);

  // Health check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        const data = await res.json().catch(() => ({}));
        setApiOk(res.ok && !!data?.ok);
      } catch {
        setApiOk(false);
      }
    })();
  }, []);

  // Load all dashboard data
  useEffect(() => {
    (async () => {
      setAnalyticsLoading(true);
      setDataLoading(true);
      setAnalyticsError(null);

      try {
        const token = getToken();
        if (!token) {
          setAnalyticsError('Not logged in.');
          setAnalyticsLoading(false);
          setDataLoading(false);
          return;
        }

        // Build date range query params; corporate can pass selected dealership
        let rangeParam = `?start_date=${startDate}&end_date=${endDate}`;
        if (selectedDealershipId != null) {
          rangeParam += `&dealership_id=${selectedDealershipId}`;
        }

        // Fetch all data in parallel using Promise.allSettled to handle permission errors gracefully
        // This allows individual endpoints to fail without breaking the entire dashboard
        const results = await Promise.allSettled([
          getJsonAuth(`/analytics/summary${rangeParam}`).catch(err => {
            // Handle permission errors silently
            const errorMsg = err?.message || '';
            if (errorMsg.includes('403') || errorMsg.includes('forbidden') || errorMsg.includes('insufficient role')) {
              return { ok: false };
            }
            throw err;
          }),
          getJsonAuth(`/analytics/terminated-quit${rangeParam}`).catch(err => {
            const errorMsg = err?.message || '';
            if (errorMsg.includes('403') || errorMsg.includes('forbidden') || errorMsg.includes('insufficient role')) {
              return { ok: false };
            }
            throw err;
          }),
          getJsonAuth(`/analytics/role-breakdown${rangeParam}`).catch(err => {
            const errorMsg = err?.message || '';
            if (errorMsg.includes('403') || errorMsg.includes('forbidden') || errorMsg.includes('insufficient role')) {
              return { ok: false };
            }
            throw err;
          }),
          getJsonAuth(`/analytics/survey-feedback${rangeParam}`).catch(err => {
            const errorMsg = err?.message || '';
            if (errorMsg.includes('403') || errorMsg.includes('forbidden') || errorMsg.includes('insufficient role')) {
              return { ok: false };
            }
            throw err;
          }),
          getJsonAuth(`/analytics/turnover-time-series${rangeParam}`).catch(err => {
            const errorMsg = err?.message || '';
            if (errorMsg.includes('403') || errorMsg.includes('forbidden') || errorMsg.includes('insufficient role')) {
              return { ok: false };
            }
            throw err;
          }),
          getJsonAuth(`/analytics/interviewing-process${rangeParam}`).catch(err => {
            const errorMsg = err?.message || '';
            if (errorMsg.includes('403') || errorMsg.includes('forbidden') || errorMsg.includes('insufficient role')) {
              return { ok: false };
            }
            throw err;
          }),
        ]);

        // Extract results, handling both fulfilled and rejected promises
        const summaryData = results[0].status === 'fulfilled' ? results[0].value : { ok: false };
        const terminatedQuitData = results[1].status === 'fulfilled' ? results[1].value : { ok: false };
        const roleBreakdownData = results[2].status === 'fulfilled' ? results[2].value : { ok: false };
        const surveyFeedbackData = results[3].status === 'fulfilled' ? results[3].value : { ok: false };
        const turnoverData = results[4].status === 'fulfilled' ? results[4].value : { ok: false };
        const interviewingData = results[5].status === 'fulfilled' ? results[5].value : { ok: false };

        if (summaryData.ok) {
          setAnalytics(summaryData as AnalyticsSummary);
        }

        // Process terminated/quit data
        if (terminatedQuitData.ok) {
          const total = terminatedQuitData.total || 0;
          const quit = terminatedQuitData.quit || 0;
          const terminated = terminatedQuitData.terminated || 0;
          
          if (total > 0) {
            setTerminatedQuitData([
              { name: 'Quit', value: quit, percentage: Math.round((quit / total) * 100 * 10) / 10, color: '#ef4444' },
              { name: 'Terminated', value: terminated, percentage: Math.round((terminated / total) * 100 * 10) / 10, color: '#a855f7' },
            ]);
          } else {
            setTerminatedQuitData([]);
          }
        }

        // Process role breakdown
        if (roleBreakdownData.ok && roleBreakdownData.breakdown) {
          // Ensure breakdown is an array
          const breakdown = Array.isArray(roleBreakdownData.breakdown) 
            ? roleBreakdownData.breakdown 
            : [];
          setRoleBreakdown(breakdown);
        } else {
          // Ensure roleBreakdown is always an array, even on error
          setRoleBreakdown([]);
        }

        // Process survey feedback
        if (surveyFeedbackData.ok && surveyFeedbackData.feedback) {
          const feedbackArray = Array.isArray(surveyFeedbackData.feedback) 
            ? surveyFeedbackData.feedback 
            : [];
          const feedback = feedbackArray.map((item: { name: string; value: number }) => ({
            name: item.name,
            value: item.value,
            color: feedbackColors[item.name] || '#6b7280',
          }));
          setSurveyFeedback(feedback);
        } else {
          setSurveyFeedback([]);
        }

        // Process turnover time series
        if (turnoverData.ok && turnoverData.time_series) {
          const timeSeries = Array.isArray(turnoverData.time_series) 
            ? turnoverData.time_series 
            : [];
          setTurnoverTimeSeries(timeSeries);
        } else {
          setTurnoverTimeSeries([]);
        }

        // Process interviewing process (candidates by status)
        if (interviewingData.ok && interviewingData.stages) {
          const stages = Array.isArray(interviewingData.stages) ? interviewingData.stages : [];
          setInterviewingProcessData(stages);
        } else {
          setInterviewingProcessData([]);
        }
      } catch (err: unknown) {
        // Only set error for non-permission related errors
        const errorMsg = err instanceof Error ? err.message : 'Failed to load analytics';
        // Don't show error for permission issues - they're handled gracefully above
        if (!errorMsg.includes('403') && !errorMsg.includes('forbidden') && !errorMsg.includes('insufficient role')) {
          setAnalyticsError(errorMsg);
        }
      } finally {
        setAnalyticsLoading(false);
        setDataLoading(false);
      }
    })();
  }, [startDate, endDate, selectedDealershipId]);

  // Use real employee data from API (total_responses = ending headcount, by_status = exits in period)
  const totalEmployees = analytics?.total_responses ?? 0;
  const turnoverRate: number | null = typeof analytics?.turnover_rate === 'number'
    ? analytics.turnover_rate
    : (totalEmployees > 0
        ? Math.round((( (analytics?.by_status?.termination || 0) + (analytics?.by_status?.leave || 0) ) / totalEmployees) * 100 * 10) / 10
        : null);
  const retentionRate: number | null = typeof analytics?.retention_rate === 'number'
    ? analytics.retention_rate
    : (turnoverRate != null ? 100 - turnoverRate : null);
  const hasRate = turnoverRate != null && retentionRate != null;
  const periodLabel = dateRangePreset === 'Year' ? 'annual' : dateRangePreset === 'Month' ? 'month' : dateRangePreset.toLowerCase();

  // Quit and Terminated breakdown by role (both shown at once, separated)
  const safeRoleBreakdown = Array.isArray(roleBreakdown) ? roleBreakdown : [];
  const totalQuit = safeRoleBreakdown.reduce((sum, r) => sum + r.quit, 0);
  const totalTerminated = safeRoleBreakdown.reduce((sum, r) => sum + r.terminated, 0);
  const quitBreakdownData = safeRoleBreakdown
    .filter(r => r.quit > 0)
    .map((r, idx) => ({
      name: r.role,
      value: r.quit,
      percentage: totalQuit > 0 ? Math.round((r.quit / totalQuit) * 100 * 10) / 10 : 0,
      color: roleColors[idx % roleColors.length],
    }));
  const terminatedBreakdownData = safeRoleBreakdown
    .filter(r => r.terminated > 0)
    .map((r, idx) => ({
      name: r.role,
      value: r.terminated,
      percentage: totalTerminated > 0 ? Math.round((r.terminated / totalTerminated) * 100 * 10) / 10 : 0,
      color: roleColors[(idx + 3) % roleColors.length],
    }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Show waiting message for unapproved managers
  // Check if manager role and either explicitly not approved, or check localStorage as fallback
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const isManager = userRole === 'manager' || storedRole === 'manager';
  // Show message if: explicitly not approved, OR we're a manager and approval status is null/unknown
  const isNotApproved = isApproved === false || (isApproved === null && isManager);
  
  // Debug logging
  if (isManager) {
    console.log('Manager check:', { userRole, storedRole, isApproved, isNotApproved, willShow: isManager && isNotApproved });
  }
  
  if (isManager && isNotApproved) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden" style={{ maxWidth: 'calc(100vw - 16rem)' }}>
            <div className="rounded-xl p-6 sm:p-12 text-center" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: COLORS.warning }}>
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

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
        <HubSidebar />
        
        <main className="ml-64 flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden" style={{ maxWidth: 'calc(100vw - 16rem)' }}>
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold mb-1 truncate" style={{ color: COLORS.gray[900] }}>Dashboard</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Overview of your dealership's performance and analytics
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent min-w-0"
                    style={{ color: COLORS.gray[700], width: '110px', maxWidth: '50vw' }}
                  />
                  <span className="text-sm flex-shrink-0" style={{ color: COLORS.gray[300] }}>—</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent min-w-0"
                    style={{ color: COLORS.gray[700], width: '110px', maxWidth: '50vw' }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={dateRangePreset}
                    onChange={(e) => handleDatePresetChange(e.target.value)}
                    className="text-sm py-2 px-4 pr-8 appearance-none cursor-pointer rounded-lg"
                    style={{ 
                      border: `1px solid ${COLORS.gray[200]}`, 
                      color: COLORS.gray[700], 
                      backgroundColor: '#fff',
                    }}
                  >
                    <option>Month</option>
                    <option>3-Month</option>
                    <option>6-Month</option>
                    <option>Year</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: COLORS.gray[400] }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 lg:mb-6">
            {[
              { label: 'Total Employees', value: analyticsLoading ? '...' : totalEmployees.toLocaleString(), sub: `+${analytics?.last_30_days || 0} new`, color: COLORS.gray[900] },
              { label: 'Terminated', value: dataLoading ? '...' : (analytics?.by_status?.termination || 0), sub: 'employees', color: COLORS.gray[900] },
              { label: 'Quit', value: dataLoading ? '...' : (analytics?.by_status?.leave || 0), sub: 'employees', color: COLORS.gray[900] },
              { label: 'Turnover Rate', value: dataLoading ? '...' : (hasRate ? `${turnoverRate}%` : 'N/A'), sub: periodLabel, color: COLORS.negative },
              { label: 'Retention', value: dataLoading ? '...' : (retentionRate != null ? `${retentionRate.toFixed(1)}%` : 'N/A'), sub: periodLabel, color: COLORS.success },
            ].map((kpi, idx) => (
              <div key={idx} className="rounded-xl p-3 sm:p-4 min-w-0" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1 sm:mb-2 truncate" style={{ color: COLORS.gray[400] }}>{kpi.label}</p>
                <p className="text-xl sm:text-2xl font-semibold truncate" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-xs mt-1 truncate" style={{ color: COLORS.gray[400] }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Interview Process, Survey Feedback, and Role Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-4 lg:mb-6">
            {/* Interviewing Process */}
            <div className="rounded-xl p-4 sm:p-6 min-w-0 overflow-hidden" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.gray[900] }}>Interviewing Process</h2>
              {interviewingProcessData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={interviewingProcessData} margin={{ top: 5, right: 5, left: -15, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[200]} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={50}
                      tick={{ fill: COLORS.gray[500], fontSize: 9 }}
                    />
                    <YAxis tick={{ fill: COLORS.gray[500], fontSize: 9 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: `1px solid ${COLORS.gray[200]}`,
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={COLORS.primary}>
                      {interviewingProcessData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12" style={{ color: COLORS.gray[400] }}>
                  <div className="text-sm">{dataLoading ? 'Loading...' : 'No data available'}</div>
                </div>
              )}
            </div>

            {/* Survey Feedback */}
            <div className="rounded-xl p-4 sm:p-6 min-w-0 overflow-hidden" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.gray[900] }}>Survey Feedback</h2>
              {surveyFeedback.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={surveyFeedback} margin={{ top: 5, right: 5, left: -15, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[200]} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={50}
                      tick={{ fill: COLORS.gray[500], fontSize: 9 }}
                    />
                    <YAxis tick={{ fill: COLORS.gray[500], fontSize: 9 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: `1px solid ${COLORS.gray[200]}`,
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {surveyFeedback.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12" style={{ color: COLORS.gray[400] }}>
                  <div className="text-sm">{dataLoading ? 'Loading...' : 'No data'}</div>
                </div>
              )}
            </div>

            {/* Terminated vs Quit */}
            <div className="rounded-xl p-4 sm:p-6 min-w-0 overflow-hidden" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium" style={{ color: COLORS.gray[900] }}>Terminated vs Quit</h2>
              </div>
              {terminatedQuitData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                  <div className="w-full md:w-1/2 min-w-0" style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie
                        data={terminatedQuitData}
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="75%"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {terminatedQuitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: `1px solid ${COLORS.gray[200]}`,
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-4 flex-1 w-full md:min-w-0 min-w-[8rem]">
                    {terminatedQuitData.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: CHART_COLORS[idx] }} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm leading-tight" style={{ color: COLORS.gray[600] }}>{item.name}</span>
                          <span className="text-sm font-medium mt-0.5" style={{ color: COLORS.gray[900] }}>{item.value} ({item.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12" style={{ color: COLORS.gray[400] }}>
                  <div className="text-sm">{dataLoading ? 'Loading...' : 'No data'}</div>
                </div>
              )}
            </div>
          </div>

          {/* Role Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
            {/* Quit & Terminated by Role - left and right with donuts */}
            <div className="rounded-xl p-4 sm:p-6 min-w-0 overflow-hidden" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <h2 className="text-sm font-medium mb-4" style={{ color: COLORS.gray[900] }}>Quit & Terminated by Role</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Left: Quit by Role */}
                <div className="flex-1 min-w-0 border-r-0 sm:border-r sm:pr-6" style={{ borderColor: COLORS.gray[200] }}>
                  <h3 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[500] }}>Quit</h3>
                  {quitBreakdownData.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-24 min-w-[6rem] min-h-[6rem] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                            <Pie
                              data={quitBreakdownData}
                              cx="50%"
                              cy="50%"
                              innerRadius="50%"
                              outerRadius="75%"
                              dataKey="value"
                              paddingAngle={2}
                            >
                              {quitBreakdownData.map((entry, index) => (
                                <Cell key={`quit-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}`, borderRadius: '6px', padding: '6px 8px', fontSize: '11px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0 max-h-[96px] overflow-y-auto">
                        {quitBreakdownData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-sm truncate" style={{ color: COLORS.gray[600] }}>{item.name}</span>
                            </div>
                            <span className="text-sm font-medium flex-shrink-0" style={{ color: COLORS.gray[900] }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: COLORS.gray[400] }}>{dataLoading ? 'Loading...' : 'No data'}</p>
                  )}
                </div>

                {/* Right: Terminated by Role */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[500] }}>Terminated</h3>
                  {terminatedBreakdownData.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-24 min-w-[6rem] min-h-[6rem] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                            <Pie
                              data={terminatedBreakdownData}
                              cx="50%"
                              cy="50%"
                              innerRadius="50%"
                              outerRadius="75%"
                              dataKey="value"
                              paddingAngle={2}
                            >
                              {terminatedBreakdownData.map((entry, index) => (
                                <Cell key={`term-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}`, borderRadius: '6px', padding: '6px 8px', fontSize: '11px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0 max-h-[96px] overflow-y-auto">
                        {terminatedBreakdownData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-sm truncate" style={{ color: COLORS.gray[600] }}>{item.name}</span>
                            </div>
                            <span className="text-sm font-medium flex-shrink-0" style={{ color: COLORS.gray[900] }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: COLORS.gray[400] }}>{dataLoading ? 'Loading...' : 'No data'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Turnover Trend & Retention Trend */}
            <div className="rounded-xl p-4 sm:p-6 min-w-0 overflow-hidden" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Left: Turnover Trend */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-medium mb-3" style={{ color: COLORS.gray[900] }}>Turnover Trend</h2>
                  {turnoverTimeSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={turnoverTimeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[200]} />
                        <XAxis dataKey="month" tick={{ fill: COLORS.gray[500], fontSize: 11 }} />
                        <YAxis domain={[0, 'auto']} tick={{ fill: COLORS.gray[500], fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }} />
                        <Line type="monotone" dataKey="value" name="Exits" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12" style={{ color: COLORS.gray[400] }}><div className="text-sm">{dataLoading ? 'Loading...' : 'No data'}</div></div>
                  )}
                </div>
                {/* Right: Retention Trend */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-medium mb-3" style={{ color: COLORS.gray[900] }}>Retention Trend</h2>
                  {turnoverTimeSeries.length > 0 && turnoverTimeSeries.some(d => d.retention_rate != null) ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={turnoverTimeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[200]} />
                        <XAxis dataKey="month" tick={{ fill: COLORS.gray[500], fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: COLORS.gray[500], fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }} formatter={(v: number) => [`${v}%`, 'Retention']} />
                        <Line type="monotone" dataKey="retention_rate" name="Retention %" stroke={COLORS.success} strokeWidth={2} dot={{ fill: COLORS.success, r: 3 }} activeDot={{ r: 5 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12" style={{ color: COLORS.gray[400] }}><div className="text-sm">{dataLoading ? 'Loading...' : 'No data'}</div></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
              <p style={{ color: COLORS.gray[500] }}>Loading dashboard...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    }>
      <DashboardContent />
    </Suspense>
  );
}
