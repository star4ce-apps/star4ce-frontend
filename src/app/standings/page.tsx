const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export type LoginResp = { token: string; role: string; email: string };

export async function loginApi(email: string, password: string): Promise<LoginResp> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
