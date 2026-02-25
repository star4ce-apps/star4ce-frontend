// src/lib/auth.ts

// Normalize API_BASE to ensure it has a protocol and no trailing slash or paths
function normalizeApiBase(base: string | undefined): string {
  if (!base) {
    return "http://127.0.0.1:5000";
  }
  
  // Remove leading/trailing whitespace
  base = base.trim();
  
  // If it doesn't start with http:// or https://, add https://
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  
  // Remove trailing slash if present
  base = base.replace(/\/$/, "");
  
  // Remove any paths that might have been accidentally included (like /auth/login)
  // Keep only the protocol, domain, and port (if any)
  try {
    const url = new URL(base);
    // Reconstruct with only protocol, hostname, and port
    base = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
  } catch (e) {
    // If URL parsing fails, just use the base as-is (will be caught by fetch)
    console.warn('Failed to parse API_BASE URL:', base);
  }
  
  return base;
}

export const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_STAR4CE_API_BASE);

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
  
  // Safe JSON parsing
  try {
    return await res.json() as { ok: boolean; email: string; role: string; message: string };
  } catch (err) {
    throw new Error('Failed to parse registration response');
  }
}

export async function meApi(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  
  // Safe JSON parsing
  try {
    return await res.json();
  } catch (err) {
    // If JSON parsing fails, return empty object
    return {};
  }
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

// ---- corporate dealership context helpers ----
export function getSelectedDealershipId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("selected_dealership_id");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
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
      // Check content-type before parsing JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await res.json();
          return data;
        } catch (err) {
          // JSON parsing failed
          return null;
        }
      }
      // If not JSON, try to parse anyway but catch errors
      try {
        const data = await res.json();
        return data;
      } catch (err) {
        return null;
      }
    }
    return null;
  } catch (err) {
    // Suppress errors - network issues shouldn't break the app
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

