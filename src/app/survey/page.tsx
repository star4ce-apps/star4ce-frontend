'use client';
import { useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/auth';

export default function SurveyPage() {
  const [currentStep, setCurrentStep] = useState(0); // 0 = intro, then steps
  const [accessCode, setAccessCode] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState<'newly-hired' | 'termination' | 'leave' | 'none' | ''>('');
  const [role, setRole] = useState('');
  const [satisfactionAnswers, setSatisfactionAnswers] = useState<{ [key: number]: string }>({});
  const [trainingAnswers, setTrainingAnswers] = useState<{ [key: number]: string }>({});
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationOther, setTerminationOther] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveOther, setLeaveOther] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    'Sales Department',
    'Service Department',
    'Parts Department',
    'Administration Department',
    'Office Department',
  ];

  const satisfactionQuestions = [
    'How satisfied are you with your work?',
    'How satisfied are you with your pay?',
    'How satisfied are you with your coworkers?',
    'How satisfied are you with higher management?',
    'How satisfied are you with the workplace culture?',
    'How satisfied are you with work-life balance?',
    'How satisfied are you with opportunities for growth?',
    'How satisfied are you with communication within the company?',
    'How satisfied are you with the work environment?',
    'How satisfied are you with your overall experience?',
  ];

  const trainingQuestions = [
    'How effective was your training program?',
    'How satisfied are you with the onboarding process?',
    'Did you receive adequate support during your first weeks?',
    'How clear were your job expectations?',
    'How well did training prepare you for your role?',
  ];

  const terminationReasons = [
    'Low pay',
    'Poor management',
    'Lack of growth opportunities',
    'Unfavorable work environment',
    'Better opportunity elsewhere',
    'Personal reasons',
    'Other',
  ];

  const leaveReasons = [
    'Health issues',
    'Family responsibilities',
    'Personal reasons',
    'Better opportunity elsewhere',
    'Work environment concerns',
    'Other',
  ];

  const totalSteps = 4; // intro, status/role, satisfaction, conditional, feedback

  function nextStep() {
    if (currentStep === 0 && !accessCode) {
      alert('Please enter an access code');
      return;
    }
    if (currentStep === 1 && (!employeeStatus || !role)) {
      alert('Please complete all required fields');
      return;
    }
    if (currentStep === 2 && Object.keys(satisfactionAnswers).length < satisfactionQuestions.length) {
      alert('Please answer all satisfaction questions');
      return;
    }
    // Skip conditional questions if "none" is selected
    if (currentStep === 2 && employeeStatus === 'none') {
      setCurrentStep(4); // Skip to feedback
    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      // If going back from feedback and "none" was selected, skip conditional step
      if (currentStep === 4 && employeeStatus === 'none') {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        access_code: accessCode,
        employee_status: employeeStatus,
        role,
        satisfaction_answers: satisfactionAnswers,
        training_answers: employeeStatus === 'newly-hired' ? trainingAnswers : {},
        termination_reason: employeeStatus === 'termination' ? terminationReason : null,
        termination_other: employeeStatus === 'termination' ? terminationOther : null,
        leave_reason: employeeStatus === 'leave' ? leaveReason : null,
        leave_other: employeeStatus === 'leave' ? leaveOther : null,
        additional_feedback: additionalFeedback || null,
      };

      const res = await fetch(`${API_BASE}/survey/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Could not submit survey');
      }

      // success – go to Thank You step
      setCurrentStep(5);
    } catch (err: unknown) {
      console.error('Survey submission failed', err);
      alert(
        err instanceof Error
          ? err.message
          : 'Sorry, something went wrong submitting your survey.'
      );
    } finally {
      setLoading(false);
    }
  }

  function getCurrentStepNumber() {
    if (currentStep === 0) return 0;
    if (currentStep === 1) return 1;
    if (currentStep === 2) return 2;
    if (currentStep === 3) return 3;
    if (currentStep === 4) return 4;
    return 0;
  }

  return (
    <div 
      className="fixed inset-0 flex items-start justify-center overflow-y-auto pt-32 md:pt-40"
      style={{
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
      <div className="relative z-[2000] w-full max-w-2xl mx-5 mb-8">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex min-h-[500px] isolate">
          {/* Left Section - Gradient Blue Sidebar */}
          <div 
            className="w-1/4 hidden md:block"
            style={{
              background: 'linear-gradient(180deg, #071F45 0%, #203F70 100%)',
              flexShrink: 0,
            }}
          ></div>

          {/* Right Section - Form */}
          <div className="bg-[#E6E6E6] flex-1 p-10 md:p-12 flex flex-col justify-center overflow-hidden">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <img 
                  src="/images/Logo 4.png" 
                  alt="Star4ce" 
                  className="h-12 md:h-16 mx-auto"
                />
              </Link>
            </div>

            {/* Progress Dots - Only show after intro */}
            {currentStep > 0 && (
              <div className="flex justify-center items-center gap-2 mb-10">
                {[1, 2, 3, 4].map((step) => {
                  const currentDisplayStep = currentStep === 4 ? 4 : currentStep;
                  return (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full transition-all ${
                          step === currentDisplayStep
                            ? 'bg-[#0B2E65] scale-125'
                            : step < currentDisplayStep
                            ? 'bg-[#0B2E65]'
                            : 'bg-gray-300'
                        }`}
                      />
                      {step < 4 && (
                        <div
                          className={`w-8 h-0.5 mx-1 ${
                            step < currentDisplayStep ? 'bg-[#0B2E65]' : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 0: Introduction */}
            {currentStep === 0 && (
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-bold text-[#0B2E65]">Welcome to the Survey</h2>
                  <div className="text-gray-700 space-y-3 text-center text-sm">
                    <p>This survey helps us understand your experience and improve our workplace. We value your honest feedback and it will be used to make positive changes.</p>
                    <p className="font-semibold text-[#0B2E65]">Your responses are completely anonymous.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Access Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your access code"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">This code links your response to your designated dealership.</p>
                </div>
                <button
                  onClick={nextStep}
                  disabled={!accessCode}
                  className="w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Start Survey
                </button>
              </div>
            )}

            {/* Step 1: Employee Status & Role */}
            {currentStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-8">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-4">
                      What is your current status?
                    </label>
                    <div className="space-y-3">
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
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    What is your role?
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
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

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0B2E65] text-white py-2 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Satisfaction Questions */}
            {currentStep === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                  {satisfactionQuestions.map((question, index) => (
                    <div key={index}>
                      <label className="block text-gray-700 text-sm font-medium mb-3">
                        {question}
                      </label>
                      <div className="space-y-3">
                        {['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'].map((option) => (
                          <label key={option} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`satisfaction-${index}`}
                              value={option}
                              checked={satisfactionAnswers[index] === option}
                              onChange={(e) => setSatisfactionAnswers({ ...satisfactionAnswers, [index]: e.target.value })}
                              className="w-4 h-4 text-[#0B2E65]"
                              required
                            />
                            <span className="text-gray-700 text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-[#0B2E65] text-white py-2 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Conditional Questions */}
            {currentStep === 3 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
                <div className="space-y-8 max-h-[400px] overflow-y-auto pr-2">
                  {/* Newly Hired Questions */}
                  {employeeStatus === 'newly-hired' && (
                    <>
                      <h3 className="text-lg font-semibold text-[#0B2E65]">Training & Onboarding</h3>
                      {trainingQuestions.map((question, index) => (
                        <div key={index}>
                          <label className="block text-gray-700 text-sm font-medium mb-3">
                            {question}
                          </label>
                          <div className="space-y-3">
                            {['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'].map((option) => (
                              <label key={option} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`training-${index}`}
                                  value={option}
                                  checked={trainingAnswers[index] === option}
                                  onChange={(e) => setTrainingAnswers({ ...trainingAnswers, [index]: e.target.value })}
                                  className="w-4 h-4 text-[#0B2E65]"
                                  required
                                />
                                <span className="text-gray-700 text-sm">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Termination Questions */}
                  {employeeStatus === 'termination' && (
                    <>
                      <h3 className="text-lg font-semibold text-[#0B2E65]">Termination Details</h3>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-3">
                          What was the primary reason for termination?
                        </label>
                        <div className="space-y-3">
                          {terminationReasons.map((reason) => (
                            <label key={reason} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="terminationReason"
                                value={reason}
                                checked={terminationReason === reason}
                                onChange={(e) => setTerminationReason(e.target.value)}
                                className="w-4 h-4 text-[#0B2E65]"
                                required
                              />
                              <span className="text-gray-700 text-sm">{reason}</span>
                            </label>
                          ))}
                        </div>
                        {terminationReason === 'Other' && (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="Please specify"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                              value={terminationOther}
                              onChange={(e) => setTerminationOther(e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Leave Questions */}
                  {employeeStatus === 'leave' && (
                    <>
                      <h3 className="text-lg font-semibold text-[#0B2E65]">Leave Details</h3>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-3">
                          What was the primary reason for leave?
                        </label>
                        <div className="space-y-3">
                          {leaveReasons.map((reason) => (
                            <label key={reason} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="leaveReason"
                                value={reason}
                                checked={leaveReason === reason}
                                onChange={(e) => setLeaveReason(e.target.value)}
                                className="w-4 h-4 text-[#0B2E65]"
                                required
                              />
                              <span className="text-gray-700 text-sm">{reason}</span>
                            </label>
                          ))}
                        </div>
                        {leaveReason === 'Other' && (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="Please specify"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none"
                              value={leaveOther}
                              onChange={(e) => setLeaveOther(e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* None of the above - skip conditional questions */}
                  {employeeStatus === 'none' && (
                    <div className="text-center text-gray-600 py-4">
                      <p>No additional questions for this status.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0B2E65] text-white py-2 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Additional Feedback */}
            {currentStep === 4 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-3">
                    Additional Feedback
                  </label>
                  <textarea
                    placeholder="Please share any additional thoughts, comments, or suggestions..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none min-h-[200px] resize-none"
                    value={additionalFeedback}
                    onChange={(e) => setAdditionalFeedback(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#0B2E65] text-white py-2 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Survey'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 5: Success Page */}
            {currentStep === 5 && (
              <div className="space-y-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-[#0B2E65]/10 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#0B2E65]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="inline-block w-full bg-[#0B2E65] text-white py-3 rounded-lg font-semibold hover:bg-[#2c5aa0] transition-colors"
                >
                  Take me back to home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
