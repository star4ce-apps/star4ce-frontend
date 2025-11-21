'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';

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

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [averages, setAverages] = useState<AnalyticsAverages | null>(null);
  const [roleBreakdown, setRoleBreakdown] = useState<RoleBreakdown>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

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

      // Load summary
      const summaryRes = await fetch(`${API_BASE}/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const summaryData = await summaryRes.json();
      if (summaryRes.ok) {
        setSummary(summaryData);
      }

      // Load averages
      const averagesRes = await fetch(`${API_BASE}/analytics/averages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const averagesData = await averagesRes.json();
      if (averagesRes.ok) {
        setAverages(averagesData);
      }

      // Load role breakdown
      const breakdownRes = await fetch(`${API_BASE}/analytics/role-breakdown`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const breakdownData = await breakdownRes.json();
      if (breakdownRes.ok) {
        setRoleBreakdown(breakdownData.breakdown || {});
      }
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-base" style={{ color: '#6B7280' }}>Loading analytics...</p>
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
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Our Performance</h1>
              <p className="text-base" style={{ color: '#6B7280' }}>View detailed analytics and performance metrics</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {summary?.message && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <p className="text-sm font-medium" style={{ color: '#92400E' }}>{summary.message}</p>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Total Responses</p>
              <p className="text-3xl font-bold" style={{ color: '#232E40' }}>{summary?.total_responses || 0}</p>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Last 30 Days</p>
              <p className="text-3xl font-bold" style={{ color: '#232E40' }}>{summary?.last_30_days || 0}</p>
            </div>
            {summary?.total_dealerships !== undefined && (
              <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Dealerships</p>
                <p className="text-3xl font-bold" style={{ color: '#232E40' }}>{summary.total_dealerships}</p>
              </div>
            )}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Satisfaction Avg</p>
              <p className="text-3xl font-bold" style={{ color: '#232E40' }}>
                {averages?.satisfaction_avg ? averages.satisfaction_avg.toFixed(1) : '0.0'}
              </p>
            </div>
          </div>

          {/* Status Breakdown */}
          {summary?.by_status && (
            <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#232E40' }}>Status Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Newly Hired</p>
                  <p className="text-2xl font-bold" style={{ color: '#232E40' }}>{summary.by_status['newly-hired'] || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Termination</p>
                  <p className="text-2xl font-bold" style={{ color: '#232E40' }}>{summary.by_status['termination'] || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Leave</p>
                  <p className="text-2xl font-bold" style={{ color: '#232E40' }}>{summary.by_status['leave'] || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>None</p>
                  <p className="text-2xl font-bold" style={{ color: '#232E40' }}>{summary.by_status['none'] || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Role Breakdown */}
          {Object.keys(roleBreakdown).length > 0 && (
            <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#232E40' }}>Role Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B7280' }}>Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B7280' }}>Total</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B7280' }}>Newly Hired</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B7280' }}>Termination</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B7280' }}>Leave</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B7280' }}>None</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(roleBreakdown).map(([role, data]) => (
                      <tr key={role} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium" style={{ color: '#232E40' }}>{role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{data.count}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{data.by_status['newly-hired'] || 0}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{data.by_status['termination'] || 0}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{data.by_status['leave'] || 0}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{data.by_status['none'] || 0}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Averages Section */}
          {averages && (
            <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#232E40' }}>Average Scores</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Satisfaction Average</p>
                  <p className="text-3xl font-bold" style={{ color: '#232E40' }}>
                    {averages.satisfaction_avg.toFixed(1)}/5
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    Based on {averages.total_responses} responses
                  </p>
                </div>
                {averages.training_avg > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Training Average</p>
                    <p className="text-3xl font-bold" style={{ color: '#232E40' }}>
                      {averages.training_avg.toFixed(1)}/5
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                      Based on {averages.total_responses} responses
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!summary && !averages && Object.keys(roleBreakdown).length === 0 && (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-base" style={{ color: '#9CA3AF' }}>
                No analytics data available yet.
              </p>
              <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                Analytics will appear here once survey responses are collected.
              </p>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}

