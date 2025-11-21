'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';

type Employee = {
  id: number;
  name: string;
  department: string;
  lastReview: string;
  status: 'Overdue' | 'Due' | 'Completed';
  reviewDate?: string;
};

export default function EmployeePerformancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // TODO: Replace with real employee performance data from API
  // NOTE: Performance review API endpoint does not exist yet
  // This is mock data - remove once API is implemented
  const [employees] = useState<Employee[]>([]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const overdueEmployees = employees.filter(emp => emp.status === 'Overdue');
  const upcomingReviews = employees.filter(emp => emp.status === 'Completed' && emp.reviewDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Overdue':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'Due':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'Completed':
        return { bg: '#D1FAE5', text: '#065F46' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const departments = Array.from(new Set(employees.map(emp => emp.department)));

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Performance Reviews</h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Easily track which employees are due for evaluations, receive reminders for upcoming reviews, and monitor progress to support growth and accountability.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="rounded-lg p-4 transition-all duration-200 hover:shadow-md" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
            }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Employees needing review</div>
              <div className="text-3xl font-bold" style={{ color: '#232E40', lineHeight: '1' }}>3</div>
            </div>

            <div className="rounded-lg p-4 transition-all duration-200 hover:shadow-md" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
            }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Upcoming Reviews (Next 30 Days)</div>
              <div className="text-3xl font-bold" style={{ color: '#232E40', lineHeight: '1' }}>18</div>
            </div>

            <div className="rounded-lg p-4 transition-all duration-200 hover:shadow-md" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
            }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Average Employee Performance Score</div>
              <div className="text-3xl font-bold" style={{ color: '#232E40', lineHeight: '1' }}>3.6</div>
            </div>
          </div>

          {/* Main Content - Two Columns */}
          <div className="grid grid-cols-3 gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
            {/* Left: Employees Table */}
            <div className="rounded-lg p-6 transition-all duration-200" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
            }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#232E40' }}>Employees</h2>
              
              {/* Search and Filter */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full text-sm rounded-full px-4 py-2 pl-10" 
                    style={{ border: '1px solid #E5E7EB', color: '#374151', backgroundColor: '#FFFFFF' }}
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
                <div className="relative">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="text-sm py-2.5 appearance-none cursor-pointer rounded-lg"
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
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ paddingRight: '0.5rem' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                      <th className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Name</th>
                      <th className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Department</th>
                      <th className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Last Review</th>
                      <th className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.map((emp) => {
                      const statusColors = getStatusColor(emp.status);
                      return (
                        <tr 
                          key={emp.id} 
                          className="hover:bg-gray-50 transition-colors"
                          style={{ 
                            borderBottom: '1px solid #F3F4F6'
                          }}
                        >
                          <td className="py-3 px-3 text-sm font-semibold" style={{ color: '#232E40' }}>{emp.name}</td>
                          <td className="py-3 px-3 text-sm" style={{ color: '#374151' }}>{emp.department}</td>
                          <td className="py-3 px-3 text-sm" style={{ color: '#374151' }}>{emp.lastReview}</td>
                          <td className="py-3 px-3">
                            <span 
                              className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                              style={{ 
                                backgroundColor: statusColors.bg,
                                color: statusColors.text
                              }}
                            >
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
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
                <button
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{ 
                    border: '1px solid #E5E7EB',
                    color: '#FFFFFF',
                    backgroundColor: '#4D6DBE'
                  }}
                >
                  1
                </button>
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

            {/* Right: Reminders Card */}
            <div className="rounded-lg p-6 transition-all duration-200" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
            }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#232E40' }}>Reminders</h2>
              
              {/* Overdue Reminders */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Overdue Reminders</h3>
                <div className="space-y-2">
                  {overdueEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
                      <span className="text-sm" style={{ color: '#232E40' }}>{emp.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Reviews */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Upcoming Reviews</h3>
                <div className="space-y-2">
                  {upcomingReviews.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#232E40' }}>{emp.name}</span>
                      <span className="text-sm" style={{ color: '#6B7280' }}>{emp.reviewDate}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Review Button */}
              <button
                className="w-full px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: '#4D6DBE' }}
              >
                Start Review
              </button>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
