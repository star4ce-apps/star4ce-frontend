import { Suspense } from 'react';
import SurveyClient from './SurveyClient';

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-600 text-sm">Loading survey…</p>
        </div>
      }
    >
      <SurveyClient />
    </Suspense>
  );
}
