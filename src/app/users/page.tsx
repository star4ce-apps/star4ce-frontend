'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  const [showCreateJoinCodeModal, setShowCreateJoinCodeModal] = useState(false);
  const [createdJoinCode, setCreatedJoinCode] = useState<{ code: string; dealership_name: string; expires_at: string; role?: string } | null>(null);
  const [creatingJoinCode, setCreatingJoinCode] = useState(false);

  function joinCodeRoleLabel(r: string) {
    if (r === 'hiring_manager') return 'Hiring Manager';
    if (r === 'manager') return 'Manager';
    return 'Corporate';
  }
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [pendingPermissions, setPendingPermissions] = useState<{ [key: string]: boolean } | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

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
        const code = data.invite?.code;
        if (code) {
          toast.success(
            `${data.message || 'Invitation sent.'} Invite code: ${code}`,
            { duration: 8000 }
          );
        } else {
          toast.success(data.message || 'Invitation sent successfully');
        }
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

  async function handleCreateJoinCode(role: 'corporate' | 'manager' | 'hiring_manager') {
    setCreatingJoinCode(true);
    setCreatedJoinCode(null);
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/admin/join-codes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, expires_days: 7 }),
      });
      const data = await res.json();
      if (res.ok) {
        const resolvedRole = data.role || role;
        setCreatedJoinCode({
          code: data.code,
          dealership_name: data.dealership_name || 'Your dealership',
          expires_at: data.expires_at || '',
          role: resolvedRole,
        });
        toast.success(`Join code created for ${joinCodeRoleLabel(resolvedRole)}. Share it so they can register.`);
      } else {
        toast.error(data.error || 'Failed to create join code');
      }
    } catch (err) {
      toast.error('Failed to create join code');
      console.error(err);
    } finally {
      setCreatingJoinCode(false);
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

  async function handleToggleRole(managerId: number, currentRole: string) {
    const newRole = currentRole === 'hiring_manager' ? 'manager' : 'hiring_manager';
    const roleName = newRole === 'hiring_manager' ? 'Hiring Manager' : 'Manager';
    
    if (!confirm(`Are you sure you want to change this user's role to ${roleName}?`)) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      // Try PATCH endpoint first
      let res = await fetch(`${API_BASE}/admin/managers/${managerId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      // If PATCH doesn't work, try PUT
      if (!res.ok && res.status === 405) {
        res = await fetch(`${API_BASE}/admin/managers/${managerId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        });
      }

      // If still doesn't work, try POST to a role update endpoint
      if (!res.ok) {
        res = await fetch(`${API_BASE}/admin/managers/${managerId}/role`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        toast.success(`Role updated to ${roleName} successfully`);
        await loadManagers();
      } else {
        toast.error(data.error || 'Failed to update role');
      }
    } catch (err) {
      toast.error('Failed to update role');
      console.error(err);
    }
  }

  function getManagerTypeDisplay(role: string): string {
    if (role === 'admin') return 'Admin';
    if (role === 'hiring_manager') return 'Hiring Manager';
    return 'Manager';
  }

  function getStatusDisplay(manager: Manager): { text: string; color: string; bgColor: string } {
    if (!manager.is_verified) {
      return { text: 'Unverified', color: '#DC2626', bgColor: '#FEE2E2' };
    }
    if (!manager.is_approved) {
      return { text: 'Pending Approval', color: '#D97706', bgColor: '#FEF3C7' };
    }
    return { text: 'Active', color: '#059669', bgColor: '#D1FAE5' };
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
      process_interviews: 'Process Interviews',
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Map modify_/manage_ permission keys to the correct view_ key (backend uses view_surveys, view_employees, view_candidates)
  function getViewKeyForPermission(permissionKey: string): string | null {
    if (!permissionKey.startsWith('modify_') && !permissionKey.startsWith('manage_')) return null;
    if (permissionKey.includes('survey')) return 'view_surveys';
    if (permissionKey.includes('employee')) return 'view_employees';
    if (permissionKey.includes('candidate')) return 'view_candidates';
    return permissionKey.replace('modify_', 'view_').replace('manage_', 'view_');
  }

  // Check if a modify/manage permission should be disabled based on view permission
  function shouldDisableModify(permissionKey: string, permissions: { [key: string]: boolean } | undefined): boolean {
    const viewKey = getViewKeyForPermission(permissionKey);
    if (!viewKey) return false;
    const viewValue = permissions?.[viewKey] ?? false;
    return !viewValue; // Disable modify/manage if view is false
  }

  function handleToggleManagerPermission(managerId: number, permissionKey: string, currentValue: boolean) {
    if (!selectedManager || selectedManager.id !== managerId) return;

    const newValue = !currentValue;
    
    // Store pending changes instead of saving immediately
    let updatedPermissions: { [key: string]: boolean };
    if (pendingPermissions) {
      updatedPermissions = { ...pendingPermissions };
    } else {
      // Initialize with current permissions
      updatedPermissions = { ...(selectedManager.permissions || {}) };
    }
    
    if (permissionKey === 'process_interviews') {
      // Update pending role
      setPendingRole(newValue ? 'hiring_manager' : 'manager');
      updatedPermissions[permissionKey] = newValue;
    } else {
      updatedPermissions[permissionKey] = newValue;
    }
    
    setPendingPermissions(updatedPermissions);
  }

  async function handleSaveAndExit() {
    if (!selectedManager) return;

    try {
      const token = getToken();
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }

      if (!API_BASE) {
        toast.error('API configuration error. Please refresh the page.');
        console.error('API_BASE is not defined');
        return;
      }

      const managerId = selectedManager.id;
      const hasPendingChanges = pendingPermissions !== null || pendingRole !== null;

      if (!hasPendingChanges) {
        // No changes to save, just close
        setShowManagerPermissionsModal(false);
        setSelectedManager(null);
        setPendingPermissions(null);
        setPendingRole(null);
        return;
      }

      // Save scroll position
      const scrollPosition = modalContentRef.current?.scrollTop || 0;

      // Save pending permissions
      if (pendingPermissions) {
        for (const [permissionKey, allowed] of Object.entries(pendingPermissions)) {
          // Special handling for process_interviews
          if (permissionKey === 'process_interviews') {
            const newRole = allowed ? 'hiring_manager' : 'manager';
            
            try {
              // Update permission
              const url = `${API_BASE}/admin/managers/${managerId}/permissions`;
              console.log('Updating permission:', { url, permissionKey, allowed, managerId });
              
              const permRes = await fetch(url, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  permission_key: permissionKey,
                  allowed: allowed,
                }),
              });

              console.log('Permission update response:', { status: permRes.status, ok: permRes.ok });

              if (!permRes.ok) {
                const data = await permRes.json().catch(() => ({ error: 'Failed to update permission' }));
                console.error('Permission update failed:', data);
                toast.error(data.error || 'Failed to update permission');
                return;
              }
            } catch (err) {
              console.error('Error updating permission:', err);
              console.error('API_BASE:', API_BASE);
              console.error('Manager ID:', managerId);
              console.error('Permission Key:', permissionKey);
              toast.error(`Network error: Failed to update permission. ${err instanceof Error ? err.message : 'Please check your connection.'}`);
              return;
            }

            try {
              // Update role
              let roleRes = await fetch(`${API_BASE}/admin/managers/${managerId}`, {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
              });

              if (!roleRes.ok && roleRes.status === 405) {
                roleRes = await fetch(`${API_BASE}/admin/managers/${managerId}`, {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ role: newRole }),
                });
              }

              if (!roleRes.ok) {
                roleRes = await fetch(`${API_BASE}/admin/managers/${managerId}/role`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ role: newRole }),
                });
              }

              if (roleRes.ok) {
                toast.success(`Permission updated and role set to ${newRole === 'hiring_manager' ? 'Hiring Manager' : 'Manager'}`);
              } else {
                const data = await roleRes.json().catch(() => ({ error: 'Failed to update role' }));
                toast.error(data.error || 'Failed to update role');
                return;
              }
            } catch (err) {
              console.error('Error updating role:', err);
              toast.error('Network error: Failed to update role. Please check your connection.');
              return;
            }
          } else {
            // Regular permission update
            try {
              const res = await fetch(`${API_BASE}/admin/managers/${managerId}/permissions`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  permission_key: permissionKey,
                  allowed: allowed,
                }),
              });

              if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Failed to update permission' }));
                toast.error(data.error || 'Failed to update permission');
                return;
              }
            } catch (err) {
              console.error('Error updating permission:', err);
              toast.error(`Network error: Failed to update ${permissionKey}. Please check your connection.`);
              return;
            }

            // If disabling a view permission, also disable corresponding modify/manage permissions
            if (permissionKey.startsWith('view_') && !allowed) {
              const modifyKey = permissionKey.replace('view_', 'modify_');
              const manageKey = permissionKey.replace('view_', 'manage_');
              
              // Check if these permissions exist in pending or current permissions
              const hasModify = pendingPermissions?.[modifyKey] !== undefined || selectedManager.permissions?.[modifyKey] !== undefined;
              const hasManage = pendingPermissions?.[manageKey] !== undefined || selectedManager.permissions?.[manageKey] !== undefined;
              
              // Disable modify permission if it exists and is enabled
              if (hasModify) {
                const modifyValue = pendingPermissions?.[modifyKey] ?? selectedManager.permissions?.[modifyKey];
                if (modifyValue) {
                  try {
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
                  } catch (err) {
                    console.error('Error disabling modify permission:', err);
                    // Continue with other permissions even if this fails
                  }
                }
              }
              
              // Disable manage permission if it exists and is enabled
              if (hasManage) {
                const manageValue = pendingPermissions?.[manageKey] ?? selectedManager.permissions?.[manageKey];
                if (manageValue) {
                  try {
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
                  } catch (err) {
                    console.error('Error disabling manage permission:', err);
                    // Continue with other permissions even if this fails
                  }
                }
              }
            }
          }
        }
      }

      // If pendingRole is set but process_interviews wasn't in pendingPermissions, update role separately
      if (pendingRole && (!pendingPermissions || !pendingPermissions['process_interviews'])) {
        try {
          let roleRes = await fetch(`${API_BASE}/admin/managers/${managerId}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: pendingRole }),
          });

          if (!roleRes.ok && roleRes.status === 405) {
            roleRes = await fetch(`${API_BASE}/admin/managers/${managerId}`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ role: pendingRole }),
            });
          }

          if (!roleRes.ok) {
            roleRes = await fetch(`${API_BASE}/admin/managers/${managerId}/role`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ role: pendingRole }),
            });
          }

          if (!roleRes.ok) {
            const data = await roleRes.json().catch(() => ({ error: 'Failed to update role' }));
            toast.error(data.error || 'Failed to update role');
            return;
          }
        } catch (err) {
          console.error('Error updating role:', err);
          toast.error('Network error: Failed to update role. Please check your connection.');
          return;
        }
      }

      // Reload managers and close modal
      await loadManagers();
      toast.success('Permissions saved successfully');
      
      setShowManagerPermissionsModal(false);
      setSelectedManager(null);
      setPendingPermissions(null);
      setPendingRole(null);
    } catch (err) {
      toast.error('Failed to save permissions');
      console.error(err);
    }
  }

  function handleCloseWithoutSaving() {
    setShowManagerPermissionsModal(false);
    setSelectedManager(null);
    setPendingPermissions(null);
    setPendingRole(null);
  }


  function groupPermissions(keys: string[]): { category: string; permissions: string[] }[] {
    const groups: { [category: string]: string[] } = {
      'View Access': [],
      'Survey Management': [],
      'Employee Management': [],
      'Candidate Management': [],
      'Interview Management': [],
    };

    keys.forEach(key => {
      if (key === 'process_interviews') {
        groups['Interview Management'].push(key);
      } else if (key.startsWith('view_')) {
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
              <p className="text-base" style={{ color: '#6B7280' }}>Loading user management...</p>
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
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#232E40' }}>User Management</h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>Manage manager accounts, roles, and permissions for your dealership</p>
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
              <button
                onClick={() => {
                  setShowCreateJoinCodeModal(true);
                  setCreatedJoinCode(null);
                }}
                className="cursor-pointer px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
                style={{ backgroundColor: '#0B2E65', color: '#FFFFFF' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2c5aa0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0B2E65'; }}
              >
                Create join code
              </button>
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
                                const viewKey = getViewKeyForPermission(permissionKey);
                                const viewAllowed = viewKey ? (permissions[role]?.[viewKey] ?? false) : true;
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
                    <tr style={{ borderBottom: '2px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                      <th className="text-left py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Email</th>
                      <th className="text-left py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Role</th>
                      <th className="text-left py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Status</th>
                      <th className="text-left py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Created</th>
                      <th className="text-center py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingManagers.map((manager) => {
                      const status = getStatusDisplay(manager);
                      const isHiringManager = manager.role === 'hiring_manager';
                      const roleDisplay = manager.role === 'admin' ? 'Admin' : isHiringManager ? 'Hiring Manager' : 'Manager';
                      return (
                        <tr key={manager.id} style={{ borderTop: '1px solid #E5E7EB' }} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <span className="text-base font-medium" style={{ color: '#232E40' }}>{manager.email}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-medium" style={{ color: '#232E40' }}>{roleDisplay}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{
                              backgroundColor: status.bgColor,
                              color: status.color
                            }}>
                              {status.text}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm" style={{ color: '#6B7280' }}>
                              {manager.created_at ? (() => { const d = new Date(manager.created_at); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(); })() : '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleApprove(manager.id)}
                                className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:shadow-md"
                                style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(manager.id)}
                                className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:shadow-md"
                                style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                    <tr style={{ borderBottom: '2px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                      <th className="text-left py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Email</th>
                      <th className="text-left py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Role</th>
                      <th className="text-left py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Status</th>
                      <th className="text-left py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Approved</th>
                      <th className="text-left py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Created</th>
                      <th className="text-center py-4 px-6 text-sm font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((manager) => {
                      const status = getStatusDisplay(manager);
                      const isAdmin = manager.role === 'admin';
                      const isHiringManager = manager.role === 'hiring_manager';
                      const roleDisplay = isAdmin ? 'Admin' : isHiringManager ? 'Hiring Manager' : 'Manager';
                      return (
                        <tr key={manager.id} style={{ borderTop: '1px solid #E5E7EB' }} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <span className="text-base font-medium" style={{ color: '#232E40' }}>{manager.email}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-medium" style={{ color: '#232E40' }}>{roleDisplay}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{
                              backgroundColor: status.bgColor,
                              color: status.color
                            }}>
                              {status.text}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm" style={{ color: '#6B7280' }}>
                              {manager.approved_at ? new Date(manager.approved_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm" style={{ color: '#6B7280' }}>
                              {manager.created_at ? (() => { const d = new Date(manager.created_at); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(); })() : '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex gap-2 justify-center items-center">
                              {!isAdmin && (
                                <button
                              onClick={() => {
                                setSelectedManager(manager);
                                setPendingPermissions(null);
                                setPendingRole(null);
                                setShowManagerPermissionsModal(true);
                              }}
                                  className="cursor-pointer p-2 rounded-lg transition-all hover:bg-gray-100"
                                  style={{ color: '#6B7280' }}
                                  title="Manage Permissions"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                    An invitation email will be sent with a registration link and a unique code. They can register at the Manager Registration page and enter the code if they don&apos;t use the link. The code will be shown after sending.
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

          {/* Create join code modal (Corporate / Manager / Hiring Manager) */}
          {showCreateJoinCodeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#232E40' }}>Create join code</h2>
                {!createdJoinCode ? (
                  <>
                    <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                      Choose who will use this code to register. They can enter it on the Manager Registration or Corporate Registration page.
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                      {(['corporate', 'manager', 'hiring_manager'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleCreateJoinCode(r)}
                          disabled={creatingJoinCode}
                          className="cursor-pointer w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
                          style={{ backgroundColor: '#0B2E65', color: '#FFFFFF' }}
                        >
                          {creatingJoinCode ? 'Creating...' : joinCodeRoleLabel(r)}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowCreateJoinCodeModal(false)}
                      className="cursor-pointer w-full px-4 py-2 rounded-lg font-semibold text-sm"
                      style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                      Share this code (expires in 7 days){createdJoinCode.role ? ` — ${joinCodeRoleLabel(createdJoinCode.role)}` : ''}:
                    </p>
                    <div className="flex items-center gap-2 p-3 rounded-lg mb-4" style={{ backgroundColor: '#F0F9FF', border: '1px solid #0B2E65' }}>
                      <span className="font-mono font-bold text-lg" style={{ color: '#0B2E65' }}>{createdJoinCode.code}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(createdJoinCode.code);
                          toast.success('Copied to clipboard');
                        }}
                        className="cursor-pointer px-2 py-1 rounded text-sm font-medium"
                        style={{ backgroundColor: '#0B2E65', color: '#FFFFFF' }}
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Dealership: {createdJoinCode.dealership_name}</p>
                    <button
                      onClick={() => {
                        setShowCreateJoinCodeModal(false);
                        setCreatedJoinCode(null);
                      }}
                      className="cursor-pointer w-full px-4 py-2 rounded-lg font-semibold text-sm"
                      style={{ backgroundColor: '#0B2E65', color: '#FFFFFF' }}
                    >
                      Done
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Manager Permissions Modal */}
          {showManagerPermissionsModal && selectedManager && (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(245, 247, 250, 0.8)', backdropFilter: 'blur(2px)' }}>
              <div className="rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl" style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}>
                {/* Blue Header Bar */}
                <div className="px-8 py-6" style={{ backgroundColor: '#0B2E65' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1" style={{ color: '#FFFFFF' }}>Manage Permissions</h2>
                      <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>for {selectedManager.email}</p>
                    </div>
                    <button
                      onClick={handleCloseWithoutSaving}
                      className="cursor-pointer p-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-20"
                      style={{ color: '#FFFFFF' }}
                      title="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Content Area */}
                <div ref={modalContentRef} className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                
                  {/* Set as Hiring Manager Toggle */}
                  <div className="mb-6 p-4 rounded-lg border-2" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-base font-semibold cursor-pointer" style={{ color: '#232E40' }}>
                          Set as Hiring Manager
                        </label>
                        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                          Enabling this will set the user as a Hiring Manager and grant Process Interviews permission
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const isHiringManager = pendingRole === 'hiring_manager' || (!pendingRole && selectedManager.role === 'hiring_manager');
                          const newRole = isHiringManager ? 'manager' : 'hiring_manager';
                          setPendingRole(newRole);
                          
                          // Also update pending permissions for process_interviews
                          let updatedPermissions: { [key: string]: boolean };
                          if (pendingPermissions) {
                            updatedPermissions = { ...pendingPermissions };
                          } else {
                            updatedPermissions = { ...(selectedManager.permissions || {}) };
                          }
                          updatedPermissions['process_interviews'] = !isHiringManager;
                          setPendingPermissions(updatedPermissions);
                        }}
                        className={`w-14 h-8 rounded-full flex items-center transition-colors ${
                          (pendingRole === 'hiring_manager' || (!pendingRole && selectedManager.role === 'hiring_manager'))
                            ? 'bg-[#0B2E65]'
                            : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white transition-transform ${
                            (pendingRole === 'hiring_manager' || (!pendingRole && selectedManager.role === 'hiring_manager'))
                              ? 'translate-x-7'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                
                  <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      <strong style={{ color: '#232E40' }}>Note:</strong> Individual permissions override role-based permissions. Unchecking a permission will use the role default.
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
                            // Use pending changes if available, otherwise use current values
                            let currentValue: boolean;
                            if (permissionKey === 'process_interviews') {
                              // Check pending role first, then current role
                              if (pendingRole !== null) {
                                currentValue = pendingRole === 'hiring_manager';
                              } else if (pendingPermissions && pendingPermissions[permissionKey] !== undefined) {
                                currentValue = pendingPermissions[permissionKey];
                              } else {
                                currentValue = selectedManager.role === 'hiring_manager';
                              }
                            } else {
                              // Check pending permissions first, then current permissions
                              if (pendingPermissions && pendingPermissions[permissionKey] !== undefined) {
                                currentValue = pendingPermissions[permissionKey];
                              } else {
                                currentValue = selectedManager.permissions?.[permissionKey] ?? false;
                              }
                            }
                            
                            const isModify = permissionKey.startsWith('modify_') || permissionKey.startsWith('manage_');
                            const viewKey = getViewKeyForPermission(permissionKey);
                            // Check if view permission is enabled (check pending first, then current permissions, then role permissions)
                            let viewValue: boolean | undefined;
                            if (viewKey) {
                              if (pendingPermissions && pendingPermissions[viewKey] !== undefined) {
                                viewValue = pendingPermissions[viewKey];
                              } else {
                                viewValue = selectedManager.permissions?.[viewKey];
                              }
                            }
                            // Need to check role permissions if view is not explicitly set
                            const roleViewValue = viewKey ? (permissions[selectedManager.role]?.[viewKey] ?? false) : true;
                            const viewAllowed = viewValue !== undefined ? viewValue : roleViewValue;
                            const isDisabled = isModify && !viewAllowed;
                            
                            // Special note for process_interviews
                            const isProcessInterviews = permissionKey === 'process_interviews';
                            
                            return (
                              <tr key={permissionKey} style={{ borderTop: '1px solid #E5E7EB' }}>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm" style={{ color: isDisabled ? '#9CA3AF' : '#232E40' }}>{getPermissionLabel(permissionKey)}</span>
                                    {isProcessInterviews && (
                                      <span className="text-xs mt-1" style={{ color: '#6B7280' }}>
                                        (Enabling this will set the user as Hiring Manager)
                                      </span>
                                    )}
                                    {isDisabled && !isProcessInterviews && (
                                      <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>(view permission must be enabled first)</span>
                                    )}
                                  </div>
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
                                      title={isDisabled ? 'View permission must be enabled first' : isProcessInterviews ? 'Toggle Process Interviews permission (will update role)' : ''}
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

                  <div className="flex gap-3 mt-8 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <button
                      onClick={handleCloseWithoutSaving}
                      className="cursor-pointer flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                      style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    >
                      Close without saving
                    </button>
                    <button
                      onClick={handleSaveAndExit}
                      className="cursor-pointer flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                      style={{ backgroundColor: '#0B2E65', color: '#FFFFFF' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c5aa0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0B2E65'}
                    >
                      Save and Exit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
