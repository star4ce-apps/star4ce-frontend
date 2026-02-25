'use client';

import { useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';

const COLORS = {
  primary: '#4D6DBE',
  gray: {
    50: '#F5F7FA',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    900: '#0F172A',
  }
};

type FAQItem = {
  question: string;
  answer: string;
  category: string;
};

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I add a new employee?',
    answer: 'Navigate to the Employees page and click the "Add Employee" button. Fill in the required fields (marked with *) including name, email, phone, department, position, and status. You can also add optional information like address, date of birth, education, and referrals.'
  },
  {
    category: 'Getting Started',
    question: 'How do I add a candidate?',
    answer: 'Go to the Candidates page and click "Add Candidate". Fill in the candidate\'s information including name, email, position, and contact details. You can upload a resume and add education information, referrals, and other details.'
  },
  {
    category: 'Getting Started',
    question: 'How do I convert a candidate to an employee?',
    answer: 'Open the candidate profile, scroll to the "Hiring Decision" tab, and click "Accept". This will move the candidate to the employee list. Note: This action cannot be undone and will permanently delete the candidate\'s resume.'
  },
  {
    category: 'Employees',
    question: 'How do I edit employee information?',
    answer: 'Navigate to the employee profile page and click the "Edit" button in the Information section. You can update all employee details including name, contact information, department, position, status, and more.'
  },
  {
    category: 'Employees',
    question: 'How do I delete an employee?',
    answer: 'On the employee profile page, click "Edit" in the Information section, scroll to the bottom, and click "Delete Employee" in the Danger Zone. This will mark the employee as inactive (soft delete) and will not affect turnover or other data.'
  },
  {
    category: 'Employees',
    question: 'What is the difference between deleting and terminating an employee?',
    answer: 'Deleting an employee (from the profile page) marks them as inactive and is used to correct admin mistakes. It does not affect turnover data. Terminating an employee (from the Termination page) records an official exit with a reason and affects turnover/retention metrics.'
  },
  {
    category: 'Candidates',
    question: 'How do I score a candidate interview?',
    answer: 'Go to the Candidates page, select a candidate, and click "Add New Interview Score" in the Hiring Process tab. You\'ll be taken to the scoring page where you can rate the candidate across different categories and provide recommendations.'
  },
  {
    category: 'Candidates',
    question: 'How do I edit candidate information?',
    answer: 'Open the candidate profile page and click the "Edit" button in the Information section. You can update contact details, personal information, education, and referrals.'
  },
  {
    category: 'Performance Reviews',
    question: 'How do I create a performance review?',
    answer: 'Navigate to the Performance Reviews page, select an employee, and click "Add New Performance Review". Fill in scores for job knowledge, work quality, service performance, teamwork, and attendance. Add strengths, areas for improvement, and notes.'
  },
  {
    category: 'Performance Reviews',
    question: 'Can I view past performance reviews?',
    answer: 'Yes, all performance reviews are displayed on the employee profile page under the "Performance Reviews" tab. You can see the review history, scores, and comments for each review.'
  },
  {
    category: 'Role History',
    question: 'What is role history?',
    answer: 'Role history tracks all changes made to employees and candidates, including status changes, department changes, and other modifications. You can view the complete history and revert changes if needed.'
  },
  {
    category: 'Role History',
    question: 'How do I revert a change?',
    answer: 'Go to the Role History page, find the entry you want to revert, and click the revert arrow icon. Confirm the action. Note: Some actions like "Employee Created" or "Terminated" cannot be reverted.'
  },
  {
    category: 'Analytics',
    question: 'What is Turnover?',
    answer: 'Employee Turnover is the rate at which employees leave your organization over a specific period. It\'s calculated by dividing the number of employees who left (terminated, resigned, or otherwise exited) by the average number of employees during that period, then multiplying by 100 to get a percentage. High turnover can indicate issues with employee satisfaction, workplace culture, or compensation. In this system, turnover is calculated based on employee exit records from the Termination page. Only official exits (recorded terminations) are included in turnover calculations, not soft-deleted employees.'
  },
  {
    category: 'Analytics',
    question: 'What is Retention?',
    answer: 'Employee Retention is the percentage of employees who remain with your organization over a specific period. It\'s the inverse of turnover - calculated by dividing the number of employees who stayed by the average number of employees, then multiplying by 100. High retention indicates a healthy workplace where employees are satisfied, engaged, and committed. It reduces recruitment costs, maintains institutional knowledge, and improves team stability. In this system, retention rate is automatically calculated and displayed alongside turnover in the Analytics page. A higher retention rate (closer to 100%) is generally better.'
  },
  {
    category: 'Analytics',
    question: 'What analytics are available?',
    answer: 'The Analytics page provides insights into employee turnover, retention rates, performance trends, and other key metrics. You can filter by time period and view detailed breakdowns.'
  },
  {
    category: 'Account',
    question: 'How do I change my password?',
    answer: 'Go to Settings and use the password change section. You\'ll need to enter your current password and your new password twice for confirmation.'
  },
  {
    category: 'Account',
    question: 'How do I update my subscription?',
    answer: 'Navigate to the Subscription page to view your current plan and upgrade or modify your subscription. Contact support if you need assistance with billing.'
  }
];

const categories = Array.from(new Set(faqs.map(faq => faq.category)));

export default function HelpSupportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1" style={{ color: '#232E40' }}>Help & Support</h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>Find answers to common questions and get the help you need</p>
          </div>

          {/* Featured: Turnover & Retention */}
          <div className="mb-8 grid grid-cols-2 gap-6">
            <div className="rounded-xl p-6" style={{ 
              backgroundColor: '#E0E7FF', 
              border: '1px solid #E0E7FF',
              boxShadow: '0 4px 6px -1px rgba(77, 109, 190, 0.1), 0 2px 4px -1px rgba(77, 109, 190, 0.06)'
            }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#4D6DBE' }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FFFFFF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-3" style={{ color: '#1E40AF' }}>What is Turnover?</h2>
                  <p className="text-base leading-relaxed mb-4 font-bold" style={{ color: '#374151' }}>
                    Employee Turnover is the rate at which employees leave your organization over a specific period. It's calculated by dividing the number of employees who left (terminated, resigned, or otherwise exited) by the average number of employees during that period, then multiplying by 100 to get a percentage.
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                    <strong style={{ color: '#374151' }}>Why it matters:</strong> High turnover can indicate issues with employee satisfaction, workplace culture, or compensation. It also impacts costs related to recruiting, training, and lost productivity. Monitoring turnover helps you identify trends and take proactive steps to improve retention.
                  </p>
                  <p className="text-sm leading-relaxed mt-3" style={{ color: '#6B7280' }}>
                    <strong style={{ color: '#374151' }}>In this system:</strong> Turnover is calculated based on employee exit records from the Termination page. Only official exits (recorded terminations) are included in turnover calculations, not soft-deleted employees.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ 
              backgroundColor: '#E0E7FF', 
              border: '1px solid #E0E7FF',
              boxShadow: '0 4px 6px -1px rgba(77, 109, 190, 0.1), 0 2px 4px -1px rgba(77, 109, 190, 0.06)'
            }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#4D6DBE' }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FFFFFF' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-3" style={{ color: '#1E40AF' }}>What is Retention?</h2>
                  <p className="text-base leading-relaxed mb-4 font-bold" style={{ color: '#374151' }}>
                    Employee Retention is the percentage of employees who remain with your organization over a specific period. It's the inverse of turnover - calculated by dividing the number of employees who stayed by the average number of employees, then multiplying by 100.
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                    <strong style={{ color: '#374151' }}>Why it matters:</strong> High retention indicates a healthy workplace where employees are satisfied, engaged, and committed. It reduces recruitment costs, maintains institutional knowledge, and improves team stability. Strong retention is often a sign of effective management and positive company culture.
                  </p>
                  <p className="text-sm leading-relaxed mt-3" style={{ color: '#6B7280' }}>
                    <strong style={{ color: '#374151' }}>In this system:</strong> Retention rate is automatically calculated and displayed alongside turnover in the Analytics page. A higher retention rate (closer to 100%) is generally better, indicating that most employees are staying with your organization.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: '#D1D5DB', 
                  color: '#374151', 
                  backgroundColor: '#FFFFFF',
                  focusRingColor: '#4D6DBE'
                }}
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#9CA3AF' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Category Filter */}
            <div className="col-span-1">
              <div className="rounded-xl p-5 sticky top-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedCategory === 'All' ? 'font-semibold' : ''
                    }`}
                    style={{
                      backgroundColor: selectedCategory === 'All' ? '#DBEAFE' : 'transparent',
                      color: selectedCategory === 'All' ? '#1E40AF' : '#6B7280'
                    }}
                  >
                    All Topics
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedCategory === category ? 'font-semibold' : ''
                      }`}
                      style={{
                        backgroundColor: selectedCategory === category ? '#DBEAFE' : 'transparent',
                        color: selectedCategory === category ? '#1E40AF' : '#6B7280'
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ Content */}
            <div className="col-span-3">
              <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1" style={{ color: '#232E40' }}>
                    Frequently Asked Questions
                  </h2>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    {filteredFAQs.length} {filteredFAQs.length === 1 ? 'question' : 'questions'} found
                  </p>
                </div>

                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#D1D5DB' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>No results found</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Try adjusting your search or category filter</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFAQs.map((faq, index) => (
                      <div
                        key={index}
                        className="rounded-lg border transition-all"
                        style={{ 
                          borderColor: expandedFAQ === index ? '#4D6DBE' : '#E5E7EB',
                          backgroundColor: expandedFAQ === index ? '#F8FAFF' : '#FFFFFF'
                        }}
                      >
                        <button
                          onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                          className="w-full text-left px-5 py-4 flex items-center justify-between"
                        >
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: '#E0E7FF', color: '#4D6DBE' }}>
                                {faq.category}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold" style={{ color: '#232E40' }}>
                              {faq.question}
                            </h3>
                          </div>
                          <svg
                            className={`w-5 h-5 transition-transform flex-shrink-0 ${expandedFAQ === index ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: '#6B7280' }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {expandedFAQ === index && (
                          <div className="px-5 pb-4 pt-0">
                            <div className="pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Support Section */}
              <div className="mt-6 rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E0E7FF' }}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#4D6DBE' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#232E40' }}>Still need help?</h3>
                    <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                      If you can't find what you're looking for, our support team is here to help.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="mailto:support@star4ce.com"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-90"
                        style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email Support
                      </a>
                      <a
                        href="tel:+1-800-STAR4CE"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-gray-50"
                        style={{ borderColor: '#D1D5DB', color: '#374151' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call Support
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
