export type InterviewRoleKey = 'sales' | 'service' | 'office';

export type InterviewQuestionBank = {
  id: string;
  role_key: InterviewRoleKey;
  title: string;
  version?: number;
  is_active?: boolean;
  updated_at?: string;
  questions: InterviewQuestion[];
};

export type InterviewQuestion = {
  id: string;
  bank_id: string;
  order: number;
  prompt: string;
  pillar_hint?: InterviewPillarKey | null;
};

export type InterviewSessionStatus = 'draft' | 'completed';

export type InterviewSession = {
  id: string;
  candidate_id: number;
  role_key: InterviewRoleKey;
  interviewer_user_id?: number | null;
  status: InterviewSessionStatus;
  created_at?: string;
  updated_at?: string;
};

export type InterviewResponse = {
  id: string;
  session_id: string;
  question_id: string;
  note_text: string;
};

export type InterviewSessionWithResponses = InterviewSession & {
  responses: InterviewResponse[];
  question_bank?: InterviewQuestionBank | null;
};

export type InterviewPillarKey = 'aptitude' | 'cultural_fit' | 'reliability' | 'coachability';

export type InterviewEvaluationPillar = {
  pillar_key: InterviewPillarKey;
  score_1_to_10: number;
  comment?: string | null;
};

export type InterviewEvaluation = {
  id: string;
  session_id: string;
  overall_score_0_to_100?: number | null;
  pillars: InterviewEvaluationPillar[];
  created_at?: string;
  updated_at?: string;
};

