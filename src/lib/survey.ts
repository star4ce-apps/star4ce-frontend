// src/lib/survey.ts
import { API_BASE, getToken } from './auth';

export type AccessCodeResponse = {
  ok: boolean;
  id: number;
  code: string;
  dealership_id: number;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
};

export async function createSurveyAccessCode(): Promise<AccessCodeResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('Not signed in');
  }

  const res = await fetch(`${API_BASE}/survey/access-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: '{}',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate access code');
  }

  return data as AccessCodeResponse;
}
