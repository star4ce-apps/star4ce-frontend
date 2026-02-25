'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import RequireAuth from '@/components/layout/RequireAuth';
import HubSidebar from '@/components/sidebar/HubSidebar';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth, deleteJsonAuth } from '@/lib/http';
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

// Job roles dropdown options
const JOB_ROLES = [
  'Body Shop Manager',
  'Body Shop Technician',
  'Business Manager',
  'Business Office Support',
  'C-Level Executives',
  'Platform Manager',
  'Controller',
  'Finance Manager',
  'Finance Director',
  'General Manager',
  'Human Resources Manager',
  'IT Manager',
  'Loaner Agent',
  'Mobility Manager',
  'Parts Counter Employee',
  'Parts Manager',
  'Parts Support',
  'Drivers',
  'Sales Manager',
  'GSM',
  'Sales People',
  'Sales Support',
  'Receptionist',
  'Service Advisor',
  'Service Director',
  'Service Drive Manager',
  'Service Manager',
  'Parts and Service Director',
  'Service Support',
  'Porters',
  'Technician',
  'Used Car Director',
  'Used Car Manager',
];

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
  // Optional fields that may not be stored in backend
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
};

export default function EmployeesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [loadingPerformanceScore, setLoadingPerformanceScore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('All Job Titles');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null);
  const itemsPerPage = 10;

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
    university: '',
    degree: '',
  });
  const [customDepartment, setCustomDepartment] = useState('');

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
      // If we landed here after reverting "Employee Created" on Change History, refetch to drop removed employee
      if (sessionStorage.getItem('employees-list-refresh')) {
        sessionStorage.removeItem('employees-list-refresh');
        loadEmployees(true);
      }
    }
  }, []);

  // Refetch when user returns to this tab (focus) or when route is employees (e.g. navigated from Change History)
  useEffect(() => {
    const onFocus = () => loadEmployees();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  useEffect(() => {
    if (pathname === '/employees') {
      if (typeof window !== 'undefined' && sessionStorage.getItem('employees-list-refresh')) {
        sessionStorage.removeItem('employees-list-refresh');
        loadEmployees(true);
      } else {
        loadEmployees();
      }
    }
  }, [pathname]);

  async function loadEmployees(cacheBust = false) {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        return;
      }

      const url = cacheBust ? `/employees?_=${Date.now()}` : '/employees';
      const data = await getJsonAuth<{ ok: boolean; items: any[] }>(url);
      // Include all employees (active and inactive/terminated/resigned); use status filter to narrow
      setEmployees(data.items || []);
    } catch (err: unknown) {
      setEmployees([]);
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phoneNumber', 'email', 'jobTitle', 'hiredDate', 'department', 'status'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    // If "Others" is selected, validate custom department
    if (formData.department === 'Others' && !customDepartment.trim()) {
      setError('Please specify the department name');
      return;
    }
    
    if (missingFields.length > 0) {
      setError('Please fill in all required fields (marked with *)');
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
        department: formData.department === 'Others' ? customDepartment.trim() : formData.department,
        position: formData.jobTitle,
        employee_id: formData.employeeId,
        hired_date: formData.hiredDate,
        status: formData.status,
        street: formData.street || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zipCode || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        university: formData.university || null,
        degree: formData.degree || null,
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
        // Check for subscription error
        if (data.error === 'subscription_expired') {
          const subscriptionMsg = data.message || 'Your subscription has expired or been cancelled. Please renew to make changes.';
          setError(subscriptionMsg);
          toast.error(subscriptionMsg, { duration: 5000 });
          return;
        }
        throw new Error(data.error || data.message || 'Failed to save employee');
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
      university: '',
      degree: '',
    });
    setCustomDepartment('');
    setShowModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setEditingEmployee(null);
    setViewingEmployee(null);
    setPerformanceScore(null);
    setError(null);
  }

  async function loadPerformanceScore(employeeId: number) {
    setLoadingPerformanceScore(true);
    try {
      const token = getToken();
      if (!token) {
        setPerformanceScore(null);
        return;
      }

      // Try to fetch performance reviews for this employee
      const data = await getJsonAuth<{ ok: boolean; reviews?: any[] }>(`/employees/${employeeId}/performance-reviews`);
      
      if (data.ok && data.reviews && data.reviews.length > 0) {
        // Calculate average of overall_rating from all reviews
        const ratings = data.reviews
          .map((review: any) => review.overall_rating)
          .filter((rating: any) => rating !== null && rating !== undefined && !isNaN(rating));
        
        if (ratings.length > 0) {
          const average = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
          setPerformanceScore(Math.round(average * 10) / 10); // Round to 1 decimal place
        } else {
          setPerformanceScore(null);
        }
      } else {
        setPerformanceScore(null);
      }
    } catch (err) {
      console.error('Failed to load performance score:', err);
      setPerformanceScore(null);
    } finally {
      setLoadingPerformanceScore(false);
    }
  }

  function openViewModal(employee: Employee) {
    // Navigate to employee profile page
    router.push(`/employees/${employee.id}`);
  }

  async function handleDeleteEmployee(emp: Employee, e: React.MouseEvent) {
    e.stopPropagation();
    if (role === 'corporate') return;
    if (!confirm(`Remove "${emp.name}" from the system? This cannot be undone and will not affect turnover or other data.`)) return;
    
    setDeletingEmployeeId(emp.id);
    const employeeIdToDelete = emp.id;
    
    // Store original list in case we need to revert
    const originalEmployees = [...employees];
    
    // Immediately remove from list for instant feedback
    setEmployees(prev => prev.filter(e => e.id !== employeeIdToDelete));
    
    try {
      await deleteJsonAuth(`/employees/${employeeIdToDelete}`);
      
      toast.success('Employee removed');
    } catch (err: unknown) {
      console.error('Delete error:', err);
      // Revert the UI change if deletion failed
      setEmployees(originalEmployees);
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove employee';
      toast.error(errorMsg);
    } finally {
      setDeletingEmployeeId(null);
    }
  }

  function openEditModal(employee: Employee) {
    const nameParts = employee.name.split(' ');
    setFormData({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      street: employee.street || '',
      city: employee.city || '',
      state: employee.state || '',
      zipCode: employee.zip_code || '',
      dateOfBirth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
      gender: employee.gender || '',
      employeeId: employee.employee_id || '',
      phoneNumber: employee.phone || '',
      email: employee.email || '',
      jobTitle: employee.position || '',
      hiredDate: employee.hired_date ? employee.hired_date.split('T')[0] : '',
      department: employee.department || '',
      status: employee.status || '',
      university: (employee as any).university || '',
      degree: (employee as any).degree || '',
    });
    setEditingEmployee(employee);
    setShowEditModal(true);
    setError(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEmployee) return;
    
    setError(null);

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phoneNumber', 'email', 'jobTitle', 'hiredDate', 'department', 'status'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    // If "Others" is selected, validate custom department
    if (formData.department === 'Others' && !customDepartment.trim()) {
      setError('Please specify the department name');
      return;
    }
    
    if (missingFields.length > 0) {
      setError('All required fields must be filled');
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
        department: formData.department === 'Others' ? customDepartment.trim() : formData.department,
        position: formData.jobTitle,
        employee_id: formData.employeeId,
        hired_date: formData.hiredDate,
        status: formData.status,
        street: formData.street || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zipCode || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        is_active: editingEmployee.is_active, // Preserve existing active status (can be changed via termination page)
      };

      const res = await fetch(`${API_BASE}/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Check for subscription error
        if (data.error === 'subscription_expired') {
          const subscriptionMsg = data.message || 'Your subscription has expired or been cancelled. Please renew to make changes.';
          setError(subscriptionMsg);
          toast.error(subscriptionMsg, { duration: 5000 });
          return;
        }
        throw new Error(data.error || data.message || 'Failed to update employee');
      }

      await loadEmployees();
      resetForm();
      toast.success('Employee updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update employee';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
    
    // Enhanced status filtering
    let matchesStatus = true;
    if (selectedStatus !== 'All Statuses') {
      if (selectedStatus === 'Active') {
        matchesStatus = emp.is_active === true;
      } else if (selectedStatus === 'Inactive') {
        matchesStatus = emp.is_active === false;
      } else {
        // Match by exact status string
        matchesStatus = emp.status === selectedStatus;
      }
    }

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
    'Others',
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
  
  // Statuses that should be excluded from the filter (removed from system)
  const excludedStatuses = ['Resigned', 'Terminated', 'Fired', 'On Leave', 'Onboarding'];
  
  // Get unique statuses from employees, plus standard options
  // Filter out excluded statuses that are no longer valid options
  const allStatusOptions = [
    'All Statuses',
    'Active',
    'Inactive',
    ...statuses,
    ...Array.from(new Set(employees.map(emp => emp.status).filter(Boolean))) as string[]
  ]
    .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
    .filter(status => !excludedStatuses.includes(status)); // Remove excluded statuses

  const jobTitles = Array.from(new Set(employees.map(emp => emp.position).filter(Boolean))) as string[];

  // Only show loading if we haven't checked localStorage yet
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
              <p style={{ color: COLORS.gray[500] }}>Loading...</p>
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
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#F59E0B' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3" style={{ color: COLORS.gray[900] }}>Waiting for Admin Approval</h2>
              <p className="text-sm mb-1" style={{ color: COLORS.gray[500] }}>
                Your account is pending admin approval.
              </p>
              <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                Please wait for an admin to approve your request to join the dealership.
              </p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  if (role !== 'admin' && role !== 'corporate') {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
            <div className="text-center py-12">
              <div className="text-sm font-medium" style={{ color: COLORS.gray[500] }}>Only Admin and Corporate users can view employees.</div>
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
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Employee List</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Overview of all current and past employees, roles, statuses, and departmental assignments.
                </p>
              </div>
              {role !== 'corporate' ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: '#4D6DBE',
                    color: '#FFFFFF'
                  }}
                >
                  + Add Employee
                </button>
              ) : (
                <div className="px-3 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                  View-Only Mode
                </div>
              )}
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
                  minWidth: '160px'
                }}
              >
                {allStatusOptions.map(status => (
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
                    <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-white w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>
                        Loading employees...
                      </td>
                    </tr>
                  ) : paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>
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
                          className="hover:bg-blue-50 transition-colors cursor-pointer"
                          style={{ 
                            borderBottom: '1px solid #F3F4F6'
                          }}
                          onClick={() => openViewModal(emp)}
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
                                                emp.is_active ? '#D1FAE5' : '#F3F4F6',
                                color: emp.status === 'Full-Time' ? '#065F46' :
                                       emp.status === 'Part-time' ? '#1E40AF' :
                                       emp.status === 'Intern' ? '#92400E' :
                                       emp.is_active ? '#065F46' : '#374151'
                              }}
                            >
                              {emp.status || (emp.is_active ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            {role !== 'corporate' && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteEmployee(emp, e)}
                                disabled={deletingEmployeeId === emp.id}
                                className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ border: '1px solid #FCA5A5', color: '#DC2626' }}
                                title="Remove employee from system (does not affect turnover)"
                              >
                                {deletingEmployeeId === emp.id ? (
                                  'Removing...'
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </>
                                )}
                              </button>
                            )}
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
                    let pageNum: number;
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

          {/* View Employee Details Modal */}
          {showViewModal && viewingEmployee && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowViewModal(false);
                  setViewingEmployee(null);
                }
              }}
            >
              <div 
                className="bg-white rounded-xl shadow-2xl"
                style={{ 
                  width: '90%', 
                  maxWidth: '800px', 
                  maxHeight: '95vh', 
                  overflowY: 'auto',
                  border: '1px solid #E5E7EB'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#4D6DBE' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold mb-0.5" style={{ color: '#FFFFFF' }}>Employee Details</h2>
                      <p className="text-xs" style={{ color: '#E0E7FF' }}>View employee information</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setViewingEmployee(null);
                      }}
                      className="cursor-pointer p-1 rounded-md transition-all hover:bg-blue-600"
                      style={{ color: '#FFFFFF' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="col-span-2">
                      <h3 className="text-sm font-semibold mb-4" style={{ color: '#232E40' }}>Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Full Name</label>
                          <div className="text-sm font-semibold" style={{ color: '#232E40' }}>
                            {viewingEmployee.name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Employee ID</label>
                          <div className="text-sm font-semibold" style={{ color: '#232E40' }}>
                            {viewingEmployee.employee_id || `#${String(viewingEmployee.id).padStart(7, '0')}`}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Email</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.email}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Phone Number</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.phone || '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Date of Birth</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.date_of_birth 
                              ? new Date(viewingEmployee.date_of_birth).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
                              : '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Gender</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.gender || '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Home Address */}
                    <div className="col-span-2">
                      <h3 className="text-sm font-semibold mb-4 mt-6" style={{ color: '#232E40' }}>Home Address</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Street Address</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.street || '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>City</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.city || '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>State</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.state || '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Zip Code</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.zip_code || '—'}
                          </div>
                        </div>
                        {(viewingEmployee.street || viewingEmployee.city || viewingEmployee.state || viewingEmployee.zip_code) ? (
                          <div className="col-span-2 mt-2">
                            <div className="text-sm p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#374151' }}>
                              {[
                                viewingEmployee.street,
                                viewingEmployee.city,
                                viewingEmployee.state,
                                viewingEmployee.zip_code
                              ].filter(Boolean).join(', ') || '—'}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Employment Information */}
                    <div className="col-span-2">
                      <h3 className="text-sm font-semibold mb-4 mt-6" style={{ color: '#232E40' }}>Employment Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Job Title</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.position || '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Department</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.department}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Hired Date</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.hired_date 
                              ? new Date(viewingEmployee.hired_date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
                              : viewingEmployee.created_at 
                              ? new Date(viewingEmployee.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
                              : '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Status</label>
                          <div className="mt-1">
                            <span 
                              className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                              style={{ 
                                backgroundColor: viewingEmployee.status === 'Full-Time' ? '#D1FAE5' : 
                                                viewingEmployee.status === 'Part-time' ? '#DBEAFE' :
                                                viewingEmployee.status === 'Intern' ? '#FEF3C7' :
                                                viewingEmployee.is_active ? '#D1FAE5' : '#F3F4F6',
                                color: viewingEmployee.status === 'Full-Time' ? '#065F46' :
                                       viewingEmployee.status === 'Part-time' ? '#1E40AF' :
                                       viewingEmployee.status === 'Intern' ? '#92400E' :
                                       viewingEmployee.is_active ? '#065F46' : '#374151'
                              }}
                            >
                              {viewingEmployee.status || (viewingEmployee.is_active ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Performance Score</label>
                          <div className="text-sm font-semibold" style={{ color: '#232E40' }}>
                            {loadingPerformanceScore ? (
                              <span style={{ color: '#6B7280' }}>Loading...</span>
                            ) : performanceScore !== null ? (
                              <span style={{ 
                                color: performanceScore >= 4 ? '#059669' : 
                                       performanceScore >= 3 ? '#D97706' : 
                                       '#DC2626' 
                              }}>
                                {performanceScore.toFixed(1)} / 5.0
                              </span>
                            ) : (
                              <span style={{ color: '#6B7280' }}>—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="col-span-2">
                      <h3 className="text-sm font-semibold mb-4 mt-6" style={{ color: '#232E40' }}>Additional Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Employee ID (System)</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            #{String(viewingEmployee.id).padStart(7, '0')}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Account Status</label>
                          <div className="mt-1">
                            <span 
                              className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                              style={{ 
                                backgroundColor: viewingEmployee.is_active ? '#D1FAE5' : '#FEE2E2',
                                color: viewingEmployee.is_active ? '#065F46' : '#991B1B'
                              }}
                            >
                              {viewingEmployee.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Created At</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.created_at 
                              ? new Date(viewingEmployee.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Last Updated</label>
                          <div className="text-sm" style={{ color: '#374151' }}>
                            {viewingEmployee.updated_at 
                              ? new Date(viewingEmployee.updated_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowViewModal(false);
                        setViewingEmployee(null);
                      }}
                      className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
                      style={{ 
                        border: '1px solid #E5E7EB',
                        color: '#374151',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowViewModal(false);
                        openEditModal(viewingEmployee);
                      }}
                      className="cursor-pointer px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90"
                      style={{ backgroundColor: '#4D6DBE' }}
                    >
                      Edit Employee
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && editingEmployee && (
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
                  <h2 className="text-xl font-bold mb-0.5" style={{ color: '#FFFFFF' }}>Edit Employee</h2>
                  <p className="text-xs" style={{ color: '#E0E7FF' }}>Update employee information *</p>
                </div>
                <form onSubmit={handleUpdate} className="p-5">
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Home Address</label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Street"
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
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
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                          <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>University</label>
                      <input
                        type="text"
                        placeholder="University name"
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Degree</label>
                      <input
                        type="text"
                        placeholder="Degree (e.g., Bachelor's, Master's)"
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Employee ID</label>
                      <input
                        type="text"
                        placeholder="#00000"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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
                      <div className="relative">
                        <select
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <option value="">Select Job Title</option>
                          {JOB_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
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
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={formData.department}
                            onChange={(e) => {
                              setFormData({ ...formData, department: e.target.value });
                              if (e.target.value !== 'Others') {
                                setCustomDepartment('');
                              }
                            }}
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
                        {formData.department === 'Others' && (
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Enter department name"
                              value={customDepartment}
                              onChange={(e) => setCustomDepartment(e.target.value)}
                              required
                              className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                              style={{ 
                                border: '1px solid #D1D5DB', 
                                color: '#374151', 
                                backgroundColor: '#FFFFFF',
                              }}
                            />
                          </div>
                        )}
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
                      {loading ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Modal */}
          {showModal && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
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
                  <p className="text-xs" style={{ color: '#E0E7FF' }}>Fields marked with * are required</p>
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Home Address</label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Street"
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
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
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                          <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>University</label>
                      <input
                        type="text"
                        placeholder="University name"
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Degree</label>
                      <input
                        type="text"
                        placeholder="Degree (e.g., Bachelor's, Master's)"
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          border: '1px solid #D1D5DB', 
                          color: '#374151', 
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Employee ID</label>
                      <input
                        type="text"
                        placeholder="#00000"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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
                      <div className="relative">
                        <select
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            border: '1px solid #D1D5DB', 
                            color: '#374151', 
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <option value="">Select Job Title</option>
                          {JOB_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
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
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={formData.department}
                            onChange={(e) => {
                              setFormData({ ...formData, department: e.target.value });
                              if (e.target.value !== 'Others') {
                                setCustomDepartment('');
                              }
                            }}
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
                        {formData.department === 'Others' && (
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Enter department name"
                              value={customDepartment}
                              onChange={(e) => setCustomDepartment(e.target.value)}
                              required
                              className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2"
                              style={{ 
                                border: '1px solid #D1D5DB', 
                                color: '#374151', 
                                backgroundColor: '#FFFFFF',
                              }}
                            />
                          </div>
                        )}
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
