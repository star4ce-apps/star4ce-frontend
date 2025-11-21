'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type SummaryResponse = {
  ok: boolean;
  scope: 'admin' | 'corporate';
  total_dealerships?: number;
  total_answers: number;
  total_responses: number;
  last_30_days: number;
  dealership_id?: number;
  message?: string;
  by_status?: {
    'newly-hired': number;
    termination: number;
    leave: number;
    none: number;
  };
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('2025-09-01');
  const [endDate, setEndDate] = useState<string>('2025-09-22');
  const [dateRangePreset, setDateRangePreset] = useState<string>('This month');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');

  // TODO: These should come from the API summary response, not hardcoded
  // For now using 0 as default - replace with actual API data
  const [totalCandidates] = useState(0);
  const [totalEmployees] = useState(0);
  const [involuntaryLeave] = useState(0);
  const [voluntaryLeave] = useState(0);
  const [retentionRate] = useState(0);
  const [turnoverRate] = useState(0);

  // TODO: Replace with real survey feedback data from API
  const [surveyFeedbackData, setSurveyFeedbackData] = useState<Array<{ name: string; value: number; color: string }>>([]);

  // TODO: Replace with real feedback data from API endpoint
  const [recentFeedback, setRecentFeedback] = useState<Array<{ date: string; comment: string }>>([]);

  // TODO: Replace with real time-series data from /analytics/time-series API
  const [turnoverData, setTurnoverData] = useState<Array<{ month: string; turnover: number; retention: number }>>([]);

  // TODO: Replace with real department breakdown from /analytics/role-breakdown API
  const [departmentTableData, setDepartmentTableData] = useState<Array<{ department: string; leaveCount: number; retentionRate: number; turnoverRate: number; severity: string; severityColor: string }>>([]);

  // TODO: Replace with real terminated/quit data from API
  const [terminatedQuitData, setTerminatedQuitData] = useState<Array<{ name: string; value: number; percentage: number; color: string }>>([]);

  // TODO: Replace with real role breakdown data from /analytics/role-breakdown API
  const [terminatedByRole, setTerminatedByRole] = useState<Array<{ name: string; value: number; percentage: number; color: string }>>([]);
  const [quitByRole, setQuitByRole] = useState<Array<{ name: string; value: number; percentage: number; color: string }>>([]);

  const roleColors = ['#f97316', '#ef4444', '#84cc16', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError('Not signed in.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load analytics');
      }
      setSummary(data as SummaryResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  const handleDatePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'This month':
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

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Our Performance</h1>
              <p className="text-base" style={{ color: '#6B7280' }}>
                View the full statistics and data of your dealership's performance.
              </p>
            </div>
            <div className="flex justify-end">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8F9FA', border: '1px solid #E0E4E8' }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: '#374151', width: '120px' }}
                  />
                  <span className="text-sm" style={{ color: '#6B7280' }}>|</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: '#374151', width: '120px' }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={dateRangePreset}
                    onChange={(e) => handleDatePresetChange(e.target.value)}
                    className="text-sm py-2.5 appearance-none cursor-pointer rounded-lg"
                    style={{ 
                      border: '1px solid #E5E7EB', 
                      color: '#374151', 
                      backgroundColor: '#FFFFFF', 
                      paddingLeft: '1rem', 
                      paddingRight: '2.5rem',
                      minWidth: '140px'
                    }}
                  >
                    <option>This month</option>
                    <option>Month</option>
                    <option>3-Month</option>
                    <option>6-Month</option>
                    <option>Year</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
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
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Total Candidates</div>
              <div className="text-5xl font-bold mb-3" style={{ color: '#232E40', lineHeight: '1' }}>
                {totalCandidates}
              </div>
            </div>
            
            <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Total Employees</div>
              <div className="text-5xl font-bold mb-3" style={{ color: '#232E40', lineHeight: '1' }}>
                {totalEmployees}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                <span className="font-medium" style={{ color: '#059669' }}>+25.5%</span>
              </div>
            </div>
            
            <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Involuntary Leave</div>
              <div className="text-5xl font-bold mb-3" style={{ color: '#232E40', lineHeight: '1' }}>
                {involuntaryLeave}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                <span className="font-medium" style={{ color: '#F97316' }}>+12%</span>
              </div>
            </div>

            <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Voluntary Leave</div>
              <div className="text-5xl font-bold mb-3" style={{ color: '#232E40', lineHeight: '1' }}>
                {voluntaryLeave}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                <span className="font-medium" style={{ color: '#F97316' }}>+32%</span>
              </div>
            </div>

            <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Retention Rate</div>
              <div className="text-5xl font-bold mb-3" style={{ color: '#232E40', lineHeight: '1' }}>
                {retentionRate}%
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                <span className="font-medium" style={{ color: '#059669' }}>-6.2%</span>
              </div>
            </div>

            <div className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Turnover Rate</div>
              <div className="text-5xl font-bold mb-3" style={{ color: '#232E40', lineHeight: '1' }}>
                {turnoverRate}%
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                <span className="font-medium" style={{ color: '#059669' }}>-6.2%</span>
              </div>
            </div>
          </div>

          {/* Survey Feedback Section */}
          <div className="rounded-xl p-8 mb-8 transition-all duration-200 hover:shadow-lg" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Survey Feedback</h2>
              <a href="#" className="text-sm hover:underline" style={{ color: '#4D6DBE' }}>View more &gt;</a>
            </div>
            <div className="grid grid-cols-2 gap-8" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {/* Overall Satisfaction - Horizontal Bar Chart */}
              <div>
                <h3 className="text-base font-semibold mb-4" style={{ color: '#374151' }}>Overall Satisfaction</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                    <span className="text-sm" style={{ color: '#374151' }}>Positive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
                    <span className="text-sm" style={{ color: '#374151' }}>Neutral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                    <span className="text-sm" style={{ color: '#374151' }}>Negative</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={surveyFeedbackData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {surveyFeedbackData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Feedback */}
              <div>
                <h3 className="text-base font-semibold mb-4" style={{ color: '#374151' }}>Recent Feedback</h3>
                <div className="space-y-3">
                  {recentFeedback.map((item, idx) => (
                    <div key={idx} className="pb-3" style={{ borderBottom: idx < recentFeedback.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                      <div className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>{item.date}</div>
                      <div className="text-sm" style={{ color: '#374151' }}>{item.comment}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Turnover Report Section */}
          <div className="rounded-xl p-8 mb-8 transition-all duration-200 hover:shadow-lg" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Turnover Report</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8F9FA', border: '1px solid #E0E4E8' }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: '#374151', width: '120px' }}
                  />
                  <span className="text-sm" style={{ color: '#6B7280' }}>|</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: '#374151', width: '120px' }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="text-sm py-2 appearance-none cursor-pointer rounded-lg"
                    style={{ 
                      border: '1px solid #E5E7EB', 
                      color: '#374151', 
                      backgroundColor: '#FFFFFF', 
                      paddingLeft: '1rem', 
                      paddingRight: '2.5rem',
                      minWidth: '160px'
                    }}
                  >
                    <option>All Departments</option>
                    <option>Sales</option>
                    <option>Parts and Service</option>
                    <option>Office</option>
                    <option>Administration</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
              {/* Line Chart */}
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={turnoverData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
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
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="turnover" 
                      stroke="#4D6DBE" 
                      strokeWidth={3} 
                      dot={{ fill: '#4D6DBE', r: 4 }} 
                      activeDot={{ r: 6 }}
                      name="Turnover Rate"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="retention" 
                      stroke="#22c55e" 
                      strokeWidth={3} 
                      dot={{ fill: '#22c55e', r: 4 }} 
                      activeDot={{ r: 6 }}
                      name="Retention Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Current Rates Comparison */}
              <div>
                <div className="rounded-lg p-6 border mb-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#9CA3AF' }}>Current Rates</div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: '#374151' }}>Turnover Rate</span>
                        <span className="text-lg font-bold" style={{ color: '#4D6DBE' }}>65.2%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65.2%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: '#374151' }}>Retention Rate</span>
                        <span className="text-lg font-bold" style={{ color: '#22c55e' }}>34.8%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '34.8%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                    <div className="text-xs text-center" style={{ color: '#9CA3AF' }}>
                      Total: 100%
                    </div>
                  </div>
                </div>
              </div>

              {/* Forecast Box */}
              <div>
                <div className="rounded-lg p-6 border" style={{ backgroundColor: '#F8F9FA', borderColor: '#E5E7EB' }}>
                  <div className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>In the next...</div>
                  <div className="relative">
                    <select
                      className="text-sm py-2 appearance-none cursor-pointer w-full rounded-lg"
                      style={{ 
                        border: '1px solid #E5E7EB', 
                        color: '#374151', 
                        backgroundColor: '#FFFFFF', 
                        paddingLeft: '1rem', 
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option>6 months</option>
                      <option>3 months</option>
                      <option>1 year</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>Turnover Rate</div>
                      <div className="text-lg font-bold" style={{ color: '#ef4444' }}>↑12%</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>Retention Rate</div>
                      <div className="text-lg font-bold" style={{ color: '#22c55e' }}>↓8%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Distribution Section */}
          <div className="rounded-xl p-8 transition-all duration-200 hover:shadow-lg" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: '#232E40' }}>Role Distribution</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F8F9FA' }}>
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Department</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Employee Count</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Leave</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Terminated</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Turnover Rate (%)</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Retention Rate (%)</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold uppercase" style={{ color: '#6B7280' }}>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { department: 'Salespeople', employeeCount: 45, leave: 15, terminated: 15, turnoverRate: 67, retentionRate: 33, severity: 'High', severityColor: '#ef4444' },
                    { department: 'Office Staff', employeeCount: 37, leave: 12, terminated: 0, turnoverRate: 32.5, retentionRate: 67.5, severity: 'Moderate', severityColor: '#f97316' },
                    { department: 'Sales Manager', employeeCount: 18, leave: 5, terminated: 0, turnoverRate: 27, retentionRate: 73, severity: 'Low', severityColor: '#22c55e' },
                    { department: 'Technician', employeeCount: 15, leave: 3, terminated: 0, turnoverRate: 20, retentionRate: 80, severity: 'Low', severityColor: '#22c55e' },
                    { department: 'Receptionist', employeeCount: 12, leave: 2, terminated: 1, turnoverRate: 25, retentionRate: 75, severity: 'Low', severityColor: '#22c55e' },
                    { department: 'Finance Advisor', employeeCount: 8, leave: 1, terminated: 0, turnoverRate: 12.5, retentionRate: 87.5, severity: 'Low', severityColor: '#22c55e' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #E5E7EB' }}>
                      <td className="py-4 px-4 text-sm font-medium" style={{ color: '#374151' }}>{row.department}</td>
                      <td className="py-4 px-4 text-center text-sm" style={{ color: '#374151' }}>{row.employeeCount}</td>
                      <td className="py-4 px-4 text-center text-sm" style={{ color: '#374151' }}>{row.leave}</td>
                      <td className="py-4 px-4 text-center text-sm" style={{ color: '#374151' }}>{row.terminated}</td>
                      <td className="py-4 px-4 text-center text-sm font-semibold" style={{ color: '#374151' }}>{row.turnoverRate}%</td>
                      <td className="py-4 px-4 text-center text-sm font-semibold" style={{ color: '#374151' }}>{row.retentionRate}%</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-semibold" style={{ color: row.severityColor }}>{row.severity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
