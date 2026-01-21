'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

// Modern color palette - matching surveys page
const COLORS = {
  primary: '#3B5998',
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

const roles = [
  { id: 'c-level', name: 'C-Level Executives', description: 'Dealer Principal, CFO, COO, General Manager' },
  { id: 'mid-level', name: 'Mid-Level Managers', description: 'Department Managers, Sales Managers, Service Managers' },
  { id: 'office-staff', name: 'Office Staff', description: 'Administrative, Reception, Office Support' },
  { id: 'salespeople', name: 'Salespeople', description: 'Sales Representatives, Sales Consultants' },
  { id: 'service-advisors', name: 'Service Advisors', description: 'Service Advisors, Service Writers' },
  { id: 'service-technicians', name: 'Service Technicians', description: 'Service Technicians, Mechanics' },
];

// Full criteria data with questions - same as Score Card Editor
const criteriaData: Record<string, Criterion[]> = {
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
    },
  ],
};

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  status: string;
  score?: number | null;
};

type Manager = {
  id: number;
  email: string;
  full_name?: string | null;
  role: string;
};

export default function ScoreCandidatePage() {
  const [selectedRole, setSelectedRole] = useState('mid-level');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  const [showPrintView, setShowPrintView] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentCriteria = criteriaData[selectedRole] || [];
  const selectedRoleData = roles.find(r => r.id === selectedRole);

  // Load candidates and managers on mount
  useEffect(() => {
    loadCandidates();
    loadManagers();
  }, []);

  async function loadCandidates() {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCandidates(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    }
  }

  async function loadManagers() {
    try {
      const token = getToken();
      if (!token) return;

      // Try to get managers from admin endpoint
      const res = await fetch(`${API_BASE}/admin/managers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Combine approved and pending managers
        const allManagers = [
          ...(data.managers || []),
          ...(data.pending || [])
        ];
        setManagers(allManagers);
      } else {
        // If not admin, try to get current user as manager
        const userRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json().catch(() => ({}));
        if (userRes.ok && (userData.role === 'manager' || userData.role === 'hiring_manager')) {
          setManagers([{
            id: userData.id || 0,
            email: userData.email || '',
            full_name: userData.full_name || null,
            role: userData.role || 'manager'
          }]);
        }
      }
    } catch (err) {
      console.error('Failed to load managers:', err);
    }
  }

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

  const handleSubmit = async () => {
    if (!selectedCandidate) {
      toast.error('Please select a candidate');
      return;
    }

    if (!selectedManager) {
      toast.error('Please select a hiring manager');
      return;
    }

    if (!selectedStage) {
      toast.error('Please select an interview stage');
      return;
    }

    // Check if at least one score is entered
    const hasScores = Object.keys(scores).some(key => scores[key] > 0);
    if (!hasScores) {
      toast.error('Please enter at least one score');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Not logged in');
        return;
      }

      // Convert total weighted score (0-10 scale) to 0-100 scale
      const scoreOutOf100 = Math.round(totalWeighted * 10);

      // Get candidate and manager info
      const candidate = candidates.find(c => c.id.toString() === selectedCandidate);
      const manager = managers.find(m => m.id.toString() === selectedManager);

      // Create notes with interview details
      const interviewNotes = `Interview Stage: ${selectedStage}\nHiring Manager: ${manager?.full_name || manager?.email || 'Unknown'}\nRole: ${selectedRoleData?.name || selectedRole}\n\nScores:\n${currentCriteria.map(c => {
        const score = scores[c.id] || 0;
        const weighted = calculateWeighted(c.id);
        return `${c.name}: ${score}/10 (Weighted: ${weighted.toFixed(2)})`;
      }).join('\n')}\n\nTotal Weighted Score: ${totalWeighted.toFixed(2)}/10 (${scoreOutOf100}/100)`;

      // Update candidate with score and notes
      const res = await fetch(`${API_BASE}/candidates/${selectedCandidate}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: scoreOutOf100,
          notes: interviewNotes,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit scores');
      }

      toast.success('Scores submitted successfully!');
      
      // Reset form
      setScores({});
      setSelectedCandidate('');
      setSelectedManager('');
      setSelectedStage('');
      
      // Reload candidates to get updated score
      await loadCandidates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit scores';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all scores?')) {
      setScores({});
      setSelectedCandidate('');
      setSelectedManager('');
      setSelectedStage('');
    }
  };

  const handlePreviewPDF = () => {
    setShowPrintView(true);
  };

  const handlePrint = () => {
    window.print();
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

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
        <HubSidebar />
        <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Score a Candidate</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Select candidate and enter in raw scores for the following role.
                </p>
              </div>
            </div>
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
          {(() => {
            const selectedCandidateObj = candidates.find(c => c.id.toString() === selectedCandidate);
            if (selectedCandidate && selectedCandidateObj && selectedCandidateObj.score !== null && selectedCandidateObj.score !== undefined) {
              return (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
                  <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                    Existing Score: {selectedCandidateObj.score}/100
                  </p>
                  <p className="text-xs" style={{ color: '#78350F' }}>
                    Entering new scores will update this candidate's score.
                  </p>
                </div>
              );
            }
            return null;
          })()}
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
                disabled={loading}
              >
                <option value="">Please choose...</option>
                {candidates.map(candidate => (
                  <option key={candidate.id} value={candidate.id.toString()}>
                    {candidate.name} - {candidate.position} {candidate.score !== null && candidate.score !== undefined ? `(Score: ${candidate.score})` : ''}
                  </option>
                ))}
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
                disabled={loading}
              >
                <option value="">Please choose...</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id.toString()}>
                    {manager.full_name || manager.email} ({manager.role})
                  </option>
                ))}
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

          {/* Print Scorecard Banner */}
          <div className="mt-4 mb-4 p-4 rounded-xl flex items-center justify-between" style={{ 
            backgroundColor: '#EEF2FF', 
            border: '1px solid #C7D2FE' 
          }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#4D6DBE' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#232E40' }}>Need a printable scorecard?</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Print the interview scorecard to use during in-person interviews</p>
              </div>
            </div>
            <button
              onClick={handlePreviewPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{
                backgroundColor: '#4D6DBE',
                color: '#FFFFFF',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Scorecard
            </button>
          </div>

          {/* Total Weight & Action Buttons */}
          <div className="flex items-center justify-between">
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
                disabled={!selectedCandidate || !selectedManager || !selectedStage || submitting}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </main>

        {/* Print View - Same as Score Card Editor */}
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
            <div className="print-buttons" style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              display: 'flex',
              gap: '10px',
              zIndex: 10000
            }}>
              <button
                onClick={() => setShowPrintView(false)}
                className="print-back-button"
                style={{
                  background: '#4D6DBE',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                ← Back
              </button>
              <button
                onClick={handlePrint}
                className="print-back-button"
                style={{
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Print
              </button>
            </div>
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
                .print-back-button,
                .print-buttons {
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
                .criterion-section {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
              }
            `}} />
            <div className="print-layout-container" style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '10px',
              lineHeight: 1.2,
              color: '#000',
              background: 'white',
              padding: '60px 40px 40px',
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Candidate:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Position:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Date:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Interviewer:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '60px', marginRight: '5px', fontSize: '8px' }}>Time:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '70px', marginRight: '5px', fontSize: '8px' }}>Interview Stage:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
              </div>

              <div className="first-impression-section" style={{
                border: '1px solid #000',
                padding: '8px',
                marginBottom: '15px',
                background: '#f9f9f9'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>First Impression Evaluation</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '9px', gap: '6px' }}>
                    <span>Professional Attire:</span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', fontWeight: 600 }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid #000', background: 'white', borderRadius: '2px' }}></div>
                        <span>Yes</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', fontWeight: 600 }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid #000', background: 'white', borderRadius: '2px' }}></div>
                        <span>No</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '9px', gap: '6px' }}>
                    <span>Punctuality:</span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', fontWeight: 600 }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid #000', background: 'white', borderRadius: '2px' }}></div>
                        <span>Yes</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', fontWeight: 600 }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid #000', background: 'white', borderRadius: '2px' }}></div>
                        <span>No</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                {currentCriteria.map((criterion) => (
                  <div key={criterion.id} className="criterion-section" style={{
                    border: '1px solid #000',
                    marginBottom: '8px'
                  }}>
                    <div style={{
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
                      <span style={{ fontSize: '9px' }}>Weight: {criterion.weight}%</span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 0.8fr 1fr',
                      gap: '8px',
                      padding: '6px 8px',
                      alignItems: 'start'
                    }}>
                      <div style={{ borderRight: '1px solid #ccc', paddingRight: '6px' }}>
                        <div style={{ fontSize: '8px', lineHeight: 1.3 }}>
                          {criterion.questions.length > 0 ? (
                            criterion.questions.map((question) => (
                              <div key={question.id} style={{
                                marginBottom: '4px',
                                padding: '2px 0',
                                borderBottom: '1px dotted #ccc',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '4px'
                              }}>
                                <div style={{
                                  width: '10px',
                                  height: '10px',
                                  border: '1px solid #000',
                                  background: 'white',
                                  marginTop: '1px',
                                  flexShrink: 0
                                }}></div>
                                <div style={{ flex: 1, fontSize: '8px', lineHeight: 1.3 }}>{question.text}</div>
                              </div>
                            ))
                          ) : (
                            <div style={{
                              marginBottom: '4px',
                              padding: '2px 0',
                              borderBottom: '1px dotted #ccc',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '4px'
                            }}>
                              <div style={{
                                width: '10px',
                                height: '10px',
                                border: '1px solid #000',
                                background: 'white',
                                marginTop: '1px',
                                flexShrink: 0
                              }}></div>
                              <div style={{ flex: 1, fontSize: '8px', lineHeight: 1.3 }}>No questions defined</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', borderRight: '1px solid #ccc', padding: '0 8px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '4px' }}>Score (1-10)</div>
                        <div style={{ width: '25px', height: '20px', border: '1px solid #000', background: 'white', margin: '0 auto' }}></div>
                      </div>
                      <div style={{ paddingLeft: '6px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '4px' }}>Notes</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} style={{ height: '12px', borderBottom: '1px solid #ccc' }}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ border: '2px solid #000', padding: '10px', marginTop: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>INTERVIEW OUTCOME</div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>Recommendation:</div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <div style={{ width: '12px', height: '12px', border: '1px solid #000', background: 'white' }}></div>
                      <span>Hire</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <div style={{ width: '12px', height: '12px', border: '1px solid #000', background: 'white' }}></div>
                      <span>Next Stage</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <div style={{ width: '12px', height: '12px', border: '1px solid #000', background: 'white' }}></div>
                      <span>No Hire</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '3px' }}>Comments & Next Steps:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ height: '12px', borderBottom: '1px solid #ccc' }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
