import { apiGet } from "@/lib/api";

export default async function Home() {
  let health: any = null;
  try {
    health = await apiGet("/health");
  } catch (e) {
    health = { ok: false, error: (e as Error).message };
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Star4ce</h1>
      <p className="mt-2 text-slate-600">Next.js + Flask connection test</p>

      <div className="mt-6 rounded-xl border p-4 bg-white shadow">
        <h2 className="font-semibold mb-2">Backend Health</h2>
        <pre className="text-sm bg-slate-50 p-3 rounded overflow-auto">
{JSON.stringify(health, null, 2)}
        </pre>
        <p className="text-xs text-slate-500 mt-2">
          API Base: {process.env.NEXT_PUBLIC_API_BASE}
        </p>
      </div>
    </main>
  );
}
