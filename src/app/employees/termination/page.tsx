'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

// Modern color palette - matching surveys page
const COLORS = {
  primary: '#3B5998',
  negative: '#e74c3c',
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

type Employee = {
  id: number;
  name: string;
  email: string;
  employee_id?: string;
  department: string;
  position: string | null;
  is_active: boolean;
  status?: string;
};

type ExitRecord = {
  id: number;
  employee_id: number;
  employee_name: string;
  exit_date: string;
  exit_type: 'termination' | 'resignation';
  reason: string;
  terminated_by?: string;
  resigned_by?: string;
  created_at: string;
  department?: string;
  position?: string;
};

type Manager = {
  id: number;
  name?: string;
  email: string;
  role: string;
  is_approved?: boolean;
};

export default function TerminationPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    exitType: 'termination' as 'termination' | 'resignation',
    exitDate: new Date().toISOString().split('T')[0],
    reason: '',
    terminatedBy: '',
  });

  useEffect(() => {
    loadEmployees();
    loadExitRecords();
    loadManagers();
  }, []);

  async function loadManagers() {
    try {
      const token = getToken();
      if (!token) return;

      // Try to fetch managers from different endpoints based on user role
      let res = await fetch(`${API_BASE}/admin/managers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If admin endpoint doesn't work, try a general managers endpoint
      if (!res.ok && res.status !== 403) {
        // Try alternative endpoint - this might vary based on backend
        res = await fetch(`${API_BASE}/managers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (res.ok) {
        const data = await res.json();
        // Filter for approved managers only and map to our format
        const managerList = (data.managers || data.items || []).filter((m: any) => 
          m.is_approved !== false && (m.role === 'manager' || m.role === 'hiring_manager' || m.role === 'admin')
        ).map((m: any) => ({
          id: m.id,
          name: m.name || m.user?.name || '',
          email: m.email || m.user?.email || '',
          role: m.role || 'manager',
          is_approved: m.is_approved !== false,
        }));

        setManagers(managerList);
        
        // Set default to first manager if available
        if (managerList.length > 0 && !formData.terminatedBy) {
          const defaultManager = managerList[0].name || managerList[0].email;
          setFormData(prev => ({ ...prev, terminatedBy: defaultManager }));
        }
      }
    } catch (err) {
      console.error('Failed to load managers:', err);
      // Continue without managers - user can still type manually if needed
    }
  }

  async function loadEmployees() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        return;
      }

      const res = await fetch(`${API_BASE}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load employees');
      }

      // Filter to only show active employees
      const activeEmployees = (data.items || []).filter((emp: Employee) => emp.is_active);
      setEmployees(activeEmployees);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  async function loadExitRecords() {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      // Try to fetch exit records from a dedicated endpoint, or fall back to role history
      let res = await fetch(`${API_BASE}/terminations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok && res.status === 404) {
        // If endpoint doesn't exist, try role history with termination/resignation filter
        res = await fetch(`${API_BASE}/role-history?limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (res.ok) {
        const data = await res.json();
        let records: ExitRecord[] = [];
        
        if (data.terminations || data.exit_records) {
          // Handle dedicated endpoint
          const rawRecords = data.terminations || data.exit_records || [];
          records = rawRecords.map((record: any) => ({
            id: record.id,
            employee_id: record.employee_id || 0,
            employee_name: record.employee_name || record.name,
            exit_date: record.exit_date || record.termination_date || record.resignation_date,
            exit_type: record.exit_type || (record.termination_date ? 'termination' : 'resignation'),
            reason: record.reason || record.comment || 'No reason provided',
            terminated_by: record.terminated_by,
            resigned_by: record.resigned_by,
            created_at: record.created_at || record.exit_date,
            department: record.department,
            position: record.position,
          }));
        } else if (data.entries) {
          // Map role history entries to exit records
          const exitEntries = data.entries.filter((entry: any) => {
            const action = entry.action?.toLowerCase() || '';
            const newValue = entry.newValue?.toLowerCase() || '';
            return action.includes('terminat') || action.includes('resign') ||
                   newValue.includes('terminat') || newValue.includes('resign');
          });
          
          records = exitEntries.map((entry: any) => {
            const isResignation = entry.action?.toLowerCase().includes('resign') || 
                                 entry.newValue?.toLowerCase().includes('resign');
            return {
              id: entry.id,
              employee_id: entry.employee_id || 0,
              employee_name: entry.name,
              exit_date: entry.timestamp,
              exit_type: isResignation ? 'resignation' as const : 'termination' as const,
              reason: entry.reason || entry.comment || 'No reason provided',
              terminated_by: isResignation ? undefined : entry.changedBy,
              resigned_by: isResignation ? entry.changedBy : undefined,
              created_at: entry.timestamp,
              department: entry.department,
              position: entry.position,
            };
          });
        }
        
        setExitRecords(records);
      }
    } catch (err) {
      console.error('Failed to load exit records:', err);
      // Continue without showing error - records might not be available yet
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.employeeId || !formData.exitDate || !formData.reason || !formData.terminatedBy) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }

      const selectedEmployee = employees.find(emp => emp.id.toString() === formData.employeeId);
      if (!selectedEmployee) {
        throw new Error('Selected employee not found');
      }

      // Determine status based on exit type
      const status = formData.exitType === 'resignation' ? 'Resigned' : 'Terminated';

      // First, update employee status
      const updateRes = await fetch(`${API_BASE}/employees/${formData.employeeId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          is_active: false,
        }),
      });

      if (!updateRes.ok) {
        const updateData = await updateRes.json().catch(() => ({}));
        throw new Error(updateData.error || 'Failed to update employee status');
      }

      // Then, create exit record
      const exitData = {
        employee_id: parseInt(formData.employeeId),
        exit_date: formData.exitDate,
        exit_type: formData.exitType,
        reason: formData.reason,
        ...(formData.exitType === 'termination' 
          ? { terminated_by: formData.terminatedBy }
          : { resigned_by: formData.terminatedBy }
        ),
      };

      let exitRes;
      try {
        // Try dedicated exit/termination endpoint
        exitRes = await fetch(`${API_BASE}/terminations`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exitData),
        });
      } catch (err) {
        // If endpoint doesn't exist, the record will be tracked via role history
        console.log('Exit endpoint not available, using role history');
      }

      // Reload data
      await Promise.all([loadEmployees(), loadExitRecords()]);
      
      // Reset form
      const defaultManager = managers.length > 0 ? (managers[0].name || managers[0].email) : '';
      setFormData({
        employeeId: '',
        exitType: 'termination',
        exitDate: new Date().toISOString().split('T')[0],
        reason: '',
        terminatedBy: defaultManager,
      });

      const successMessage = formData.exitType === 'resignation' 
        ? 'Employee resignation recorded successfully'
        : 'Employee terminated successfully';
      toast.success(successMessage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process employee exit';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
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
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Employee Exit</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Record employee terminations and resignations, and maintain a complete exit log.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exit Form */}
            <div className="rounded-xl p-6 transition-all duration-200" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.gray[900] }}>Record Employee Exit</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.gray[700] }}>
                    Exit Type *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.exitType}
                      onChange={(e) => setFormData({ ...formData, exitType: e.target.value as 'termination' | 'resignation' })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                      style={{ 
                        border: '1px solid #D1D5DB', 
                        color: '#374151', 
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <option value="termination">Termination</option>
                      <option value="resignation">Resignation</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.gray[700] }}>
                    Employee *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                      style={{ 
                        border: '1px solid #D1D5DB', 
                        color: '#374151', 
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id.toString()}>
                          {emp.name} {emp.employee_id ? `(${emp.employee_id})` : ''} - {emp.department}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.gray[700] }}>
                    {formData.exitType === 'resignation' ? 'Resignation' : 'Termination'} Date *
                  </label>
                  <input
                    type="date"
                    value={formData.exitDate}
                    onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{ 
                      border: '1px solid #D1D5DB', 
                      color: '#374151', 
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.gray[700] }}>
                    Reason/Comment *
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    rows={4}
                    placeholder={formData.exitType === 'resignation' 
                      ? "Enter resignation reason or comment..."
                      : "Enter termination reason or comment..."}
                    className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      border: '1px solid #D1D5DB', 
                      color: '#374151', 
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.gray[700] }}>
                    {formData.exitType === 'resignation' ? 'Processed By' : 'Terminated By'} *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.terminatedBy}
                      onChange={(e) => setFormData({ ...formData, terminatedBy: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                      style={{ 
                        border: '1px solid #D1D5DB', 
                        color: '#374151', 
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <option value="">Select Manager</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.name || manager.email}>
                          {manager.name || manager.email} {manager.role === 'admin' ? '(Admin)' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full cursor-pointer px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.negative }}
                >
                  {submitting 
                    ? (formData.exitType === 'resignation' ? 'Recording...' : 'Terminating...')
                    : (formData.exitType === 'resignation' ? 'Record Resignation' : 'Terminate Employee')
                  }
                </button>
              </form>
            </div>

            {/* Exit Log */}
            <div className="rounded-xl p-6 transition-all duration-200" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.gray[900] }}>Exit Log</h2>
              
              {loading && exitRecords.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
                    <p className="text-sm" style={{ color: COLORS.gray[500] }}>Loading exit records...</p>
                  </div>
                </div>
              ) : exitRecords.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm" style={{ color: COLORS.gray[500] }}>No exit records yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {exitRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 rounded-lg border"
                      style={{ 
                        borderColor: '#E5E7EB',
                        backgroundColor: '#F9FAFB'
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold" style={{ color: COLORS.gray[900] }}>
                            {record.employee_name}
                          </h3>
                          {(record.department || record.position) && (
                            <p className="text-xs mt-0.5" style={{ color: COLORS.gray[500] }}>
                              {[record.position, record.department].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                        <span 
                          className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: record.exit_type === 'resignation' ? '#FEF3C7' : '#FEE2E2',
                            color: record.exit_type === 'resignation' ? '#92400E' : COLORS.negative
                          }}
                        >
                          {record.exit_type === 'resignation' ? 'Resigned' : 'Terminated'}
                        </span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: COLORS.gray[600] }}>
                        {record.reason}
                      </p>
                      <div className="flex items-center justify-between text-xs" style={{ color: COLORS.gray[500] }}>
                        <span>By: {record.terminated_by || record.resigned_by || 'Unknown'}</span>
                        <span>{formatDate(record.exit_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

