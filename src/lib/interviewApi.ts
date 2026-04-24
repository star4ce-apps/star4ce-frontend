import { getJsonAuth, postJsonAuth, putJsonAuth } from '@/lib/http';
import type {
  InterviewEvaluation,
  InterviewQuestionBank,
  InterviewResponse,
  InterviewRoleKey,
  InterviewSession,
  InterviewSessionWithResponses,
} from '@/lib/interviewTypes';

export async function getQuestionBank(roleKey: InterviewRoleKey): Promise<InterviewQuestionBank> {
  const data = await getJsonAuth<{ ok: boolean; bank: InterviewQuestionBank }>(
    `/interview/question-banks?role_key=${encodeURIComponent(roleKey)}`
  );
  if (!data.ok) throw new Error('Failed to load question bank');
  return data.bank;
}

export async function createInterviewSession(candidateId: number, roleKey: InterviewRoleKey): Promise<InterviewSession> {
  const data = await postJsonAuth<{ ok: boolean; session: InterviewSession }>(
    `/interview/sessions`,
    { candidate_id: candidateId, role_key: roleKey }
  );
  if (!data.ok) throw new Error('Failed to create interview session');
  return data.session;
}

export async function listInterviewSessions(candidateId: number): Promise<InterviewSession[]> {
  const data = await getJsonAuth<{ ok: boolean; sessions: InterviewSession[] }>(
    `/interview/sessions?candidate_id=${encodeURIComponent(String(candidateId))}`
  );
  if (!data.ok) throw new Error('Failed to load interview sessions');
  return data.sessions || [];
}

export async function getInterviewSession(sessionId: string): Promise<InterviewSessionWithResponses> {
  const data = await getJsonAuth<{ ok: boolean; session: InterviewSessionWithResponses }>(`/interview/sessions/${sessionId}`);
  if (!data.ok) throw new Error('Failed to load interview session');
  return data.session;
}

export async function upsertInterviewResponses(
  sessionId: string,
  responses: Array<Pick<InterviewResponse, 'question_id' | 'note_text'>>
): Promise<void> {
  const data = await putJsonAuth<{ ok: boolean }>(`/interview/sessions/${sessionId}/responses`, { responses });
  if (!data.ok) throw new Error('Failed to save responses');
}

export async function upsertInterviewEvaluation(
  sessionId: string,
  evaluation: Omit<InterviewEvaluation, 'id' | 'session_id' | 'created_at' | 'updated_at'> & {
    overall_score_0_to_100?: number | null;
  }
): Promise<InterviewEvaluation> {
  const data = await putJsonAuth<{ ok: boolean; evaluation: InterviewEvaluation }>(
    `/interview/sessions/${sessionId}/evaluation`,
    evaluation
  );
  if (!data.ok) throw new Error('Failed to save evaluation');
  return data.evaluation;
}

export async function getInterviewEvaluation(sessionId: string): Promise<InterviewEvaluation | null> {
  const data = await getJsonAuth<{ ok: boolean; evaluation?: InterviewEvaluation | null }>(
    `/interview/sessions/${sessionId}/evaluation`
  );
  if (!data.ok) return null;
  return data.evaluation ?? null;
}

