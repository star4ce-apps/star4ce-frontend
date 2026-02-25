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

export async function apiGet(path: string) {
  const base = normalizeApiBase(process.env.NEXT_PUBLIC_STAR4CE_API_BASE);
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  
  // Check content-type before parsing JSON
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch (err) {
      throw new Error(`Failed to parse JSON response from ${path}`);
    }
  }
  
  // If not JSON, try to parse anyway but catch errors
  try {
    return await res.json();
  } catch (err) {
    throw new Error(`Response from ${path} is not valid JSON`);
  }
}
