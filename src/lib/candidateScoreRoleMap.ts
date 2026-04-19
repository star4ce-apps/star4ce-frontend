/**
 * Maps candidate job position (as stored on the candidate / profile) to the scorecard `roles[].id` used on /candidates/score.
 * Keep in sync with role options in `src/app/candidates/score/page.tsx`.
 */
export const JOB_POSITION_TO_SCORE_ROLE_ID: Record<string, string> = {
  'Body Shop Manager': 'body-shop-manager',
  'Body Shop Technician': 'support-staff',
  'Business Manager': 'c-level-manager',
  'Business Office Support': 'office-clerk',
  'C-Level Executives': 'c-level-manager',
  'Platform Manager': 'c-level-manager',
  Controller: 'finance-manager',
  'Finance Manager': 'finance-manager',
  'Finance Director': 'finance-manager',
  'General Manager': 'gm',
  'Human Resources Manager': 'hr-manager',
  'IT Manager': 'c-level-manager',
  'Loaner Agent': 'support-staff',
  'Mobility Manager': 'c-level-manager',
  'Parts Counter Employee': 'support-staff',
  'Parts Manager': 'parts-manager',
  'Parts Support': 'support-staff',
  Drivers: 'support-staff',
  'Sales Manager': 'sales-manager',
  GSM: 'sales-manager',
  'Sales People': 'salesperson',
  'Sales Support': 'support-staff',
  Receptionist: 'office-clerk',
  'Service Advisor': 'service-advisor',
  'Service Director': 'service-manager',
  'Service Drive Manager': 'service-manager',
  'Service Manager': 'service-manager',
  'Parts and Service Director': 'service-manager',
  'Service Support': 'support-staff',
  Porters: 'support-staff',
  Technician: 'support-staff',
  'Used Car Director': 'sales-manager',
  'Used Car Manager': 'sales-manager',
};

const DEFAULT_SCORE_ROLE_ID = 'c-level-manager';

export function jobPositionToScoreRoleId(
  jobPosition: string | null | undefined,
  fallback: string = DEFAULT_SCORE_ROLE_ID,
): string {
  const key = (jobPosition || '').trim();
  if (!key) return fallback;
  return JOB_POSITION_TO_SCORE_ROLE_ID[key] ?? fallback;
}
