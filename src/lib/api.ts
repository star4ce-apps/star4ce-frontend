// Normalize API_BASE to ensure it has a protocol and no trailing slash
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
  
  return base;
}

export async function apiGet(path: string) {
  const base = normalizeApiBase(process.env.NEXT_PUBLIC_STAR4CE_API_BASE);
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}
