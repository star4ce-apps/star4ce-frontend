 'use client';

import { INTERVIEW_QUESTION_BANKS, type InterviewCandidateRoleKey } from '@/lib/interviewCandidateQuestionBank';

export const dynamic = 'force-dynamic';

function isRoleKey(x: unknown): x is InterviewCandidateRoleKey {
  return x === 'c-level-executives' || x === 'general-manager' || x === 'sales-manager';
}

export default function InterviewPrintPage({
  searchParams,
}: {
  searchParams?: { role?: string };
}) {
  const roleParam = searchParams?.role;
  const roleKey: InterviewCandidateRoleKey = isRoleKey(roleParam) ? roleParam : 'c-level-executives';
  const bank = INTERVIEW_QUESTION_BANKS[roleKey];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  @page { margin: 14mm; }
  .no-print { display: none !important; }
  .print-break { break-before: page; page-break-before: always; }
}
          `,
        }}
      />

      <div className="no-print border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">{bank.roleLabel} — Interview Questions</div>
            <div className="text-xs text-slate-500">Printable question set</div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="cursor-pointer rounded-lg bg-[#0B2E65] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2c5aa0]"
          >
            Print
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interview Questions</div>
          <h1 className="text-2xl font-bold mt-2">{bank.roleLabel}</h1>
        </div>

        {bank.sections.map((section, sectionIdx) => (
          <div key={section.title} className={sectionIdx === 0 ? '' : 'print-break'}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-t border-b border-slate-200 py-3">
              {section.title}
            </h2>
            <ol className="mt-4 space-y-3 list-decimal pl-6">
              {section.questions.map((q) => (
                <li key={q} className="text-sm leading-relaxed">
                  {q}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

