import { API_BASE, getToken } from './auth';

type Permissions = {
  [key: string]: boolean;
};

let cachedPermissions: Permissions | null = null;
let permissionsPromise: Promise<Permissions> | null = null;

export async function getUserPermissions(): Promise<Permissions> {
  // Return cached permissions if available
  if (cachedPermissions) {
    return cachedPermissions;
  }

  // If a request is already in progress, return that promise
  if (permissionsPromise) {
    return permissionsPromise;
  }

  // Start new request
  permissionsPromise = (async () => {
    try {
      const token = getToken();
      if (!token) {
        return {};
      }

      const res = await fetch(`${API_BASE}/auth/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        cachedPermissions = data.permissions || {};
        return cachedPermissions;
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
    
    return {};
  })();

  const result = await permissionsPromise;
  permissionsPromise = null;
  return result;
}

export function clearPermissionsCache() {
  cachedPermissions = null;
  permissionsPromise = null;
}

export async function hasPermission(permissionKey: string): Promise<boolean> {
  const permissions = await getUserPermissions();
  return permissions[permissionKey] === true;
}

// Helper to check if user can manage (create/edit/delete)
export async function canManage(permissionKey: string): Promise<boolean> {
  // Admin always can manage
  const role = localStorage.getItem('role') || localStorage.getItem('userRole');
  if (role === 'admin') {
    return true;
  }
  
  return hasPermission(permissionKey);
}

