export async function apiGet(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5000";
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}
