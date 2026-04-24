'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import RequireAuth from '@/components/layout/RequireAuth';
import HubSidebar from '@/components/sidebar/HubSidebar';
import { getQuestionBank, createInterviewSession, getInterviewSession, upsertInterviewResponses } from '@/lib/interviewApi';
import type { InterviewQuestionBank, InterviewResponse, InterviewRoleKey, InterviewSessionWithResponses } from '@/lib/interviewTypes';

const ROLE_OPTIONS: Array<{ key: InterviewRoleKey; label: string; description: string }> = [
  { key: 'sales', label: 'Sales', description: 'Sales interview question set' },
  { key: 'service', label: 'Service', description: 'Service interview question set' },
  { key: 'office', label: 'Office', description: 'Office/admin interview question set' },
];

export default function CandidateInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id ? parseInt(params.id as string, 10) : NaN;

  const [focusMode, setFocusMode] = useState(false);
  const [roleKey, setRoleKey] = useState<InterviewRoleKey>('sales');
  const [bank, setBank] = useState<InterviewQuestionBank | null>(null);
  const [loadingBank, setLoadingBank] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [session, setSession] = useState<InterviewSessionWithResponses | null>(null);

  // questionId -> note_text
  const [notesByQuestion, setNotesByQuestion] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const questions = useMemo(() => (bank?.questions || []).slice().sort((a, b) => a.order - b.order), [bank]);

  useEffect(() => {
    if (!Number.isFinite(candidateId)) return;
    setBank(null);
    setLoadingBank(true);
    getQuestionBank(roleKey)
      .then((b) => setBank(b))
      .catch((e) => {
        setBank(null);
        toast.error(e instanceof Error ? e.message : 'Failed to load question bank');
      })
      .finally(() => setLoadingBank(false));
    // Reset notes when changing role; session is separate.
    setNotesByQuestion({});
  }, [candidateId, roleKey]);

  async function handleStartSession() {
    if (!Number.isFinite(candidateId)) {
      toast.error('Invalid candidate');
      return;
    }
    setLoadingSession(true);
    try {
      const created = await createInterviewSession(candidateId, roleKey);
      setSessionId(created.id);
      toast.success('Interview session started');
      // Load it immediately (if backend supports it)
      try {
        const loaded = await getInterviewSession(created.id);
        setSession(loaded);
        const mapped: Record<string, string> = {};
        (loaded.responses || []).forEach((r) => (mapped[r.question_id] = r.note_text || ''));
        setNotesByQuestion(mapped);
      } catch {
        // If backend doesn’t support read yet, keep local state.
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to start session');
    } finally {
      setLoadingSession(false);
    }
  }

  async function handleSaveDraft() {
    if (!sessionId) {
      toast.error('Start an interview session first');
      return;
    }
    setSaving(true);
    try {
      const responses: Array<Pick<InterviewResponse, 'question_id' | 'note_text'>> = Object.entries(notesByQuestion).map(
        ([question_id, note_text]) => ({ question_id, note_text })
      );
      await upsertInterviewResponses(sessionId, responses);
      toast.success('Draft saved');
      // Refresh session if available
      try {
        const loaded = await getInterviewSession(sessionId);
        setSession(loaded);
      } catch {
        // ignore
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        {!focusMode && <HubSidebar />}
        <main className={focusMode ? 'flex-1 p-6' : 'ml-64 flex-1 p-8'}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <button
                  type="button"
                  onClick={() => router.push(`/candidates/${candidateId}`)}
                  className="cursor-pointer text-sm text-[#0B2E65] hover:underline mb-2"
                >
                  ← Back to candidate
                </button>
                <h1 className="text-2xl font-semibold text-slate-900">Live Interview</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Use the question bank during the conversation. Save as a draft any time.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFocusMode((v) => !v)}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {focusMode ? 'Exit focus mode' : 'Focus mode'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!sessionId) {
                      toast.error('Start an interview session first');
                      return;
                    }
                    router.push(`/candidates/${candidateId}/interview/${sessionId}/scorecard`);
                  }}
                  className="cursor-pointer rounded-lg bg-[#0B2E65] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2c5aa0] disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!sessionId}
                >
                  Go to scorecard →
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Role question bank</label>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ROLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setRoleKey(opt.key)}
                        className={`cursor-pointer rounded-lg border px-4 py-3 text-left transition-colors ${
                          roleKey === opt.key ? 'border-[#0B2E65] bg-[#0B2E65]/5' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!sessionId ? (
                    <button
                      type="button"
                      onClick={handleStartSession}
                      className="cursor-pointer rounded-lg bg-[#0B2E65] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2c5aa0] disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={loadingSession}
                    >
                      {loadingSession ? 'Starting…' : 'Start session'}
                    </button>
                  ) : (
                    <div className="text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">Session active</div>
                      <div className="mt-0.5">ID: {sessionId}</div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={!sessionId || saving}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving…' : 'Save draft'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Question bank</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {loadingBank ? 'Loading questions…' : bank ? bank.title : 'No question bank loaded'}
                  </p>
                </div>
                {session?.status ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                    {session.status.toUpperCase()}
                  </span>
                ) : null}
              </div>

              <div className="p-5 space-y-4">
                {loadingBank ? (
                  <div className="text-sm text-slate-600">Loading…</div>
                ) : questions.length === 0 ? (
                  <div className="text-sm text-slate-600">
                    No questions found for this role yet.
                  </div>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Question {q.order}</div>
                          <div className="text-sm font-medium text-slate-900 mt-1">{q.prompt}</div>
                        </div>
                        {q.pillar_hint ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 whitespace-nowrap">
                            {q.pillar_hint.replace('_', ' ')}
                          </span>
                        ) : null}
                      </div>
                      <textarea
                        className="mt-3 w-full min-h-[88px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2E65]/25 focus:border-[#0B2E65]"
                        placeholder="Type notes for this question…"
                        value={notesByQuestion[q.id] ?? ''}
                        onChange={(e) => setNotesByQuestion((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

