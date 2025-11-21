'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';

type HistoryEntry = {
  id: number;
  type: 'employee' | 'candidate';
  name: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  changedBy: string;
  timestamp: string;
  department?: string;
};

export default function EmployeeRoleHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const itemsPerPage = 20;

  // TODO: Replace with real audit log data from /audit-logs API endpoint
  // This is mock data - remove once connected to real API
  const [historyEntries] = useState<HistoryEntry[]>([
    {
      id: 1,
      type: 'employee',
      name: 'Alice Johnson',
      action: 'Role Changed',
      previousValue: 'Sales Associate',
      newValue: 'Senior Sales Manager',
      changedBy: 'John Smith',
      timestamp: '2025-09-20 14:32:15',
      department: 'Sales Department',
    },
    {
      id: 2,
      type: 'candidate',
      name: 'Michael Chen',
      action: 'Status Changed',
      previousValue: 'Interview Scheduled',
      newValue: 'Hired',
      changedBy: 'Sarah Williams',
      timestamp: '2025-09-20 11:15:42',
    },
    {
      id: 3,
      type: 'employee',
      name: 'Bob Smith',
      action: 'Department Changed',
      previousValue: 'Sales Department',
      newValue: 'Marketing Department',
      changedBy: 'John Smith',
      timestamp: '2025-09-19 16:45:30',
      department: 'Marketing Department',
    },
    {
      id: 4,
      type: 'employee',
      name: 'Catherine Lee',
      action: 'Role Changed',
      previousValue: 'Junior Developer',
      newValue: 'Software Engineer',
      changedBy: 'David Brown',
      timestamp: '2025-09-19 10:22:18',
      department: 'Development',
    },
    {
      id: 5,
      type: 'candidate',
      name: 'Emily Rodriguez',
      action: 'Status Changed',
      previousValue: 'Application Received',
      newValue: 'Interview Scheduled',
      changedBy: 'Sarah Williams',
      timestamp: '2025-09-18 09:30:55',
    },
    {
      id: 6,
      type: 'employee',
      name: 'David Brown',
      action: 'Department Changed',
      previousValue: 'IT Department',
      newValue: 'Development',
      changedBy: 'John Smith',
      timestamp: '2025-09-17 15:10:25',
      department: 'Development',
    },
    {
      id: 7,
      type: 'employee',
      name: 'Frank White',
      action: 'Role Changed',
      previousValue: 'IT Support Specialist',
      newValue: 'IT Manager',
      changedBy: 'John Smith',
      timestamp: '2025-09-16 13:55:40',
      department: 'IT Department',
    },
    {
      id: 8,
      type: 'candidate',
      name: 'James Wilson',
      action: 'Status Changed',
      previousValue: 'Interview Scheduled',
      newValue: 'Rejected',
      changedBy: 'Sarah Williams',
      timestamp: '2025-09-15 11:20:12',
    },
    {
      id: 9,
      type: 'employee',
      name: 'Eva Green',
      action: 'Role Changed',
      previousValue: 'Accountant',
      newValue: 'Senior Accountant',
      changedBy: 'John Smith',
      timestamp: '2025-09-14 08:45:33',
      department: 'Finance',
    },
    {
      id: 10,
      type: 'employee',
      name: 'Grace Black',
      action: 'Department Changed',
      previousValue: 'Customer Support',
      newValue: 'Sales Department',
      changedBy: 'John Smith',
      timestamp: '2025-09-13 14:12:07',
      department: 'Sales Department',
    },
    {
      id: 11,
      type: 'candidate',
      name: 'Robert Taylor',
      action: 'Status Changed',
      previousValue: 'Application Received',
      newValue: 'Interview Scheduled',
      changedBy: 'Sarah Williams',
      timestamp: '2025-09-12 10:30:20',
    },
    {
      id: 12,
      type: 'employee',
      name: 'Isabella Clark',
      action: 'Role Changed',
      previousValue: 'Research Assistant',
      newValue: 'Research Analyst',
      changedBy: 'David Brown',
      timestamp: '2025-09-11 16:25:45',
      department: 'Research',
    },
    {
      id: 13,
      type: 'employee',
      name: 'Henry Adams',
      action: 'Department Changed',
      previousValue: 'Logistics',
      newValue: 'Operations',
      changedBy: 'John Smith',
      timestamp: '2025-09-10 09:15:30',
      department: 'Operations',
    },
    {
      id: 14,
      type: 'candidate',
      name: 'Olivia Martinez',
      action: 'Status Changed',
      previousValue: 'Interview Scheduled',
      newValue: 'Hired',
      changedBy: 'Sarah Williams',
      timestamp: '2025-09-09 12:40:18',
    },
    {
      id: 15,
      type: 'employee',
      name: 'Sophia Taylor',
      action: 'Role Changed',
      previousValue: 'Administrative Coordinator',
      newValue: 'Office Manager',
      changedBy: 'John Smith',
      timestamp: '2025-09-08 11:22:55',
      department: 'Administration',
    },
  ]);

  const filteredEntries = historyEntries.filter(entry => {
    const matchesSearch = 
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.changedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'All Types' || 
      (selectedType === 'Employee' && entry.type === 'employee') ||
      (selectedType === 'Candidate' && entry.type === 'candidate');
    
    const matchesAction = selectedAction === 'All Actions' || entry.action === selectedAction;

    return matchesSearch && matchesType && matchesAction;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const actions = Array.from(new Set(historyEntries.map(entry => entry.action)));

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId !== null && !target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleRevert = (entry: HistoryEntry) => {
    // TODO: Implement revert functionality
    console.log('Reverting entry:', entry);
    setOpenMenuId(null);
    // Show success message
  };

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Role History</h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Track all role, department, and status changes for employees and candidates. View complete history logs with timestamps and change details.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1" style={{ maxWidth: '400px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, action, or changed by..."
                className="w-full text-sm rounded-full px-4 py-2.5 pl-10 transition-all focus:outline-none focus:ring-2" 
                style={{ 
                  border: '1px solid #E5E7EB', 
                  color: '#374151', 
                  backgroundColor: '#FFFFFF',
                  focusRingColor: '#4D6DBE'
                }}
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
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-sm py-2.5 appearance-none cursor-pointer transition-all rounded-lg"
                style={{ 
                  border: '1px solid #E5E7EB', 
                  color: '#374151', 
                  backgroundColor: '#FFFFFF', 
                  paddingLeft: '1rem', 
                  paddingRight: '2.5rem',
                  minWidth: '140px'
                }}
              >
                <option>All Types</option>
                <option>Employee</option>
                <option>Candidate</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="text-sm py-2.5 appearance-none cursor-pointer transition-all rounded-lg"
                style={{ 
                  border: '1px solid #E5E7EB', 
                  color: '#374151', 
                  backgroundColor: '#FFFFFF', 
                  paddingLeft: '1rem', 
                  paddingRight: '2.5rem',
                  minWidth: '160px'
                }}
              >
                <option>All Actions</option>
                {actions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* History Log Table */}
          <div className="rounded-lg p-6 transition-all duration-200" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
          }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#232E40' }}>Change History</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#4D6DBE' }}>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white">Type</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white">Name</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white">Action</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white">Previous Value</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white">New Value</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white">Department</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white">Changed By</th>
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white">Timestamp</th>
                    <th className="text-right py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>
                        No history entries found.
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((entry) => {
                      return (
                        <tr 
                          key={entry.id} 
                          className="hover:bg-blue-50 transition-colors"
                          style={{ 
                            borderBottom: '1px solid #F3F4F6'
                          }}
                        >
                          <td className="py-3.5 px-4">
                            <span 
                              className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                              style={{ 
                                backgroundColor: entry.type === 'employee' ? '#DBEAFE' : '#FEF3C7',
                                color: entry.type === 'employee' ? '#1E40AF' : '#92400E'
                              }}
                            >
                              {entry.type === 'employee' ? 'Employee' : 'Candidate'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-sm font-semibold" style={{ color: '#232E40' }}>{entry.name}</td>
                          <td className="py-3.5 px-4 text-sm font-medium" style={{ color: '#374151' }}>
                            {entry.action}
                          </td>
                          <td className="py-3.5 px-4 text-sm" style={{ color: '#6B7280' }}>
                            {entry.previousValue || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-sm font-semibold" style={{ color: '#232E40' }}>
                            {entry.newValue || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-sm" style={{ color: '#6B7280' }}>
                            {entry.department || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-sm font-medium" style={{ color: '#374151' }}>{entry.changedBy}</td>
                          <td className="py-3.5 px-4 text-sm" style={{ color: '#6B7280' }}>
                            {formatTimestamp(entry.timestamp)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="relative action-menu-container inline-block">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === entry.id ? null : entry.id)}
                                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                style={{ color: '#6B7280' }}
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                </svg>
                              </button>
                              {openMenuId === entry.id && (
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                  <button
                                    onClick={() => handleRevert(entry)}
                                    className="w-full text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
                                    style={{ color: '#374151' }}
                                  >
                                    Revert
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
              <div className="text-xs" style={{ color: '#6B7280' }}>
                Showing {startIndex + 1} to {Math.min(endIndex, sortedEntries.length)} of {sortedEntries.length} entries
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
