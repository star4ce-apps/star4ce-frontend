'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth, postJsonAuth, putJsonAuth } from '@/lib/http';

import toast from 'react-hot-toast';

type InterviewHistory = {
  id: string;
  date: string;
  title: string;
  time: string;
  interviewer: string;
  category: string;
  score: number;
  hiringManager: string;
};

type CategoryScore = {
  category: string;
  score: string; // e.g., "8/10"
  weighted?: string; // e.g., "2.00"
  comment?: string;
};

type ProcessEvent = {
  type: 'added' | 'interview' | 'awaiting' | 'status';
  title: string;
  description: string;
  date?: string;
  manager?: string;
  score?: number; // Sum score out of 100
  recommendation?: string;
  categoryScores?: CategoryScore[];
  additionalNotes?: string;
  details?: string;
};

type CandidateProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  birthday: string;
  address: string;
  overallScore: number;
  stage: string;
  origin: string;
  appliedDate: string;
  jobPosition: string;
  university?: string;
  degree?: string;
  referral?: string;
  interviewHistory: InterviewHistory[];
  notes: string;
  resumeUrl?: string | null;
  dealership_id?: number | null;
  dateOfBirthRaw?: string | null;
};

function formatBirthday(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return 'Not Provided';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr; // fallback to raw string
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CandidateProfilePage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id ? parseInt(params.id as string) : NaN;
  const [activeTab, setActiveTab] = useState('hiring-process');
  const [hiringDecision, setHiringDecision] = useState<'continue' | 'stop' | null>(null);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allCandidates, setAllCandidates] = useState<CandidateProfile[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resumeBlobUrlRef = useRef<string | null>(null);
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);
  const [resumePreviewIsPdf, setResumePreviewIsPdf] = useState(false);
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);
  const [expandedInterviewIndex, setExpandedInterviewIndex] = useState<number | null>(null);
  const [showEditPersonal, setShowEditPersonal] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editDegreeLevel, setEditDegreeLevel] = useState('');
  const [editMajor, setEditMajor] = useState('');
  const [editReferrals, setEditReferrals] = useState<Array<{ firstName: string; lastName: string; phone: string; email: string; relationship: string }>>([]);
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Parse referral string into structured format
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

  useEffect(() => {
    // Load user role
    async function loadUserRole() {
      try {
        const token = getToken();
        if (!token) return;
        
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setRole(data.user?.role || data.role || null);
        }
      } catch (err) {
        // Silently fail - role will remain null
      }
    }
    
    loadUserRole();
    loadCandidates();
    
    // Reload candidate data when page gains focus (e.g., when navigating back)
    const handleFocus = () => {
      if (candidateId && !isNaN(candidateId)) {
        loadCandidates().then(() => {
          // loadCandidate will be called automatically when allCandidates updates
        });
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Cleanup timeout on unmount
    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (isNaN(candidateId) || !candidateId) {
      setCandidate(null);
      setLoading(false);
      return;
    }
    if (allCandidates.length > 0) {
      loadCandidate();
    }
  }, [candidateId, allCandidates]);

  // Reload candidate when page becomes visible (e.g., when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && candidateId && !isNaN(candidateId)) {
        // Reload candidate data when page becomes visible
        loadCandidates().then(() => {
          loadCandidate();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [candidateId]);

  // Fetch resume with auth for preview (iframe cannot send Authorization header)
  useEffect(() => {
    if (activeTab !== 'resume' || !candidate?.resumeUrl) {
      if (resumeBlobUrlRef.current) {
        URL.revokeObjectURL(resumeBlobUrlRef.current);
        resumeBlobUrlRef.current = null;
      }
      setResumePreviewUrl(null);
      setResumePreviewIsPdf(false);
      setResumePreviewLoading(false);
      return;
    }
    let cancelled = false;
    setResumePreviewLoading(true);
    if (resumeBlobUrlRef.current) {
      URL.revokeObjectURL(resumeBlobUrlRef.current);
      resumeBlobUrlRef.current = null;
    }
    setResumePreviewUrl(null);
    const token = getToken();
    if (!token) {
      setResumePreviewLoading(false);
      return;
    }
    fetch(candidate.resumeUrl!, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load resume');
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        setResumePreviewIsPdf(contentType.includes('pdf'));
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) {
          URL.revokeObjectURL(URL.createObjectURL(blob));
          return;
        }
        const url = URL.createObjectURL(blob);
        resumeBlobUrlRef.current = url;
        setResumePreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load resume');
      })
      .finally(() => {
        if (!cancelled) setResumePreviewLoading(false);
      });
    return () => {
      cancelled = true;
      if (resumeBlobUrlRef.current) {
        URL.revokeObjectURL(resumeBlobUrlRef.current);
        resumeBlobUrlRef.current = null;
      }
    };
  }, [activeTab, candidate?.id, candidate?.resumeUrl]);

  async function loadCandidates() {
    try {
      const token = getToken();
      if (!token) return;

      // Use getJsonAuth to include X-Dealership-Id header for corporate users
      const data = await getJsonAuth<{ ok: boolean; items: CandidateProfile[] }>('/candidates');
      if (data.ok && data.items) {
        const candidates = (data.items || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          gender: c.gender?.trim() || 'Not Provided',
          birthday: c.date_of_birth ? formatBirthday(c.date_of_birth) : 'Not Provided',
          address: c.address?.trim() || 'Not Provided',
          overallScore: c.score ? c.score / 10 : 0,
          stage: c.status || 'Awaiting',
          origin: 'Career Site',
          appliedDate: new Date(c.applied_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          jobPosition: c.position,
          university: c.university?.trim() || 'Not Provided',
          degree: c.degree?.trim() || 'Not Provided',
          referral: c.referral?.trim() || 'Not Provided',
          interviewHistory: [],
          notes: c.notes || '',
        }));
        setAllCandidates(candidates);
      }
    } catch (err) {
      // Silently fail - candidates list will remain empty
      // Error will be shown when trying to load specific candidate
    }
  }

  async function loadCandidate() {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Not logged in');
        setLoading(false);
        return;
      }

      // Use getJsonAuth to include X-Dealership-Id header for corporate users
      const data = await getJsonAuth<{ ok: boolean; candidate: any }>(`/candidates/${candidateId}`);
      if (data.ok && data.candidate) {
        const c = data.candidate;
        
        const candidateData: CandidateProfile = {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          gender: c.gender?.trim() || 'Not Provided',
          birthday: c.date_of_birth ? formatBirthday(c.date_of_birth) : 'Not Provided',
          address: c.address?.trim() || 'Not Provided',
          overallScore: c.score !== null && c.score !== undefined ? c.score / 10 : 0,
          stage: c.status || 'Awaiting',
          origin: 'Career Site',
          appliedDate: new Date(c.applied_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          jobPosition: c.position,
          university: c.university?.trim() || 'Not Provided',
          degree: c.degree?.trim() || 'Not Provided',
          referral: c.referral?.trim() || 'Not Provided',
          interviewHistory: [],
          notes: c.notes || '',
          resumeUrl: c.resume_url ? `${API_BASE}${c.resume_url}` : undefined,
          dealership_id: c.dealership_id ?? undefined,
          dateOfBirthRaw: c.date_of_birth ?? undefined,
        };
        setCandidate(candidateData);
        const sortedIds = allCandidates.map(c => c.id).sort((a, b) => a - b);
        setCurrentCandidateIndex(sortedIds.indexOf(candidateId));
      } else {
        toast.error('Candidate not found or access denied');
        setCandidate(null);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load candidate';
      // Check if it's a permission error
      if (errorMsg.includes('403') || errorMsg.includes('forbidden') || errorMsg.includes('insufficient role')) {
        toast.error('You do not have permission to view this candidate');
      } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        toast.error('Candidate not found');
      } else {
        toast.error(errorMsg);
      }
      setCandidate(null);
    } finally {
      setLoading(false);
    }
  }

  async function updateCandidate(data: Partial<any>) {
    if (!candidate) return;
    
    // Block corporate users from updating
    if (role === 'corporate') {
      toast.error('Corporate users have view-only access. Cannot modify candidates.');
      return;
    }
    
    setSaving(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }

      // Use postJsonAuth to include X-Dealership-Id header for corporate users
      // postJsonAuth throws on error, so if we get here, it succeeded
      await postJsonAuth(`/candidates/${candidateId}`, data, { method: 'PUT' });

      // Reload candidate data
      await loadCandidate();
      toast.success('Candidate updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update candidate';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(newStatus: string) {
    if (!candidate) return;
    updateCandidate({ status: newStatus });
    setCandidate({ ...candidate, stage: newStatus });
  }

  async function handleDenyApplication() {
    if (!candidate) return;
    
    // Only admin and hiring_manager can deny (reject) applications
    if (role !== 'admin' && role !== 'hiring_manager') {
      toast.error('Only admin and hiring manager can deny applications.');
      return;
    }

    // Confirm action
    if (!confirm('Are you sure you want to deny this application?\n\nThis will:\n- Permanently reject the candidate\n- Update their status to "Denied"\n- You will no longer be able to retrieve their information\n\nThis action cannot be undone. Do you want to proceed?')) {
      return;
    }

    setSaving(true);
    try {
      await updateCandidate({ status: 'Denied' });
      toast.success('Application denied successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deny application';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleConvertToEmployee() {
    if (!candidate) return;
    
    // Only admin and hiring_manager can board (accept) candidates as employees
    if (role !== 'admin' && role !== 'hiring_manager') {
      toast.error('Only admin and hiring manager can board candidates as employees.');
      return;
    }

    // Confirm action
    if (!confirm('Are you sure you want to accept this candidate?\n\nThis will:\n- Move them to the employee list\n- Permanently delete their resume\n- Remove them from the candidate list\n\nThis action cannot be undone. Do you want to proceed?')) {
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not logged in');
      }

      // Parse candidate name into first and last name
      const nameParts = candidate.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Get today's date for hired_date (use local date, not UTC)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      // Create employee data from candidate data
      const employeeData: Record<string, unknown> = {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || null,
        department: 'General',
        position: candidate.jobPosition || null,
        employee_id: `EMP-${candidate.id}`,
        hired_date: today,
        status: 'Active',
        street: null,
        city: null,
        state: null,
        zip_code: null,
        date_of_birth: null,
        gender: null,
      };

      // Create employee (admin/hiring_manager use their dealership)
      const data = await postJsonAuth<{ ok: boolean; employee?: { id: number }; id?: number }>('/employees', employeeData, { method: 'POST' });

      const employeeId = data.employee?.id ?? data.id;

      // Get current user info for role history
      let changedBy = 'Unknown';
      try {
        const userRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          changedBy = userData.user?.email || userData.email || userData.user?.full_name || 'Unknown';
        }
      } catch (err) {
        console.error('Failed to get user info:', err);
      }

      // Create role history entry: Action: "Hired", Previous Value: "Candidate"
      if (employeeId) {
        try {
          const historyRes = await fetch(`${API_BASE}/role-history`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employee_id: employeeId,
              type: 'employee',
              action: 'Hired',
              previousValue: 'Candidate',
              newValue: employeeData.position || 'Employee',
              changedBy: changedBy,
              timestamp: new Date().toISOString(),
            }),
          });

          if (!historyRes.ok) {
            console.warn('Failed to create role history entry, but employee was created');
          }
        } catch (err) {
          console.error('Error creating role history entry:', err);
          // Don't fail the whole operation if role history fails
        }
      }

      // Update candidate status to "Hired" to remove them from candidate list
      try {
        await updateCandidate({ status: 'Hired' });
      } catch (updateErr) {
        console.error('Failed to update candidate status:', updateErr);
        // Continue even if status update fails - employee was created successfully
      }

      toast.success('Candidate successfully converted to employee!');
      
      // Redirect to employees page
      setTimeout(() => {
        router.push('/employees');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to convert candidate to employee';
      toast.error(msg);
      console.error('Convert to employee error:', err);
    } finally {
      setSaving(false);
    }
  }

  function openEditPersonal() {
    if (!candidate) return;
    setEditEmail(candidate.email || '');
    setEditPhone(candidate.phone || '');
    setEditAddress(candidate.address === 'Not Provided' ? '' : (candidate.address || ''));
    setEditGender(candidate.gender === 'Not Provided' ? '' : candidate.gender);
    setEditDateOfBirth(candidate.dateOfBirthRaw || '');
    
    // Parse university
    setEditUniversity(candidate.university === 'Not Provided' ? '' : (candidate.university || ''));
    
    // Parse degree (format: "Degree Level in Major" or just "Degree Level")
    const degree = candidate.degree === 'Not Provided' ? '' : (candidate.degree || '');
    if (degree.includes(' in ')) {
      const [level, major] = degree.split(' in ');
      setEditDegreeLevel(level.trim());
      setEditMajor(major.trim());
    } else {
      setEditDegreeLevel(degree);
      setEditMajor('');
    }
    
    // Parse referrals
    const parsedReferrals = parseReferrals(candidate.referral);
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
    if (!candidate) return;
    setSavingPersonal(true);
    try {
      // Format degree: combine degree level and major
      let degree = null;
      if (editDegreeLevel || editMajor) {
        const parts = [];
        if (editDegreeLevel) parts.push(editDegreeLevel);
        if (editMajor) parts.push(editMajor);
        degree = parts.join(' in ') || null;
      }
      
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
      
      const body: { 
        email?: string;
        phone?: string;
        address?: string | null;
        gender?: string | null; 
        date_of_birth?: string | null;
        university?: string | null;
        degree?: string | null;
        referral?: string | null;
      } = {
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || null,
        gender: editGender.trim() || null,
        date_of_birth: editDateOfBirth.trim() || null,
        university: editUniversity.trim() || null,
        degree: degree || null,
        referral: referral || null,
      };
      const data = await putJsonAuth<{ ok: boolean; candidate: any }>(`/candidates/${candidate.id}`, body);
      if (data.candidate) {
        const c = data.candidate;
        setCandidate({
          ...candidate,
          email: c.email || candidate.email,
          phone: c.phone || candidate.phone,
          address: c.address?.trim() || 'Not Provided',
          gender: c.gender?.trim() || 'Not Provided',
          birthday: c.date_of_birth ? formatBirthday(c.date_of_birth) : 'Not Provided',
          dateOfBirthRaw: c.date_of_birth ?? undefined,
          university: c.university?.trim() || 'Not Provided',
          degree: c.degree?.trim() || 'Not Provided',
          referral: c.referral?.trim() || 'Not Provided',
        });
      }
      setShowEditPersonal(false);
      toast.success('Information updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSavingPersonal(false);
    }
  }

  function handleHiringDecision(decision: 'continue' | 'stop') {
    setHiringDecision(decision);
    if (decision === 'continue') {
      // Advance to next stage
      const stages = ['Applied', 'Interviewing', 'Review', 'Offer', 'Ready'];
      const currentIndex = stages.indexOf(candidate?.stage || 'Applied');
      if (currentIndex < stages.length - 1) {
        handleStatusChange(stages[currentIndex + 1]);
      }
    } else {
      // Stop process - set to Rejected
      handleStatusChange('Reject');
    }
  }

  const allCandidateIds = allCandidates.map(c => c.id).sort((a, b) => a - b);
  const totalCandidates = allCandidateIds.length;

  const navigateCandidate = (direction: 'prev' | 'next') => {
    const currentIndex = allCandidateIds.indexOf(candidateId);
    if (direction === 'prev' && currentIndex > 0) {
      router.push(`/candidates/${allCandidateIds[currentIndex - 1]}`);
    } else if (direction === 'next' && currentIndex < allCandidateIds.length - 1) {
      router.push(`/candidates/${allCandidateIds[currentIndex + 1]}`);
    }
  };

  const getScoreColor = (score: number) => {
    // Score is out of 100, following the Hiring Recommendation Guide
    if (score >= 90) return '#047857'; // Likely Game Changer - dark green
    if (score >= 80) return '#065F46'; // Strong Performer - green
    if (score >= 70) return '#1E40AF'; // High Potential - blue
    if (score >= 60) return '#F59E0B'; // Average - orange
    return '#EF4444'; // Poor - red
  };

  // Calculate status based on last interview recommendation
  const calculateStatus = (): string => {
    if (!candidate) return 'Awaiting';
    
    const notes = candidate.notes || '';
    if (!notes || !notes.trim()) {
      return 'Awaiting First Interview';
    }
    
    // Parse interview blocks to find the last interview's recommendation
    const interviewBlocks: string[] = [];
    
    if (notes.includes('--- INTERVIEW ---')) {
      const parts = notes.split(/--- INTERVIEW ---/);
      parts.forEach((part) => {
        const trimmed = part.trim();
        if (trimmed && trimmed.includes('Interview Stage:')) {
          interviewBlocks.push(trimmed);
        }
      });
    } else {
      const stageMatches = [...notes.matchAll(/Interview Stage:/g)];
      if (stageMatches.length === 0) {
        return 'Awaiting First Interview';
      }
      if (stageMatches.length === 1) {
        interviewBlocks.push(notes);
      } else {
        for (let i = 0; i < stageMatches.length; i++) {
          const startIndex = stageMatches[i].index || 0;
          const endIndex = i < stageMatches.length - 1 
            ? (stageMatches[i + 1].index || notes.length)
            : notes.length;
          const block = notes.substring(startIndex, endIndex).trim();
          if (block && block.includes('Interview Stage:')) {
            interviewBlocks.push(block);
          }
        }
      }
    }
    
    if (interviewBlocks.length === 0) {
      return 'Awaiting First Interview';
    }
    
    // Get the last interview block
    const lastBlock = interviewBlocks[interviewBlocks.length - 1];
    
    // Normalize and parse the last block
    const normalizedBlock = lastBlock
      .replace(/(Interviewer Recommendation:)([^\n])/g, '$1\n$2');
    
    const lines = normalizedBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Find the recommendation
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Interviewer Recommendation:')) {
        const recommendation = line.replace('Interviewer Recommendation:', '').trim() || 
                              (i + 1 < lines.length ? lines[i + 1].trim() : '');
        
        if (recommendation.toLowerCase() === 'next stage' || recommendation.toLowerCase() === 'next-stage') {
          return 'Awaiting Next Interview';
        } else if (recommendation.toLowerCase() === 'hire') {
          return 'Hire';
        } else if (recommendation.toLowerCase() === 'no hire' || recommendation.toLowerCase() === 'no-hire') {
          return 'No Hire';
        }
      }
    }
    
    // If no recommendation found, return the candidate's current status
    return candidate.stage || 'Awaiting';
  };

  // Parse interview notes to extract process events
  const parseProcessEvents = (): ProcessEvent[] => {
    if (!candidate) return [];
    
    const events: ProcessEvent[] = [];
    
    // Add initial event
    events.push({
      type: 'added',
      title: 'Candidate Added',
      description: `Candidate has been added to the system.`,
      date: candidate.appliedDate,
    });

    if (!candidate.notes || !candidate.notes.trim()) {
      return events;
    }

    // Parse notes to extract interview information
    const notes = candidate.notes;
    
    if (!notes || !notes.trim()) {
      return events;
    }
    
    // Split notes into interview blocks
    // Support two formats:
    // 1. Separator format: "--- INTERVIEW ---" (preferred, clear separation)
    // 2. Fallback: Split on "Interview Stage:" occurrences
    const interviewBlocks: string[] = [];
    
    // First, try splitting by the separator
    if (notes.includes('--- INTERVIEW ---')) {
      const parts = notes.split(/--- INTERVIEW ---/);
      parts.forEach((part, index) => {
        const trimmed = part.trim();
        if (trimmed && trimmed.includes('Interview Stage:')) {
          interviewBlocks.push(trimmed);
        }
      });
    }
    
    // If no separator found, fall back to splitting on "Interview Stage:"
    if (interviewBlocks.length === 0) {
      const stageMatches = [...notes.matchAll(/Interview Stage:/g)];
      
      if (stageMatches.length === 0) {
        return events;
      }
      
      if (stageMatches.length === 1) {
        // Only one interview
        interviewBlocks.push(notes);
      } else {
        // Multiple interviews - split at each "Interview Stage:"
        for (let i = 0; i < stageMatches.length; i++) {
          const startIndex = stageMatches[i].index || 0;
          const endIndex = i < stageMatches.length - 1 
            ? (stageMatches[i + 1].index || notes.length)
            : notes.length;
          
          const block = notes.substring(startIndex, endIndex).trim();
          if (block && block.includes('Interview Stage:')) {
            interviewBlocks.push(block);
          }
        }
      }
    }
    
    // Track completed stages
    const completedStages = new Set<number>();
    
    // Parse each interview block
    interviewBlocks.forEach((block, blockIndex) => {
      // Normalize the block - add newlines where they should be for proper parsing
      // This handles cases where the backend might have stripped newlines
      let normalizedBlock = block
        .replace(/(Interview Stage:)([^\n])/g, '$1\n$2')
        .replace(/(Hiring Manager:)([^\n])/g, '$1\n$2')
        // Do not add newline after Interviewer: so "Interviewer: Name" stays on one line and parses correctly
        .replace(/(Role:)([^\n])/g, '$1\n$2')
        // Do not add newline after Interviewer Recommendation: so "Interviewer Recommendation: Next Stage" stays on one line
        .replace(/(Scores:)([^\n])/g, '$1\n$2')
        .replace(/(Total Weighted Score:)([^\n])/g, '$1\n$2')
        .replace(/(Additional Notes:)([^\n])/g, '$1\n$2');
      // Do not add newline after Comments: so "Comments: text" stays on one line and parses correctly
      
      const lines = normalizedBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      let stage = '';
      let manager = '';
      let role = '';
      let recommendation = '';
      let totalScore = '';
      let additionalNotes = '';
      let inScoresSection = false;
      let inNotesSection = false;
      
      const categoryScores: CategoryScore[] = [];
      let currentCategory: CategoryScore | null = null;
      
      // Parse each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Header fields
        if (line.startsWith('Interview Stage:')) {
          stage = line.replace('Interview Stage:', '').trim();
        } else if (line.startsWith('Hiring Manager:')) {
          manager = line.replace('Hiring Manager:', '').trim();
        } else if (line.startsWith('Interviewer:')) {
          const afterLabel = line.replace('Interviewer:', '').trim();
          if (afterLabel) {
            manager = afterLabel;
          } else if (i + 1 < lines.length) {
            manager = lines[i + 1].trim();
            i++;
          }
        } else if (line.startsWith('Role:')) {
          role = line.replace('Role:', '').trim();
        } else if (line.startsWith('Interviewer Recommendation:')) {
          const afterLabel = line.replace('Interviewer Recommendation:', '').trim();
          if (afterLabel) {
            recommendation = afterLabel;
          } else if (i + 1 < lines.length) {
            // Recommendation value might be on the next line after normalization
            recommendation = lines[i + 1].trim();
            i++; // Skip the next line since we've processed it
          }
        } else if (line.startsWith('Total Weighted Score:')) {
          totalScore = line.replace('Total Weighted Score:', '').trim();
        } else if (line === 'Scores:') {
          inScoresSection = true;
          inNotesSection = false;
        } else if (line.startsWith('Additional Notes:')) {
          inNotesSection = true;
          inScoresSection = false;
          additionalNotes = line.replace('Additional Notes:', '').trim();
        } else if (inScoresSection) {
          // Parse category scores
          // Handle format: "Category Name: score/10 (Weighted: X.XX)  Comments: comment text"
          // or separate lines: "Category Name: score/10 (Weighted: X.XX)" followed by "Comments: comment text"
          if (line.includes(':') && line.includes('/10')) {
            // Save previous category
            if (currentCategory) {
              categoryScores.push(currentCategory);
            }
            
            // Check if comment is on the same line
            const commentMatch = line.match(/Comments:\s*(.+)$/);
            let commentText = '';
            let lineForParsing = line;
            if (commentMatch) {
              commentText = commentMatch[1].trim();
              // Remove comment from line for score parsing
              lineForParsing = line.replace(/\s+Comments:.*$/, '');
            }
            
            // Parse category line: "Category Name: score/10 (Weighted: X.XX)"
            const match = lineForParsing.match(/^(.+?):\s*(\d+(?:\.\d+)?)\/10(?:\s*\(Weighted:\s*([\d.]+)\))?/);
            if (match) {
              currentCategory = {
                category: match[1].trim(),
                score: `${match[2]}/10`,
                weighted: match[3] || undefined,
                comment: commentText || undefined,
              };
            }
          } else if (line.includes('Comments:')) {
            // Comment on same line ("Comments: text") or next line (normalization may split to "Comments:" then "text")
            if (currentCategory) {
              const commentMatch = line.match(/Comments:\s*(.+)/);
              if (commentMatch) {
                currentCategory.comment = commentMatch[1].trim();
              } else {
                // "Comments:" with no text on this line — use next line(s) as comment
                let commentParts: string[] = [];
                while (i + 1 < lines.length) {
                  const nextLine = lines[i + 1];
                  if (nextLine.includes('/10') && nextLine.includes(':')) break; // Next category
                  if (nextLine === 'Scores:' || nextLine.startsWith('Total Weighted') || nextLine.startsWith('Additional Notes')) break;
                  i++;
                  commentParts.push(nextLine);
                }
                if (commentParts.length > 0) {
                  currentCategory.comment = commentParts.join(' ').trim();
                }
              }
            }
          } else if (currentCategory && currentCategory.comment != null && currentCategory.comment !== '' && line.trim().length > 0 && !line.includes('/10') && !line.includes('Comments:')) {
            // Continuation of multi-line comment (line that doesn't look like a new category or header)
            const trimmed = line.trim();
            if (!trimmed.startsWith('Interview Stage:') && !trimmed.startsWith('Role:') && !trimmed.startsWith('Total Weighted'))
              currentCategory.comment += ' ' + trimmed;
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
      
      // Save last category
      if (currentCategory) {
        categoryScores.push(currentCategory);
      }
      
      // Extract sum score from totalScore (e.g. "6.00/10 (60/100)")
      let sumScore: number | undefined;
      if (totalScore) {
        const scoreMatch = totalScore.match(/\((\d+)\/100\)/);
        if (scoreMatch) {
          sumScore = parseInt(scoreMatch[1], 10);
        } else {
          const fallbackMatch = totalScore.match(/(\d+(?:\.\d+)?)\/10/);
          if (fallbackMatch) {
            sumScore = Math.round(parseFloat(fallbackMatch[1]) * 10);
          }
        }
      }
      // If no sum in notes, add all category scores and display (average of X/10 scaled to 0–100)
      if (sumScore === undefined && categoryScores.length > 0) {
        let total = 0;
        let count = 0;
        for (const cat of categoryScores) {
          const m = cat.score.match(/^(\d+(?:\.\d+)?)\/10/);
          if (m) {
            total += parseFloat(m[1]);
            count += 1;
          }
        }
        if (count > 0) {
          sumScore = Math.round((total / count) * 10);
        }
      }

      // Create interview event from parsed data only (no mock/example data)
      const interviewNumber = stage ? parseInt(stage, 10) || blockIndex + 1 : blockIndex + 1;
      
      // Track this stage as completed
      completedStages.add(interviewNumber);
      
      const managerDisplay = (manager && manager.trim() && manager.toLowerCase() !== 'unknown')
        ? manager.trim()
        : 'Interviewer not specified';
      events.push({
        type: 'interview',
        title: `Interview ${interviewNumber} Completed`,
        description: `Interview ${interviewNumber} completed by ${managerDisplay}`,
        manager: managerDisplay,
        score: sumScore,
        recommendation: recommendation,
        categoryScores: categoryScores.length > 0 ? categoryScores : undefined,
        additionalNotes: additionalNotes || undefined,
        details: `${role ? `Role: ${role}\n` : ''}${totalScore ? `Total Score: ${totalScore}\n` : ''}${recommendation ? `Recommendation: ${recommendation}\n` : ''}`,
      });
      
      // Add follow-up event based on saved recommendation
      if (recommendation === 'Hire' || recommendation === 'hire') {
        events.push({
          type: 'status',
          title: 'Recommended for Hire',
          description: 'Candidate has been recommended for hire.',
        });
      } else if (recommendation === 'No Hire' || recommendation === 'no-hire') {
        events.push({
          type: 'status',
          title: 'Not Recommended',
          description: 'Candidate was not recommended to continue.',
        });
      }
    });

    // Add current status if it's different from what we've shown
    const currentStatus = candidate.stage || 'Awaiting';
    const hasStatusEvent = events.some(e => e.title.includes(currentStatus));
    if (!hasStatusEvent && currentStatus !== 'Awaiting' && currentStatus !== 'Interviewing') {
      events.push({
        type: 'status',
        title: `Current Status: ${currentStatus}`,
        description: `Candidate is currently in ${currentStatus} status.`,
      });
    }

    // Sort events: awaiting events first (most recent first), then other events in reverse chronological order
    const awaitingEvents = events.filter(e => e.type === 'awaiting').reverse();
    const otherEvents = events.filter(e => e.type !== 'awaiting').reverse();
    
    return [...awaitingEvents, ...otherEvents];
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="text-center py-12">
              <p style={{ color: '#6B7280' }}>Loading candidate...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  if (!candidate) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
          <HubSidebar />
          <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
            <div className="text-center py-12">
              <p style={{ color: '#6B7280' }}>Candidate not found</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  const initials = candidate.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const processEvents = parseProcessEvents();

  // Average of all interview scores for overall display (fallback to candidate.overallScore from backend)
  const interviewScores = processEvents
    .filter((e): e is ProcessEvent & { score: number } => e.type === 'interview' && e.score != null)
    .map(e => e.score);
  const averageInterviewScore =
    interviewScores.length > 0
      ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
      : null;
  const hasOverallScore = averageInterviewScore !== null;
  const displayOverallScore = hasOverallScore ? averageInterviewScore : null;

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
                  onClick={() => router.push('/candidates')}
                  className="cursor-pointer p-2 rounded-lg transition-all hover:bg-gray-100"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="Back to Candidates"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateCandidate('prev')}
                  disabled={currentCandidateIndex === 0}
                  className="cursor-pointer p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="Previous Candidate"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm px-2" style={{ color: '#6B7280' }}>
                  {currentCandidateIndex + 1} / {totalCandidates}
                </span>
                <button
                  onClick={() => navigateCandidate('next')}
                  disabled={currentCandidateIndex >= totalCandidates - 1}
                  className="cursor-pointer p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="Next Candidate"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#374151' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Candidate Info Header */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}
              >
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-1">
                  <h1 className="text-3xl font-bold" style={{ color: '#232E40' }}>{candidate.name}</h1>
                  {(() => {
                    const status = calculateStatus();
                    const getStatusColors = (status: string) => {
                      switch (status) {
                        case 'Hire':
                        case 'Offered':
                        case 'Hired':
                          return { bg: '#D1FAE5', text: '#065F46' };
                        case 'No Hire':
                        case 'Denied':
                          return { bg: '#FEE2E2', text: '#991B1B' };
                        case 'Awaiting Next Interview':
                        case 'Awaiting First Interview':
                        case 'Awaiting':
                          return { bg: '#FEF3C7', text: '#92400E' };
                        case 'Interviewing':
                          return { bg: '#DBEAFE', text: '#1E40AF' };
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
                  <div className="px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1" style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}>
                    <span>Overall Score:</span>
                    {hasOverallScore ? (
                      <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#FFFFFF' }}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                        <span>{displayOverallScore} / 100</span>
                        {interviewScores.length > 1 && (
                          <span className="opacity-90 text-xs">({interviewScores.length} interviews)</span>
                        )}
                      </>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm" style={{ color: '#6B7280' }}>
                  <span>ID: #{candidate.id.toString().padStart(8, '0')}</span>
                  <span>Origin: {candidate.origin}</span>
                  <span>Applied on: {candidate.appliedDate}</span>
                  <span>Job Position: {candidate.jobPosition}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
            {[
              'Hiring Process', 
              'Resume',
              ...((role === 'admin' || role === 'hiring_manager') ? ['Hiring Decision'] : [])
            ].map((tab) => (
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
            <div className="col-span-2 space-y-4">
              {activeTab === 'hiring-process' && (
                <>
                  {/* Add New Interview Score */}
                  <button
                    onClick={() => {
                      // Calculate next interview stage
                      const events = parseProcessEvents();
                      const interviewEvents = events.filter(e => e.type === 'interview');
                      const nextStage = interviewEvents.length + 1;
                      
                      // Get candidate's role/position
                      const candidateRole = candidate?.jobPosition || '';
                      
                      // Map role to role ID
                      const roleMap: Record<string, string> = {
                        'Body Shop Manager': 'body-shop-manager',
                        'Body Shop Technician': 'support-staff',
                        'Business Manager': 'c-level-manager',
                        'Business Office Support': 'office-clerk',
                        'C-Level Executives': 'c-level-manager',
                        'Platform Manager': 'c-level-manager',
                        'Controller': 'finance-manager',
                        'Finance Manager': 'finance-manager',
                        'Finance Director': 'finance-manager',
                        'General Manager': 'gm',
                        'Human Resources Manager': 'hr-manager',
                        'IT Manager': 'c-level-manager',
                        'Loaner Agent': 'support-staff',
                        'Mobility Manager': 'c-level-manager',
                        'Parts Counter Employee': 'support-staff',
                        'Parts Manager': 'parts-manager',
                        'Parts Support': 'support-staff',
                        'Drivers': 'support-staff',
                        'Sales Manager': 'sales-manager',
                        'GSM': 'sales-manager',
                        'Sales People': 'salesperson',
                        'Sales Support': 'support-staff',
                        'Receptionist': 'office-clerk',
                        'Service Advisor': 'service-advisor',
                        'Service Director': 'service-manager',
                        'Service Drive Manager': 'service-manager',
                        'Service Manager': 'service-manager',
                        'Parts and Service Director': 'service-manager',
                        'Service Support': 'support-staff',
                        'Porters': 'support-staff',
                        'Technician': 'support-staff',
                        'Used Car Director': 'sales-manager',
                        'Used Car Manager': 'sales-manager',
                      };
                      
                      const roleId = roleMap[candidateRole] || 'c-level-manager';
                      
                      router.push(`/candidates/score?candidateId=${candidateId}&role=${roleId}&stage=${nextStage}`);
                    }}
                    className="cursor-pointer w-full rounded-xl p-5 border-2 border-dashed transition-all hover:border-solid hover:bg-gray-50"
                    style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-semibold">Add New Interview Score</span>
                    </div>
                  </button>
                  
                  {/* Hiring Process Timeline */}
                  <div className="space-y-4">
                    {processEvents.map((event, index) => {
                      const isInterview = event.type === 'interview';
                      
                      // For non-interview events, use simple display
                      if (!isInterview) {
                        return (
                          <div
                            key={index}
                            className="rounded-xl p-5 relative"
                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center"
                                  style={{
                                    backgroundColor:
                                      event.type === 'added' ? '#10B981' :
                                      event.type === 'awaiting' ? '#F59E0B' :
                                      '#6B7280',
                                  }}
                                >
                                  {event.type === 'added' && (
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  )}
                                  {event.type === 'awaiting' && (
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                  {event.type === 'status' && (
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold mb-1" style={{ color: '#232E40' }}>{event.title}</h3>
                                    <p className="text-sm" style={{ color: '#6B7280' }}>{event.description}</p>
                                  </div>
                                  {event.date && (
                                    <div className="flex-shrink-0 text-sm" style={{ color: '#6B7280' }}>
                                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // For interview events, use detailed format
                      return (
                        <div
                          key={index}
                          className="rounded-xl p-6 relative"
                          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                        >
                          {/* Header with icon, title, and interviewer */}
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
                                  <h3 className="text-lg font-bold mb-1" style={{ color: '#232E40' }}>{event.title}</h3>
                                  <p className="text-sm" style={{ color: '#6B7280' }}>
                                    {event.manager && event.manager.toLowerCase() !== 'interviewer not specified' 
                                      ? `Interview ${event.title.match(/\d+/)?.[0] || ''} completed by ${event.manager}`
                                      : event.description}
                                  </p>
                                </div>
                                {event.date && (
                                  <div className="flex-shrink-0 text-sm self-start" style={{ color: '#6B7280' }}>
                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Sum Score and Interviewer Recommendation - Side by side */}
                          <div className="mb-6 flex flex-wrap gap-4 items-center">
                            {event.score !== undefined && (
                              <div className="inline-flex items-center px-4 py-3 rounded-lg" style={{ backgroundColor: '#E0E7FF', border: '1px solid #C7D2FE' }}>
                                <span className="text-base font-semibold">
                                  <span style={{ color: '#374151' }}>Sum Score: </span>
                                  <span style={{ color: event.score != null ? getScoreColor(event.score) : '#4D6DBE', fontWeight: 'bold' }}>{event.score}/100</span>
                                </span>
                              </div>
                            )}
                            <span className="text-base font-semibold">
                              <span style={{ color: '#374151' }}>Interviewer Recommendation: </span>
                              {event.recommendation && event.recommendation.trim() ? (
                                <span className="font-bold" style={{ 
                                  color: event.recommendation === 'Hire' || event.recommendation === 'hire' ? '#10B981' : 
                                         event.recommendation === 'Next Stage' || event.recommendation === 'next-stage' ? '#4D6DBE' : 
                                         event.recommendation === 'No Hire' || event.recommendation === 'no-hire' ? '#EF4444' : '#4D6DBE'
                                }}>
                                  {event.recommendation}
                                </span>
                              ) : (
                                <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Not provided</span>
                              )}
                            </span>
                          </div>

                          {/* Additional Notes - Always visible */}
                          {event.additionalNotes && event.additionalNotes.trim() && (
                            <div className="mb-6">
                              <h4 className="text-sm font-bold mb-2" style={{ color: '#232E40' }}>Additional Notes:</h4>
                              <div className="p-4 rounded-lg text-sm whitespace-pre-wrap" style={{ backgroundColor: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' }}>
                                {event.additionalNotes}
                              </div>
                            </div>
                          )}

                          {/* Expandable section for Category Scores */}
                          {event.categoryScores && event.categoryScores.length > 0 ? (
                            <>
                              <button
                                onClick={() => setExpandedInterviewIndex(expandedInterviewIndex === index ? null : index)}
                                className="mb-4 flex items-center gap-2 text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ color: '#4D6DBE' }}
                              >
                                {expandedInterviewIndex === index ? 'Show Less' : 'Show More Details'}
                                <svg 
                                  className={`w-4 h-4 transition-transform ${expandedInterviewIndex === index ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {expandedInterviewIndex === index && (
                                <div>
                                  <h4 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Category Scores</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    {event.categoryScores.map((catScore, idx) => (
                                      <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                          <span className="text-sm font-semibold flex-1" style={{ color: '#232E40' }}>{catScore.category}</span>
                                          <span className="text-sm font-bold shrink-0" style={{ color: '#4D6DBE' }}>{catScore.score}</span>
                                        </div>
                                        {catScore.comment && catScore.comment.trim() && (
                                          <p className="text-xs mt-2 pt-2 border-t whitespace-pre-wrap break-words" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                                            <span className="font-semibold" style={{ color: '#374151' }}>Comments: </span>
                                            <span>{catScore.comment}</span>
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {activeTab === 'resume' && (
                <div className="rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <div className="p-8">
                    <div className="mb-4">
                      <h3 className="text-base font-bold" style={{ color: '#232E40' }}>Resume Preview</h3>
                      <p className="text-sm" style={{ color: '#6B7280' }}>
                        Supported formats: PDF, DOC, DOCX.
                      </p>
                    </div>
                    {candidate.resumeUrl ? (
                      <>
                        {resumePreviewLoading ? (
                          <div className="w-full border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50" style={{ height: '85vh' }}>
                            <p className="text-gray-500">Loading resume…</p>
                          </div>
                        ) : resumePreviewUrl ? (
                          <div className="w-full border border-gray-300 rounded-lg overflow-hidden" style={{ height: '85vh' }}>
                            {resumePreviewIsPdf ? (
                              <iframe src={resumePreviewUrl} className="w-full h-full" title="Resume Preview" />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full bg-gray-50 gap-3 p-6">
                                <p className="text-gray-600">Preview not available for this file type.</p>
                                <a
                                  href={resumePreviewUrl}
                                  download
                                  className="px-4 py-2 rounded-lg text-white font-medium"
                                  style={{ backgroundColor: '#4D6DBE' }}
                                >
                                  Download resume
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-[400px] border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                            <p className="text-gray-500">Could not load resume.</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-semibold mb-2" style={{ color: '#6B7280' }}>No Resume Uploaded</p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                          This candidate has not uploaded a resume yet.
                        </p>
                        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                          Supported formats: PDF, DOC, DOCX
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'hiring-decision' && (role === 'admin' || role === 'hiring_manager') && (
                <div className="space-y-6">
                  <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="mb-6">
                      <h3 className="text-base font-bold mb-1" style={{ color: '#232E40' }}>Hiring Decision</h3>
                      <p className="text-xs" style={{ color: '#6B7280' }}>Make a final decision for this candidate</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Accept Column */}
                      <div className="space-y-3">
                        <button
                          onClick={handleConvertToEmployee}
                          disabled={saving}
                          className="cursor-pointer group relative overflow-hidden rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-3 p-5 w-full"
                          style={{ 
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                            border: '2px solid #A7F3D0',
                          }}
                          onMouseEnter={(e) => {
                            if (!saving) {
                              e.currentTarget.style.backgroundColor = '#A7F3D0';
                              e.currentTarget.style.borderColor = '#6EE7B7';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!saving) {
                              e.currentTarget.style.backgroundColor = '#D1FAE5';
                              e.currentTarget.style.borderColor = '#A7F3D0';
                            }
                          }}
                        >
                          {saving ? (
                            <>
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-sm">Processing...</span>
                            </>
                          ) : (
                            <>
                              <div className="rounded-full p-3" style={{ backgroundColor: 'rgba(6, 95, 70, 0.1)' }}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold">Accept</div>
                                <div className="text-xs opacity-80 mt-0.5">Board as employee</div>
                              </div>
                            </>
                          )}
                        </button>
                        {/* Accept Warning */}
                        <p className="text-xs leading-relaxed" style={{ color: '#16A34A' }}>
                          Accepting this candidate will move them to the employee list and permanently delete their resume. 
                          This action cannot be undone.
                        </p>
                      </div>

                      {/* Deny Column */}
                      <div className="space-y-3">
                        <button
                          onClick={handleDenyApplication}
                          disabled={saving}
                          className="cursor-pointer group relative overflow-hidden rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-3 p-5 w-full"
                          style={{ 
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            border: '2px solid #FECACA',
                          }}
                          onMouseEnter={(e) => {
                            if (!saving) {
                              e.currentTarget.style.backgroundColor = '#FECACA';
                              e.currentTarget.style.borderColor = '#FCA5A5';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!saving) {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                              e.currentTarget.style.borderColor = '#FECACA';
                            }
                          }}
                        >
                          <div className="rounded-full p-3" style={{ backgroundColor: 'rgba(153, 27, 27, 0.1)' }}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold">Deny</div>
                            <div className="text-xs opacity-80 mt-0.5">Reject application</div>
                          </div>
                        </button>
                        {/* Deny Warning */}
                        <p className="text-xs leading-relaxed" style={{ color: '#DC2626' }}>
                          Denying this application will permanently reject the candidate. Once denied, you will no longer be able to retrieve their information. 
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Personal & Education Information */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold" style={{ color: '#232E40' }}>Information</h3>
                  {(role === 'admin' || role === 'manager' || role === 'hiring_manager') && (
                    <button
                      type="button"
                      onClick={openEditPersonal}
                      className="text-xs font-medium cursor-pointer hover:underline"
                      style={{ color: '#4D6DBE' }}
                    >
                      Edit
                    </button>
                  )}
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
                        <span className="text-sm break-words" style={{ color: '#374151' }}>{candidate.email}</span>
                      </div>
                    </div>
                    {candidate.phone && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Phone</span>
                          <span className="text-sm" style={{ color: '#374151' }}>{candidate.phone}</span>
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
                        <span className={`text-sm break-words ${candidate.address && candidate.address !== 'Not Provided' ? '' : 'italic'}`} style={{ color: candidate.address && candidate.address !== 'Not Provided' ? '#374151' : '#9CA3AF' }}>
                          {candidate.address && candidate.address !== 'Not Provided' ? candidate.address : 'No data'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block mb-0.5" style={{ color: '#9CA3AF' }}>Date of Birth</span>
                        <span className={`text-sm ${candidate.birthday && candidate.birthday !== 'Not Provided' ? '' : 'italic'}`} style={{ color: candidate.birthday && candidate.birthday !== 'Not Provided' ? '#374151' : '#9CA3AF' }}>
                          {candidate.birthday && candidate.birthday !== 'Not Provided' ? candidate.birthday : 'No data'}
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
                        <span className={`text-sm break-words ${candidate.university && candidate.university !== 'Not Provided' ? '' : 'italic'}`} style={{ color: candidate.university && candidate.university !== 'Not Provided' ? '#374151' : '#9CA3AF' }}>
                          {candidate.university && candidate.university !== 'Not Provided' ? candidate.university : 'No data'}
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
                        <span className={`text-sm break-words ${candidate.degree && candidate.degree !== 'Not Provided' ? '' : 'italic'}`} style={{ color: candidate.degree && candidate.degree !== 'Not Provided' ? '#374151' : '#9CA3AF' }}>
                          {candidate.degree && candidate.degree !== 'Not Provided' ? candidate.degree : 'No data'}
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const parsedReferrals = parseReferrals(candidate.referral);
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !savingPersonal && setShowEditPersonal(false)}>
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#4D6DBE' }}>
                      <h3 className="text-sm font-bold" style={{ color: '#FFFFFF' }}>Edit Information</h3>
                    </div>
                    <div className="p-5 overflow-y-auto flex-1">
                    <div className="space-y-4">
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
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Gender</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border"
                          style={{ borderColor: '#D1D5DB', color: '#374151' }}
                        >
                          <option value="">Not provided</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                          <option value="Other">Other</option>
                        </select>
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
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Degree Level</label>
                          <select
                            value={editDegreeLevel}
                            onChange={(e) => setEditDegreeLevel(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border"
                            style={{ borderColor: '#D1D5DB', color: '#374151' }}
                          >
                            <option value="">Select Degree Level</option>
                            <option value="High School">High School</option>
                            <option value="Associate">Associate</option>
                            <option value="Bachelor">Bachelor</option>
                            <option value="Master">Master</option>
                            <option value="Doctorate">Doctorate</option>
                            <option value="Professional">Professional</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Major</label>
                          <input
                            type="text"
                            value={editMajor}
                            onChange={(e) => setEditMajor(e.target.value)}
                            placeholder="Major or field of study"
                            className="w-full px-3 py-2 text-sm rounded-lg border"
                            style={{ borderColor: '#D1D5DB', color: '#374151' }}
                          />
                        </div>
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
                            Once you delete a candidate, they will be permanently rejected and their status will be set to "Denied". This action cannot be undone.
                          </p>
                          <button
                            type="button"
                            onClick={handleDenyApplication}
                            disabled={savingPersonal || role === 'corporate'}
                            className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                            style={{ 
                              backgroundColor: '#FFFFFF', 
                              color: '#DC2626',
                              border: '1px solid #FCA5A5'
                            }}
                          >
                            Delete Candidate
                          </button>
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
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
