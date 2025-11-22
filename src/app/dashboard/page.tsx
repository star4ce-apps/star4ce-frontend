'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
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
};

// Color mappings
const feedbackColors: Record<string, string> = {
  'Extremely Negative': '#ef4444',
  'Semi Negative': '#f97316',
  'Neutral': '#eab308',
  'Semi Positive': '#22c55e',
  'Extremely Positive': '#3b82f6',
};

const roleColors = ['#f97316', '#ef4444', '#84cc16', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<null | boolean>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [currentChart, setCurrentChart] = useState<'quit' | 'terminated'>('quit');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  
  // Real data states
  const [terminatedQuitData, setTerminatedQuitData] = useState<{ name: string; value: number; percentage: number; color: string }[]>([]);
  const [roleBreakdown, setRoleBreakdown] = useState<{ role: string; terminated: number; quit: number; total: number }[]>([]);
  const [surveyFeedback, setSurveyFeedback] = useState<{ name: string; value: number; color: string }[]>([]);
  const [turnoverTimeSeries, setTurnoverTimeSeries] = useState<{ month: string; value: number }[]>([]);
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
          
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            setUserRole(data.role);
            setIsApproved(data.is_approved !== false);
          } else {
            const data = await res.json();
            if (data.error === 'manager_not_approved') {
              setUserRole('manager');
              setIsApproved(false);
            }
          }
        } catch (err) {
          console.error('Failed to check user status:', err);
        }
      }
      
      checkUserStatus();
    }
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

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch all data in parallel
        const [summaryRes, terminatedQuitRes, roleBreakdownRes, surveyFeedbackRes, turnoverRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/summary`, { headers }),
          fetch(`${API_BASE}/analytics/terminated-quit`, { headers }),
          fetch(`${API_BASE}/analytics/role-breakdown`, { headers }),
          fetch(`${API_BASE}/analytics/survey-feedback`, { headers }),
          fetch(`${API_BASE}/analytics/turnover-time-series`, { headers }),
        ]);

        const [summaryData, terminatedQuitData, roleBreakdownData, surveyFeedbackData, turnoverData] = await Promise.all([
          summaryRes.json().catch(() => ({})),
          terminatedQuitRes.json().catch(() => ({})),
          roleBreakdownRes.json().catch(() => ({})),
          surveyFeedbackRes.json().catch(() => ({})),
          turnoverRes.json().catch(() => ({})),
        ]);

        if (!summaryRes.ok) {
          throw new Error(summaryData?.error || `Failed to load analytics (${summaryRes.status})`);
        }

        setAnalytics(summaryData as AnalyticsSummary);

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
          setRoleBreakdown(roleBreakdownData.breakdown);
        }

        // Process survey feedback
        if (surveyFeedbackData.ok && surveyFeedbackData.feedback) {
          const feedback = surveyFeedbackData.feedback.map((item: { name: string; value: number }) => ({
            name: item.name,
            value: item.value,
            color: feedbackColors[item.name] || '#6b7280',
          }));
          setSurveyFeedback(feedback);
        }

        // Process turnover time series
        if (turnoverData.ok && turnoverData.time_series) {
          setTurnoverTimeSeries(turnoverData.time_series);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load analytics';
        setAnalyticsError(msg);
      } finally {
        setAnalyticsLoading(false);
        setDataLoading(false);
      }
    })();
  }, []);

  // Calculate metrics from API data
  const totalEmployees = analytics?.total_responses || 0;
  const terminatedQuit = (analytics?.by_status?.termination || 0) + (analytics?.by_status?.leave || 0);
  const turnoverRate = totalEmployees > 0 
    ? Math.round(((terminatedQuit / totalEmployees) * 100) * 10) / 10 
    : 0;

  // Get terminated breakdown by role
  const terminatedBreakdownData = currentChart === 'terminated'
    ? roleBreakdown
        .filter(r => r.terminated > 0)
        .map((r, idx) => ({
          name: r.role,
          value: r.terminated,
          percentage: roleBreakdown.reduce((sum, role) => sum + role.terminated, 0) > 0
            ? Math.round((r.terminated / roleBreakdown.reduce((sum, role) => sum + role.terminated, 0)) * 100 * 10) / 10
            : 0,
          color: roleColors[idx % roleColors.length],
        }))
    : roleBreakdown
        .filter(r => r.quit > 0)
        .map((r, idx) => ({
          name: r.role,
          value: r.quit,
          percentage: roleBreakdown.reduce((sum, role) => sum + role.quit, 0) > 0
            ? Math.round((r.quit / roleBreakdown.reduce((sum, role) => sum + role.quit, 0)) * 100 * 10) / 10
            : 0,
          color: roleColors[idx % roleColors.length],
        }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Show waiting message for unapproved managers
  if (userRole === 'manager' && isApproved === false) {
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
                Please wait for an admin to approve your request to join the dealership. You'll be able to access the dashboard once approved.
              </p>
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
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Dashboard</h1>
                <p className="text-base" style={{ color: '#6B7280' }}>Overview of your performance and analytics</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: '#374151' }}>{getGreeting()}, {name?.split(' ')[0] || 'User'}</p>
                </div>
                <span className="px-3 py-1.5 text-white text-xs font-semibold rounded-full shadow-sm" style={{ backgroundColor: '#4D6DBE' }}>Administrator</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Total Employees</div>
              <div className="text-5xl font-bold mb-3" style={{ color: '#232E40', lineHeight: '1' }}>
                {analyticsLoading ? (
                  <span className="text-2xl" style={{ color: '#9CA3AF' }}>...</span>
                ) : (
                  totalEmployees.toLocaleString()
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                <span className="font-medium" style={{ color: '#059669' }}>
                  {analytics?.last_30_days || 0} in last 30 days
                </span>
              </div>
            </div>
            
            <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Total Terminated/Quit</div>
              <div className="text-5xl font-bold mb-3" style={{ color: '#232E40', lineHeight: '1' }}>
                {dataLoading ? (
                  <span className="text-2xl" style={{ color: '#9CA3AF' }}>...</span>
                ) : (
                  terminatedQuit.toLocaleString()
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
                <span className="font-medium" style={{ color: '#DC2626' }}>
                  {analytics?.by_status?.termination || 0} terminated • {analytics?.by_status?.leave || 0} quit
                </span>
              </div>
            </div>
            
            <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Total Turnover Rate</div>
              <div className="text-5xl font-bold mb-3" style={{ color: '#232E40', lineHeight: '1' }}>
                {dataLoading ? (
                  <span className="text-2xl" style={{ color: '#9CA3AF' }}>...</span>
                ) : (
                  `${turnoverRate}%`
                )}
              </div>
            </div>
          </div>

          {/* Interview Process, Survey Feedback, and Role Distribution */}
          <div className="grid grid-cols-2 gap-6 mb-8" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {/* Left Column: Interview Process and Survey Feedback */}
            <div className="flex flex-col gap-6">
              {/* Interviewing Process */}
              <div className="rounded-xl p-8 transition-all duration-200 hover:shadow-lg flex-1" style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
              }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Interviewing Process</h2>
                </div>
                <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
                  <div className="text-sm font-medium">No data available</div>
                </div>
              </div>

              {/* Survey Feedback */}
              <div className="rounded-xl p-8 transition-all duration-200 hover:shadow-lg flex-1" style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
              }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Survey Feedback</h2>
                </div>
                {surveyFeedback.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={surveyFeedback} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {surveyFeedback.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
                    <div className="text-sm font-medium">{dataLoading ? 'Loading data...' : 'No survey feedback data available'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Role Distribution */}
            <div className="mb-8">
            <div className="rounded-xl p-8 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Role Distribution</h2>
                <div className="relative">
                  <select className="cursor-pointer text-sm py-2.5 appearance-none transition-colors rounded-lg" style={{ 
                    border: '1px solid #E5E7EB', 
                    color: '#374151',
                    backgroundColor: '#FFFFFF',
                    paddingLeft: '1rem',
                    paddingRight: '2.5rem',
                    minWidth: '120px'
                  }}>
                    <option>All</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-base font-semibold mb-6" style={{ color: '#374151' }}>Terminated vs. Quit</h3>
                {terminatedQuitData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={terminatedQuitData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {terminatedQuitData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-3 mt-6 w-full max-w-md">
                      {terminatedQuitData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold" style={{ color: '#374151' }}>{item.value}</div>
                            <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{item.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
                    <div className="text-sm font-medium">{dataLoading ? 'Loading data...' : 'No data available'}</div>
                  </div>
                )}
              </div>

              <div className="pt-8 mt-8" style={{ borderTop: '1px solid #E5E7EB' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold" style={{ color: '#374151' }}>
                    {currentChart === 'terminated' ? 'Terminated by Role' : 'Quit by Role'}
                  </h3>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setCurrentChart('quit')}
                      className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        currentChart === 'quit' 
                          ? 'bg-white shadow-sm' 
                          : 'hover:bg-gray-50'
                      }`}
                      style={{ 
                        color: currentChart === 'quit' ? '#232E40' : '#6B7280'
                      }}
                    >
                      Quit
                    </button>
                    <button
                      onClick={() => setCurrentChart('terminated')}
                      className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        currentChart === 'terminated' 
                          ? 'bg-white shadow-sm' 
                          : 'hover:bg-gray-50'
                      }`}
                      style={{ 
                        color: currentChart === 'terminated' ? '#232E40' : '#6B7280'
                      }}
                    >
                      Terminated
                    </button>
                  </div>
                </div>
                {terminatedBreakdownData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={terminatedBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {terminatedBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 mt-6 w-full max-w-md">
                      {terminatedBreakdownData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm font-medium" style={{ color: '#232E40' }}>{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold" style={{ color: '#374151' }}>{item.value}</span>
                            <span className="text-xs ml-2" style={{ color: '#6B7280' }}>({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
                    <div className="text-sm font-medium">{dataLoading ? 'Loading data...' : 'No data available'}</div>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* Turnover Report */}
          <div>
            <div className="rounded-xl p-8 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Turnover Report</h2>
                <button className="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-gray-50" style={{ 
                  border: '1px solid #E5E7EB', 
                  color: '#374151', 
                  backgroundColor: '#FFFFFF' 
                }}>
                  This year
                </button>
              </div>
              {turnoverTimeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={turnoverTimeSeries} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, 'auto']} 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#4D6DBE" 
                      strokeWidth={3} 
                      dot={{ fill: '#4D6DBE', r: 4 }} 
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
                  <div className="text-sm font-medium">{dataLoading ? 'Loading data...' : 'No turnover data available'}</div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
