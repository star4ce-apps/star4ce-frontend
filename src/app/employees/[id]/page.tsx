'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken, getCurrentUser } from '@/lib/auth';
import { getJsonAuth, putJsonAuth, deleteJsonAuth, postJsonAuth } from '@/lib/http';
import toast from 'react-hot-toast';

type PerformanceReview = {
  id: number;
  date: string;
  reviewer: string;
  overallScore: number;
  jobKnowledge: number;
  workQuality: number;
  servicePerformance: number;
  teamwork: number;
  attendance: number;
  strengths: string[];
  improvements: string[];
  notes: string;
};

type RoleChange = {
  id: number;
  date: string;
  action: string;
  previousValue: string;
  newValue: string;
  changedBy: string;
};

type ReviewLogItem = {
  id: number;
  review_date: string;
  overall_rating: number;
  job_knowledge: number;
  work_quality: number;
  service_performance: number;
  teamwork: number;
  attendance: number;
  strengths?: string[];
  improvements?: string[];
  notes?: string | null;
  created_at?: string | null;
  reviewer?: string | null;
  reviewer_name?: string | null;
};

type EmployeeProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  position: string | null;
  employee_id?: string;
  hired_date?: string;
  status?: string;
  dealership_id: number;
  is_active: boolean;
  notes?: string;
  performanceReviews: PerformanceReview[];
  roleChanges: RoleChange[];
  gender?: string;
  date_of_birth?: string;
  address?: string;
  university?: string;
  degree?: string;
  referral?: string;
};

// Job roles dropdown options
const JOB_ROLES = [
  'Body Shop Manager',
  'Body Shop Technician',
  'Business Manager',
  'Business Office Support',
  'C-Level Executives',
  'Platform Manager',
  'Controller',
  'Finance Manager',
  'Finance Director',
  'General Manager',
  'Human Resources Manager',
  'IT Manager',
  'Loaner Agent',
  'Mobility Manager',
  'Parts Counter Employee',
  'Parts Manager',
  'Parts Support',
  'Drivers',
  'Sales Manager',
  'GSM',
  'Sales People',
  'Sales Support',
  'Receptionist',
  'Service Advisor',
  'Service Director',
  'Service Drive Manager',
  'Service Manager',
  'Parts and Service Director',
  'Service Support',
  'Porters',
  'Technician',
  'Used Car Director',
  'Used Car Manager',
];

const departments = [
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

const statuses = ['Full-Time', 'Part-time', 'Intern'];

// Parse performance reviews from notes field (similar to interview parsing)
function parsePerformanceReviewsFromNotes(notes: string): PerformanceReview[] {
  const reviews: PerformanceReview[] = [];
  
  if (!notes || !notes.trim()) {
    return reviews;
  }
  
  // Split notes into review blocks
  const reviewBlocks: string[] = [];
  
  // First, try splitting by the separator
  if (notes.includes('--- PERFORMANCE REVIEW ---')) {
    const parts = notes.split(/--- PERFORMANCE REVIEW ---/);
    parts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed && trimmed.includes('Performance Review Stage:')) {
        reviewBlocks.push(trimmed);
      }
    });
  }
  
  // If no separator found, fall back to splitting on "Performance Review Stage:"
  if (reviewBlocks.length === 0) {
    const stageMatches = [...notes.matchAll(/Performance Review Stage:/g)];
    
    if (stageMatches.length === 0) {
      return reviews;
    }
    
    if (stageMatches.length === 1) {
      reviewBlocks.push(notes);
    } else {
      for (let i = 0; i < stageMatches.length; i++) {
        const startIndex = stageMatches[i].index || 0;
        const endIndex = i < stageMatches.length - 1 
          ? (stageMatches[i + 1].index || notes.length)
          : notes.length;
        
        const block = notes.substring(startIndex, endIndex).trim();
        if (block && block.includes('Performance Review Stage:')) {
          reviewBlocks.push(block);
        }
      }
    }
  }
  
  // Parse each review block
  reviewBlocks.forEach((block, blockIndex) => {
    // Normalize the block
    let normalizedBlock = block
      .replace(/(Performance Review Stage:)([^\n])/g, '$1\n$2')
      .replace(/(Reviewer:)([^\n])/g, '$1\n$2')
      .replace(/(Role:)([^\n])/g, '$1\n$2')
      .replace(/(Scores:)([^\n])/g, '$1\n$2')
      .replace(/(Total Weighted Score:)([^\n])/g, '$1\n$2')
      .replace(/(Strengths:)([^\n])/g, '$1\n$2')
      .replace(/(Areas for Improvement:)([^\n])/g, '$1\n$2')
      .replace(/(Additional Notes:)([^\n])/g, '$1\n$2');
    
    const lines = normalizedBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let stage = '';
    let reviewer = '';
    let role = '';
    let totalScore = '';
    let additionalNotes = '';
    let inScoresSection = false;
    let inStrengthsSection = false;
    let inImprovementsSection = false;
    let inNotesSection = false;
    
    const categoryScores: { category: string; score: number }[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    // Parse each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Header fields
      if (line.startsWith('Performance Review Stage:')) {
        stage = line.replace('Performance Review Stage:', '').trim();
      } else if (line.startsWith('Reviewer:')) {
        const afterLabel = line.replace('Reviewer:', '').trim();
        if (afterLabel) {
          reviewer = afterLabel;
        } else if (i + 1 < lines.length) {
          reviewer = lines[i + 1].trim();
          i++;
        }
      } else if (line.startsWith('Role:')) {
        role = line.replace('Role:', '').trim();
      } else if (line.startsWith('Total Weighted Score:')) {
        totalScore = line.replace('Total Weighted Score:', '').trim();
      } else if (line === 'Scores:') {
        inScoresSection = true;
        inStrengthsSection = false;
        inImprovementsSection = false;
        inNotesSection = false;
      } else if (line === 'Strengths:') {
        inStrengthsSection = true;
        inScoresSection = false;
        inImprovementsSection = false;
        inNotesSection = false;
      } else if (line === 'Areas for Improvement:') {
        inImprovementsSection = true;
        inScoresSection = false;
        inStrengthsSection = false;
        inNotesSection = false;
      } else if (line.startsWith('Additional Notes:')) {
        inNotesSection = true;
        inScoresSection = false;
        inStrengthsSection = false;
        inImprovementsSection = false;
        additionalNotes = line.replace('Additional Notes:', '').trim();
      } else if (inScoresSection) {
        // Parse category scores: "Category Name: score/10"
        if (line.includes(':') && line.includes('/10')) {
          const match = line.match(/^(.+?):\s*(\d+(?:\.\d+)?)\/10/);
          if (match) {
            categoryScores.push({
              category: match[1].trim(),
              score: parseFloat(match[2]),
            });
          }
        }
      } else if (inStrengthsSection) {
        // Parse strengths: "- Strength text"
        if (line.startsWith('-')) {
          strengths.push(line.replace('-', '').trim());
        }
      } else if (inImprovementsSection) {
        // Parse improvements: "- Improvement text"
        if (line.startsWith('-')) {
          improvements.push(line.replace('-', '').trim());
        }
      } else if (inNotesSection) {
        // Collect additional notes
        if (additionalNotes) {
          additionalNotes += '\n' + line;
        } else {
          additionalNotes = line;
        }
      }
    }
    
    // Extract overall score from totalScore (e.g. "7.50/10 (75/100)")
    let overallScore = 0;
    if (totalScore) {
      const scoreMatch = totalScore.match(/\((\d+)\/100\)/);
      if (scoreMatch) {
        overallScore = parseInt(scoreMatch[1], 10) / 10; // Convert to 0-10 scale
      } else {
        const fallbackMatch = totalScore.match(/(\d+(?:\.\d+)?)\/10/);
        if (fallbackMatch) {
          overallScore = parseFloat(fallbackMatch[1]);
        }
      }
    }
    // If no total score, calculate average from category scores
    if (overallScore === 0 && categoryScores.length > 0) {
      const sum = categoryScores.reduce((acc, cat) => acc + cat.score, 0);
      overallScore = sum / categoryScores.length;
    }
    
    // Extract individual category scores
    const jobKnowledge = categoryScores.find(c => c.category.includes('Job Knowledge'))?.score || 0;
    const workQuality = categoryScores.find(c => c.category.includes('Work Quality'))?.score || 0;
    const servicePerformance = categoryScores.find(c => c.category.includes('Service Performance'))?.score || 0;
    const teamwork = categoryScores.find(c => c.category.includes('Teamwork'))?.score || 0;
    const attendance = categoryScores.find(c => c.category.includes('Attendance'))?.score || 0;
    
    // Get review date (use current date if not available)
    const reviewDate = new Date().toISOString().split('T')[0];
    
    const reviewNumber = stage ? parseInt(stage, 10) || blockIndex + 1 : blockIndex + 1;
    
    reviews.push({
      id: reviewNumber, // Use review number as ID
      date: reviewDate,
      reviewer: reviewer || 'Unknown Reviewer',
      overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
      jobKnowledge: Math.round(jobKnowledge * 10) / 10,
      workQuality: Math.round(workQuality * 10) / 10,
      servicePerformance: Math.round(servicePerformance * 10) / 10,
      teamwork: Math.round(teamwork * 10) / 10,
      attendance: Math.round(attendance * 10) / 10,
      strengths: strengths,
      improvements: improvements,
      notes: additionalNotes || '',
    });
  });
  
  return reviews;
}

// Parse referrals from string format
function parseReferrals(referralStr: string | undefined): Array<{ name: string; relationship?: string; phone?: string; email?: string }> {
  if (!referralStr || referralStr === 'Not Provided' || !referralStr.trim()) return [];
  
  const referrals: Array<{ name: string; relationship?: string; phone?: string; email?: string }> = [];
  const parts = referralStr.split(';').map(p => p.trim()).filter(p => p);
  
  for (const part of parts) {
    const relationshipMatch = part.match(/Relationship:\s*([^,]+)/);
    const phoneMatch = part.match(/Phone:\s*([^,]+)/);
    const emailMatch = part.match(/Email:\s*(.+?)(?:\s*$|,)/);
    const nameMatch = part.match(/^(.+?)(?:\s*-\s*(?:Relationship:|Phone:|Email:)|$)/);
    
    const name = nameMatch ? nameMatch[1].trim() : part.split('-')[0].trim();
    const relationship = relationshipMatch ? relationshipMatch[1].trim() : undefined;
    const phone = phoneMatch ? phoneMatch[1].trim() : undefined;
    const email = emailMatch ? emailMatch[1].trim() : undefined;
    
    if (name) {
      referrals.push({ name, relationship, phone, email });
    }
  }
  
  return referrals;
}

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id ? parseInt(params.id as string) : NaN;
  const [activeTab, setActiveTab] = useState('performance-reviews');
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);
  const [showEditPersonal, setShowEditPersonal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editHiredDate, setEditHiredDate] = useState('');
  const [editReferrals, setEditReferrals] = useState<Array<{ firstName: string; lastName: string; phone: string; email: string; relationship: string }>>([]);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [reviewLogs, setReviewLogs] = useState<ReviewLogItem[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ratings, setRatings] = useState({ jobKnowledge: 0, workQuality: 0, servicePerformance: 0, teamwork: 0, attendance: 0 });
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [strengthInput, setStrengthInput] = useState('');
  const [improvementInput, setImprovementInput] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [expandedReviewIndex, setExpandedReviewIndex] = useState<number | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [reviewDate, setReviewDate] = useState<string>('');

  useEffect(() => {
    if (isNaN(employeeId) || !employeeId) {
      setEmployee(null);
      setLoading(false);
      return;
    }
    // Get role from localStorage
    if (typeof window !== 'undefined') {
      const userRole = localStorage.getItem('userRole');
      setRole(userRole);
    }
    loadEmployee();
  }, [employeeId]);

  function openReviewModal() {
    setEditingReviewId(null);
    setRatings({ jobKnowledge: 0, workQuality: 0, servicePerformance: 0, teamwork: 0, attendance: 0 });
    setStrengths([]);
    setImprovements([]);
    setStrengthInput('');
    setImprovementInput('');
    setManagerNotes('');
    setReviewDate(new Date().toISOString().split('T')[0]);
    setShowReviewModal(true);
  }

  function openEditReviewModal(log: ReviewLogItem) {
    if (!log.id) return;
    setEditingReviewId(log.id);
    setRatings({
      jobKnowledge: typeof log.job_knowledge === 'number' ? log.job_knowledge : 0,
      workQuality: typeof log.work_quality === 'number' ? log.work_quality : 0,
      servicePerformance: typeof log.service_performance === 'number' ? log.service_performance : 0,
      teamwork: typeof log.teamwork === 'number' ? log.teamwork : 0,
      attendance: typeof log.attendance === 'number' ? log.attendance : 0,
    });
    const strList = Array.isArray(log.strengths) ? log.strengths : (log.strengths ? [String(log.strengths)] : []);
    const impList = Array.isArray(log.improvements) ? log.improvements : (log.improvements ? [String(log.improvements)] : []);
    setStrengths(strList);
    setImprovements(impList);
    setStrengthInput('');
    setImprovementInput('');
    setManagerNotes(log.notes || '');
    setReviewDate(log.review_date || new Date().toISOString().split('T')[0]);
    setShowReviewModal(true);
  }

  function closeReviewModal() {
    setShowReviewModal(false);
    setEditingReviewId(null);
  }

  async function handleDeleteReview(reviewId: number) {
    if (!employee) return;
    if (!confirm('Are you sure you want to delete this performance review? This cannot be undone.')) return;
    try {
      await deleteJsonAuth(`/employees/${employee.id}/performance-reviews/${reviewId}`);
      toast.success('Performance review deleted.');
      await loadEmployee();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete review';
      toast.error(message);
    }
  }

  function handleAddStrength(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && strengthInput.trim()) {
      e.preventDefault();
      if (!strengths.includes(strengthInput.trim())) {
        setStrengths([...strengths, strengthInput.trim()]);
      }
      setStrengthInput('');
    }
  }

  function removeStrength(strength: string) {
    setStrengths(strengths.filter(s => s !== strength));
  }

  function handleAddImprovement(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && improvementInput.trim()) {
      e.preventDefault();
      if (!improvements.includes(improvementInput.trim())) {
        setImprovements([...improvements, improvementInput.trim()]);
      }
      setImprovementInput('');
    }
  }

  function removeImprovement(improvement: string) {
    setImprovements(improvements.filter(i => i !== improvement));
  }

  async function handleSubmitReview() {
    if (!employee) return;
    setSubmittingReview(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Not logged in');
        return;
      }

      const userData = await getCurrentUser();
      const currentUserFullName = userData?.user?.full_name || userData?.user?.email || 'Manager';

      // Calculate average score
      const scores = [ratings.jobKnowledge, ratings.workQuality, ratings.servicePerformance, ratings.teamwork, ratings.attendance];
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const scoreOutOf100 = (averageScore / 5) * 100;

      // Get existing notes
      const existingNotes = employee.notes || '';

      // Count existing reviews to determine review number
      const reviewCount = reviewLogs.length;
      const reviewNumber = reviewCount + 1;

      // Create category notes
      const categoryNotes = [
        `Job Knowledge & Skills: ${ratings.jobKnowledge}/5`,
        `Work Quality: ${ratings.workQuality}/5`,
        `Service Performance: ${ratings.servicePerformance}/5`,
        `Teamwork & Collaboration: ${ratings.teamwork}/5`,
        `Attendance & Punctuality: ${ratings.attendance}/5`,
      ].join('\n');

      // Format strengths and improvements
      const allStrengths = strengths.length ? strengths : (strengthInput.trim() ? [strengthInput.trim()] : []);
      const allImprovements = improvements.length ? improvements : (improvementInput.trim() ? [improvementInput.trim()] : []);

      const payload = {
        review_date: reviewDate || new Date().toISOString().split('T')[0],
        job_knowledge: ratings.jobKnowledge || 0,
        work_quality: ratings.workQuality || 0,
        service_performance: ratings.servicePerformance || 0,
        teamwork: ratings.teamwork || 0,
        attendance: ratings.attendance || 0,
        overall_rating: averageScore,
        strengths: allStrengths.length ? allStrengths : undefined,
        improvements: allImprovements.length ? allImprovements : undefined,
        notes: managerNotes.trim() || undefined,
      };

      if (editingReviewId) {
        await putJsonAuth(`/employees/${employee.id}/performance-reviews/${editingReviewId}`, payload);
        toast.success('Performance review updated.');
      } else {
        await postJsonAuth(`/employees/${employee.id}/performance-reviews`, payload);
      }

      // Also update employee notes (for backward compatibility) — only when creating new review
      if (!editingReviewId) {
      const newReviewNotes = `Performance Review Stage: ${reviewNumber}
Reviewer: ${currentUserFullName}
Role: ${employee.position || 'N/A'}

Scores:
${categoryNotes}

Total Weighted Score: ${averageScore.toFixed(2)}/10 (${scoreOutOf100}/100)${allStrengths.length > 0 ? `

Strengths:
${allStrengths.map(s => `- ${s}`).join('\n')}` : ''}${allImprovements.length > 0 ? `

Areas for Improvement:
${allImprovements.map(i => `- ${i}`).join('\n')}` : ''}${managerNotes.trim() ? `

Additional Notes:
${managerNotes.trim()}` : ''}`;

      let updatedNotes: string;
      if (existingNotes && existingNotes.trim()) {
        const trimmedExisting = existingNotes.trim();
        updatedNotes = `${trimmedExisting}\n\n--- PERFORMANCE REVIEW ---\n\n${newReviewNotes}`;
      } else {
        updatedNotes = newReviewNotes;
      }

      // Update employee with notes
      await putJsonAuth<{ ok?: boolean; employee?: { notes?: string }; error?: string }>(
        `/employees/${employee.id}`,
        { notes: updatedNotes }
      );
      }

      if (!editingReviewId) toast.success('Performance review saved.');
      closeReviewModal();
      
      // Reload employee data to refresh review logs
      await loadEmployee();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save review';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  }

  async function loadEmployee() {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Not logged in');
        setEmployee(null);
        setLoading(false);
        return;
      }

      let emp: any = null;
      
      try {
        const empData = await getJsonAuth<{ ok: boolean; employee: any }>(`/employees/${employeeId}`);
        if (empData.ok && empData.employee) {
          emp = empData.employee;
        }
      } catch (apiErr) {
        console.error('API call failed:', apiErr);
        toast.error('Employee not found');
        setEmployee(null);
        setLoading(false);
        return;
      }

      if (!emp) {
        toast.error('Employee not found');
        setEmployee(null);
        setLoading(false);
        return;
      }

      // Load all employees for navigation
      let allEmps: any[] = [];
      try {
        const allEmployeesData = await getJsonAuth<{ ok: boolean; items: any[] }>('/employees');
        if (allEmployeesData.ok && allEmployeesData.items) {
          allEmps = allEmployeesData.items.map((e: any) => ({
            id: e.id,
            name: e.name,
            email: e.email,
            phone: e.phone || null,
            department: e.department,
            position: e.position || null,
            employee_id: e.employee_id,
            hired_date: e.hired_date,
            status: e.status,
            dealership_id: e.dealership_id,
            is_active: e.is_active,
            performanceReviews: [],
            roleChanges: [],
          }));
        }
      } catch (err) {
        console.error('Failed to load all employees:', err);
      }
      setAllEmployees(allEmps);
        
      // Parse performance reviews from notes field
      let reviews: PerformanceReview[] = [];
      try {
        const notes = emp.notes || '';
        if (notes && notes.trim()) {
          reviews = parsePerformanceReviewsFromNotes(notes);
        }
      } catch (err) {
        console.error('Failed to parse performance reviews:', err);
        reviews = [];
      }

      // Load role changes
      let roleChanges: RoleChange[] = [];
      try {
        const historyData = await getJsonAuth<{ ok: boolean; items: any[] }>(`/role-history?employee_id=${employeeId}`);
        if (historyData.ok && historyData.items) {
          roleChanges = historyData.items.map((h: any) => ({
            id: h.id,
            date: h.timestamp || h.date,
            action: h.action,
            previousValue: h.previous_value || h.previousValue,
            newValue: h.new_value || h.newValue,
            changedBy: h.changed_by || h.changedBy || 'Unknown',
          }));
        }
      } catch (err) {
        console.error('Failed to load role changes:', err);
        roleChanges = [];
      }

      // Load performance review history
      let reviewHistory: ReviewLogItem[] = [];
      try {
        const reviewData = await getJsonAuth<{ ok?: boolean; items?: ReviewLogItem[] }>(`/employees/${employeeId}/performance-reviews`);
        if (reviewData.ok && reviewData.items) {
          reviewHistory = Array.isArray(reviewData.items) ? reviewData.items : [];
        } else if (reviewData.items) {
          reviewHistory = Array.isArray(reviewData.items) ? reviewData.items : [];
        }
        // Sort by review_date descending (newest first) to ensure newest is at index 0
        // Also use created_at as fallback if review_date is not available, or id as last resort
        reviewHistory.sort((a, b) => {
          const dateA = a.review_date ? new Date(a.review_date).getTime() : (a.created_at ? new Date(a.created_at).getTime() : (a.id || 0));
          const dateB = b.review_date ? new Date(b.review_date).getTime() : (b.created_at ? new Date(b.created_at).getTime() : (b.id || 0));
          // If dates are equal or both missing, sort by ID descending (higher ID = newer)
          if (dateA === dateB) {
            return (b.id || 0) - (a.id || 0);
          }
          return dateB - dateA; // Descending order (newest first)
        });
      } catch (err) {
        console.error('Failed to load review history:', err);
        reviewHistory = [];
      }
      setReviewLogs(reviewHistory);

      const employeeData: EmployeeProfile = {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone || null,
        department: emp.department,
        position: emp.position || null,
        employee_id: emp.employee_id,
        hired_date: emp.hired_date,
        status: emp.status,
        dealership_id: emp.dealership_id,
        is_active: emp.is_active,
        performanceReviews: reviews,
        roleChanges: roleChanges,
        gender: emp.gender?.trim() || undefined,
        date_of_birth: emp.date_of_birth || undefined,
        address: emp.address?.trim() || undefined,
        university: emp.university?.trim() || undefined,
        degree: emp.degree?.trim() || undefined,
        referral: emp.referral?.trim() || undefined,
      };
      setEmployee(employeeData);
      const sortedIds = allEmps.map(e => e.id).sort((a, b) => a - b);
      setCurrentEmployeeIndex(sortedIds.indexOf(employeeId));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load employee';
      toast.error(errorMsg);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }

  function openEditPersonal() {
    if (!employee) return;
    
    // Parse name into first and last name
    const nameParts = employee.name.split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' ') || '');
    
    setEditEmail(employee.email || '');
    setEditPhone(employee.phone || '');
    setEditAddress(employee.address || '');
    setEditDateOfBirth(employee.date_of_birth || '');
    setEditUniversity(employee.university || '');
    setEditDegree(employee.degree || '');
    setEditDepartment(employee.department || '');
    setEditPosition(employee.position || '');
    setEditEmployeeId(employee.employee_id || '');
    setEditStatus(employee.status || '');
    setEditHiredDate(employee.hired_date || '');
    
    // Parse referrals
    const parsedReferrals = parseReferrals(employee.referral);
    if (parsedReferrals.length > 0) {
      const referralsArray = parsedReferrals.map(ref => {
        const nameParts = ref.name.split(' ');
        return {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phone: ref.phone || '',
          email: ref.email || '',
          relationship: ref.relationship || '',
        };
      });
      setEditReferrals(referralsArray);
    } else {
      setEditReferrals([]);
    }
    
    setShowEditPersonal(true);
  }

  async function saveEditPersonal() {
    if (!employee) return;
    setSavingPersonal(true);
    try {
      // Format referrals: combine multiple referrals into a single string
      let referral = null;
      if (editReferrals.length > 0) {
        const referralStrings = editReferrals
          .filter(ref => ref.firstName.trim() || ref.lastName.trim() || ref.phone.trim() || ref.email.trim())
          .map(ref => {
            const nameParts = [];
            if (ref.firstName.trim()) nameParts.push(ref.firstName.trim());
            if (ref.lastName.trim()) nameParts.push(ref.lastName.trim());
            const name = nameParts.length > 0 ? nameParts.join(' ') : '';
            
            const infoParts = [];
            if (ref.relationship.trim()) infoParts.push(`Relationship: ${ref.relationship.trim()}`);
            if (ref.phone.trim()) infoParts.push(`Phone: ${ref.phone.trim()}`);
            if (ref.email.trim()) infoParts.push(`Email: ${ref.email.trim()}`);
            const info = infoParts.length > 0 ? ` - ${infoParts.join(', ')}` : '';
            
            return name + info;
          })
          .filter(s => s.length > 0);
        referral = referralStrings.length > 0 ? referralStrings.join('; ') : null;
      }
      
      // Combine first and last name
      const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
      
      const body: { 
        name?: string;
        email?: string;
        phone?: string;
        address?: string | null;
        date_of_birth?: string | null;
        university?: string | null;
        degree?: string | null;
        referral?: string | null;
        department?: string;
        position?: string | null;
        employee_id?: string | null;
        status?: string | null;
        hired_date?: string | null;
      } = {
        name: fullName || undefined,
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || null,
        date_of_birth: editDateOfBirth.trim() || null,
        university: editUniversity.trim() || null,
        degree: editDegree.trim() || null,
        referral: referral || null,
        department: editDepartment.trim() || undefined,
        position: editPosition.trim() || null,
        employee_id: editEmployeeId.trim() || null,
        status: editStatus.trim() || null,
        hired_date: editHiredDate.trim() || null,
      };
      // Check if position has changed
      const previousPosition = employee.position || 'N/A';
      const newPosition = editPosition.trim() || null;
      const positionChanged = previousPosition !== newPosition;

      const data = await putJsonAuth<{ ok: boolean; employee: any }>(`/employees/${employee.id}`, body);
      if (data.employee) {
        const emp = data.employee;
        setEmployee({
          ...employee,
          name: emp.name || employee.name,
          email: emp.email || employee.email,
          phone: emp.phone || employee.phone,
          address: emp.address?.trim() || undefined,
          date_of_birth: emp.date_of_birth || undefined,
          university: emp.university?.trim() || undefined,
          degree: emp.degree?.trim() || undefined,
          referral: emp.referral?.trim() || undefined,
          department: emp.department || employee.department,
          position: emp.position || employee.position,
          employee_id: emp.employee_id || employee.employee_id,
          status: emp.status || employee.status,
          hired_date: emp.hired_date || employee.hired_date,
        });
      }

      // Create role history entry if position changed
      if (positionChanged) {
        try {
          const token = getToken();
          if (token) {
            // Get current user info for role history
            let changedBy = 'Unknown';
            try {
              const userData = await getCurrentUser();
              changedBy = userData?.user?.full_name || userData?.user?.email || 'Unknown';
            } catch (err) {
              console.error('Failed to get user info:', err);
            }

            // Create role history entry using fetch directly (like candidate profile does)
            const historyRes = await fetch(`${API_BASE}/role-history`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                employee_id: employee.id,
                type: 'employee',
                action: 'Role Changed',
                previousValue: previousPosition,
                newValue: newPosition || 'N/A',
                changedBy: changedBy,
                timestamp: new Date().toISOString(),
              }),
            });

            if (!historyRes.ok) {
            }
          }
        } catch (err) {
          console.error('Failed to create role history entry:', err);
          // Don't fail the whole operation if role history fails
        }
      }

      setShowEditPersonal(false);
      toast.success('Information updated');
      // Reload employee data to reflect all changes
      await loadEmployee();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSavingPersonal(false);
    }
  }

  async function handleDeleteEmployee() {
    if (!employee) return;
    
    // Block corporate users from deleting
    if (role === 'corporate') {
      toast.error('Corporate users have view-only access. Cannot delete employees.');
      return;
    }
    
    if (!confirm(`Are you sure you want to remove "${employee.name}" from the system?\n\nThis will permanently delete the employee record. This action cannot be undone.\n\nThis will not affect turnover or other metrics (only terminated/resigned count toward turnover).`)) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }
      
      await deleteJsonAuth(`/employees/${employee.id}`);
      toast.success('Employee removed successfully');
      
      // Redirect to employees list
      setTimeout(() => {
        router.push('/employees');
      }, 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  }

  const allEmployeeIds = allEmployees.map(e => e.id).sort((a, b) => a - b);
  const totalEmployees = allEmployeeIds.length;

  const navigateEmployee = (direction: 'prev' | 'next') => {
    const currentIndex = allEmployeeIds.indexOf(employeeId);
    if (direction === 'prev' && currentIndex > 0) {
      router.push(`/employees/${allEmployeeIds[currentIndex - 1]}`);
    } else if (direction === 'next' && currentIndex < allEmployeeIds.length - 1) {
      router.push(`/employees/${allEmployeeIds[currentIndex + 1]}`);
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="text-center py-12">
              <p style={{ color: '#6B7280' }}>Loading employee...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  if (!employee) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="text-center py-12">
              <p style={{ color: '#6B7280' }}>Employee not found</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  const initials = employee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Combine and sort events (performance reviews and role changes)
  const allEvents = [
    ...employee.performanceReviews.map(review => ({
      type: 'review' as const,
      date: review.date,
      title: `Performance Review ${review.id} Completed`,
      description: `Performance Review ${review.id} completed by ${review.reviewer}`,
      reviewer: review.reviewer,
      score: review.overallScore,
      review: review,
    })),
    ...employee.roleChanges.map(change => ({
      type: 'role-change' as const,
      date: change.date,
      title: `Role Change: ${change.action}`,
      description: `Changed from ${change.previousValue} to ${change.newValue}`,
      changedBy: change.changedBy,
      change: change,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header with Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/employees')}
                  className="cursor-pointer p-2 rounded-lg transition-all hover:bg-gray-100"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="Back to Employees"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateEmployee('prev')}
                  disabled={currentEmployeeIndex === 0}
                  className="cursor-pointer p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="Previous Employee"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm px-2" style={{ color: '#6B7280' }}>
                  {currentEmployeeIndex + 1} / {totalEmployees}
                </span>
                <button
                  onClick={() => navigateEmployee('next')}
                  disabled={currentEmployeeIndex >= totalEmployees - 1}
                  className="cursor-pointer p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="Next Employee"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Employee Info Header */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
              >
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-1">
                  <h1 className="text-3xl font-bold" style={{ color: '#232E40' }}>{employee.name}</h1>
                  {(() => {
                    const status = employee.status || 'Active';
                    const getStatusColors = (status: string) => {
                      switch (status) {
                        case 'Full-Time':
                        case 'Active':
                          return { bg: '#D1FAE5', text: '#065F46' };
                        case 'Part-time':
                          return { bg: '#DBEAFE', text: '#1E40AF' };
                        case 'Intern':
                          return { bg: '#FEF3C7', text: '#92400E' };
                        case 'Inactive':
                        case 'Terminated':
                          return { bg: '#FEE2E2', text: '#991B1B' };
                        default:
                          return { bg: '#F3F4F6', text: '#374151' };
                      }
                    };
                    const colors = getStatusColors(status);
                    return (
                      <div className="px-3 py-1 rounded-lg text-sm font-semibold" style={{ backgroundColor: colors.bg, color: colors.text }}>
                        Status: {status}
                      </div>
                    );
                  })()}
                  {employee.performanceReviews.length > 0 && (
                    <div className="px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1" style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}>
                      <span>Average Score:</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#FFFFFF' }}>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>
                        {(employee.performanceReviews.reduce((sum, r) => sum + r.overallScore, 0) / employee.performanceReviews.length).toFixed(1)} / 10
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm" style={{ color: '#6B7280' }}>
                  <span>ID: {employee.employee_id || `#${employee.id.toString().padStart(8, '0')}`}</span>
                  <span>Department: {employee.department}</span>
                  <span>Role: {employee.position || 'N/A'}</span>
                  {employee.hired_date && <span>Hired: {new Date(employee.hired_date).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
            {['Performance Reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                className="cursor-pointer px-4 py-3 text-sm font-semibold transition-all relative"
                style={{
                  color: activeTab === tab.toLowerCase().replace(' ', '-') ? '#4D6DBE' : '#6B7280',
                }}
              >
                {tab}
                {activeTab === tab.toLowerCase().replace(' ', '-') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#4D6DBE' }}></div>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-4" style={{ overflow: 'visible' }}>
              {activeTab === 'performance-reviews' && (
                <>
                  {/* Add New Performance Review */}
                  <button
                    onClick={openReviewModal}
                    className="cursor-pointer w-full rounded-xl p-5 border-2 border-dashed transition-all hover:border-solid hover:bg-gray-50"
                    style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-semibold">Add New Performance Review</span>
                    </div>
                  </button>
                  
                  {/* Performance Review History */}
                  <div className="space-y-4" style={{ overflow: 'visible' }}>
                    {reviewLogs.length === 0 ? (
                      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                        <p className="text-sm" style={{ color: '#6B7280' }}>No performance reviews recorded yet.</p>
                      </div>
                    ) : (
                      // Reviews are already sorted newest first, so index 0 = newest review
                      // Numbering: newest gets highest number (e.g., if 3 reviews, newest = Review 3, oldest = Review 1)
                      reviewLogs.map((log, index) => {
                        const reviewNumber = reviewLogs.length - index; // Newest review (index 0) gets highest number
                        const overallScore = typeof log.overall_rating === 'number' ? log.overall_rating : 0;
                        const scoreOutOf100 = (overallScore / 5) * 100;
                        
                        return (
                          <div
                            key={log.id || index}
                            className="rounded-xl p-6 relative"
                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                          >
                            {/* Header with icon, title, and date */}
                            <div className="flex items-start gap-4 mb-6">
                              <div className="flex-shrink-0">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: '#4D6DBE' }}
                                >
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold mb-1" style={{ color: '#232E40' }}>
                                      Performance Review {reviewNumber} Completed
                                    </h3>
                                    <p className="text-sm" style={{ color: '#6B7280' }}>
                                      Performance Review {reviewNumber} completed by {log.reviewer || log.reviewer_name || 'Unknown Reviewer'}
                                    </p>
                                  </div>
                                  <div className="flex flex-shrink-0 items-center gap-2">
                                    {log.review_date && (
                                      <span className="text-sm" style={{ color: '#6B7280' }}>
                                        {new Date(log.review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    )}
                                    {role !== 'corporate' && log.id && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => openEditReviewModal(log)}
                                          className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                          title="Edit review"
                                          style={{ border: '1px solid #E5E7EB' }}
                                        >
                                          <svg className="w-4 h-4" style={{ color: '#4D6DBE' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteReview(log.id!)}
                                          className="cursor-pointer p-2 rounded-lg hover:bg-red-50 transition-colors"
                                          title="Delete review"
                                          style={{ border: '1px solid #FECACA' }}
                                        >
                                          <svg className="w-4 h-4" style={{ color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Overall Score - Side by side format */}
                            <div className="mb-6 flex flex-wrap gap-4 items-center">
                              <div className="inline-flex items-center px-4 py-3 rounded-lg" style={{ backgroundColor: '#E0E7FF', border: '1px solid #C7D2FE' }}>
                                <span className="text-base font-semibold">
                                  <span style={{ color: '#374151' }}>Overall Score: </span>
                                  <span style={{ color: '#4D6DBE', fontWeight: 'bold' }}>{overallScore.toFixed(1)}/5 ({scoreOutOf100.toFixed(0)}/100)</span>
                                </span>
                              </div>
                            </div>

                            {/* Notes - Always visible */}
                            {log.notes && log.notes.trim() && (
                              <div className="mb-6">
                                <h4 className="text-sm font-bold mb-2" style={{ color: '#232E40' }}>Manager Notes:</h4>
                                <div className="p-4 rounded-lg text-sm whitespace-pre-wrap" style={{ backgroundColor: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' }}>
                                  {log.notes}
                                </div>
                              </div>
                            )}

                            {/* Expandable section for Category Scores, Strengths, and Improvements */}
                            {(log.job_knowledge || log.work_quality || log.service_performance || log.teamwork || log.attendance || 
                                (log.strengths && log.strengths.length > 0) || (log.improvements && log.improvements.length > 0)) && (
                              <>
                                <button
                                  onClick={() => setExpandedReviewIndex(expandedReviewIndex === index ? null : index)}
                                  className="mb-4 flex items-center gap-2 text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{ color: '#4D6DBE' }}
                                >
                                  {expandedReviewIndex === index ? 'Show Less' : 'Show More Details'}
                                  <svg 
                                    className={`w-4 h-4 transition-transform ${expandedReviewIndex === index ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {expandedReviewIndex === index && (
                                  <div>
                                    {/* Category Scores */}
                                    {(log.job_knowledge || log.work_quality || log.service_performance || log.teamwork || log.attendance) && (
                                      <div className="mb-6">
                                        <h4 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Category Scores</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          {[
                                            { key: 'job_knowledge', label: 'Job Knowledge & Skills', value: log.job_knowledge },
                                            { key: 'work_quality', label: 'Work Quality', value: log.work_quality },
                                            { key: 'service_performance', label: 'Service Performance', value: log.service_performance },
                                            { key: 'teamwork', label: 'Teamwork & Collaboration', value: log.teamwork },
                                            { key: 'attendance', label: 'Attendance & Punctuality', value: log.attendance },
                                          ].filter(cat => cat.value != null).map((cat) => (
                                            <div key={cat.key} className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                              <div className="flex items-start justify-between gap-4 mb-2">
                                                <span className="text-sm font-semibold flex-1" style={{ color: '#232E40' }}>{cat.label}</span>
                                                <span className="text-sm font-bold shrink-0" style={{ color: '#4D6DBE' }}>{cat.value}/5</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Strengths */}
                                    {(log.strengths && log.strengths.length > 0) && (
                                      <div className="mb-6">
                                        <h4 className="text-sm font-bold mb-3" style={{ color: '#232E40' }}>Strengths:</h4>
                                        <ul className="list-disc list-inside space-y-2">
                                          {Array.isArray(log.strengths) ? log.strengths.map((strength: string, idx: number) => (
                                            <li key={idx} className="text-sm py-1.5 px-3 rounded-md" style={{ color: '#065F46', backgroundColor: '#D1FAE5' }}>
                                              {strength}
                                            </li>
                                          )) : (
                                            <li className="text-sm py-1.5 px-3 rounded-md" style={{ color: '#065F46', backgroundColor: '#D1FAE5' }}>
                                              {String(log.strengths)}
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Areas for Improvement */}
                                    {(log.improvements && log.improvements.length > 0) && (
                                      <div className="mb-6">
                                        <h4 className="text-sm font-bold mb-3" style={{ color: '#232E40' }}>Areas for Improvement:</h4>
                                        <ul className="list-disc list-inside space-y-2">
                                          {Array.isArray(log.improvements) ? log.improvements.map((improvement: string, idx: number) => (
                                            <li key={idx} className="text-sm py-1.5 px-3 rounded-md" style={{ color: '#991B1B', backgroundColor: '#FEE2E2' }}>
                                              {improvement}
                                            </li>
                                          )) : (
                                            <li className="text-sm py-1.5 px-3 rounded-md" style={{ color: '#991B1B', backgroundColor: '#FEE2E2' }}>
                                              {String(log.improvements)}
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Personal & Education Information */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold" style={{ color: '#232E40' }}>Information</h3>
                  <button
                    type="button"
                    onClick={openEditPersonal}
                    disabled={role === 'corporate'}
                    className="text-xs font-medium cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: '#4D6DBE' }}
                  >
                    Edit
                  </button>
                </div>
                
                {/* Contact Section */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Contact</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Email</span>
                        <span className="text-sm break-words" style={{ color: '#374151' }}>{employee.email}</span>
                      </div>
                    </div>
                    {employee.phone && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Phone</span>
                          <span className="text-sm" style={{ color: '#374151' }}>{employee.phone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Section */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Personal</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Location</span>
                        <span className={`text-sm break-words ${employee.address && employee.address !== 'Not Provided' ? '' : 'italic'}`} style={{ color: employee.address && employee.address !== 'Not Provided' ? '#374151' : '#9CA3AF' }}>
                          {employee.address && employee.address !== 'Not Provided' ? employee.address : 'No data'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Date of Birth</span>
                        <span className={`text-sm ${employee.date_of_birth ? '' : 'italic'}`} style={{ color: employee.date_of_birth ? '#374151' : '#9CA3AF' }}>
                          {employee.date_of_birth 
                            ? new Date(employee.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'No data'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Experience Section */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Experience</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>School</span>
                        <span className={`text-sm break-words ${employee.university && employee.university !== 'Not Provided' ? '' : 'italic'}`} style={{ color: employee.university && employee.university !== 'Not Provided' ? '#374151' : '#9CA3AF' }}>
                          {employee.university && employee.university !== 'Not Provided' ? employee.university : 'No data'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v9M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Degree</span>
                        <span className={`text-sm break-words ${employee.degree && employee.degree !== 'Not Provided' ? '' : 'italic'}`} style={{ color: employee.degree && employee.degree !== 'Not Provided' ? '#374151' : '#9CA3AF' }}>
                          {employee.degree && employee.degree !== 'Not Provided' ? employee.degree : 'No data'}
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const parsedReferrals = parseReferrals(employee.referral);
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Referrals</span>
                          </div>
                          {parsedReferrals.length > 0 ? (
                            <div className="space-y-2.5">
                              {parsedReferrals.map((ref, idx) => (
                                <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                  <div className="font-medium text-sm mb-2" style={{ color: '#232E40' }}>{ref.name}</div>
                                  <div className="space-y-1.5">
                                    {ref.relationship && (
                                      <div className="flex items-center gap-2 text-xs">
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#4D6DBE' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="font-medium" style={{ color: '#4D6DBE' }}>{ref.relationship}</span>
                                      </div>
                                    )}
                                    {ref.phone && (
                                      <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span>{ref.phone}</span>
                                      </div>
                                    )}
                                    {ref.email && (
                                      <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="break-words">{ref.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm italic" style={{ color: '#9CA3AF' }}>No data</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>


              {/* Edit Personal & Education Info modal */}
              {showEditPersonal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => !savingPersonal && setShowEditPersonal(false)}>
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#4D6DBE' }}>
                      <h3 className="text-sm font-bold" style={{ color: '#FFFFFF' }}>Edit Information</h3>
                    </div>
                    <div className="p-5 overflow-y-auto flex-1">
                      <div className="space-y-4">
                        {/* Basic Information Section */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Basic Information</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>First Name *</label>
                                <input
                                  type="text"
                                  value={editFirstName}
                                  onChange={(e) => setEditFirstName(e.target.value)}
                                  required
                                  className="w-full px-3 py-2 text-sm rounded-lg border"
                                  style={{ borderColor: '#D1D5DB', color: '#374151' }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Last Name *</label>
                                <input
                                  type="text"
                                  value={editLastName}
                                  onChange={(e) => setEditLastName(e.target.value)}
                                  required
                                  className="w-full px-3 py-2 text-sm rounded-lg border"
                                  style={{ borderColor: '#D1D5DB', color: '#374151' }}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Employee ID</label>
                              <input
                                type="text"
                                value={editEmployeeId}
                                onChange={(e) => setEditEmployeeId(e.target.value)}
                                placeholder="e.g., EMP-12345"
                                className="w-full px-3 py-2 text-sm rounded-lg border"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Position/Role *</label>
                              <div className="relative">
                                <select
                                  value={editPosition}
                                  onChange={(e) => setEditPosition(e.target.value)}
                                  required
                                  className="w-full px-3 py-2 pr-8 text-sm rounded-lg border appearance-none cursor-pointer"
                                  style={{ borderColor: '#D1D5DB', color: '#374151' }}
                                >
                                  <option value="">Select Position</option>
                                  {JOB_ROLES.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Department *</label>
                              <div className="relative">
                                <select
                                  value={editDepartment}
                                  onChange={(e) => setEditDepartment(e.target.value)}
                                  required
                                  className="w-full px-3 py-2 pr-8 text-sm rounded-lg border appearance-none cursor-pointer"
                                  style={{ borderColor: '#D1D5DB', color: '#374151' }}
                                >
                                  <option value="">Select Department</option>
                                  {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Status *</label>
                                <div className="relative">
                                  <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 pr-8 text-sm rounded-lg border appearance-none cursor-pointer"
                                    style={{ borderColor: '#D1D5DB', color: '#374151' }}
                                  >
                                    <option value="">Select Status</option>
                                    {statuses.map(status => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </select>
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Hired Date</label>
                                <input
                                  type="date"
                                  value={editHiredDate}
                                  onChange={(e) => setEditHiredDate(e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border"
                                  style={{ borderColor: '#D1D5DB', color: '#374151' }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contact Section */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Contact</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Email</label>
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Phone</label>
                              <input
                                type="tel"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Personal Section */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Personal</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Location</label>
                              <input
                                type="text"
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                placeholder="Address"
                                className="w-full px-3 py-2 text-sm rounded-lg border"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Date of Birth</label>
                              <input
                                type="date"
                                value={editDateOfBirth}
                                onChange={(e) => setEditDateOfBirth(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Experience Section */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Experience</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>School/University</label>
                              <input
                                type="text"
                                value={editUniversity}
                                onChange={(e) => setEditUniversity(e.target.value)}
                                placeholder="School or University name"
                                className="w-full px-3 py-2 text-sm rounded-lg border"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Degree</label>
                              <input
                                type="text"
                                value={editDegree}
                                onChange={(e) => setEditDegree(e.target.value)}
                                placeholder="Degree or field of study"
                                className="w-full px-3 py-2 text-sm rounded-lg border"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium" style={{ color: '#6B7280' }}>Referrals</label>
                                <button
                                  type="button"
                                  onClick={() => setEditReferrals([...editReferrals, { firstName: '', lastName: '', phone: '', email: '', relationship: '' }])}
                                  className="text-xs font-semibold cursor-pointer px-2 py-1 rounded transition-all hover:opacity-90"
                                  style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
                                >
                                  + Add Referral
                                </button>
                              </div>
                              {editReferrals.length === 0 ? (
                                <p className="text-xs" style={{ color: '#9CA3AF' }}>No referrals added. Click "Add Referral" to add one.</p>
                              ) : (
                                <div className="space-y-2">
                                  {editReferrals.map((referral, index) => (
                                    <div key={index} className="p-3 rounded-lg border" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                                      <div className="flex items-start justify-between mb-2">
                                        <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Referral {index + 1}</span>
                                        <button
                                          type="button"
                                          onClick={() => setEditReferrals(editReferrals.filter((_, i) => i !== index))}
                                          className="cursor-pointer p-1 rounded hover:bg-gray-200 transition-colors"
                                          style={{ color: '#6B7280' }}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input
                                          type="text"
                                          value={referral.firstName}
                                          onChange={(e) => {
                                            const updated = [...editReferrals];
                                            updated[index].firstName = e.target.value;
                                            setEditReferrals(updated);
                                          }}
                                          placeholder="First Name"
                                          className="w-full px-3 py-2 text-xs rounded-lg border"
                                          style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                                        />
                                        <input
                                          type="text"
                                          value={referral.lastName}
                                          onChange={(e) => {
                                            const updated = [...editReferrals];
                                            updated[index].lastName = e.target.value;
                                            setEditReferrals(updated);
                                          }}
                                          placeholder="Last Name"
                                          className="w-full px-3 py-2 text-xs rounded-lg border"
                                          style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                                        />
                                      </div>
                                      <div className="mb-2">
                                        <input
                                          type="text"
                                          value={referral.relationship}
                                          onChange={(e) => {
                                            const updated = [...editReferrals];
                                            updated[index].relationship = e.target.value;
                                            setEditReferrals(updated);
                                          }}
                                          placeholder="Relationship (e.g., Friend, Colleague, Family)"
                                          className="w-full px-3 py-2 text-xs rounded-lg border"
                                          style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="tel"
                                          value={referral.phone}
                                          onChange={(e) => {
                                            const updated = [...editReferrals];
                                            updated[index].phone = e.target.value;
                                            setEditReferrals(updated);
                                          }}
                                          placeholder="Phone Number"
                                          className="w-full px-3 py-2 text-xs rounded-lg border"
                                          style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                                        />
                                        <input
                                          type="email"
                                          value={referral.email}
                                          onChange={(e) => {
                                            const updated = [...editReferrals];
                                            updated[index].email = e.target.value;
                                            setEditReferrals(updated);
                                          }}
                                          placeholder="Email"
                                          className="w-full px-3 py-2 text-xs rounded-lg border"
                                          style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-6 mt-6 border-t" style={{ borderColor: '#FEE2E2' }}>
                          <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                            <h4 className="text-xs font-semibold mb-2" style={{ color: '#991B1B' }}>Danger Zone</h4>
                            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
                              Permanently remove this employee from the system. This action cannot be undone. Does not affect turnover (only terminated/resigned count).
                            </p>
                            <button
                              type="button"
                              onClick={handleDeleteEmployee}
                              disabled={savingPersonal || role === 'corporate'}
                              className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                              style={{ 
                                backgroundColor: '#FFFFFF', 
                                color: '#DC2626',
                                border: '1px solid #FCA5A5'
                              }}
                            >
                              Delete Employee
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t px-5 pb-5" style={{ borderColor: '#E5E7EB' }}>
                      <button
                        type="button"
                        onClick={() => !savingPersonal && setShowEditPersonal(false)}
                        className="flex-1 py-2 text-sm font-medium rounded-lg border cursor-pointer hover:bg-gray-50"
                        style={{ borderColor: '#D1D5DB', color: '#374151' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEditPersonal}
                        disabled={savingPersonal}
                        className="flex-1 py-2 text-sm font-semibold rounded-lg text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#4D6DBE' }}
                      >
                        {savingPersonal ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Review Modal */}
        {showReviewModal && employee && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeReviewModal();
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
              style={{ 
                width: '90%', 
                maxWidth: '700px', 
                maxHeight: '90vh',
                border: '1px solid #E5E7EB'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 px-6 py-4 rounded-t-xl" style={{ backgroundColor: '#4D6DBE' }}>
                <h2 className="text-xl font-bold text-white">{editingReviewId ? 'Edit Performance Review' : 'Employee Performance Review'}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
                
                {/* Employee Overview */}
                <div className="rounded-lg p-4 mb-6" style={{ border: '1px dashed #D1D5DB' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#232E40' }}>Employee Overview</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-base font-semibold" style={{ color: '#232E40' }}>{employee.name}</div>
                      <div className="text-sm" style={{ color: '#6B7280' }}>{employee.position || 'No position'}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>Date Hired</div>
                      <div className="text-sm" style={{ color: '#232E40' }}>
                        {employee.hired_date 
                          ? new Date(employee.hired_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                          : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#9CA3AF' }}>Review Date</label>
                      <input
                        type="date"
                        value={reviewDate || ''}
                        onChange={(e) => setReviewDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{ borderColor: '#E5E7EB', color: '#232E40' }}
                      />
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>Department</div>
                      <div className="text-sm" style={{ color: '#232E40' }}>{employee.department}</div>
                    </div>
                  </div>
                </div>

                {/* Rating Categories */}
                <div className="rounded-lg p-4 mb-6" style={{ border: '1px dashed #D1D5DB' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: '#232E40' }}>Rating Categories</h3>
                  
                  {[
                    { key: 'jobKnowledge', label: 'Job Knowledge & Skills' },
                    { key: 'workQuality', label: 'Work Quality' },
                    { key: 'servicePerformance', label: 'Service Performance' },
                    { key: 'teamwork', label: 'Teamwork & Collaboration' },
                    { key: 'attendance', label: 'Attendance & Punctuality' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between mb-3">
                      <span className="text-sm" style={{ color: '#374151' }}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>Weak</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRatings({ ...ratings, [key]: num })}
                              className="flex flex-col items-center"
                            >
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                                style={{
                                  borderColor: ratings[key as keyof typeof ratings] === num ? '#4D6DBE' : '#D1D5DB',
                                  backgroundColor: ratings[key as keyof typeof ratings] === num ? '#4D6DBE' : 'transparent',
                                }}
                              >
                                {ratings[key as keyof typeof ratings] === num && (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                              </div>
                              <span className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{num}</span>
                            </button>
                          ))}
                        </div>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>Strong</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Employee Skillset */}
                <div className="rounded-lg p-4 mb-6" style={{ border: '1px dashed #D1D5DB' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: '#232E40' }}>Employee Skillset</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Strengths</label>
                      <input
                        type="text"
                        value={strengthInput}
                        onChange={(e) => setStrengthInput(e.target.value)}
                        onKeyDown={handleAddStrength}
                        placeholder="Type here..."
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 mb-2"
                        style={{ border: '1px solid #D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                      />
                      <div className="space-y-1">
                        {strengths.map((strength, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeStrength(strength)}
                              className="text-xs hover:opacity-70"
                              style={{ color: '#6B7280' }}
                            >
                              ×
                            </button>
                            <span className="text-sm" style={{ color: '#374151' }}>{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Areas for Improvement */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Areas for Improvement</label>
                      <input
                        type="text"
                        value={improvementInput}
                        onChange={(e) => setImprovementInput(e.target.value)}
                        onKeyDown={handleAddImprovement}
                        placeholder="Type here..."
                        className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 mb-2"
                        style={{ border: '1px solid #D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                      />
                      <div className="space-y-1">
                        {improvements.map((improvement, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeImprovement(improvement)}
                              className="text-xs hover:opacity-70"
                              style={{ color: '#6B7280' }}
                            >
                              ×
                            </button>
                            <span className="text-sm" style={{ color: '#374151' }}>{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager Feedback & Notes */}
                <div className="rounded-lg p-4 mb-6" style={{ border: '1px dashed #D1D5DB' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#232E40' }}>Manager Feedback & Notes</h3>
                  <textarea
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="Type here..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 resize-none"
                    style={{ border: '1px solid #D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    className="cursor-pointer px-6 py-2 text-sm font-semibold rounded-lg transition-all hover:bg-gray-50"
                    style={{ color: '#4D6DBE' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="cursor-pointer px-6 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#4D6DBE' }}
                  >
                    {submittingReview ? 'Saving...' : editingReviewId ? 'Update' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}

