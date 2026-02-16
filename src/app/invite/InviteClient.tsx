'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/layout/RequireAuth';
import HubSidebar from '@/components/sidebar/HubSidebar';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

const COLORS = {
  primary: '#3B5998',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    900: '#0F172A',
  },
};

type InviteCodeRow = {
  id: number;
  type: 'manager_invite' | 'join_code';
  code: string;
  email: string | null;
  role: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  used_at: string | null;
  status: 'active' | 'used' | 'expired';
};

export default function InviteClient() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [creatingCode, setCreatingCode] = useState(false);
  const [createdCode, setCreatedCode] = useState<{ code: string; dealership_name: string; expires_at: string; role?: string } | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [corporateDealershipId, setCorporateDealershipId] = useState<number | null>(null);
  const [inviteHistory, setInviteHistory] = useState<InviteCodeRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sendModal, setSendModal] = useState<{ id: number; type: 'join_code'; code: string } | null>(null);
  const [sendEmail, setSendEmail] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('role'));
      const sid = localStorage.getItem('selected_dealership_id');
      if (sid) setCorporateDealershipId(parseInt(sid, 10));
    }
  }, []);

  const isAdmin = role === 'admin';
  const isCorporate = role === 'corporate';

  // Invite page is admin-only; corporate users are redirected
  useEffect(() => {
    if (role === 'corporate') {
      router.replace('/dashboard');
    }
  }, [role, router]);

  async function loadInviteCodes() {
    if (!isAdmin) return;
    setLoadingHistory(true);
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/admin/invite-codes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const list: InviteCodeRow[] = [
          ...(data.manager_invites || []),
          ...(data.join_codes || []),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setInviteHistory(list);
      }
    } catch {
      toast.error('Failed to load invite codes');
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadInviteCodes();
  }, [isAdmin]);

  function roleLabel(r: string) {
    if (r === 'hiring_manager') return 'Hiring Manager';
    if (r === 'manager') return 'Manager';
    return 'Corporate';
  }

  async function handleCreateAdminJoinCode(selectedRole: 'corporate' | 'manager' | 'hiring_manager') {
    setTypePickerOpen(false);
    setCreatingCode(true);
    setCreatedCode(null);
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/admin/join-codes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, expires_days: 7 }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCode({
          code: data.code,
          dealership_name: data.dealership_name || 'Your dealership',
          expires_at: data.expires_at || '',
          role: data.role || selectedRole,
        });
        toast.success(`Join code created for ${roleLabel(data.role || selectedRole)}. Share it so they can register.`);
        loadInviteCodes();
      } else {
        toast.error(data.error || 'Failed to create join code');
      }
    } catch (err) {
      toast.error('Failed to create join code');
    } finally {
      setCreatingCode(false);
    }
  }

  async function handleResendManagerInvite(id: number) {
    setSendingId(id);
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/admin/manager-invites/${id}/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Invitation resent');
        loadInviteCodes();
      } else {
        toast.error(data.error || 'Failed to resend');
      }
    } catch {
      toast.error('Failed to resend');
    } finally {
      setSendingId(null);
    }
  }

  async function handleSendJoinCode() {
    if (!sendModal || !sendEmail.trim()) return;
    setSendingId(sendModal.id);
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/admin/join-codes/${sendModal.id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sendEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Join code sent');
        setSendModal(null);
        setSendEmail('');
        loadInviteCodes();
      } else {
        toast.error(data.error || 'Failed to send');
      }
    } catch {
      toast.error('Failed to send');
    } finally {
      setSendingId(null);
    }
  }

  async function handleCreateCorporateJoinCode() {
    if (!corporateDealershipId) {
      toast.error('Select a dealership first (use the dropdown in the sidebar).');
      return;
    }
    setCreatingCode(true);
    setCreatedCode(null);
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/corporate/dealerships/${corporateDealershipId}/join-codes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_days: 7 }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCode({
          code: data.code,
          dealership_name: data.dealership_name || 'Dealership',
          expires_at: data.expires_at || '',
        });
        toast.success('Join code created. Share it for corporate registration.');
      } else {
        toast.error(data.error || 'Failed to create join code');
      }
    } catch (err) {
      toast.error('Failed to create join code');
    } finally {
      setCreatingCode(false);
    }
  }

  function handleCopyCode() {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode.code);
    toast.success('Copied to clipboard');
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
        <HubSidebar />
        <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Invite</h1>
            <p className="text-sm" style={{ color: COLORS.gray[500] }}>
              Send manager or hiring manager invites, create corporate join codes, or enter a code you received.
            </p>
          </div>

          <div className="max-w-5xl space-y-6">
            {/* Create invites / codes (admin only; corporate cannot access this page) */}
            {isAdmin && (
              <div
                className="rounded-xl p-8 transition-all duration-200 hover:shadow-lg"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}
              >
                <h2 className="text-lg font-bold mb-4" style={{ color: '#232E40' }}>
                  Create invites &amp; join codes
                </h2>

                <div className="mb-6 pb-6" style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#374151' }}>Invite Manager or Hiring Manager</h3>
                  <p className="text-sm mb-3" style={{ color: COLORS.gray[600] }}>
                    Send an invitation email with a link and a unique code. They can register at the Manager Registration page.
                  </p>
                  <Link
                    href="/users"
                    className="cursor-pointer inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#4D6DBE' }}
                  >
                    Go to User Management →
                  </Link>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                    Invite code (7 days)
                  </h3>
                  <p className="text-sm mb-3" style={{ color: COLORS.gray[600] }}>
                    Create a code so someone can register as Corporate, Manager, or Hiring Manager and join your dealership.
                  </p>
                  <button
                    onClick={() => setTypePickerOpen(true)}
                    disabled={creatingCode}
                    className="cursor-pointer inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#4D6DBE' }}
                  >
                    {creatingCode ? 'Creating…' : 'Create 7-day invite code'}
                  </button>
                  {typePickerOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="rounded-xl p-6 max-w-sm w-full mx-4 bg-white shadow-xl">
                        <h3 className="text-lg font-bold mb-2" style={{ color: '#232E40' }}>Choose invite type</h3>
                        <p className="text-sm mb-4" style={{ color: COLORS.gray[600] }}>
                          Who will use this code to register?
                        </p>
                        <div className="flex flex-col gap-2">
                          {(['corporate', 'manager', 'hiring_manager'] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleCreateAdminJoinCode(r)}
                              disabled={creatingCode}
                              className="cursor-pointer w-full px-4 py-3 rounded-lg font-semibold text-sm text-white transition-colors disabled:opacity-60"
                              style={{ backgroundColor: '#4D6DBE' }}
                            >
                              {roleLabel(r)}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTypePickerOpen(false)}
                          className="cursor-pointer w-full mt-3 px-4 py-2 rounded-lg font-semibold text-sm"
                          style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {createdCode && (
                    <div className="mt-4 p-4 rounded-lg flex items-center justify-between gap-4" style={{ backgroundColor: '#F0F9FF', border: '1px solid #0B2E65' }}>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#374151' }}>
                          Share this code (expires in 7 days){createdCode.role ? ` — ${roleLabel(createdCode.role)}` : ''}
                        </p>
                        <p className="font-mono font-bold text-lg" style={{ color: '#0B2E65' }}>{createdCode.code}</p>
                        <p className="text-xs mt-1" style={{ color: COLORS.gray[600] }}>Dealership: {createdCode.dealership_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="cursor-pointer px-3 py-2 rounded-lg text-sm font-semibold text-white shrink-0"
                        style={{ backgroundColor: '#0B2E65' }}
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invite codes history (admin only) */}
            {isAdmin && (
              <div
                className="rounded-xl p-8 transition-all duration-200"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold" style={{ color: '#232E40' }}>Your invite codes</h2>
                  <button
                    type="button"
                    onClick={loadInviteCodes}
                    disabled={loadingHistory}
                    className="cursor-pointer text-sm font-medium transition-colors disabled:opacity-60 hover:underline"
                    style={{ color: '#4D6DBE' }}
                  >
                    {loadingHistory ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
                {loadingHistory && inviteHistory.length === 0 ? (
                  <p className="text-sm" style={{ color: COLORS.gray[600] }}>Loading invite codes…</p>
                ) : inviteHistory.length === 0 ? (
                  <p className="text-sm" style={{ color: COLORS.gray[600] }}>No invite codes yet. Create one above or send invites from User Management.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm rounded-lg overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                      <thead style={{ backgroundColor: '#F9FAFB' }}>
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Code</th>
                          <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Type</th>
                          <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Email</th>
                          <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Created</th>
                          <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Expires</th>
                          <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Status</th>
                          <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inviteHistory.map((row) => (
                          <tr key={`${row.type}-${row.id}`} style={{ borderTop: '1px solid #E5E7EB' }}>
                            <td className="px-4 py-3 font-mono" style={{ color: '#232E40' }}>{row.code}</td>
                            <td className="px-4 py-3" style={{ color: '#374151' }}>
                              {roleLabel(row.role)}
                            </td>
                            <td className="px-4 py-3" style={{ color: '#374151' }}>{row.email || '—'}</td>
                            <td className="px-4 py-3" style={{ color: '#374151' }}>{new Date(row.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3" style={{ color: '#374151' }}>{new Date(row.expires_at).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span
                                style={{
                                  color: row.status === 'active' ? '#059669' : row.status === 'used' ? '#6B7280' : '#D97706',
                                }}
                                className="font-medium"
                              >
                                {row.status === 'active' ? 'Active' : row.status === 'used' ? 'Used' : 'Expired'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(row.code);
                                    toast.success('Copied');
                                  }}
                                  className="cursor-pointer text-xs font-semibold hover:underline"
                                  style={{ color: '#4D6DBE' }}
                                >
                                  Copy
                                </button>
                                {row.status === 'active' && (
                                  row.type === 'manager_invite' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleResendManagerInvite(row.id)}
                                      disabled={sendingId === row.id}
                                      className="cursor-pointer text-xs font-semibold hover:underline disabled:opacity-60"
                                      style={{ color: '#4D6DBE' }}
                                    >
                                      {sendingId === row.id ? 'Sending…' : 'Resend'}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setSendModal({ id: row.id, type: 'join_code', code: row.code })}
                                      disabled={sendingId === row.id}
                                      className="cursor-pointer text-xs font-semibold hover:underline disabled:opacity-60"
                                      style={{ color: '#4D6DBE' }}
                                    >
                                      Send
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Send join code modal */}
            {sendModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="rounded-xl p-6 max-w-md w-full mx-4 bg-white shadow-xl">
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#232E40' }}>Send join code</h3>
                  <p className="text-sm mb-4" style={{ color: COLORS.gray[600] }}>
                    Enter the email address to send the code <strong>{sendModal.code}</strong> to.
                  </p>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={sendEmail}
                    onChange={(e) => setSendEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border mb-4"
                    style={{ borderColor: '#E5E7EB', color: '#232E40' }}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setSendModal(null); setSendEmail(''); }}
                      className="cursor-pointer flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm"
                      style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendJoinCode}
                      disabled={!sendEmail.trim() || sendingId !== null}
                      className="cursor-pointer flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-60"
                      style={{ backgroundColor: '#4D6DBE' }}
                    >
                      {sendingId !== null ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
