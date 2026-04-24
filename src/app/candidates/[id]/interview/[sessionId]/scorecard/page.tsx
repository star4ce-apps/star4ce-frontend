'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import RequireAuth from '@/components/layout/RequireAuth';
import HubSidebar from '@/components/sidebar/HubSidebar';
import { getInterviewEvaluation, getInterviewSession, upsertInterviewEvaluation } from '@/lib/interviewApi';
import type { InterviewEvaluationPillar, InterviewPillarKey } from '@/lib/interviewTypes';

const PILLARS: Array<{ key: InterviewPillarKey; title: string; description: string }> = [
  { key: 'aptitude', title: 'Aptitude', description: 'Technical skill and ability to learn systems/software.' },
  { key: 'cultural_fit', title: 'Cultural Fit', description: 'Alignment with values and team dynamic.' },
  { key: 'reliability', title: 'Reliability', description: 'Tenure patterns and flight-risk indicators.' },
  { key: 'coachability', title: 'Coachability', description: 'Openness to feedback and growth.' },
];

function clampScore(n: number) {
  if (Number.isNaN(n)) return 1;
  return Math.min(10, Math.max(1, n));
}

export default function InterviewScorecardPage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id ? parseInt(params.id as string, 10) : NaN;
  const sessionId = (params.sessionId as string) || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [scores, setScores] = useState<Record<InterviewPillarKey, number>>({
    aptitude: 5,
    cultural_fit: 5,
    reliability: 5,
    coachability: 5,
  });
  const [comments, setComments] = useState<Record<InterviewPillarKey, string>>({
    aptitude: '',
    cultural_fit: '',
    reliability: '',
    coachability: '',
  });

  const overall0to100 = useMemo(() => {
    const vals = PILLARS.map((p) => clampScore(scores[p.key] ?? 5));
    const avg1to10 = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round((avg1to10 / 10) * 100);
  }, [scores]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        // Ensure session exists (for nicer errors)
        await getInterviewSession(sessionId);
        const evaluation = await getInterviewEvaluation(sessionId);
        if (cancelled) return;
        if (evaluation?.pillars?.length) {
          const nextScores = { ...scores };
          const nextComments = { ...comments };
          evaluation.pillars.forEach((p) => {
            nextScores[p.pillar_key] = clampScore(p.score_1_to_10);
            nextComments[p.pillar_key] = p.comment ?? '';
          });
          setScores(nextScores);
          setComments(nextComments);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'Failed to load scorecard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handleSave() {
    if (!sessionId) return;
    setSaving(true);
    try {
      const pillars: InterviewEvaluationPillar[] = PILLARS.map((p) => ({
        pillar_key: p.key,
        score_1_to_10: clampScore(scores[p.key] ?? 5),
        comment: (comments[p.key] || '').trim() || null,
      }));
      await upsertInterviewEvaluation(sessionId, { overall_score_0_to_100: overall0to100, pillars });
      toast.success('Scorecard saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save scorecard');
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <HubSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <button
                  type="button"
                  onClick={() => router.push(`/candidates/${candidateId}/interview`)}
                  className="cursor-pointer text-sm text-[#0B2E65] hover:underline mb-2"
                >
                  ← Back to interview
                </button>
                <h1 className="text-2xl font-semibold text-slate-900">Post-Interview Scorecard</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Rate the candidate across the four pillars (1–10). This is separate from interview notes.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overall</div>
                <div className="text-3xl font-bold text-slate-900">{overall0to100}</div>
                <div className="text-xs text-slate-500">/ 100</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Matt rubric</h2>
                  <p className="text-xs text-slate-600 mt-0.5">1 = low, 10 = exceptional</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="cursor-pointer rounded-lg bg-[#0B2E65] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2c5aa0] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : 'Save scorecard'}
                </button>
              </div>

              <div className="p-5 space-y-4">
                {loading ? (
                  <div className="text-sm text-slate-600">Loading…</div>
                ) : (
                  PILLARS.map((p) => (
                    <div key={p.key} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                          <div className="text-xs text-slate-600 mt-1">{p.description}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                            const active = clampScore(scores[p.key] ?? 5) === n;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setScores((prev) => ({ ...prev, [p.key]: n }))}
                                className={`cursor-pointer w-8 h-8 rounded-md text-xs font-semibold transition-colors ${
                                  active
                                    ? 'bg-[#0B2E65] text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                                aria-label={`${p.title} score ${n}`}
                              >
                                {n}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <textarea
                        className="mt-3 w-full min-h-[70px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2E65]/25 focus:border-[#0B2E65]"
                        placeholder="Optional comment…"
                        value={comments[p.key] ?? ''}
                        onChange={(e) => setComments((prev) => ({ ...prev, [p.key]: e.target.value }))}
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

