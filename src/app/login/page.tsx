'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to /auth/login when backend is ready
    alert(`(demo) logging in as ${email}`);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Dealer Login</h1>
      <p className="mt-2 text-slate-700">Manager/Corporate portal.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          required
        />
        <button
          disabled={loading}
          className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 text-sm">
        New here? <Link href="/register" className="text-blue-700 underline">Create an account</Link>
      </div>
    </div>
  );
}
