// src/lib/auth.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5000";

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    // Handle unverified users specially
    if (res.status === 403 && data.error === "unverified") {
      const error = new Error("unverified");
      (error as any).data = data;
      throw error;
    }
    // Provide more helpful error messages
    const errorMsg = data.error || `Login failed (${res.status})`;
    throw new Error(errorMsg);
  }
  
  return data as { token: string; role: string; email: string };
}

export async function registerApi(email: string, password: string, role: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Register failed (${res.status})`);
  }
  return res.json() as Promise<{ ok: boolean; email: string; role: string; message: string }>;
}

export async function meApi(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.json();
}

// ---- local session helpers ----
const TOKEN_KEY = "star4ce_token";
const EMAIL_KEY = "email";
const ROLE_KEY = "role";

export function saveSession(p: { token: string; email: string; role: string }) {
  localStorage.setItem(TOKEN_KEY, p.token);
  localStorage.setItem(EMAIL_KEY, p.email);
  localStorage.setItem(ROLE_KEY, p.role); 
}

export function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}

export function getRole() {
  return typeof window !== "undefined" ? localStorage.getItem(ROLE_KEY) : null;
}

export function getEmail() {
  return typeof window !== "undefined" ? localStorage.getItem(EMAIL_KEY) : null;
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  } catch (err) {
    console.error('Failed to get current user:', err);
    return null;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(ROLE_KEY);
  }
}

