'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

type TimeSeriesItem = {
  date: string;
  count: number;
};

type AveragesResponse = {
  ok: boolean;
  satisfaction_avg: number;
  training_avg: number;
  total_responses: number;
  satisfaction_count: number;
  training_count: number;
};

type RoleBreakdown = {
  [role: string]: {
    count: number;
    by_status: {
      'newly-hired': number;
      termination: number;
      leave: number;
      none: number;
    };
  };
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesItem[]>([]);
  const [averages, setAverages] = useState<AveragesResponse | null>(null);
  const [roleBreakdown, setRoleBreakdown] = useState<RoleBreakdown>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    loadAllData();
  }, [dateRange, groupBy]);

  async function loadAllData() {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError('Not signed in.');
      setLoading(false);
      return;
    }

    try {
      // Load all analytics data in parallel
      const [summaryRes, timeSeriesRes, averagesRes, breakdownRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/analytics/time-series?days=${dateRange}&group_by=${groupBy}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/analytics/averages`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/analytics/role-breakdown`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [summaryData, timeSeriesData, averagesData, breakdownData] = await Promise.all([
        summaryRes.json().catch(() => ({})),
        timeSeriesRes.json().catch(() => ({})),
        averagesRes.json().catch(() => ({})),
        breakdownRes.json().catch(() => ({})),
      ]);

      if (!summaryRes.ok) {
        throw new Error(summaryData.error || 'Failed to load analytics');
      }

      setSummary(summaryData as SummaryResponse);
      if (timeSeriesData.ok) {
        setTimeSeries(timeSeriesData.items || []);
      }
      if (averagesData.ok) {
        setAverages(averagesData as AveragesResponse);
      }
      if (breakdownData.ok) {
        setRoleBreakdown(breakdownData.breakdown || {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (groupBy === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Prepare role breakdown data for chart
  const roleChartData = Object.entries(roleBreakdown).map(([role, data]) => ({
    role: role.length > 20 ? role.substring(0, 20) + '...' : role,
    fullRole: role,
    count: data.count,
    newlyHired: data.by_status['newly-hired'],
    termination: data.by_status.termination,
    leave: data.by_status.leave,
    none: data.by_status.none,
  }));

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Analytics Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <select
              value={dateRange}
              onChange={e => setDateRange(Number(e.target.value))}
              className="cursor-pointer px-3 py-1 border rounded-lg text-sm w-full sm:w-auto"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
            </select>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
              className="cursor-pointer px-3 py-1 border rounded-lg text-sm w-full sm:w-auto"
            >
              <option value="day">By Day</option>
              <option value="week">By Week</option>
              <option value="month">By Month</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Loading analytics...</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm text-gray-600 mb-1">Total Responses</h3>
                <p className="text-2xl font-bold text-[#0B2E65]">
                  {summary?.total_responses || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary?.last_30_days || 0} in last 30 days
                </p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm text-gray-600 mb-1">Avg Satisfaction</h3>
                <p className="text-2xl font-bold text-emerald-600">
                  {averages?.satisfaction_avg ? averages.satisfaction_avg.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {averages?.satisfaction_count || 0} responses
                </p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-sm text-gray-600 mb-1">Avg Training Score</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {averages?.training_avg ? averages.training_avg.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {averages?.training_count || 0} responses
                </p>
              </div>
            </div>

            {/* Time Series Chart */}
            {timeSeries.length > 0 && (
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Responses Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={value => `Date: ${formatDate(value)}`}
                      formatter={(value: number) => [value, 'Responses']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0B2E65"
                      strokeWidth={2}
                      name="Survey Responses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Role Breakdown Chart */}
            {roleChartData.length > 0 && (
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Responses by Department</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roleChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="role"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newlyHired" stackId="a" fill="#10b981" name="Newly Hired" />
                    <Bar dataKey="termination" stackId="a" fill="#ef4444" name="Termination" />
                    <Bar dataKey="leave" stackId="a" fill="#f59e0b" name="Leave" />
                    <Bar dataKey="none" stackId="a" fill="#6b7280" name="None" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Status Breakdown */}
            {summary?.by_status && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Status Breakdown</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {summary.by_status['newly-hired'] || 0}
                    </p>
                    <p className="text-sm text-gray-600">Newly Hired</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {summary.by_status.termination || 0}
                    </p>
                    <p className="text-sm text-gray-600">Termination</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {summary.by_status.leave || 0}
                    </p>
                    <p className="text-sm text-gray-600">Leave</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {summary.by_status.none || 0}
                    </p>
                    <p className="text-sm text-gray-600">None</p>
                  </div>
                </div>
              </div>
            )}

            {/* Role Breakdown Table */}
            {roleChartData.length > 0 && (
              <div className="bg-white border rounded-lg p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4">Detailed Role Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Department</th>
                        <th className="px-4 py-2 text-center">Total</th>
                        <th className="px-4 py-2 text-center">Newly Hired</th>
                        <th className="px-4 py-2 text-center">Termination</th>
                        <th className="px-4 py-2 text-center">Leave</th>
                        <th className="px-4 py-2 text-center">None</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleChartData.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2 font-medium">{item.fullRole}</td>
                          <td className="px-4 py-2 text-center">{item.count}</td>
                          <td className="px-4 py-2 text-center text-emerald-600">
                            {item.newlyHired}
                          </td>
                          <td className="px-4 py-2 text-center text-red-600">
                            {item.termination}
                          </td>
                          <td className="px-4 py-2 text-center text-amber-600">{item.leave}</td>
                          <td className="px-4 py-2 text-center text-gray-600">{item.none}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </RequireAuth>
  );
}
