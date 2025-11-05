// src/lib/http.ts
import { getToken } from "@/lib/auth";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5000";

// Plain GET JSON
export async function getJson<T = any>(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

// Authenticated GET JSON (includes Bearer token)
export async function authGetJson<T = any>(path: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`AUTH GET ${path} failed (${res.status})`);
  return (await res.json()) as T;
}
