'use client';

import { useEffect, useState } from 'react';
import HubSidebar from '@/components/sidebar/HubSidebar';
import RequireAuth from '@/components/layout/RequireAuth';
import { API_BASE, getToken } from '@/lib/auth';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type SatisfactionData = {
  name: string;
  value: number;
  percentage: number;
  color: string;
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
  const [selectedSentiment, setSelectedSentiment] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [sortBy, setSortBy] = useState<string>('Recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2025-09-01');
  const [endDate, setEndDate] = useState<string>('2025-09-22');
  const [dateRangePreset, setDateRangePreset] = useState<string>('This month');

  const handleDatePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
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

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setOverallSatisfaction([
        { name: 'Positive', value: 45, percentage: 50.0, color: '#3b82f6' },
        { name: 'Neutral', value: 30, percentage: 33.3, color: '#eab308' },
        { name: 'Negative', value: 15, percentage: 16.7, color: '#ef4444' },
      ]);

      setDepartments([
        { name: 'Sales', positive: 33.3, neutral: 33.3, negative: 33.4, total: 100 },
        { name: 'Parts and Service', positive: 18.2, neutral: 45.5, negative: 36.3, total: 100 },
        { name: 'Office', positive: 66.7, neutral: 16.7, negative: 16.6, total: 100 },
        { name: 'Administration', positive: 42.9, neutral: 28.6, negative: 28.5, total: 100 },
        { name: 'Onboarding', positive: 60.0, neutral: 20.0, negative: 20.0, total: 100 },
        { name: 'Exit', positive: 6.7, neutral: 13.3, negative: 80.0, total: 100 },
      ]);

      setFeedback([
        {
          id: 1,
          department: 'Sales',
          date: 'April 10, 2023',
          sentiment: 'Highly Positive',
          comment: "Management has been very supportive, but I'd like clearer communication about upcoming changes....",
        },
        {
          id: 2,
          department: 'Office',
          date: 'February 5, 2023',
          sentiment: 'Highly Negative',
          comment: 'While I appreciate the support from management, I feel that more transparency regarding...',
        },
        {
          id: 3,
          department: 'Office',
          date: 'January 20, 2023',
          sentiment: 'Highly Negative',
          comment: "I value the backing from management, but I believe clearer updates on future changes would help us all stay aligned.",
        },
        {
          id: 4,
          department: 'Administration',
          date: 'May 25, 2023',
          sentiment: 'Neutral',
          comment: "Management's support is commendable, yet I think we could improve by having more straightforward...",
        },
        {
          id: 5,
          department: 'Sales',
          date: 'June 30, 2023',
          sentiment: 'Neutral',
          comment: "I'm grateful for the support from management, but I would really appreciate clearer insights into the....",
        },
        {
          id: 6,
          department: 'Parts and Service',
          date: 'July 15, 2023',
          sentiment: 'Highly Negative',
          comment: 'Management has shown great support, but I would love to see more clarity on what changes are coming...',
        },
      ]);

      setLoading(false);
    }, 500);
  }, []);

  const getSentimentColor = (sentiment: string) => {
    if (sentiment.includes('Positive')) return '#22c55e';
    if (sentiment.includes('Negative')) return '#ef4444';
    return '#eab308';
  };

  const departmentColors = {
    positive: '#3b82f6',
    neutral: '#eab308',
    negative: '#ef4444',
  };

  return (
    <RequireAuth>
      <div className="flex min-h-screen" style={{ width: '100%', overflow: 'hidden', backgroundColor: '#F5F7FA' }}>
        <HubSidebar />
        <main className="ml-64 p-8 pl-10 flex-1" style={{ overflowX: 'hidden', minWidth: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#232E40', letterSpacing: '-0.02em' }}>Surveys</h1>
              <p className="text-base" style={{ color: '#6B7280' }}>
                Access detailed insights and analytics to evaluate and improve your dealership's performance.
              </p>
            </div>
            <div className="flex justify-end">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8F9FA', border: '1px solid #E0E4E8' }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: '#374151', width: '120px' }}
                  />
                  <span className="text-sm" style={{ color: '#6B7280' }}>|</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                    style={{ color: '#374151', width: '120px' }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={dateRangePreset}
                    onChange={(e) => handleDatePresetChange(e.target.value)}
                    className="text-sm py-2.5 appearance-none cursor-pointer rounded-lg"
                    style={{ 
                      border: '1px solid #E5E7EB', 
                      color: '#374151', 
                      backgroundColor: '#FFFFFF', 
                      paddingLeft: '1rem', 
                      paddingRight: '2.5rem',
                      minWidth: '140px'
                    }}
                  >
                    <option>This month</option>
                    <option>Month</option>
                    <option>3-Month</option>
                    <option>6-Month</option>
                    <option>Year</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Satisfaction and Departments */}
          <div className="grid grid-cols-2 gap-6 mb-8" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {/* Overall Satisfaction */}
            <div className="rounded-xl p-8 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: '#232E40' }}>Overall Satisfaction</h2>
                <a href="#" className="text-sm hover:underline" style={{ color: '#4D6DBE' }}>View more &gt;</a>
              </div>
              {loading ? (
                <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
                  <div className="text-sm font-medium">Loading...</div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={overallSatisfaction}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {overallSatisfaction.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-6">
                      {overallSatisfaction.map((item, idx) => (
                        <div key={idx} className="text-center">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm font-semibold" style={{ color: '#232E40' }}>{item.name}</span>
                          </div>
                          <div className="text-lg font-bold" style={{ color: '#374151' }}>{item.value}</div>
                          <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{item.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Departments */}
            <div className="rounded-xl p-8 transition-all duration-200 hover:shadow-lg" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2" style={{ color: '#232E40' }}>Departments</h2>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  View survey insights for each department to understand team sentiment and performance. Compare results across Sales, Parts & Service, Office, Administration, and other areas to identify strengths, challenges, and opportunities for improvement.
                </p>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: departmentColors.positive }}></div>
                  <span className="text-sm" style={{ color: '#374151' }}>Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: departmentColors.neutral }}></div>
                  <span className="text-sm" style={{ color: '#374151' }}>Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: departmentColors.negative }}></div>
                  <span className="text-sm" style={{ color: '#374151' }}>Negative</span>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
                  <div className="text-sm font-medium">Loading...</div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {departments.map((dept, idx) => {
                    const deptData = [
                      { name: 'Positive', value: dept.positive, color: departmentColors.positive },
                      { name: 'Neutral', value: dept.neutral, color: departmentColors.neutral },
                      { name: 'Negative', value: dept.negative, color: departmentColors.negative },
                    ];
                    return (
                      <div key={idx} className="text-center">
                        <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>{dept.name}</h3>
                        <ResponsiveContainer width="100%" height={120}>
                          <PieChart>
                            <Pie
                              data={deptData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              dataKey="value"
                              paddingAngle={2}
                            >
                              {deptData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-2 text-xs font-medium" style={{ color: '#6B7280' }}>
                          {dept.positive.toFixed(1)}% Positive
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* View Written Feedback */}
          <div className="rounded-xl p-8 transition-all duration-200 hover:shadow-lg" style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: '#232E40' }}>View Written Feedback</h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Browse all recent survey comments to understand employee sentiment. Quickly spot trends, identify areas of concern, and highlight experiences shared by your team.
              </p>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative" style={{ width: '300px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search feedback..."
                  className="w-full text-sm rounded-lg px-4 py-2 pl-10" 
                  style={{ border: '1px solid #D1D5DB', color: '#374151', backgroundColor: '#FFFFFF' }}
                />
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: '#9CA3AF' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: '#6B7280' }}>All Departments</span>
                  <div className="relative">
                    <select 
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="text-sm py-2.5 appearance-none cursor-pointer rounded-lg" 
                      style={{ 
                        border: '1px solid #E5E7EB', 
                        color: '#374151', 
                        backgroundColor: '#FFFFFF', 
                        paddingLeft: '1rem', 
                        paddingRight: '2.5rem',
                        minWidth: '160px'
                      }}
                    >
                      <option>Sales</option>
                      <option>Parts and Service</option>
                      <option>Office</option>
                      <option>Administration</option>
                      <option>Onboarding</option>
                      <option>Exit</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: '#6B7280' }}>Sort by</span>
                  <div className="relative">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-sm py-2.5 appearance-none cursor-pointer rounded-lg" 
                      style={{ 
                        border: '1px solid #E5E7EB', 
                        color: '#374151', 
                        backgroundColor: '#FFFFFF', 
                        paddingLeft: '1rem', 
                        paddingRight: '2.5rem',
                        minWidth: '140px'
                      }}
                    >
                      <option>Recent</option>
                      <option>Oldest</option>
                      <option>Most Positive</option>
                      <option>Most Negative</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6B7280' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
            </div>
            {loading ? (
              <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
                <div className="text-sm font-medium">Loading...</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {feedback
                    .filter(item => {
                      if (searchQuery && !item.comment.toLowerCase().includes(searchQuery.toLowerCase()) && 
                          !item.department.toLowerCase().includes(searchQuery.toLowerCase())) {
                        return false;
                      }
                      return true;
                    })
                    .map((item) => (
                    <div 
                      key={item.id} 
                      className="rounded-lg p-3 border" 
                      style={{ 
                        backgroundColor: '#FFFFFF', 
                        borderColor: '#E5E7EB'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-semibold" style={{ color: '#374151' }}>{item.department}</span>
                          <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>{item.date}</span>
                        </div>
                        <span 
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={{ 
                            color: getSentimentColor(item.sentiment),
                            backgroundColor: getSentimentColor(item.sentiment) + '20'
                          }}
                        >
                          {item.sentiment}
                        </span>
                      </div>
                      <p className="text-sm mb-2 line-clamp-3" style={{ color: '#6B7280' }}>{item.comment}</p>
                      <a href="#" className="text-xs hover:underline" style={{ color: '#4D6DBE' }}>View more &gt;</a>
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <a href="#" className="text-sm hover:underline" style={{ color: '#4D6DBE' }}>View All &gt;</a>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

