'use client';

import { useState } from 'react';
import React from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';

type Criterion = {
  id: string;
  name: string;
  weight: number;
  questions: Array<{ id: string; text: string }>;
  expanded?: boolean;
};

const roles = [
  { id: 'c-level', name: 'C-Level Executives', description: 'Dealer Principal, CFO, COO, General Manager' },
  { id: 'mid-level', name: 'Mid-Level Managers', description: 'Department Managers, Sales Managers, Service Managers' },
  { id: 'office-staff', name: 'Office Staff', description: 'Administrative, Reception, Office Support' },
  { id: 'salespeople', name: 'Salespeople', description: 'Sales Representatives, Sales Consultants' },
  { id: 'service-advisors', name: 'Service Advisors', description: 'Service Advisors, Service Writers' },
  { id: 'service-technicians', name: 'Service Technicians', description: 'Service Technicians, Mechanics' },
];

// Mock criteria data - in real app, this would come from API
const criteriaData: Record<string, Criterion[]> = {
  'c-level': [
    { id: '1', name: 'Strategic Leadership & Vision', weight: 15, questions: [] },
    { id: '2', name: 'Financial & Business Acumen', weight: 18, questions: [] },
    { id: '3', name: 'Industry Experience & Dealership Knowledge', weight: 15, questions: [] },
    { id: '4', name: 'Decision-Making Under Pressure', weight: 12, questions: [] },
    { id: '5', name: 'Executive Communication & Influence', weight: 10, questions: [] },
    { id: '6', name: 'Team & Stakeholder Alignment', weight: 8, questions: [] },
    { id: '7', name: 'Innovation & Change Management', weight: 7, questions: [] },
    { id: '8', name: 'Prior Success in Leadership Roles', weight: 5, questions: [] },
    { id: '9', name: 'Negotiation & Vendor/Partner Relations', weight: 5, questions: [] },
    { id: '10', name: 'Team Leadership & Coaching', weight: 15, questions: [] },
  ],
  'mid-level': [
    { id: 'm1', name: 'Department Management & Operations', weight: 20, questions: [] },
    { id: 'm2', name: 'Team Leadership & Development', weight: 18, questions: [] },
    { id: 'm3', name: 'Communication & Collaboration', weight: 15, questions: [] },
    { id: 'm4', name: 'Problem-Solving & Decision-Making', weight: 12, questions: [] },
    { id: 'm5', name: 'Customer Service Excellence', weight: 10, questions: [] },
    { id: 'm6', name: 'Process Improvement & Efficiency', weight: 10, questions: [] },
    { id: 'm7', name: 'Budget Management & Financial Acumen', weight: 15, questions: [] },
  ],
  'office-staff': [
    { id: 'o1', name: 'Administrative Skills & Organization', weight: 25, questions: [] },
    { id: 'o2', name: 'Communication & Customer Service', weight: 20, questions: [] },
    { id: 'o3', name: 'Attention to Detail & Accuracy', weight: 20, questions: [] },
    { id: 'o4', name: 'Time Management & Prioritization', weight: 15, questions: [] },
    { id: 'o5', name: 'Problem-Solving & Initiative', weight: 10, questions: [] },
    { id: 'o6', name: 'Professionalism & Adaptability', weight: 10, questions: [] },
  ],
  'salespeople': [
    { id: 's1', name: 'Sales Process & Closing Skills', weight: 30, questions: [] },
    { id: 's2', name: 'Product Knowledge & Automotive Expertise', weight: 20, questions: [] },
    { id: 's3', name: 'Customer Relationship Management', weight: 15, questions: [] },
    { id: 's4', name: 'Communication & Presentation Skills', weight: 15, questions: [] },
    { id: 's5', name: 'Goal Achievement & Performance', weight: 10, questions: [] },
    { id: 's6', name: 'Professionalism & Work Ethic', weight: 10, questions: [] },
  ],
  'service-advisors': [
    { id: 'sa1', name: 'Customer Service & Communication', weight: 25, questions: [] },
    { id: 'sa2', name: 'Technical Knowledge & Diagnostic Understanding', weight: 20, questions: [] },
    { id: 'sa3', name: 'Service Writing & Work Order Management', weight: 18, questions: [] },
    { id: 'sa4', name: 'Time Management & Scheduling', weight: 15, questions: [] },
    { id: 'sa5', name: 'Upselling & Service Recommendations', weight: 12, questions: [] },
    { id: 'sa6', name: 'Problem-Solving & Follow-Up', weight: 10, questions: [] },
  ],
  'service-technicians': [
    { id: 'st1', name: 'Technical Skills & Diagnostic Ability', weight: 30, questions: [] },
    { id: 'st2', name: 'Quality of Work & Attention to Detail', weight: 25, questions: [] },
    { id: 'st3', name: 'Efficiency & Time Management', weight: 15, questions: [] },
    { id: 'st4', name: 'Safety & Compliance', weight: 15, questions: [] },
    { id: 'st5', name: 'Communication & Documentation', weight: 10, questions: [] },
    { id: 'st6', name: 'Professionalism & Work Ethic', weight: 5, questions: [] },
  ],
};

export default function ScoreCandidatePage() {
  const [selectedRole, setSelectedRole] = useState('mid-level');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});

  const currentCriteria = criteriaData[selectedRole] || [];

  const toggleExpand = (criterionId: string) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [criterionId]: !prev[criterionId]
    }));
  };

  const handleScoreChange = (criterionId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setScores(prev => ({
      ...prev,
      [criterionId]: numValue
    }));
  };

  const calculateWeighted = (criterionId: string): number => {
    const criterion = currentCriteria.find(c => c.id === criterionId);
    if (!criterion) return 0;
    const rawScore = scores[criterionId] || 0;
    return (rawScore * criterion.weight) / 100;
  };

  const totalWeighted = currentCriteria.reduce((sum, criterion) => {
    return sum + calculateWeighted(criterion.id);
  }, 0);

  const handleSubmit = () => {
    // TODO: Submit scores to API
    alert('Scores submitted successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all scores?')) {
      setScores({});
      setSelectedCandidate('');
      setSelectedManager('');
      setSelectedStage('');
    }
  };

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Score a Candidate</h1>
            <p className="text-base" style={{ color: '#6B7280' }}>
              Select candidate and enter in raw scores for the following role.
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
                style={{
                  backgroundColor: selectedRole === role.id ? '#4D6DBE' : '#FFFFFF',
                  color: selectedRole === role.id ? '#FFFFFF' : '#374151',
                  border: selectedRole === role.id ? 'none' : '1px solid #E5E7EB',
                }}
              >
                {role.name}
              </button>
            ))}
          </div>

          {/* Candidate, Hiring Manager, and Interview Stage Selection */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#232E40' }}>
                Candidate:
              </label>
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  border: '1px solid #D1D5DB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">Please choose...</option>
                <option value="candidate1">Candidate 1</option>
                <option value="candidate2">Candidate 2</option>
                <option value="candidate3">Candidate 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#232E40' }}>
                Hiring Manager:
              </label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  border: '1px solid #D1D5DB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">Please choose...</option>
                <option value="manager1">Manager 1</option>
                <option value="manager2">Manager 2</option>
                <option value="manager3">Manager 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#232E40' }}>
                Interview Stage:
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  border: '1px solid #D1D5DB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">Please choose...</option>
                <option value="first">First Interview</option>
                <option value="second">Second Interview</option>
                <option value="third">Third Interview</option>
                <option value="final">Final Interview</option>
                <option value="panel">Panel Interview</option>
                <option value="technical">Technical Interview</option>
              </select>
            </div>
          </div>

          {/* Scoring Scale */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#232E40' }}>Scoring Scale:</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              below 6.0 = Poor, 6.1 to 6.9 = Average, 7.0 to 8.0 = Good, 8.1 to 10 = Excellent
            </p>
          </div>

          {/* Scoring Table */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#4D6DBE' }}>
                  <th className="py-4 px-6 text-left text-sm font-bold text-white">CRITERION</th>
                  <th className="py-4 px-6 text-right text-sm font-bold text-white">WEIGHT %</th>
                  <th className="py-4 px-6 text-center text-sm font-bold text-white">RAW SCORE (out of 10)</th>
                  <th className="py-4 px-6 text-right text-sm font-bold text-white">WEIGHTED</th>
                </tr>
              </thead>
              <tbody>
                {currentCriteria.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-6 text-center text-sm" style={{ color: '#6B7280' }}>
                      No criteria defined for this role.
                    </td>
                  </tr>
                ) : (
                  currentCriteria.map((criterion) => (
                    <React.Fragment key={criterion.id}>
                      <tr
                        className="hover:bg-blue-50 transition-all duration-200"
                        style={{ borderBottom: '1px solid #F3F4F6' }}
                      >
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            {criterion.questions.length > 0 && (
                              <button
                                onClick={() => toggleExpand(criterion.id)}
                                className="p-1.5 hover:bg-gray-200 rounded-lg transition-all duration-200"
                                style={{ color: '#6B7280' }}
                              >
                                <svg
                                  className={`w-5 h-5 transition-transform duration-200 ${expandedCriteria[criterion.id] ? 'rotate-90' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            )}
                            <span className="text-sm font-semibold" style={{ color: '#232E40' }}>
                              {criterion.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <span className="text-sm font-bold px-3 py-1 rounded-lg" style={{ 
                            color: '#232E40',
                            backgroundColor: '#F3F4F6'
                          }}>
                            {criterion.weight}%
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={scores[criterion.id] || ''}
                            onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                            className="w-24 px-3 py-2 text-sm rounded-lg text-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                              border: '1px solid #D1D5DB',
                              color: '#374151',
                              backgroundColor: '#FFFFFF',
                            }}
                            placeholder="0.0 / 10"
                          />
                        </td>
                        <td className="py-3 px-6 text-right">
                          <span className="text-sm font-bold" style={{ color: '#232E40' }}>
                            {calculateWeighted(criterion.id).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                      {expandedCriteria[criterion.id] && criterion.questions.length > 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-3" style={{ backgroundColor: '#F9FAFB' }}>
                            <ul className="list-disc list-inside space-y-1 ml-6">
                              {criterion.questions.map((question) => (
                                <li key={question.id} className="text-sm" style={{ color: '#374151' }}>
                                  {question.text}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total Weight & Action Buttons */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold" style={{ color: '#232E40' }}>Total Weight:</span>
              <span
                className="px-4 py-1.5 rounded-full text-base font-bold"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                }}
              >
                {totalWeighted.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-gray-50"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF'
                }}
              >
                Reset
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedCandidate || !selectedManager || !selectedStage}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
