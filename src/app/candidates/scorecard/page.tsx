'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import toast from 'react-hot-toast';

// Modern color palette
const COLORS = {
  primary: '#3B5998',
  primaryLight: '#4D6DBE',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  gray: {
    50: '#F8FAFC',
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

type Question = {
  id: string;
  text: string;
};

type Criterion = {
  id: string;
  name: string;
  weight: number;
  questions: Question[];
  expanded?: boolean;
};

type Role = {
  id: string;
  name: string;
  description: string;
};

// Roles from the PDF files
const roles: Role[] = [
  { id: 'c-level-manager', name: 'C-Level Manager', description: 'Dealer Principal, CFO, COO' },
  { id: 'gm', name: 'General Manager', description: 'GM Assessment Tool Enhanced' },
  { id: 'sales-manager', name: 'Sales Manager', description: 'Sales department management' },
  { id: 'salesperson', name: 'Salesperson', description: 'Sales consultants and representatives' },
  { id: 'service-manager', name: 'Service Manager', description: 'Service department management' },
  { id: 'service-advisor', name: 'Service Advisor', description: 'Service department advisors' },
  { id: 'parts-manager', name: 'Parts Manager', description: 'Parts department management' },
  { id: 'office-clerk', name: 'Office Clerk', description: 'Administrative and office support' },
  { id: 'hr-manager', name: 'HR Manager', description: 'Human resources management' },
  { id: 'finance-manager', name: 'Finance Manager', description: 'Finance and accounting management' },
  { id: 'used-car-manager', name: 'Used Car Manager', description: 'Used car department management' },
  { id: 'body-shop-manager', name: 'Body Shop Manager', description: 'Body shop department management' },
  { id: 'automotive-technician', name: 'Automotive Technician', description: 'Automotive service technicians' },
  { id: 'support-staff', name: 'Support Staff', description: 'General support staff' },
];

// Initialize empty criteria structure for each role
const initializeCriteria = (): Record<string, Criterion[]> => {
  const initial: Record<string, Criterion[]> = {};
  roles.forEach(role => {
    initial[role.id] = [];
  });
  return initial;
};

export default function ScoreCardEditorPage() {
  const [selectedRole, setSelectedRole] = useState<string>('c-level-manager');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [criterionName, setCriterionName] = useState('');
  const [criterionWeight, setCriterionWeight] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPrintView, setShowPrintView] = useState(false);
  const [criteria, setCriteria] = useState<Record<string, Criterion[]>>(initializeCriteria());

  const currentCriteria = criteria[selectedRole] || [];
  const totalWeight = currentCriteria.reduce((sum, c) => sum + c.weight, 0);
  const isReadyToSave = totalWeight === 100;
  const selectedRoleData = roles.find(r => r.id === selectedRole);

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: Date.now().toString(), text: '' }]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleQuestionChange = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const handleAddCriterion = () => {
    setCriterionName('');
    setCriterionWeight('');
    setQuestions([{ id: Date.now().toString(), text: '' }]);
    setShowAddModal(true);
  };

  const handleEditCriterion = (criterion: Criterion) => {
    setEditingCriterion(criterion);
    setCriterionName(criterion.name);
    setCriterionWeight(criterion.weight.toString());
    setQuestions(criterion.questions.length > 0 
      ? criterion.questions.map(q => ({ ...q }))
      : [{ id: Date.now().toString(), text: '' }]
    );
    setShowEditModal(true);
  };

  const handleSaveCriterion = () => {
    if (!criterionName.trim() || !criterionWeight) {
      toast.error('Please fill in all required fields');
      return;
    }

    const weight = parseFloat(criterionWeight);
    if (isNaN(weight) || weight < 0 || weight > 100) {
      toast.error('Weight must be a number between 0 and 100');
      return;
    }

    const newCriterion: Criterion = {
      id: editingCriterion?.id || Date.now().toString(),
      name: criterionName.trim(),
      weight,
      questions: questions.filter(q => q.text.trim()),
      expanded: false,
    };

    const updatedCriteria = { ...criteria };
    if (editingCriterion) {
      updatedCriteria[selectedRole] = updatedCriteria[selectedRole].map(c =>
        c.id === editingCriterion.id ? newCriterion : c
      );
      toast.success('Criterion updated successfully');
    } else {
      updatedCriteria[selectedRole] = [...updatedCriteria[selectedRole], newCriterion];
      toast.success('Criterion added successfully');
    }

    setCriteria(updatedCriteria);
    resetModal();
  };

  const handleDeleteCriterion = () => {
    if (!editingCriterion) return;

    if (!confirm(`Are you sure you want to delete "${editingCriterion.name}"?`)) {
      return;
    }

    const updatedCriteria = { ...criteria };
    updatedCriteria[selectedRole] = updatedCriteria[selectedRole].filter(
      c => c.id !== editingCriterion.id
    );
    setCriteria(updatedCriteria);
    toast.success('Criterion deleted successfully');
    resetModal();
  };

  const resetModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingCriterion(null);
    setCriterionName('');
    setCriterionWeight('');
    setQuestions([]);
  };

  const toggleExpand = (criterionId: string) => {
    const updatedCriteria = { ...criteria };
    updatedCriteria[selectedRole] = updatedCriteria[selectedRole].map(c =>
      c.id === criterionId ? { ...c, expanded: !c.expanded } : c
    );
    setCriteria(updatedCriteria);
  };

  const handleSaveScoreCard = async () => {
    if (!isReadyToSave) {
      toast.error('Total weight must equal 100% before saving');
      return;
    }

    try {
      // TODO: Replace with actual API call when backend is ready
      toast.success(`Score card for ${selectedRoleData?.name} saved successfully!`);
    } catch (err) {
      toast.error('Failed to save score card');
      console.error(err);
    }
  };

  const handlePreviewPDF = () => {
    if (!isReadyToSave) {
      toast.error('Total weight must equal 100% before previewing');
      return;
    }
    setShowPrintView(true);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      setShowPrintView(false);
    };
    
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
        <HubSidebar />
        <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
          {/* Modern Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>
                  Interview Scorecard Editor
                </h1>
                <p className="text-base" style={{ color: COLORS.gray[600] }}>
                  Define evaluation criteria and weights for each role. Interviewers will use these to assess candidates.
                </p>
              </div>
            </div>
          </div>

          {/* Role Selection - Modern Card Grid */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.gray[900] }}>Select Role</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className="p-4 rounded-xl text-left transition-all duration-200 hover:shadow-lg"
                  style={{
                    backgroundColor: selectedRole === role.id ? COLORS.primaryLight : '#FFFFFF',
                    color: selectedRole === role.id ? '#FFFFFF' : COLORS.gray[700],
                    border: selectedRole === role.id ? 'none' : `2px solid ${COLORS.gray[200]}`,
                    boxShadow: selectedRole === role.id 
                      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="font-semibold text-sm mb-1">{role.name}</div>
                  <div className="text-xs opacity-90">{role.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Role Section */}
          <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: COLORS.gray[200] }}>
            <div className="p-6 border-b" style={{ borderColor: COLORS.gray[200] }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.gray[900] }}>
                    {selectedRoleData?.name}
                  </h2>
                  <p className="text-sm" style={{ color: COLORS.gray[600] }}>
                    {selectedRoleData?.description}
                  </p>
                </div>
                <button
                  onClick={handleAddCriterion}
                  className="px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:shadow-md flex items-center gap-2"
                  style={{
                    backgroundColor: COLORS.secondary,
                    color: '#FFFFFF',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Criterion
                </button>
              </div>
            </div>

            {/* Criteria List */}
            <div className="p-6">
              {currentCriteria.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS.gray[100] }}>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: COLORS.gray[400] }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-base font-medium mb-2" style={{ color: COLORS.gray[700] }}>
                    No criteria defined yet
                  </p>
                  <p className="text-sm mb-6" style={{ color: COLORS.gray[500] }}>
                    Click "Add Criterion" to start building your scorecard
                  </p>
                  <button
                    onClick={handleAddCriterion}
                    className="px-6 py-3 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: COLORS.secondary,
                      color: '#FFFFFF',
                    }}
                  >
                    Add Your First Criterion
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentCriteria.map((criterion, index) => (
                    <div
                      key={criterion.id}
                      className="rounded-xl border transition-all hover:shadow-md"
                      style={{
                        borderColor: COLORS.gray[200],
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                            style={{ backgroundColor: COLORS.primaryLight, color: '#FFFFFF' }}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-semibold" style={{ color: COLORS.gray[900] }}>
                                {criterion.name}
                              </h3>
                              <span className="px-3 py-1 rounded-full text-sm font-bold"
                                style={{
                                  backgroundColor: COLORS.gray[100],
                                  color: COLORS.gray[700],
                                }}>
                                {criterion.weight}%
                              </span>
                            </div>
                            {criterion.questions.length > 0 && (
                              <p className="text-xs mt-1" style={{ color: COLORS.gray[500] }}>
                                {criterion.questions.length} question{criterion.questions.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {criterion.questions.length > 0 && (
                            <button
                              onClick={() => toggleExpand(criterion.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              style={{ color: COLORS.gray[600] }}
                            >
                              <svg
                                className={`w-5 h-5 transition-transform duration-200 ${criterion.expanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleEditCriterion(criterion)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: COLORS.gray[600] }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {criterion.expanded && criterion.questions.length > 0 && (
                        <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: COLORS.gray[200], backgroundColor: COLORS.gray[50] }}>
                          <div className="space-y-2">
                            {criterion.questions.map((question, qIndex) => (
                              <div key={question.id} className="flex items-start gap-3 text-sm" style={{ color: COLORS.gray[700] }}>
                                <span className="font-semibold mt-0.5" style={{ color: COLORS.gray[500] }}>
                                  {qIndex + 1}.
                                </span>
                                <span>{question.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Weight & Actions */}
            <div className="p-6 border-t" style={{ borderColor: COLORS.gray[200], backgroundColor: COLORS.gray[50] }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm font-medium block mb-1" style={{ color: COLORS.gray[600] }}>
                      Total Weight
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className="px-6 py-2 rounded-lg text-lg font-bold"
                        style={{
                          backgroundColor: isReadyToSave ? COLORS.secondary : COLORS.danger,
                          color: '#FFFFFF',
                        }}
                      >
                        {totalWeight}%
                      </span>
                      {isReadyToSave ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: COLORS.secondary }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-semibold" style={{ color: COLORS.secondary }}>
                            Ready to save
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: COLORS.gray[500] }}>
                          {100 - totalWeight}% remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePreviewPDF}
                    disabled={!isReadyToSave}
                    className="px-6 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      backgroundColor: COLORS.primaryLight,
                      color: '#FFFFFF',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </button>
                  <button
                    onClick={handleSaveScoreCard}
                    disabled={!isReadyToSave}
                    className="px-6 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      backgroundColor: COLORS.secondary,
                      color: '#FFFFFF',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Scorecard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Add/Edit Criterion Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b" style={{ borderColor: COLORS.gray[200] }}>
                <h3 className="text-xl font-bold" style={{ color: COLORS.gray[900] }}>
                  {editingCriterion ? 'Edit Criterion' : 'Add New Criterion'}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.gray[700] }}>
                    Criterion Name *
                  </label>
                  <input
                    type="text"
                    value={criterionName}
                    onChange={(e) => setCriterionName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: COLORS.gray[300],
                      color: COLORS.gray[900],
                    }}
                    placeholder="e.g., Technical Skills, Communication, Problem-Solving"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.gray[700] }}>
                    Weight (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={criterionWeight}
                    onChange={(e) => setCriterionWeight(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: COLORS.gray[300],
                      color: COLORS.gray[900],
                    }}
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold" style={{ color: COLORS.gray[700] }}>
                      Interview Questions
                    </label>
                    <button
                      onClick={handleAddQuestion}
                      className="text-sm font-medium px-3 py-1 rounded-lg transition-colors"
                      style={{ color: COLORS.primaryLight, backgroundColor: COLORS.gray[100] }}
                    >
                      + Add Question
                    </button>
                  </div>
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <div key={question.id} className="flex items-start gap-3">
                        <span className="text-sm font-medium mt-3" style={{ color: COLORS.gray[500] }}>
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <textarea
                            value={question.text}
                            onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none"
                            style={{
                              borderColor: COLORS.gray[300],
                              color: COLORS.gray[900],
                            }}
                            rows={2}
                            placeholder="Enter interview question..."
                          />
                        </div>
                        {questions.length > 1 && (
                          <button
                            onClick={() => handleRemoveQuestion(question.id)}
                            className="mt-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: COLORS.danger }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: COLORS.gray[200] }}>
                <div>
                  {editingCriterion && (
                    <button
                      onClick={handleDeleteCriterion}
                      className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                      style={{
                        backgroundColor: COLORS.danger,
                        color: '#FFFFFF',
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetModal}
                    className="px-6 py-2 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: COLORS.gray[200],
                      color: COLORS.gray[700],
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCriterion}
                    className="px-6 py-2 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: COLORS.secondary,
                      color: '#FFFFFF',
                    }}
                  >
                    {editingCriterion ? 'Update' : 'Add'} Criterion
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print View */}
        {showPrintView && (
          <div className="print-wrapper fixed inset-0 bg-white z-50 overflow-y-auto p-8">
            <div className="print-buttons fixed top-4 left-4 flex gap-3 z-50">
              <button
                onClick={() => setShowPrintView(false)}
                className="px-6 py-3 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: COLORS.gray[700], color: '#FFFFFF' }}
              >
                ← Back
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-3 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: COLORS.secondary, color: '#FFFFFF' }}
              >
                Print
              </button>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * { visibility: hidden; }
                .print-wrapper, .print-wrapper * { visibility: visible !important; }
                .print-wrapper { position: absolute; top: 0; left: 0; width: 100%; }
                .print-buttons { display: none !important; }
              }
            `}} />
            <div className="max-w-4xl mx-auto mt-16">
              <div className="text-center mb-8 pb-4 border-b-2 border-black">
                <h1 className="text-3xl font-bold mb-2">INTERVIEW SCORECARD</h1>
                <h2 className="text-xl">{selectedRoleData?.name}</h2>
              </div>
              <div className="space-y-6">
                {currentCriteria.map((criterion, index) => (
                  <div key={criterion.id} className="border border-black p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-lg">{index + 1}. {criterion.name}</h3>
                      <span className="font-semibold">Weight: {criterion.weight}%</span>
                    </div>
                    {criterion.questions.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {criterion.questions.map((question, qIndex) => (
                          <div key={question.id} className="text-sm">
                            <strong>{qIndex + 1}.</strong> {question.text}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Score (1-10):</span>
                        <div className="w-24 h-8 border border-black"></div>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-semibold">Notes:</span>
                        <div className="mt-1 space-y-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 border-b border-gray-300"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
