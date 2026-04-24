'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { getJsonAuth, postJsonAuth } from '@/lib/http';
import { getToken } from '@/lib/auth';

import { INTERVIEW_QUESTION_BANKS, type InterviewCandidateRoleKey } from '@/lib/interviewCandidateQuestionBank';

const SCORE_PAGE_COLORS = {
  primary: '#3B5998',
  primaryLight: '#4D6DBE',
};

const ICEBREAKER_QUESTIONS: Record<InterviewCandidateRoleKey, string[]> = {
  'c-level-executives': [
    "I always like to start beyond the resume. In your own words, what's the one-minute story of you and how you got to this interview chair today?",
    'If you were the CEO of our company for a day, what is the first thing you would change?',
    'What is a professional failure you have experienced, and what did you learn from it?',
    'How do you stay current with industry trends and developments?',
    'In your opinion, what are the most important qualities of a successful leader?',
  ],
  'general-manager': [
    "I always like to start beyond the resume. In your own words, what's the one-minute story of you and how you got to this interview chair today?",
    'Tell me about your management style.',
    'If you were the CEO of our company for a day, what is the first thing you would change?',
    'What is a professional failure you have experienced, and what did you learn from it?',
    'In your opinion, what are the most important qualities of a successful leader?',
  ],
  'sales-manager': [
    "I always like to start beyond the resume. In your own words, what's the one-minute story of you and how you got to this interview chair today?",
    'Tell me about your management style.',
    'How would the people you manage describe you?',
    'What is a professional failure you have experienced, and what did you learn from it?',
    'How do you prepare for your workday?',
  ],
};

type Candidate = {
  id: number;
  name: string;
  position?: string;
  notes?: string;
};

type InterviewerApiUser = {
  id: number;
  email?: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string;
};

type Manager = {
  id: number;
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
};

function managerDisplayName(m: Manager): string {
  if (m.first_name && m.last_name) return `${m.first_name} ${m.last_name}`.trim();
  if (m.first_name) return m.first_name;
  if (m.last_name) return m.last_name;
  if (m.full_name && m.full_name.trim()) return m.full_name.trim();
  if (m.email && m.email.includes('@')) return m.email.split('@')[0].replace(/[._]/g, ' ');
  return 'Unknown';
}

function toManager(x: InterviewerApiUser): Manager {
  const email = x.email || '';
  return {
    id: x.id,
    email,
    full_name: x.full_name ?? null,
    first_name: x.first_name ?? null,
    last_name: x.last_name ?? null,
    role: x.role || 'interviewer',
  };
}

function formatLiveInterviewBlock(args: {
  stage: string;
  roleLabel: string;
  interviewerName: string;
  answers: Array<{ q: string; a: string }>;
}): string {
  const { stage, roleLabel, interviewerName, answers } = args;
  const lines: string[] = [];
  lines.push('--- LIVE INTERVIEW ---');
  lines.push(`Stage: ${stage}`);
  lines.push(`Role: ${roleLabel}`);
  lines.push(`Interviewer: ${interviewerName}`);
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push('');
  answers.forEach((x, idx) => {
    lines.push(`${idx + 1}. ${x.q}`);
    lines.push(`Answer: ${x.a || '—'}`);
    lines.push('');
  });
  return lines.join('\n').trim();
}

export default function InterviewACandidatePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('1');
  const [roleKey, setRoleKey] = useState<InterviewCandidateRoleKey>('c-level-executives');

  const bank = INTERVIEW_QUESTION_BANKS[roleKey];

  // questionIndex (global) -> answer
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // questionIndex (global) -> asked?
  const [asked, setAsked] = useState<Record<string, boolean>>({});

  const flatQuestions = useMemo(() => {
    const out: string[] = [];
    bank.sections.forEach((s) => s.questions.forEach((q) => out.push(q)));
    return out;
  }, [bank]);

  const askedCount = useMemo(() => Object.values(asked).filter(Boolean).length, [asked]);

  const questionIndexByText = useMemo(() => {
    const map = new Map<string, number>();
    flatQuestions.forEach((q, i) => map.set(q, i));
    return map;
  }, [flatQuestions]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getJsonAuth<{ ok: boolean; items: any[] }>('/candidates')
        .then((d) => setCandidates(d.items || []))
        .catch(() => setCandidates([])),
      getJsonAuth<{ ok?: boolean; interviewers?: InterviewerApiUser[] }>('/interviewers')
        .then((d) => setManagers((d.interviewers || []).map(toManager)))
        .catch(() => setManagers([])),
    ])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Reset answers when switching role
    setAnswers({});
    setAsked({});
  }, [roleKey]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleSave() {
    const token = getToken();
    if (!token) {
      toast.error('Not logged in');
      return;
    }
    if (!selectedCandidateId) {
      toast.error('Please select a candidate');
      return;
    }
    if (!selectedManagerId) {
      toast.error('Please select an interviewer');
      return;
    }

    const mgr = managers.find((m) => String(m.id) === selectedManagerId);
    const interviewerName = mgr ? managerDisplayName(mgr) : 'Unknown';

    setSaving(true);
    try {
      const candidateData = await getJsonAuth<{ ok?: boolean; candidate?: { notes?: string } }>(`/candidates/${selectedCandidateId}`);
      const existingNotes = candidateData?.candidate?.notes ?? '';

      const answersList = flatQuestions
        .map((q, idx) => ({ q, a: answers[String(idx)] || '', asked: asked[String(idx)] === true }))
        .filter((x) => x.asked)
        .map((x) => ({ q: x.q, a: x.a }));

      if (answersList.length === 0) {
        toast.error('Check at least one question before saving.');
        return;
      }
      const block = formatLiveInterviewBlock({
        stage: selectedStage,
        roleLabel: bank.roleLabel,
        interviewerName,
        answers: answersList,
      });

      const updatedNotes = existingNotes && existingNotes.trim()
        ? `${existingNotes.trim()}\n\n${block}`
        : block;

      await postJsonAuth(
        `/candidates/${selectedCandidateId}`,
        { notes: updatedNotes },
        { method: 'PUT' }
      );

      toast.success('Interview saved to candidate notes');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save interview');
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <HubSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Interview a Candidate</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Check each question as you ask it to reveal the notes box.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-700">
                  {askedCount} / {flatQuestions.length} asked
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowClearConfirm(true);
                  }}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Candidate</label>
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="mt-2 w-full cursor-pointer rounded-lg bg-white px-3 py-2 text-sm text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #D1D5DB' }}
                    disabled={loading}
                  >
                    <option value="">Select candidate</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}{c.position ? ` — ${c.position}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Interviewer</label>
                  <select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="mt-2 w-full cursor-pointer rounded-lg bg-white px-3 py-2 text-sm text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #D1D5DB' }}
                    disabled={loading}
                  >
                    <option value="">Select interviewer</option>
                    {managers.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {managerDisplayName(m)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Stage</label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="mt-2 w-full cursor-pointer rounded-lg bg-white px-3 py-2 text-sm text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #D1D5DB' }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={String(n)}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Role question set</label>
                  <select
                    value={roleKey}
                    onChange={(e) => setRoleKey(e.target.value as InterviewCandidateRoleKey)}
                    className="mt-2 w-full cursor-pointer rounded-lg bg-white px-3 py-2 text-sm text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #D1D5DB' }}
                  >
                    <option value="c-level-executives">C-Level Executives</option>
                    <option value="general-manager">General Manager</option>
                    <option value="sales-manager">Sales Manager</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Tip: Start with an icebreaker, then Red Flag Questions, then Role-Specific, then STAR Behavioral.
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || askedCount === 0 || !selectedCandidateId || !selectedManagerId}
                  className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: SCORE_PAGE_COLORS.primaryLight }}
                >
                  {saving ? 'Saving…' : 'Save interview'}
                </button>
              </div>
            </div>

            {/* Print banner (single print CTA) */}
            <div
              className="mb-6 p-4 rounded-xl flex items-center justify-between gap-4"
              style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: SCORE_PAGE_COLORS.primaryLight }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4h10z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#232E40' }}>
                    Need a printable question set?
                  </p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    Print the standardized questions to use during in-person interviews
                  </p>
                </div>
              </div>
              <a
                href={`/candidates/interview/print?role=${encodeURIComponent(roleKey)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: SCORE_PAGE_COLORS.primaryLight, color: '#FFFFFF' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4h10z"
                  />
                </svg>
                Print Questions
              </a>
            </div>

            {/* Role header bar (matches Score a Candidate) */}
            <div
              className="mb-6 p-4 rounded-lg"
              style={{ backgroundColor: SCORE_PAGE_COLORS.primaryLight, border: `1px solid ${SCORE_PAGE_COLORS.primary}` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{bank.roleLabel}</h2>
                  <p className="text-sm text-blue-100">
                    {flatQuestions.length} questions • only checked questions are saved
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100 mb-1">Stage</p>
                  <p className="text-2xl font-bold text-white">{selectedStage}</p>
                </div>
              </div>
            </div>

            {/* Ice Breaker Questions (5) — shown right before Red Flag Questions */}
            <div className="mb-6 p-5 rounded-lg" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
              <h3 className="text-base font-bold mb-3" style={{ color: '#1E40AF' }}>
                Ice Breaker Questions
              </h3>
              <ol className="space-y-2 list-decimal list-inside">
                {(ICEBREAKER_QUESTIONS[roleKey] || []).slice(0, 5).map((question, idx) => (
                  <li key={idx} className="text-sm leading-relaxed" style={{ color: '#1E3A8A' }}>
                    {question}
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-4">
              {bank.sections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: SCORE_PAGE_COLORS.primaryLight }}>
                    <span className="text-base font-semibold text-white">{section.title}</span>
                    <span className="text-sm font-bold text-white">
                      {section.questions.filter((q) => asked[String(questionIndexByText.get(q) ?? -1)]).length} checked
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="space-y-3">
                      {section.questions.map((q) => {
                        const idx = questionIndexByText.get(q) ?? -1;
                        const key = String(idx);
                        const isAsked = asked[key] === true;
                        return (
                          <div
                            key={q}
                            className="rounded-lg"
                            style={{
                              backgroundColor: isAsked ? '#EEF2FF' : '#FFFFFF',
                              border: isAsked ? '1px solid #C7D2FE' : '1px solid #E5E7EB',
                            }}
                          >
                            <label className="flex items-start gap-3 cursor-pointer select-none px-4 py-3">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 cursor-pointer"
                                style={{ accentColor: SCORE_PAGE_COLORS.primaryLight }}
                                checked={isAsked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setAsked((prev) => ({ ...prev, [key]: checked }));
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-relaxed break-words" style={{ color: '#374151' }}>
                                  {q}
                                </p>
                                {isAsked ? (
                                  <textarea
                                    className="mt-3 w-full min-h-[84px] rounded-lg bg-white px-3 py-2 text-sm text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{ border: '1px solid #D1D5DB' }}
                                    placeholder="Type notes/answer…"
                                    value={answers[key] ?? ''}
                                    onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                                  />
                                ) : null}
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Back to top */}
      {showBackToTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 cursor-pointer rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90"
          style={{ backgroundColor: SCORE_PAGE_COLORS.primaryLight }}
          aria-label="Back to top"
        >
          ↑ Top
        </button>
      ) : null}

      {/* Clear confirmation */}
      {showClearConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 cursor-pointer"
            onClick={() => setShowClearConfirm(false)}
            aria-label="Close clear confirmation"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div className="text-lg font-bold" style={{ color: '#232E40' }}>
                Clear interview notes?
              </div>
              <div className="text-sm mt-1" style={{ color: '#6B7280' }}>
                This will clear all checked questions and notes on this page. This cannot be undone.
              </div>
            </div>
            <div className="p-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: '#E5E7EB', color: '#374151' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setAsked({});
                  setAnswers({});
                  setShowClearConfirm(false);
                  toast.success('Cleared selections');
                }}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#EF4444' }}
              >
                Yes, clear
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </RequireAuth>
  );
}

