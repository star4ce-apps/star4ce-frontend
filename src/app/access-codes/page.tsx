// src/app/access-codes/page.tsx
import { Suspense } from 'react';
import AccessCodesClient from './AccessCodesClient';

export default function AccessCodesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading access codes…</div>}>
      <AccessCodesClient />
    </Suspense>
  );
}
