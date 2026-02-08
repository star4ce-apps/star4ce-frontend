'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import { getJsonAuth, postJsonAuth } from '@/lib/http';
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
};

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
          gender: 'Not Provided',
          birthday: 'Not Provided',
          address: 'Not Provided',
          overallScore: c.score ? c.score / 10 : 0,
          stage: c.status || 'Awaiting',
          origin: 'Career Site',
          appliedDate: new Date(c.applied_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          jobPosition: c.position,
          university: 'Not Provided',
          degree: 'Not Provided',
          referral: 'Not Provided',
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
        
        // Debug: Check what backend is returning
        console.log('=== BACKEND RESPONSE ===');
        console.log('Candidate ID:', c.id);
        console.log('Notes field type:', typeof c.notes);
        console.log('Notes field value:', c.notes);
        console.log('Notes length:', c.notes?.length || 0);
        console.log('Notes preview (first 500 chars):', c.notes?.substring(0, 500) || 'NO NOTES');
        console.log('Notes preview (last 500 chars):', c.notes?.substring(Math.max(0, (c.notes?.length || 0) - 500)) || 'NO NOTES');
        
        const candidateData: CandidateProfile = {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          gender: 'Not Provided',
          birthday: 'Not Provided',
          address: 'Not Provided',
          overallScore: c.score !== null && c.score !== undefined ? c.score / 10 : 0,
          stage: c.status || 'Awaiting',
          origin: 'Career Site',
          appliedDate: new Date(c.applied_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          jobPosition: c.position,
          university: 'Not Provided',
          degree: 'Not Provided',
          referral: 'Not Provided',
          interviewHistory: [],
          notes: c.notes || '',
          resumeUrl: c.resume_url ? `${API_BASE}${c.resume_url}` : undefined,
          dealership_id: c.dealership_id ?? undefined,
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
    
    // Block corporate users
    if (role === 'corporate') {
      toast.error('Corporate users have view-only access. Cannot modify candidates.');
      return;
    }

    // Confirm action
    if (!confirm('Are you sure you want to deny this application? This will update the candidate status to "Denied".')) {
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
    
    // Only admin, hiring_manager, and corporate can board as employee
    if (role !== 'admin' && role !== 'hiring_manager' && role !== 'corporate') {
      toast.error('Only admin, hiring manager, and corporate can board candidates as employees.');
      return;
    }

    // Confirm action
    if (!confirm('Are you sure you want to board this candidate as an employee? This will create an employee record and update the candidate status to "Offered".')) {
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

      // Get today's date for hired_date
      const today = new Date().toISOString().split('T')[0];

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
      // Corporate must send candidate's dealership so backend creates employee in correct dealership
      if (role === 'corporate' && candidate.dealership_id != null) {
        employeeData.dealership_id = candidate.dealership_id;
      }

      // Create employee (postJsonAuth sends X-Dealership-Id for corporate)
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

      // Update candidate status to "Offered"
      await updateCandidate({ status: 'Offered' });

      toast.success('Candidate successfully converted to employee!');
      
      // Optionally redirect to employees page
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
    if (score >= 8.1) return '#10B981'; // Excellent - green
    if (score >= 7.0) return '#3B82F6'; // Good - blue
    if (score >= 6.1) return '#F59E0B'; // Average - orange
    return '#EF4444'; // Poor - red
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
      // If no interviews yet, show awaiting status
      const currentStatus = candidate.stage || 'Awaiting';
      if (currentStatus === 'Awaiting' || currentStatus === 'Interviewing') {
        events.push({
          type: 'awaiting',
          title: 'Awaiting Interview 1',
          description: 'Candidate is waiting for the first interview.',
        });
      }
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
    
    // Parse each interview block
    interviewBlocks.forEach((block, blockIndex) => {
      // Normalize the block - add newlines where they should be for proper parsing
      // This handles cases where the backend might have stripped newlines
      let normalizedBlock = block
        .replace(/(Interview Stage:)([^\n])/g, '$1\n$2')
        .replace(/(Hiring Manager:)([^\n])/g, '$1\n$2')
        .replace(/(Role:)([^\n])/g, '$1\n$2')
        .replace(/(Interviewer Recommendation:)([^\n])/g, '$1\n$2')
        .replace(/(Scores:)([^\n])/g, '$1\n$2')
        .replace(/(Total Weighted Score:)([^\n])/g, '$1\n$2')
        .replace(/(Additional Notes:)([^\n])/g, '$1\n$2')
        .replace(/(\d+\/10\s*\(Weighted:)/g, '\n$1')  // Add newline before category scores
        .replace(/(Comments:)([^\n])/g, '\n  $1\n$2');  // Format comments properly
      
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
        } else if (line.startsWith('Role:')) {
          role = line.replace('Role:', '').trim();
        } else if (line.startsWith('Interviewer Recommendation:')) {
          recommendation = line.replace('Interviewer Recommendation:', '').trim();
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
            // Comment on separate line
            if (currentCategory) {
              // Extract comment text after "Comments:"
              const commentMatch = line.match(/Comments:\s*(.+)/);
              if (commentMatch) {
                currentCategory.comment = commentMatch[1].trim();
              } else {
                // Fallback: just remove "Comments:" prefix
                currentCategory.comment = line.replace(/.*Comments:\s*/, '').trim();
              }
            }
          } else if (currentCategory && currentCategory.comment && line.trim().length > 0 && !line.includes('/10') && !line.includes('Comments:')) {
            // Continuation of multi-line comment
            currentCategory.comment += ' ' + line.trim();
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
      
      // Extract sum score from totalScore
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
      
      // Create interview event
      // Use the actual stage number from the parsed data, or fall back to blockIndex + 1
      const interviewNumber = stage ? parseInt(stage, 10) || blockIndex + 1 : blockIndex + 1;
      
      // Debug: log what was parsed
      console.log(`\n=== Interview ${interviewNumber} Parsing Results ===`);
      console.log('Category scores found:', categoryScores.length);
      console.log('Category scores:', categoryScores);
      console.log('Total score string:', totalScore);
      console.log('Sum score (parsed):', sumScore);
      console.log('Recommendation:', recommendation);
      console.log('Additional notes:', additionalNotes ? 'Yes (' + additionalNotes.length + ' chars)' : 'No');
      
      events.push({
        type: 'interview',
        title: `Interview ${interviewNumber} Completed`,
        description: `Interview ${interviewNumber} completed by ${manager || 'Unknown Manager'}`,
        manager: manager,
        score: sumScore,
        recommendation: recommendation,
        categoryScores: categoryScores.length > 0 ? categoryScores : undefined,
        additionalNotes: additionalNotes || undefined,
        details: `${role ? `Role: ${role}\n` : ''}${totalScore ? `Total Score: ${totalScore}\n` : ''}${recommendation ? `Recommendation: ${recommendation}\n` : ''}`,
      });
      
      // Add awaiting event if recommendation is "Next Stage"
      if (recommendation === 'Next Stage' || recommendation === 'next-stage') {
        events.push({
          type: 'awaiting',
          title: `Awaiting Interview ${interviewNumber + 1}`,
          description: `Waiting for Interview ${interviewNumber + 1} to be scheduled.`,
        });
      } else if (recommendation === 'Hire' || recommendation === 'hire') {
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
                  <div className="px-3 py-1 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                    Status: {candidate.stage}
                  </div>
                  <div className="px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1" style={{ backgroundColor: '#4D6DBE', color: '#FFFFFF' }}>
                    <span>Overall Score:</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#FFFFFF' }}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{(candidate.overallScore * 10).toFixed(0)} / 100</span>
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
            {['Hiring Process', 'Resume'].map((tab) => (
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
                    {processEvents.map((event, index) => (
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
                                  event.type === 'interview' ? '#3B82F6' :
                                  event.type === 'awaiting' ? '#F59E0B' :
                                  '#6B7280',
                              }}
                            >
                              {event.type === 'added' && (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              )}
                              {event.type === 'interview' && (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                          <div className="flex-1">
                            <h3 className="text-base font-bold mb-1" style={{ color: '#232E40' }}>{event.title}</h3>
                            <p className="text-sm mb-2" style={{ color: '#6B7280' }}>{event.description}</p>
                            {event.manager && (
                              <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
                                <span className="font-semibold" style={{ color: '#232E40' }}>Manager:</span> {event.manager}
                              </p>
                            )}
                            
                            {/* Sum Score - Only show for interview events */}
                            {event.type === 'interview' && event.score !== undefined && (
                              <div className="mt-4 mb-3 p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                                <p className="text-sm font-bold" style={{ color: '#232E40' }}>
                                  <span>Sum Score: </span>
                                  <span style={{ color: getScoreColor(event.score / 10), fontWeight: 'bold', fontSize: '1rem' }}>
                                    {event.score}/100
                                  </span>
                                </p>
                              </div>
                            )}
                            
                            {/* Category Scores - Only show for interview events */}
                            {event.type === 'interview' && event.categoryScores && event.categoryScores.length > 0 && (
                              <div className="mt-4 mb-3">
                                <h4 className="text-sm font-bold mb-3" style={{ color: '#232E40' }}>Category Scores:</h4>
                                <div className="space-y-2.5">
                                  {event.categoryScores.map((catScore, idx) => (
                                    <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{catScore.category}</span>
                                        <span className="text-sm font-bold" style={{ color: '#4D6DBE' }}>{catScore.score}</span>
                                      </div>
                                      {catScore.comment && (
                                        <p className="text-xs mt-1.5 pt-1.5 border-t" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                                          <span className="font-semibold" style={{ color: '#374151' }}>Comments: </span>
                                          <span>{catScore.comment}</span>
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Interviewer Recommendation - Only show for interview events */}
                            {event.type === 'interview' && event.recommendation && (
                              <div className="mt-3 mb-2">
                                <p className="text-sm" style={{ color: '#6B7280' }}>
                                  <span className="font-semibold" style={{ color: '#232E40' }}>Interviewer Recommendation: </span>
                                  <span className="font-bold" style={{ 
                                    color: event.recommendation === 'Hire' ? '#10B981' : 
                                           event.recommendation === 'Next Stage' ? '#3B82F6' : 
                                           event.recommendation === 'No Hire' ? '#EF4444' : '#6B7280'
                                  }}>
                                    {event.recommendation}
                                  </span>
                                </p>
                              </div>
                            )}
                            
                            {/* Additional Notes - Only show for interview events */}
                            {event.type === 'interview' && event.additionalNotes && (
                              <div className="mt-4 mb-2">
                                <h4 className="text-sm font-bold mb-2" style={{ color: '#232E40' }}>Additional Notes:</h4>
                                <div className="p-3 rounded-lg text-sm whitespace-pre-wrap" style={{ backgroundColor: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' }}>
                                  {event.additionalNotes}
                                </div>
                              </div>
                            )}
                            
                            {event.date && (
                              <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>{event.date}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Personal Information */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.birthday}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.address}</span>
                  </div>
                </div>
              </div>

              {/* Education Information */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Education Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.university || 'Not Provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v9M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <span style={{ color: '#374151' }}>{candidate.degree || 'Not Provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span style={{ color: '#374151' }}>Referral: {candidate.referral || 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              {/* Hiring Decision Actions - only admin, hiring manager, and corporate can board */}
              {(role === 'admin' || role === 'hiring_manager' || role === 'corporate') && (
                <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <h3 className="text-sm font-bold mb-4" style={{ color: '#232E40' }}>Hiring Decision</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleConvertToEmployee}
                      disabled={saving}
                      className="cursor-pointer w-full bg-[#10B981] text-white py-2.5 rounded-lg font-semibold hover:bg-[#059669] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Board as Employee</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDenyApplication}
                      disabled={saving}
                      className="cursor-pointer w-full bg-[#EF4444] text-white py-2.5 rounded-lg font-semibold hover:bg-[#DC2626] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Deny Application</span>
                    </button>
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
