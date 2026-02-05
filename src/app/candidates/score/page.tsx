'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

// Modern color palette - matching surveys page
const COLORS = {
  primary: '#3B5998',
  primaryLight: '#4D6DBE',
  secondary: '#10B981',
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

// Roles from the PDF assessment tools
const roles = [
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

// Full criteria data with questions - populated from Score Card Editor or PDFs
// This will be dynamically loaded from the scorecard editor or API
const criteriaData: Record<string, Criterion[]> = {
  'c-level-manager': [
    {
      id: 'clm1',
      name: 'Strategic Vision & Planning',
      weight: 12,
      questions: [
        { id: 'clm1-q1', text: 'Does the candidate demonstrate ability to develop and execute long-term strategic plans that drive organizational growth?' },
        { id: 'clm1-q2', text: 'Evidence/KPIs: Strategic initiatives led | Business growth achieved | Market expansion examples' },
      ],
    },
    {
      id: 'clm2',
      name: 'Financial Acumen',
      weight: 10,
      questions: [
        { id: 'clm2-q1', text: 'How strong is the candidate\'s understanding of financial statements, budgeting, and P&L management?' },
        { id: 'clm2-q2', text: 'Evidence/KPIs: P&L responsibility size | Budget management experience | Financial improvements achieved' },
      ],
    },
    {
      id: 'clm3',
      name: 'Industry Knowledge & Market Awareness',
      weight: 8,
      questions: [
        { id: 'clm3-q1', text: 'Does the candidate demonstrate deep understanding of automotive retail trends, competitive landscape, and market dynamics?' },
        { id: 'clm3-q2', text: 'Evidence/KPIs: Industry experience years | OEM relationships | Market analysis capabilities' },
      ],
    },
    {
      id: 'clm4',
      name: 'Executive Presence & Influence',
      weight: 10,
      questions: [
        { id: 'clm4-q1', text: 'Does the candidate project executive presence and ability to influence stakeholders at all levels?' },
      ],
    },
    {
      id: 'clm5',
      name: 'Organizational Development',
      weight: 10,
      questions: [
        { id: 'clm5-q1', text: 'What is the candidate\'s track record in building high-performing teams and developing organizational capabilities?' },
        { id: 'clm5-q2', text: 'Evidence/KPIs: Organizations built/transformed | Talent development programs | Succession planning experience' },
      ],
    },
    {
      id: 'clm6',
      name: 'Change Management',
      weight: 8,
      questions: [
        { id: 'clm6-q1', text: 'How effectively has the candidate led major organizational changes or transformations?' },
        { id: 'clm6-q2', text: 'Evidence/KPIs: Change initiatives led | Transformation outcomes | Stakeholder management' },
      ],
    },
    {
      id: 'clm7',
      name: 'Compliance & Ethics',
      weight: 8,
      questions: [
        { id: 'clm7-q1', text: 'Does the candidate demonstrate strong commitment to compliance, ethics, and corporate governance?' },
        { id: 'clm7-q2', text: 'Evidence/KPIs: Compliance programs implemented | Ethics initiatives | Regulatory experience' },
      ],
    },
    {
      id: 'clm8',
      name: 'Risk Management',
      weight: 6,
      questions: [
        { id: 'clm8-q1', text: 'How effectively does the candidate identify, assess, and mitigate business risks?' },
        { id: 'clm8-q2', text: 'Evidence/KPIs: Risk management frameworks used | Crisis management experience' },
      ],
    },
    {
      id: 'clm9',
      name: 'Board & Owner Relations',
      weight: 6,
      questions: [
        { id: 'clm9-q1', text: 'How effectively can the candidate communicate with and advise ownership/board members?' },
        { id: 'clm9-q2', text: 'Evidence/KPIs: Board presentation experience | Owner relationship management' },
      ],
    },
    {
      id: 'clm10',
      name: 'External Relationships',
      weight: 6,
      questions: [
        { id: 'clm10-q1', text: 'What is the candidate\'s ability to build relationships with OEMs, lenders, vendors, and community stakeholders?' },
        { id: 'clm10-q2', text: 'Evidence/KPIs: Key relationships built | Partnership examples | Community involvement' },
      ],
    },
    {
      id: 'clm11',
      name: 'Primary Residence Distance',
      weight: 5,
      questions: [
        { id: 'clm11-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'clm11-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time | Relocation plans if applicable' },
      ],
    },
    {
      id: 'clm12',
      name: 'References',
      weight: 6,
      questions: [
        { id: 'clm12-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'clm12-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'clm13',
      name: 'Dealership Culture Alignment',
      weight: 5,
      questions: [
        { id: 'clm13-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'clm13-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'gm': [
    {
      id: 'gm1',
      name: 'Target Achievement',
      weight: 12,
      questions: [
        { id: 'gm1-q1', text: 'To what extent does the manager consistently meet or exceed the key financial and operational targets set by ownership (e.g., net profit, F&I penetration, CSI) and those mandated by the manufacturer (e.g., sales volume, CPO targets, service absorption)?' },
        { id: 'gm1-q2', text: 'KPI Evidence: YTD Net Profit $ / % vs budget | Sales volume vs objective | F&I PVR & penetration | Service absorption % | CSI/SSI trend (6-12 mo)' },
      ],
    },
    {
      id: 'gm2',
      name: 'Strategic Planning',
      weight: 8,
      questions: [
        { id: 'gm2-q1', text: 'How effectively does the manager develop and execute departmental and store-wide business plans that proactively address market challenges and capitalize on opportunities to drive profitability?' },
        { id: 'gm2-q2', text: 'KPI Evidence: Market share trend | New initiative ROI | Competitive positioning' },
      ],
    },
    {
      id: 'gm3',
      name: 'Talent Management',
      weight: 8,
      questions: [
        { id: 'gm3-q1', text: 'Evaluate the manager\'s effectiveness in recruiting, onboarding, developing, and retaining high-performing personnel across all departments. (Consider turnover rates, promotion from within, and team morale indicators).' },
        { id: 'gm3-q2', text: 'KPI Evidence: Turnover rate by dept | Internal promotions | Training completion % | Employee satisfaction scores' },
      ],
    },
    {
      id: 'gm4',
      name: 'Leadership Influence',
      weight: 8,
      questions: [
        { id: 'gm4-q1', text: 'Describe the manager\'s ability to inspire, motivate, and hold teams accountable. Does their leadership style cultivate a culture of high performance, collaboration, and accountability?' },
      ],
    },
    {
      id: 'gm5',
      name: 'Succession Planning',
      weight: 5,
      questions: [
        { id: 'gm5-q1', text: 'What evidence is there that the manager is actively identifying and developing future leaders within the dealership to ensure continuity and growth?' },
        { id: 'gm5-q2', text: 'KPI Evidence: # of identified successors | Development plans in place | Cross-training initiatives' },
      ],
    },
    {
      id: 'gm6',
      name: 'Process Adherence & Improvement',
      weight: 8,
      questions: [
        { id: 'gm6-q1', text: 'How well are established policies and procedures understood, implemented, and consistently followed across all departments? Provide examples of how the manager has streamlined or improved processes.' },
        { id: 'gm6-q2', text: 'KPI Evidence: Process audit scores | Efficiency improvements documented' },
      ],
    },
    {
      id: 'gm7',
      name: 'Problem Resolution',
      weight: 8,
      questions: [
        { id: 'gm7-q1', text: 'Assess the manager\'s skill in diagnosing root causes of complex operational, customer, or personnel issues and implementing effective, sustainable solutions. (Ask for a specific example).' },
      ],
    },
    {
      id: 'gm8',
      name: 'Communication',
      weight: 8,
      questions: [
        { id: 'gm8-q1', text: 'How effectively does the manager communicate strategic goals, provide clear direction, and give constructive feedback to their staff? How transparent and effective is their communication with senior leadership/ownership?' },
      ],
    },
    {
      id: 'gm9',
      name: 'Ownership & Engagement',
      weight: 8,
      questions: [
        { id: 'gm9-q1', text: 'To what degree does the manager demonstrate full ownership of the dealership\'s results? Provide examples of them taking initiative, making data-driven decisions, and going beyond basic responsibilities to drive the business forward.' },
      ],
    },
    {
      id: 'gm10',
      name: 'Value & Culture Impact',
      weight: 5,
      questions: [
        { id: 'gm10-q1', text: 'Beyond core responsibilities, what specific, tangible impact has the manager had on the dealership\'s culture, reputation, or long-term strategic value? (e.g., improving community relations, implementing training programs, fostering exceptional employee engagement that reduced turnover).' },
        { id: 'gm10-q2', text: 'KPI Evidence: Google/Yelp rating trend | Community involvement | Employee engagement scores' },
      ],
    },
    {
      id: 'gm11',
      name: 'Compliance, Controls & Risk Management',
      weight: 5,
      questions: [
        { id: 'gm11-q1', text: 'How effectively does the GM maintain compliance (OEM standards, F&I/legal requirements, HR policies, safety regulations) and implement controls that prevent losses and reputational risk? Include audit readiness, cash controls, and advertising compliance.' },
        { id: 'gm11-q2', text: 'KPI Evidence: Audit findings/resolutions | Compliance training completion | Open legal/HR issues | Cash control variances' },
      ],
    },
    {
      id: 'gm12',
      name: 'Primary Residence Distance',
      weight: 5,
      questions: [
        { id: 'gm12-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership? Consider commute time, reliability, availability for emergencies, and long-term sustainability of the commute.' },
        { id: 'gm12-q2', text: 'KPI Evidence: Distance in miles | Estimated commute time | Relocation plans if applicable' },
      ],
    },
    {
      id: 'gm13',
      name: 'References',
      weight: 5,
      questions: [
        { id: 'gm13-q1', text: 'Are the candidate\'s professional references excellent? Consider the quality and relevance of references, consistency of feedback, specific examples provided, and any concerns or reservations expressed.' },
        { id: 'gm13-q2', text: 'KPI Evidence: # of references contacted | Reference quality (former supervisors, peers, direct reports) | Key themes from feedback' },
      ],
    },
    {
      id: 'gm14',
      name: 'Dealership Culture Alignment',
      weight: 7,
      questions: [
        { id: 'gm14-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business? Consider their attitude, work ethic, interpersonal style, and how well they would fit with the existing team and organizational values.' },
        { id: 'gm14-q2', text: 'KPI Evidence: Cultural fit observations from interviews | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'sales-manager': [
    {
      id: 'sm1',
      name: 'Sales Volume & Target Achievement',
      weight: 12,
      questions: [
        { id: 'sm1-q1', text: 'What is the candidate\'s track record in achieving and exceeding sales volume targets?' },
        { id: 'sm1-q2', text: 'Evidence/KPIs: Units sold vs target | Market share | YoY growth achieved' },
      ],
    },
    {
      id: 'sm2',
      name: 'Gross Profit Performance',
      weight: 10,
      questions: [
        { id: 'sm2-q1', text: 'How effectively does the candidate maximize front-end and back-end gross profit?' },
        { id: 'sm2-q2', text: 'Evidence/KPIs: Front gross per unit | Total gross per unit | Holdback/incentive capture' },
      ],
    },
    {
      id: 'sm3',
      name: 'Inventory Management',
      weight: 8,
      questions: [
        { id: 'sm3-q1', text: 'Does the candidate demonstrate ability to manage inventory levels, aging, and turn rates?' },
        { id: 'sm3-q2', text: 'Evidence/KPIs: Days supply managed | Aged inventory % | Turn rate' },
      ],
    },
    {
      id: 'sm4',
      name: 'Sales Team Leadership',
      weight: 10,
      questions: [
        { id: 'sm4-q1', text: 'How effectively can the candidate lead, motivate, and hold a sales team accountable?' },
        { id: 'sm4-q2', text: 'Evidence/KPIs: Team size managed | Salesperson productivity | Team retention rate' },
      ],
    },
    {
      id: 'sm5',
      name: 'Training & Coaching',
      weight: 8,
      questions: [
        { id: 'sm5-q1', text: 'What is the candidate\'s approach to training and developing salespeople?' },
        { id: 'sm5-q2', text: 'Evidence/KPIs: Training programs used | Coaching methods | Salesperson improvement examples' },
      ],
    },
    {
      id: 'sm6',
      name: 'Desking & Deal Structure',
      weight: 8,
      questions: [
        { id: 'sm6-q1', text: 'How proficient is the candidate at structuring deals and working the desk?' },
        { id: 'sm6-q2', text: 'Evidence/KPIs: Closing ratio | Deal structure examples' },
      ],
    },
    {
      id: 'sm7',
      name: 'Customer Satisfaction Focus',
      weight: 8,
      questions: [
        { id: 'sm7-q1', text: 'What is the candidate\'s commitment to customer satisfaction and CSI/SSI scores?' },
        { id: 'sm7-q2', text: 'Evidence/KPIs: CSI/SSI scores achieved | Customer retention rate | Repeat/referral business' },
      ],
    },
    {
      id: 'sm8',
      name: 'Customer Complaint Resolution',
      weight: 6,
      questions: [
        { id: 'sm8-q1', text: 'How effectively does the candidate handle customer complaints and escalations?' },
      ],
    },
    {
      id: 'sm9',
      name: 'CRM & Technology Utilization',
      weight: 6,
      questions: [
        { id: 'sm9-q1', text: 'How well does the candidate utilize CRM systems and sales technology?' },
        { id: 'sm9-q2', text: 'Evidence/KPIs: CRM systems used | Digital retailing experience | Lead management' },
      ],
    },
    {
      id: 'sm10',
      name: 'Sales Process Adherence',
      weight: 6,
      questions: [
        { id: 'sm10-q1', text: 'Does the candidate demonstrate commitment to following and enforcing sales processes?' },
        { id: 'sm10-q2', text: 'Evidence/KPIs: Process compliance examples | Road-to-sale adherence' },
      ],
    },
    {
      id: 'sm11',
      name: 'Primary Residence Distance',
      weight: 6,
      questions: [
        { id: 'sm11-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'sm11-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time | Relocation plans if applicable' },
      ],
    },
    {
      id: 'sm12',
      name: 'References',
      weight: 6,
      questions: [
        { id: 'sm12-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'sm12-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'sm13',
      name: 'Dealership Culture Alignment',
      weight: 6,
      questions: [
        { id: 'sm13-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'sm13-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'salesperson': [
    {
      id: 'sp1',
      name: 'Sales Experience & Results',
      weight: 14,
      questions: [
        { id: 'sp1-q1', text: 'What is the candidate\'s track record in automotive or related sales? Consider units sold and consistency.' },
        { id: 'sp1-q2', text: 'Evidence/KPIs: Units sold monthly | Closing ratio | Years of sales experience' },
      ],
    },
    {
      id: 'sp2',
      name: 'Product Knowledge',
      weight: 10,
      questions: [
        { id: 'sp2-q1', text: 'Does the candidate demonstrate strong product knowledge or ability to quickly learn vehicle features and benefits?' },
        { id: 'sp2-q2', text: 'Evidence/KPIs: Brand familiarity | Competitive knowledge | Learning aptitude' },
      ],
    },
    {
      id: 'sp3',
      name: 'Prospecting & Lead Follow-up',
      weight: 10,
      questions: [
        { id: 'sp3-q1', text: 'How effective is the candidate at generating and following up on leads?' },
        { id: 'sp3-q2', text: 'Evidence/KPIs: Self-generated business % | Follow-up discipline | CRM usage' },
      ],
    },
    {
      id: 'sp4',
      name: 'Customer Service Orientation',
      weight: 12,
      questions: [
        { id: 'sp4-q1', text: 'Does the candidate demonstrate genuine commitment to customer satisfaction?' },
        { id: 'sp4-q2', text: 'Evidence/KPIs: Customer feedback examples | Repeat/referral business | CSI awareness' },
      ],
    },
    {
      id: 'sp5',
      name: 'Communication & Presentation Skills',
      weight: 10,
      questions: [
        { id: 'sp5-q1', text: 'How effectively does the candidate communicate and present to customers?' },
      ],
    },
    {
      id: 'sp6',
      name: 'Negotiation Skills',
      weight: 8,
      questions: [
        { id: 'sp6-q1', text: 'Does the candidate demonstrate ability to negotiate effectively while maintaining customer rapport?' },
        { id: 'sp6-q2', text: 'Evidence/KPIs: Gross profit maintained | Negotiation approach' },
      ],
    },
    {
      id: 'sp7',
      name: 'Work Ethic & Motivation',
      weight: 10,
      questions: [
        { id: 'sp7-q1', text: 'Does the candidate demonstrate strong work ethic, self-motivation, and drive to succeed?' },
        { id: 'sp7-q2', text: 'Evidence/KPIs: Attendance record | Hours willing to work | Goal orientation' },
      ],
    },
    {
      id: 'sp8',
      name: 'Professional Appearance & Demeanor',
      weight: 6,
      questions: [
        { id: 'sp8-q1', text: 'Does the candidate present professionally and appropriately for a sales role?' },
      ],
    },
    {
      id: 'sp9',
      name: 'Primary Residence Distance',
      weight: 6,
      questions: [
        { id: 'sp9-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'sp9-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time' },
      ],
    },
    {
      id: 'sp10',
      name: 'References',
      weight: 7,
      questions: [
        { id: 'sp10-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'sp10-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'sp11',
      name: 'Dealership Culture Alignment',
      weight: 7,
      questions: [
        { id: 'sp11-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'sp11-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'service-manager': [
    {
      id: 'svm1',
      name: 'Service Department Performance',
      weight: 12,
      questions: [
        { id: 'svm1-q1', text: 'How effectively does the candidate demonstrate ability to manage service operations, meet revenue targets, and maintain high customer satisfaction scores?' },
        { id: 'svm1-q2', text: 'Evidence/KPIs: Service revenue vs target | Labor gross profit | Customer pay RO count | Warranty RO processing' },
      ],
    },
    {
      id: 'svm2',
      name: 'Technical Knowledge & Expertise',
      weight: 10,
      questions: [
        { id: 'svm2-q1', text: 'Does the candidate possess strong technical knowledge of automotive systems, repair procedures, and diagnostic processes to effectively lead technicians?' },
        { id: 'svm2-q2', text: 'Evidence/KPIs: Certifications held | Years of technical experience | Familiarity with brand-specific systems' },
      ],
    },
    {
      id: 'svm3',
      name: 'Service Absorption & Profitability',
      weight: 10,
      questions: [
        { id: 'svm3-q1', text: 'What is the candidate\'s track record in achieving service absorption targets and driving departmental profitability?' },
        { id: 'svm3-q2', text: 'Evidence/KPIs: Service absorption % | Parts-to-labor ratio | Effective labor rate' },
      ],
    },
    {
      id: 'svm4',
      name: 'Team Leadership & Development',
      weight: 10,
      questions: [
        { id: 'svm4-q1', text: 'How effectively can the candidate lead, motivate, and develop a team of service advisors, technicians, and support staff?' },
        { id: 'svm4-q2', text: 'Evidence/KPIs: Previous team size managed | Turnover rate in previous role | Training programs implemented' },
      ],
    },
    {
      id: 'svm5',
      name: 'Conflict Resolution & Problem Solving',
      weight: 8,
      questions: [
        { id: 'svm5-q1', text: 'How well does the candidate handle customer complaints, technician disputes, and operational challenges?' },
      ],
    },
    {
      id: 'svm6',
      name: 'Customer Satisfaction Focus',
      weight: 10,
      questions: [
        { id: 'svm6-q1', text: 'What is the candidate\'s approach to ensuring exceptional customer experiences and handling escalations?' },
        { id: 'svm6-q2', text: 'Evidence/KPIs: CSI scores from previous role | Customer retention strategies | Complaint resolution examples' },
      ],
    },
    {
      id: 'svm7',
      name: 'Communication Skills',
      weight: 8,
      questions: [
        { id: 'svm7-q1', text: 'How effectively does the candidate communicate with customers, staff, and other departments?' },
      ],
    },
    {
      id: 'svm8',
      name: 'Process Management & Efficiency',
      weight: 8,
      questions: [
        { id: 'svm8-q1', text: 'Does the candidate demonstrate ability to implement and improve service processes for maximum efficiency?' },
        { id: 'svm8-q2', text: 'Evidence/KPIs: Workflow improvements implemented | Scheduling optimization experience' },
      ],
    },
    {
      id: 'svm9',
      name: 'Compliance & Safety',
      weight: 6,
      questions: [
        { id: 'svm9-q1', text: 'How well does the candidate understand and enforce safety regulations, environmental compliance, and warranty procedures?' },
        { id: 'svm9-q2', text: 'Evidence/KPIs: Safety record | Warranty audit results | EPA/OSHA compliance experience' },
      ],
    },
    {
      id: 'svm10',
      name: 'Primary Residence Distance',
      weight: 6,
      questions: [
        { id: 'svm10-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership? Consider commute time, reliability, and availability for emergencies.' },
        { id: 'svm10-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time | Relocation plans if applicable' },
      ],
    },
    {
      id: 'svm11',
      name: 'References',
      weight: 6,
      questions: [
        { id: 'svm11-q1', text: 'Are the candidate\'s professional references excellent? Consider quality, relevance, and consistency of feedback.' },
        { id: 'svm11-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'svm12',
      name: 'Dealership Culture Alignment',
      weight: 6,
      questions: [
        { id: 'svm12-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'svm12-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'service-advisor': [
    {
      id: 'sa1',
      name: 'Service Sales Performance',
      weight: 14,
      questions: [
        { id: 'sa1-q1', text: 'What is the candidate\'s track record in generating service sales, including customer pay and upselling?' },
        { id: 'sa1-q2', text: 'Evidence/KPIs: Hours per RO | Customer pay revenue | Upsell rate | Menu selling results' },
      ],
    },
    {
      id: 'sa2',
      name: 'Customer Service Excellence',
      weight: 12,
      questions: [
        { id: 'sa2-q1', text: 'How effectively does the candidate provide exceptional customer service and build relationships?' },
        { id: 'sa2-q2', text: 'Evidence/KPIs: CSI scores | Customer retention | Customer feedback examples' },
      ],
    },
    {
      id: 'sa3',
      name: 'Communication Skills',
      weight: 10,
      questions: [
        { id: 'sa3-q1', text: 'How well does the candidate communicate technical information to customers in understandable terms?' },
      ],
    },
    {
      id: 'sa4',
      name: 'Automotive Knowledge',
      weight: 10,
      questions: [
        { id: 'sa4-q1', text: 'Does the candidate have sufficient automotive knowledge to accurately describe repairs and services?' },
        { id: 'sa4-q2', text: 'Evidence/KPIs: Technical background | Brand-specific knowledge | Certification training' },
      ],
    },
    {
      id: 'sa5',
      name: 'Service Process Adherence',
      weight: 8,
      questions: [
        { id: 'sa5-q1', text: 'How well does the candidate follow service processes including write-up, status updates, and delivery?' },
        { id: 'sa5-q2', text: 'Evidence/KPIs: Process compliance | Appointment scheduling | Active delivery experience' },
      ],
    },
    {
      id: 'sa6',
      name: 'Organization & Multi-tasking',
      weight: 10,
      questions: [
        { id: 'sa6-q1', text: 'Can the candidate effectively manage multiple customers and repair orders simultaneously?' },
        { id: 'sa6-q2', text: 'Evidence/KPIs: RO volume handled | Organization methods' },
      ],
    },
    {
      id: 'sa7',
      name: 'DMS & Technology Skills',
      weight: 6,
      questions: [
        { id: 'sa7-q1', text: 'How proficient is the candidate with dealership management systems and service technology?' },
        { id: 'sa7-q2', text: 'Evidence/KPIs: DMS systems used | Tablet/mobile check-in experience' },
      ],
    },
    {
      id: 'sa8',
      name: 'Primary Residence Distance',
      weight: 8,
      questions: [
        { id: 'sa8-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'sa8-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time' },
      ],
    },
    {
      id: 'sa9',
      name: 'References',
      weight: 10,
      questions: [
        { id: 'sa9-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'sa9-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'sa10',
      name: 'Dealership Culture Alignment',
      weight: 12,
      questions: [
        { id: 'sa10-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'sa10-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
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
  'parts-manager': [
    {
      id: 'pm1',
      name: 'Inventory Management',
      weight: 12,
      questions: [
        { id: 'pm1-q1', text: 'How effectively does the candidate manage parts inventory, including stock levels, obsolescence, and turnover rates?' },
        { id: 'pm1-q2', text: 'Evidence/KPIs: Inventory turn rate | Obsolescence % | Fill rate | Stock order accuracy' },
      ],
    },
    {
      id: 'pm2',
      name: 'Parts Department Profitability',
      weight: 10,
      questions: [
        { id: 'pm2-q1', text: 'What is the candidate\'s track record in achieving gross profit targets and managing pricing strategies?' },
        { id: 'pm2-q2', text: 'Evidence/KPIs: Gross profit % | Revenue vs target | Pricing matrix experience' },
      ],
    },
    {
      id: 'pm3',
      name: 'Vendor & OEM Relationships',
      weight: 8,
      questions: [
        { id: 'pm3-q1', text: 'How well does the candidate manage relationships with vendors, negotiate pricing, and maintain OEM program compliance?' },
        { id: 'pm3-q2', text: 'Evidence/KPIs: Vendor negotiation examples | OEM program participation | Cost savings achieved' },
      ],
    },
    {
      id: 'pm4',
      name: 'Team Leadership',
      weight: 10,
      questions: [
        { id: 'pm4-q1', text: 'How effectively can the candidate lead and develop parts counter staff and warehouse personnel?' },
        { id: 'pm4-q2', text: 'Evidence/KPIs: Previous team size | Training programs implemented | Staff retention' },
      ],
    },
    {
      id: 'pm5',
      name: 'Cross-Department Collaboration',
      weight: 8,
      questions: [
        { id: 'pm5-q1', text: 'How well does the candidate work with Service, Body Shop, and Sales departments to support their parts needs?' },
      ],
    },
    {
      id: 'pm6',
      name: 'Wholesale & Retail Sales',
      weight: 10,
      questions: [
        { id: 'pm6-q1', text: 'What is the candidate\'s experience in growing wholesale accounts and retail parts sales?' },
        { id: 'pm6-q2', text: 'Evidence/KPIs: Wholesale account growth | Retail counter sales | Customer acquisition strategies' },
      ],
    },
    {
      id: 'pm7',
      name: 'Customer Service Excellence',
      weight: 8,
      questions: [
        { id: 'pm7-q1', text: 'How does the candidate ensure excellent customer service at the parts counter and for internal customers?' },
        { id: 'pm7-q2', text: 'Evidence/KPIs: Customer satisfaction measures | Response time standards' },
      ],
    },
    {
      id: 'pm8',
      name: 'DMS & Technology Proficiency',
      weight: 6,
      questions: [
        { id: 'pm8-q1', text: 'How proficient is the candidate with dealership management systems, parts ordering systems, and inventory software?' },
        { id: 'pm8-q2', text: 'Evidence/KPIs: DMS systems used | Technology adoption examples' },
      ],
    },
    {
      id: 'pm9',
      name: 'Process Improvement',
      weight: 6,
      questions: [
        { id: 'pm9-q1', text: 'Does the candidate demonstrate ability to identify and implement process improvements?' },
        { id: 'pm9-q2', text: 'Evidence/KPIs: Process improvements implemented | Efficiency gains achieved' },
      ],
    },
    {
      id: 'pm10',
      name: 'Primary Residence Distance',
      weight: 6,
      questions: [
        { id: 'pm10-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'pm10-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time | Relocation plans if applicable' },
      ],
    },
    {
      id: 'pm11',
      name: 'References',
      weight: 8,
      questions: [
        { id: 'pm11-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'pm11-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'pm12',
      name: 'Dealership Culture Alignment',
      weight: 8,
      questions: [
        { id: 'pm12-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'pm12-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'office-clerk': [
    {
      id: 'oc1',
      name: 'Administrative Experience',
      weight: 14,
      questions: [
        { id: 'oc1-q1', text: 'What is the candidate\'s experience with general office administration and clerical duties?' },
        { id: 'oc1-q2', text: 'Evidence/KPIs: Years of office experience | Dealership experience | Duties performed' },
      ],
    },
    {
      id: 'oc2',
      name: 'Data Entry & Accuracy',
      weight: 12,
      questions: [
        { id: 'oc2-q1', text: 'How accurate and efficient is the candidate with data entry and record keeping?' },
        { id: 'oc2-q2', text: 'Evidence/KPIs: Typing speed | Error rate | Attention to detail examples' },
      ],
    },
    {
      id: 'oc3',
      name: 'Computer & Software Skills',
      weight: 10,
      questions: [
        { id: 'oc3-q1', text: 'What is the candidate\'s proficiency with office software and dealership systems?' },
        { id: 'oc3-q2', text: 'Evidence/KPIs: MS Office proficiency | DMS experience | Software systems used' },
      ],
    },
    {
      id: 'oc4',
      name: 'Phone & Customer Interaction',
      weight: 12,
      questions: [
        { id: 'oc4-q1', text: 'How effectively does the candidate handle phone calls and customer interactions?' },
        { id: 'oc4-q2', text: 'Evidence/KPIs: Phone experience | Customer service examples' },
      ],
    },
    {
      id: 'oc5',
      name: 'Written Communication',
      weight: 8,
      questions: [
        { id: 'oc5-q1', text: 'Does the candidate demonstrate strong written communication skills?' },
        { id: 'oc5-q2', text: 'Evidence/KPIs: Writing samples | Email professionalism' },
      ],
    },
    {
      id: 'oc6',
      name: 'Organization & Time Management',
      weight: 10,
      questions: [
        { id: 'oc6-q1', text: 'How well does the candidate organize work and manage multiple priorities?' },
        { id: 'oc6-q2', text: 'Evidence/KPIs: Organization methods | Multi-tasking ability' },
      ],
    },
    {
      id: 'oc7',
      name: 'Reliability & Punctuality',
      weight: 8,
      questions: [
        { id: 'oc7-q1', text: 'Does the candidate demonstrate reliability and consistent attendance?' },
        { id: 'oc7-q2', text: 'Evidence/KPIs: Attendance record | Punctuality' },
      ],
    },
    {
      id: 'oc8',
      name: 'Primary Residence Distance',
      weight: 8,
      questions: [
        { id: 'oc8-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'oc8-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time' },
      ],
    },
    {
      id: 'oc9',
      name: 'References',
      weight: 9,
      questions: [
        { id: 'oc9-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'oc9-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'oc10',
      name: 'Dealership Culture Alignment',
      weight: 9,
      questions: [
        { id: 'oc10-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'oc10-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'hr-manager': [
    {
      id: 'hrm1',
      name: 'Employment Law & Compliance',
      weight: 12,
      questions: [
        { id: 'hrm1-q1', text: 'How well does the candidate understand and apply employment laws, regulations, and HR compliance requirements?' },
        { id: 'hrm1-q2', text: 'Evidence/KPIs: Compliance audit experience | Legal issues handled | Policy development examples' },
      ],
    },
    {
      id: 'hrm2',
      name: 'HR Administration',
      weight: 10,
      questions: [
        { id: 'hrm2-q1', text: 'What is the candidate\'s experience managing HR operations including payroll, benefits, and HRIS systems?' },
        { id: 'hrm2-q2', text: 'Evidence/KPIs: HRIS systems used | Employee count managed | Benefits administration experience' },
      ],
    },
    {
      id: 'hrm3',
      name: 'Policy Development & Implementation',
      weight: 8,
      questions: [
        { id: 'hrm3-q1', text: 'Does the candidate demonstrate ability to develop, communicate, and enforce HR policies?' },
        { id: 'hrm3-q2', text: 'Evidence/KPIs: Policies developed | Employee handbook experience | Policy rollout examples' },
      ],
    },
    {
      id: 'hrm4',
      name: 'Recruiting & Talent Acquisition',
      weight: 10,
      questions: [
        { id: 'hrm4-q1', text: 'How effective is the candidate at sourcing, attracting, and hiring quality candidates?' },
        { id: 'hrm4-q2', text: 'Evidence/KPIs: Positions filled annually | Time-to-fill metrics | Quality of hire measures' },
      ],
    },
    {
      id: 'hrm5',
      name: 'Training & Development',
      weight: 8,
      questions: [
        { id: 'hrm5-q1', text: 'What is the candidate\'s experience in developing and implementing training programs?' },
        { id: 'hrm5-q2', text: 'Evidence/KPIs: Training programs created | Development initiatives | ROI of training' },
      ],
    },
    {
      id: 'hrm6',
      name: 'Performance Management',
      weight: 8,
      questions: [
        { id: 'hrm6-q1', text: 'How well does the candidate understand and implement performance management systems?' },
        { id: 'hrm6-q2', text: 'Evidence/KPIs: Performance systems implemented | Review process experience' },
      ],
    },
    {
      id: 'hrm7',
      name: 'Employee Relations & Conflict Resolution',
      weight: 10,
      questions: [
        { id: 'hrm7-q1', text: 'How effectively does the candidate handle employee relations issues, investigations, and conflict resolution?' },
        { id: 'hrm7-q2', text: 'Evidence/KPIs: Investigations conducted | Conflict resolution examples | Grievance handling' },
      ],
    },
    {
      id: 'hrm8',
      name: 'Culture & Engagement',
      weight: 8,
      questions: [
        { id: 'hrm8-q1', text: 'What is the candidate\'s approach to building positive workplace culture and employee engagement?' },
        { id: 'hrm8-q2', text: 'Evidence/KPIs: Engagement initiatives | Culture programs | Retention improvements' },
      ],
    },
    {
      id: 'hrm9',
      name: 'Compensation & Benefits Strategy',
      weight: 6,
      questions: [
        { id: 'hrm9-q1', text: 'Does the candidate demonstrate ability to develop competitive compensation and benefits programs?' },
        { id: 'hrm9-q2', text: 'Evidence/KPIs: Comp structure experience | Benefits program design | Market analysis' },
      ],
    },
    {
      id: 'hrm10',
      name: 'HR Metrics & Analytics',
      weight: 4,
      questions: [
        { id: 'hrm10-q1', text: 'How well does the candidate use HR data and metrics to drive decisions?' },
        { id: 'hrm10-q2', text: 'Evidence/KPIs: Metrics tracked | Analytics tools used | Data-driven decisions' },
      ],
    },
    {
      id: 'hrm11',
      name: 'Primary Residence Distance',
      weight: 5,
      questions: [
        { id: 'hrm11-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'hrm11-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time | Relocation plans if applicable' },
      ],
    },
    {
      id: 'hrm12',
      name: 'References',
      weight: 6,
      questions: [
        { id: 'hrm12-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'hrm12-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'hrm13',
      name: 'Dealership Culture Alignment',
      weight: 5,
      questions: [
        { id: 'hrm13-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'hrm13-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'finance-manager': [
    {
      id: 'fm1',
      name: 'F&I Income Performance',
      weight: 14,
      questions: [
        { id: 'fm1-q1', text: 'What is the candidate\'s track record in generating F&I income per vehicle retailed?' },
        { id: 'fm1-q2', text: 'Evidence/KPIs: PVR achieved | Total F&I gross | Income vs target' },
      ],
    },
    {
      id: 'fm2',
      name: 'Product Penetration',
      weight: 12,
      questions: [
        { id: 'fm2-q1', text: 'How effectively does the candidate achieve penetration rates on F&I products?' },
        { id: 'fm2-q2', text: 'Evidence/KPIs: VSC penetration % | GAP penetration % | Maintenance plan % | Overall product penetration' },
      ],
    },
    {
      id: 'fm3',
      name: 'Lender Relationships & Financing',
      weight: 10,
      questions: [
        { id: 'fm3-q1', text: 'Does the candidate demonstrate strong lender relationships and ability to secure financing approvals?' },
        { id: 'fm3-q2', text: 'Evidence/KPIs: Lender relationships | Approval rate | Rate markup average | Subprime experience' },
      ],
    },
    {
      id: 'fm4',
      name: 'Regulatory Compliance',
      weight: 10,
      questions: [
        { id: 'fm4-q1', text: 'How well does the candidate understand and adhere to F&I compliance requirements (TILA, ECOA, FCRA, etc.)?' },
        { id: 'fm4-q2', text: 'Evidence/KPIs: Compliance training | Audit results | Regulatory knowledge' },
      ],
    },
    {
      id: 'fm5',
      name: 'Ethical Sales Practices',
      weight: 8,
      questions: [
        { id: 'fm5-q1', text: 'Does the candidate demonstrate commitment to ethical, transparent F&I practices?' },
        { id: 'fm5-q2', text: 'Evidence/KPIs: Customer complaint history | Chargeback rate | Ethical standards' },
      ],
    },
    {
      id: 'fm6',
      name: 'Customer Satisfaction',
      weight: 8,
      questions: [
        { id: 'fm6-q1', text: 'What is the candidate\'s approach to ensuring positive customer experience in the F&I office?' },
        { id: 'fm6-q2', text: 'Evidence/KPIs: F&I-related CSI scores | Customer feedback | Transaction time' },
      ],
    },
    {
      id: 'fm7',
      name: 'Menu Presentation Skills',
      weight: 6,
      questions: [
        { id: 'fm7-q1', text: 'How effective is the candidate at presenting F&I products using menu selling techniques?' },
        { id: 'fm7-q2', text: 'Evidence/KPIs: Menu selling experience | Presentation style' },
      ],
    },
    {
      id: 'fm8',
      name: 'Deal Documentation & Funding',
      weight: 6,
      questions: [
        { id: 'fm8-q1', text: 'How proficient is the candidate at completing accurate deal documentation and timely funding?' },
        { id: 'fm8-q2', text: 'Evidence/KPIs: Funding time | Kickback rate | Documentation accuracy' },
      ],
    },
    {
      id: 'fm9',
      name: 'DMS & Technology Skills',
      weight: 4,
      questions: [
        { id: 'fm9-q1', text: 'What is the candidate\'s proficiency with DMS systems and F&I technology?' },
        { id: 'fm9-q2', text: 'Evidence/KPIs: DMS systems used | E-contracting experience | Digital F&I tools' },
      ],
    },
    {
      id: 'fm10',
      name: 'Primary Residence Distance',
      weight: 6,
      questions: [
        { id: 'fm10-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'fm10-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time | Relocation plans if applicable' },
      ],
    },
    {
      id: 'fm11',
      name: 'References',
      weight: 8,
      questions: [
        { id: 'fm11-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'fm11-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'fm12',
      name: 'Dealership Culture Alignment',
      weight: 8,
      questions: [
        { id: 'fm12-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'fm12-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'used-car-manager': [
    {
      id: 'ucm1',
      name: 'Inventory Acquisition',
      weight: 12,
      questions: [
        { id: 'ucm1-q1', text: 'How effective is the candidate at sourcing quality used vehicle inventory through trades, auctions, and other channels?' },
        { id: 'ucm1-q2', text: 'Evidence/KPIs: Acquisition sources used | Trade appraisal accuracy | Auction buying experience' },
      ],
    },
    {
      id: 'ucm2',
      name: 'Inventory Management',
      weight: 10,
      questions: [
        { id: 'ucm2-q1', text: 'What is the candidate\'s approach to managing inventory levels, aging, and turn rates?' },
        { id: 'ucm2-q2', text: 'Evidence/KPIs: Days supply target | Turn rate achieved | Aged inventory management' },
      ],
    },
    {
      id: 'ucm3',
      name: 'Pricing & Merchandising',
      weight: 10,
      questions: [
        { id: 'ucm3-q1', text: 'How effectively does the candidate price and merchandise used vehicles for maximum profitability?' },
        { id: 'ucm3-q2', text: 'Evidence/KPIs: Pricing tools used | Market day supply awareness | Photo/description standards' },
      ],
    },
    {
      id: 'ucm4',
      name: 'Used Vehicle Sales Performance',
      weight: 12,
      questions: [
        { id: 'ucm4-q1', text: 'What is the candidate\'s track record in achieving used vehicle sales volume and gross profit targets?' },
        { id: 'ucm4-q2', text: 'Evidence/KPIs: Units sold vs target | Front gross average | Total gross per unit' },
      ],
    },
    {
      id: 'ucm5',
      name: 'Reconditioning Management',
      weight: 8,
      questions: [
        { id: 'ucm5-q1', text: 'How well does the candidate manage the reconditioning process to control costs and speed to line?' },
        { id: 'ucm5-q2', text: 'Evidence/KPIs: Recon cost per unit | Days to frontline | Recon process efficiency' },
      ],
    },
    {
      id: 'ucm6',
      name: 'Sales Team Leadership',
      weight: 10,
      questions: [
        { id: 'ucm6-q1', text: 'How effectively can the candidate lead and develop used car salespeople?' },
        { id: 'ucm6-q2', text: 'Evidence/KPIs: Team size managed | Salesperson productivity | Training approach' },
      ],
    },
    {
      id: 'ucm7',
      name: 'Appraisal & Desk Skills',
      weight: 8,
      questions: [
        { id: 'ucm7-q1', text: 'How proficient is the candidate at appraising trades and working deals?' },
        { id: 'ucm7-q2', text: 'Evidence/KPIs: Appraisal accuracy | Desking experience | Closing ratio' },
      ],
    },
    {
      id: 'ucm8',
      name: 'Technology & Tools',
      weight: 6,
      questions: [
        { id: 'ucm8-q1', text: 'What is the candidate\'s proficiency with inventory management tools and pricing software?' },
        { id: 'ucm8-q2', text: 'Evidence/KPIs: vAuto/similar tools | Pricing software | Online merchandising' },
      ],
    },
    {
      id: 'ucm9',
      name: 'Compliance & Documentation',
      weight: 6,
      questions: [
        { id: 'ucm9-q1', text: 'Does the candidate understand used vehicle compliance requirements (title, disclosure, etc.)?' },
        { id: 'ucm9-q2', text: 'Evidence/KPIs: Title processing | Disclosure requirements | Compliance knowledge' },
      ],
    },
    {
      id: 'ucm10',
      name: 'Primary Residence Distance',
      weight: 6,
      questions: [
        { id: 'ucm10-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'ucm10-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time | Relocation plans if applicable' },
      ],
    },
    {
      id: 'ucm11',
      name: 'References',
      weight: 6,
      questions: [
        { id: 'ucm11-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'ucm11-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'ucm12',
      name: 'Dealership Culture Alignment',
      weight: 6,
      questions: [
        { id: 'ucm12-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'ucm12-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'body-shop-manager': [
    {
      id: 'bsm1',
      name: 'Production Management',
      weight: 12,
      questions: [
        { id: 'bsm1-q1', text: 'How effectively does the candidate manage body shop production, workflow, and cycle time?' },
        { id: 'bsm1-q2', text: 'Evidence/KPIs: Cycle time | Touch time | Throughput | Keys-to-keys time' },
      ],
    },
    {
      id: 'bsm2',
      name: 'Financial Performance',
      weight: 10,
      questions: [
        { id: 'bsm2-q1', text: 'What is the candidate\'s track record in achieving gross profit and revenue targets?' },
        { id: 'bsm2-q2', text: 'Evidence/KPIs: Gross profit % | Revenue vs target | Labor rate achieved' },
      ],
    },
    {
      id: 'bsm3',
      name: 'Estimating & Supplements',
      weight: 8,
      questions: [
        { id: 'bsm3-q1', text: 'How proficient is the candidate in estimating repairs and managing supplement processes?' },
        { id: 'bsm3-q2', text: 'Evidence/KPIs: Estimate accuracy | Supplement capture | Estimating systems used' },
      ],
    },
    {
      id: 'bsm4',
      name: 'Insurance Company Relations',
      weight: 10,
      questions: [
        { id: 'bsm4-q1', text: 'How well does the candidate manage relationships with insurance companies and DRP programs?' },
        { id: 'bsm4-q2', text: 'Evidence/KPIs: DRP programs | Insurance relationships | Approval rates' },
      ],
    },
    {
      id: 'bsm5',
      name: 'Customer Satisfaction',
      weight: 8,
      questions: [
        { id: 'bsm5-q1', text: 'What is the candidate\'s approach to ensuring customer satisfaction with repairs?' },
        { id: 'bsm5-q2', text: 'Evidence/KPIs: CSI scores | Comeback rate | Customer communication' },
      ],
    },
    {
      id: 'bsm6',
      name: 'Team Leadership',
      weight: 10,
      questions: [
        { id: 'bsm6-q1', text: 'How effectively can the candidate lead body technicians, painters, and support staff?' },
        { id: 'bsm6-q2', text: 'Evidence/KPIs: Team size managed | Technician productivity | Staff retention' },
      ],
    },
    {
      id: 'bsm7',
      name: 'Quality Control',
      weight: 8,
      questions: [
        { id: 'bsm7-q1', text: 'Does the candidate demonstrate strong commitment to repair quality and OEM procedures?' },
        { id: 'bsm7-q2', text: 'Evidence/KPIs: Quality inspection process | Certifications held | OEM procedure adherence' },
      ],
    },
    {
      id: 'bsm8',
      name: 'Safety & Environmental Compliance',
      weight: 8,
      questions: [
        { id: 'bsm8-q1', text: 'How well does the candidate understand and enforce safety and environmental regulations?' },
        { id: 'bsm8-q2', text: 'Evidence/KPIs: Safety record | EPA compliance | OSHA experience' },
      ],
    },
    {
      id: 'bsm9',
      name: 'Certifications & Training',
      weight: 6,
      questions: [
        { id: 'bsm9-q1', text: 'Does the candidate hold relevant certifications and commitment to ongoing training?' },
        { id: 'bsm9-q2', text: 'Evidence/KPIs: I-CAR certifications | OEM certifications | Training programs' },
      ],
    },
    {
      id: 'bsm10',
      name: 'Primary Residence Distance',
      weight: 6,
      questions: [
        { id: 'bsm10-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'bsm10-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time | Relocation plans if applicable' },
      ],
    },
    {
      id: 'bsm11',
      name: 'References',
      weight: 7,
      questions: [
        { id: 'bsm11-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'bsm11-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'bsm12',
      name: 'Dealership Culture Alignment',
      weight: 7,
      questions: [
        { id: 'bsm12-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'bsm12-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'automotive-technician': [
    {
      id: 'at1',
      name: 'Technical Competency',
      weight: 16,
      questions: [
        { id: 'atq1-1', text: 'What is the candidate\'s level of technical skill in diagnosing and repairing vehicles?' },
        { id: 'atq1-2', text: 'Evidence/KPIs: Skill level (A/B/C tech) | Diagnostic capabilities | Repair quality' },
      ],
    },
    {
      id: 'at2',
      name: 'Certifications & Training',
      weight: 12,
      questions: [
        { id: 'atq2-1', text: 'Does the candidate hold relevant ASE certifications and manufacturer training?' },
        { id: 'atq2-2', text: 'Evidence/KPIs: ASE certifications | OEM certifications | Training completed' },
      ],
    },
    {
      id: 'at3',
      name: 'Specialty Skills',
      weight: 8,
      questions: [
        { id: 'atq3-1', text: 'Does the candidate have specialty skills (electrical, diesel, hybrid/EV, transmission, etc.)?' },
        { id: 'atq3-2', text: 'Evidence/KPIs: Specialty areas | Advanced diagnostic experience' },
      ],
    },
    {
      id: 'at4',
      name: 'Productivity & Efficiency',
      weight: 12,
      questions: [
        { id: 'atq4-1', text: 'What is the candidate\'s track record for productivity and flag hour performance?' },
        { id: 'atq4-2', text: 'Evidence/KPIs: Flag hours per week | Efficiency % | Flat rate experience' },
      ],
    },
    {
      id: 'at5',
      name: 'Quality of Work',
      weight: 10,
      questions: [
        { id: 'atq5-1', text: 'Does the candidate demonstrate commitment to quality repairs with low comeback rates?' },
        { id: 'atq5-2', text: 'Evidence/KPIs: Comeback rate | Quality inspection results | Attention to detail' },
      ],
    },
    {
      id: 'at6',
      name: 'Work Ethic & Reliability',
      weight: 10,
      questions: [
        { id: 'atq6-1', text: 'Does the candidate demonstrate strong work ethic, punctuality, and reliability?' },
        { id: 'atq6-2', text: 'Evidence/KPIs: Attendance record | Work schedule flexibility | Overtime willingness' },
      ],
    },
    {
      id: 'at7',
      name: 'Safety Practices',
      weight: 6,
      questions: [
        { id: 'atq7-1', text: 'Does the candidate follow proper safety procedures and maintain a safe work area?' },
        { id: 'atq7-2', text: 'Evidence/KPIs: Safety record | Safety training | Tool/equipment care' },
      ],
    },
    {
      id: 'at8',
      name: 'Tools & Equipment',
      weight: 6,
      questions: [
        { id: 'atq8-1', text: 'Does the candidate have adequate personal tools for the position?' },
        { id: 'atq8-2', text: 'Evidence/KPIs: Tool inventory | Scan tool ownership | Tool investment' },
      ],
    },
    {
      id: 'at9',
      name: 'Primary Residence Distance',
      weight: 6,
      questions: [
        { id: 'atq9-1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'atq9-2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time' },
      ],
    },
    {
      id: 'at10',
      name: 'References',
      weight: 7,
      questions: [
        { id: 'atq10-1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'atq10-2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'at11',
      name: 'Dealership Culture Alignment',
      weight: 7,
      questions: [
        { id: 'atq11-1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'atq11-2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
      ],
    },
  ],
  'support-staff': [
    {
      id: 'ss1',
      name: 'Relevant Experience',
      weight: 14,
      questions: [
        { id: 'ss1-q1', text: 'What is the candidate\'s experience with the specific support role (porter, lot attendant, detailer, receptionist, etc.)?' },
        { id: 'ss1-q2', text: 'Evidence/KPIs: Years of experience | Similar role experience | Dealership experience' },
      ],
    },
    {
      id: 'ss2',
      name: 'Role-Specific Skills',
      weight: 12,
      questions: [
        { id: 'ss2-q1', text: 'Does the candidate possess the specific skills needed for this support position?' },
        { id: 'ss2-q2', text: 'Evidence/KPIs: Driving record (if applicable) | Physical capability | Specific skill requirements' },
      ],
    },
    {
      id: 'ss3',
      name: 'Work Ethic',
      weight: 14,
      questions: [
        { id: 'ss3-q1', text: 'Does the candidate demonstrate strong work ethic and willingness to work hard?' },
        { id: 'ss3-q2', text: 'Evidence/KPIs: Work history stability | Effort examples' },
      ],
    },
    {
      id: 'ss4',
      name: 'Reliability & Attendance',
      weight: 12,
      questions: [
        { id: 'ss4-q1', text: 'Is the candidate reliable with consistent attendance and punctuality?' },
        { id: 'ss4-q2', text: 'Evidence/KPIs: Attendance record | Transportation reliability' },
      ],
    },
    {
      id: 'ss5',
      name: 'Flexibility & Adaptability',
      weight: 10,
      questions: [
        { id: 'ss5-q1', text: 'Is the candidate flexible with schedule and willing to help where needed?' },
        { id: 'ss5-q2', text: 'Evidence/KPIs: Schedule flexibility | Willingness to cross-train' },
      ],
    },
    {
      id: 'ss6',
      name: 'Positive Attitude',
      weight: 10,
      questions: [
        { id: 'ss6-q1', text: 'Does the candidate display a positive, can-do attitude?' },
      ],
    },
    {
      id: 'ss7',
      name: 'Professional Appearance',
      weight: 6,
      questions: [
        { id: 'ss7-q1', text: 'Does the candidate present appropriately for a customer-facing environment?' },
      ],
    },
    {
      id: 'ss8',
      name: 'Primary Residence Distance',
      weight: 7,
      questions: [
        { id: 'ss8-q1', text: 'Is the candidate\'s primary residence a reasonable distance from the dealership?' },
        { id: 'ss8-q2', text: 'Evidence/KPIs: Distance in miles | Estimated commute time' },
      ],
    },
    {
      id: 'ss9',
      name: 'References',
      weight: 7,
      questions: [
        { id: 'ss9-q1', text: 'Are the candidate\'s professional references excellent?' },
        { id: 'ss9-q2', text: 'Evidence/KPIs: # of references contacted | Reference quality | Key themes from feedback' },
      ],
    },
    {
      id: 'ss10',
      name: 'Dealership Culture Alignment',
      weight: 8,
      questions: [
        { id: 'ss10-q1', text: 'Does the candidate align with the dealership\'s culture, values, and way of doing business?' },
        { id: 'ss10-q2', text: 'Evidence/KPIs: Cultural fit observations | Values alignment | Team dynamics compatibility' },
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState('c-level-manager');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [criterionComments, setCriterionComments] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  const [showPrintView, setShowPrintView] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [interviewerRecommendation, setInterviewerRecommendation] = useState('');

  const currentCriteria = criteriaData[selectedRole] || [];
  const selectedRoleData = roles.find(r => r.id === selectedRole);

  // Load candidates and managers on mount
  useEffect(() => {
    loadCandidates();
    loadManagers();
  }, []);

  // Auto-fill from query parameters
  useEffect(() => {
    if (candidates.length > 0 && searchParams) {
      const candidateId = searchParams.get('candidateId');
      const role = searchParams.get('role');
      const stage = searchParams.get('stage');

      if (candidateId && !selectedCandidate) {
        setSelectedCandidate(candidateId);
        const candidate = candidates.find(c => c.id.toString() === candidateId);
        if (candidate) {
          setCandidateSearch(candidate.name);
          setShowCandidateDropdown(false);
        }
      }

      if (role && !selectedRole) {
        setSelectedRole(role);
      }

      if (stage && !selectedStage) {
        setSelectedStage(stage);
      }
    }
  }, [candidates, searchParams, selectedCandidate, selectedRole, selectedStage]);

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

      const allManagers: Manager[] = [];

      // Try to get managers from admin endpoint
      const res = await fetch(`${API_BASE}/admin/managers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Combine approved and pending managers
        allManagers.push(
          ...(data.managers || []),
          ...(data.pending || [])
        );
      } else {
        // If not admin, try to get current user as manager
        const userRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json().catch(() => ({}));
        if (userRes.ok && (userData.role === 'manager' || userData.role === 'hiring_manager')) {
          allManagers.push({
            id: userData.id || 0,
            email: userData.email || '',
            full_name: userData.full_name || null,
            role: userData.role || 'manager'
          });
        }
      }

      // Also fetch admins from /admin/users endpoint
      try {
        const usersRes = await fetch(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          // Filter for admins
          const admins = (usersData.users || []).filter((u: any) => {
            const isAdmin = u.role === 'admin';
            const isApproved = u.is_approved !== false || u.is_approved === undefined;
            return isAdmin && isApproved;
          }).map((u: any) => ({
            id: u.id,
            email: u.email || '',
            full_name: u.full_name || null,
            role: 'admin'
          }));

          // Add admins that aren't already in the list (check by email)
          admins.forEach((admin: Manager) => {
            if (!allManagers.find(m => m.email === admin.email)) {
              allManagers.push(admin);
            }
          });
        }
      } catch (usersErr) {
        console.error('Failed to load admins:', usersErr);
      }

      setManagers(allManagers);
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
      const criterionNotes = currentCriteria.map(c => {
        const score = scores[c.id] || 0;
        const weighted = calculateWeighted(c.id);
        const comment = criterionComments[c.id] || '';
        return `${c.name}: ${score}/10 (Weighted: ${weighted.toFixed(2)})${comment ? `\n  Comments: ${comment}` : ''}`;
      }).join('\n');

      const recommendationText = interviewerRecommendation === 'hire' ? 'Hire' : interviewerRecommendation === 'next-stage' ? 'Next Stage' : interviewerRecommendation === 'no-hire' ? 'No Hire' : interviewerRecommendation === 'undecided' ? 'Undecided' : 'Not specified';
      
      // Create structured interview notes with clear formatting
      // This format is designed to work with the backend once it supports multiple interviews
      const newInterviewNotes = `Interview Stage: ${selectedStage}
Hiring Manager: ${manager?.full_name || manager?.email || 'Unknown'}
Role: ${selectedRoleData?.name || selectedRole}
Interviewer Recommendation: ${recommendationText}

Scores:
${criterionNotes}

Total Weighted Score: ${totalWeighted.toFixed(2)}/10 (${scoreOutOf100}/100)${additionalNotes ? `

Additional Notes:
${additionalNotes}` : ''}`;

      // Fetch current candidate to get existing notes
      const candidateRes = await fetch(`${API_BASE}/candidates/${selectedCandidate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!candidateRes.ok) {
        toast.error('Failed to fetch candidate data');
        return;
      }
      
      const candidateData = await candidateRes.json().catch(() => ({}));
      const existingNotes = candidateData.notes || '';
      
      // Append new interview notes to existing notes
      // Use a clear separator to distinguish between multiple interviews
      // Format: [existing notes]\n\n--- INTERVIEW ---\n\n[new interview notes]
      let updatedNotes: string;
      if (existingNotes && existingNotes.trim()) {
        // Ensure proper separation between interviews
        const trimmedExisting = existingNotes.trim();
        // Use a clear separator that's easy to parse
        updatedNotes = `${trimmedExisting}\n\n--- INTERVIEW ---\n\n${newInterviewNotes}`;
      } else {
        updatedNotes = newInterviewNotes;
      }

      // Update candidate with score and notes
      const res = await fetch(`${API_BASE}/candidates/${selectedCandidate}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: scoreOutOf100,
          notes: updatedNotes,
        }),
      });

      const data = await res.json().catch(() => ({}));
      
      // Debug: Check what backend saved
      console.log('=== BACKEND SAVE RESPONSE ===');
      console.log('Status:', res.status);
      console.log('Response data:', data);
      if (data.candidate && data.candidate.notes) {
        console.log('Saved notes length:', data.candidate.notes.length);
        console.log('Saved notes preview (first 500 chars):', data.candidate.notes.substring(0, 500));
        console.log('Saved notes preview (last 500 chars):', data.candidate.notes.substring(Math.max(0, data.candidate.notes.length - 500)));
      } else if (data.notes) {
        console.log('Saved notes length:', data.notes.length);
        console.log('Saved notes preview (first 500 chars):', data.notes.substring(0, 500));
      } else {
        console.log('⚠️ No notes field in response!');
      }
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to submit scores');
      }

      toast.success('Scores submitted successfully!');
      
      // Redirect back to candidate detail page if candidateId was provided
      const candidateIdParam = searchParams?.get('candidateId') || selectedCandidate;
      if (candidateIdParam) {
        // Use window.location to force a full page reload
        window.location.href = `/candidates/${candidateIdParam}`;
        return;
      }
      
      // Reset form
      setScores({});
      setCriterionComments({});
      setAdditionalNotes('');
      setSelectedCandidate('');
      setSelectedManager('');
      setSelectedStage('');
      setInterviewerRecommendation('');
      
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
      setCriterionComments({});
      setAdditionalNotes('');
      setSelectedCandidate('');
      setSelectedManager('');
      setSelectedStage('');
      setInterviewerRecommendation('');
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

          {/* Candidate, Role, Interview Stage, and Hiring Manager Selection - Top */}
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
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <label className="block text-sm font-bold mb-2" style={{ color: '#232E40' }}>
                Candidate:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={candidateSearch || (selectedCandidate ? candidates.find(c => c.id.toString() === selectedCandidate)?.name || '' : '')}
                  onChange={(e) => {
                    setCandidateSearch(e.target.value);
                    setShowCandidateDropdown(true);
                    if (!e.target.value) {
                      setSelectedCandidate('');
                    }
                  }}
                  onFocus={() => setShowCandidateDropdown(true)}
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  border: '1px solid #D1D5DB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                }}
                  placeholder="Search candidates..."
                disabled={loading}
                />
                {showCandidateDropdown && (
                  <div 
                    className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    style={{
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    {candidates
                      .filter(candidate => {
                        if (!candidateSearch) return true;
                        const searchLower = candidateSearch.toLowerCase();
                        return candidate.name.toLowerCase().includes(searchLower) || 
                               candidate.position.toLowerCase().includes(searchLower);
                      })
                      .map(candidate => (
                        <div
                          key={candidate.id}
                          onClick={() => {
                            setSelectedCandidate(candidate.id.toString());
                            setCandidateSearch('');
                            setShowCandidateDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                          style={{
                            color: '#374151',
                          }}
                        >
                          <div className="font-medium">{candidate.name}</div>
                        </div>
                      ))}
                    {candidates.filter(candidate => {
                      if (!candidateSearch) return true;
                      const searchLower = candidateSearch.toLowerCase();
                      return candidate.name.toLowerCase().includes(searchLower) || 
                             candidate.position.toLowerCase().includes(searchLower);
                    }).length === 0 && (
                      <div className="px-4 py-2 text-sm" style={{ color: '#6B7280' }}>
                        No candidates found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {showCandidateDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowCandidateDropdown(false)}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#232E40' }}>
                Role:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  border: '1px solid #D1D5DB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
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
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedStage(num.toString())}
                    className="w-10 h-10 rounded-full text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                      border: selectedStage === num.toString() ? '2px solid #4D6DBE' : '1px solid #D1D5DB',
                      color: selectedStage === num.toString() ? '#FFFFFF' : '#374151',
                      backgroundColor: selectedStage === num.toString() ? '#4D6DBE' : '#FFFFFF',
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Print Scorecard Banner */}
          <div className="mb-6 p-4 rounded-xl flex items-center justify-between" style={{ 
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

          {/* Scoring Table */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#4D6DBE' }}>
                  <th className="py-4 px-6 text-left text-xs font-bold text-white">CRITERION</th>
                  <th className="py-4 px-6 text-right text-xs font-bold text-white">WEIGHT %</th>
                  <th className="py-4 px-6 text-center text-xs font-bold text-white">RAW SCORE (out of 10)</th>
                  <th className="py-4 px-6 text-right text-xs font-bold text-white">WEIGHTED</th>
                  <th className="py-4 px-6 text-left text-xs font-bold text-white">COMMENTS</th>
                </tr>
              </thead>
              <tbody>
                {currentCriteria.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-6 text-center text-sm" style={{ color: '#6B7280' }}>
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
                          <div>
                            <span className="text-sm font-semibold block mb-1" style={{ color: '#232E40' }}>
                              {criterion.name}
                            </span>
                            {criterion.questions.length > 0 && (
                              <div className="space-y-0.5 mt-1">
                                {criterion.questions.map((question) => (
                                  <p key={question.id} className="text-xs leading-tight break-words" style={{ color: '#6B7280', maxWidth: '800px' }}>
                                    • {question.text}
                                  </p>
                                ))}
                              </div>
                            )}
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
                        <td className="py-3 px-6">
                          <textarea
                            value={criterionComments[criterion.id] || ''}
                            onChange={(e) => setCriterionComments(prev => ({ ...prev, [criterion.id]: e.target.value }))}
                            className="w-full px-3 py-2 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                              border: '1px solid #D1D5DB',
                              color: '#374151',
                              backgroundColor: '#FFFFFF',
                            }}
                            rows={2}
                            placeholder="Add comments..."
                          />
                          </td>
                        </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Additional Notes Section */}
          <div className="mt-8 mb-6">
            <label className="block text-sm font-bold mb-2" style={{ color: '#232E40' }}>
              Additional Notes:
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                border: '1px solid #D1D5DB',
                color: '#374151',
                backgroundColor: '#FFFFFF',
              }}
              rows={4}
              placeholder="Add any additional notes or observations about the candidate..."
            />
              </div>

          {/* Hiring Recommendation Guide */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FAFAFA', border: '1px solid #E5E7EB' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#232E40' }}>Hiring Recommendation Guide</p>
            <div className="space-y-0">
              <div className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <span className="text-sm font-bold whitespace-nowrap px-3 py-1 rounded" style={{ color: '#047857', backgroundColor: '#6EE7B7', minWidth: '90px' }}>90-100</span>
                <span className="text-sm font-semibold" style={{ color: '#232E40' }}>Likely Game Changer</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>— Exceptional talent; could transform the department's performance</span>
              </div>
              <div className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <span className="text-sm font-bold whitespace-nowrap px-3 py-1 rounded" style={{ color: '#065F46', backgroundColor: '#A7F3D0', minWidth: '90px' }}>80-89</span>
                <span className="text-sm font-semibold" style={{ color: '#232E40' }}>Strong Performer</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>— Proven performer; consistently delivers results with minimal oversight</span>
            </div>
              <div className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <span className="text-sm font-bold whitespace-nowrap px-3 py-1 rounded" style={{ color: '#1E40AF', backgroundColor: '#BFDBFE', minWidth: '90px' }}>70-79</span>
                <span className="text-sm font-semibold" style={{ color: '#232E40' }}>High Potential</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>— Strong potential, particularly with excellent support and development</span>
              </div>
              <div className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <span className="text-sm font-bold whitespace-nowrap px-3 py-1 rounded" style={{ color: '#92400E', backgroundColor: '#FDE68A', minWidth: '90px' }}>60-69</span>
                <span className="text-sm font-semibold" style={{ color: '#232E40' }}>Average Candidate</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>— Won't move the needle; meets basic expectations but lacks standout qualities</span>
              </div>
              <div className="flex items-center gap-4 py-3">
                <span className="text-sm font-bold whitespace-nowrap px-3 py-1 rounded" style={{ color: '#991B1B', backgroundColor: '#FECACA', minWidth: '90px' }}>59 - 00</span>
                <span className="text-sm font-semibold" style={{ color: '#232E40' }}>Do Not Hire</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>— Does not meet minimum requirements; significant concerns or gaps</span>
              </div>
            </div>
          </div>

          {/* Total Weight & Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold" style={{ color: '#232E40' }}>Sum Score:</span>
              <span
                className="px-4 py-1.5 rounded-full text-base font-bold"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                }}
              >
                {Math.round(totalWeighted * 10)}/100
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold whitespace-nowrap" style={{ color: '#232E40' }}>
                  Interviewer Recommendation:
                </label>
                <select
                  value={interviewerRecommendation}
                  onChange={(e) => setInterviewerRecommendation(e.target.value)}
                  className="px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    border: '1px solid #D1D5DB',
                    color: '#374151',
                    backgroundColor: '#FFFFFF',
                    minWidth: '180px',
                  }}
                  disabled={submitting}
                >
                  <option value="">Please choose...</option>
                  <option value="hire">Hire</option>
                  <option value="next-stage">Next Stage</option>
                  <option value="no-hire">No Hire</option>
                  <option value="undecided">Undecided</option>
                </select>
              </div>
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
                disabled={!selectedCandidate || !selectedManager || !selectedStage || !interviewerRecommendation || submitting}
                className="px-8 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <div style={{ width: '14px', height: '14px', border: '1px solid #000', borderRadius: '50%', background: 'white' }}></div>
                        <span style={{ fontSize: '8px' }}>{num}</span>
                      </div>
                    ))}
                  </div>
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

              {/* Scoring Table */}
              <div style={{ marginBottom: '20px', border: '1px solid #000' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '9px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '30%' }}>CRITERION</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontSize: '9px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '8%' }}>WEIGHT %</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontSize: '9px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '12%' }}>RAW SCORE (out of 10)</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontSize: '9px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '10%' }}>WEIGHTED</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '9px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '40%' }}>COMMENTS</th>
                    </tr>
                  </thead>
                  <tbody>
                {currentCriteria.map((criterion) => (
                      <tr key={criterion.id} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '8px', border: '1px solid #ccc', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: '4px' }}>{criterion.name}</div>
                          {criterion.questions.length > 0 && (
                            <div style={{ fontSize: '10px', lineHeight: 1.4, color: '#555' }}>
                              {criterion.questions.map((question, idx) => (
                                <div key={question.id} style={{ marginTop: idx > 0 ? '3px' : '0' }}>
                                  • {question.text}
                    </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc', verticalAlign: 'top' }}>
                          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>{criterion.weight}%</span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc', verticalAlign: 'top' }}>
                          <div style={{ width: '40px', height: '20px', border: '1px solid #000', background: 'white', margin: '0 auto' }}></div>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc', verticalAlign: 'top' }}>
                          <div style={{ width: '50px', height: '20px', border: '1px solid #000', background: 'white', margin: '0 auto' }}></div>
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ccc', verticalAlign: 'top' }}>
                          <div style={{ minHeight: '100px', padding: '4px' }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} style={{ height: '14px', borderBottom: '1px solid #ccc', marginBottom: '2px' }}></div>
                            ))}
                        </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                      </div>

              {/* Additional Notes Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>Additional Notes:</div>
                <div style={{ border: '1px solid #000', minHeight: '150px', padding: '8px' }}></div>
                      </div>

              {/* Hiring Recommendation Guide */}
              <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #000', backgroundColor: '#f9f9f9' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>Hiring Recommendation Guide</div>
                <div style={{ fontSize: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: '1px solid #ddd' }}>
                    <span style={{ fontWeight: 'bold', padding: '2px 6px', border: '1px solid #000', minWidth: '60px', textAlign: 'center' }}>90-100</span>
                    <span style={{ fontWeight: 'bold' }}>Likely Game Changer</span>
                    <span style={{ color: '#000' }}>— Exceptional talent; could transform the department's performance</span>
                        </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: '1px solid #ddd' }}>
                    <span style={{ fontWeight: 'bold', padding: '2px 6px', border: '1px solid #000', minWidth: '60px', textAlign: 'center' }}>80-89</span>
                    <span style={{ fontWeight: 'bold' }}>Strong Performer</span>
                    <span style={{ color: '#000' }}>— Proven performer; consistently delivers results with minimal oversight</span>
                      </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: '1px solid #ddd' }}>
                    <span style={{ fontWeight: 'bold', padding: '2px 6px', border: '1px solid #000', minWidth: '60px', textAlign: 'center' }}>70-79</span>
                    <span style={{ fontWeight: 'bold' }}>High Potential</span>
                    <span style={{ color: '#000' }}>— Strong potential, particularly with excellent support and development</span>
                    </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: '1px solid #ddd' }}>
                    <span style={{ fontWeight: 'bold', padding: '2px 6px', border: '1px solid #000', minWidth: '60px', textAlign: 'center' }}>60-69</span>
                    <span style={{ fontWeight: 'bold' }}>Average Candidate</span>
                    <span style={{ color: '#000' }}>— Won't move the needle; meets basic expectations but lacks standout qualities</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                    <span style={{ fontWeight: 'bold', padding: '2px 6px', border: '1px solid #000', minWidth: '60px', textAlign: 'center' }}>59-00</span>
                    <span style={{ fontWeight: 'bold' }}>Do Not Hire</span>
                    <span style={{ color: '#000' }}>— Does not meet minimum requirements; significant concerns or gaps</span>
                  </div>
                </div>
              </div>

              {/* Sum Score and Interviewer Recommendation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '10px', border: '1px solid #000' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Sum Score:</span>
                  <div style={{ width: '60px', height: '25px', border: '1px solid #000', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}></div>
                  <span style={{ fontSize: '10px' }}>/ 100</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Interviewer Recommendation:</span>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '9px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '12px', height: '12px', border: '1px solid #000', background: 'white' }}></div>
                      <span>Hire</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '12px', height: '12px', border: '1px solid #000', background: 'white' }}></div>
                      <span>Next Stage</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '12px', height: '12px', border: '1px solid #000', background: 'white' }}></div>
                      <span>No Hire</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '12px', height: '12px', border: '1px solid #000', background: 'white' }}></div>
                      <span>Undecided</span>
                  </div>
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

