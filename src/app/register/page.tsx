'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerApi, saveSession } from '@/lib/auth'; // <-- add these

export default function RegisterPage() {
  const router = useRouter();

  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Backend only uses email/password today; keep sending company for future use
      const data = await registerApi(email, password); // { ok, token, role, email }
      saveSession({ token: data.token, email: data.email, role: data.role });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Create Account</h1>
      <p className="mt-2 text-slate-600">Start your Star4ce trial.</p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Dealership / Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Work Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Password (min 8 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <button
          disabled={loading}
          className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <div className="mt-4 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-700 underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
