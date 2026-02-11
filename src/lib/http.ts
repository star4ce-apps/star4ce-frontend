// src/lib/http.ts
import { API_BASE, getSelectedDealershipId, getToken } from '@/lib/auth';

function maybeDealershipHeader(): Record<string, string> {
  // Corporate users operate "one dealership at a time" via this header.
  const selectedId = getSelectedDealershipId();
  return selectedId ? { 'X-Dealership-Id': String(selectedId) } : {};
}

export async function postJsonAuth<T = any>(
  path: string,
  body: unknown,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...maybeDealershipHeader(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  // Check content-type before parsing JSON
  const contentType = res.headers.get('content-type');
  let data: any = {};
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (err) {
      // If JSON parsing fails, data remains {}
      data = {};
    }
  } else {
    // If not JSON, try to parse anyway but catch errors
    try {
      data = await res.json();
    } catch (err) {
      // If parsing fails, return empty object
      data = {};
    }
  }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

// 👉 Add this below:

export async function getJson<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    cache: 'no-store',
    ...init,
  });

  // Check content-type before parsing JSON
  const contentType = res.headers.get('content-type');
  let data: any = {};
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (err) {
      // If JSON parsing fails, data remains {}
      data = {};
    }
  } else {
    // If not JSON, try to parse anyway but catch errors
    try {
      data = await res.json();
    } catch (err) {
      // If parsing fails, return empty object
      data = {};
    }
  }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

export async function putJsonAuth<T = any>(
  path: string,
  body: unknown,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...maybeDealershipHeader(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type');
  let data: any = {};
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = {};
    }
  } else {
    try {
      data = await res.json();
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

export async function getJsonAuth<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    cache: 'no-store',
    ...init,
    headers: {
      ...(init.headers || {}),
      ...maybeDealershipHeader(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // Check content-type before parsing JSON
  const contentType = res.headers.get('content-type');
  let data: any = {};
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (err) {
      // If JSON parsing fails, data remains {}
      data = {};
    }
  } else {
    // If not JSON, try to parse anyway but catch errors
    try {
      data = await res.json();
    } catch (err) {
      // If parsing fails, return empty object
      data = {};
    }
  }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

export async function deleteJsonAuth<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...maybeDealershipHeader(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // Check content-type before parsing JSON
  const contentType = res.headers.get('content-type');
  let data: any = {};
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (err) {
      // If JSON parsing fails, data remains {}
      data = {};
    }
  } else {
    // If not JSON, try to parse anyway but catch errors
    try {
      data = await res.json();
    } catch (err) {
      // If parsing fails, return empty object
      data = {};
    }
  }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}