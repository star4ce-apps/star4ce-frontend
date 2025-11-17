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

export async function createSurveyAccessCode(
  expiresInHours: number = 24 * 7 // default: 1 week
): Promise<AccessCodeResponse> {
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
    body: JSON.stringify({
      expires_in_hours: expiresInHours,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate access code');
  }

  return data as AccessCodeResponse;
}
