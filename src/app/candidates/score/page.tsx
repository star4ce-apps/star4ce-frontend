'use client';

import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth, postJsonAuth } from '@/lib/http';
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

type InterviewQuestions = {
  roleSpecific?: string[];
  starBehavioral?: string[];
};

type Criterion = {
  id: string;
  name: string;
  weight: number;
  questions: Question[];
  interviewQuestions?: InterviewQuestions; // Interview questions paired with this criterion
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

// Ice breaker questions - 5 per role
const iceBreakerQuestions: Record<string, string[]> = {
  'c-level-manager': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'If you were the CEO of our company for a day, what is the first thing you would change?',
    'What is a professional failure you have experienced, and what did you learn from it?',
    'How do you stay current with industry trends and developments?',
    'In your opinion, what are the most important qualities of a successful leader?',
  ],
  'gm': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Tell me about your management style.',
    'If you were the CEO of our company for a day, what is the first thing you would change?',
    'What is a professional failure you have experienced, and what did you learn from it?',
    'In your opinion, what are the most important qualities of a successful leader?',
  ],
  'sales-manager': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Tell me about your management style.',
    'How would the people you manage describe you?',
    'What is a professional failure you have experienced, and what did you learn from it?',
    'How do you prepare for your workday?',
  ],
  'service-manager': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Tell me about your management style.',
    'How would the people you manage describe you?',
    'How do you stay current with industry trends and developments?',
    'What is a professional failure you have experienced, and what did you learn from it?',
  ],
  'parts-manager': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Tell me about your management style.',
    'How would the people you manage describe you?',
    'How do you stay current with industry trends and developments?',
    'What is a professional failure you have experienced, and what did you learn from it?',
  ],
  'finance-manager': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'How do you prepare for your workday?',
    'How do you stay current with industry trends and developments?',
    'What is a professional failure you have experienced, and what did you learn from it?',
    'In your opinion, what are the most important qualities of a successful leader?',
  ],
  'office-clerk': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Forget the job for a second. What\'s something you\'re genuinely passionate about outside of work, and what does that passion say about you?',
    'What are you most proud of outside of your professional accomplishments?',
    'How would your current employer describe you?',
    'How do you prepare for your workday?',
  ],
  'body-shop-manager': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Tell me about your management style.',
    'How would the people you manage describe you?',
    'How do you stay current with industry trends and developments?',
    'What is a professional failure you have experienced, and what did you learn from it?',
  ],
  'salesperson': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Forget the job for a second. What\'s something you\'re genuinely passionate about outside of work, and what does that passion say about you?',
    'What are you most proud of outside of your professional accomplishments?',
    'How would your current employer describe you?',
    'How do you prepare for your workday?',
  ],
  'service-advisor': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Forget the job for a second. What\'s something you\'re genuinely passionate about outside of work, and what does that passion say about you?',
    'What are you most proud of outside of your professional accomplishments?',
    'How would your current employer describe you?',
    'How do you prepare for your workday?',
  ],
  'support-staff': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Forget the job for a second. What\'s something you\'re genuinely passionate about outside of work, and what does that passion say about you?',
    'How was your drive in today?',
    'What are you most proud of outside of your professional accomplishments?',
    'How would your current employer describe you?',
  ],
  'hr-manager': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Tell me about your management style.',
    'How would the people you manage describe you?',
    'How do you stay current with industry trends and developments?',
    'In your opinion, what are the most important qualities of a successful leader?',
  ],
  'used-car-manager': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Tell me about your management style.',
    'How would the people you manage describe you?',
    'How do you stay current with industry trends and developments?',
    'What is a professional failure you have experienced, and what did you learn from it?',
  ],
  'automotive-technician': [
    'I always like to start beyond the resume. In your own words, what\'s the one-minute story of you and how you got to this interview chair today?',
    'Forget the job for a second. What\'s something you\'re genuinely passionate about outside of work, and what does that passion say about you?',
    'What are you most proud of outside of your professional accomplishments?',
    'How would your current employer describe you?',
    'How do you prepare for your workday?',
  ],
};

// Interview questions mapping - organized by role and question type
const interviewQuestionsByRole: Record<string, {
  roleSpecific: string[];
  starBehavioral: string[];
}> = {
  'c-level-manager': {
    roleSpecific: [
      'Describe your strategic vision for growing a dealership group in today\'s evolving automotive landscape.',
      'How do you balance short-term profitability with long-term strategic investments in facilities and technology?',
      'Walk me through your approach to evaluating potential dealership acquisitions or divestitures.',
      'What\'s your philosophy on capital allocation across multiple dealership locations?',
      'How do you stay ahead of industry disruptions (EVs, direct sales, digital retailing, subscription models)?',
      'Describe your ideal relationship with the OEM/factory and how you maximize that partnership.',
      'How would you approach restructuring an underperforming dealership group?',
      'What key performance indicators do you monitor at the executive level, and why?',
      'How do you develop and execute succession plans for key leadership positions?',
      'Describe your experience with dealership real estate strategies and facility planning.',
      'What\'s your approach to digital transformation and technology investment across a dealership group?',
      'How do you ensure compliance and risk management across all locations and departments?',
      'Describe your process for setting and achieving multi-year financial and market share goals.',
      'How do you balance the interests of investors/owners with employee and customer needs?',
      'What role should dealership executives play in industry associations and government relations?',
      'How do you handle confidential M&A discussions or sensitive ownership transitions?',
      'Describe your experience with dealership valuation and buy-sell transactions.',
      'What\'s your strategy for building and maintaining a high-performance executive team?',
      'How do you manage the tension between sales volume targets and overall profitability?',
      'What would your 100-day plan look like for taking over leadership of our organization?',
      'How do you evaluate and select technology platforms that will serve an entire dealership group?',
      'Describe your most successful turnaround or growth initiative at the executive level.',
      'How do you maintain objectivity when making decisions that affect long-term business partners or relationships?',
      'What\'s your experience with union negotiations or labor relations at the executive level?',
      'How do you personally contribute to major sales or strategic deals?',
    ],
    starBehavioral: [
      'Describe a time you led a major dealership acquisition or consolidation. What was your integration strategy, and what were the financial results within the first year?',
      'Tell me about a time you had to implement significant cost reductions across multiple dealerships. What areas did you target, how did you implement changes, and what was the impact on profitability and culture?',
      'Recall a situation where you had to replace multiple underperforming general managers. How did you handle the transitions, and what was the outcome for those dealerships?',
      'Describe a major technology implementation you led across a dealership group. How did you manage the change, and what was the ROI on that investment?',
      'Give an example of when you successfully negotiated with an OEM for better market representation or facility terms. What was your negotiation strategy, and what concessions were you able to secure?',
      'Tell me about a time you navigated a serious compliance crisis or regulatory investigation. What steps did you take to resolve it and prevent recurrence across the organization?',
      'Describe a situation where you had to make an unpopular strategic decision for the long-term health of the business. How did you communicate and implement it, and what was the eventual outcome?',
      'Recall a time you successfully exited an underperforming market or dealership location. What was your exit strategy, and how did you maximize value in the process?',
      'Give an example of developing a high-potential manager into an executive leadership role. What was your development process, and how did they perform in their new role?',
      'Describe when you had to lead through a significant industry downturn or market disruption. What strategic adjustments did you make, and how did your organization fare compared to competitors?',
    ],
  },
  'gm': {
    roleSpecific: [
      'Describe your philosophy on balancing OEM requirements with dealership profitability.',
      'How do you structure compensation plans for different departments to drive both individual and teamwork?',
      'Walk me through your process for analyzing a dealership\'s monthly financial statement.',
      'What\'s your strategy for improving customer retention and increasing service absorption?',
      'How do you stay current on automotive retail trends and EV market developments?',
      'Describe your ideal relationship with the dealership owner/principal.',
      'How would you approach revitalizing a stagnant or declining dealership culture?',
      'What metrics do you review daily vs. weekly vs. monthly?',
      'How do you handle underperforming department managers?',
      'Describe your experience with facility upgrades and negotiating with the factory for image programs.',
      'What\'s your approach to digital marketing and online reputation management?',
      'How do you ensure compliance across all departments (F&I, HR, safety, etc.)?',
      'Describe your process for forecasting and setting realistic but aggressive monthly goals.',
      'How do you balance short-term profitability with long-term facility and equipment investments?',
      'What role should the GM play in the community and local business networks?',
      'How do you handle confidential employee or customer situations?',
      'Describe your experience with buy-sell transactions or dealership acquisitions.',
      'What\'s your strategy for succession planning and developing future leaders?',
      'How do you manage the tension between sales volume and gross profit objectives?',
      'What would your 30-60-90 day plan look like for this specific dealership?',
      'How do you evaluate and select new technology/vendor partners?',
      'Describe your most successful inventory management strategy.',
      'How do you maintain objectivity when you have personal relationships with long-term employees?',
      'What\'s your experience with unionized environments or union avoidance?',
      'How do you personally contribute to the sales process on major deals?',
    ],
    starBehavioral: [
      'Describe a time you had to turn around declining CSI scores across multiple departments. What specific initiatives did you implement, and what were the results after six months?',
      'Tell me about a time you had to reduce fixed operations expenses significantly. What costs did you target, how did you implement changes, and what was the impact on profitability?',
      'Recall a situation where you had to terminate a long-tenured but underperforming manager. How did you handle the process, and what was the outcome for the department?',
      'Describe a major facility renovation or upgrade you managed. How did you minimize business disruption, and what was the ROI on the investment?',
      'Give an example of when you successfully negotiated with the factory for better allocation or terms. What was your strategy, and what concessions were you able to secure?',
      'Tell me about a time you navigated a serious compliance or legal issue. What steps did you take to resolve it and prevent recurrence?',
      'Describe a situation where you had to make an unpopular decision for the dealership\'s long-term health. How did you communicate it, and what was the eventual outcome?',
      'Recall a time you successfully integrated a newly acquired dealership or location. What was your integration plan, and how did you measure success?',
      'Give an example of developing an employee from entry-level into a management position. What was your development process, and how did they perform?',
      'Describe when you had to manage through a significant market downturn or external crisis. What strategic adjustments did you make, and how did the dealership fare compared to competitors?',
    ],
  },
  'sales-manager': {
    roleSpecific: [
      'Walk me through your daily routine for managing a sales team.',
      'How do you balance new car volume vs. used car gross profit?',
      'Describe your process for conducting effective sales meetings.',
      'What\'s your strategy for improving phone and internet lead conversion rates?',
      'How do you train and enforce a consistent sales process?',
      'What metrics do you post publicly for the team, and why those specifically?',
      'How do you handle "TO" situations with your salespeople?',
      'Describe your approach to inventory management and aging day supply.',
      'How do you develop salespeople with different experience levels?',
      'What\'s your philosophy on demo vehicles for sales staff?',
      'How do you manage floor time rotations and lead distribution?',
      'Describe your experience with different CRM systems.',
      'How do you handle price objections without sacrificing gross?',
      'What\'s your process for reviewing and improving deal structure before it goes to F&I?',
      'How do you maintain team morale during inventory shortages?',
      'Describe your ideal relationship with the used car manager.',
      'How do you incorporate product knowledge into daily training?',
      'What\'s your strategy for managing high-performing but difficult salespeople?',
      'How do you ensure ethical treatment of every customer?',
      'Describe your most successful sales promotion or event.',
      'How do you handle a salesperson who consistently underperforms?',
      'What\'s your approach to二手车 appraisals and trades?',
      'How do you stay current on competitor pricing and promotions?',
      'Describe your process for working with service department referrals.',
      'How would you improve our current sales department if hired?',
    ],
    starBehavioral: [
      'Describe a time you turned around an underperforming salesperson. What specific coaching methods did you use, and what was the outcome?',
      'Tell me about implementing a new sales process or CRM system. How did you gain buy-in, and what were the results?',
      'Recall a situation where you had to handle a serious customer complaint about a salesperson. How did you investigate and resolve it?',
      'Give an example of when you had to terminate a top-producing but problematic salesperson. How did you handle it, and what was the impact on the team?',
      'Describe a successful inventory reduction campaign you led. What strategies did you use, and how quickly did you achieve results?',
      'Tell me about a time you improved your department\'s CSI scores significantly. What specific actions did you take, and what were the results?',
      'Recall a major sales event you planned and executed. What was your role, and what were the sales results compared to goals?',
      'Describe when you successfully increased used car sales volume. What changes did you implement, and what was the impact on gross and volume?',
      'Give an example of developing a green pea into a consistent performer. What was your training approach, and how long did it take?',
      'Describe a time you had to manage through a product shortage or recall situation. How did you keep the team motivated and productive?',
    ],
  },
  'service-manager': {
    roleSpecific: [
      'Walk me through your daily routine in the service department.',
      'How do you balance customer pay, warranty, and internal repair work?',
      'Describe your process for managing technician productivity and efficiency.',
      'What\'s your strategy for improving effective labor rate?',
      'How do you handle comebacks and warranty claims?',
      'What metrics do you track most closely and why?',
      'Describe your approach to shop scheduling and capacity management.',
      'How do you manage parts department collaboration and turnaround times?',
      'What\'s your experience with different shop management systems?',
      'How do you develop and retain skilled technicians?',
      'Describe your process for handling customer complaints about repair quality.',
      'What\'s your safety program for the shop?',
      'How do you train service advisors on selling recommended services?',
      'Describe your experience with OEM warranty audits.',
      'What\'s your strategy for increasing service absorption percentage?',
      'How do you manage subcontract work (glass, alignments, etc.)?',
      'Describe your ideal relationship with the parts manager.',
      'How do you handle technician flat rate disputes?',
      'What\'s your process for maintaining shop equipment?',
      'How do you ensure accurate repair orders and documentation?',
      'Describe your most successful service marketing promotion.',
      'How do you manage seasonal fluctuations in service business?',
      'What\'s your approach to apprentice technician programs?',
      'How do you stay current on new vehicle technology and repair procedures?',
      'How would you improve our current service operations if hired?',
    ],
    starBehavioral: [
      'Describe a time you improved your department\'s productivity by 15% or more. What specific changes did you implement, and what were the results?',
      'Tell me about turning around a department with poor CSI scores. What was your action plan, and what were the results after 90 days?',
      'Recall a major comeback or warranty issue you had to resolve. How did you handle it with the customer and technician?',
      'Give an example of implementing a new shop process or technology. How did you manage the change, and what was the outcome?',
      'Describe when you successfully reduced customer wait times. What process improvements did you make, and what was the impact?',
      'Tell me about developing a technician into a foreman or team lead. What was your approach, and how did they perform?',
      'Recall a safety incident you had to manage. What were your immediate actions and long-term preventive measures?',
      'Describe a successful service customer retention program you implemented. What strategies did you use, and what was the increase in retention?',
      'Give an example of when you had to handle a difficult technician performance issue. How did you address it, and what was the outcome?',
      'Describe a time you successfully increased extended warranty or maintenance plan sales. What training or incentives did you implement, and what were the results?',
    ],
  },
  'parts-manager': {
    roleSpecific: [
      'Walk me through your daily parts department routine.',
      'How do you balance wholesale vs. retail parts business?',
      'Describe your inventory management philosophy and ideal stocking levels.',
      'What\'s your strategy for improving parts fill rate while controlling inventory investment?',
      'How do you manage obsolescence and dead stock?',
      'What metrics do you track most closely and why?',
      'Describe your approach to pricing—retail, wholesale, and internal.',
      'How do you collaborate with the service and body shop departments?',
      'What\'s your experience with different parts cataloging and inventory systems?',
      'How do you develop and train counter personnel?',
      'Describe your process for conducting physical inventory counts.',
      'What\'s your strategy for building wholesale customer relationships?',
      'How do you handle emergency parts situations after hours?',
      'Describe your experience with OEM parts programs and returns.',
      'What\'s your process for managing special order parts and customer communication?',
      'How do you handle parts discrepancies and warranty returns?',
      'Describe your ideal relationship with the service manager.',
      'How do you manage supplier relationships and negotiate terms?',
      'What\'s your process for reviewing and adjusting stock orders?',
      'How do you ensure accurate receiving and bin locations?',
      'Describe your most successful wholesale customer acquisition.',
      'How do you manage seasonal parts demand fluctuations?',
      'What\'s your approach to competing with aftermarket parts suppliers?',
      'How do you stay current on parts supersessions and catalog updates?',
      'How would you improve our current parts operations if hired?',
    ],
    starBehavioral: [
      'Describe a time you significantly improved your department\'s fill rate. What specific changes did you implement, and what were the results?',
      'Tell me about reducing obsolescence or dead stock in your inventory. What strategies did you use, and what financial impact did it have?',
      'Recall a major inventory discrepancy you had to resolve. How did you investigate, and what controls did you implement to prevent recurrence?',
      'Give an example of developing a successful wholesale customer program. What was your approach, and what growth did you achieve?',
      'Describe when you successfully implemented a new inventory management system. How did you manage the transition, and what improvements resulted?',
      'Tell me about turning around a struggling wholesale business. What changes did you make, and what were the results after six months?',
      'Recall a time you had to handle a major backorder or supply chain issue. How did you manage customer expectations and find solutions?',
      'Describe a successful process you implemented to improve counter efficiency. What was the process, and what was the impact on wait times or productivity?',
      'Give an example of negotiating better terms with a major supplier. What was your strategy, and what concessions did you secure?',
      'Describe a time you identified and stopped internal theft or process leakage. What did you discover, and what controls did you put in place?',
    ],
  },
  'finance-manager': {
    roleSpecific: [
      'Walk me through your ideal F&I process from deal turnover to delivery.',
      'How do you balance customer satisfaction with product penetration goals?',
      'Describe your approach to menu selling and presentation.',
      'What\'s your strategy for improving VSC (Vehicle Service Contract) penetration?',
      'How do you manage relationships with multiple lending institutions?',
      'What metrics do you review daily and why?',
      'Describe your compliance management system.',
      'How do you train and develop F&I producers?',
      'What\'s your experience with different F&I menu and document systems?',
      'How do you handle credit-challenged customers?',
      'Describe your process for ensuring 100% regulatory compliance.',
      'What\'s your strategy for minimizing chargebacks and cancellations?',
      'How do you work with sales managers on deal structure before turnover?',
      'Describe your experience with subprime lenders and special finance.',
      'What\'s your approach to handling customer objections on products?',
      'How do you manage reserve and participation with different lenders?',
      'Describe your ideal relationship with the sales department.',
      'How do you stay current on changing finance regulations?',
      'What\'s your process for handling spot deliveries and funding issues?',
      'How do you ensure proper disclosure and documentation on every deal?',
      'Describe your most successful product penetration improvement initiative.',
      'How do you handle customer complaints about F&I products or processes?',
      'What\'s your approach to competing with outside financing?',
      'How do you manage your department\'s P&L?',
      'How would you improve our current F&I operations if hired?',
    ],
    starBehavioral: [
      'Describe a time you significantly improved product penetration across all lines. What training or process changes did you implement, and what were the results?',
      'Tell me about reducing chargebacks or cancellations in your department. What controls did you implement, and what was the financial impact?',
      'Recall a major compliance issue you had to address. How did you resolve it, and what preventative measures did you put in place?',
      'Give an example of successfully turning around a struggling F&I producer. What coaching methods did you use, and what was the outcome?',
      'Describe when you implemented a new menu selling system. How did you train the team, and what improvement in PVR did you see?',
      'Tell me about handling a particularly difficult credit situation. How did you structure the deal, and what was the result?',
      'Recall a time you had to manage a regulatory audit or examination. How did you prepare, and what was the outcome?',
      'Describe a successful relationship you built with a new lender. What was your approach, and what benefits did it bring to the dealership?',
      'Give an example of improving the F&I department\'s CSI scores. What specific changes did you make to the customer experience?',
      'Describe a time you identified and stopped unethical sales practices in F&I. What did you do, and what was the impact on the department?',
    ],
  },
  'office-clerk': {
    roleSpecific: [
      'Walk me through your month-end close process.',
      'How do you ensure accurate and timely financial reporting?',
      'Describe your internal controls for cash handling and accounting.',
      'What\'s your experience with dealership accounting systems (CDK, Reynolds, etc.)?',
      'How do you manage payroll processing and compliance?',
      'What metrics do you provide to department managers?',
      'Describe your approach to accounts payable and vendor management.',
      'How do you handle confidential HR matters and employee relations?',
      'What\'s your experience with OEM financial reporting requirements?',
      'How do you manage the title and registration process?',
      'Describe your process for budgeting and forecasting support.',
      'What\'s your strategy for improving accounting department efficiency?',
      'How do you work with department managers on expense control?',
      'Describe your experience with insurance and benefits administration.',
      'What\'s your approach to training department staff on compliance issues?',
      'How do you ensure data security and confidentiality?',
      'Describe your ideal relationship with the dealership controller/CPA.',
      'How do you stay current on accounting and HR regulations?',
      'What\'s your process for handling employee onboarding and terminations?',
      'How do you manage the annual audit process?',
      'Describe your most successful process improvement in office operations.',
      'How do you handle confidential employee complaints or investigations?',
      'What\'s your approach to cost reduction in administrative functions?',
      'How do you ensure compliance with all labor laws and regulations?',
      'How would you improve our current business office operations if hired?',
    ],
    starBehavioral: [
      'Describe a time you improved the month-end close timeline. What process changes did you implement, and how much time did you save?',
      'Tell me about implementing new internal controls or accounting procedures. What was the need, and what improvement in accuracy resulted?',
      'Recall a significant accounting discrepancy you discovered and resolved. How did you identify it, and what controls did you implement to prevent recurrence?',
      'Give an example of successfully managing a difficult HR situation. How did you handle it, and what was the outcome?',
      'Describe when you improved payroll or benefits administration efficiency. What changes did you make, and what was the impact?',
      'Tell me about preparing for and managing an external audit. How did you prepare, and what was the auditor\'s feedback?',
      'Recall a time you had to implement cost reductions in administrative areas. What areas did you target, and what savings did you achieve?',
      'Describe a successful implementation of new accounting software or modules. How did you manage the transition, and what improvements resulted?',
      'Give an example of improving interdepartmental communication from the office. What initiative did you implement, and what was the result?',
      'Describe a time you identified and resolved a serious compliance risk. What was the risk, and how did you address it?',
    ],
  },
  'body-shop-manager': {
    roleSpecific: [
      'Walk me through your daily body shop management routine.',
      'How do you balance DRP work with customer-pay and dealer work?',
      'Describe your production management and workflow system.',
      'What\'s your strategy for improving cycle time and throughput?',
      'How do you manage supplement frequency and amount?',
      'What metrics do you track most closely and why?',
      'Describe your approach to quality control and final inspections.',
      'How do you develop and retain skilled technicians in a competitive market?',
      'What\'s your experience with different estimating and management systems?',
      'How do you handle insurance adjuster relationships and negotiations?',
      'Describe your process for managing sublet services (glass, mechanical, etc.).',
      'What\'s your safety and environmental compliance program?',
      'How do you train estimators on thorough damage analysis?',
      'Describe your experience with aluminum and advanced materials repair.',
      'What\'s your strategy for maintaining DRP relationships and performance standards?',
      'How do you manage parts procurement and inventory for collision repair?',
      'Describe your ideal relationship with insurance partners.',
      'How do you handle customer complaints about repair quality or timeliness?',
      'What\'s your process for managing work-in-progress and production scheduling?',
      'How do you ensure proper documentation and compliance on all repairs?',
      'Describe your most successful DRP relationship development.',
      'How do you manage seasonal fluctuations in collision business?',
      'What\'s your approach to new technology adoption in the shop?',
      'How do you stay current on new vehicle construction and repair procedures?',
      'How would you improve our current body shop operations if hired?',
    ],
    starBehavioral: [
      'Describe a time you significantly improved your shop\'s cycle time. What process changes did you implement, and what were the results?',
      'Tell me about improving CSI scores in a body shop. What specific initiatives did you implement, and what improvement did you see?',
      'Recall a major quality issue or comeback you had to manage. How did you handle it with the customer and insurance company?',
      'Give an example of successfully adding a new DRP partnership. What was your approach, and what volume did it bring?',
      'Describe when you implemented a new production management system. How did you manage the transition, and what productivity gains resulted?',
      'Tell me about turning around an underperforming body shop. What changes did you make in the first 90 days, and what were the results?',
      'Recall a significant safety or environmental compliance issue you addressed. What actions did you take, and what preventative measures did you implement?',
      'Describe a successful estimator or technician development program. What was your training approach, and what were the outcomes?',
      'Give an example of improving gross profit margin on repairs. What strategies did you use, and what was the financial impact?',
      'Describe a time you managed a complex repair with difficult insurance negotiations. How did you handle it, and what was the outcome for all parties?',
    ],
  },
  'salesperson': {
    roleSpecific: [
      'Walk me through your sales process from greeting to delivery.',
      'How do you build rapport with different types of customers?',
      'Describe your approach to needs assessment and discovery.',
      'What\'s your strategy for handling price objections?',
      'How do you demonstrate vehicle features and benefits effectively?',
      'What metrics do you track for your own performance?',
      'Describe your follow-up process for unsold prospects.',
      'How do you handle customers who want to "think about it"?',
      'What\'s your experience with different CRM systems?',
      'How do you prepare for a customer appointment?',
      'Describe your process for working internet and phone leads.',
      'What\'s your strategy for building repeat and referral business?',
      'How do you handle trade-in evaluations and discussions?',
      'Describe your approach to transitioning customers to F&I.',
      'What\'s your method for learning new product information?',
      'How do you handle difficult or indecisive customers?',
      'Describe your ideal relationship with sales management.',
      'How do you stay motivated during slow periods?',
      'What\'s your process for managing multiple customers simultaneously?',
      'How do you ensure complete customer satisfaction at delivery?',
      'Describe your most challenging sale and how you closed it.',
      'How do you handle competition from other dealerships?',
      'What\'s your approach to working with customers with credit challenges?',
      'How do you balance volume goals with gross profit objectives?',
      'How would you contribute to our sales team\'s success?',
    ],
    starBehavioral: [
      'Describe your biggest sale or most profitable deal. What made it challenging, and how did you achieve it?',
      'Tell me about a time you saved a deal that was about to be lost. What specific actions did you take to recover it?',
      'Recall a difficult customer situation you handled successfully. How did you de-escalate and satisfy the customer?',
      'Give an example of building a long-term customer relationship. How did you maintain contact, and what business resulted?',
      'Describe when you received a negative survey and how you responded. What did you learn, and how did you improve?',
      'Tell me about a time you successfully overcame a major objection. What was the objection, and how did you address it?',
      'Recall a situation where you had to work with management on a difficult deal structure. How did you collaborate, and what was the outcome?',
      'Describe a time you helped a teammate with a sale or problem. What was the situation, and what was the result?',
      'Give an example of improving your sales process based on feedback. What did you change, and how did it improve your results?',
      'Describe when you had to learn about a complex new product or technology quickly. How did you approach it, and how did it help you sell?',
    ],
  },
  'service-advisor': {
    roleSpecific: [
      'Walk me through your write-up process from customer greeting to estimate approval.',
      'How do you build trust with new customers?',
      'Describe your approach to vehicle inspection and maintenance recommendations.',
      'What\'s your strategy for handling customer price objections on repairs?',
      'How do you communicate technical information to non-technical customers?',
      'What metrics do you focus on for your own performance?',
      'Describe your process for managing customer expectations on repair timelines.',
      'How do you handle service recalls and campaign notifications?',
      'What\'s your experience with different shop management systems?',
      'How do you prepare for your day and manage your appointment schedule?',
      'Describe your process for thorough vehicle check-in and documentation.',
      'What\'s your strategy for building repeat customer business?',
      'How do you handle difficult customers or complaints?',
      'Describe your approach to working with technicians on diagnosis and estimates.',
      'What\'s your method for staying current on service procedures and updates?',
      'How do you prioritize multiple customers waiting at the counter?',
      'Describe your ideal relationship with the service manager.',
      'How do you handle customers who decline necessary repairs?',
      'What\'s your process for follow-up after service completion?',
      'How do you ensure accurate customer communication throughout the repair process?',
      'Describe your most challenging diagnosis communication situation.',
      'How do you handle warranty repair discussions with customers?',
      'What\'s your approach to selling additional services while maintaining trust?',
      'How do you manage your productivity during peak hours?',
      'How would you contribute to our service department\'s success?',
    ],
    starBehavioral: [
      'Describe a time you successfully sold a large repair package to a skeptical customer. How did you build trust and communicate the value?',
      'Tell me about handling a customer who was angry about a repair bill. How did you de-escalate the situation and resolve it?',
      'Recall a complex diagnosis situation you managed effectively. How did you coordinate between customer and technician?',
      'Give an example of building a loyal customer who specifically asks for you. What did you do to earn that loyalty?',
      'Describe when you caught a potential mistake before it reached the customer. What was the situation, and how did you handle it?',
      'Tell me about a time you significantly upsold maintenance services ethically. What was your approach, and what was the result?',
      'Recall a situation where you had to deliver bad news about additional repairs needed. How did you communicate it, and what was the customer\'s reaction?',
      'Describe a time you improved your efficiency in writing up vehicles. What changes did you make, and what was the impact?',
      'Give an example of helping a new technician understand customer expectations. What was the situation, and what was the outcome?',
      'Describe when you received positive customer feedback about your service. What did you do specifically to earn that praise?',
    ],
  },
  'support-staff': {
    roleSpecific: [
      // For Porters/Detail
      'Walk me through your process for preparing a vehicle for delivery.',
      'How do you ensure every vehicle meets showroom standards?',
      'Describe your approach to vehicle safety and damage prevention.',
      'What\'s your strategy for organizing and prioritizing vehicles to clean?',
      'How do you handle delicate vehicle surfaces and interiors?',
      'What cleaning products and techniques are you familiar with?',
      'Describe your process for checking vehicles in and out.',
      'How do you handle fuel management and vehicle tracking?',
      'What\'s your experience with different detailing equipment?',
      'How do you ensure no damage occurs during vehicle movement?',
      // For Reception/Admin
      'Walk me through your process for handling multiple phone lines.',
      'How do you greet and direct customers entering the dealership?',
      'Describe your approach to managing appointment schedules.',
      'What\'s your strategy for handling difficult callers or visitors?',
      'How do you ensure accurate message taking and delivery?',
      'What office equipment and software are you proficient with?',
      'Describe your process for managing mail and deliveries.',
      'How do you handle confidential information appropriately?',
      'What\'s your experience with multi-line phone systems?',
      'How do you prioritize tasks during busy periods?',
      'Describe your approach to maintaining a professional reception area.',
      'What\'s your method for remembering names and departments?',
      'How do you handle emergency or upset callers?',
      'Describe your attention to detail in administrative tasks.',
      'What\'s your process for coordinating between departments?',
    ],
    starBehavioral: [
      'Describe a time you noticed a problem before it became serious. What did you notice, and what action did you take?',
      'Tell me about handling a situation where you had multiple urgent requests. How did you prioritize and handle them all?',
      'Recall a time you went above and beyond in your role. What did you do, and what was the result?',
      'Give an example of improving a process in your area. What did you change, and what was the impact?',
      'Describe when you handled a difficult internal customer professionally. What was the situation, and how did you resolve it?',
      'Tell me about a time you made a mistake and how you handled it. What did you learn from the experience?',
      'Recall a situation where you had to follow a procedure you disagreed with. How did you handle it, and what was the outcome?',
      'Describe a time you contributed to team success beyond your specific duties. What did you do, and how did it help the team?',
      'Give an example of learning a new skill or procedure quickly. How did you approach it, and how quickly were you proficient?',
      'Describe when you received positive feedback about your work. What did you do to earn that recognition?',
    ],
  },
};

// Function to map interview questions to criteria based on keyword matching and manual mapping
function mapQuestionsToCriteria(roleId: string, criteria: Criterion[]): Criterion[] {
  const questions = interviewQuestionsByRole[roleId];
  if (!questions) return criteria;

  // Manual mapping for C-Level Manager
  if (roleId === 'c-level-manager') {
    return criteria.map(criterion => {
      const mapped: Criterion = { ...criterion, interviewQuestions: {} };
      
      switch (criterion.id) {
        case 'clm1': // Strategic Vision & Planning
          mapped.interviewQuestions = {
            roleSpecific: [questions.roleSpecific[0], questions.roleSpecific[1], questions.roleSpecific[2]],
            starBehavioral: [questions.starBehavioral[0], questions.starBehavioral[6]],
          };
          break;
        case 'clm2': // Financial Acumen
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[12],
              'How do you analyze financial statements to identify opportunities for cost reduction and revenue growth?',
              'Describe your experience with creating and managing multi-year budgets for a dealership or dealership group.'
            ],
            starBehavioral: [questions.starBehavioral[1]],
          };
          break;
        case 'clm3': // Industry Knowledge & Market Awareness
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[4],
              questions.roleSpecific[5],
              'What trends in the automotive industry do you believe will have the biggest impact on dealership operations in the next 5 years?'
            ],
            starBehavioral: [questions.starBehavioral[9]],
          };
          break;
        case 'clm4': // Executive Presence & Influence
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[17],
              questions.roleSpecific[24],
              'How do you build credibility and influence with stakeholders who may have competing priorities or interests?'
            ],
            starBehavioral: [questions.starBehavioral[4]],
          };
          break;
        case 'clm5': // Organizational Development
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[8],
              questions.roleSpecific[17],
              'Describe your approach to succession planning and developing leadership talent within an organization.'
            ],
            starBehavioral: [questions.starBehavioral[8]],
          };
          break;
        case 'clm6': // Change Management
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[6],
              questions.roleSpecific[10],
              'How do you handle resistance to change from employees or stakeholders, and what strategies do you use to gain buy-in?'
            ],
            starBehavioral: [questions.starBehavioral[6]],
          };
          break;
        case 'clm7': // Compliance & Ethics
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[11],
              'Describe a situation where you had to make a decision that balanced business needs with ethical considerations. How did you handle it?',
              'How do you ensure your organization maintains compliance with automotive industry regulations and standards?'
            ],
            starBehavioral: [questions.starBehavioral[5]],
          };
          break;
        case 'clm8': // Risk Management
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[11],
              'Describe your approach to identifying and mitigating operational, financial, and strategic risks in a dealership environment.',
              'Can you give an example of a significant risk you identified early and how you prevented it from becoming a problem?'
            ],
            starBehavioral: [questions.starBehavioral[5]],
          };
          break;
        case 'clm9': // Board & Owner Relations
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[13],
              questions.roleSpecific[15],
              'How do you communicate complex business issues and strategic recommendations to owners or board members who may not have day-to-day operational experience?'
            ],
            starBehavioral: [questions.starBehavioral[4]],
          };
          break;
        case 'clm10': // External Relationships
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[5],
              questions.roleSpecific[14],
              'Describe your experience managing relationships with OEMs, vendors, and other external partners. How do you negotiate favorable terms?'
            ],
            starBehavioral: [questions.starBehavioral[4]],
          };
          break;
        case 'clm11': // Primary Residence Distance
          mapped.interviewQuestions = {
            roleSpecific: [
              'Is your primary residence a reasonable distance from the dealership? Consider commute time, reliability, and availability for emergencies.',
              'How do you plan to manage your availability for after-hours emergencies or critical business situations?',
              'What is your approach to maintaining work-life balance while being accessible for important dealership matters?'
            ],
          };
          break;
        case 'clm12': // References
          mapped.interviewQuestions = {
            roleSpecific: [
              'What would we discover if we conducted confidential interviews with your previous direct reports and department heads?',
              'Can you provide examples of feedback you\'ve received from former colleagues or subordinates about your leadership style?',
              'How do you think your previous team members would describe your strengths and areas for improvement?'
            ],
          };
          break;
        case 'clm13': // Dealership Culture Alignment
          mapped.interviewQuestions = {
            roleSpecific: [
              questions.roleSpecific[13],
              questions.roleSpecific[22],
              'How do you assess and adapt to the existing culture of an organization when joining a new dealership?'
            ],
          };
          break;
      }
      
      return mapped;
    });
  }

  // Intelligent mapping function that pairs questions with criteria based on relevance
  // Maximum 5 questions per criterion
  return criteria.map(criterion => {
    const mapped: Criterion = { ...criterion, interviewQuestions: {} };
    const selectedRoleSpecific: string[] = [];
    const selectedStarBehavioral: string[] = [];
    
    // Helper function to check if a question is relevant to a criterion
    const isRelevant = (question: string, criterionName: string): boolean => {
      const qLower = question.toLowerCase();
      const cLower = criterionName.toLowerCase();
      
      // Extract key terms from criterion name
      const criterionTerms = cLower.split(/[&\s]+/).filter(term => term.length > 3);
      
      // Check if question contains relevant terms
      return criterionTerms.some(term => qLower.includes(term)) ||
             qLower.includes(cLower.split(' ')[0]) || // First word match
             qLower.includes(cLower.split(' ').slice(-1)[0]); // Last word match
    };
    
    // Select relevant role-specific questions (max 3)
    for (const q of questions.roleSpecific) {
      if (selectedRoleSpecific.length >= 3) break;
      if (isRelevant(q, criterion.name)) {
        selectedRoleSpecific.push(q);
      }
    }
    
    // Select relevant STAR behavioral questions (max 2)
    for (const q of questions.starBehavioral) {
      if (selectedStarBehavioral.length >= 2) break;
      if (isRelevant(q, criterion.name)) {
        selectedStarBehavioral.push(q);
      }
    }
    
    // Ensure we have at least 3 questions total
    const totalQuestions = selectedRoleSpecific.length + selectedStarBehavioral.length;
    
    // If we don't have enough questions, create custom ones based on the criterion
    if (totalQuestions < 3) {
      const customQuestions = generateCustomQuestions(criterion.name, criterion.weight, roleId);
      const needed = 3 - totalQuestions;
      // Add custom questions to role-specific to reach at least 3 total
      selectedRoleSpecific.push(...customQuestions.slice(0, needed));
    }
    
    // Limit role-specific to 3 and STAR behavioral to 2
    let finalRoleSpecific = selectedRoleSpecific.slice(0, 3);
    let finalStarBehavioral = selectedStarBehavioral.slice(0, 2);
    
    // Final check: ensure we have at least 3 questions total
    let finalTotal = finalRoleSpecific.length + finalStarBehavioral.length;
    if (finalTotal < 3) {
      // Generate additional custom questions if needed
      const additionalQuestions = generateCustomQuestions(criterion.name, criterion.weight, roleId);
      const needed = 3 - finalTotal;
      
      // Try to add to role-specific first (up to 3 total)
      const availableRoleSlots = 3 - finalRoleSpecific.length;
      if (availableRoleSlots > 0) {
        const toAdd = Math.min(needed, availableRoleSlots);
        finalRoleSpecific = [...finalRoleSpecific, ...additionalQuestions.slice(0, toAdd)];
        finalTotal = finalRoleSpecific.length + finalStarBehavioral.length;
      }
      
      // If still needed and we have room in STAR behavioral, add there (up to 2 total)
      if (finalTotal < 3 && finalStarBehavioral.length < 2) {
        const stillNeeded = 3 - finalTotal;
        const availableStarSlots = 2 - finalStarBehavioral.length;
        const toAdd = Math.min(stillNeeded, availableStarSlots);
        const starQuestions = generateCustomQuestions(criterion.name, criterion.weight, roleId);
        finalStarBehavioral = [...finalStarBehavioral, ...starQuestions.slice(0, toAdd)];
      }
      
      // Last resort: if we still don't have 3, fill role-specific completely
      finalTotal = finalRoleSpecific.length + finalStarBehavioral.length;
      if (finalTotal < 3) {
        const lastResortQuestions = generateCustomQuestions(criterion.name, criterion.weight, roleId);
        const fillNeeded = 3 - finalTotal;
        const remainingSlots = 3 - finalRoleSpecific.length;
        if (remainingSlots > 0) {
          finalRoleSpecific = [...finalRoleSpecific, ...lastResortQuestions.slice(0, Math.min(fillNeeded, remainingSlots))];
        }
      }
    }
    
    mapped.interviewQuestions = {
      roleSpecific: finalRoleSpecific.slice(0, 3),
      starBehavioral: finalStarBehavioral.slice(0, 2),
    };
    
    // Absolute guarantee: ensure we have at least 3 questions
    const finalValidation = (mapped.interviewQuestions.roleSpecific?.length || 0) + (mapped.interviewQuestions.starBehavioral?.length || 0);
    if (finalValidation < 3) {
      const guaranteeQuestions = generateCustomQuestions(criterion.name, criterion.weight, roleId);
      const fillNeeded = 3 - finalValidation;
      if (!mapped.interviewQuestions.roleSpecific) mapped.interviewQuestions.roleSpecific = [];
      const currentLength = mapped.interviewQuestions.roleSpecific.length;
      const canAdd = Math.min(fillNeeded, 3 - currentLength);
      mapped.interviewQuestions.roleSpecific.push(...guaranteeQuestions.slice(0, canAdd));
      mapped.interviewQuestions.roleSpecific = mapped.interviewQuestions.roleSpecific.slice(0, 3);
    }
    
    return mapped;
  });
}

// Helper function to generate custom interview questions based on criterion
function generateCustomQuestions(criterionName: string, weight: number, roleId: string): string[] {
  const questions: string[] = [];
  const nameLower = criterionName.toLowerCase();
  
  // Generate questions based on common criterion patterns
  if (nameLower.includes('performance') || nameLower.includes('achievement') || nameLower.includes('target')) {
    questions.push(`What specific metrics or KPIs do you use to measure success in ${criterionName.toLowerCase()}?`);
    questions.push(`Can you describe a time when you exceeded expectations in ${criterionName.toLowerCase()}?`);
    questions.push(`How do you set and track goals related to ${criterionName.toLowerCase()}?`);
    questions.push(`Tell me about a situation where you had to improve performance in ${criterionName.toLowerCase()}. What was your approach?`);
    questions.push(`What methods do you use to motivate yourself and others to achieve targets in ${criterionName.toLowerCase()}?`);
  } else if (nameLower.includes('leadership') || nameLower.includes('management') || nameLower.includes('team')) {
    questions.push(`Describe your approach to ${criterionName.toLowerCase()}.`);
    questions.push(`How do you motivate and develop your team in the area of ${criterionName.toLowerCase()}?`);
    questions.push(`What challenges have you faced in ${criterionName.toLowerCase()}, and how did you overcome them?`);
    questions.push(`Can you give an example of a time when you had to make a difficult decision as a leader?`);
    questions.push(`How do you handle conflicts within your team while maintaining productivity?`);
  } else if (nameLower.includes('customer') || nameLower.includes('satisfaction') || nameLower.includes('service')) {
    questions.push(`How do you ensure customer satisfaction in ${criterionName.toLowerCase()}?`);
    questions.push(`Describe a situation where you had to handle a difficult customer issue related to ${criterionName.toLowerCase()}.`);
    questions.push(`What strategies do you use to improve ${criterionName.toLowerCase()}?`);
    questions.push(`Tell me about a time when you went above and beyond to satisfy a customer.`);
    questions.push(`How do you measure and track customer satisfaction in your work?`);
  } else if (nameLower.includes('financial') || nameLower.includes('profit') || nameLower.includes('revenue') || nameLower.includes('acumen')) {
    questions.push(`How do you manage ${criterionName.toLowerCase()} to maximize profitability?`);
    questions.push(`Describe your experience with budgeting and financial planning in ${criterionName.toLowerCase()}.`);
    questions.push(`What financial metrics do you track for ${criterionName.toLowerCase()}?`);
    questions.push(`Can you explain how you analyze financial statements to make business decisions?`);
    questions.push(`Describe a time when you identified a cost-saving opportunity and implemented it.`);
  } else if (nameLower.includes('compliance') || nameLower.includes('safety') || nameLower.includes('risk') || nameLower.includes('ethics')) {
    questions.push(`How do you ensure compliance and safety in ${criterionName.toLowerCase()}?`);
    questions.push(`Describe your approach to risk management in ${criterionName.toLowerCase()}.`);
    questions.push(`What compliance challenges have you faced in ${criterionName.toLowerCase()}?`);
    questions.push(`Tell me about a time when you had to make an ethical decision that was difficult.`);
    questions.push(`How do you stay updated on industry regulations and ensure your team follows them?`);
  } else if (nameLower.includes('communication') || nameLower.includes('relationship') || nameLower.includes('presence') || nameLower.includes('influence')) {
    questions.push(`How do you communicate effectively in ${criterionName.toLowerCase()}?`);
    questions.push(`Describe your approach to building relationships in ${criterionName.toLowerCase()}.`);
    questions.push(`What communication challenges have you encountered in ${criterionName.toLowerCase()}?`);
    questions.push(`Can you give an example of how you've influenced a decision or persuaded stakeholders?`);
    questions.push(`How do you adapt your communication style when working with different types of people?`);
  } else if (nameLower.includes('process') || nameLower.includes('efficiency') || nameLower.includes('improvement') || nameLower.includes('change')) {
    questions.push(`How do you improve processes and efficiency in ${criterionName.toLowerCase()}?`);
    questions.push(`Describe a process improvement you implemented in ${criterionName.toLowerCase()}.`);
    questions.push(`What methods do you use to identify areas for improvement in ${criterionName.toLowerCase()}?`);
    questions.push(`Tell me about a time when you had to implement a significant change. How did you manage resistance?`);
    questions.push(`How do you measure the success of process improvements you've implemented?`);
  } else if (nameLower.includes('knowledge') || nameLower.includes('expertise') || nameLower.includes('technical') || nameLower.includes('industry') || nameLower.includes('awareness')) {
    questions.push(`What is your level of expertise in ${criterionName.toLowerCase()}?`);
    questions.push(`How do you stay current with developments in ${criterionName.toLowerCase()}?`);
    questions.push(`Describe your technical knowledge and experience in ${criterionName.toLowerCase()}.`);
    questions.push(`What industry trends or changes are you most aware of, and how do they impact your work?`);
    questions.push(`How do you continue to develop your knowledge and skills in ${criterionName.toLowerCase()}?`);
  } else if (nameLower.includes('strategic') || nameLower.includes('vision') || nameLower.includes('planning')) {
    questions.push(`How do you develop and execute strategic plans for ${criterionName.toLowerCase()}?`);
    questions.push(`Describe your approach to long-term planning and vision setting.`);
    questions.push(`Can you give an example of a strategic initiative you led and its outcomes?`);
    questions.push(`How do you balance short-term operational needs with long-term strategic goals?`);
    questions.push(`What is your process for identifying and prioritizing strategic opportunities?`);
  } else if (nameLower.includes('development') || nameLower.includes('organizational') || nameLower.includes('culture')) {
    questions.push(`How do you approach ${criterionName.toLowerCase()} in your organization?`);
    questions.push(`Describe your experience with organizational development and culture building.`);
    questions.push(`What strategies do you use to develop talent and build strong teams?`);
    questions.push(`How do you assess and improve organizational culture?`);
    questions.push(`Tell me about a time when you successfully transformed a team or department.`);
  } else {
    // Generic questions for any criterion
    questions.push(`How do you approach ${criterionName.toLowerCase()} in your work?`);
    questions.push(`What experience do you have with ${criterionName.toLowerCase()}?`);
    questions.push(`Describe a situation where you demonstrated strong ${criterionName.toLowerCase()}.`);
    questions.push(`What challenges have you faced related to ${criterionName.toLowerCase()}, and how did you handle them?`);
    questions.push(`How would you improve ${criterionName.toLowerCase()} if hired for this role?`);
  }
  
  return questions;
}

// Full criteria data with questions - populated from Score Card Editor or PDFs
// This will be dynamically loaded from the scorecard editor or API
const criteriaDataRaw: Record<string, Criterion[]> = {
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
  first_name?: string | null;
  last_name?: string | null;
  role: string;
};

function managerDisplayName(m: Manager): string {
  if (m.first_name && m.last_name) return `${m.first_name} ${m.last_name}`.trim();
  if (m.first_name) return m.first_name;
  if (m.last_name) return m.last_name;
  if (m.full_name && m.full_name.trim()) return m.full_name.trim();
  if (m.email && m.email.includes('@')) return m.email.split('@')[0].replace(/[._]/g, ' ');
  return 'Unknown';
}

export default function ScoreCandidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState('c-level-manager');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const [showRedoConfirmation, setShowRedoConfirmation] = useState(false);
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const [allowRedo, setAllowRedo] = useState(false);
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
  const hasAppliedUrlRoleStage = useRef(false);
  const hasAppliedUrlCandidate = useRef(false);
  const currentUserIdRef = useRef<number | null>(null);

  // Get criteria and map interview questions
  const rawCriteria = criteriaDataRaw[selectedRole] || [];
  const currentCriteria = mapQuestionsToCriteria(selectedRole, rawCriteria);
  const selectedRoleData = roles.find(r => r.id === selectedRole);

  // Load candidates and managers on mount
  useEffect(() => {
    loadCandidates();
    loadManagers();
  }, []);

  // Auto-select current user in interviewer dropdown when managers load (if not already selected)
  useEffect(() => {
    const uid = currentUserIdRef.current;
    if (managers.length === 0 || uid == null || selectedManager !== '') return;
    if (managers.some((m) => m.id === uid)) {
      setSelectedManager(String(uid));
    }
  }, [managers, selectedManager]);

  // Load completed stages when candidate is selected
  useEffect(() => {
    if (selectedCandidate) {
      loadCompletedStages(selectedCandidate);
    } else {
      setCompletedStages(new Set());
      setAllowRedo(false);
    }
  }, [selectedCandidate]);

  // Set role and stage from URL on load (so ?role=office-clerk&stage=1 pre-fills)
  useEffect(() => {
    if (hasAppliedUrlRoleStage.current || !searchParams) return;
    const role = searchParams.get('role');
    const stage = searchParams.get('stage');
    if (role && roles.some((r) => r.id === role)) setSelectedRole(role);
    if (stage) setSelectedStage(stage);
    hasAppliedUrlRoleStage.current = true;
  }, [searchParams]);

  // Auto-fill candidate from query once when candidates list is loaded (so clearing the field stays blank)
  useEffect(() => {
    if (hasAppliedUrlCandidate.current || candidates.length === 0 || !searchParams) return;
    const candidateId = searchParams.get('candidateId');
    if (!candidateId) return;
    hasAppliedUrlCandidate.current = true;
    setSelectedCandidate(candidateId);
    const candidate = candidates.find((c) => c.id.toString() === candidateId);
    if (candidate) {
      setCandidateSearch(candidate.name);
      setShowCandidateDropdown(false);
    }
  }, [candidates, searchParams]);

  async function loadCompletedStages(candidateId: string) {
    try {
      const token = getToken();
      if (!token) return;

      const candidateData = await getJsonAuth<{ ok?: boolean; candidate?: { notes?: string } }>(
        `/candidates/${candidateId}`
      );
      const notes = candidateData?.candidate?.notes ?? '';

      if (!notes || !notes.trim()) {
        setCompletedStages(new Set());
        return;
      }

      // Parse notes to find completed interview stages
      const completed = new Set<number>();
      
      // Split by interview separator
      const interviewBlocks = notes.includes('--- INTERVIEW ---')
        ? notes.split(/--- INTERVIEW ---/)
        : notes.split(/Interview Stage:/);

      interviewBlocks.forEach((block: string) => {
        const trimmed = block.trim();
        if (trimmed) {
          // Look for "Interview Stage: X" pattern
          const stageMatch = trimmed.match(/Interview Stage:\s*(\d+)/);
          if (stageMatch) {
            const stageNum = parseInt(stageMatch[1], 10);
            if (!isNaN(stageNum) && stageNum >= 1 && stageNum <= 5) {
              completed.add(stageNum);
            }
          }
        }
      });

      setCompletedStages(completed);
    } catch (err) {
      console.error('Failed to load completed stages:', err);
      setCompletedStages(new Set());
    }
  }

  function handleStageSelection(stage: string) {
    const stageNum = parseInt(stage, 10);
    
    // Check if this stage has already been completed
    if (completedStages.has(stageNum) && !allowRedo) {
      // Show confirmation dialog
      setPendingStage(stage);
      setShowRedoConfirmation(true);
    } else {
      // Allow selection
      setSelectedStage(stage);
      setAllowRedo(false);
    }
  }

  function handleConfirmRedo() {
    if (pendingStage) {
      setSelectedStage(pendingStage);
      setAllowRedo(true);
      setShowRedoConfirmation(false);
      setPendingStage(null);
    }
  }

  function handleCancelRedo() {
    setShowRedoConfirmation(false);
    setPendingStage(null);
  }

  async function loadCandidates() {
    try {
      const token = getToken();
      if (!token) return;

      const data = await getJsonAuth<{ ok?: boolean; items?: Candidate[] }>('/candidates');
      if (data?.items) {
        setCandidates(data.items);
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

      // Get current user to check their dealership
      const userRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userRes.ok) return;
      
      const userResponse = await userRes.json();
      // Handle different response structures: data.user or data
      const userData = userResponse.user || userResponse;
      const userDealershipId = userData.dealership_id || userData.dealershipId;
      const currentUserId = userData.id;
      const currentUserRole = userData.role;
      const currentUserEmail = userData.email || '';
      const currentUserFullName = (userData.full_name && userData.full_name.trim()) ||
        (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}`.trim() : null) ||
        (userData.first_name || userData.last_name) ||
        (currentUserEmail && currentUserEmail.includes('@') ? currentUserEmail.split('@')[0].replace(/[._]/g, ' ') : null);

      // Helper function to check if a manager already exists in the list
      const managerExists = (id: number) => {
        return allManagers.some(m => m.id === id);
      };

      // Store current user id so we can auto-select them in the interviewer dropdown
      if (currentUserRole === 'manager' || currentUserRole === 'hiring_manager' || currentUserRole === 'admin' || currentUserRole === 'corporate') {
        currentUserIdRef.current = currentUserId ?? null;
        const uid = currentUserId ?? 0;
        if (!managerExists(uid)) {
          allManagers.push({
            id: uid,
            email: currentUserEmail,
            full_name: currentUserFullName ?? undefined,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: currentUserRole || 'manager'
          });
        }
      } else {
        currentUserIdRef.current = null;
      }

      // Fetch all interviewers (admin, manager, hiring_manager, corporate) for this dealership
      try {
        const data = await getJsonAuth<{ ok?: boolean; interviewers?: any[] }>('/interviewers');
        if (data?.interviewers) {
          (data.interviewers as any[]).forEach((u: any) => {
            if (!managerExists(u.id)) {
              const fullName = u.full_name || (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}`.trim() : null);
              allManagers.push({
                id: u.id,
                email: u.email || '',
                full_name: fullName ?? undefined,
                first_name: u.first_name,
                last_name: u.last_name,
                role: u.role || 'manager'
              });
            }
          });
        }
      } catch (interviewersErr) {
        console.error('Failed to load interviewers:', interviewersErr);
      }

      // Final deduplication pass based on id (safety check)
      const uniqueManagers = allManagers.filter((manager, index, self) =>
        index === self.findIndex((m) => m.id === manager.id)
      );

      setManagers(uniqueManagers);
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

  // Get missing required fields for tooltip
  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!selectedCandidate) missing.push('Candidate');
    if (!selectedManager) missing.push('Interviewer');
    if (!selectedStage) missing.push('Interview Stage');
    if (!interviewerRecommendation) missing.push('Interviewer Recommendation');
    
    const hasScores = Object.keys(scores).some(key => scores[key] > 0);
    if (!hasScores) missing.push('At least one score');
    
    return missing;
  };

  const missingFields = getMissingFields();
  const isSubmitDisabled = !selectedCandidate || !selectedManager || !selectedStage || !interviewerRecommendation || submitting;

  const handleSubmit = async () => {
    if (!selectedCandidate) {
      toast.error('Please select a candidate');
      return;
    }

    if (!selectedManager) {
      toast.error('Please select an interviewer');
      return;
    }

    if (!selectedStage) {
      toast.error('Please select an interview stage');
      return;
    }

    // Check if this stage has already been completed and user hasn't confirmed redo
    const stageNum = parseInt(selectedStage, 10);
    if (completedStages.has(stageNum) && !allowRedo) {
      toast.error('This interview stage has already been completed. Please confirm to redo it.');
      setPendingStage(selectedStage);
      setShowRedoConfirmation(true);
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
Interviewer: ${manager ? managerDisplayName(manager) : 'Unknown'}
Role: ${selectedRoleData?.name || selectedRole}
Interviewer Recommendation: ${recommendationText}

Scores:
${criterionNotes}

Total Weighted Score: ${totalWeighted.toFixed(2)}/10 (${scoreOutOf100}/100)${additionalNotes ? `

Additional Notes:
${additionalNotes}` : ''}`;

      // Fetch current candidate to get existing notes (use auth helper so scope/headers match backend)
      const candidateData = await getJsonAuth<{ ok?: boolean; candidate?: { notes?: string } }>(
        `/candidates/${selectedCandidate}`
      );
      const existingNotes = candidateData?.candidate?.notes ?? '';

      // Append new interview notes to existing notes
      // Format: [existing notes]\n\n--- INTERVIEW ---\n\n[new interview notes]
      let updatedNotes: string;
      if (existingNotes && existingNotes.trim()) {
        const trimmedExisting = existingNotes.trim();
        updatedNotes = `${trimmedExisting}\n\n--- INTERVIEW ---\n\n${newInterviewNotes}`;
      } else {
        updatedNotes = newInterviewNotes;
      }

      // Update candidate with score and notes (same auth helper as candidate detail page)
      const data = await postJsonAuth<{ ok?: boolean; candidate?: { notes?: string }; error?: string }>(
        `/candidates/${selectedCandidate}`,
        { score: scoreOutOf100, notes: updatedNotes },
        { method: 'PUT' }
      );

      if (data?.error) {
        throw new Error(data.error);
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
      setAllowRedo(false);
      
      // Reload candidates to get updated score
      await loadCandidates();
      // Reload completed stages if candidate is still selected
      if (selectedCandidate) {
        loadCompletedStages(selectedCandidate);
      }
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
      setAllowRedo(false);
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

          {/* Candidate, Role, Interview Stage, and Interviewer Selection - Top */}
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
                  className="fixed inset-0 z-40 cursor-pointer" 
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
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                Interviewer:
              </label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                style={{
                  border: '1px solid #D1D5DB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                }}
                disabled={loading}
              >
                <option value="">Please choose...</option>
                {managers.map(manager => {
                  const displayName = managerDisplayName(manager);
                  return (
                  <option key={manager.id} value={manager.id.toString()}>
                      {displayName}
                  </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#232E40' }}>
                Interview Stage:
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isCompleted = completedStages.has(num);
                  const isSelected = selectedStage === num.toString();
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleStageSelection(num.toString())}
                      className="w-10 h-10 rounded-full text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 relative cursor-pointer"
                style={{
                        border: isSelected ? '2px solid #4D6DBE' : isCompleted ? '2px solid #10B981' : '1px solid #D1D5DB',
                        color: isSelected ? '#FFFFFF' : '#374151',
                        backgroundColor: isSelected ? '#4D6DBE' : isCompleted ? '#D1FAE5' : '#FFFFFF',
                      }}
                      title={isCompleted ? `Stage ${num} already completed. Click to redo.` : `Select Interview Stage ${num}`}
                    >
                      {num}
                      {isCompleted && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </button>
                  );
                })}
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 cursor-pointer"
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

          {/* Role Header */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#4D6DBE', border: '1px solid #3B5998' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {selectedRoleData?.name || 'Select a Role'}
                </h2>
                {selectedRoleData?.description && (
                  <p className="text-sm text-blue-100">
                    {selectedRoleData.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100 mb-1">Total Criteria</p>
                <p className="text-2xl font-bold text-white">{currentCriteria.length}</p>
              </div>
            </div>
          </div>

          {/* Ice Breaker Questions */}
          {iceBreakerQuestions[selectedRole] && iceBreakerQuestions[selectedRole].length > 0 && (
            <div className="mb-6 p-5 rounded-lg" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
              <h3 className="text-base font-bold mb-3" style={{ color: '#1E40AF' }}>Ice Breaker Questions</h3>
              <ol className="space-y-2 list-decimal list-inside">
                {iceBreakerQuestions[selectedRole].map((question, idx) => (
                  <li key={idx} className="text-sm leading-relaxed" style={{ color: '#1E3A8A' }}>
                    {question}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Scoring Cards */}
          <div className="space-y-4">
                {currentCriteria.length === 0 ? (
              <div className="py-8 px-6 text-center text-sm rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }}>
                      No criteria defined for this role.
              </div>
                ) : (
                  currentCriteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {/* Card Header */}
                  <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#4D6DBE' }}>
                    <span className="text-base font-semibold text-white">
                      {criterion.name}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {criterion.weight}%
                    </span>
                  </div>
                  <div className="p-6">
                    {criterion.questions.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {criterion.questions.map((question) => (
                          <p key={question.id} className="text-sm font-semibold leading-relaxed break-words" style={{ color: '#374151', maxWidth: '800px' }}>
                            {question.text}
                          </p>
                        ))}
                      </div>
                    )}
                    {criterion.interviewQuestions && (
                      <div className="mb-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                        <div className="text-sm font-semibold mb-2" style={{ color: '#374151' }}>Interview Questions:</div>
                        <ul className="space-y-2">
                          {criterion.interviewQuestions.roleSpecific && criterion.interviewQuestions.roleSpecific.map((q, idx) => (
                            <li key={`role-${idx}`} className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                              • {q}
                            </li>
                          ))}
                          {criterion.interviewQuestions.starBehavioral && criterion.interviewQuestions.starBehavioral.map((q, idx) => (
                            <li key={`star-${idx}`} className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                              • {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Scoring Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold" style={{ color: '#374151' }}>Raw Score (out of 10)</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={scores[criterion.id] || ''}
                            onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg text-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                              border: '1px solid #D1D5DB',
                              color: '#374151',
                              backgroundColor: '#FFFFFF',
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield',
                            }}
                            placeholder="0.0 / 10"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold" style={{ color: '#374151' }}>Weighted Score</label>
                      <div className="px-3 py-2 text-sm font-bold rounded-lg text-center" style={{ 
                        color: '#232E40',
                        backgroundColor: '#F3F4F6',
                        border: '1px solid #E5E7EB'
                      }}>
                            {calculateWeighted(criterion.id).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold" style={{ color: '#374151' }}>Comments</label>
                      <textarea
                        value={criterionComments[criterion.id] || ''}
                        onChange={(e) => setCriterionComments(prev => ({ ...prev, [criterion.id]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          border: '1px solid #D1D5DB',
                          color: '#374151',
                          backgroundColor: '#FFFFFF',
                        }}
                        rows={3}
                        placeholder="Add comments..."
                      />
                    </div>
                  </div>
                  </div>
                </div>
              ))
            )}
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
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:bg-gray-50 cursor-pointer"
                style={{
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  backgroundColor: '#FFFFFF'
                }}
              >
                Reset
              </button>
              <div className="relative group">
              <button
                onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  className="px-8 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                }}
                  title={isSubmitDisabled && missingFields.length > 0 ? `Missing: ${missingFields.join(', ')}` : ''}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
                {isSubmitDisabled && missingFields.length > 0 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: '#FFFFFF', border: '2px solid #4D6DBE' }}>
                    <div className="font-semibold mb-1" style={{ color: '#232E40' }}>Missing Required Fields:</div>
                    <ul className="list-disc list-inside space-y-0.5" style={{ color: '#374151' }}>
                      {missingFields.map((field, idx) => (
                        <li key={idx}>{field}</li>
                      ))}
                    </ul>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="border-4 border-transparent" style={{ borderTopColor: '#4D6DBE' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Print View */}
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
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
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
                  display: block !important;
                }
                .print-wrapper * {
                  visibility: visible !important;
                }
                .print-back-button,
                .print-buttons {
                  display: none !important;
                  visibility: hidden !important;
                }
                .print-page {
                  width: 8.5in !important;
                  max-width: 8.5in !important;
                  margin: 0 auto !important;
                  padding: 0.05in !important;
                  background: white !important;
                  font-family: Arial, sans-serif !important;
                  page-break-after: auto !important;
                  break-after: auto !important;
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
                .questions-page {
                  page-break-before: always !important;
                  break-before: page !important;
                  padding-top: 0.2in !important;
                }
                @page {
                  margin: 0.05in;
                  size: letter;
                }
              }
            `}} />
            
            {/* Scorecard Page */}
            <div className="print-page scorecard-page" style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              lineHeight: 1.3,
              color: '#000',
              background: 'white',
              padding: '0.05in',
              width: '8.5in',
              maxWidth: '8.5in',
              margin: '0 auto'
            }}>
              <div className="print-header" style={{
                textAlign: 'center',
                marginBottom: '15px',
                borderBottom: '2px solid #000',
                paddingBottom: '8px'
              }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '3px' }}>INTERVIEW SCORECARD</h1>
                <h2 style={{ fontSize: '16px', fontWeight: 'normal' }}>{selectedRoleData?.name} Evaluation</h2>
              </div>

              <div className="candidate-info" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '15px',
                marginBottom: '15px',
                padding: '8px',
                border: '1px solid #000',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '70px', marginRight: '5px', fontSize: '12px' }}>Candidate:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '70px', marginRight: '5px', fontSize: '12px' }}>Position:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '70px', marginRight: '5px', fontSize: '12px' }}>Date:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '70px', marginRight: '5px', fontSize: '12px' }}>Interviewer:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '70px', marginRight: '5px', fontSize: '12px' }}>Time:</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', height: '15px' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold', minWidth: '80px', marginRight: '5px', fontSize: '12px' }}>Interview Stage:</label>
                  <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <div style={{ width: '14px', height: '14px', border: '1px solid #000', borderRadius: '50%', background: 'white' }}></div>
                        <span style={{ fontSize: '12px' }}>{num}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* First Impression Section */}
              <div className="first-impression-section" style={{
                border: '1px solid #000',
                padding: '8px',
                marginBottom: '15px',
                background: '#f9f9f9'
              }}>
                <div style={{
                  fontSize: '15px',
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '13px', gap: '6px' }}>
                    <span>Professional Attire:</span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid #000', background: 'white', borderRadius: '2px' }}></div>
                        <span>Yes</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid #000', background: 'white', borderRadius: '2px' }}></div>
                        <span>No</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '13px', gap: '6px' }}>
                    <span>Punctuality:</span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid #000', background: 'white', borderRadius: '2px' }}></div>
                        <span>Yes</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
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
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '30%' }}>CRITERION</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '8%' }}>WEIGHT %</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '12%' }}>RAW SCORE (out of 10)</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '10%' }}>WEIGHTED</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', color: '#000', border: '1px solid #000', width: '40%' }}>COMMENTS</th>
                    </tr>
                  </thead>
                  <tbody>
                {currentCriteria.map((criterion) => (
                      <tr key={criterion.id} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '10px', border: '1px solid #ccc', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{criterion.name}</div>
                          {criterion.questions.length > 0 && (
                            <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#555' }}>
                              {criterion.questions.map((question, idx) => (
                                <div key={question.id} style={{ marginTop: idx > 0 ? '3px' : '0' }}>
                                  • {question.text}
                    </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc', verticalAlign: 'top' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{criterion.weight}%</span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc', verticalAlign: 'top' }}>
                          <div style={{ width: '40px', height: '20px', border: '1px solid #000', background: 'white', margin: '0 auto' }}></div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc', verticalAlign: 'top' }}>
                          <div style={{ width: '50px', height: '20px', border: '1px solid #000', background: 'white', margin: '0 auto' }}></div>
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', verticalAlign: 'top' }}>
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
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Additional Notes:</div>
                <div style={{ border: '1px solid #000', minHeight: '150px', padding: '8px' }}></div>
                      </div>

              {/* Hiring Recommendation Guide */}
              <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #000', backgroundColor: '#f9f9f9' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Hiring Recommendation Guide</div>
                <div style={{ fontSize: '12px' }}>
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
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Sum Score:</span>
                  <div style={{ width: '60px', height: '25px', border: '1px solid #000', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}></div>
                  <span style={{ fontSize: '14px' }}>/ 100</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Interviewer Recommendation:</span>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
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

            {/* Questions Page - Last page listing all questions */}
            <div className="print-page questions-page" style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '12px',
              lineHeight: 1.4,
              color: '#000',
              background: 'white',
              padding: '0.05in',
              paddingTop: '0.2in',
              width: '8.5in',
              maxWidth: '8.5in',
              margin: '0 auto'
            }}>
              {/* Interview Questions Header */}
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '20px',
                textTransform: 'uppercase',
                color: '#000',
                borderBottom: '2px solid #000',
                paddingBottom: '8px'
              }}>Interview Questions</div>

              {/* Ice Breaker Questions */}
              {iceBreakerQuestions[selectedRole] && iceBreakerQuestions[selectedRole].length > 0 && (
                <div style={{ 
                  marginBottom: '16px',
                  border: '2px solid #000',
                  padding: '12px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    color: '#000'
                  }}>Ice Breaker Questions</div>
                  <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '12px', lineHeight: 1.4 }}>
                    {iceBreakerQuestions[selectedRole].map((question, idx) => (
                      <li key={idx} style={{ marginBottom: '6px', color: '#000' }}>
                        {question}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Questions by Criterion */}
              {currentCriteria.map((criterion) => (
                <div key={criterion.id} style={{ marginBottom: '10px' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    color: '#000'
                  }}>{criterion.name}</div>
                  
                  {/* Interview Questions Only */}
                  {criterion.interviewQuestions && (
                    <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '12px', lineHeight: 1.4 }}>
                      {criterion.interviewQuestions.roleSpecific && criterion.interviewQuestions.roleSpecific.map((q, idx) => (
                        <li key={`role-${idx}`} style={{ marginBottom: '6px', color: '#000' }}>
                          {q}
                        </li>
                      ))}
                      {criterion.interviewQuestions.starBehavioral && criterion.interviewQuestions.starBehavioral.map((q, idx) => (
                        <li key={`star-${idx}`} style={{ marginBottom: '6px', color: '#000' }}>
                          {q}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Redo Confirmation Modal */}
      {showRedoConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#232E40' }}>
              Interview Stage Already Completed
            </h3>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              Interview Stage {pendingStage} has already been completed for this candidate. 
              Do you want to redo/rewrite this interview stage? This will add a new interview entry.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelRedo}
                className="px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRedo}
                className="px-4 py-2 rounded-lg font-semibold text-white transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#4D6DBE',
                }}
              >
                Yes, Redo Stage {pendingStage}
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireAuth>
  );
}

