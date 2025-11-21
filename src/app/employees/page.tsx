'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  position: string | null;
  dealership_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};


export default function EmployeesPage() {
  const [role, setRole] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [invitingEmployeeId, setInvitingEmployeeId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('role'));
    }
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      loadEmployees();
    }
  }, [role]);

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

    if (!formData.name || !formData.email || !formData.department) {
      setError('Name, email, and department are required');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }

      const url = editingEmployee
        ? `${API_BASE}/employees/${editingEmployee.id}`
        : `${API_BASE}/employees`;
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save employee');
      }

      await loadEmployees();
      resetForm();
      toast.success(editingEmployee ? 'Employee updated successfully' : 'Employee created successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save employee';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(employee: Employee) {
    if (!confirm(`Deactivate ${employee.name}?`)) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }

      const res = await fetch(`${API_BASE}/employees/${employee.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to deactivate employee');
      }

      await loadEmployees();
      toast.success('Employee deactivated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate employee';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(employee: Employee) {
    setInvitingEmployeeId(employee.id);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }

      // First, create a new access code (7 days = 168 hours)
      const createRes = await fetch(`${API_BASE}/survey/access-codes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expires_in_hours: 168 }),
      });

      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(createData.error || 'Failed to create access code');
      }

      const accessCode = createData.code;

      // Then, send the invite with the new code
      const inviteRes = await fetch(`${API_BASE}/employees/${employee.id}/invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: accessCode }),
      });

      const inviteData = await inviteRes.json().catch(() => ({}));
      if (!inviteRes.ok) {
        throw new Error(inviteData.error || 'Failed to send invite');
      }

      toast.success(`Survey invite sent to ${employee.email} with code ${accessCode}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invite';
      setError(msg);
      toast.error(msg);
    } finally {
      setInvitingEmployeeId(null);
    }
  }

  function resetForm() {
    setFormData({ name: '', email: '', phone: '', department: '', position: '' });
    setShowAddForm(false);
    setEditingEmployee(null);
  }

  function startEdit(employee: Employee) {
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department,
      position: employee.position || '',
    });
    setEditingEmployee(employee);
    setShowAddForm(true);
  }

  const departments = [
    'Sales Department',
    'Service Department',
    'Parts Department',
    'Administration Department',
    'Office Department',
  ];

  if (!role) {
    return (
      <RequireAuth>
        <div className="p-8">Checking permissions...</div>
      </RequireAuth>
    );
  }

  if (role !== 'admin') {
    return (
      <RequireAuth>
        <div className="p-8 text-red-600">
          Only Admin users can manage employees.
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Employee Management</h1>
          {!showAddForm && (
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="cursor-pointer bg-[#0B2E65] text-white px-4 py-2 rounded-lg hover:bg-[#2c5aa0] transition-colors"
            >
              + Add Employee
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="mb-6 bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department *</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="cursor-pointer w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g., Manager, Associate"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer bg-[#0B2E65] text-white px-4 py-2 rounded-lg hover:bg-[#2c5aa0] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingEmployee ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="cursor-pointer bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && employees.length === 0 ? (
          <p className="text-slate-500">Loading employees...</p>
        ) : employees.length === 0 ? (
          <p className="text-slate-500">No employees yet. Add your first employee above.</p>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Department</th>
                    <th className="px-4 py-3 text-left font-medium">Position</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-t">
                      <td className="px-4 py-3">{emp.name}</td>
                      <td className="px-4 py-3">{emp.email}</td>
                      <td className="px-4 py-3">{emp.department}</td>
                      <td className="px-4 py-3">{emp.position || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            emp.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(emp)}
                          className="cursor-pointer text-[#0B2E65] hover:underline text-xs"
                        >
                          Edit
                        </button>
                        {emp.is_active && (
                          <button
                            onClick={() => handleInvite(emp)}
                            disabled={invitingEmployeeId === emp.id}
                            className="cursor-pointer text-xs bg-[#0B2E65] text-white px-3 py-1 rounded hover:bg-[#2c5aa0] disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {invitingEmployeeId === emp.id ? 'Sending...' : 'Invite to Survey'}
                          </button>
                        )}
                        {emp.is_active && (
                          <button
                            onClick={() => handleDelete(emp)}
                            className="cursor-pointer text-red-600 hover:underline text-xs"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}

