'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth } from '@/lib/http';

// Modern color palette - matching surveys page
const COLORS = {
  primary: '#3B5998',
  negative: '#e74c3c',
  success: '#22C55E',
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

type Dealership = {
  standing: number;
  dealership: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  retentionRate: number;
  turnoverRate: number;
  retentionChange: number;
  turnoverChange: number;
  isCurrent: boolean;
};

export default function StandingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>('standing');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [overallRetention, setOverallRetention] = useState(0);
  const [overallTurnover, setOverallTurnover] = useState(0);
  const [selectedDealershipId, setSelectedDealershipId] = useState<number | null>(null);
  const itemsPerPage = 20;

  // Load user role and standings data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Load user role
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json().catch(() => ({}));
            const role = data.user?.role || data.role || null;
            setUserRole(role);
            
            // Only load standings if corporate user
            if (role === 'corporate') {
              await loadStandings();
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    }
    
    async function loadStandings() {
      try {
        const data = await getJsonAuth(`/analytics/dealership-standings`);
        
        if (data && data.ok && Array.isArray(data.standings)) {
          // Get selected dealership ID from localStorage or header
          const storedDealershipId = localStorage.getItem('selectedDealershipId');
          const dealershipId = storedDealershipId ? parseInt(storedDealershipId, 10) : null;
          setSelectedDealershipId(dealershipId);
          
          // Transform API data (all from dealership row) to frontend format
          const transformedStandings: Dealership[] = data.standings.map((s: any) => ({
            standing: s.standing,
            dealership: s.dealership || '',
            address: s.address || '',
            city: s.city || '',
            state: s.state || '',
            zip_code: s.zip_code || '',
            retentionRate: s.retentionRate,
            turnoverRate: s.turnoverRate,
            retentionChange: 0,
            turnoverChange: 0,
            isCurrent: s.dealership_id === dealershipId,
          }));
          
          setDealerships(transformedStandings);
          setOverallRetention(data.overall_retention || 0);
          setOverallTurnover(data.overall_turnover || 0);
        } else {
          setDealerships([]);
        }
      } catch (err) {
        console.error('Error loading standings:', err);
        setDealerships([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const currentDealership = dealerships.find(d => d.isCurrent);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredDealerships = dealerships.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      d.dealership.toLowerCase().includes(q) ||
      (d.address || '').toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      (d.state || '').toLowerCase().includes(q) ||
      (d.zip_code || '').toLowerCase().includes(q)
    );
  });

  const sortedDealerships = [...filteredDealerships].sort((a, b) => {
    let aVal: number | string = a[sortColumn as keyof Dealership] as number | string;
    let bVal: number | string = b[sortColumn as keyof Dealership] as number | string;

    if (sortColumn === 'dealership' || sortColumn === 'city') {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedDealerships.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDealerships = sortedDealerships.slice(startIndex, endIndex);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#232E40' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1 flex items-center justify-center" style={{ maxWidth: 'calc(100vw - 256px)' }}>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
              <p style={{ color: COLORS.gray[500] }}>Loading...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  // Only allow corporate users to view this page
  if (userRole !== 'corporate') {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#F59E0B' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3" style={{ color: COLORS.gray[900] }}>Access Restricted</h2>
              <p className="text-sm mb-1" style={{ color: COLORS.gray[500] }}>
                This page is only available to corporate users.
              </p>
              <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                Please contact your administrator if you believe you should have access.
              </p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  // Show message if no dealerships assigned
  if (!loading && dealerships.length === 0) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#3B5998' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3" style={{ color: COLORS.gray[900] }}>No Dealerships Assigned</h2>
              <p className="text-sm mb-1" style={{ color: COLORS.gray[500] }}>
                You don't have access to any dealerships yet.
              </p>
              <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                Please request access to dealerships from administrators.
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
        <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Dealership Standings</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Compare workforce stability, retention, and turnover metrics across dealerships.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards - Condensed */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>All Retention Avg</div>
              <div className="text-2xl font-semibold" style={{ color: COLORS.gray[900] }}>
                {overallRetention}%
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>All Turnover Avg</div>
              <div className="text-2xl font-semibold" style={{ color: COLORS.gray[900] }}>
                {overallTurnover}%
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 flex justify-end">
            <div className="relative" style={{ maxWidth: '320px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dealerships..."
                className="w-full text-sm rounded-lg px-4 py-2 pl-10" 
                style={{ border: `1px solid ${COLORS.gray[200]}`, color: COLORS.gray[700], backgroundColor: '#fff' }}
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#9CA3AF' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Data Table - Condensed */}
          <div className="rounded-lg p-6 transition-all duration-200" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
          }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th 
                      className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-70 transition-opacity"
                      style={{ color: '#6B7280' }}
                      onClick={() => handleSort('standing')}
                    >
                      <div className="flex items-center gap-1">
                        Standing
                        <SortIcon column="standing" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-70 transition-opacity"
                      style={{ color: '#6B7280' }}
                      onClick={() => handleSort('dealership')}
                    >
                      <div className="flex items-center gap-1">
                        Dealership
                        <SortIcon column="dealership" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-70 transition-opacity"
                      style={{ color: '#6B7280' }}
                      onClick={() => handleSort('city')}
                    >
                      <div className="flex items-center gap-1">
                        City
                        <SortIcon column="city" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-70 transition-opacity"
                      style={{ color: '#6B7280' }}
                      onClick={() => handleSort('retentionRate')}
                    >
                      <div className="flex items-center gap-1">
                        Retention Rate
                        <SortIcon column="retentionRate" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-70 transition-opacity"
                      style={{ color: '#6B7280' }}
                      onClick={() => handleSort('turnoverRate')}
                    >
                      <div className="flex items-center gap-1">
                        Turnover Rate
                        <SortIcon column="turnoverRate" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDealerships.map((dealership, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-gray-50 transition-colors"
                      style={{ 
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: dealership.isCurrent ? '#FEF3C7' : 'transparent'
                      }}
                    >
                      <td className="py-2.5 px-3 text-sm font-semibold" style={{ color: '#232E40' }}>{dealership.standing}</td>
                      <td className="py-2.5 px-3 text-sm font-semibold" style={{ color: '#232E40' }}>{dealership.dealership}</td>
                      <td className="py-2.5 px-3 text-sm" style={{ color: '#6B7280' }}>{dealership.city}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{dealership.retentionRate}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{dealership.turnoverRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - Condensed */}
            <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Showing {startIndex + 1} to {Math.min(endIndex, sortedDealerships.length)} of {sortedDealerships.length} entries
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
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
                    let pageNum;
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
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-gray-50"
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
                  className="px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
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
        </main>
      </div>
    </RequireAuth>
  );
}
