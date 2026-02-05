'use client';

import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';

export default function HelpSupportPage() {
  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1" style={{ color: '#232E40' }}>Help & Support</h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>Get help and contact support</p>
          </div>
          <div className="rounded-xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
            <p style={{ color: '#9CA3AF' }}>Help and support content will be displayed here.</p>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

