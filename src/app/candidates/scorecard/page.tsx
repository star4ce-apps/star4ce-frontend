'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';

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

const roles: Role[] = [
  { id: 'c-level', name: 'C-Level Executives', description: 'Dealer Principal, CFO, COO, General Manager' },
  { id: 'mid-level', name: 'Mid-Level Managers', description: 'Department Managers, Team Leads' },
  { id: 'office-staff', name: 'Office Staff', description: 'Administrative and support roles' },
  { id: 'salespeople', name: 'Salespeople', description: 'Sales consultants and representatives' },
  { id: 'service-advisors', name: 'Service Advisors', description: 'Service department advisors' },
  { id: 'service-technicians', name: 'Service Technicians', description: 'Automotive service technicians' },
];

export default function ScoreCardEditorPage() {
  const [selectedRole, setSelectedRole] = useState<string>('c-level');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [criterionName, setCriterionName] = useState('');
  const [criterionWeight, setCriterionWeight] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPrintView, setShowPrintView] = useState(false);

  // Mock data - in real app, this would come from API
  const [criteria, setCriteria] = useState<Record<string, Criterion[]>>({
    'c-level': [
      {
        id: '1',
        name: 'Strategic Leadership & Vision',
        weight: 15,
        questions: [
          { id: 'q1-1', text: 'How do you develop and communicate a long-term vision for the dealership?' },
          { id: 'q1-2', text: 'Describe a time when you had to make a strategic decision that impacted the entire organization.' },
          { id: 'q1-3', text: 'How do you balance short-term operational needs with long-term strategic goals?' },
        ],
        expanded: false,
      },
      {
        id: '2',
        name: 'Financial & Business Acumen',
        weight: 18,
        questions: [
          { id: 'q2-1', text: 'How do you analyze financial statements to make business decisions?' },
          { id: 'q2-2', text: 'Describe your experience with P&L management and budget forecasting.' },
          { id: 'q2-3', text: 'What key metrics do you use to measure operational efficiency?' },
        ],
        expanded: false,
      },
      {
        id: '3',
        name: 'Industry Experience & Dealership Knowledge',
        weight: 15,
        questions: [
          { id: 'q3-1', text: 'What is your understanding of the automotive dealership business model and its key revenue streams?' },
          { id: 'q3-2', text: 'How do you stay current with industry trends and regulatory changes affecting dealerships?' },
          { id: 'q3-3', text: 'Describe your experience managing relationships with manufacturers and vendors.' },
        ],
        expanded: false,
      },
      {
        id: '4',
        name: 'Decision-Making Under Pressure',
        weight: 12,
        questions: [
          { id: 'q4-1', text: 'Tell me about a high-pressure situation where you had to make a critical decision quickly.' },
          { id: 'q4-2', text: 'How do you prioritize competing demands when resources are limited?' },
          { id: 'q4-3', text: 'Describe a time when you had to make an unpopular decision that was necessary for the business.' },
        ],
        expanded: false,
      },
      {
        id: '5',
        name: 'Executive Communication & Influence',
        weight: 10,
        questions: [
          { id: 'q5-1', text: 'How do you communicate complex business strategies to stakeholders at different levels?' },
          { id: 'q5-2', text: 'Describe a time when you had to influence a decision without direct authority.' },
          { id: 'q5-3', text: 'How do you handle difficult conversations with board members or senior executives?' },
        ],
        expanded: false,
      },
      {
        id: '6',
        name: 'Team & Stakeholder Alignment',
        weight: 8,
        questions: [
          { id: 'q6-1', text: 'How do you ensure all departments are aligned with the dealership\'s strategic objectives?' },
          { id: 'q6-2', text: 'Describe your approach to building consensus among diverse stakeholder groups.' },
          { id: 'q6-3', text: 'How do you handle conflicts between different departments or teams?' },
        ],
        expanded: false,
      },
      {
        id: '7',
        name: 'Innovation & Change Management',
        weight: 7,
        questions: [
          { id: 'q7-1', text: 'How do you identify opportunities for innovation in a traditional dealership environment?' },
          { id: 'q7-2', text: 'Describe a significant change initiative you led and how you managed resistance.' },
          { id: 'q7-3', text: 'How do you balance innovation with maintaining proven business practices?' },
        ],
        expanded: false,
      },
      {
        id: '8',
        name: 'Prior Success in Leadership Roles',
        weight: 5,
        questions: [
          { id: 'q8-1', text: 'What is your most significant leadership achievement in your career?' },
          { id: 'q8-2', text: 'How have you measured success in your previous executive roles?' },
          { id: 'q8-3', text: 'Describe a challenging situation you overcame as a leader and what you learned.' },
        ],
        expanded: false,
      },
      {
        id: '9',
        name: 'Negotiation & Vendor/Partner Relations',
        weight: 5,
        questions: [
          { id: 'q9-1', text: 'Describe your experience negotiating major contracts with vendors or partners.' },
          { id: 'q9-2', text: 'How do you maintain strong relationships while ensuring favorable terms for the dealership?' },
          { id: 'q9-3', text: 'Tell me about a time when you had to resolve a dispute with a key vendor or partner.' },
        ],
        expanded: false,
      },
      {
        id: '10',
        name: 'Team Leadership & Coaching',
        weight: 5,
        questions: [
          { id: 'q10-1', text: 'How do you develop and mentor your direct reports to prepare them for leadership roles?' },
          { id: 'q10-2', text: 'Describe your approach to building a high-performing executive team.' },
          { id: 'q10-3', text: 'How do you handle underperformance at the senior management level?' },
        ],
        expanded: false,
      },
    ],
    'mid-level': [
      {
        id: 'm1',
        name: 'Department Management & Operations',
        weight: 20,
        questions: [
          { id: 'mq1-1', text: 'How do you ensure your department meets its monthly and annual targets?' },
          { id: 'mq1-2', text: 'Describe your approach to managing daily operations while focusing on strategic goals.' },
          { id: 'mq1-3', text: 'How do you allocate resources and prioritize tasks within your department?' },
        ],
        expanded: false,
      },
      {
        id: 'm2',
        name: 'Team Leadership & Development',
        weight: 18,
        questions: [
          { id: 'mq2-1', text: 'How do you motivate and engage your team members to achieve their best performance?' },
          { id: 'mq2-2', text: 'Describe your process for identifying and developing talent within your team.' },
          { id: 'mq2-3', text: 'How do you handle conflicts or performance issues within your team?' },
        ],
        expanded: false,
      },
      {
        id: 'm3',
        name: 'Communication & Collaboration',
        weight: 15,
        questions: [
          { id: 'mq3-1', text: 'How do you communicate department goals and expectations to your team?' },
          { id: 'mq3-2', text: 'Describe your approach to collaborating with other department managers.' },
          { id: 'mq3-3', text: 'How do you ensure information flows effectively between your team and upper management?' },
        ],
        expanded: false,
      },
      {
        id: 'm4',
        name: 'Problem-Solving & Decision Making',
        weight: 15,
        questions: [
          { id: 'mq4-1', text: 'Tell me about a complex problem you solved in your department and your approach.' },
          { id: 'mq4-2', text: 'How do you make decisions when you have incomplete information?' },
          { id: 'mq4-3', text: 'Describe a time when you had to make a quick decision that impacted your team.' },
        ],
        expanded: false,
      },
      {
        id: 'm5',
        name: 'Customer Service & Satisfaction',
        weight: 12,
        questions: [
          { id: 'mq5-1', text: 'How do you ensure your department delivers excellent customer service?' },
          { id: 'mq5-2', text: 'Describe how you handle customer complaints or difficult situations.' },
          { id: 'mq5-3', text: 'What metrics do you use to measure customer satisfaction in your department?' },
        ],
        expanded: false,
      },
      {
        id: 'm6',
        name: 'Process Improvement & Efficiency',
        weight: 10,
        questions: [
          { id: 'mq6-1', text: 'How do you identify opportunities to improve processes in your department?' },
          { id: 'mq6-2', text: 'Describe a process improvement you implemented and its impact.' },
          { id: 'mq6-3', text: 'How do you balance efficiency with quality in your department operations?' },
        ],
        expanded: false,
      },
      {
        id: 'm7',
        name: 'Budget & Financial Management',
        weight: 10,
        questions: [
          { id: 'mq7-1', text: 'How do you manage your department budget and control costs?' },
          { id: 'mq7-2', text: 'Describe your experience with forecasting and budget planning.' },
          { id: 'mq7-3', text: 'How do you justify budget requests to upper management?' },
        ],
        expanded: false,
      },
    ],
    'office-staff': [
      {
        id: 'o1',
        name: 'Administrative Skills & Organization',
        weight: 25,
        questions: [
          { id: 'oq1-1', text: 'How do you manage multiple tasks and deadlines in a busy office environment?' },
          { id: 'oq1-2', text: 'Describe your experience with office software and administrative systems.' },
          { id: 'oq1-3', text: 'How do you prioritize your work when everything seems urgent?' },
        ],
        expanded: false,
      },
      {
        id: 'o2',
        name: 'Communication & Customer Service',
        weight: 20,
        questions: [
          { id: 'oq2-1', text: 'How do you handle phone calls and in-person inquiries from customers?' },
          { id: 'oq2-2', text: 'Describe your approach to communicating with colleagues and management.' },
          { id: 'oq2-3', text: 'How do you ensure accuracy when relaying messages or information?' },
        ],
        expanded: false,
      },
      {
        id: 'o3',
        name: 'Attention to Detail & Accuracy',
        weight: 20,
        questions: [
          { id: 'oq3-1', text: 'How do you ensure accuracy when handling paperwork or data entry?' },
          { id: 'oq3-2', text: 'Describe your process for proofreading and checking your work.' },
          { id: 'oq3-3', text: 'What steps do you take to avoid errors in administrative tasks?' },
        ],
        expanded: false,
      },
      {
        id: 'o4',
        name: 'Time Management & Efficiency',
        weight: 15,
        questions: [
          { id: 'oq4-1', text: 'How do you organize your day to maximize productivity?' },
          { id: 'oq4-2', text: 'Describe a time when you had to handle multiple urgent requests simultaneously.' },
          { id: 'oq4-3', text: 'How do you balance routine tasks with unexpected requests or emergencies?' },
        ],
        expanded: false,
      },
      {
        id: 'o5',
        name: 'Problem-Solving & Initiative',
        weight: 10,
        questions: [
          { id: 'oq5-1', text: 'Tell me about a problem you solved independently in an office setting.' },
          { id: 'oq5-2', text: 'How do you handle situations when you don\'t know the answer to a question?' },
          { id: 'oq5-3', text: 'Describe a time when you took initiative to improve a process or procedure.' },
        ],
        expanded: false,
      },
      {
        id: 'o6',
        name: 'Professionalism & Adaptability',
        weight: 10,
        questions: [
          { id: 'oq6-1', text: 'How do you maintain professionalism in stressful or challenging situations?' },
          { id: 'oq6-2', text: 'Describe how you adapt to changes in office procedures or technology.' },
          { id: 'oq6-3', text: 'How do you handle confidential information and maintain discretion?' },
        ],
        expanded: false,
      },
    ],
    'salespeople': [
      {
        id: 's1',
        name: 'Sales Skills & Closing Ability',
        weight: 25,
        questions: [
          { id: 'sq1-1', text: 'Walk me through your sales process from initial contact to closing a deal.' },
          { id: 'sq1-2', text: 'How do you handle objections from potential customers during the sales process?' },
          { id: 'sq1-3', text: 'Describe your approach to building rapport and trust with customers.' },
        ],
        expanded: false,
      },
      {
        id: 's2',
        name: 'Product Knowledge & Automotive Expertise',
        weight: 20,
        questions: [
          { id: 'sq2-1', text: 'How do you stay current with vehicle features, specifications, and industry trends?' },
          { id: 'sq2-2', text: 'How do you match customers with the right vehicle based on their needs and budget?' },
          { id: 'sq2-3', text: 'Describe how you explain technical features to customers in simple terms.' },
        ],
        expanded: false,
      },
      {
        id: 's3',
        name: 'Customer Relationship Management',
        weight: 18,
        questions: [
          { id: 'sq3-1', text: 'How do you maintain relationships with customers after the sale?' },
          { id: 'sq3-2', text: 'Describe your approach to following up with leads and prospects.' },
          { id: 'sq3-3', text: 'How do you handle customers who are not ready to buy immediately?' },
        ],
        expanded: false,
      },
      {
        id: 's4',
        name: 'Negotiation & Deal Structuring',
        weight: 15,
        questions: [
          { id: 'sq4-1', text: 'How do you negotiate pricing while maintaining profitability for the dealership?' },
          { id: 'sq4-2', text: 'Describe your approach to structuring deals that work for both the customer and the dealership.' },
          { id: 'sq4-3', text: 'How do you handle price negotiations when customers compare with other dealerships?' },
        ],
        expanded: false,
      },
      {
        id: 's5',
        name: 'Goal Achievement & Performance',
        weight: 12,
        questions: [
          { id: 'sq5-1', text: 'How do you track and measure your sales performance against targets?' },
          { id: 'sq5-2', text: 'Describe a time when you exceeded your sales goals and what contributed to your success.' },
          { id: 'sq5-3', text: 'How do you stay motivated during slow periods or when facing sales challenges?' },
        ],
        expanded: false,
      },
      {
        id: 's6',
        name: 'Communication & Presentation',
        weight: 10,
        questions: [
          { id: 'sq6-1', text: 'How do you present vehicles to customers in a way that highlights their value?' },
          { id: 'sq6-2', text: 'Describe your approach to active listening and understanding customer needs.' },
          { id: 'sq6-3', text: 'How do you communicate financing options and terms clearly to customers?' },
        ],
        expanded: false,
      },
    ],
    'service-advisors': [
      {
        id: 'sa1',
        name: 'Customer Service & Communication',
        weight: 25,
        questions: [
          { id: 'saq1-1', text: 'How do you explain service recommendations to customers in a clear and understandable way?' },
          { id: 'saq1-2', text: 'Describe your approach to handling customers who are frustrated or upset about their vehicle.' },
          { id: 'saq1-3', text: 'How do you build trust and confidence with customers regarding service work?' },
        ],
        expanded: false,
      },
      {
        id: 'sa2',
        name: 'Service Knowledge & Technical Understanding',
        weight: 22,
        questions: [
          { id: 'saq2-1', text: 'How do you diagnose customer concerns and determine appropriate service recommendations?' },
          { id: 'saq2-2', text: 'Describe your knowledge of vehicle systems and common maintenance requirements.' },
          { id: 'saq2-3', text: 'How do you stay current with new vehicle technologies and service procedures?' },
        ],
        expanded: false,
      },
      {
        id: 'sa3',
        name: 'Work Order Management & Accuracy',
        weight: 18,
        questions: [
          { id: 'saq3-1', text: 'How do you ensure work orders are accurate and complete before service begins?' },
          { id: 'saq3-2', text: 'Describe your process for estimating repair costs and time requirements.' },
          { id: 'saq3-3', text: 'How do you handle situations when additional work is needed beyond the original estimate?' },
        ],
        expanded: false,
      },
      {
        id: 'sa4',
        name: 'Time Management & Scheduling',
        weight: 15,
        questions: [
          { id: 'saq4-1', text: 'How do you manage your schedule to accommodate walk-in customers and appointments?' },
          { id: 'saq4-2', text: 'Describe your approach to coordinating with technicians to ensure timely service completion.' },
          { id: 'saq4-3', text: 'How do you handle scheduling conflicts or delays in service completion?' },
        ],
        expanded: false,
      },
      {
        id: 'sa5',
        name: 'Upselling & Service Recommendations',
        weight: 12,
        questions: [
          { id: 'saq5-1', text: 'How do you identify and recommend additional services that benefit the customer?' },
          { id: 'saq5-2', text: 'Describe your approach to upselling without being pushy or aggressive.' },
          { id: 'saq5-3', text: 'How do you explain the value of preventive maintenance to customers?' },
        ],
        expanded: false,
      },
      {
        id: 'sa6',
        name: 'Problem-Solving & Follow-Up',
        weight: 8,
        questions: [
          { id: 'saq6-1', text: 'How do you handle situations when a customer is not satisfied with service work?' },
          { id: 'saq6-2', text: 'Describe your follow-up process after service is completed.' },
          { id: 'saq6-3', text: 'How do you resolve disputes or misunderstandings about service charges?' },
        ],
        expanded: false,
      },
    ],
    'service-technicians': [
      {
        id: 'st1',
        name: 'Technical Skills & Diagnostic Ability',
        weight: 30,
        questions: [
          { id: 'stq1-1', text: 'How do you approach diagnosing complex vehicle problems systematically?' },
          { id: 'stq1-2', text: 'Describe your experience with diagnostic equipment and tools.' },
          { id: 'stq1-3', text: 'How do you stay current with new vehicle technologies and repair procedures?' },
        ],
        expanded: false,
      },
      {
        id: 'st2',
        name: 'Repair Quality & Attention to Detail',
        weight: 25,
        questions: [
          { id: 'stq2-1', text: 'How do you ensure your repairs meet quality standards and manufacturer specifications?' },
          { id: 'stq2-2', text: 'Describe your process for double-checking your work before returning vehicles to customers.' },
          { id: 'stq2-3', text: 'How do you handle situations when you discover additional issues during a repair?' },
        ],
        expanded: false,
      },
      {
        id: 'st3',
        name: 'Efficiency & Time Management',
        weight: 20,
        questions: [
          { id: 'stq3-1', text: 'How do you balance speed with quality when completing repairs?' },
          { id: 'stq3-2', text: 'Describe your approach to managing multiple repair jobs simultaneously.' },
          { id: 'stq3-3', text: 'How do you estimate repair times accurately for service advisors?' },
        ],
        expanded: false,
      },
      {
        id: 'st4',
        name: 'Safety & Compliance',
        weight: 10,
        questions: [
          { id: 'stq4-1', text: 'How do you ensure safety protocols are followed in the service bay?' },
          { id: 'stq4-2', text: 'Describe your knowledge of environmental regulations for handling fluids and parts.' },
          { id: 'stq4-3', text: 'How do you maintain a clean and organized work area?' },
        ],
        expanded: false,
      },
      {
        id: 'st5',
        name: 'Communication & Documentation',
        weight: 10,
        questions: [
          { id: 'stq5-1', text: 'How do you communicate technical findings and repair recommendations to service advisors?' },
          { id: 'stq5-2', text: 'Describe your approach to documenting work performed and parts used.' },
          { id: 'stq5-3', text: 'How do you explain complex repairs in terms that non-technical staff can understand?' },
        ],
        expanded: false,
      },
      {
        id: 'st6',
        name: 'Problem-Solving & Continuous Learning',
        weight: 5,
        questions: [
          { id: 'stq6-1', text: 'Tell me about a challenging repair you completed and how you solved it.' },
          { id: 'stq6-2', text: 'How do you approach repairs you haven\'t encountered before?' },
          { id: 'stq6-3', text: 'What resources do you use to stay updated on new repair techniques and technologies?' },
        ],
        expanded: false,
      },
    ],
  });

  const currentCriteria = criteria[selectedRole] || [];
  const totalWeight = currentCriteria.reduce((sum, c) => sum + c.weight, 0);
  const isReadyToSave = totalWeight === 100;

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
    setQuestions([]);
    setShowAddModal(true);
  };

  const handleEditCriterion = (criterion: Criterion) => {
    setEditingCriterion(criterion);
    setCriterionName(criterion.name);
    setCriterionWeight(criterion.weight.toString());
    setQuestions(criterion.questions.map(q => ({ ...q })));
    setShowEditModal(true);
  };

  const handleSaveCriterion = () => {
    if (!criterionName.trim() || !criterionWeight) return;

    const weight = parseFloat(criterionWeight);
    if (isNaN(weight) || weight < 0 || weight > 100) return;

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
    } else {
      updatedCriteria[selectedRole] = [...updatedCriteria[selectedRole], newCriterion];
    }

    setCriteria(updatedCriteria);
    resetModal();
  };

  const handleDeleteCriterion = () => {
    if (!editingCriterion) return;

    const updatedCriteria = { ...criteria };
    updatedCriteria[selectedRole] = updatedCriteria[selectedRole].filter(
      c => c.id !== editingCriterion.id
    );
    setCriteria(updatedCriteria);
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

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all criteria for this role?')) {
      const updatedCriteria = { ...criteria };
      updatedCriteria[selectedRole] = [];
      setCriteria(updatedCriteria);
    }
  };

  const handlePreviewPDF = () => {
    if (!isReadyToSave) {
      alert('Total weight must equal 100% before previewing PDF');
      return;
    }
    setShowPrintView(true);
    // Wait for DOM to update, then trigger print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDownloadPDF = () => {
    if (!isReadyToSave) {
      alert('Total weight must equal 100% before downloading PDF');
      return;
    }
    setShowPrintView(true);
    // Wait for DOM to update, then trigger print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Handle print dialog close
  useEffect(() => {
    const handleAfterPrint = () => {
      setShowPrintView(false);
    };
    
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Score Card Editor</h1>
            <p className="text-base" style={{ color: '#6B7280' }}>
              Define and weight your evaluation criteria by role.
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

          {/* Current Role Section */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-1" style={{ color: '#232E40' }}>
                  {selectedRoleData?.name}
                </h2>
                <p className="text-base" style={{ color: '#6B7280' }}>
                  {selectedRoleData?.description}
                </p>
              </div>
              <button
                onClick={handleAddCriterion}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                }}
              >
                + Add Criterion
              </button>
            </div>

            {/* Criteria Table */}
            <div className="rounded-2xl overflow-hidden" style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
            }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#4D6DBE' }}>
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-white">Criterion</th>
                    <th className="text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-white">Weight %</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentCriteria.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                            No criteria added yet
                          </p>
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>
                            Click "Add Criterion" to get started
                          </p>
                        </div>
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
                                    className={`w-5 h-5 transition-transform duration-200 ${criterion.expanded ? 'rotate-90' : ''}`}
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
                          <td className="py-3 px-6">
                            <div className="relative">
                              <button
                                onClick={() => handleEditCriterion(criterion)}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-all duration-200"
                                style={{ color: '#6B7280' }}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {criterion.expanded && criterion.questions.length > 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-3" style={{ backgroundColor: '#F9FAFB' }}>
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

            {/* Total Weight & Status */}
            <div className="mt-4 p-4 rounded-xl" style={{ 
              backgroundColor: isReadyToSave ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${isReadyToSave ? '#D1FAE5' : '#FEE2E2'}`
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold" style={{ color: '#232E40' }}>Total Weight:</span>
                  <span
                    className="px-4 py-1.5 rounded-full text-base font-bold"
                    style={{
                      backgroundColor: isReadyToSave ? '#10B981' : '#EF4444',
                      color: '#FFFFFF',
                    }}
                  >
                    {totalWeight}%
                  </span>
                </div>
                {isReadyToSave && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10B981' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-semibold" style={{ color: '#10B981' }}>
                      Ready to save - total equals 100%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleDownloadPDF}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: '#9333EA',
                  color: '#FFFFFF',
                }}
              >
                Download PDF
              </button>
              <button
                onClick={handlePreviewPDF}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: '#4D6DBE',
                  color: '#FFFFFF',
                }}
              >
                Preview PDF
              </button>
              <button
                disabled={!isReadyToSave}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                }}
              >
                Save Score Card
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-gray-100"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Add Criterion Modal */}
          {showAddModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
              onClick={(e) => {
                if (e.target === e.currentTarget) resetModal();
              }}
            >
              <div
                className="bg-white rounded-2xl overflow-hidden"
                style={{
                  width: '90%',
                  maxWidth: '600px',
                  border: '1px solid #E5E7EB',
                  animation: 'slideUp 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 border-b" style={{ borderColor: '#E5E7EB', borderWidth: '1px', backgroundColor: '#4D6DBE' }}>
                  <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Add Criterion</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-bold mb-2.5" style={{ color: '#232E40' }}>
                      Criterion Name
                    </label>
                    <input
                      type="text"
                      value={criterionName}
                      onChange={(e) => setCriterionName(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        border: '1px solid #D1D5DB',
                        color: '#374151',
                        backgroundColor: '#FFFFFF',
                      }}
                      placeholder="Enter criterion name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2.5" style={{ color: '#232E40' }}>
                      Interview Questions
                    </label>
                    <div className="space-y-3">
                      {questions.map((question) => (
                        <div key={question.id} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                            className="flex-1 px-4 py-3 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                              border: '1px solid #D1D5DB',
                              color: '#374151',
                              backgroundColor: '#FFFFFF',
                            }}
                            placeholder="Enter interview question"
                          />
                          <button
                            onClick={() => handleRemoveQuestion(question.id)}
                            className="p-2.5 hover:bg-gray-100 rounded-lg transition-all"
                            style={{ color: '#000000' }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddQuestion}
                      className="mt-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                      }}
                    >
                      + Add Question
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2.5" style={{ color: '#232E40' }}>
                      Weight (%)
                    </label>
                    <input
                      type="number"
                      value={criterionWeight}
                      onChange={(e) => setCriterionWeight(e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-4 py-3 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        border: '1px solid #D1D5DB',
                        color: '#374151',
                        backgroundColor: '#FFFFFF',
                      }}
                      placeholder="Enter weight percentage"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: '#E5E7EB', borderWidth: '1px' }}>
                  <button
                    onClick={resetModal}
                    className="px-6 py-2.5 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
                    style={{
                      border: '1px solid #E5E7EB',
                      color: '#374151',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCriterion}
                    disabled={!criterionName.trim() || !criterionWeight}
                    className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: '#4D6DBE',
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Criterion Modal */}
          {showEditModal && editingCriterion && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
              onClick={(e) => {
                if (e.target === e.currentTarget) resetModal();
              }}
            >
              <div
                className="bg-white rounded-2xl overflow-hidden"
                style={{
                  width: '90%',
                  maxWidth: '600px',
                  border: '1px solid #E5E7EB',
                  animation: 'slideUp 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 border-b" style={{ borderColor: '#E5E7EB', borderWidth: '1px', backgroundColor: '#4D6DBE' }}>
                  <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Edit Criterion</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-bold mb-2.5" style={{ color: '#232E40' }}>
                      Criterion Name
                    </label>
                    <input
                      type="text"
                      value={criterionName}
                      onChange={(e) => setCriterionName(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        border: '1px solid #D1D5DB',
                        color: '#374151',
                        backgroundColor: '#FFFFFF',
                      }}
                      placeholder="Enter criterion name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2.5" style={{ color: '#232E40' }}>
                      Interview Questions
                    </label>
                    <div className="space-y-3">
                      {questions.map((question) => (
                        <div key={question.id} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                            className="flex-1 px-4 py-3 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                              border: '1px solid #D1D5DB',
                              color: '#374151',
                              backgroundColor: '#FFFFFF',
                            }}
                            placeholder="Enter interview question"
                          />
                          <button
                            onClick={() => handleRemoveQuestion(question.id)}
                            className="p-2.5 hover:bg-gray-100 rounded-lg transition-all"
                            style={{ color: '#000000' }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddQuestion}
                      className="mt-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                      }}
                    >
                      + Add Question
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2.5" style={{ color: '#232E40' }}>
                      Weight (%)
                    </label>
                    <input
                      type="number"
                      value={criterionWeight}
                      onChange={(e) => setCriterionWeight(e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-4 py-3 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        border: '1px solid #D1D5DB',
                        color: '#374151',
                        backgroundColor: '#FFFFFF',
                      }}
                      placeholder="Enter weight percentage"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: '#E5E7EB', borderWidth: '1px' }}>
                  <button
                    onClick={handleDeleteCriterion}
                    className="px-6 py-2.5 text-sm font-semibold rounded-lg transition-all hover:opacity-90"
                    style={{
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                    }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={resetModal}
                    className="px-6 py-2.5 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
                    style={{
                      border: '1px solid #E5E7EB',
                      color: '#374151',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCriterion}
                    disabled={!criterionName.trim() || !criterionWeight}
                    className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: '#4D6DBE',
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Print Layout (Hidden until print) */}
          {showPrintView && (
            <div className="print-wrapper" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'white',
              zIndex: 9999,
              overflowY: 'auto',
              padding: '20px'
            }}>
              <button
                onClick={() => setShowPrintView(false)}
                className="print-back-button"
                style={{
                  position: 'fixed',
                  top: '20px',
                  left: '20px',
                  background: '#4D6DBE',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  zIndex: 10000
                }}
              >
                ← Back to Editor
              </button>
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .print-wrapper {
                    visibility: visible !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background: white !important;
                    overflow: visible !important;
                  }
                  .print-wrapper * {
                    visibility: visible !important;
                  }
                  .print-back-button {
                    display: none !important;
                    visibility: hidden !important;
                  }
                  .print-layout-container {
                    position: relative !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 0.5in !important;
                    background: white !important;
                    top: 0 !important;
                    left: 0 !important;
                  }
                  .print-header {
                    page-break-after: avoid;
                    break-after: avoid;
                  }
                  .candidate-info {
                    page-break-after: avoid;
                    break-after: avoid;
                  }
                  .first-impression-section {
                    page-break-after: avoid;
                    break-after: avoid;
                  }
                }
                .print-layout-container {
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  line-height: 1.2;
                  color: #000;
                  background: white;
                  padding: 20px;
                  width: 100%;
                  max-width: 100%;
                  margin: 0;
                }
                @media print {
                  .print-layout-container {
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 0.5in !important;
                    margin: 0 !important;
                    box-sizing: border-box !important;
                  }
                }
                .print-header {
                  text-align: center;
                  margin-bottom: 15px;
                  border-bottom: 2px solid #000;
                  padding-bottom: 8px;
                }
                .print-header h1 {
                  font-size: 16px;
                  font-weight: bold;
                  margin-bottom: 3px;
                }
                .print-header h2 {
                  font-size: 12px;
                  font-weight: normal;
                }
                .candidate-info {
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 15px;
                  padding: 8px;
                  border: 1px solid #000;
                  font-size: 9px;
                }
                .info-field {
                  display: flex;
                  align-items: center;
                }
                .info-field label {
                  font-weight: bold;
                  min-width: 60px;
                  margin-right: 5px;
                  font-size: 8px;
                }
                .info-field .line {
                  flex: 1;
                  border-bottom: 1px solid #000;
                  height: 15px;
                }
                .first-impression-section {
                  border: 1px solid #000;
                  padding: 8px;
                  margin-bottom: 15px;
                  background: #f9f9f9;
                }
                .first-impression-header {
                  font-size: 11px;
                  font-weight: bold;
                  text-align: center;
                  margin-bottom: 8px;
                  text-transform: uppercase;
                }
                .first-impression-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                }
                .impression-item {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  font-size: 9px;
                  gap: 6px;
                }
                .impression-options {
                  display: flex;
                  justify-content: center;
                  gap: 12px;
                  margin-top: 4px;
                }
                .impression-option {
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  font-size: 8px;
                  font-weight: 600;
                }
                .impression-checkbox {
                  width: 12px;
                  height: 12px;
                  border: 2px solid #000;
                  background: white;
                  border-radius: 2px;
                }
                .criteria-grid {
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                  margin-bottom: 15px;
                }
                .criterion-section {
                  border: 1px solid #000;
                  page-break-inside: avoid;
                  break-inside: avoid;
                  margin-bottom: 8px;
                }
                .criterion-header {
                  background: #f0f0f0;
                  padding: 4px 8px;
                  font-weight: bold;
                  font-size: 10px;
                  border-bottom: 1px solid #000;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  page-break-after: avoid;
                  break-after: avoid;
                }
                .criterion-content {
                  display: grid;
                  grid-template-columns: 2fr 0.8fr 1fr;
                  gap: 8px;
                  padding: 6px 8px;
                  align-items: start;
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
                .questions-column {
                  border-right: 1px solid #ccc;
                  padding-right: 6px;
                }
                .questions-list {
                  font-size: 8px;
                  line-height: 1.3;
                }
                .question-item {
                  margin-bottom: 4px;
                  padding: 2px 0;
                  border-bottom: 1px dotted #ccc;
                  display: flex;
                  align-items: flex-start;
                  gap: 4px;
                  orphans: 2;
                  widows: 2;
                }
                .question-item:last-child {
                  border-bottom: none;
                  margin-bottom: 0;
                }
                .question-checkbox {
                  width: 10px;
                  height: 10px;
                  border: 1px solid #000;
                  background: white;
                  margin-top: 1px;
                  flex-shrink: 0;
                }
                .question-text {
                  flex: 1;
                  font-size: 8px;
                  line-height: 1.3;
                }
                .score-column {
                  text-align: center;
                  border-right: 1px solid #ccc;
                  padding: 0 8px;
                }
                .score-label {
                  font-size: 8px;
                  font-weight: bold;
                  margin-bottom: 4px;
                }
                .score-box {
                  width: 25px;
                  height: 20px;
                  border: 1px solid #000;
                  background: white;
                  margin: 0 auto;
                }
                .notes-column {
                  padding-left: 6px;
                }
                .notes-label {
                  font-size: 8px;
                  font-weight: bold;
                  margin-bottom: 4px;
                }
                .notes-lines {
                  display: flex;
                  flex-direction: column;
                  gap: 2px;
                }
                .notes-line {
                  height: 12px;
                  border-bottom: 1px solid #ccc;
                }
                .criterion-weight {
                  font-size: 9px;
                }
                .final-comments-section {
                  border: 2px solid #000;
                  padding: 10px;
                  margin-top: 10px;
                }
                .final-comments-header {
                  font-size: 12px;
                  font-weight: bold;
                  margin-bottom: 15px;
                  text-align: center;
                }
                .recommendation-section {
                  margin-bottom: 15px;
                }
                .recommendation-label {
                  font-size: 9px;
                  font-weight: bold;
                  margin-bottom: 4px;
                }
                .recommendation-options {
                  display: flex;
                  gap: 20px;
                  font-size: 8px;
                }
                .recommendation-option {
                  display: flex;
                  align-items: center;
                  gap: 3px;
                }
                .recommendation-checkbox {
                  width: 12px;
                  height: 12px;
                  border: 1px solid #000;
                  background: white;
                }
                .comments-section {
                  margin-top: 10px;
                }
                .comments-label {
                  font-size: 9px;
                  font-weight: bold;
                  margin-bottom: 3px;
                }
                .comments-lines {
                  display: flex;
                  flex-direction: column;
                  gap: 1px;
                }
                .comments-line {
                  height: 12px;
                  border-bottom: 1px solid #ccc;
                }
              `}} />
              <div className="print-layout-container" style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                lineHeight: 1.2,
                color: '#000',
                background: 'white',
                padding: '20px',
                maxWidth: '8.5in',
                margin: '0 auto'
              }}>
                <div className="print-header" style={{
                  textAlign: 'center',
                  marginBottom: '15px',
                  borderBottom: '2px solid #000',
                  paddingBottom: '8px'
                }}>
                  <h1 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '3px' }}>INTERVIEW SCORECARD</h1>
                  <h2 style={{ fontSize: '12px', fontWeight: 'normal' }}>{selectedRoleData?.name} Evaluation</h2>
                </div>

                <div className="candidate-info" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '15px',
                  marginBottom: '15px',
                  padding: '8px',
                  border: '1px solid #000',
                  fontSize: '9px'
                }}>
                  <div className="info-field" style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Candidate:</label>
                    <div className="line" style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                  </div>
                  <div className="info-field" style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Position:</label>
                    <div className="line" style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                  </div>
                  <div className="info-field" style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Date:</label>
                    <div className="line" style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                  </div>
                  <div className="info-field" style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Interviewer:</label>
                    <div className="line" style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                  </div>
                  <div className="info-field" style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Time:</label>
                    <div className="line" style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                  </div>
                  <div className="info-field" style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Interview Stage:</label>
                    <div className="line" style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                  </div>
                </div>

                <div className="first-impression-section" style={{
                  border: '1px solid #000',
                  padding: '8px',
                  marginBottom: '15px',
                  background: '#f9f9f9'
                }}>
                  <div className="first-impression-header" style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                  }}>First Impression Evaluation</div>
                  <div className="first-impression-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px'
                  }}>
                    <div className="impression-item" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      fontSize: '9px',
                      gap: '6px'
                    }}>
                      <span>Professional Attire:</span>
                      <div className="impression-options" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '12px',
                        marginTop: '4px'
                      }}>
                        <div className="impression-option" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '8px',
                          fontWeight: 600
                        }}>
                          <div className="impression-checkbox" style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #000',
                            background: 'white',
                            borderRadius: '2px'
                          }}></div>
                          <span>Yes</span>
                        </div>
                        <div className="impression-option" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '8px',
                          fontWeight: 600
                        }}>
                          <div className="impression-checkbox" style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #000',
                            background: 'white',
                            borderRadius: '2px'
                          }}></div>
                          <span>No</span>
                        </div>
                      </div>
                    </div>
                    <div className="impression-item" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      fontSize: '9px',
                      gap: '6px'
                    }}>
                      <span>Punctuality:</span>
                      <div className="impression-options" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '12px',
                        marginTop: '4px'
                      }}>
                        <div className="impression-option" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '8px',
                          fontWeight: 600
                        }}>
                          <div className="impression-checkbox" style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #000',
                            background: 'white',
                            borderRadius: '2px'
                          }}></div>
                          <span>Yes</span>
                        </div>
                        <div className="impression-option" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '8px',
                          fontWeight: 600
                        }}>
                          <div className="impression-checkbox" style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #000',
                            background: 'white',
                            borderRadius: '2px'
                          }}></div>
                          <span>No</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="criteria-grid" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  {currentCriteria.map((criterion) => (
                    <div key={criterion.id} className="criterion-section" style={{
                      border: '1px solid #000',
                      pageBreakInside: 'avoid',
                      marginBottom: '8px'
                    }}>
                      <div className="criterion-header" style={{
                        background: '#f0f0f0',
                        padding: '4px 8px',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        borderBottom: '1px solid #000',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{criterion.name}</span>
                        <span className="criterion-weight" style={{ fontSize: '9px' }}>Weight: {criterion.weight}%</span>
                      </div>
                      <div className="criterion-content" style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 0.8fr 1fr',
                        gap: '8px',
                        padding: '6px 8px',
                        alignItems: 'start'
                      }}>
                        <div className="questions-column" style={{
                          borderRight: '1px solid #ccc',
                          paddingRight: '6px'
                        }}>
                          <div className="questions-list" style={{
                            fontSize: '8px',
                            lineHeight: 1.3
                          }}>
                            {criterion.questions.length > 0 ? (
                              criterion.questions.map((question) => (
                                <div key={question.id} className="question-item" style={{
                                  marginBottom: '4px',
                                  padding: '2px 0',
                                  borderBottom: '1px dotted #ccc',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '4px'
                                }}>
                                  <div className="question-checkbox" style={{
                                    width: '10px',
                                    height: '10px',
                                    border: '1px solid #000',
                                    background: 'white',
                                    marginTop: '1px',
                                    flexShrink: 0
                                  }}></div>
                                  <div className="question-text" style={{
                                    flex: 1,
                                    fontSize: '8px',
                                    lineHeight: 1.3
                                  }}>{question.text}</div>
                                </div>
                              ))
                            ) : (
                              <div className="question-item" style={{
                                marginBottom: '4px',
                                padding: '2px 0',
                                borderBottom: '1px dotted #ccc',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '4px'
                              }}>
                                <div className="question-checkbox" style={{
                                  width: '10px',
                                  height: '10px',
                                  border: '1px solid #000',
                                  background: 'white',
                                  marginTop: '1px',
                                  flexShrink: 0
                                }}></div>
                                <div className="question-text" style={{
                                  flex: 1,
                                  fontSize: '8px',
                                  lineHeight: 1.3
                                }}>No questions defined</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="score-column" style={{
                          textAlign: 'center',
                          borderRight: '1px solid #ccc',
                          padding: '0 8px'
                        }}>
                          <div className="score-label" style={{
                            fontSize: '8px',
                            fontWeight: 'bold',
                            marginBottom: '4px'
                          }}>Score (1-10)</div>
                          <div className="score-box" style={{
                            width: '25px',
                            height: '20px',
                            border: '1px solid #000',
                            background: 'white',
                            margin: '0 auto'
                          }}></div>
                        </div>
                        <div className="notes-column" style={{
                          paddingLeft: '6px'
                        }}>
                          <div className="notes-label" style={{
                            fontSize: '8px',
                            fontWeight: 'bold',
                            marginBottom: '4px'
                          }}>Notes</div>
                          <div className="notes-lines" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="notes-line" style={{
                                height: '12px',
                                borderBottom: '1px solid #ccc'
                              }}></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="final-comments-section" style={{
                  border: '2px solid #000',
                  padding: '10px',
                  marginTop: '10px'
                }}>
                  <div className="final-comments-header" style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    textAlign: 'center'
                  }}>INTERVIEW OUTCOME</div>
                  <div className="recommendation-section" style={{
                    marginBottom: '15px'
                  }}>
                    <div className="recommendation-label" style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}>Recommendation:</div>
                    <div className="recommendation-options" style={{
                      display: 'flex',
                      gap: '20px',
                      fontSize: '8px'
                    }}>
                      <div className="recommendation-option" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <div className="recommendation-checkbox" style={{
                          width: '12px',
                          height: '12px',
                          border: '1px solid #000',
                          background: 'white'
                        }}></div>
                        <span>Hire</span>
                      </div>
                      <div className="recommendation-option" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <div className="recommendation-checkbox" style={{
                          width: '12px',
                          height: '12px',
                          border: '1px solid #000',
                          background: 'white'
                        }}></div>
                        <span>Next Stage</span>
                      </div>
                      <div className="recommendation-option" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <div className="recommendation-checkbox" style={{
                          width: '12px',
                          height: '12px',
                          border: '1px solid #000',
                          background: 'white'
                        }}></div>
                        <span>No Hire</span>
                      </div>
                    </div>
                  </div>
                  <div className="comments-section" style={{
                    marginTop: '10px'
                  }}>
                    <div className="comments-label" style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      marginBottom: '3px'
                    }}>Comments & Next Steps:</div>
                    <div className="comments-lines" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1px'
                    }}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="comments-line" style={{
                          height: '12px',
                          borderBottom: '1px solid #ccc'
                        }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </RequireAuth>
  );
}
