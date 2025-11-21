'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';

type PerformanceData = {
  id: number;
  employee_id: number;
  employee_name: string;
  period: string;
  rating: number;
  notes: string;
  created_at: string;
};

export default function PerformancePage() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  async function loadPerformanceData() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      // TODO: Replace with actual API endpoint when backend is ready
      // const res = await fetch(`${API_BASE}/employees/performance`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      // const data = await res.json();
      // if (res.ok) {
      //   setPerformanceData(data.performance || []);
      // } else {
      //   setError(data.error || 'Failed to load performance data');
      // }
      
      // Temporary: Empty array until API is ready
      setPerformanceData([]);
    } catch (err) {
      setError('Failed to load performance data');
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
              <p className="text-base" style={{ color: '#6B7280' }}>Loading performance data...</p>
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
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Performance Review</h1>
              <p className="text-base" style={{ color: '#6B7280' }}>View and manage employee performance reviews</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Performance Data */}
          <div className="rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
            {performanceData.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base" style={{ color: '#9CA3AF' }}>
                  No performance reviews available yet.
                </p>
                <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                  Performance reviews will appear here once they are created.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Employee</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Period</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Rating</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Notes</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((item) => (
                      <tr key={item.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td className="py-4 px-6">
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{item.employee_name}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{item.period}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{item.rating}/5</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{item.notes || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

