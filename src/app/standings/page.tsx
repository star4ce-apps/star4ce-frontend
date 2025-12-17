'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';

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
  city: string;
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
  const itemsPerPage = 20;

  // Mock data
  const [dealerships] = useState<Dealership[]>([
    { standing: 1, dealership: 'Toyota', city: 'Orange', retentionRate: 92.9, turnoverRate: 8.1, retentionChange: 38.9, turnoverChange: -38.9, isCurrent: false },
    { standing: 2, dealership: 'AutoNation Honda', city: 'Irvine', retentionRate: 90, turnoverRate: 10, retentionChange: 36, turnoverChange: -36, isCurrent: false },
    { standing: 3, dealership: 'Honda', city: 'Irvine', retentionRate: 88, turnoverRate: 12, retentionChange: 34, turnoverChange: -34, isCurrent: false },
    { standing: 4, dealership: 'BMW', city: 'Costa Mesa', retentionRate: 88.5, turnoverRate: 11.5, retentionChange: 34.5, turnoverChange: -34.5, isCurrent: true },
    { standing: 5, dealership: 'Norm Reeves Honda', city: 'Orange', retentionRate: 80, turnoverRate: 20, retentionChange: 26, turnoverChange: -26, isCurrent: false },
    { standing: 6, dealership: 'Supreme Motors', city: 'Newport Beach', retentionRate: 78.8, turnoverRate: 21.2, retentionChange: 24.8, turnoverChange: -24.8, isCurrent: false },
    { standing: 7, dealership: 'Mercedes-Benz', city: 'Irvine', retentionRate: 75, turnoverRate: 25, retentionChange: 21, turnoverChange: -21, isCurrent: false },
    { standing: 8, dealership: 'Lexus', city: 'Newport Beach', retentionRate: 72, turnoverRate: 28, retentionChange: 18, turnoverChange: -18, isCurrent: false },
    { standing: 9, dealership: 'Audi', city: 'Irvine', retentionRate: 70, turnoverRate: 30, retentionChange: 16, turnoverChange: -16, isCurrent: false },
    { standing: 10, dealership: 'Ford', city: 'Orange', retentionRate: 68, turnoverRate: 32, retentionChange: 14, turnoverChange: -14, isCurrent: false },
    { standing: 11, dealership: 'Chevrolet', city: 'Costa Mesa', retentionRate: 65, turnoverRate: 35, retentionChange: 11, turnoverChange: -11, isCurrent: false },
    { standing: 12, dealership: 'Nissan', city: 'Irvine', retentionRate: 62, turnoverRate: 38, retentionChange: 8, turnoverChange: -8, isCurrent: false },
    { standing: 13, dealership: 'Hyundai', city: 'Orange', retentionRate: 58, turnoverRate: 42, retentionChange: 4, turnoverChange: -4, isCurrent: false },
    { standing: 14, dealership: 'Kia', city: 'Newport Beach', retentionRate: 55, turnoverRate: 45, retentionChange: 1, turnoverChange: -1, isCurrent: false },
    { standing: 15, dealership: 'Mazda', city: 'Irvine', retentionRate: 52, turnoverRate: 48, retentionChange: -2, turnoverChange: 2, isCurrent: false },
    { standing: 16, dealership: 'Subaru', city: 'Orange', retentionRate: 48, turnoverRate: 52, retentionChange: -6, turnoverChange: 6, isCurrent: false },
    { standing: 17, dealership: 'Volkswagen', city: 'Costa Mesa', retentionRate: 45, turnoverRate: 55, retentionChange: -9, turnoverChange: 9, isCurrent: false },
    { standing: 18, dealership: 'Auto Center', city: 'Orange', retentionRate: 40, turnoverRate: 60, retentionChange: -14, turnoverChange: 14, isCurrent: false },
    { standing: 19, dealership: 'Auto Republic', city: 'Irvine', retentionRate: 36, turnoverRate: 64, retentionChange: -18, turnoverChange: 18, isCurrent: false },
    { standing: 20, dealership: 'Majano Enterprise', city: 'Buena Park', retentionRate: 20, turnoverRate: 80, retentionChange: -34, turnoverChange: 34, isCurrent: false },
  ]);

  const currentDealership = dealerships.find(d => d.isCurrent);
  const allDealershipRetention = 54;
  const allDealershipTurnover = 46;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredDealerships = dealerships.filter(d => 
    d.dealership.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>Your Standing</div>
              <div className="text-2xl font-semibold" style={{ color: COLORS.gray[900] }}>
                {currentDealership?.standing || 4}th
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>Your Retention Rate</div>
              <div className="text-2xl font-semibold" style={{ color: COLORS.success }}>
                {currentDealership?.retentionRate || 88.5}%
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>Your Turnover Rate</div>
              <div className="text-2xl font-semibold" style={{ color: COLORS.negative }}>
                {currentDealership?.turnoverRate || 11.5}%
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>All Retention Avg</div>
              <div className="text-2xl font-semibold" style={{ color: COLORS.gray[900] }}>
                {allDealershipRetention}%
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>All Turnover Avg</div>
              <div className="text-2xl font-semibold" style={{ color: COLORS.gray[900] }}>
                {allDealershipTurnover}%
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
                          <span 
                            className="text-[11px] font-medium"
                            style={{ color: dealership.retentionChange >= 0 ? '#22c55e' : '#ef4444' }}
                          >
                            {dealership.retentionChange >= 0 ? '+' : ''}{dealership.retentionChange}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{dealership.turnoverRate}%</span>
                          <span 
                            className="text-[11px] font-medium"
                            style={{ color: dealership.turnoverChange <= 0 ? '#22c55e' : '#ef4444' }}
                          >
                            {dealership.turnoverChange >= 0 ? '+' : ''}{dealership.turnoverChange}%
                          </span>
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
