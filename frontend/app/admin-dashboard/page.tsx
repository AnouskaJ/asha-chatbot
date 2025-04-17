"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash, Plus, Save, LogOut, FileText, Briefcase, Globe, Flag, MessageCircle, Calendar, Check, Clock, AlertTriangle, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Doughnut, Line, Bar } from 'react-chartjs-2';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../lib/firebase';
import Link from 'next/link';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// --- TYPE DEFINITIONS (Keep as is) ---
interface Session { id: string | number; title: string; date: string; time: string; location: string; description: string; organizer?: string; registerUrl?: string; verified?: boolean; category?: string; tags?: string[]; source?: string; }
interface Job { id: string | number; title: string; company: string; location: string; type: string; deadline: string; description?: string; applyUrl?: string; verified?: boolean; category?: string; source?: string; diversity_focus?: string; }
interface ChatbotUrl { id: string | number; title: string; url: string; }
interface Feedback { id: string; feedbackType: string; timestamp: string; status: string; preview: string; }
interface FeedbackDetail { id: string; messageId: string; messageContent: string; feedbackType: string; feedbackText: string; timestamp: string; status: string; conversationHistory: { id: string; content: string; sender: string; timestamp: string; }[]; }
interface AnalyticsSummary { user_engagement: { total_queries: number; queries_by_day: { [key: string]: number }; language_distribution: { [key: string]: number }; }; response_accuracy: { feedback_received: number; accuracy_rating: { accurate: number; inaccurate: number; }; topics: { [key: string]: number }; }; bias_metrics: { bias_detected_count: number; bias_prevented_count: number; bias_types: { [key: string]: number }; }; }
interface ChartData { queries_over_time: any; language_distribution: any; feedback_breakdown: any; topics_distribution: any; bias_metrics: any; bias_types: any; }
interface AnalyticsStats { total_queries: number; feedback_received: number; bias_detected: number; bias_prevented: number; accuracy_rate: number; bias_prevention_rate: number; }
interface AnalyticsData { summary: AnalyticsSummary; chart_data: ChartData; stats: AnalyticsStats; }
interface TrustedSource {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  verified: boolean;
  dataType: string;
}
// --- END TYPE DEFINITIONS ---

// Sample data
const sampleChatbotUrls: ChatbotUrl[] = [
  { id: 1, title: "Career Resources", url: "https://example.com/resources" },
  { id: 2, title: "Industry Trends", url: "https://example.com/trends" },
  { id: 3, title: "Skill Development", url: "https://example.com/skills" },
];

// Helper function
const getSafeDate = (timestamp: string | number | Date | undefined | null): Date | null => {
  if (!timestamp) return null;
  try {
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'object' && 'toDate' in timestamp) return (timestamp as any).toDate();
    return new Date(timestamp);
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

// --- Reusable UI Components ---

interface DataTableCardProps<T> {
  title: string;
  description: string;
  data: T[];
  columns: { key: keyof T | 'actions'; header: string; className?: string }[];
  renderCell: (item: T, columnKey: keyof T | 'actions') => React.ReactNode;
  onDelete?: (id: string | number) => void;
  onExport?: () => void;
  exportLabel?: string;
  isLoading?: boolean;
  emptyStateMessage: string;
  scrollAreaHeight?: string;
}

function DataTableCard<T extends { id: string | number }>({
  title, description, data, columns, renderCell, onDelete, onExport, exportLabel, isLoading, emptyStateMessage, scrollAreaHeight = 'h-[450px]'
}: DataTableCardProps<T>) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {onExport && (
          <div className="flex justify-end mb-4">
            <Button variant="outline" className="text-sm" onClick={onExport}>
              <FileText className="h-4 w-4 mr-2" /> {exportLabel || 'Export Data'}
            </Button>
          </div>
        )}
        <ScrollArea className={scrollAreaHeight}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => <TableHead key={String(col.key)} className={col.className}>{col.header}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={columns.length} className="text-center">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={columns.length} className="text-center text-gray-500">{emptyStateMessage}</TableCell></TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((col) => (
                      <TableCell key={String(col.key)} className={col.className}>
                        {col.key === 'actions' && onDelete ? (
                           <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                             <Trash className="h-4 w-4 text-red-500" />
                           </Button>
                        ) : (
                          renderCell(item, col.key)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface FormField {
  id: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'date' | 'time';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface AddFormCardProps<T> {
  title: string;
  description: string;
  fields: FormField[];
  formData: T;
  onFormChange: (field: keyof T, value: any) => void;
  onSubmit: () => void;
  submitButtonText: string;
  isLoading?: boolean;
}

function AddFormCard<T extends Record<string, any>>({
  title, description, fields, formData, onFormChange, onSubmit, submitButtonText, isLoading
}: AddFormCardProps<T>) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}{field.required ? '*' : ''}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.id}
                  placeholder={field.placeholder}
                  value={formData[field.id as keyof T] || ''}
                  onChange={(e) => onFormChange(field.id as keyof T, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={formData[field.id as keyof T] || ''}
                  onValueChange={(value) => onFormChange(field.id as keyof T, value)}
                >
                  <SelectTrigger><SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent>
                    {field.options?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.id}
                  type={field.type} // Handles 'input', 'date', 'time'
                  placeholder={field.placeholder}
                  value={formData[field.id as keyof T] || ''}
                  onChange={(e) => onFormChange(field.id as keyof T, e.target.value)}
                />
              )}
            </div>
          ))}
          <Button onClick={onSubmit} className="w-full" disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Adding...' : submitButtonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Feedback Badges (Keep as is)
const FeedbackTypeBadge = ({ type }: { type: string }) => {
  const baseClass = "px-2 py-1 text-xs rounded-full";
  switch (type) {
    case 'inaccurate': return <span className={`${baseClass} bg-orange-100 text-orange-800`}>Inaccurate</span>;
    case 'biased': return <span className={`${baseClass} bg-red-100 text-red-800`}>Biased</span>;
    case 'irrelevant': return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Irrelevant</span>;
    default: return <span className={`${baseClass} bg-gray-100 text-gray-800`}>Other</span>;
  }
};

const FeedbackStatusBadge = ({ status }: { status: string }) => {
  const baseClass = "px-2 py-1 text-xs rounded-full flex items-center";
  switch (status) {
    case 'new': return <span className={`${baseClass} bg-red-100 text-red-800`}><AlertTriangle className="h-3 w-3 mr-1" />New</span>;
    case 'reviewed': return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}><Clock className="h-3 w-3 mr-1" />Reviewed</span>;
    case 'resolved': return <span className={`${baseClass} bg-green-100 text-green-800`}><Check className="h-3 w-3 mr-1" />Resolved</span>;
    default: return <span className={`${baseClass} bg-gray-100 text-gray-800`}>{status}</span>;
  }
};

// --- Main Component ---
export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // State declarations
  const [sessionData, setSessionData] = useState<Session[]>([]);
  const [jobListings, setJobListings] = useState<Job[]>([]);
  const [chatbotUrls, setChatbotUrls] = useState<TrustedSource[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackDetail | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackDetailLoading, setFeedbackDetailLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("7days");
  
  // Form states
  const initialSessionState: Omit<Session, 'id'> = { title: "", date: "", time: "", location: "", description: "", organizer: "", registerUrl: "", category: "career_development", verified: true };
  const [newSession, setNewSession] = useState(initialSessionState);

  const initialJobState: Omit<Job, 'id'> = { title: "", company: "", location: "", type: "full-time", deadline: "", description: "", applyUrl: "", category: "engineering", verified: true, diversity_focus: "women_in_tech" };
  const [newJob, setNewJob] = useState(initialJobState);

  const initialUrlState: TrustedSource = {
    id: '',
    name: '',
    url: '',
    category: '',
    description: '',
    verified: true,
    dataType: ''
  };

  const [newUrl, setNewUrl] = useState<TrustedSource>(initialUrlState);

  const [isLoadingUrls, setIsLoadingUrls] = useState(false);

  // --- Utility Functions ---
  const showNotification = useCallback((message: string, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
  }, []);

  const safeFetch = useCallback(async (url: string, options?: RequestInit, timeout = 10000) => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
        
        if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`Fetch failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
        throw new Error(`Request failed: ${response.status}`);
      }
      // Handle empty response body for non-GET requests or 204 No Content
      if (response.status === 204 || options?.method !== 'GET' && response.headers.get('content-length') === '0') {
         return null; // Or an appropriate indicator like { success: true }
      }
      return await response.json();
      } catch (error) {
      console.error(`Error during fetch to ${url}:`, error);
       if (error instanceof Error && error.name === 'AbortError') {
         throw new Error('Request timed out');
       }
      throw error; // Re-throw other errors
    }
  }, []);

  // Add fetch function for trusted sources
  const fetchTrustedSources = useCallback(async () => {
    setIsLoadingUrls(true);
    try {
      // Read directly from trusted_sources.json instead of using /fetch-external-content
      const response = await fetch(`${API_URL}/admin/trusted-sources`);
      if (!response.ok) throw new Error('Failed to fetch trusted sources');
      const data = await response.json();
      setChatbotUrls(Array.isArray(data) ? data : []);
      } catch (error) {
      console.error('Error fetching trusted sources:', error);
      setChatbotUrls([]); // Set empty array on error to prevent map error
      } finally {
      setIsLoadingUrls(false);
    }
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    if (!adminLoggedIn) {
      router.push("/admin-login");
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(true); // Set loading true at the beginning of fetch cycle

    const fetchData = async () => {
      if (!API_URL) {
        showNotification("API URL not configured", "error");
        setIsLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        // Sessions
        safeFetch(`${API_URL}/admin/sessions`).then(data => setSessionData(data || [])).catch(err => { console.error("Session fetch error:", err); showNotification("Failed to load sessions", "error"); setSessionData([]); }),
        // Jobs
        safeFetch(`${API_URL}/admin/jobs`).then(data => setJobListings(data || [])).catch(err => { console.error("Jobs fetch error:", err); showNotification("Failed to load jobs", "error"); setJobListings([]); }),
        // Feedback
        safeFetch(`${API_URL}/admin/feedback`).then(data => {
            // Handle potential sample data logic or structure mapping if needed
             const feedbackItems = Array.isArray(data) ? data.map((item: any) => ({
              id: item.id || item.feedback_id || `unknown-${Math.random()}`,
              feedbackType: item.feedbackType || item.feedback_type || 'unknown',
              timestamp: item.timestamp || new Date().toISOString(),
              status: item.status || 'pending',
              preview: item.additionalDetails || item.additional_details || item.preview || 'No preview available'
            })) : []; // Default to empty array if not an array
            setFeedbackList(feedbackItems);
        }).catch(err => {
            console.error("Feedback fetch error:", err);
            showNotification("Failed to load feedback", "error");
            // Optional: Set sample feedback on failure?
             const sampleFeedback = [ /* ... your sample feedback data ... */ ];
             // setFeedbackList(sampleFeedback); // Uncomment if you want fallback sample data
             setFeedbackList([]);
        }).finally(() => setFeedbackLoading(false)),
        // Analytics
        (async () => {
            setAnalyticsLoading(true);
            let startDate = null;
            if (analyticsPeriod === "7days") { const d = new Date(); d.setDate(d.getDate() - 7); startDate = d.toISOString().split('T')[0]; }
            else if (analyticsPeriod === "30days") { const d = new Date(); d.setDate(d.getDate() - 30); startDate = d.toISOString().split('T')[0]; }
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            try {
                const data = await safeFetch(`${API_URL}/admin/analytics?${params.toString()}`);
                setAnalyticsData(data || null); // Ensure it's null if fetch returns empty/null
            } catch (err) {
                console.error("Analytics fetch error:", err);
                showNotification("Failed to load analytics", "error");
                setAnalyticsData(null);
      } finally {
                setAnalyticsLoading(false);
            }
        })(),
        // Trusted Sources
        fetchTrustedSources()
      ]);

      console.log("Data fetch results:", results.map(r => r.status));
      setIsLoading(false); // Set loading false after all fetches settle
    };

    fetchData();
  }, [router, analyticsPeriod, showNotification, safeFetch, fetchTrustedSources]); // Added dependencies

  // --- Event Handlers ---
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      localStorage.removeItem("isAdminLoggedIn"); // Clear flag on logout
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification("Logout failed", "error");
      setIsLoading(false);
    }
    // No finally block needed here if navigation happens
  };

  // Generic POST handler (used by Session/Job Add/Delete)
  const postUpdate = async <T,>(endpoint: string, dataKey: string, data: T[], successMsg: string, errorMsg: string): Promise<T[] | null> => {
    try {
      const response = await safeFetch(`${API_URL}/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [dataKey]: data }),
      });
      // API might return the updated list or just success
      const updatedData = response?.[dataKey] || response || data; // Use original data as fallback if response is minimal
      showNotification(successMsg);
      return Array.isArray(updatedData) ? updatedData : data; // Ensure we return an array
    } catch (error) {
      console.error(`Error updating ${endpoint}:`, error);
      showNotification(error instanceof Error ? `${errorMsg}: ${error.message}` : errorMsg, "error");
      return null;
    }
  };

  // Session Handlers
  const handleAddSession = async () => {
    if (!newSession.title || !newSession.date || !newSession.time) {
      showNotification("Title, Date, and Time are required", "error"); return;
    }
    const updated = await postUpdate('sessions', 'sessions', [...sessionData, { ...newSession, id: Date.now().toString() }], "Session added", "Failed to add session");
    if (updated) {
      setSessionData(updated);
      setNewSession(initialSessionState);
    }
  };
  const handleDeleteSession = async (id: string | number) => {
    const updated = await postUpdate('sessions', 'sessions', sessionData.filter(s => s.id !== id), "Session deleted", "Failed to delete session");
    if (updated) setSessionData(updated);
  };

  // Job Handlers
  const handleAddJob = async () => {
    if (!newJob.title || !newJob.company || !newJob.deadline) {
      showNotification("Title, Company, and Deadline are required", "error"); return;
    }
    const updated = await postUpdate('jobs', 'jobs', [...jobListings, { ...newJob, id: Date.now().toString() }], "Job added", "Failed to add job");
    if (updated) {
      setJobListings(updated);
      setNewJob(initialJobState);
    }
  };
  const handleDeleteJob = async (id: string | number) => {
    const updated = await postUpdate('jobs', 'jobs', jobListings.filter(j => j.id !== id), "Job deleted", "Failed to delete job");
    if (updated) setJobListings(updated);
  };

  // Chatbot URL Handlers (Local State Only for now)
  const handleAddUrl = () => {
    if (!newUrl.name || !newUrl.url) {
      showNotification("Title and URL are required", "error"); return;
    }
    setChatbotUrls([...chatbotUrls, { ...newUrl, id: Date.now().toString() }]);
    setNewUrl(initialUrlState);
    showNotification("URL added (local state)"); // Indicate it's not saved to backend yet
  };
  const handleDeleteUrl = (id: string | number) => {
    setChatbotUrls(chatbotUrls.filter(url => url.id !== id));
    showNotification("URL deleted (local state)");
  };

  // Export Handler
  const handleExportData = (type: 'sessions' | 'jobs') => {
    let dataStr: string;
    let fileName: string;
    let mimeType: string;
    
    if (type === 'sessions') {
      dataStr = JSON.stringify(sessionData, null, 2);
      fileName = 'session_details.json';
      mimeType = 'application/json';
    } else { // jobs
      const headers = ['id', 'title', 'company', 'location', 'type', 'deadline', 'description', 'applyUrl', 'verified', 'category', 'diversity_focus'];
      const csvContent = [
        headers.join(','),
        ...jobListings.map(job => 
          headers.map(header => JSON.stringify(job[header as keyof Job]?.toString() || '')).join(',') // Stringify to handle commas in values
        )
      ].join('\n');
      dataStr = csvContent;
      fileName = 'job_listing_data.csv';
      mimeType = 'text/csv';
    }

    const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(dataStr)}`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
    linkElement.remove();
    showNotification(`Exported ${type} data`);
  };

  // Feedback Handlers
  const fetchFeedbackDetail = async (id: string) => {
    setFeedbackDetailLoading(true);
    setSelectedFeedback(null); // Clear previous selection
    try {
      const data = await safeFetch(`${API_URL}/admin/feedback/${id}`);
      setSelectedFeedback(data); // Assumes API returns FeedbackDetail structure
    } catch (error) {
      showNotification(error instanceof Error ? `Failed to load feedback detail: ${error.message}` : "Failed to load feedback detail", "error");
    } finally {
      setFeedbackDetailLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      await safeFetch(`${API_URL}/admin/feedback/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setFeedbackList(prev => prev.map(item => item.id === id ? { ...item, status } : item));
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(prev => prev ? { ...prev, status } : null);
      }
      showNotification("Feedback status updated");
    } catch (error) {
      showNotification(error instanceof Error ? `Status update failed: ${error.message}` : "Status update failed", "error");
    }
  };

  // Handler for updating trusted sources
  const handleUpdateTrustedSources = async (updatedSources: TrustedSource[]) => {
    try {
      const response = await fetch(`${API_URL}/admin/trusted-sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSources)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update trusted sources');
      }

      const data = await response.json();
      setChatbotUrls(data);
      showNotification("Trusted sources updated successfully");
    } catch (error) {
      console.error('Error updating trusted sources:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to update trusted sources', "error");
    }
  };

  // Handler for adding a new trusted source
  const handleAddTrustedSource = async () => {
    // Validate all required fields
    if (!newUrl.name || !newUrl.url || !newUrl.category || !newUrl.dataType || !newUrl.description) {
      showNotification("All fields are required", "error");
      return;
    }

    try {
      // Create a new trusted source object with all required fields
      const newSource: TrustedSource = {
        id: Date.now().toString(),
        name: newUrl.name,
        url: newUrl.url,
        category: newUrl.category,
        description: newUrl.description,
        verified: true,
        dataType: newUrl.dataType
      };

      // Update the sources
      const updatedSources = [...chatbotUrls, newSource];
      await handleUpdateTrustedSources(updatedSources);
      
      // Reset form
      setNewUrl(initialUrlState);
      showNotification("Trusted source added successfully");
    } catch (error) {
      console.error('Error adding trusted source:', error);
      showNotification("Failed to add trusted source", "error");
    }
  };

  // Handler for deleting a trusted source
  const handleDeleteTrustedSource = (id: string | number): void => {
    // Start the deletion process without awaiting
    void (async () => {
      try {
        const stringId = id.toString();
        const updatedSources = chatbotUrls.filter(source => source.id !== stringId);
        await handleUpdateTrustedSources(updatedSources);
      } catch (error) {
        console.error('Error deleting trusted source:', error);
        showNotification('Failed to delete trusted source', 'error');
      }
    })();
  };

  // --- Form Definitions ---
  const sessionFields: FormField[] = [
    { id: 'title', label: 'Title', type: 'input', placeholder: 'Session title', required: true },
    { id: 'date', label: 'Date', type: 'date', required: true },
    { id: 'time', label: 'Time', type: 'time', required: true },
    { id: 'location', label: 'Location', type: 'input', placeholder: 'Location or URL' },
    { id: 'category', label: 'Category', type: 'select', options: [
      { value: 'career_development', label: 'Career Development' }, { value: 'networking', label: 'Networking' },
      { value: 'education', label: 'Education' }, { value: 'skill_building', label: 'Skill Building' }
    ]},
    { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Event description' },
    { id: 'organizer', label: 'Organizer (Optional)', type: 'input', placeholder: 'Organizer name' },
    { id: 'registerUrl', label: 'Register URL (Optional)', type: 'input', placeholder: 'https://...' },
  ];

  const jobFields: FormField[] = [
    { id: 'title', label: 'Title', type: 'input', placeholder: 'Job title', required: true },
    { id: 'company', label: 'Company', type: 'input', placeholder: 'Company name', required: true },
    { id: 'location', label: 'Location', type: 'input', placeholder: 'Job location' },
    { id: 'type', label: 'Type', type: 'select', options: [
      { value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' },
      { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' }
    ]},
    { id: 'deadline', label: 'Deadline', type: 'date', required: true },
    { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Job description' },
    { id: 'applyUrl', label: 'Apply URL (Optional)', type: 'input', placeholder: 'https://...' },
    { id: 'category', label: 'Category', type: 'select', options: [
        { value: 'engineering', label: 'Engineering' }, { value: 'design', label: 'Design' },
        { value: 'product', label: 'Product' }, { value: 'marketing', label: 'Marketing' }, { value: 'sales', label: 'Sales'}, { value: 'other', label: 'Other'}
    ]},
     { id: 'diversity_focus', label: 'Diversity Focus (Optional)', type: 'select', options: [
        { value: 'none', label: 'None' }, { value: 'women_in_tech', label: 'Women in Tech' }, { value: 'underrepresented_minorities', label: 'Underrepresented Minorities'},
        { value: 'lgbtqia', label: 'LGBTQIA+'}, { value: 'disability', label: 'Disability Inclusion'}, { value: 'veterans', label: 'Veterans'}
     ]},
  ];

  const addUrlFields: FormField[] = [
    {
      id: 'name',
      label: 'Title',
      type: 'input',
      placeholder: 'Enter resource title',
      required: true
    },
    {
      id: 'url',
      label: 'URL',
      type: 'input',
      placeholder: 'https://example.com',
      required: true
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'government', label: 'Government' },
        { value: 'professional_network', label: 'Professional Network' },
        { value: 'job_portal', label: 'Job Portal' },
        { value: 'industry_association', label: 'Industry Association' },
        { value: 'ngo', label: 'NGO' }
      ],
      required: true
    },
    {
      id: 'dataType',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'career_resources', label: 'Career Resources' },
        { value: 'job_listings', label: 'Job Listings' },
        { value: 'tech_careers', label: 'Tech Careers' },
        { value: 'entrepreneurship', label: 'Entrepreneurship' },
        { value: 'skilling_livelihoods', label: 'Skill Development' }
      ],
      required: true
    },
    {
      id: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter resource description',
      required: true
    }
  ] as const;

  // --- Render Logic ---
  if (!isAuthenticated) {
    return <div className="container py-10 text-center">Authenticating...</div>; // Or redirect happens
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-100">
        {/* --- Navigation (Keep as is) --- */}
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold">Admin Dashboard</span>
      </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {/* Simplified Links */}
                    {[
                        { href: "/admin-dashboard", label: "Dashboard", active: true }, // Example: Mark active based on route
                        { href: "/admin-analytics", label: "Analytics" },
                        { href: "/admin-users", label: "Users" }
                    ].map(link => (
                        <Link key={link.href} href={link.href}
                           className={`${link.active ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                           {link.label}
                        </Link>
                    ))}
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700 mr-4 text-sm truncate max-w-[150px]">{user?.email}</span>
                <Button onClick={handleLogout} disabled={isLoading} variant="destructive" size="sm">
                  <LogOut className="h-4 w-4 mr-1" /> {isLoading ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Notification Alert */}
      {notification.show && (
            <Alert className={`mb-4 ${notification.type === "error" ? "bg-red-100 border-red-500 text-red-700" : "bg-green-100 border-green-500 text-green-700"}`}>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

          {/* Main Tabs */}
      <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="w-full bg-white mb-4 p-0 justify-start grid grid-cols-4">
                 {/* Simplified Tab Triggers */}
                 {[
                    { value: "sessions", label: "Sessions", icon: Calendar },
                    { value: "jobs", label: "Jobs", icon: Briefcase },
                    { value: "chatbot", label: "Resources", icon: Globe },
                    { value: "feedback", label: "Feedback", icon: MessageCircle },
                 ].map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-gray-100 data-[state=active]:shadow-sm rounded-none px-4 py-2 flex-1 flex items-center justify-center">
                        <tab.icon className="h-4 w-4 mr-2" /> {tab.label}
          </TabsTrigger>
                 ))}
        </TabsList>

        {/* Sessions Tab */}
            <TabsContent value="sessions" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <DataTableCard
                    title="Sessions & Events"
                    description="View and manage career-focused sessions and events"
                    data={sessionData}
                    columns={[
                      { key: 'title', header: 'Title', className: 'font-medium' },
                      { key: 'date', header: 'Date' },
                      { key: 'time', header: 'Time' },
                      { key: 'location', header: 'Location' },
                      { key: 'actions', header: 'Actions', className: 'text-right' },
                    ]}
                    renderCell={(item, key) => item[key as keyof Session]}
                    onDelete={handleDeleteSession}
                    onExport={() => handleExportData('sessions')}
                    isLoading={isLoading}
                    emptyStateMessage="No sessions found"
                      />
                    </div>
                <div>
                  <AddFormCard
                    title="Add New Session"
                    description="Create new career sessions and events"
                    fields={sessionFields}
                    formData={newSession}
                    onFormChange={(field, value) => setNewSession(prev => ({ ...prev, [field]: value }))}
                    onSubmit={handleAddSession}
                    submitButtonText="Add Session"
                      />
                    </div>
          </div>
        </TabsContent>

        {/* Jobs Tab */}
            <TabsContent value="jobs" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <DataTableCard
                    title="Job Listings"
                    description="View and manage job opportunities"
                    data={jobListings}
                    columns={[
                      { key: 'title', header: 'Title', className: 'font-medium' },
                      { key: 'company', header: 'Company' },
                      { key: 'type', header: 'Type' },
                      { key: 'deadline', header: 'Deadline' },
                      { key: 'actions', header: 'Actions', className: 'text-right' },
                    ]}
                    renderCell={(item, key) => item[key as keyof Job]}
                    onDelete={handleDeleteJob}
                    onExport={() => handleExportData('jobs')}
                    isLoading={isLoading}
                    emptyStateMessage="No job listings found"
                      />
                    </div>
                <div>
                  <AddFormCard
                    title="Add New Job"
                    description="Create new job opportunities"
                    fields={jobFields}
                    formData={newJob}
                    onFormChange={(field, value) => setNewJob(prev => ({ ...prev, [field]: value }))}
                    onSubmit={handleAddJob}
                    submitButtonText="Add Job"
                      />
                    </div>
                    </div>
        </TabsContent>

            {/* Chatbot Resources Tab */}
            <TabsContent value="chatbot" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                   <DataTableCard<TrustedSource>
                    title="Resource URLs"
                    description="Manage URLs that the chatbot can reference"
                    data={chatbotUrls}
                    columns={[
                      { key: 'name', header: 'Title' },
                      { key: 'url', header: 'URL' },
                      { key: 'category', header: 'Category' },
                      { key: 'dataType', header: 'Type' },
                      { key: 'actions', header: 'Actions' }
                    ]}
                    renderCell={(source, columnKey) => {
                      switch (columnKey) {
                        case 'name':
                          return (
                <div>
                              <div className="font-medium">{source.name}</div>
                              <div className="text-xs text-gray-500">{source.description}</div>
                </div>
                          );
                        case 'url':
                          return (
                            <a 
                              href={source.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {source.url}
                            </a>
                          );
                        case 'category':
                          return source.category.replace(/_/g, ' ');
                        case 'dataType':
                          return source.dataType.replace(/_/g, ' ');
                        default:
                          return String(source[columnKey as keyof TrustedSource]);
                      }
                    }}
                    onDelete={handleDeleteTrustedSource}
                    isLoading={isLoadingUrls}
                    emptyStateMessage="No resources found"
                    />
                  </div>
                <div>
                  <AddFormCard<TrustedSource>
                    title="Add New URL"
                    description="Add URLs for the chatbot"
                    fields={addUrlFields}
                    formData={newUrl}
                    onFormChange={(field, value) => {
                        setNewUrl(prev => ({
                            ...prev,
                            [field]: value
                        }));
                    }}
                    onSubmit={handleAddTrustedSource}
                    submitButtonText="Add URL"
                    />
                  </div>
          </div>
        </TabsContent>

        {/* Feedback Tab */}
            <TabsContent value="feedback" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Feedback List */}
                <div>
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Feedback List</CardTitle>
                      <CardDescription>User feedback on AI responses</CardDescription>
              </CardHeader>
              <CardContent>
                      {feedbackLoading ? (
                         <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
                      ) : feedbackList.length === 0 ? (
                        <div className="text-center text-gray-500 py-10"><MessageCircle className="h-10 w-10 mx-auto mb-2 text-gray-400" /><p>No feedback received</p></div>
                      ) : (
                        <ScrollArea className="h-[600px] -mx-4 px-4">
                          <div className="space-y-2">
                          {feedbackList.map((feedback) => (
                              <button
                              key={feedback.id} 
                                className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 ${selectedFeedback?.id === feedback.id ? 'bg-gray-100 ring-1 ring-indigo-200' : ''}`}
                              onClick={() => fetchFeedbackDetail(feedback.id)}
                                disabled={feedbackDetailLoading}
                            >
                                <div className="flex justify-between items-center mb-1">
                                <FeedbackTypeBadge type={feedback.feedbackType} />
                                  <span className="text-xs text-gray-500">{getSafeDate(feedback.timestamp)?.toLocaleDateString()}</span>
                              </div>
                                <p className="text-sm mb-2 line-clamp-2">{feedback.preview}</p>
                                <FeedbackStatusBadge status={feedback.status} />
                              </button>
                          ))}
                        </div>
                    </ScrollArea>
                      )}
              </CardContent>
            </Card>
          </div>

                {/* Feedback Details */}
                <div className="md:col-span-2">
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-4">
                  <div>
                          <CardTitle className="text-lg font-semibold">Feedback Details</CardTitle>
                          <CardDescription>Review and respond to user feedback</CardDescription>
                  </div>
                        {selectedFeedback && (
                          <div className="flex space-x-2 flex-shrink-0">
                             <Button variant="outline" size="sm" disabled={selectedFeedback.status === 'reviewed' || feedbackDetailLoading} onClick={() => updateFeedbackStatus(selectedFeedback.id, 'reviewed')}><Clock className="h-4 w-4 mr-1" /> Review</Button>
                             <Button variant="outline" size="sm" disabled={selectedFeedback.status === 'resolved' || feedbackDetailLoading} onClick={() => updateFeedbackStatus(selectedFeedback.id, 'resolved')}><Check className="h-4 w-4 mr-1" /> Resolve</Button>
                          </div>
                        )}
                </div>
              </CardHeader>
              <CardContent>
                      {feedbackDetailLoading ? (
                         <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
                      ) : !selectedFeedback ? (
                        <div className="text-center text-gray-500 py-20 flex flex-col items-center"><MessageCircle className="h-16 w-16 mb-4 text-gray-300" /><p className="text-lg mb-1">No feedback selected</p><p className="text-sm">Select feedback from the list to view details</p></div>
                      ) : (
                        <div className="space-y-4">
                           <div><h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Type</h3><FeedbackTypeBadge type={selectedFeedback.feedbackType} /></div>
                           <div><h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Status</h3><FeedbackStatusBadge status={selectedFeedback.status} /></div>
                           <div><h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Date</h3><p className="text-sm">{getSafeDate(selectedFeedback.timestamp)?.toLocaleString()}</p></div>
                           <div><h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Message Context</h3><div className="bg-gray-50 p-3 rounded border text-sm">{selectedFeedback.messageContent || 'N/A'}</div></div>
                           {/* Display feedback text if available */}
                           {selectedFeedback.feedbackText && (
                            <div><h3 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">User Comment</h3><div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm text-blue-900">{selectedFeedback.feedbackText}</div></div>
                           )}
                           {/* Simplified view - Removed conversation history display to save space as per original removal */}
                  </div>
                )}
              </CardContent>
            </Card>
                </div>
          </div>
        </TabsContent>
      </Tabs>
        </main>
    </div>
    </ProtectedRoute>
  );
} 