'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { getJsonAuth, postJsonAuth, deleteJsonAuth } from '@/lib/http';
import { getToken, API_BASE } from '@/lib/auth';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// Modern color palette - cohesive and muted
const COLORS = {
  primary: '#3B5998',
  primaryLight: '#5B7BB8',
  secondary: '#6366F1',
  tertiary: '#8B5CF6',
  negative: '#e74c3c', // Star4ce brand red
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
};

const CHART_COLORS = ['#3B5998', '#94A3B8', '#e74c3c']; // Blue (positive), Gray (neutral), Red (negative)

type SatisfactionData = {
  name: string;
  value: number;
  percentage: number;
};

type DepartmentData = {
  name: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
};

type FeedbackItem = {
  id: number;
  department: string;
  date: string;
  sentiment: 'Highly Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Highly Negative';
  comment: string;
};

type AccessCodeItem = {
  id: number;
  code: string;
  dealership_id: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

type AccessCodeCreateResponse = {
  ok: boolean;
  id: number;
  code: string;
  dealership_id: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

export default function SurveysPage() {
  const [overallSatisfaction, setOverallSatisfaction] = useState<SatisfactionData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [surveysCreated, setSurveysCreated] = useState<number>(0);
  const [surveysTaken, setSurveysTaken] = useState<number>(0);
  const [surveysNeverTook, setSurveysNeverTook] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [sortBy, setSortBy] = useState<string>('Recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'access-codes'>('analytics');
  
  // Access codes state
  const [role, setRole] = useState<string | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AccessCodeCreateResponse | null>(null);
  const [codes, setCodes] = useState<AccessCodeItem[]>([]);
  const [copiedCodeId, setCopiedCodeId] = useState<number | 'latest' | null>(null);
  const [deletingCodeId, setDeletingCodeId] = useState<number | null>(null);
  // Initialize with current month
  const getCurrentMonthDates = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const currentMonth = getCurrentMonthDates();
  const [startDate, setStartDate] = useState<string>(currentMonth.start);
  const [endDate, setEndDate] = useState<string>(currentMonth.end);
  const [dateRangePreset, setDateRangePreset] = useState<string>('This month');
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const [showFeedbackDetailModal, setShowFeedbackDetailModal] = useState<FeedbackItem | null>(null);
  const [showAllFeedbackModal, setShowAllFeedbackModal] = useState(false);

  const handleDatePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'This month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'Month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case '3-Month':
        start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case '6-Month':
        start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'Year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      const queryString = params.toString();
      const url = `/analytics/surveys${queryString ? `?${queryString}` : ''}`;
      
      const data = await getJsonAuth<{
        ok: boolean;
        overall_satisfaction: SatisfactionData[];
        departments: DepartmentData[];
        feedback: FeedbackItem[];
        surveys_created?: number;
        surveys_taken?: number;
        surveys_never_took?: number;
      }>(url);

      if (data.ok) {
        setOverallSatisfaction(data.overall_satisfaction || []);
        setDepartments(data.departments || []);
        setSurveysCreated(data.surveys_created ?? 0);
        setSurveysTaken(data.surveys_taken ?? 0);
        setSurveysNeverTook(data.surveys_never_took ?? 0);
        
        // Map feedback sentiment to match the expected format
        const mappedFeedback = (data.feedback || []).map(item => {
          let sentiment: 'Highly Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Highly Negative' = 'Neutral';
          if (item.sentiment === 'Positive') {
            sentiment = 'Positive';
          } else if (item.sentiment === 'Negative') {
            sentiment = 'Negative';
          } else {
            sentiment = 'Neutral';
          }
          return {
            ...item,
            sentiment
          };
        });
        setFeedback(mappedFeedback);
      }
    } catch (error: any) {
      // Handle permission errors gracefully (403 - insufficient role)
      const errorMsg = error?.message || '';
      if (errorMsg.includes('403') || errorMsg.includes('forbidden') || errorMsg.includes('insufficient role')) {
        // User doesn't have permission - silently set empty data
        setOverallSatisfaction([]);
        setDepartments([]);
        setFeedback([]);
        setSurveysCreated(0);
        setSurveysTaken(0);
        setSurveysNeverTook(0);
      } else {
        // Other errors - log but still set empty data
        console.error('Failed to fetch survey data:', error);
        setOverallSatisfaction([]);
        setDepartments([]);
        setFeedback([]);
        setSurveysCreated(0);
        setSurveysTaken(0);
        setSurveysNeverTook(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyData();
  }, [startDate, endDate]);

  // Read role from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role');
      setRole(storedRole);
    }
  }, []);

  const frontendBase = typeof window !== 'undefined' ? window.location.origin : '';

  async function loadCodes() {
    setLoadingList(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('You are not logged in.');
        setCodes([]);
        return;
      }

      const data = await getJsonAuth<{
        ok?: boolean;
        items?: AccessCodeItem[];
        error?: string;
      }>('/survey/access-codes');

      setCodes(data.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load access codes';
      setError(msg);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (role && activeTab === 'access-codes') {
      loadCodes();
    }
  }, [role, activeTab]);

  async function handleGenerate() {
    setError(null);
    setResult(null);
    setLoadingCreate(true);

    try {
      const data = await postJsonAuth<AccessCodeCreateResponse>(
        '/survey/access-codes',
        {}
      );

      setResult(data);
      await loadCodes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create access code';
      setError(msg);
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleCopy(text: string, target: number | 'latest') {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCodeId(target);
      setTimeout(() => setCopiedCodeId(null), 1500);
    } catch {
      setError('Copy failed. Please select and copy manually.');
    }
  }

  async function handleCopySurveyLink(code: string, codeId: number) {
    const surveyLink = `${frontendBase}/survey?code=${encodeURIComponent(code)}`;
    await handleCopy(surveyLink, codeId);
  }

  async function handleDelete(codeId: number) {
    if (!confirm('Are you sure you want to delete this access code? This action cannot be undone.')) {
      return;
    }

    setDeletingCodeId(codeId);
    setError(null);

    try {
      await deleteJsonAuth(`/survey/access-codes/${codeId}`);
      await loadCodes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete access code';
      setError(msg);
    } finally {
      setDeletingCodeId(null);
    }
  }

  const isAdmin = role === 'admin';
  const canManageCodes = isAdmin || role === 'manager' || role === 'corporate';

  const getSentimentStyle = (sentiment: string) => {
    if (sentiment.includes('Positive')) return { bg: COLORS.gray[100], text: COLORS.gray[700] };
    if (sentiment.includes('Negative')) return { bg: '#fdf2f2', text: COLORS.negative }; // Brand red for negative
    return { bg: COLORS.gray[100], text: COLORS.gray[500] };
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
          <HubSidebar />
          <main className="ml-64 p-8 flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }}></div>
              <p style={{ color: COLORS.gray[500] }}>Loading surveys...</p>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ backgroundColor: COLORS.gray[50] }}>
        <HubSidebar />
        <main className="ml-64 p-8 flex-1" style={{ maxWidth: 'calc(100vw - 256px)' }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-1" style={{ color: COLORS.gray[900] }}>Surveys</h1>
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>
                  Access detailed insights and analytics to evaluate and improve your dealership's performance.
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: COLORS.gray[200] }}>
            <button
              onClick={() => setActiveTab('analytics')}
              className="cursor-pointer px-4 py-3 text-sm font-semibold transition-all relative"
              style={{
                color: activeTab === 'analytics' ? COLORS.primary : COLORS.gray[500],
              }}
            >
              Analytics
              {activeTab === 'analytics' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: COLORS.primary }}></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('access-codes')}
              className="cursor-pointer px-4 py-3 text-sm font-semibold transition-all relative"
              style={{
                color: activeTab === 'access-codes' ? COLORS.primary : COLORS.gray[500],
              }}
            >
              Access Codes
              {activeTab === 'access-codes' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: COLORS.primary }}></div>
              )}
            </button>
          </div>

          {activeTab === 'analytics' && (
            <>
              <div className="mb-8">
                <div className="flex items-start justify-between">
                  <div></div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: COLORS.gray[700], width: '120px' }}
                  />
                  <span className="text-sm" style={{ color: COLORS.gray[300] }}>—</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: COLORS.gray[700], width: '120px' }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={dateRangePreset}
                    onChange={(e) => handleDatePresetChange(e.target.value)}
                    className="text-sm py-2 px-4 pr-8 appearance-none cursor-pointer rounded-lg"
                    style={{ 
                      border: `1px solid ${COLORS.gray[200]}`, 
                      color: COLORS.gray[700], 
                      backgroundColor: '#fff',
                    }}
                  >
                    <option>This month</option>
                    <option>Month</option>
                    <option>3-Month</option>
                    <option>6-Month</option>
                    <option>Year</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: COLORS.gray[400] }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Survey summary: created, taken, never took */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>Surveys created</p>
              <p className="text-2xl font-semibold" style={{ color: '#394B67' }}>{surveysCreated}</p>
              <p className="text-xs mt-1" style={{ color: COLORS.gray[400] }}>Access codes in date range</p>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>Surveys taken</p>
              <p className="text-2xl font-semibold" style={{ color: COLORS.primary }}>{surveysTaken}</p>
              <p className="text-xs mt-1" style={{ color: COLORS.gray[400] }}>Submitted in date range</p>
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.gray[400] }}>Never took</p>
              <p className="text-2xl font-semibold" style={{ color: COLORS.negative }}>{surveysNeverTook}</p>
              <p className="text-xs mt-1" style={{ color: COLORS.gray[400] }}>Codes with no response</p>
            </div>
          </div>

          {/* Overall Satisfaction and Departments */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Overall Satisfaction */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-medium" style={{ color: COLORS.gray[900] }}>Overall Satisfaction</h2>
                <button type="button" onClick={() => setShowSatisfactionModal(true)} className="text-xs hover:underline cursor-pointer bg-transparent border-none p-0" style={{ color: COLORS.primary }}>View more →</button>
              </div>
              <div className="flex items-center justify-center">
                {overallSatisfaction.length > 0 ? (
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={overallSatisfaction}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          paddingAngle={2}
                          stroke="none"
                        >
                          {overallSatisfaction.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: `1px solid ${COLORS.gray[200]}`,
                            borderRadius: '8px',
                            boxShadow: 'none'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-8 mt-4">
                      {overallSatisfaction.map((item, idx) => (
                        <div key={idx} className="text-center">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx] }}></div>
                            <span className="text-xs font-medium" style={{ color: COLORS.gray[600] }}>{item.name}</span>
                          </div>
                          <div className="text-lg font-semibold" style={{ color: '#394B67' }}>{item.value}</div>
                          <div className="text-xs" style={{ color: COLORS.gray[400] }}>{item.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: COLORS.gray[500] }}>No survey data available for the selected date range.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Departments */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="mb-4">
                <h2 className="text-sm font-medium mb-1" style={{ color: COLORS.gray[900] }}>Departments</h2>
                <p className="text-xs" style={{ color: COLORS.gray[500] }}>
                  Survey insights for each department to understand team sentiment.
                </p>
              </div>
              <div className="flex items-center gap-4 mb-4">
                {['Positive', 'Neutral', 'Negative'].map((label, idx) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx] }}></div>
                    <span className="text-xs" style={{ color: COLORS.gray[500] }}>{label}</span>
                  </div>
                ))}
              </div>
              {departments.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {departments.map((dept, idx) => {
                    const deptData = [
                      { name: 'Positive', value: dept.positive },
                      { name: 'Neutral', value: dept.neutral },
                      { name: 'Negative', value: dept.negative },
                    ];
                    return (
                      <div key={idx} className="text-center p-3 rounded-lg" style={{ backgroundColor: COLORS.gray[50] }}>
                        <h3 className="text-xs font-medium mb-2 truncate" style={{ color: COLORS.gray[700] }}>{dept.name}</h3>
                        <ResponsiveContainer width="100%" height={80}>
                          <PieChart>
                            <Pie
                              data={deptData}
                              cx="50%"
                              cy="50%"
                              innerRadius={20}
                              outerRadius={35}
                              dataKey="value"
                              paddingAngle={2}
                              stroke="none"
                            >
                              {deptData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${COLORS.gray[200]}`, boxShadow: 'none' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="text-xs font-medium" style={{ color: COLORS.gray[500] }}>
                          {dept.positive.toFixed(0)}% positive
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: COLORS.gray[500] }}>No department data available for the selected date range.</p>
                </div>
              )}
            </div>
          </div>

          {/* View Written Feedback */}
          <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
            <div className="mb-4">
              <h2 className="text-sm font-medium mb-1" style={{ color: COLORS.gray[900] }}>Written Feedback</h2>
              <p className="text-xs" style={{ color: COLORS.gray[500] }}>
                Browse recent survey comments to understand employee sentiment.
              </p>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1" style={{ maxWidth: '280px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search feedback..."
                  className="w-full text-sm rounded-lg px-4 py-2 pl-9" 
                  style={{ border: `1px solid ${COLORS.gray[200]}`, color: COLORS.gray[700], backgroundColor: '#fff' }}
                />
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: COLORS.gray[400] }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="relative">
                <select 
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="text-sm py-2 px-4 pr-8 appearance-none cursor-pointer rounded-lg" 
                  style={{ border: `1px solid ${COLORS.gray[200]}`, color: COLORS.gray[700], backgroundColor: '#fff' }}
                >
                  <option>All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.name}>{dept.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: COLORS.gray[400] }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm py-2 px-4 pr-8 appearance-none cursor-pointer rounded-lg" 
                  style={{ border: `1px solid ${COLORS.gray[200]}`, color: COLORS.gray[700], backgroundColor: '#fff' }}
                >
                  <option>Recent</option>
                  <option>Oldest</option>
                  <option>Most Positive</option>
                  <option>Most Negative</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: COLORS.gray[400] }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            {feedback.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {feedback
                  .filter(item => {
                    // Filter by department
                    if (selectedDepartment !== 'All Departments' && item.department !== selectedDepartment) {
                      return false;
                    }
                    // Filter by search query
                    if (searchQuery && !item.comment.toLowerCase().includes(searchQuery.toLowerCase()) && 
                        !item.department.toLowerCase().includes(searchQuery.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    // Sort by selected option
                    if (sortBy === 'Recent') {
                      return b.id - a.id;
                    } else if (sortBy === 'Oldest') {
                      return a.id - b.id;
                    } else if (sortBy === 'Most Positive') {
                      const sentimentOrder = { 'Highly Positive': 5, 'Positive': 4, 'Neutral': 3, 'Negative': 2, 'Highly Negative': 1 };
                      return (sentimentOrder[b.sentiment] || 0) - (sentimentOrder[a.sentiment] || 0);
                    } else if (sortBy === 'Most Negative') {
                      const sentimentOrder = { 'Highly Positive': 1, 'Positive': 2, 'Neutral': 3, 'Negative': 4, 'Highly Negative': 5 };
                      return (sentimentOrder[b.sentiment] || 0) - (sentimentOrder[a.sentiment] || 0);
                    }
                    return 0;
                  })
                  .map((item) => {
                  const style = getSentimentStyle(item.sentiment);
                  return (
                    <div 
                      key={item.id} 
                      className="rounded-lg p-4" 
                      style={{ backgroundColor: COLORS.gray[50], border: `1px solid ${COLORS.gray[100]}` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-sm font-medium" style={{ color: COLORS.gray[800] }}>{item.department}</span>
                          <span className="text-xs ml-2" style={{ color: COLORS.gray[400] }}>{item.date}</span>
                        </div>
                        <span 
                          className="text-xs font-medium px-2 py-1 rounded"
                          style={{ color: style.text, backgroundColor: style.bg }}
                        >
                          {item.sentiment}
                        </span>
                      </div>
                      <p className="text-sm mb-3 line-clamp-3" style={{ color: COLORS.gray[600] }}>{item.comment}</p>
                      <button type="button" onClick={() => setShowFeedbackDetailModal(item)} className="text-xs font-medium hover:underline cursor-pointer bg-transparent border-none p-0" style={{ color: COLORS.primary }}>View more →</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: COLORS.gray[500] }}>No feedback available for the selected filters.</p>
              </div>
            )}
            {feedback.length > 0 && (
              <div className="text-right">
                <button type="button" onClick={() => setShowAllFeedbackModal(true)} className="text-xs font-medium hover:underline cursor-pointer bg-transparent border-none p-0" style={{ color: COLORS.primary }}>View All →</button>
              </div>
            )}
          </div>
            </>
          )}

          {activeTab === 'access-codes' && (
            <div className="max-w-5xl">
              {!role && (
                <div className="rounded-xl p-6 mb-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <p className="text-base" style={{ color: '#6B7280' }}>
                    Checking your permissions…
                  </p>
                </div>
              )}

              {role && !canManageCodes && (
                <div className="rounded-xl p-6 mb-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <p className="text-base" style={{ color: '#DC2626' }}>
                    You do not have permission to create and manage survey access codes.
                  </p>
                </div>
              )}

              {canManageCodes && (
                <div className="space-y-6 rounded-xl p-8 transition-all duration-200 hover:shadow-lg" style={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                }}>
                  {error && (
                    <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <p className="text-base" style={{ color: '#374151' }}>
                    Generate a one-week survey access code for your dealership.
                    You can send this code or the survey link to your employees.
                  </p>

                  <button
                    onClick={handleGenerate}
                    disabled={loadingCreate}
                    className="cursor-pointer inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: '#4D6DBE',
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingCreate) e.currentTarget.style.backgroundColor = '#3d5a9e';
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingCreate) e.currentTarget.style.backgroundColor = '#4D6DBE';
                    }}
                  >
                    {loadingCreate ? 'Creating code…' : 'Create 7-day access code'}
                  </button>

                  {result && (
                    <div className="mt-2 space-y-1 text-sm">
                      <div>
                        <span className="font-semibold">Latest code:</span>{' '}
                        <code className="bg-slate-100 px-2 py-1 rounded">
                          {result.code}
                        </code>
                      </div>
                      <div>
                        <span className="font-semibold">Survey link:</span>{' '}
                        <code className="bg-slate-100 px-2 py-1 rounded break-all">
                          {`${frontendBase}/survey?code=${encodeURIComponent(result.code)}`}
                        </code>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 mt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
                    {codes.length > 0 && (
                      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-700">Latest access code</div>
                            <div className="mt-1 font-mono text-lg text-slate-900">{codes[0].code}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {`Survey link: ${frontendBase}/survey?code=${encodeURIComponent(codes[0].code)}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(codes[0].code, 'latest')}
                            className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {copiedCodeId === 'latest' ? 'Copied' : 'Copy code'}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold" style={{ color: '#232E40' }}>
                        Your access codes
                      </h2>
                      <button
                        onClick={loadCodes}
                        disabled={loadingList}
                        className="cursor-pointer text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:underline"
                        style={{ color: '#4D6DBE' }}
                      >
                        {loadingList ? 'Refreshing…' : 'Refresh list'}
                      </button>
                    </div>

                    {loadingList && codes.length === 0 && (
                      <p className="text-sm" style={{ color: '#6B7280' }}>Loading access codes…</p>
                    )}

                    {!loadingList && codes.length === 0 && (
                      <p className="text-sm" style={{ color: '#6B7280' }}>
                        No access codes yet. Create your first code above.
                      </p>
                    )}

                    {codes.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm rounded-lg overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                          <thead style={{ backgroundColor: '#F9FAFB' }}>
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151', width: '40px' }}></th>
                              <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Code</th>
                              <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Created</th>
                              <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Expires</th>
                              <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Status</th>
                              <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151' }}>Survey link</th>
                              <th className="px-4 py-3 text-left font-semibold" style={{ color: '#374151', width: '60px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {codes.map(c => {
                              const created = new Date(c.created_at).toLocaleString();
                              const expires = c.expires_at
                                ? new Date(c.expires_at).toLocaleString()
                                : 'No expiry';

                              const isExpired =
                                !!c.expires_at &&
                                new Date(c.expires_at).getTime() < Date.now();

                              const status = !c.is_active
                                ? 'Inactive'
                                : isExpired
                                ? 'Expired'
                                : 'Active';

                              return (
                                <tr key={c.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(c.id)}
                                      disabled={deletingCodeId === c.id}
                                      className="cursor-pointer text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      title="Delete access code"
                                    >
                                      {deletingCodeId === c.id ? (
                                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 font-mono" style={{ color: '#232E40' }}>{c.code}</td>
                                  <td className="px-4 py-3" style={{ color: '#374151' }}>{created}</td>
                                  <td className="px-4 py-3" style={{ color: '#374151' }}>{expires}</td>
                                  <td className="px-4 py-3">
                                    <span
                                      style={{
                                        color: status === 'Active'
                                          ? '#059669'
                                          : status === 'Expired'
                                          ? '#D97706'
                                          : '#6B7280'
                                      }}
                                      className="font-medium"
                                    >
                                      {status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <code className="px-2 py-1 rounded break-all" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                                      {`${frontendBase}/survey?code=${encodeURIComponent(c.code)}`}
                                    </code>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => handleCopySurveyLink(c.code, c.id)}
                                      className="cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
                                      title={copiedCodeId === c.id ? 'Copied!' : 'Copy survey link'}
                                    >
                                      {copiedCodeId === c.id ? (
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overall Satisfaction View more modal */}
          {showSatisfactionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowSatisfactionModal(false)}>
              <div className="rounded-xl p-6 max-w-lg w-full shadow-xl" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: COLORS.gray[900] }}>Overall Satisfaction</h2>
                  <button type="button" onClick={() => setShowSatisfactionModal(false)} className="cursor-pointer p-1 rounded hover:bg-gray-100" aria-label="Close">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                {overallSatisfaction.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={overallSatisfaction} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={2} stroke="none">
                          {overallSatisfaction.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}`, borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-8 mt-4">
                      {overallSatisfaction.map((item, idx) => (
                        <div key={idx} className="text-center">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx] }} />
                            <span className="text-sm font-medium" style={{ color: COLORS.gray[600] }}>{item.name}</span>
                          </div>
                          <div className="text-xl font-semibold" style={{ color: '#394B67' }}>{item.value}</div>
                          <div className="text-sm" style={{ color: COLORS.gray[400] }}>{item.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm py-6 text-center" style={{ color: COLORS.gray[500] }}>No survey data available for the selected date range.</p>
                )}
              </div>
            </div>
          )}

          {/* Single feedback View more modal */}
          {showFeedbackDetailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowFeedbackDetailModal(null)}>
              <div className="rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-xl" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h2 className="text-lg font-semibold" style={{ color: COLORS.gray[900] }}>Written Feedback</h2>
                  <button type="button" onClick={() => setShowFeedbackDetailModal(null)} className="cursor-pointer p-1 rounded hover:bg-gray-100" aria-label="Close">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <span className="text-sm font-medium" style={{ color: COLORS.gray[800] }}>{showFeedbackDetailModal.department}</span>
                  <span className="text-xs" style={{ color: COLORS.gray[400] }}>{showFeedbackDetailModal.date}</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded mb-3 inline-block flex-shrink-0" style={{ ...getSentimentStyle(showFeedbackDetailModal.sentiment) }}>{showFeedbackDetailModal.sentiment}</span>
                <p className="text-sm overflow-y-auto flex-1 pr-2" style={{ color: COLORS.gray[600], whiteSpace: 'pre-wrap' }}>{showFeedbackDetailModal.comment}</p>
              </div>
            </div>
          )}

          {/* View All feedback modal */}
          {showAllFeedbackModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAllFeedbackModal(false)}>
              <div className="rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h2 className="text-lg font-semibold" style={{ color: COLORS.gray[900] }}>All Written Feedback</h2>
                  <button type="button" onClick={() => setShowAllFeedbackModal(false)} className="cursor-pointer p-1 rounded hover:bg-gray-100" aria-label="Close">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                  {(() => {
                    const filtered = feedback.filter(item => {
                      if (selectedDepartment !== 'All Departments' && item.department !== selectedDepartment) return false;
                      if (searchQuery && !item.comment.toLowerCase().includes(searchQuery.toLowerCase()) && !item.department.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                      return true;
                    });
                    const sorted = [...filtered].sort((a, b) => {
                      if (sortBy === 'Recent') return b.id - a.id;
                      if (sortBy === 'Oldest') return a.id - b.id;
                      if (sortBy === 'Most Positive') {
                        const o: Record<string, number> = { 'Highly Positive': 5, 'Positive': 4, 'Neutral': 3, 'Negative': 2, 'Highly Negative': 1 };
                        return (o[b.sentiment] || 0) - (o[a.sentiment] || 0);
                      }
                      if (sortBy === 'Most Negative') {
                        const o: Record<string, number> = { 'Highly Positive': 1, 'Positive': 2, 'Neutral': 3, 'Negative': 4, 'Highly Negative': 5 };
                        return (o[b.sentiment] || 0) - (o[a.sentiment] || 0);
                      }
                      return 0;
                    });
                    if (sorted.length === 0) return <p className="text-sm text-center py-6" style={{ color: COLORS.gray[500] }}>No feedback available for the selected filters.</p>;
                    return sorted.map((item) => {
                      const style = getSentimentStyle(item.sentiment);
                      return (
                        <div key={item.id} className="rounded-lg p-4" style={{ backgroundColor: COLORS.gray[50], border: `1px solid ${COLORS.gray[100]}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: COLORS.gray[800] }}>{item.department}</span>
                            <span className="text-xs" style={{ color: COLORS.gray[400] }}>{item.date}</span>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 rounded inline-block mb-2" style={{ color: style.text, backgroundColor: style.bg }}>{item.sentiment}</span>
                          <p className="text-sm" style={{ color: COLORS.gray[600], whiteSpace: 'pre-wrap' }}>{item.comment}</p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
