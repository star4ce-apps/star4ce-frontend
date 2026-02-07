'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth } from '@/lib/http';
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
  AreaChart,
  Area,
} from 'recharts';

// Modern color palette - cohesive blues and grays
const COLORS = {
  primary: '#3B5998',
  primaryLight: '#5B7BB8',
  primaryDark: '#2B4978',
  accent: '#6366F1',
  success: '#22C55E',
  warning: '#F59E0B',
  negative: '#e74c3c', // Star4ce brand red (from "4ce")
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

const CHART_COLORS = ['#3B5998', '#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD'];

// Types matching backend API
type AnalyticsSummary = {
  scope: string;
  total_dealerships?: number;
  total_answers: number;
  total_responses: number;
  last_30_days: number;
  by_status?: {
    'newly-hired': number;
    'termination': number;
    'leave': number;
    'none': number;
  };
  message?: string;
};

type AnalyticsAverages = {
  satisfaction_avg: number;
  training_avg: number;
  total_responses: number;
};

type RoleBreakdown = {
  [role: string]: {
    count: number;
    by_status: {
      'newly-hired': number;
      'termination': number;
      'leave': number;
      'none': number;
    };
  };
};

type TimeSeriesData = {
  date: string;
  responses: number;
  satisfaction_avg: number;
}[];

type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
  hire_date?: string;
  status?: string;
  gender?: string;
};

// Survey feedback data
const defaultSurveyCategories = [
  { category: 'Work Environment', score: 4.3 },
  { category: 'Management', score: 4.0 },
  { category: 'Career Growth', score: 3.7 },
  { category: 'Compensation', score: 3.5 },
  { category: 'Work-Life Balance', score: 4.1 },
  { category: 'Team Collaboration', score: 4.4 },
  { category: 'Training', score: 3.8 },
  { category: 'Culture', score: 4.2 },
];

const topConcerns = [
  { concern: 'Career advancement opportunities', mentions: 34 },
  { concern: 'Competitive compensation', mentions: 28 },
  { concern: 'Training programs needed', mentions: 22 },
  { concern: 'Communication from leadership', mentions: 18 },
  { concern: 'Workload distribution', mentions: 15 },
];

const topPraises = [
  { praise: 'Supportive team environment', mentions: 48 },
  { praise: 'Flexible work arrangements', mentions: 36 },
  { praise: 'Good management support', mentions: 32 },
  { praise: 'Positive company culture', mentions: 28 },
  { praise: 'Quality of workplace facilities', mentions: 24 },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'turnover' | 'demographics' | 'trends' | 'survey'>('turnover');
  
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
  
  // API data states
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [averages, setAverages] = useState<AnalyticsAverages | null>(null);
  const [roleBreakdown, setRoleBreakdown] = useState<RoleBreakdown>({});
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [startDate, endDate]);

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        setLoading(false);
        return;
      }
      
      // Build date range query params
      const rangeParam = `?start_date=${startDate}&end_date=${endDate}`;

      // Use getJsonAuth to include X-Dealership-Id header for corporate users
      const [summaryData, averagesData, breakdownData, timeSeriesData, employeesData] = await Promise.all([
        getJsonAuth(`/analytics/summary${rangeParam}`).catch(() => null),
        getJsonAuth(`/analytics/averages${rangeParam}`).catch(() => null),
        getJsonAuth(`/analytics/role-breakdown${rangeParam}`).catch(() => null),
        getJsonAuth(`/analytics/time-series${rangeParam}`).catch(() => null),
        getJsonAuth(`/employees${rangeParam}`).catch(() => null),
      ]);

      if (summaryData) setSummary(summaryData);
      if (averagesData) setAverages(averagesData);
      if (breakdownData) {
        const raw = breakdownData.breakdown ?? breakdownData;
        // Backend may return array [{ role, terminated, quit, total }] or legacy object { [role]: { count, by_status } }
        const normalized: RoleBreakdown = Array.isArray(raw)
          ? (raw as { role: string; terminated: number; quit: number; total: number }[]).reduce<RoleBreakdown>((acc, r) => {
              acc[r.role] = {
                count: r.total,
                by_status: {
                  'newly-hired': 0,
                  termination: r.terminated,
                  leave: r.quit,
                  none: Math.max(0, r.total - r.terminated - r.quit),
                },
              };
              return acc;
            }, {})
          : (raw as RoleBreakdown);
        setRoleBreakdown(normalized);
      }
      if (timeSeriesData) {
        setTimeSeries(timeSeriesData.data || timeSeriesData || []);
      }
      if (employeesData) {
        // Ensure employees is always an array
        const employeesList = employeesData.employees || employeesData.items || employeesData || [];
        setEmployees(Array.isArray(employeesList) ? employeesList : []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Some analytics data could not be loaded');
    } finally {
      setLoading(false);
    }
  }

  // Calculate statistics
  // totalEmployees should be the actual employee count, not survey responses
  const totalEmployees = Array.isArray(employees) ? employees.length : 0;
  const totalTerminations = summary?.by_status?.termination || 0;
  const totalNewHires = summary?.by_status?.['newly-hired'] || 0;
  const totalOnLeave = summary?.by_status?.leave || 0;
  const totalActive = summary?.by_status?.none || 0;
  const turnoverRate = totalEmployees > 0 ? ((totalTerminations / totalEmployees) * 100).toFixed(1) : '0.0';
  const retentionRate = (100 - parseFloat(turnoverRate)).toFixed(1);
  const satisfactionAvg = averages?.satisfaction_avg?.toFixed(1) || '0.0';
  const trainingAvg = averages?.training_avg?.toFixed(1) || '0.0';
  const totalResponses = summary?.total_responses || averages?.total_responses || 0;
  const last30Days = summary?.last_30_days || 0;
  
  // Calculate response rate (capped at 100%)
  const responseRate = totalEmployees > 0 
    ? Math.min(100, Math.round((totalResponses / totalEmployees) * 100))
    : 0;

  // Process data
  const turnoverByRole = Object.entries(roleBreakdown).map(([role, data]) => ({
    role,
    headcount: data.count,
    turnover: data.by_status.termination,
    rate: data.count > 0 ? parseFloat(((data.by_status.termination / data.count) * 100).toFixed(1)) : 0,
  })).filter(r => r.headcount > 0).sort((a, b) => b.headcount - a.headcount);

  const departmentCounts: { [key: string]: { headcount: number; terminations: number } } = {};
  const genderCounts: { [key: string]: number } = { Male: 0, Female: 0, Other: 0 };
  
  // Ensure employees is an array before iterating
  (Array.isArray(employees) ? employees : []).forEach(emp => {
    const dept = emp.department || emp.role || 'Other';
    if (!departmentCounts[dept]) departmentCounts[dept] = { headcount: 0, terminations: 0 };
    departmentCounts[dept].headcount++;
    if (emp.status === 'termination') departmentCounts[dept].terminations++;
    
    const gender = emp.gender?.toLowerCase();
    if (gender === 'male' || gender === 'm') genderCounts.Male++;
    else if (gender === 'female' || gender === 'f') genderCounts.Female++;
    else genderCounts.Other++;
  });

  const turnoverByDepartment = Object.entries(departmentCounts).map(([dept, data]) => ({
    department: dept,
    headcount: data.headcount,
    turnover: data.terminations,
    rate: data.headcount > 0 ? parseFloat(((data.terminations / data.headcount) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.headcount - a.headcount);

  const genderDistribution = [
    { name: 'Male', value: genderCounts.Male },
    { name: 'Female', value: genderCounts.Female },
    { name: 'Other', value: genderCounts.Other },
  ].filter(g => g.value > 0);

  // Tenure calculation
  const now = new Date();
  const tenureBuckets = { '< 1 year': 0, '1-3 years': 0, '3-5 years': 0, '5+ years': 0 };
  // Ensure employees is an array before iterating
  (Array.isArray(employees) ? employees : []).forEach(emp => {
    if (emp.hire_date) {
      const years = (now.getTime() - new Date(emp.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (years < 1) tenureBuckets['< 1 year']++;
      else if (years < 3) tenureBuckets['1-3 years']++;
      else if (years < 5) tenureBuckets['3-5 years']++;
      else tenureBuckets['5+ years']++;
    }
  });

  const tenureDistribution = Object.entries(tenureBuckets).map(([tenure, count]) => ({ tenure, count }));

  const statusBreakdown = summary?.by_status ? [
    { status: 'Active', count: summary.by_status.none || 0 },
    { status: 'New Hires', count: summary.by_status['newly-hired'] || 0 },
    { status: 'On Leave', count: summary.by_status.leave || 0 },
    { status: 'Terminated', count: summary.by_status.termination || 0 },
  ].filter(s => s.count > 0) : [];

  const monthlyTrends = timeSeries.length > 0 
    ? timeSeries.map(item => ({
        month: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
        responses: item.responses,
        satisfaction: item.satisfaction_avg,
      }))
    : [];

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
              <p style={{ color: COLORS.gray[500] }}>Loading analytics...</p>
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
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Analytics Overview</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Workforce insights, turnover analysis, and survey feedback
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: COLORS.gray[700], width: '120px' }}
                  />
                  <span className="text-sm" style={{ color: COLORS.gray[300] }}>—</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: COLORS.gray[700], width: '120px' }}
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

          {error && (
            <div className="mb-6 rounded-lg p-4" style={{ backgroundColor: COLORS.gray[100], border: `1px solid ${COLORS.gray[200]}` }}>
              <p className="text-sm" style={{ color: COLORS.gray[600] }}>{error}</p>
            </div>
          )}

          {/* KPI Cards - Clean minimal style */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total Employees', value: totalEmployees, sub: `+${totalNewHires} new`, color: '#394B67' },
              { label: 'Turnover Rate', value: `${turnoverRate}%`, sub: `${totalTerminations} left`, color: COLORS.negative },
              { label: 'Retention', value: `${retentionRate}%`, sub: 'current', color: COLORS.success },
              { label: 'On Leave', value: totalOnLeave, sub: 'employees', color: '#394B67' },
              { label: 'Responses', value: totalResponses, sub: `${last30Days} recent`, color: '#394B67' },
              { label: 'Satisfaction', value: `${satisfactionAvg}`, sub: 'out of 5.0', color: '#394B67' },
            ].map((kpi, idx) => (
              <div key={idx} className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: COLORS.gray[400] }}>{kpi.label}</p>
                <p className="text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-xs mt-1" style={{ color: COLORS.gray[400] }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Tabs - Modern underline style */}
          <div className="flex gap-1 mb-8 border-b" style={{ borderColor: COLORS.gray[200] }}>
            {[
              { id: 'turnover', label: 'Turnover' },
              { id: 'demographics', label: 'Demographics' },
              { id: 'trends', label: 'Trends' },
              { id: 'survey', label: 'Survey Feedback' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="px-5 py-3 text-sm font-medium transition-all relative cursor-pointer"
                style={{
                  color: activeTab === tab.id ? COLORS.primary : COLORS.gray[500],
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: COLORS.primary }}></div>
                )}
              </button>
            ))}
          </div>

          {/* Turnover Tab */}
          {activeTab === 'turnover' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Employee Status</h3>
                  {statusBreakdown.length > 0 ? (
                    <div className="flex items-center gap-8">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="count" stroke="none">
                            {statusBreakdown.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${COLORS.gray[200]}`, boxShadow: 'none' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-3">
                        {statusBreakdown.map((item, idx) => (
                          <div key={item.status} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx] }}></div>
                              <span className="text-sm" style={{ color: COLORS.gray[600] }}>{item.status}</span>
                            </div>
                            <span className="text-sm font-medium" style={{ color: COLORS.gray[900] }}>{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-center py-8" style={{ color: COLORS.gray[400] }}>No data available</p>
                  )}
                </div>

                {/* Turnover by Role */}
                <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Turnover by Role</h3>
                  {turnoverByRole.length > 0 ? (
                    <div className="space-y-4">
                      {turnoverByRole.slice(0, 6).map((role) => (
                        <div key={role.role}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm truncate" style={{ color: COLORS.gray[600], maxWidth: '60%' }}>{role.role}</span>
                            <span className="text-sm font-medium" style={{ color: COLORS.gray[900] }}>{role.rate}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: COLORS.gray[100] }}>
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(role.rate * 5, 100)}%`, backgroundColor: COLORS.primary }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-center py-8" style={{ color: COLORS.gray[400] }}>No data available</p>
                  )}
                </div>
              </div>

              {/* Department Table */}
              <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Department Breakdown</h3>
                {turnoverByDepartment.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${COLORS.gray[100]}` }}>
                        <th className="text-left py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>Department</th>
                        <th className="text-right py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>Headcount</th>
                        <th className="text-right py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>Turnover</th>
                        <th className="text-right py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnoverByDepartment.map((dept) => (
                        <tr key={dept.department} style={{ borderBottom: `1px solid ${COLORS.gray[50]}` }}>
                          <td className="py-4">
                            <span className="text-sm" style={{ color: COLORS.gray[900] }}>{dept.department}</span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-sm" style={{ color: COLORS.gray[600] }}>{dept.headcount}</span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-sm font-medium" style={{ color: COLORS.negative }}>{dept.turnover}</span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-sm font-medium px-2 py-1 rounded" style={{ backgroundColor: COLORS.gray[100], color: COLORS.gray[700] }}>
                              {dept.rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-center py-8" style={{ color: COLORS.gray[400] }}>No department data available</p>
                )}
              </div>
            </div>
          )}

          {/* Demographics Tab */}
          {activeTab === 'demographics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Headcount Chart */}
                <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Headcount by Role</h3>
                  {turnoverByDepartment.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={turnoverByDepartment.slice(0, 5)} layout="vertical" margin={{ left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[100]} horizontal={true} vertical={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.gray[400] }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="department" type="category" tick={{ fontSize: 11, fill: COLORS.gray[500] }} width={80} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${COLORS.gray[200]}`, boxShadow: 'none' }} />
                        <Bar dataKey="headcount" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-center py-8" style={{ color: COLORS.gray[400] }}>No data</p>
                  )}
                </div>

                {/* Tenure */}
                <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Tenure Distribution</h3>
                  {tenureDistribution.some(t => t.count > 0) ? (
                    <div className="space-y-4">
                      {tenureDistribution.map((item, idx) => (
                        <div key={item.tenure}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm" style={{ color: COLORS.gray[600] }}>{item.tenure}</span>
                            <span className="text-sm font-medium" style={{ color: COLORS.gray[900] }}>{item.count}</span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ backgroundColor: COLORS.gray[100] }}>
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min((item.count / Math.max(...tenureDistribution.map(t => t.count), 1)) * 100, 100)}%`,
                                backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-center py-8" style={{ color: COLORS.gray[400] }}>No tenure data</p>
                  )}
                </div>

                {/* Gender */}
                <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Gender Distribution</h3>
                  {genderDistribution.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={genderDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                            {genderDistribution.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${COLORS.gray[200]}`, boxShadow: 'none' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-4">
                        {genderDistribution.map((item, idx) => (
                          <div key={item.name} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx] }}></div>
                            <span className="text-xs" style={{ color: COLORS.gray[500] }}>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-center py-8" style={{ color: COLORS.gray[400] }}>No data</p>
                  )}
                </div>
              </div>

              {/* Role Breakdown Table */}
              <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Role Status Breakdown</h3>
                {Object.keys(roleBreakdown).length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${COLORS.gray[100]}` }}>
                        <th className="text-left py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>Role</th>
                        <th className="text-center py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>Total</th>
                        <th className="text-center py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>Active</th>
                        <th className="text-center py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>New</th>
                        <th className="text-center py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>Leave</th>
                        <th className="text-center py-3 text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.gray[400] }}>Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(roleBreakdown).map(([role, data]) => (
                        <tr key={role} style={{ borderBottom: `1px solid ${COLORS.gray[50]}` }}>
                          <td className="py-4"><span className="text-sm" style={{ color: COLORS.gray[900] }}>{role}</span></td>
                          <td className="py-4 text-center"><span className="text-sm font-medium" style={{ color: COLORS.gray[900] }}>{data.count}</span></td>
                          <td className="py-4 text-center"><span className="text-sm" style={{ color: COLORS.gray[600] }}>{data.by_status['none'] || 0}</span></td>
                          <td className="py-4 text-center"><span className="text-sm" style={{ color: COLORS.gray[600] }}>{data.by_status['newly-hired'] || 0}</span></td>
                          <td className="py-4 text-center"><span className="text-sm" style={{ color: COLORS.gray[600] }}>{data.by_status['leave'] || 0}</span></td>
                          <td className="py-4 text-center"><span className="text-sm font-medium" style={{ color: COLORS.negative }}>{data.by_status['termination'] || 0}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-center py-8" style={{ color: COLORS.gray[400] }}>No role data from API</p>
                )}
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Response Trend Chart */}
              <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Response Trends</h3>
                {monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyTrends}>
                      <defs>
                        <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[100]} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.gray[400] }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: COLORS.gray[400] }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${COLORS.gray[200]}`, boxShadow: 'none' }} />
                      <Area type="monotone" dataKey="responses" stroke={COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorResponses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-center py-16" style={{ color: COLORS.gray[400] }}>No time series data available</p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Responses', value: totalResponses },
                  { label: 'Last 30 Days', value: last30Days },
                  { label: 'Satisfaction', value: `${satisfactionAvg}/5` },
                  { label: 'Training Score', value: `${trainingAvg}/5` },
                ].map((stat, idx) => (
                  <div key={idx} className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                    <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>{stat.label}</p>
                    <p className="text-3xl font-semibold" style={{ color: COLORS.gray[900] }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Survey Tab */}
          {activeTab === 'survey' && (
            <div className="space-y-6">
              {/* Survey Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Responses', value: totalResponses, sub: `${last30Days} recent` },
                  { label: 'Response Rate', value: `${responseRate}%`, sub: 'of employees' },
                  { label: 'Satisfaction', value: satisfactionAvg, sub: 'out of 5.0' },
                  { label: 'Training', value: trainingAvg, sub: 'out of 5.0' },
                ].map((stat, idx) => (
                  <div key={idx} className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                    <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>{stat.label}</p>
                    <p className="text-3xl font-semibold" style={{ color: COLORS.gray[900] }}>{stat.value}</p>
                    <p className="text-xs mt-1" style={{ color: COLORS.gray[400] }}>{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Category Scores */}
              <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Category Scores</h3>
                <div className="grid grid-cols-4 gap-4">
                  {defaultSurveyCategories.map((cat, idx) => (
                    <div key={cat.category} className="p-4 rounded-lg" style={{ backgroundColor: COLORS.gray[50] }}>
                      <p className="text-xs font-medium mb-2" style={{ color: COLORS.gray[500] }}>{cat.category}</p>
                      <p className="text-2xl font-semibold mb-2" style={{ color: COLORS.gray[900] }}>{cat.score}</p>
                      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: COLORS.gray[200] }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(cat.score / 5) * 100}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concerns & Praises */}
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Top Concerns</h3>
                  <div className="space-y-3">
                    {topConcerns.map((item, idx) => (
                      <div key={item.concern} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#fdf2f2', border: '1px solid #fecaca' }}>
                        <span className="text-sm font-semibold w-5" style={{ color: COLORS.negative }}>{idx + 1}</span>
                        <span className="text-sm flex-1" style={{ color: COLORS.gray[700] }}>{item.concern}</span>
                        <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#fee2e2', color: COLORS.negative }}>
                          {item.mentions}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <h3 className="text-sm font-medium mb-6" style={{ color: COLORS.gray[900] }}>Top Praises</h3>
                  <div className="space-y-3">
                    {topPraises.map((item, idx) => (
                      <div key={item.praise} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: COLORS.gray[50] }}>
                        <span className="text-sm font-semibold w-5" style={{ color: COLORS.gray[400] }}>{idx + 1}</span>
                        <span className="text-sm flex-1" style={{ color: COLORS.gray[700] }}>{item.praise}</span>
                        <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: COLORS.gray[200], color: COLORS.gray[600] }}>
                          {item.mentions}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
