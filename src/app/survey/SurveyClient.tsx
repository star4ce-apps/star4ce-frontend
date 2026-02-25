'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_BASE } from '@/lib/auth';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

export default function SurveyPage() {
  const search = useSearchParams();

  const [currentStep, setCurrentStep] = useState(0); // 0 = intro, then steps
  const [accessCode, setAccessCode] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState<'newly-hired' | 'termination' | 'leave' | 'none' | ''>('');
  const [role, setRole] = useState('');
  // Answers and comments for all questions (indexed by question number)
  const [questionAnswers, setQuestionAnswers] = useState<{ [key: number]: string }>({});
  const [questionComments, setQuestionComments] = useState<{ [key: number]: string }>({});
  // Special open-ended questions
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [retentionInquiry, setRetentionInquiry] = useState('');
  const [futureConsideration, setFutureConsideration] = useState('');
  const [futureConsiderationComment, setFutureConsiderationComment] = useState('');
  const [primaryReasonForLeaving, setPrimaryReasonForLeaving] = useState('');
  const [primaryReasonDetails, setPrimaryReasonDetails] = useState('');

  const [loading, setLoading] = useState(false);          // for final submit
  const [validatingCode, setValidatingCode] = useState(false); // for "Start Survey"
  const [codeError, setCodeError] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  // Calculate progress percentage (5 steps: intro, info, questions, open-ended, review/submit)
  const getProgress = () => {
    if (currentStep === 0) return 0;
    if (currentStep === 1) return 20;
    if (currentStep === 2) return 50;
    if (currentStep === 3) return 75;
    if (currentStep === 4) return 90;
    if (currentStep === 5) return 100;
    return 0;
  };

  // Prevent body scrolling when survey page is mounted
  useEffect(() => {
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup: re-enable scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Prefill access code from URL: /survey?code=XXXXX
  useEffect(() => {
    const fromUrl = search.get('code');
    if (fromUrl) {
      setAccessCode(fromUrl);
    }
    
    // Load saved progress from localStorage
    const saved = localStorage.getItem('survey_progress');
    if (saved && fromUrl) {
      try {
        const progress = JSON.parse(saved);
        if (progress.accessCode === fromUrl) {
          setEmployeeStatus(progress.employeeStatus || '');
          setRole(progress.role || '');
          setQuestionAnswers(progress.questionAnswers || {});
          setQuestionComments(progress.questionComments || {});
          setImprovementSuggestion(progress.improvementSuggestion || '');
          setRetentionInquiry(progress.retentionInquiry || '');
          setFutureConsideration(progress.futureConsideration || '');
          setFutureConsiderationComment(progress.futureConsiderationComment || '');
          setPrimaryReasonForLeaving(progress.primaryReasonForLeaving || '');
          setPrimaryReasonDetails(progress.primaryReasonDetails || '');
          setDisclaimerAccepted(progress.disclaimerAccepted || false);
          if (progress.currentStep) setCurrentStep(progress.currentStep);
          toast.success('Resumed previous survey progress');
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [search]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (accessCode && currentStep > 0) {
      const progress = {
        accessCode,
        employeeStatus,
        role,
        questionAnswers,
        questionComments,
        improvementSuggestion,
        retentionInquiry,
        futureConsideration,
        futureConsiderationComment,
        primaryReasonForLeaving,
        primaryReasonDetails,
        disclaimerAccepted,
        currentStep,
      };
      localStorage.setItem('survey_progress', JSON.stringify(progress));
    }
  }, [accessCode, employeeStatus, role, questionAnswers, questionComments,
      improvementSuggestion, retentionInquiry, futureConsideration,
      futureConsiderationComment, primaryReasonForLeaving, primaryReasonDetails,
      disclaimerAccepted, currentStep]);

  const roles = [
    'Sales Department',
    'Service Department',
    'Parts Department',
    'Administration Department',
    'Office Department',
    'Finance Department',
    'Customer Relations',
    'Inventory Management',
    'Marketing Department',
    'Human Resources',
    'Technical Support',
    'Warranty Services',
    'Training and Development',
    'Others',
  ];

  // Survey 1: Current Employee Engagement Survey (for "none")
  const engagementQuestions = [
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
    { num: 17, text: 'I have confidence in the dealership\'s leadership and its future direction.', category: 'Leadership & Compensation' },
    { num: 18, text: 'My compensation (including commission structure) is fair and motivating.', category: 'Leadership & Compensation' },
    { num: 19, text: 'I am satisfied with the benefits package (health insurance, vacation, retirement).', category: 'Leadership & Compensation' },
  ];

  // Survey 2: 30-Day Onboarding Feedback Survey (for "newly-hired")
  const onboardingQuestions = [
    { num: 1, text: 'I felt welcomed and supported during my first 30 days.' },
    { num: 2, text: 'I feel I am becoming part of the team and building positive colleague relationships.' },
    { num: 3, text: 'My initial onboarding (orientation, paperwork, introductions) was clear and organized.' },
    { num: 4, text: 'The initial training I received adequately covered the key aspects of my specific role.' },
    { num: 5, text: 'I feel confident using the dealership\'s key systems, tools, and processes (CRM, DMS, etc.).' },
    { num: 6, text: 'I have been given the resources needed to perform my job effectively so far.' },
    { num: 7, text: 'My supervisor has provided clear expectations and goals for my role.' },
    { num: 8, text: 'My immediate supervisor has provided adequate guidance and support.' },
    { num: 9, text: 'I have had sufficient opportunities to ask questions and get timely answers.' },
  ];

  // Survey 3: Termination Exit Survey (for "termination")
  const terminationQuestions = [
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

  // Survey 4: Voluntary Resignation Exit Survey (for "leave")
  const resignationQuestions = [
    { num: 1, text: 'I was satisfied with my role and responsibilities.' },
    { num: 2, text: 'I had adequate opportunities for professional growth and advancement here.' },
    { num: 3, text: 'The dealership provided effective training and development throughout my employment.' },
    { num: 4, text: 'I felt recognized and appreciated for my contributions.' },
    { num: 5, text: 'There was a high level of teamwork and collaboration among colleagues and departments.' },
    { num: 6, text: 'My workload and scheduling expectations were reasonable and manageable.' },
    { num: 7, text: 'Management communicated company goals and updates effectively.' },
    { num: 8, text: 'I felt supported by the dealership during challenging situations or customer interactions.' },
    { num: 9, text: 'I had a positive working relationship with my primary supervisor/manager.' },
    { num: 10, text: 'The dealership\'s culture and work environment aligned with my personal values.' },
    { num: 11, text: 'My total compensation (pay, commission, benefits) was competitive for the role and area.' },
    { num: 12, text: 'Factors like commute, schedule, and work-life balance were supportive of my well-being.' },
  ];

  // Question type: category is optional (only engagement survey has categories)
  type SurveyQuestion = { num: number; text: string; category?: string };

  // Get current survey questions based on employee status
  const getCurrentQuestions = (): SurveyQuestion[] => {
    if (employeeStatus === 'none') return engagementQuestions;
    if (employeeStatus === 'newly-hired') return onboardingQuestions;
    if (employeeStatus === 'termination') return terminationQuestions;
    if (employeeStatus === 'leave') return resignationQuestions;
    return [];
  };

  const primaryReasonOptions = [
    'Career Advancement',
    'Compensation/Benefits',
    'Work Environment/Culture',
    'Management Relationship',
    'Work-Life Balance',
    'Commute',
    'Other',
  ];

  // --- Step navigation helpers ---

  function nextStep() {
    if (currentStep === 1 && (!employeeStatus || !role)) {
      toast.error('Please complete all required fields');
      return;
    }
    if (currentStep === 2) {
      const questions = getCurrentQuestions();
      const answeredCount = questions.filter(q => questionAnswers[q.num]).length;
      if (answeredCount < questions.length) {
        toast.error('Please answer all questions (1-10 scale)');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  // --- NEW: validate access code before starting survey ---

  async function handleStartSurvey() {
    if (!accessCode.trim()) {
      setCodeError('Please enter an access code');
      return;
    }

    if (!disclaimerAccepted) {
      toast.error('Please read and accept the survey disclaimer to continue');
      return;
    }

    setCodeError(null);
    setValidatingCode(true);

    try {
      const res = await fetch(`${API_BASE}/survey/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: accessCode.trim() }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data.ok) {
        // If invalid / inactive / expired
        const errorMsg = data.error || 'This access code is invalid or inactive.';
        setCodeError(errorMsg);
        
        // Better error messages
        if (errorMsg.includes('expired')) {
          toast.error('This access code has expired. Please request a new one from your administrator.');
        } else if (errorMsg.includes('inactive')) {
          toast.error('This access code has already been used. Each code can only be used once.');
        } else {
          toast.error('Invalid access code. Please check and try again.');
        }
        return;
      }

      // ✅ Code is valid – move to next step
      setCurrentStep(1);
      toast.success('Access code validated! Starting survey...');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not validate access code.';
      setCodeError(msg);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setValidatingCode(false);
    }
  }

  // --- Final submit ---

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        access_code: accessCode,
        employee_status: employeeStatus,
        role,
        question_answers: questionAnswers,
        question_comments: questionComments,
        improvement_suggestion: improvementSuggestion || null,
        retention_inquiry: retentionInquiry || null,
        future_consideration: futureConsideration || null,
        future_consideration_comment: futureConsiderationComment || null,
        primary_reason_for_leaving: primaryReasonForLeaving || null,
        primary_reason_details: primaryReasonDetails || null,
        disclaimer_accepted: disclaimerAccepted,
      };

      const res = await fetch(`${API_BASE}/survey/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        throw new Error(data.error || 'Error submitting survey');
      }

      // Success – show thank-you screen
      setCurrentStep(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit survey';
        toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed flex items-center justify-center overflow-hidden"
      style={{
        top: '110px',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/images/header.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blurred background overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm z-[1500]"
        style={{
          backgroundColor: 'rgba(9, 21, 39, 0.7)',
        }}
      />

      {/* Survey Modal */}
      <div className="relative z-[2000] w-full max-w-lg mx-2 sm:mx-4 max-h-[85vh]">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Right Section - Form */}
          <div className="bg-[#E6E6E6] flex-1 p-2 sm:p-3 md:p-4 flex flex-col overflow-hidden max-h-[85vh]">
            {/* Logo */}
            <div className="text-center mb-1 sm:mb-2 flex-shrink-0">
              <Link href="/" className="inline-block">
                <Logo size="sm" className="justify-center" />
              </Link>
            </div>

            {/* Step 0: Introduction */}
            {currentStep === 0 && (
              <div className="space-y-4 sm:space-y-6 overflow-y-auto flex-1">
                <div className="text-center space-y-2 sm:space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0B2E65]">Welcome to the Survey</h2>
                  <div className="text-gray-700 space-y-2 text-center text-xs sm:text-sm">
                    <p>
                      This survey helps us understand your experience and improve our workplace.
                      We value your honest feedback and it will be used to make positive changes.
                    </p>
                    <p className="font-semibold text-[#0B2E65]">
                      Your responses are completely anonymous.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Access Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your access code"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value);
                      setCodeError(null);
                    }}
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1.5">
                    This code links your response to your designated dealership.
                  </p>
                  {codeError && (
                    <p className="text-sm text-red-600 mt-2">
                      {codeError}
                    </p>
                  )}
                </div>

                {/* Survey Disclaimer */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-[#0B2E65]">Employee Survey Disclaimer</h3>
                  <p className="text-sm text-gray-700">
                    This survey is conducted by Star4ce LLC on behalf of your company. Your responses are aggregated and used for research and analysis purposes to improve workplace conditions. Participation is voluntary and your feedback is highly valued.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDisclaimerModal(true)}
                    className="text-sm text-[#0B2E65] hover:text-[#2c5aa0] underline font-medium transition-colors text-left"
                  >
                    Read More
                  </button>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#0B2E65] border-gray-300 rounded focus:ring-[#0B2E65] cursor-pointer"
                      required
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#0B2E65] transition-colors">
                      I have read and agree to the survey disclaimer and terms
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleStartSurvey}
                  disabled={!accessCode || !disclaimerAccepted || validatingCode}
                  className="cursor-pointer w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {validatingCode ? 'Checking code...' : 'Start Survey'}
                </button>
              </div>
            )}

            {/* Step 1: Employee Status & Role */}
            {currentStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  nextStep();
                }}
                className="space-y-4 sm:space-y-6 overflow-y-auto flex-1"
              >
                <div>
                  <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                    What is your current status?
                  </label>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { value: 'newly-hired', label: 'Newly Hired' },
                      { value: 'termination', label: 'Termination' },
                      { value: 'leave', label: 'Leave' },
                      { value: 'none', label: 'None of the above' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="employeeStatus"
                          value={option.value}
                          checked={employeeStatus === option.value}
                          onChange={(e) => setEmployeeStatus(e.target.value as any)}
                          className="w-4 h-4 text-[#0B2E65]"
                          required
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-2">
                    What is your role?
                  </label>
                  <select
                    className="cursor-pointer w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm focus:outline-none"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="">Select your role</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 sm:gap-3 flex-shrink-0 pt-1.5 sm:pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-gray-300 active:bg-gray-400 transition-colors text-xs sm:text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer flex-1 bg-[#0B2E65] text-white py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-[#2c5aa0] active:bg-[#1a4a8a] transition-colors text-xs sm:text-sm"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Main Survey Questions */}
            {currentStep === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  nextStep();
                }}
                className="space-y-4 flex flex-col h-full overflow-hidden"
              >
                <div className="mb-1.5 sm:mb-2 flex-shrink-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-white bg-[#0B2E65] px-3 py-2 rounded-lg">
                    {employeeStatus === 'none' && 'Current Employee Engagement Survey'}
                    {employeeStatus === 'newly-hired' && '30-Day Onboarding Feedback Survey'}
                    {employeeStatus === 'termination' && 'Termination Exit Survey'}
                    {employeeStatus === 'leave' && 'Voluntary Resignation Exit Survey'}
                  </h3>
                </div>
                <div className="space-y-2 sm:space-y-3 pr-1 sm:pr-2 flex-1 overflow-y-auto">
                  {(() => {
                    const questions = getCurrentQuestions();
                    let currentCategory = '';
                    return questions.map((q) => {
                      const showCategory = q.category && q.category !== currentCategory;
                      if (showCategory) currentCategory = q.category || '';
                      return (
                        <div key={q.num} className="space-y-3">
                          {showCategory && (
                            <h4 className="text-sm font-semibold text-[#0B2E65] mt-4 mb-2 first:mt-0">
                              {q.category}
                            </h4>
                          )}
                          <div className="pb-2 sm:pb-3 border-b border-gray-200 last:border-0">
                            <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1.5">
                              {q.num}. {q.text}
                            </label>
                            <div className="mb-1.5">
                              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-2">
                                <span className="text-[10px] sm:text-xs text-gray-600 font-medium sm:whitespace-nowrap order-2 sm:order-1">Strongly Disagree</span>
                                <div className="flex-1 flex items-center justify-between gap-1 sm:gap-1.5 relative order-1 sm:order-2 w-full sm:w-auto pb-3 sm:pb-0">
                                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                    <label 
                                      key={num} 
                                      className={`relative flex items-center justify-center cursor-pointer transition-all ${
                                        questionAnswers[q.num] === num.toString() 
                                          ? 'scale-110' 
                                          : 'hover:scale-105 active:scale-110'
                                      }`}
                                    >
                                      <div className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all ${
                                        questionAnswers[q.num] === num.toString()
                                          ? 'border-[#0B2E65] bg-[#0B2E65] shadow-md'
                                          : 'border-gray-300 bg-white hover:border-[#0B2E65] hover:bg-[#0B2E65]/5'
                                      }`}>
                                        <input
                                          type="radio"
                                          name={`question-${q.num}`}
                                          value={num.toString()}
                                          checked={questionAnswers[q.num] === num.toString()}
                                          onChange={(e) =>
                                            setQuestionAnswers({
                                              ...questionAnswers,
                                              [q.num]: e.target.value,
                                            })
                                          }
                                          className="absolute opacity-0 w-full h-full cursor-pointer"
                                          required
                                        />
                                      </div>
                                    </label>
                                  ))}
                                </div>
                                <span className="text-[10px] sm:text-xs text-gray-600 font-medium sm:whitespace-nowrap order-3">Strongly Agree</span>
                              </div>
                            </div>
                            <div>
                              <textarea
                                placeholder="Optional comments..."
                                className="w-full px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E65] focus:border-[#0B2E65] min-h-[40px] sm:min-h-[45px] resize-none transition-all"
                                value={questionComments[q.num] || ''}
                                onChange={(e) =>
                                  setQuestionComments({
                                    ...questionComments,
                                    [q.num]: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer flex-1 bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Open-Ended Questions */}
            {currentStep === 3 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  nextStep();
                }}
                className="space-y-3 sm:space-y-4 flex flex-col h-full overflow-hidden"
              >
                <div className="space-y-3 sm:space-y-5 pr-1 sm:pr-2 flex-1 overflow-y-auto">
                  {/* Improvement Suggestion - All surveys */}
                  <div>
                    <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-2">
                      {employeeStatus === 'none' && '20. Improvement Suggestion: What is the one change that would most improve your day-to-day experience at this dealership?'}
                      {employeeStatus === 'newly-hired' && '10. Improvement Suggestion: What could the dealership improve about the new employee onboarding experience?'}
                      {employeeStatus === 'termination' && '10. Improvement Suggestion: What is one thing the dealership could do to improve how it manages performance or supports employees?'}
                      {employeeStatus === 'leave' && '13. Primary Reason for Leaving: What was the primary reason for your decision to leave?'}
                    </label>
                    {employeeStatus === 'leave' ? (
                      <>
                        <select
                          value={primaryReasonForLeaving}
                          onChange={(e) => setPrimaryReasonForLeaving(e.target.value)}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E65] mb-2"
                          required
                        >
                          <option value="">Select a reason</option>
                          {primaryReasonOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        {primaryReasonForLeaving === 'Other' && (
                          <input
                            type="text"
                            placeholder="Please specify"
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm focus:outline-none mt-2"
                            value={primaryReasonDetails}
                            onChange={(e) => setPrimaryReasonDetails(e.target.value)}
                            required
                          />
                        )}
                        <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-2 mt-3 sm:mt-4">
                          Additional Details:
                        </label>
                        <textarea
                          placeholder="Please provide additional details..."
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E65] min-h-[80px] sm:min-h-[100px] resize-none"
                          value={primaryReasonDetails}
                          onChange={(e) => setPrimaryReasonDetails(e.target.value)}
                        />
                      </>
                    ) : (
                      <textarea
                        placeholder="Your answer..."
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E65] min-h-[100px] sm:min-h-[120px] resize-none"
                        value={improvementSuggestion}
                        onChange={(e) => setImprovementSuggestion(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  {/* Retention Inquiry - Only for "leave" */}
                  {employeeStatus === 'leave' && (
                    <div>
                      <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-2">
                        14. Retention Inquiry: What could the dealership have done differently to encourage you to stay?
                      </label>
                      <textarea
                        placeholder="Your answer..."
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E65] min-h-[100px] sm:min-h-[120px] resize-none"
                        value={retentionInquiry}
                        onChange={(e) => setRetentionInquiry(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Future Consideration - Only for "leave" */}
                  {employeeStatus === 'leave' && (
                    <div>
                      <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-2">
                        15. Future Consideration: Would you consider returning to this dealership in the future?
                      </label>
                      <div className="space-y-2 mb-2 sm:mb-3">
                        {['Yes', 'No', 'Maybe'].map((option) => (
                          <label key={option} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="futureConsideration"
                              value={option}
                              checked={futureConsideration === option}
                              onChange={(e) => setFutureConsideration(e.target.value)}
                              className="w-4 h-4 text-[#0B2E65]"
                              required
                            />
                            <span className="text-gray-700 text-xs sm:text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                      <textarea
                        placeholder="Optional comments..."
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2E65] min-h-[60px] sm:min-h-[80px] resize-none"
                        value={futureConsiderationComment}
                        onChange={(e) => setFutureConsiderationComment(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer flex-1 bg-[#0B2E65] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Review and Submit */}
            {currentStep === 4 && (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 flex flex-col h-full overflow-hidden">
                <div className="text-center space-y-2 mb-3 sm:mb-4 flex-shrink-0">
                  <h3 className="text-sm sm:text-base font-semibold text-[#0B2E65]">Review Your Responses</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Please review your answers before submitting. Once submitted, you cannot make changes.
                  </p>
                </div>

                <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="cursor-pointer flex-1 bg-gray-200 text-gray-700 py-2 sm:py-2.5 rounded-lg font-semibold hover:bg-gray-300 active:bg-gray-400 transition-colors text-xs sm:text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer flex-1 bg-[#0B2E65] text-white py-2 sm:py-2.5 rounded-lg font-semibold hover:bg-[#2c5aa0] active:bg-[#1a4a8a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    {loading ? 'Submitting...' : 'Submit Survey'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 5: Success Page */}
            {currentStep === 5 && (
              <div className="space-y-6 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-[#0B2E65]/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-[#0B2E65]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#0B2E65]">Thank You!</h2>
                  <div className="text-gray-700 space-y-2">
                    <p className="font-semibold">Your survey has been submitted successfully.</p>
                    <p>We appreciate your honest feedback and will use it to make positive changes.</p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="cursor-pointer inline-block w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                >
                  Take me back to home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDisclaimerModal(false)}
          />
          
          {/* Modal - Smaller and contained */}
          <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[70vh] overflow-hidden flex flex-col z-10 m-4">
            {/* Header */}
            <div className="bg-[#0B2E65] text-white px-4 py-2 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-bold">Employee Survey Disclaimer</h2>
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="text-white hover:text-gray-200 transition-colors text-xl leading-none w-6 h-6 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              <div className="text-gray-700 space-y-3 text-xs">
                <div>
                  <p className="text-xs text-gray-500 mb-3">Last Updated: December 21, 2025</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-[#0B2E65] text-sm mb-2">Introduction</h3>
                  <p className="mb-2">
                    This survey is being conducted by Star4ce LLC on behalf of your company. We are a third-party vendor and are in no way associated with any entity within your company's organization. The purpose of this survey is to gather valuable feedback from you to help improve the workplace environment, company policies, and overall employee satisfaction.
                  </p>
                  <p>
                    Your participation is highly valued and will help make your company a better place to work. Your personal feedback, including thoughts on how to make it a better place to work, is highly recommended.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#0B2E65] text-sm mb-2">Confidentiality and Anonymity</h3>
                  <p className="mb-2">We are committed to protecting the confidentiality of your responses. Here's how we handle your data:</p>
                  <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>
                      <strong>Aggregated Data:</strong> All survey responses are combined and reported in a summary format. This means your individual answers are grouped with others to identify trends.
                    </li>
                    <li>
                      <strong>Individual Comments:</strong> Your personal written feedback on how to improve the workplace will be shared with your company's management.
                    </li>
                    <li>
                      <strong>Anonymity:</strong> We take your anonymity seriously. While we require an email address to send you a unique survey access code, we do not store your email or any other personally identifiable information with your survey responses. Although we take every precaution to ensure your anonymity, we cannot offer an absolute guarantee.
                    </li>
                    <li>
                      <strong>Security:</strong> We have implemented robust security measures to protect all the data we collect.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#0B2E65] text-sm mb-2">Data Usage</h3>
                  <p>
                    The information you provide will be used for research and analysis purposes only. The aggregated results of the survey will be used by your company to identify areas of strength and opportunities for improvement. The data will not be used for any disciplinary action or to evaluate individual employee performance.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#0B2E65] text-sm mb-2">Voluntary Participation</h3>
                  <p>
                    Your participation in this survey is completely voluntary. You may choose not to participate, or you may stop at any time. Refusal to participate will not have any negative impact on your employment status, and there will be no penalty for not completing the survey.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#0B2E65] text-sm mb-2">No Guarantee of Action</h3>
                  <p>
                    While the feedback you provide is important, your company is not obligated to act on any of the suggestions or feedback provided in this survey. The results of the survey will be considered as part of a broader strategy for continuous improvement, but they do not constitute a promise of any specific changes or actions.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#0B2E65] text-sm mb-2">Limitation of Liability</h3>
                  <p>
                    By participating in this survey, you agree that Star4ce LLC will not be held liable for any claims, damages, or losses arising from your participation in the survey or from the use of the survey results. Star4ce LLC assumes no responsibility for the use or misuse of the information provided. You participate at your own risk, and you agree to waive any and all claims against Star4ce LLC and any employee contracted or employed by Star4ce LLC related to this survey.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#0B2E65] text-sm mb-2">Governing Law</h3>
                  <p>
                    This disclaimer and any dispute arising out of your participation in the survey shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 flex justify-end border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="cursor-pointer bg-[#0B2E65] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#2c5aa0] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
