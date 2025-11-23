'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/layout/RequireAuth';
import HubSidebar from '@/components/sidebar/HubSidebar';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  position: string | null;
  employee_id?: string;
  hired_date?: string;
  status?: string;
  dealership_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function EmployeesPage() {
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('All Job Titles');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 20;

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    gender: '',
    employeeId: '',
    phoneNumber: '',
    email: '',
    jobTitle: '',
    hiredDate: '',
    department: '',
    status: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role');
      if (storedRole) {
        setRole(storedRole);
      }
      // Check user approval status
      async function checkUserStatus() {
        try {
          const token = getToken();
          if (!token) return;
          
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            setRole(data.user?.role || data.role);
            setIsApproved(data.user?.is_approved !== false && data.is_approved !== false);
          } else {
            const data = await res.json();
            if (data.error === 'manager_not_approved') {
              setRole('manager');
              setIsApproved(false);
            }
          }
        } catch (err) {
          console.error('Failed to check user status:', err);
        }
      }
      
      checkUserStatus();
      loadEmployees();
    }
  }, []);

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

      setEmployees(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode', 'dateOfBirth', 'gender', 'employeeId', 'phoneNumber', 'email', 'jobTitle', 'hiredDate', 'department', 'status'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      setError('All fields must be filled');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }

      const employeeData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phoneNumber,
        department: formData.department,
        position: formData.jobTitle,
        employee_id: formData.employeeId,
        hired_date: formData.hiredDate,
        status: formData.status,
      };

      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save employee');
      }

      await loadEmployees();
      resetForm();
      toast.success('Employee added successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save employee';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      dateOfBirth: '',
      gender: '',
      employeeId: '',
      phoneNumber: '',
      email: '',
      jobTitle: '',
      hiredDate: '',
      department: '',
      status: '',
    });
    setShowModal(false);
    setError(null);
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.employee_id && emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesJobTitle = selectedJobTitle === 'All Job Titles' || emp.position === selectedJobTitle;
    const matchesStatus = selectedStatus === 'All Statuses' || 
      (selectedStatus === 'Full-Time' && emp.is_active && emp.status === 'Full-Time') ||
      (selectedStatus === 'Part-time' && emp.is_active && emp.status === 'Part-time') ||
      (selectedStatus === 'Intern' && emp.status === 'Intern') ||
      (selectedStatus === 'Resigned' && !emp.is_active && emp.status === 'Resigned') ||
      (selectedStatus === 'Terminated' && !emp.is_active && emp.status === 'Terminated') ||
      (selectedStatus === 'On Leave' && emp.status === 'On Leave') ||
      (selectedStatus === 'Onboarding' && emp.status === 'Onboarding');

    return matchesSearch && matchesJobTitle && matchesStatus;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aVal: number | string = a[sortColumn as keyof Employee] as number | string;
    let bVal: number | string = b[sortColumn as keyof Employee] as number | string;

    if (sortColumn === 'name' || sortColumn === 'email' || sortColumn === 'department' || sortColumn === 'position') {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = sortedEmployees.slice(startIndex, endIndex);

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

  const departments = [
    'Sales Department',
    'Service Department',
    'Parts Department',
    'Administration Department',
    'Office Department',
    'Finance Department',
    'Customer Relations',
    'Inventory Management',
    'Marketing Department',
    'Human Resources',
    'Technical Support',
    'Warranty Services',
    'Training and Development',
  ];

  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const statuses = ['Full-Time', 'Part-time', 'Intern'];

  const jobTitles = Array.from(new Set(employees.map(emp => emp.position).filter(Boolean))) as string[];

  // Since auth is bypassed, we'll allow access and default to admin role
  // Only show loading if we haven't checked localStorage yet
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="flex items-center justify-center min-h-[400px]">
              <p style={{ color: '#6B7280' }}>Loading...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  if (role !== 'admin') {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="text-center py-12 text-red-600">
              <div className="text-sm font-medium">Only Admin users can manage employees.</div>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  // Block unapproved managers
  if (role === 'manager' && isApproved === false) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#232E40' }}>Waiting for Admin Approval</h2>
              <p className="text-base mb-2" style={{ color: '#6B7280' }}>
                Your account is pending admin approval.
              </p>
              <p className="text-base" style={{ color: '#6B7280' }}>
                Please wait for an admin to approve your request to join the dealership. You'll be able to access this page once approved.
              </p>
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
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Employee List</h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Overview of all current and past employees, including their roles, statuses, and departmental assignments for streamlined tracking and management.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                style={{ 
                  backgroundColor: '#4D6DBE',
                  color: '#FFFFFF'
                }}
              >
                + Add Employee
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1" style={{ maxWidth: '400px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
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
                value={selectedJobTitle}
                onChange={(e) => setSelectedJobTitle(e.target.value)}
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
                <option>All Job Titles</option>
                {jobTitles.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
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
                <option>All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl p-6 transition-all duration-200" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#4D6DBE' }}>
                    <th 
                      className="cursor-pointer text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1.5">
                        Name
                        <SortIcon column="name" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('employee_id')}
                    >
                      <div className="flex items-center gap-1.5">
                        Employee ID
                        <SortIcon column="employee_id" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('position')}
                    >
                      <div className="flex items-center gap-1.5">
                        Job
                        <SortIcon column="position" />
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
                      onClick={() => handleSort('hired_date')}
                    >
                      <div className="flex items-center gap-1.5">
                        Hired Date
                        <SortIcon column="hired_date" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity text-white"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1.5">
                        Status
                        <SortIcon column="status" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>
                        Loading employees...
                      </td>
                    </tr>
                  ) : paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp) => {
                      const formattedDate = emp.hired_date 
                        ? new Date(emp.hired_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                        : emp.created_at 
                        ? new Date(emp.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—';
                      
                      return (
                        <tr 
                          key={emp.id} 
                          className="hover:bg-blue-50 transition-colors"
                          style={{ 
                            borderBottom: '1px solid #F3F4F6'
                          }}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm font-semibold mb-0.5" style={{ color: '#232E40' }}>{emp.name}</div>
                              <div className="text-xs" style={{ color: '#6B7280' }}>{emp.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium" style={{ color: '#232E40' }}>
                            {emp.employee_id || `#${String(emp.id).padStart(7, '0')}`}
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>{emp.position || '—'}</td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>{emp.department}</td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#374151' }}>{formattedDate}</td>
                          <td className="py-3 px-4">
                            <span 
                              className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                              style={{ 
                                backgroundColor: emp.status === 'Full-Time' ? '#D1FAE5' : 
                                                emp.status === 'Part-time' ? '#DBEAFE' :
                                                emp.status === 'Intern' ? '#FEF3C7' :
                                                emp.status === 'Resigned' ? '#FEE2E2' :
                                                emp.status === 'Terminated' ? '#FEE2E2' :
                                                emp.status === 'On Leave' ? '#E0E7FF' :
                                                emp.status === 'Onboarding' ? '#F3E8FF' :
                                                '#F3F4F6',
                                color: emp.status === 'Full-Time' ? '#065F46' :
                                       emp.status === 'Part-time' ? '#1E40AF' :
                                       emp.status === 'Intern' ? '#92400E' :
                                       emp.status === 'Resigned' ? '#991B1B' :
                                       emp.status === 'Terminated' ? '#991B1B' :
                                       emp.status === 'On Leave' ? '#3730A3' :
                                       emp.status === 'Onboarding' ? '#6B21A8' :
                                       '#374151'
                              }}
                            >
                              {emp.status || (emp.is_active ? 'Full-Time' : 'Inactive')}
                            </span>
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
                Showing {startIndex + 1} to {Math.min(endIndex, sortedEmployees.length)} of {sortedEmployees.length} entries
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="cursor-pointer px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
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
                        className="cursor-pointer px-2.5 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-gray-50"
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
                  className="cursor-pointer px-2.5 py-1.5 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
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

          {/* Modal */}
          {showModal && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  resetForm();
                }
              }}
            >
              <div 
                className="bg-white rounded-xl shadow-2xl"
                style={{ 
                  width: '90%', 
                  maxWidth: '950px', 
                  maxHeight: '95vh', 
                  overflowY: 'auto',
                  border: '1px solid #E5E7EB'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#4D6DBE' }}>
                  <h2 className="text-xl font-bold mb-0.5" style={{ color: '#FFFFFF' }}>Add an Existing Employee</h2>
                  <p className="text-xs" style={{ color: '#E0E7FF' }}>All fields must be filled *</p>
                </div>
                <form onSubmit={handleSubmit} className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>First Name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Home Address *</label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Street"
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                          }}
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <select
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                            style={{ 
                              border: '1px solid #D1D5DB', 
                              color: '#374151', 
                              backgroundColor: '#FFFFFF',
                            }}
                          >
                            <option value="">Select State</option>
                            {states.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder="Zip Code"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Date of Birth *</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Gender *</label>
                      <div className="relative">
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Employee ID *</label>
                      <input
                        type="text"
                        placeholder="#00000"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="(000) 000-0000"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Job Title *</label>
                      <input
                        type="text"
                        placeholder="e.g., Sales Consultant"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Hired Date *</label>
                      <input
                        type="date"
                        value={formData.hiredDate}
                        onChange={(e) => setFormData({ ...formData, hiredDate: e.target.value })}
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Department *</label>
                      <div className="relative">
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Status *</label>
                      <div className="relative">
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <option value="">Select Status</option>
                          {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  {error && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
                      style={{ 
                        border: '1px solid #E5E7EB',
                        color: '#374151',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="cursor-pointer px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#4D6DBE' }}
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
