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

  const data = (await res.json().catch(() => ({}))) as any;

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

  const data = (await res.json().catch(() => ({}))) as any;

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

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}
