'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to /auth/register when backend is ready
    alert(`(demo) registering ${company} / ${email}`);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Create Account</h1>
      <p className="mt-2 text-slate-600">Start your Star4ce trial.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Dealership / Company"
          value={company}
          onChange={e=>setCompany(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Work Email"
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
          minLength={8}
        />
        <button
          disabled={loading}
          className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <div className="mt-4 text-sm">
        Already have an account? <Link href="/login" className="text-blue-700 underline">Sign in</Link>
      </div>
    </div>
  );
}
