'use client';

import HubSidebar from '@/components/sidebar/HubSidebar';

export default function StandingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-0">
      <div className="md:flex md:gap-6">
        {/* Optional sidebar */}
        {/* <HubSidebar /> */}
        <section className="flex-1 bg-white border rounded-lg p-6">
          <h1 className="text-xl font-semibold text-slate-900">Dealership Standings</h1>
          <p className="mt-2 text-slate-600">Coming soon.</p>
        </section>
      </div>
    </div>
  );
}
