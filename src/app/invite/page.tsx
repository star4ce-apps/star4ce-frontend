import { Suspense } from 'react';
import InviteClient from '../invite/InviteClient';

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <InviteClient />
    </Suspense>
  );
}
