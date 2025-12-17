'use client';

import React, { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

type Manager = {
  id: number;
  email: string;
  role: string;
  is_approved: boolean;
  is_verified: boolean;
  approved_at: string | null;
  approved_by: number | null;
  dealership_id: number;
  created_at: string;
  permissions?: { [key: string]: boolean };
};

type PermissionMatrix = {
  [role: string]: {
    [permission: string]: boolean;
  };
};

export default function UserManagementPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [pendingManagers, setPendingManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'managers' | 'permissions'>('managers');
  const [permissions, setPermissions] = useState<PermissionMatrix>({});
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [showManagerPermissionsModal, setShowManagerPermissionsModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    role: 'manager' as 'manager' | 'hiring_manager',
  });

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole === 'admin') {
      loadManagers();
      loadPermissions();
    }
  }, [userRole]);

  async function loadUserRole() {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUserRole(data.user?.role || data.role);
      }
    } catch (err) {
      console.error('Failed to load user role:', err);
    }
  }

  async function loadManagers() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/admin/managers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setManagers(data.managers || []);
        setPendingManagers(data.pending || []);
      } else {
        setError(data.error || 'Failed to load managers');
      }
    } catch (err) {
      setError('Failed to load managers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateManager() {
    if (!createFormData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/admin/managers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFormData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Invitation sent successfully');
        setShowCreateModal(false);
        setCreateFormData({ email: '', role: 'manager' });
        await loadManagers();
      } else {
        toast.error(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      toast.error('Failed to send invitation');
      console.error(err);
    }
  }

  async function handleApprove(managerId: number) {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/admin/managers/${managerId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Manager approved successfully');
        await loadManagers();
      } else {
        toast.error(data.error || 'Failed to approve manager');
      }
    } catch (err) {
      toast.error('Failed to approve manager');
      console.error(err);
    }
  }

  async function handleReject(managerId: number) {
    if (!confirm('Are you sure you want to reject and delete this manager account? This action cannot be undone.')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/admin/managers/${managerId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Manager rejected and removed');
        await loadManagers();
      } else {
        toast.error(data.error || 'Failed to reject manager');
      }
    } catch (err) {
      toast.error('Failed to reject manager');
      console.error(err);
    }
  }

  async function loadPermissions() {
    setLoadingPermissions(true);
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/admin/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setPermissions(data.permissions || {});
        setPermissionKeys(data.permission_keys || []);
        setRoles(data.roles || []);
      } else {
        console.error('Failed to load permissions:', data.error);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  }

  async function handleTogglePermission(role: string, permissionKey: string, currentValue: boolean) {
    try {
      const token = getToken();
      if (!token) return;

      const newValue = !currentValue;
      
      // If disabling a view permission, also disable corresponding modify/manage permissions
      if (permissionKey.startsWith('view_') && !newValue) {
        const modifyKey = permissionKey.replace('view_', 'modify_');
        const manageKey = permissionKey.replace('view_', 'manage_');
        
        // Disable modify permission if it exists
        if (permissions[role]?.[modifyKey] !== undefined) {
          const modifyValue = permissions[role]?.[modifyKey] ?? false;
          if (modifyValue) {
            await fetch(`${API_BASE}/admin/permissions`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                role,
                permission_key: modifyKey,
                allowed: false,
              }),
            });
          }
        }
        
        // Disable manage permission if it exists
        if (permissions[role]?.[manageKey] !== undefined) {
          const manageValue = permissions[role]?.[manageKey] ?? false;
          if (manageValue) {
            await fetch(`${API_BASE}/admin/permissions`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                role,
                permission_key: manageKey,
                allowed: false,
              }),
            });
          }
        }
      }

      const res = await fetch(`${API_BASE}/admin/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          permission_key: permissionKey,
          allowed: newValue,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Permission updated successfully');
        await loadPermissions();
      } else {
        toast.error(data.error || 'Failed to update permission');
      }
    } catch (err) {
      toast.error('Failed to update permission');
      console.error(err);
    }
  }

  function getPermissionLabel(key: string): string {
    const labels: { [key: string]: string } = {
      view_dashboard: 'View Dashboard',
      view_employees: 'View Employees',
      view_candidates: 'View Candidates',
      view_analytics: 'View Analytics',
      view_surveys: 'View Surveys',
      view_subscription: 'View Subscription',
      create_survey: 'Create Surveys',
      manage_survey: 'Manage Surveys',
      create_employee: 'Create Employees',
      modify_employee: 'Modify Employees',
      manage_employee: 'Manage Employees',
      create_candidate: 'Create Candidates',
      modify_candidate: 'Modify Candidates',
      manage_candidate: 'Manage Candidates',
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Check if a modify/manage permission should be disabled based on view permission
  function shouldDisableModify(permissionKey: string, permissions: { [key: string]: boolean } | undefined): boolean {
    if (!permissionKey.startsWith('modify_') && !permissionKey.startsWith('manage_')) return false;
    // Handle both modify_ and manage_ prefixes
    const viewKey = permissionKey.replace('modify_', 'view_').replace('manage_', 'view_');
    const viewValue = permissions?.[viewKey] ?? false;
    return !viewValue; // Disable modify/manage if view is false
  }

  async function handleToggleManagerPermission(managerId: number, permissionKey: string, currentValue: boolean) {
    try {
      const token = getToken();
      if (!token) return;

      const newValue = !currentValue;
      const manager = managers.find(m => m.id === managerId);
      
      // If disabling a view permission, also disable corresponding modify/manage permissions
      if (permissionKey.startsWith('view_') && !newValue) {
        const modifyKey = permissionKey.replace('view_', 'modify_');
        const manageKey = permissionKey.replace('view_', 'manage_');
        
        // Disable modify permission if it exists
        if (manager?.permissions?.[modifyKey] !== undefined) {
          const modifyValue = manager.permissions[modifyKey];
          if (modifyValue) {
            await fetch(`${API_BASE}/admin/managers/${managerId}/permissions`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                permission_key: modifyKey,
                allowed: false,
              }),
            });
          }
        }
        
        // Disable manage permission if it exists
        if (manager?.permissions?.[manageKey] !== undefined) {
          const manageValue = manager.permissions[manageKey];
          if (manageValue) {
            await fetch(`${API_BASE}/admin/managers/${managerId}/permissions`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                permission_key: manageKey,
                allowed: false,
              }),
            });
          }
        }
      }

      // If permission is currently set (not using role default), we need to toggle it
      // If it's using role default, we need to create a user-specific permission
      const hasUserSpecific = manager?.permissions && manager.permissions[permissionKey] !== undefined;
      
      if (hasUserSpecific) {
        // Toggle existing user-specific permission
        const res = await fetch(`${API_BASE}/admin/managers/${managerId}/permissions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permission_key: permissionKey,
            allowed: newValue,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          toast.success('Permission updated successfully');
          await loadManagers();
          // Update selected manager if modal is open
          if (selectedManager && selectedManager.id === managerId) {
            const updated = managers.find(m => m.id === managerId);
            if (updated) setSelectedManager(updated);
          }
        } else {
          toast.error(data.error || 'Failed to update permission');
        }
      } else {
        // Create new user-specific permission
        const res = await fetch(`${API_BASE}/admin/managers/${managerId}/permissions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permission_key: permissionKey,
            allowed: newValue,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          toast.success('Permission updated successfully');
          await loadManagers();
          // Update selected manager if modal is open
          if (selectedManager && selectedManager.id === managerId) {
            const updated = managers.find(m => m.id === managerId);
            if (updated) setSelectedManager(updated);
          }
        } else {
          toast.error(data.error || 'Failed to update permission');
        }
      }
    } catch (err) {
      toast.error('Failed to update permission');
      console.error(err);
    }
  }

  function groupPermissions(keys: string[]): { category: string; permissions: string[] }[] {
    const groups: { [category: string]: string[] } = {
      'View Access': [],
      'Survey Management': [],
      'Employee Management': [],
      'Candidate Management': [],
    };

    keys.forEach(key => {
      if (key.startsWith('view_')) {
        groups['View Access'].push(key);
      } else if (key.includes('survey')) {
        groups['Survey Management'].push(key);
      } else if (key.includes('employee')) {
        groups['Employee Management'].push(key);
      } else if (key.includes('candidate')) {
        groups['Candidate Management'].push(key);
      } else {
        groups['View Access'].push(key);
      }
    });

    return Object.entries(groups)
      .filter(([_, perms]) => perms.length > 0)
      .map(([category, permissions]) => ({ category, permissions }));
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-base" style={{ color: '#6B7280' }}>Loading sub accounts...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  // Only show this page to admin users
  if (userRole !== 'admin') {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="rounded-xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <p className="text-base" style={{ color: '#6B7280' }}>
                This page is only available to admin users.
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Sub Accounts</h1>
                <p className="text-base" style={{ color: '#6B7280' }}>Manage manager accounts and permissions for your dealership</p>
              </div>
              {activeTab === 'managers' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="cursor-pointer px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
                  style={{ 
                    backgroundColor: '#0B2E65', 
                    color: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c5aa0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0B2E65'}
                >
                  + Create Manager
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={() => setActiveTab('managers')}
                className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === 'managers' ? 'border-b-2' : ''
                }`}
                style={{
                  color: activeTab === 'managers' ? '#0B2E65' : '#6B7280',
                  borderBottomColor: activeTab === 'managers' ? '#0B2E65' : 'transparent',
                }}
              >
                Managers ({managers.length + pendingManagers.length})
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === 'permissions' ? 'border-b-2' : ''
                }`}
                style={{
                  color: activeTab === 'permissions' ? '#0B2E65' : '#6B7280',
                  borderBottomColor: activeTab === 'permissions' ? '#0B2E65' : 'transparent',
                }}
              >
                User Role Permissions
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                <h2 className="text-xl font-bold mb-2" style={{ color: '#232E40' }}>User Role Permissions</h2>
                <p className="text-sm" style={{ color: '#6B7280' }}>Configure what each role can view and access. Admin always has full access.</p>
              </div>
              
              {loadingPermissions ? (
                <div className="p-8 text-center">
                  <p className="text-base" style={{ color: '#6B7280' }}>Loading permissions...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Actions</th>
                        {roles.filter(r => r !== 'admin' && r !== 'corporate').map(role => (
                          <th key={role} className="text-center py-4 px-6 text-sm font-semibold capitalize" style={{ color: '#6B7280' }}>
                            {role.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupPermissions(permissionKeys).map((group, groupIdx) => (
                        <React.Fragment key={groupIdx}>
                          <tr style={{ backgroundColor: '#F9FAFB' }}>
                            <td colSpan={roles.filter(r => r !== 'admin' && r !== 'corporate').length + 1} className="py-3 px-6">
                              <span className="text-sm font-bold uppercase" style={{ color: '#6B7280' }}>{group.category}</span>
                            </td>
                          </tr>
                          {group.permissions.map((permissionKey) => (
                            <tr key={permissionKey} style={{ borderTop: '1px solid #E5E7EB' }}>
                              <td className="py-4 px-6">
                                <span className="text-sm" style={{ color: '#232E40' }}>{getPermissionLabel(permissionKey)}</span>
                              </td>
                              {roles.filter(r => r !== 'admin' && r !== 'corporate').map(role => {
                                const isAllowed = permissions[role]?.[permissionKey] ?? false;
                                const isModify = permissionKey.startsWith('modify_') || permissionKey.startsWith('manage_');
                                const viewKey = permissionKey.replace('modify_', 'view_').replace('manage_', 'view_');
                                const viewAllowed = permissions[role]?.[viewKey] ?? false;
                                const isDisabled = isModify && !viewAllowed;
                                return (
                                  <td key={role} className="py-4 px-6">
                                    <div className="flex items-center justify-center">
                                      <button
                                        onClick={() => {
                                          if (!isDisabled) {
                                            handleTogglePermission(role, permissionKey, isAllowed);
                                          }
                                        }}
                                        disabled={isDisabled}
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                          isDisabled 
                                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                                            : isAllowed 
                                              ? 'bg-[#0B2E65] border-[#0B2E65] cursor-pointer' 
                                              : 'bg-white border-gray-300 cursor-pointer'
                                        }`}
                                        title={isDisabled ? 'View permission must be enabled first' : ''}
                                      >
                                        {isAllowed && !isDisabled && (
                                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Managers Tab */}
          {activeTab === 'managers' && (
            <>
              {/* Pending Managers */}
          {pendingManagers.length > 0 && (
            <div className="mb-8 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Pending Approval ({pendingManagers.length})</h2>
                <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Managers waiting for your approval</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Email</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Role</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Status</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Created</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingManagers.map((manager) => (
                      <tr key={manager.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td className="py-4 px-6">
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{manager.email}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full capitalize" style={{
                            backgroundColor: manager.role === 'hiring_manager' ? '#DBEAFE' : '#D1FAE5',
                            color: manager.role === 'hiring_manager' ? '#1E40AF' : '#065F46'
                          }}>
                            {manager.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                            Pending Approval
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>
                            {new Date(manager.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleApprove(manager.id)}
                              className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                              style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(manager.id)}
                              className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                              style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Approved Managers */}
          <div className="rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
            <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
              <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Active Managers ({managers.length})</h2>
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Approved manager accounts</p>
            </div>
            {managers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base" style={{ color: '#9CA3AF' }}>
                  No approved managers yet.
                </p>
                <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                  Create a manager account or approve pending requests above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Email</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Status</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Approved</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Created</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold" style={{ color: '#6B7280' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((manager) => (
                      <tr key={manager.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td className="py-4 px-6">
                          <span className="text-base font-medium" style={{ color: '#232E40' }}>{manager.email}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full capitalize" style={{
                            backgroundColor: manager.role === 'hiring_manager' ? '#DBEAFE' : '#D1FAE5',
                            color: manager.role === 'hiring_manager' ? '#1E40AF' : '#065F46'
                          }}>
                            {manager.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>
                            {manager.approved_at ? new Date(manager.approved_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm" style={{ color: '#6B7280' }}>
                            {new Date(manager.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => {
                              setSelectedManager(manager);
                              setShowManagerPermissionsModal(true);
                            }}
                            className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                            style={{ 
                              backgroundColor: '#3B82F6', 
                              color: '#FFFFFF'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                          >
                            Manage Permissions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}

          {/* Create Manager Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#232E40' }}>Invite Manager</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Email *</label>
                    <input
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#232E40' }}
                      placeholder="manager@example.com"
                    />
                  </div>
                  <p className="text-xs" style={{ color: '#6B7280', marginTop: '0.5rem' }}>
                    An invitation email will be sent to this address with a registration link.
                  </p>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Role *</label>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="manager"
                          checked={createFormData.role === 'manager'}
                          onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'manager' | 'hiring_manager' })}
                          className="mr-2"
                        />
                        <span className="text-sm" style={{ color: '#232E40' }}>Manager</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="hiring_manager"
                          checked={createFormData.role === 'hiring_manager'}
                          onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'manager' | 'hiring_manager' })}
                          className="mr-2"
                        />
                        <span className="text-sm" style={{ color: '#232E40' }}>Hiring Manager</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateFormData({ email: '', role: 'manager' });
                    }}
                    className="cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateManager}
                    className="cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#0B2E65', color: '#FFFFFF' }}
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manager Permissions Modal */}
          {showManagerPermissionsModal && selectedManager && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#232E40' }}>Manage Permissions</h2>
                <p className="text-sm mb-6" style={{ color: '#6B7280' }}>for {selectedManager.email}</p>
                
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                  <p className="text-xs" style={{ color: '#0369A1' }}>
                    <strong>Note:</strong> Individual permissions override role-based permissions. Unchecking a permission will use the role default.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B7280' }}>Permission</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold" style={{ color: '#6B7280' }}>Allowed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupPermissions(permissionKeys).map((group, groupIdx) => (
                        <React.Fragment key={groupIdx}>
                          <tr style={{ backgroundColor: '#F9FAFB' }}>
                            <td colSpan={2} className="py-2 px-4">
                              <span className="text-xs font-bold uppercase" style={{ color: '#6B7280' }}>{group.category}</span>
                            </td>
                          </tr>
                          {group.permissions.map((permissionKey) => {
                            const currentValue = selectedManager.permissions?.[permissionKey] ?? false;
                            const isModify = permissionKey.startsWith('modify_') || permissionKey.startsWith('manage_');
                            const viewKey = permissionKey.replace('modify_', 'view_').replace('manage_', 'view_');
                            // Check if view permission is enabled (either in user permissions or role permissions)
                            const viewValue = selectedManager.permissions?.[viewKey];
                            // Need to check role permissions if view is not explicitly set
                            const roleViewValue = permissions[selectedManager.role]?.[viewKey] ?? false;
                            const viewAllowed = viewValue !== undefined ? viewValue : roleViewValue;
                            const isDisabled = isModify && !viewAllowed;
                            return (
                              <tr key={permissionKey} style={{ borderTop: '1px solid #E5E7EB' }}>
                                <td className="py-3 px-4">
                                  <span className="text-sm" style={{ color: isDisabled ? '#9CA3AF' : '#232E40' }}>{getPermissionLabel(permissionKey)}</span>
                                  {isDisabled && (
                                    <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>(view permission must be enabled first)</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-center">
                                    <button
                                      onClick={async () => {
                                        if (!isDisabled) {
                                          await handleToggleManagerPermission(selectedManager.id, permissionKey, currentValue);
                                        }
                                      }}
                                      disabled={isDisabled}
                                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                        isDisabled 
                                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                                          : currentValue 
                                            ? 'bg-[#0B2E65] border-[#0B2E65] cursor-pointer' 
                                            : 'bg-white border-gray-300 cursor-pointer'
                                      }`}
                                      title={isDisabled ? 'View permission must be enabled first' : ''}
                                    >
                                      {currentValue && !isDisabled && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowManagerPermissionsModal(false);
                      setSelectedManager(null);
                    }}
                    className="cursor-pointer flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                    style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
