'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { getJsonAuth } from '@/lib/http';
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

export default function SurveysPage() {
  const [overallSatisfaction, setOverallSatisfaction] = useState<SatisfactionData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [sortBy, setSortBy] = useState<string>('Recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      }>(url);

      if (data.ok) {
        setOverallSatisfaction(data.overall_satisfaction || []);
        setDepartments(data.departments || []);
        
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
        // This is expected for managers who don't have access to survey analytics
        setOverallSatisfaction([]);
        setDepartments([]);
        setFeedback([]);
      } else {
        // Other errors - log but still set empty data
        console.error('Failed to fetch survey data:', error);
        setOverallSatisfaction([]);
        setDepartments([]);
        setFeedback([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyData();
  }, [startDate, endDate]);

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

          {/* Overall Satisfaction and Departments */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Overall Satisfaction */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${COLORS.gray[200]}` }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-medium" style={{ color: COLORS.gray[900] }}>Overall Satisfaction</h2>
                <a href="#" className="text-xs hover:underline" style={{ color: COLORS.primary }}>View more →</a>
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
                      <a href="#" className="text-xs font-medium hover:underline" style={{ color: COLORS.primary }}>View more →</a>
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
                <a href="#" className="text-xs font-medium hover:underline" style={{ color: COLORS.primary }}>View All →</a>
              </div>
            )}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
