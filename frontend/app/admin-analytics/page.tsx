'use client';

import { useState, useEffect, useCallback } from 'react';
import type React from 'react'; // Explicit React import
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, RadialLinearScale, Filler } from 'chart.js';
import { Pie, Doughnut, Line, Bar, Radar } from 'react-chartjs-2';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removed Tabs imports as they aren't used
import { Activity, Users, MessageSquare, Languages, FileCheck, AlertTriangle, BarChart3 } from 'lucide-react';
import { Loader2, AlertCircle, Flag } from 'lucide-react'; // Ensure Loader2 is imported
// Removed AdminLayout import as it's commented out later
// import { AdminLayout } from '@/components/AdminLayout';
// Removed specific chart imports if using inline logic below
// import { TopicsChart } from "@/components/charts/TopicsChart";
// import { LanguagesChart } from "@/components/charts/LanguagesChart";
// import { BiasTypesChart } from "@/components/charts/BiasTypesChart";
// import { ResponseTimesChart } from "@/components/charts/ResponseTimesChart";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, RadialLinearScale, Filler
);

// Interface remains the same
interface AnalyticsData {
  conversations?: {
    total_conversations?: number;
    conversations_by_date?: { [key: string]: number };
    language_distribution?: { [key: string]: number };
    topic_distribution?: { [key: string]: number };
    response_times?: number[];
    messages_per_conversation?: number[];
    avg_messages_per_conversation?: number;
    bias_metrics?: {
      bias_detected_count?: number;
      bias_prevented_count?: number;
      bias_types?: { [key: string]: number };
      prevention_rate?: number;
    };
    last_updated?: string;
  };
  users?: {
    total_users?: number;
    active_users?: number;
    new_users?: number;
    retention_rate?: number;
  };
  feedback?: {
    total_feedback?: number;
    accuracy_ratings?: {
      accurate?: number;
      inaccurate?: number;
      other?: number;
      unsure?: number;
    };
    calculated_accuracy_rate?: number;
    feedback_by_date?: { [key: string]: number };
    response_quality?: {
      helpful?: number;
      not_helpful?: number;
    };
    last_updated?: string | null;
  };
}

// --- Reusable UI Components ---

// Chart placeholder component
const ChartPlaceholder = ({ message = "No data available for this period." }: { message?: string }) => (
  <div className="flex items-center justify-center h-72 text-sm text-gray-500 bg-gray-100 rounded-md border">
      {message}
  </div>
);

// Generic Chart Card Wrapper
interface AnalyticsChartCardProps {
  title: string;
  description?: string;
  isLoading: boolean;
  children: React.ReactNode;
  chartHeightClass?: string;
}

const AnalyticsChartCard: React.FC<AnalyticsChartCardProps> = ({
  title, description, isLoading, children, chartHeightClass = "h-72"
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={chartHeightClass}>
          {isLoading ? (
            <div className={`flex items-center justify-center ${chartHeightClass}`}>
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Metric Card Component (Move to components/MetricCard.tsx) ---
export interface MetricCardProps {
  title: string;
  value: string | number; // Allow number as well
  icon: React.ReactNode;
  description?: string; // Add optional description
  isLoading?: boolean; // Add the isLoading prop (optional)
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  description,
  isLoading // Destructure the new prop
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        {/* Conditionally render Loader or Value */}
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && !isLoading && ( // Only show description if not loading
           <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
// --- End Metric Card Component ---

// --- End Reusable UI Components ---


// --- Specific Chart Logic Components (Inline or Imported) ---

// Daily Engagement Chart Logic
const DailyEngagementChartContent = ({ data }: { data: AnalyticsData | null }): React.ReactNode => {
    const engagementData = data?.conversations?.conversations_by_date;
    if (!engagementData || Object.keys(engagementData).length === 0) {
        return <ChartPlaceholder message="No daily engagement data." />;
    }
    const sortedDates = Object.keys(engagementData).sort();
    const conversationCounts = sortedDates.map(date => engagementData[date] || 0);

    const chartData = {
      labels: sortedDates, // Use all sorted dates from the year
      datasets: [
        {
          label: 'Conversations', data: conversationCounts, borderColor: 'rgb(99, 102, 241)', backgroundColor: 'rgba(99, 102, 241, 0.1)', tension: 0.1, fill: true, pointRadius: 1, pointHoverRadius: 3,
        },
      ],
    };
    const options: any = { // Use 'any' for options or define a stricter type
      responsive: true, maintainAspectRatio: false,
      scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }},
          x: { ticks: { maxTicksLimit: 12, maxRotation: 45, minRotation: 0 }} // Limit ticks for readability
      },
      plugins: { legend: { position: 'top' as const }}};
    return <Line data={chartData} options={options} />;
};

// Topics Chart Logic
const TopicsChartContent = ({ data }: { data: AnalyticsData | null }): React.ReactNode => {
    const topicData = data?.conversations?.topic_distribution;
    if (!topicData || Object.keys(topicData).length === 0) return <ChartPlaceholder />;
    const chartData = {
        labels: Object.keys(topicData),
        datasets: [{
            data: Object.values(topicData),
            backgroundColor: ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)'],
            borderColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)', 'rgb(75, 192, 192)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)'],
            borderWidth: 1,
        }]
    };
    const options: any = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' as const } }};
    return <Doughnut data={chartData} options={options} />;
}

// Languages Chart Logic
const LanguagesChartContent = ({ data }: { data: AnalyticsData | null }): React.ReactNode => {
    const langData = data?.conversations?.language_distribution;
     if (!langData || Object.keys(langData).length === 0) return <ChartPlaceholder />;
    const chartData = {
        labels: Object.keys(langData),
        datasets: [{
            data: Object.values(langData),
            backgroundColor: ['rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)'],
            borderColor: ['rgb(153, 102, 255)', 'rgb(255, 159, 64)', 'rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)', 'rgb(75, 192, 192)'],
            borderWidth: 1,
         }]
    };
    const options: any = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' as const } }};
    return <Pie data={chartData} options={options} />;
}

// Bias Types Chart Logic
const BiasTypesChartContent = ({ data }: { data: AnalyticsData | null }): React.ReactNode => {
    const biasData = data?.conversations?.bias_metrics?.bias_types;
     if (!biasData || Object.keys(biasData).length === 0) return <ChartPlaceholder message="No bias types detected for this period."/>; // Specific message
    const chartData = {
        labels: Object.keys(biasData),
        datasets: [{ label: 'Count', data: Object.values(biasData), backgroundColor: 'rgba(75, 192, 192, 0.7)', borderColor: 'rgb(75, 192, 192)' }]
    };
    const options: any = { responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const, scales: { x: { beginAtZero: true }}, plugins: { legend: { display: false } }};
    return <Bar data={chartData} options={options} />;
}

// Response Times Chart Logic
const ResponseTimesChartContent = ({ data }: { data: AnalyticsData | null }): React.ReactNode => {
    const times = data?.conversations?.response_times;
     if (!times || times.length === 0) return <ChartPlaceholder message="No response time data available." />; // Specific message
    const labels = ["<1s", "1-3s", "3-5s", "5-10s", ">10s"];
    const counts = [0, 0, 0, 0, 0];
    times.forEach(t => {
        if (t < 1) counts[0]++;
        else if (t <= 3) counts[1]++;
        else if (t <= 5) counts[2]++;
        else if (t <= 10) counts[3]++;
        else counts[4]++;
    });
    const chartData = { labels, datasets: [{ label: 'Count', data: counts, backgroundColor: 'rgba(255, 159, 64, 0.7)', borderColor: 'rgb(255, 159, 64)' }] };
    const options: any = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }}, plugins: { legend: { display: false } }};
    return <Bar data={chartData} options={options} />;
}
// --- End Specific Chart Logic ---


// --- Main AdminAnalytics Component ---
export default function AdminAnalytics() {
  const { user } = useAuth(); // Use auth hook
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for year selection
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const currentGlobalYear = new Date().getFullYear();
  // Generate year options (e.g., current year and previous 4)
  const availableYears = Array.from({ length: 5 }, (_, i) => currentGlobalYear - i);

  // State for counts independent of the year filter
  const [feedbackCount, setFeedbackCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0); // Renamed for clarity

  // Fetch main analytics data based on selected year
  const fetchAnalyticsData = useCallback(async () => {
    setError(null); // Clear error before fetch
    // setLoading(true); // Set loading in refreshData or initial useEffect
    try {
      console.log(`Fetching analytics data for year: ${selectedYear}...`);
      const params = new URLSearchParams({ year: selectedYear.toString() });
      const apiUrl = `${API_URL}/admin/analytics?${params.toString()}`;
      const response = await fetch(apiUrl, { cache: 'no-store' });

      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      const result = await response.json();
      if (!result || typeof result !== 'object') throw new Error("Invalid API response format");

      // Basic validation of nested structures before setting state
      const normalizedData: AnalyticsData = {
        conversations: typeof result.conversations === 'object' ? result.conversations : {},
        users: typeof result.users === 'object' ? result.users : {},
        feedback: typeof result.feedback === 'object' ? result.feedback : {}
      };
      setData(normalizedData);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      // Optionally clear data on error: setData(null);
    } finally {
        // setLoading(false); // Handled by calling function (refreshData or useEffect)
    }
  }, [selectedYear]);

  // Fetch total feedback count (independent of year)
  const fetchFeedbackCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/admin/feedback-count`);
      if (!response.ok) throw new Error('Failed to fetch feedback count');
      const data = await response.json();
      setFeedbackCount(data.count ?? 0); // Use nullish coalescing
    } catch (error) {
      console.error('Error fetching feedback count:', error);
      setFeedbackCount(0); // Reset or set error state
    }
  }, []);

  // Fetch total user count (independent of year)
  const fetchTotalUsersCount = useCallback(async () => {
    // If using Firebase client-side (adjust if backend provides this)
    try {
      const usersQuery = collection(db, 'users'); // Ensure 'db' is imported and configured
      const snapshot = await getDocs(usersQuery);
      setTotalUsersCount(snapshot.size);
    } catch (error) {
      console.error('Error fetching total users count:', error);
      setTotalUsersCount(0); // Reset or set error state
    }
  }, []); // Add dependencies if db changes

  // Refresh function combines all fetches
  const refreshData = useCallback(async () => {
    console.log("Refreshing data...");
    setLoading(true); // Indicate loading for the whole refresh operation
    setError(null);
    try {
      // Fetch all data concurrently
      await Promise.all([
        fetchAnalyticsData(),
        fetchFeedbackCount(),
        fetchTotalUsersCount()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false); // Set loading false after all fetches settle
    }
  }, [fetchAnalyticsData, fetchFeedbackCount, fetchTotalUsersCount]); // Correct dependencies

  // Initial data load effect
  useEffect(() => {
    refreshData(); // Call refreshData on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]); // Re-run fetches only when selectedYear changes

  // --- Accuracy Calculation Logic ---
  const calculateAccuracy = () => {
      const totalResponses = data?.conversations?.total_conversations ?? 0;
      const inaccurateCount = feedbackCount;
      const safeAccurateCount = Math.max(0, totalResponses - inaccurateCount);
      const totalRated = safeAccurateCount + inaccurateCount;

      const accuracyRate = totalRated > 0
          ? ((safeAccurateCount / totalRated) * 100).toFixed(1) + '%'
          : 'N/A';

      if (totalResponses === 0) {
          return { chart: <ChartPlaceholder message="No responses data available." />, description: "Accuracy Rate: N/A" };
      }
       if (totalRated === 0 && totalResponses > 0) {
          return { chart: <ChartPlaceholder message="No accuracy feedback received." />, description: `Est. based on ${totalResponses} responses • Accuracy Rate: N/A` };
      }

      const chartData = {
          labels: ['Accurate (Est.)', 'Inaccurate (Feedback)'],
          datasets: [{
              data: [safeAccurateCount, inaccurateCount],
              backgroundColor: ['rgba(52, 211, 153, 0.7)', 'rgba(239, 68, 68, 0.7)'],
              borderColor: ['rgb(16, 185, 129)', 'rgb(220, 38, 38)'], borderWidth: 1,
          }],
      };
      const options: any = {
          responsive: true, maintainAspectRatio: false, cutout: '70%',
          plugins: {
              legend: { position: 'right' as const, labels: { boxWidth: 12 }},
              tooltip: {
                  callbacks: {
                      label: (context: any) => {
                          const value = context.raw || 0;
                          const percentage = totalRated > 0 ? ((value / totalRated) * 100).toFixed(1) : '0';
                          return `${context.label}: ${value} (${percentage}%)`;
                      }
                  }
              }
          },
      };

      return {
          chart: <Doughnut data={chartData} options={options} />,
          description: `Est. based on ${totalResponses} responses & ${feedbackCount} feedback reports • Accuracy: ${accuracyRate}`
      };
  };

  const accuracyInfo = calculateAccuracy();
  // --- End Accuracy Calculation ---

  // Initial loading state display (only show full screen loader before any data is available)
  if (loading && !data) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      {/* <AdminLayout title="ASHA Analytics" user={user}> */}
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Nav */}
              <div className="flex items-center">
                 <h1 className="text-xl font-bold text-indigo-600 mr-6 shrink-0">Analytics</h1>
                  <div className="hidden sm:flex sm:space-x-4">
                     {[
                         { href: "/admin-dashboard", label: "Dashboard" },
                         { href: "/admin-analytics", label: "Analytics", active: true },
                         { href: "/admin-users", label: "Users" }
                     ].map(link => (
                         <a key={link.href} href={link.href} className={`${link.active ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap`}>
                            {link.label}
                         </a>
                     ))}
                  </div>
              </div>
              {/* Right Nav Controls */}
              <div className="flex items-center space-x-3">
                {/* Year Selector */}
                <Select
                   value={selectedYear.toString()}
                   onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
                >
                  <SelectTrigger className="w-[120px] text-sm h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Refresh Button */}
                <Button onClick={refreshData} variant="outline" size="sm" className="h-9" disabled={loading}>
                  {/* Show spinner only when loading is true *after* initial load */}
                  {loading && data ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                   Refresh
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
               <strong className="font-bold">Error: </strong>
               <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">System Analytics ({selectedYear})</h1>
            <p className="text-gray-500">
              Overview of system performance and user engagement metrics for the selected year.
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
             {/* Pass loading state (true only during initial full page load) */}
            <MetricCard title="Total Conversations" value={data?.conversations?.total_conversations?.toString() ?? '0'} icon={<MessageSquare className="h-5 w-5"/>} isLoading={loading && !data} />
            <MetricCard title="Total Users (All Time)" value={totalUsersCount.toString()} icon={<Users className="h-5 w-5"/>} isLoading={loading && totalUsersCount === 0}/>
            <MetricCard title="Feedback Count (All Time)" value={feedbackCount.toString()} icon={<Flag className="h-5 w-5"/>} isLoading={loading && feedbackCount === 0} />
          </div>

          {/* Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pass main loading state to charts */}
            <AnalyticsChartCard title="Daily Engagement" description={`Conversations per day in ${selectedYear}`} isLoading={loading}>
                <DailyEngagementChartContent data={data} />
            </AnalyticsChartCard>
            <AnalyticsChartCard title="Accuracy Breakdown" description={accuracyInfo.description} isLoading={loading}>
                {accuracyInfo.chart}
            </AnalyticsChartCard>
             <AnalyticsChartCard title="Topic Distribution" description={`Distribution of topics in ${selectedYear}`} isLoading={loading}>
                 <TopicsChartContent data={data} />
             </AnalyticsChartCard>
             <AnalyticsChartCard title="Language Distribution" description={`Distribution of languages in ${selectedYear}`} isLoading={loading}>
                 <LanguagesChartContent data={data} />
             </AnalyticsChartCard>
             <AnalyticsChartCard title="Bias Types Detected" description={`Types of bias detected in ${selectedYear}`} isLoading={loading}>
                 <BiasTypesChartContent data={data} />
             </AnalyticsChartCard>
             <AnalyticsChartCard title="Response Time Distribution" description={`Response time breakdown in ${selectedYear}`} isLoading={loading}>
                 <ResponseTimesChartContent data={data} />
             </AnalyticsChartCard>
          </div>

        </main>
      </div>
      {/* </AdminLayout> */}
    </ProtectedRoute>
  );
}