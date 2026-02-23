'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken, getSelectedDealershipId } from '@/lib/auth';
import { getJsonAuth, deleteJsonAuth, postJsonAuth } from '@/lib/http';
import toast from 'react-hot-toast';

// Modern color palette - matching surveys page
const COLORS = {
  primary: '#3B5998',
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

type HistoryEntry = {
  id: number | string;
  type: 'employee' | 'candidate';
  name: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  changedBy: string;
  timestamp: string;
  department?: string;
  reason?: string; // For terminations
  termination_date?: string; // For terminations
  reverted?: boolean; // Whether this entry has been reverted
  revertedBy?: string; // Who reverted it
  revertedAt?: string; // When it was reverted
};

export default function EmployeeRoleHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [currentPage, setCurrentPage] = useState(1);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  // Load role history from API
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    loadRoleHistory();
  }, [selectedType, selectedAction]);

  async function loadRoleHistory() {
    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }
      
      // Build query params
      const params = new URLSearchParams();
      params.append('limit', '500'); // Get enough entries
      if (selectedType !== 'All Types') {
        // Map "Employee" -> "employee", "Candidate" -> "candidate"
        const typeMap: { [key: string]: string } = {
          'Employee': 'employee',
          'Candidate': 'candidate'
        };
        params.append('type', typeMap[selectedType] || selectedType.toLowerCase());
      }
      // Note: Action filter is handled on frontend after receiving all entries
      // because backend action names don't match frontend display names
      
      // Use getJsonAuth to include X-Dealership-Id header for corporate users
      const data = await getJsonAuth<{ ok: boolean; entries: HistoryEntry[] }>(`/role-history?${params.toString()}`);
      let entries: HistoryEntry[] = [];
      
      if (data.ok && data.entries) {
        entries = data.entries;
      }

      // Also load terminations and merge them
      try {
        let terminationData: any = null;
        try {
          terminationData = await getJsonAuth('/terminations');
        } catch (e: any) {
          // If endpoint doesn't exist (404), try role history with termination filter
          if (e.message?.includes('404') || e.message?.includes('Failed')) {
            terminationData = await getJsonAuth('/role-history?action=terminated&limit=500');
          } else {
            throw e;
          }
        }

        if (terminationData) {
          let terminations: any[] = [];
          
          if (terminationData.terminations) {
            terminations = terminationData.terminations;
          } else if (terminationData.entries) {
            terminations = terminationData.entries.filter((entry: any) => 
              entry.action?.toLowerCase().includes('terminat') || 
              entry.newValue?.toLowerCase().includes('terminat')
            );
          }

          // Convert terminations to history entries
          const terminationEntries: HistoryEntry[] = terminations.map((term: any) => ({
            id: `term-${term.id || term.employee_id || Date.now()}`,
            type: 'employee' as const,
            name: term.employee_name || term.name || 'Unknown Employee',
            action: 'Terminated',
            previousValue: term.previous_status || 'Active',
            newValue: 'Terminated',
            changedBy: term.terminated_by || term.changedBy || 'Unknown',
            timestamp: term.termination_date || term.timestamp || term.created_at,
            department: term.department,
            reason: term.reason || term.comment,
            termination_date: term.termination_date || term.timestamp,
          }));

          // Merge and deduplicate (prefer termination entries if duplicate)
          const allEntries = [...entries, ...terminationEntries];
          const uniqueEntries = allEntries.reduce((acc, entry) => {
            const existing = acc.find(e => 
              e.name === entry.name && 
              e.action === entry.action && 
              Math.abs(new Date(e.timestamp).getTime() - new Date(entry.timestamp).getTime()) < 60000 // Within 1 minute
            );
            if (!existing) {
              acc.push(entry);
            } else if (entry.action === 'Terminated' && existing.action !== 'Terminated') {
              // Replace with termination entry if it's more specific
              const index = acc.indexOf(existing);
              acc[index] = entry;
            }
            return acc;
          }, [] as HistoryEntry[]);

          setHistoryEntries(uniqueEntries);
        } else {
          setHistoryEntries(entries);
        }
      } catch (terminationErr) {
        // If termination loading fails, just use role history
        console.error('Failed to load terminations:', terminationErr);
        setHistoryEntries(entries);
      }
    } catch (err) {
      console.error('Failed to load role history:', err);
      setError('Failed to load role history. Please try again.');
      setHistoryEntries([]);
    } finally {
      setLoading(false);
    }
  }

  // Use API data
  const entriesToFilter = historyEntries;

  const filteredEntries = entriesToFilter.filter(entry => {
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

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

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

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    if (sortColumn === 'name' || sortColumn === 'action' || sortColumn === 'previousValue' || sortColumn === 'newValue' || sortColumn === 'department' || sortColumn === 'changedBy') {
      aVal = String(a[sortColumn as keyof HistoryEntry] || '').toLowerCase();
      bVal = String(b[sortColumn as keyof HistoryEntry] || '').toLowerCase();
    } else if (sortColumn === 'type') {
      aVal = a.type.toLowerCase();
      bVal = b.type.toLowerCase();
    } else if (sortColumn === 'timestamp') {
      aVal = new Date(a.timestamp).getTime();
      bVal = new Date(b.timestamp).getTime();
    } else {
      aVal = String(a[sortColumn as keyof HistoryEntry] || '');
      bVal = String(b[sortColumn as keyof HistoryEntry] || '');
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
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


  const actions = Array.from(new Set(entriesToFilter.map(entry => entry.action)));

  async function handleRevert(entry: HistoryEntry) {
    
    // Cannot revert candidate creation or termination
    if (entry.action === 'Candidate Created' || entry.action === 'Terminated') {
      toast.error(`Cannot revert ${entry.action}`);
      return;
    }
    
    // Employee Created (including hired-from-candidate): confirm and call backend revert
    if (entry.action === 'Employee Created') {
      if (!window.confirm(`Are you sure you want to revert adding "${entry.name}" as an employee?\n\nThis will remove them from the employee list. If they were hired from a candidate, they will be restored to the candidate list.`)) {
        return;
      }
      try {
        const data = await postJsonAuth<{ ok?: boolean; error?: string; message?: string }>('/role-history/revert', {
          id: entry.id,
          type: entry.type,
          name: entry.name,
          action: entry.action,
          previousValue: entry.previousValue,
          newValue: entry.newValue,
        });
        toast.success(data.message || 'Revert successful');
        await loadRoleHistory();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to revert';
        toast.error(msg);
      }
      return;
    }
    
    // Need previous value to revert (for other actions)
    if (!entry.previousValue || entry.previousValue === '—' || entry.previousValue === 'N/A') {
      toast.error('Cannot revert - previous value not available');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to revert "${entry.action}" for ${entry.name}?`)) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        toast.error('Not logged in');
        return;
      }
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const dealershipId = getSelectedDealershipId();
      if (dealershipId) headers['X-Dealership-Id'] = String(dealershipId);
      
      const res = await fetch(`${API_BASE}/role-history/revert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: entry.id,
          type: entry.type,
          name: entry.name,
          action: entry.action,
          previousValue: entry.previousValue,
          newValue: entry.newValue,
        }),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to revert change');
      }
      
      toast.success(data.message || 'Change reverted successfully');
      
      // Reload history to show updated data
      await loadRoleHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revert change';
      toast.error(msg);
    }
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
        <HubSidebar />
        <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)', overflow: 'visible' }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Role History</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Track all role, department, and status changes for employees and candidates.
                </p>
              </div>
            </div>
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
                  backgroundColor: '#FFFFFF'
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

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* History Log Table */}
          <div className="rounded-xl p-6 transition-all duration-200" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            overflow: 'visible'
          }}>
            {loading ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3B5998', borderTopColor: 'transparent' }}></div>
                  <p className="text-sm" style={{ color: '#6B7280' }}>Loading role history...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ overflowY: 'visible' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#4D6DBE' }}>
                      <th 
                        className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center gap-1.5">
                          Type
                          <SortIcon column="type" />
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1.5">
                          Name
                          <SortIcon column="name" />
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                        onClick={() => handleSort('action')}
                      >
                        <div className="flex items-center gap-1.5">
                          Action
                          <SortIcon column="action" />
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                        onClick={() => handleSort('previousValue')}
                      >
                        <div className="flex items-center gap-1.5">
                          Previous Value
                          <SortIcon column="previousValue" />
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                        onClick={() => handleSort('newValue')}
                      >
                        <div className="flex items-center gap-1.5">
                          New Value
                          <SortIcon column="newValue" />
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                        onClick={() => handleSort('department')}
                      >
                        <div className="flex items-center gap-1.5">
                          Department
                          <SortIcon column="department" />
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                        onClick={() => handleSort('changedBy')}
                      >
                        <div className="flex items-center gap-1.5">
                          Changed By
                          <SortIcon column="changedBy" />
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                        onClick={() => handleSort('timestamp')}
                      >
                        <div className="flex items-center gap-1.5">
                          Timestamp
                          <SortIcon column="timestamp" />
                        </div>
                      </th>
                      <th className="text-right py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEntries.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>
                          {error ? 'Error loading history entries.' : 'No history entries found.'}
                        </td>
                      </tr>
                    ) : (
                    paginatedEntries.map((entry, index) => {
                      return (
                        <tr 
                          key={entry.id || `entry-${index}`} 
                          className="hover:bg-blue-50 transition-colors"
                          style={{ 
                            borderBottom: '1px solid #F3F4F6'
                          }}
                        >
                          <td className="py-3 px-4">
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
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>{entry.name}</td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>
                            <div className="flex items-center gap-2">
                              <span>{entry.action}</span>
                              {entry.reverted && (
                                <span 
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{ 
                                    backgroundColor: '#FEF3C7',
                                    color: '#92400E'
                                  }}
                                  title={`Reverted by ${entry.revertedBy || 'Unknown'} on ${entry.revertedAt ? new Date(entry.revertedAt).toLocaleString() : ''}`}
                                >
                                  Reverted
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>
                            {entry.previousValue || '—'}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>
                            {entry.newValue || '—'}
                            {entry.reason && entry.action === 'Terminated' && (
                              <div className="text-xs mt-1" style={{ color: '#6B7280', fontStyle: 'italic' }}>
                                Reason: {entry.reason}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>
                            {entry.department || '—'}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>{entry.changedBy}</td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>
                            {formatTimestamp(entry.timestamp)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="relative inline-block">
                              <button
                                onClick={() => handleRevert(entry)}
                                disabled={entry.action === 'Employee Created' || entry.action === 'Candidate Created' || entry.action === 'Terminated' || !entry.previousValue || entry.previousValue === '—' || entry.previousValue === 'N/A' || entry.reverted}
                                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ color: '#6B7280' }}
                                title="Revert this change"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                    )}
                  </tbody>
                </table>
              </div>
            )}

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