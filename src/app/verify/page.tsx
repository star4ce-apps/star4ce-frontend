import { Suspense } from 'react';
import VerifyClient from './VerifyClient';

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-600 text-sm">Verifying...</p>
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
