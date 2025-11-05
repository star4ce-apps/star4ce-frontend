// src/app/login/LoginForm.tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginApi, saveSession } from '@/lib/auth';

export default function LoginForm() {
  const search = useSearchParams();
  const expired = search.get('expired') === '1';
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    try {
      const data = await loginApi(email, password);
      saveSession(data);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg mt-20">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {expired && (
        <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          Your session expired. Please sign in again.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="border rounded w-full p-2 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded w-full p-2 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="cursor-pointer bg-blue-600 text-white py-2 w-full rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
  Don’t have an account? <a href="/register" className="text-blue-700 underline">Create one</a>
</p>

    </div>
  );
}
