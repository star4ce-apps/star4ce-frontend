/**
 * Shared survey display data: scale labels, survey type labels, and question text
 * for showing written feedback with questions and scale responses.
 */

// 7-point scale: 1 = Strongly disagree → 7 = Strongly agree
export const SCALE_LABELS: Record<number, string> = {
  1: 'Strongly disagree',
  2: 'Semi disagree',
  3: 'Disagree',
  4: 'Neutral',
  5: 'Agree',
  6: 'Semi agree',
  7: 'Strongly agree',
};

export type SurveyTypeKey = 'newly-hired' | 'termination' | 'leave' | 'none';

export const SURVEY_TYPE_LABELS: Record<SurveyTypeKey, string> = {
  'newly-hired': 'Newly hired',
  'termination': 'Terminated',
  'leave': 'On leave',
  'none': 'Employee',
};

export type DisplayQuestion = { num: number; text: string; category?: string };

const engagementQuestions: DisplayQuestion[] = [
  { num: 1, text: 'I am satisfied with my overall job at this dealership.', category: 'Culture & Work Environment' },
  { num: 2, text: 'There is effective teamwork and collaboration between departments (Sales, Service, Parts, Admin).', category: 'Culture & Work Environment' },
  { num: 3, text: 'The dealership promotes a positive and inclusive culture for all employees.', category: 'Culture & Work Environment' },
  { num: 4, text: 'I am proud to work here and would recommend this dealership as a great place to work.', category: 'Culture & Work Environment' },
  { num: 5, text: 'I feel safe in my workplace, and proper safety protocols are followed (especially in Service).', category: 'Culture & Work Environment' },
  { num: 6, text: 'My role and responsibilities are clearly defined and understood.', category: 'Role, Support & Development' },
  { num: 7, text: 'I feel supported by my immediate supervisor or manager.', category: 'Role, Support & Development' },
  { num: 8, text: 'I receive regular, constructive feedback on my performance.', category: 'Role, Support & Development' },
  { num: 9, text: 'I have access to adequate training and development opportunities.', category: 'Role, Support & Development' },
  { num: 10, text: 'I feel recognized and appreciated for my contributions and achievements.', category: 'Role, Support & Development' },
  { num: 11, text: 'I have the tools, resources, and technology needed to perform my job effectively.', category: 'Resources & Processes' },
  { num: 12, text: 'My performance expectations or sales targets are reasonable and achievable.', category: 'Resources & Processes' },
  { num: 13, text: 'Dealership inventory and vehicle availability effectively support my work (sales/service).', category: 'Resources & Processes' },
  { num: 14, text: 'The dealership supports employees well during difficult customer interactions or complaints.', category: 'Resources & Processes' },
  { num: 15, text: 'The physical work environment (cleanliness, break areas, facilities) is satisfactory.', category: 'Resources & Processes' },
  { num: 16, text: 'Management effectively communicates company goals, changes, and updates.', category: 'Leadership & Compensation' },
  { num: 17, text: "I have confidence in the dealership's leadership and its future direction.", category: 'Leadership & Compensation' },
  { num: 18, text: 'My compensation (including commission structure) is fair and motivating.', category: 'Leadership & Compensation' },
  { num: 19, text: 'I am satisfied with the benefits package (health insurance, vacation, retirement).', category: 'Leadership & Compensation' },
];

const onboardingQuestions: DisplayQuestion[] = [
  { num: 1, text: 'I felt welcomed and supported during my first 30 days.' },
  { num: 2, text: 'I feel I am becoming part of the team and building positive colleague relationships.' },
  { num: 3, text: 'My initial onboarding (orientation, paperwork, introductions) was clear and organized.' },
  { num: 4, text: 'The initial training I received adequately covered the key aspects of my specific role.' },
  { num: 5, text: "I feel confident using the dealership's key systems, tools, and processes (CRM, DMS, etc.)." },
  { num: 6, text: 'I have been given the resources needed to perform my job effectively so far.' },
  { num: 7, text: 'My supervisor has provided clear expectations and goals for my role.' },
  { num: 8, text: 'My immediate supervisor has provided adequate guidance and support.' },
  { num: 9, text: 'I have had sufficient opportunities to ask questions and get timely answers.' },
];

const terminationQuestions: DisplayQuestion[] = [
  { num: 1, text: 'The termination meeting was conducted professionally.' },
  { num: 2, text: 'The reasons for my termination were communicated clearly and specifically.' },
  { num: 3, text: 'I was given an opportunity to ask questions or discuss the decision during the termination process.' },
  { num: 4, text: 'The termination process felt fair and in line with stated policies.' },
  { num: 5, text: 'In the time leading up to termination, I received adequate feedback or warnings regarding performance/conduct (if applicable).' },
  { num: 6, text: 'I was provided with clear information and resources following termination (final pay, benefits, etc.).' },
  { num: 7, text: 'My overall employment experience at the dealership was positive.' },
  { num: 8, text: 'The dealership provided sufficient support and opportunity for me to succeed in my role.' },
  { num: 9, text: 'I would recommend this dealership as a place of employment to others.' },
];

const resignationQuestions: DisplayQuestion[] = [
  { num: 1, text: 'I was satisfied with my role and responsibilities.' },
  { num: 2, text: 'I had adequate opportunities for professional growth and advancement here.' },
  { num: 3, text: 'The dealership provided effective training and development throughout my employment.' },
  { num: 4, text: 'I felt recognized and appreciated for my contributions.' },
  { num: 5, text: 'There was a high level of teamwork and collaboration among colleagues and departments.' },
  { num: 6, text: 'My workload and scheduling expectations were reasonable and manageable.' },
  { num: 7, text: 'Management communicated company goals and updates effectively.' },
  { num: 8, text: 'I felt supported by the dealership during challenging situations or customer interactions.' },
  { num: 9, text: 'I had a positive working relationship with my primary supervisor/manager.' },
  { num: 10, text: "The dealership's culture and work environment aligned with my personal values." },
  { num: 11, text: 'My total compensation (pay, commission, benefits) was competitive for the role and area.' },
  { num: 12, text: 'Factors like commute, schedule, and work-life balance were supportive of my well-being.' },
];

export function getQuestionsForSurveyType(surveyType: SurveyTypeKey | string): DisplayQuestion[] {
  if (surveyType === 'none') return engagementQuestions;
  if (surveyType === 'newly-hired') return onboardingQuestions;
  if (surveyType === 'termination') return terminationQuestions;
  if (surveyType === 'leave') return resignationQuestions;
  return [];
}

export function getScaleLabel(value: number | string): string {
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  if (Number.isNaN(n) || n < 1 || n > 7) return '—';
  return SCALE_LABELS[n] ?? '—';
}
