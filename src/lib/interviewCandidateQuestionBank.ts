export type InterviewCandidateRoleKey = 'c-level-executives' | 'general-manager' | 'sales-manager';

export type InterviewQuestionSection = {
  title: string;
  questions: string[];
};

export type InterviewCandidateQuestionBank = {
  roleKey: InterviewCandidateRoleKey;
  roleLabel: string;
  sections: InterviewQuestionSection[];
};

export const INTERVIEW_QUESTION_BANKS: Record<InterviewCandidateRoleKey, InterviewCandidateQuestionBank> = {
  'c-level-executives': {
    roleKey: 'c-level-executives',
    roleLabel: 'C-Level Executives',
    sections: [
      {
        title: 'Red Flag Questions (10)',
        questions: [
          'Have you ever been involved in a dealership bankruptcy, insolvency, or significant financial failure?',
          'Are there any legal, regulatory, or compliance violations in your career that would affect your ability to lead our organization?',
          'What would a forensic audit of your previous organizations reveal about your financial management?',
          'Have you ever had significant conflict with OEM executives or factory representatives that resulted in business disruption?',
          'Are there any non-compete agreements, litigation, or pending legal matters that would restrict your employment?',
          'Why did you leave your last executive position, and what would the board/owners say about your departure?',
          'Have you ever managed an organization that failed to meet investor/owner return expectations? What were the root causes?',
          'What would we discover if we conducted confidential interviews with your previous direct reports and department heads?',
          'Have you been accused of unethical business practices, creating toxic cultures, or violating fiduciary duties?',
          'Is there anything in your personal or professional background that would prevent you from being bonded or insured at the executive level?',
        ],
      },
      {
        title: 'Role-Specific Questions (25)',
        questions: [
          "Describe your strategic vision for growing a dealership group in today's evolving automotive landscape.",
          'How do you balance short-term profitability with long-term strategic investments in facilities and technology?',
          'Walk me through your approach to evaluating potential dealership acquisitions or divestitures.',
          "What's your philosophy on capital allocation across multiple dealership locations?",
          'How do you stay ahead of industry disruptions (EVs, direct sales, digital retailing, subscription models)?',
          'Describe your ideal relationship with the OEM/factory and how you maximize that partnership.',
          'How would you approach restructuring an underperforming dealership group?',
          'What key performance indicators do you monitor at the executive level, and why?',
          'How do you develop and execute succession plans for key leadership positions?',
          'Describe your experience with dealership real estate strategies and facility planning.',
          "What's your approach to digital transformation and technology investment across a dealership group?",
          'How do you ensure compliance and risk management across all locations and departments?',
          'Describe your process for setting and achieving multi-year financial and market share goals.',
          'How do you balance the interests of investors/owners with employee and customer needs?',
          'What role should dealership executives play in industry associations and government relations?',
          'How do you handle confidential M&A discussions or sensitive ownership transitions?',
          'Describe your experience with dealership valuation and buy-sell transactions.',
          "What’s your strategy for building and maintaining a high-performance executive team?",
          'How do you manage the tension between sales volume targets and overall profitability?',
          'What would your 100-day plan look like for taking over leadership of our organization?',
          'How do you evaluate and select technology platforms that will serve an entire dealership group?',
          'Describe your most successful turnaround or growth initiative at the executive level.',
          'How do you maintain objectivity when making decisions that affect long-term business partners or relationships?',
          "What’s your experience with union negotiations or labor relations at the executive level?",
          'How do you personally contribute to major sales or strategic deals?',
        ],
      },
      {
        title: 'STAR Behavioral Questions (10)',
        questions: [
          'Describe a time you led a major dealership acquisition or consolidation. What was your integration strategy, and what was the financial results within the first year?',
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
    ],
  },
  'general-manager': {
    roleKey: 'general-manager',
    roleLabel: 'General Manager',
    sections: [
      {
        title: 'Red Flag Questions (10)',
        questions: [
          'Have you ever been terminated or asked to resign from an automotive leadership position?',
          'Is there anything in your background that would prevent you from being bonded or obtaining necessary licenses for this role?',
          "What would an audit of your previous dealership's financials reveal about your management?",
          'Have you ever had significant conflict with an OEM/factory representative? What was the outcome?',
          'Are there any legal or regulatory compliance issues in your past that we should know about?',
          'Why did you leave your last GM position, and what would the owner say about your departure?',
          'Have you ever managed a dealership that failed to meet its performance targets? What were the contributing factors?',
          'What would we find if we spoke confidentially with your former department managers?',
          'Have you been accused of unethical business practices or creating a hostile work environment?',
          'Are you currently subject to any non-compete or litigation that would affect your employment here?',
        ],
      },
      {
        title: 'Role-Specific Questions (25)',
        questions: [
          'Describe your philosophy on balancing OEM requirements with dealership profitability.',
          'How do you structure compensation plans for different departments to drive both individual and teamwork?',
          "Walk me through your process for analyzing a dealership's monthly financial statement.",
          "What's your strategy for improving customer retention and increasing service absorption?",
          'How do you stay current on automotive retail trends and EV market developments?',
          'Describe your ideal relationship with the dealership owner/principal.',
          'How would you approach revitalizing a stagnant or declining dealership culture?',
          'What metrics do you review daily vs. weekly vs. monthly?',
          'How do you handle underperforming department managers?',
          'Describe your experience with facility upgrades and negotiating with the factory for image programs.',
          "What's your approach to digital marketing and online reputation management?",
          'How do you ensure compliance across all departments (F&I, HR, safety, etc.)?',
          'Describe your process for forecasting and setting realistic but aggressive monthly goals.',
          'How do you balance short-term profitability with long-term facility and equipment investments?',
          'What role should the GM play in the community and local business networks?',
          'How do you handle confidential employee or customer situations?',
          'Describe your experience with buy-sell transactions or dealership acquisitions.',
          "What's your strategy for succession planning and developing future leaders?",
          'How do you manage the tension between sales volume and gross profit objectives?',
          'What would your 30-60-90 day plan look like for this specific dealership?',
          'How do you evaluate and select new technology/vendor partners?',
          'Describe your most successful inventory management strategy.',
          'How do you maintain objectivity when you have personal relationships with long-term employees?',
          "What's your experience with unionized environments or union avoidance?",
          'How do you personally contribute to the sales process on major deals?',
        ],
      },
      {
        title: 'STAR Behavioral Questions (10)',
        questions: [
          'Describe a time you had to turn around declining CSI scores across multiple departments. What specific initiatives did you implement, and what were the results after six months?',
          'Tell me about a time you had to reduce fixed operations expenses significantly. What costs did you target, how did you implement changes, and what was the impact on profitability and culture?',
          'Recall a situation where you had to terminate a long-tenured but underperforming manager. How did you handle the process, and what was the outcome for the department?',
          'Describe a major facility renovation or upgrade you managed. How did you minimize business disruption, and what was the ROI on the investment?',
          'Give an example of when you successfully negotiated with the factory for better allocation or terms. What was your strategy, and what concessions were you able to secure?',
          'Tell me about a time you navigated a serious compliance or legal issue. What steps did you take to resolve it and prevent recurrence?',
          'Describe a situation where you had to make an unpopular decision for the dealership’s long-term health. How did you communicate it, and what was the eventual outcome?',
          'Recall a time you successfully integrated a newly acquired dealership or location. What was your integration plan, and how did you measure success?',
          'Give an example of developing an employee from entry-level into a management position. What was your development process, and how did they perform?',
          'Describe when you had to manage through a significant market downturn or external crisis. What strategic adjustments did you make, and how did the dealership fare compared to competitors?',
        ],
      },
    ],
  },
  'sales-manager': {
    roleKey: 'sales-manager',
    roleLabel: 'Sales Manager',
    sections: [
      {
        title: 'Red Flag Questions (10)',
        questions: [
          'Have you ever been written up or terminated for violating sales compliance regulations?',
          "What would a deep dive into your previous dealership's sales department turnover reveal?",
          'Have you had conflict with F&I or other departments that affected deal flow?',
          'Are there any restrictions on your ability to work all required hours, including evenings and weekends?',
          'What would we find if we mystery shopped your previous sales team?',
          'Have you ever been accused of discriminatory sales practices or creating a hostile environment?',
          'Why did you leave your last sales management position?',
          'What would your previous GSM/GM say was your biggest management weakness?',
          'Have you managed a team that consistently missed sales objectives? What were the reasons?',
          'Is there anything in your driving or financial history that would prevent you from being insured on our policies?',
        ],
      },
      {
        title: 'Role-Specific Questions (partial list from client)',
        questions: [
          'Walk me through your daily routine for managing a sales team.',
          'How do you balance new car volume vs. used car gross profit?',
          'Describe your process for conducting effective sales meetings.',
          "What's your strategy for improving phone and internet lead conversion rates?",
          'How do you train and enforce a consistent sales process?',
          'What metrics do you post publicly for the team, and why those specifically?',
          'How do you handle \"TO\" (Turn Over) situations with your salespeople?',
          'Describe your approach to inventory management and aging day supply.',
          'How do you develop salespeople with different experience levels?',
          "What's your philosophy on demo vehicles for sales staff?",
          'How do you manage floor time rotations and lead distribution?',
          'Describe your experience with different CRM systems.',
          'How do you handle price objections without sacrificing gross?',
          'What’s your process for reviewing and improving deal structure before it goes to F&I?',
        ],
      },
    ],
  },
};

