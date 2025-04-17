// frontend/app/discover/page.tsx

"use client"

import { useState, useEffect, useCallback } from "react" // Import useCallback
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase, Calendar, Users, BookOpen, MapPin, Clock, Search, Filter, Building, GraduationCap, Loader2, AlertTriangle // Import Loader2 and AlertTriangle
} from "lucide-react"
import { API_URL } from "../../lib/constants" // Import your API_URL constant

// --- TYPE DEFINITIONS ---
interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  type: string;
  deadline: string;
  description?: string;
  applyUrl?: string;
  verified?: boolean;
  category?: string;
  source?: string;
  diversity_focus?: string;
}

interface SessionEvent {
  id: string | number;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  organizer?: string;
  registerUrl?: string;
  verified?: boolean;
  category?: string;
  tags?: string[];
  source?: string;
}

interface Mentor {
  id: number;
  name: string;
  role: string;
  expertise: string[];
  experience: string;
  availability: string;
  image: string;
}

interface Course {
  id: number;
  title: string;
  provider: string;
  duration: string;
  level: string;
  rating: number;
  students: number;
  tags: string[];
}
// --- END TYPE DEFINITIONS ---


// --- MOCK DATA (Keep for Mentors/Courses until backend is ready) ---
const mentors: Mentor[] = [
  { id: 1, name: "Priya Sharma", role: "CTO at TechInnovate", expertise: ["Leadership", "Technology", "Career Transitions"], experience: "15+ years", availability: "2 slots/week", image: "/placeholder.svg?height=100&width=100", },
  { id: 2, name: "Ananya Patel", role: "Senior Product Manager at GlobalTech", expertise: ["Product Management", "UX", "Agile"], experience: "8+ years", availability: "1 slot/week", image: "/placeholder.svg?height=100&width=100", },
  { id: 3, name: "Lakshmi Reddy", role: "Founder & CEO at StartupGrowth", expertise: ["Entrepreneurship", "Fundraising", "Business Strategy"], experience: "12+ years", availability: "3 slots/month", image: "/placeholder.svg?height=100&width=100", },
]
const courses: Course[] = [
  { id: 1, title: "Advanced Digital Marketing", provider: "SkillUp Academy", duration: "8 weeks", level: "Intermediate", rating: 4.8, students: 1250, tags: ["Marketing", "Digital", "SEO"], },
  { id: 2, title: "Full Stack Web Development", provider: "TechLearn", duration: "12 weeks", level: "Beginner to Advanced", rating: 4.9, students: 3200, tags: ["Coding", "Web Development", "JavaScript"], },
  { id: 3, title: "Leadership for Women in Tech", provider: "WomenLead Institute", duration: "6 weeks", level: "Intermediate", rating: 4.7, students: 950, tags: ["Leadership", "Career Growth", "Soft Skills"], },
]
// --- END MOCK DATA ---


export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("jobs")
  const [selectedLocation, setSelectedLocation] = useState("all") // State for location filter

  // State for fetched data
  const [jobListings, setJobListings] = useState<Job[]>([])
  const [eventListings, setEventListings] = useState<SessionEvent[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // --- Data Fetching ---
  const fetchJobs = useCallback(async () => {
    setIsLoadingJobs(true)
    setFetchError(null)
    try {
      const response = await fetch(`${API_URL}/admin/jobs`)
      if (!response.ok) throw new Error(`Failed to fetch jobs: ${response.statusText}`)
      const data = await response.json()
      setJobListings(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Error fetching jobs:", error)
      setFetchError("Could not load job opportunities.")
      setJobListings([])
    } finally {
      setIsLoadingJobs(false)
    }
  }, []); // No dependencies needed if only fetched once

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true)
    setFetchError(null)
    try {
      const response = await fetch(`${API_URL}/admin/sessions`)
      if (!response.ok) throw new Error(`Failed to fetch events: ${response.statusText}`)
      const data = await response.json()
      setEventListings(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Error fetching events:", error)
      setFetchError("Could not load events.")
      setEventListings([])
    } finally {
      setIsLoadingEvents(false)
    }
  }, []); // No dependencies needed if only fetched once

  // Fetch data on component mount
  useEffect(() => {
    fetchJobs();
    fetchEvents();
    // Add fetch calls for mentors and courses here when ready
  }, [fetchJobs, fetchEvents]); // Include fetch functions in dependency array

  // --- Helper Functions ---
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return "Invalid Date";
    }
  };

  // --- Filtering Logic ---
  const filteredJobs = jobListings.filter(job => {
    const matchesQuery = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation = selectedLocation === 'all' ||
                            (job.location && job.location.toLowerCase().includes(selectedLocation.toLowerCase())) ||
                            (selectedLocation === 'remote' && job.location?.toLowerCase().includes('remote'));
    return matchesQuery && matchesLocation;
  });

  const filteredEvents = eventListings.filter(event => {
     const matchesQuery = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (event.organizer && event.organizer.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
     const matchesLocation = selectedLocation === 'all' ||
                             (event.location && event.location.toLowerCase().includes(selectedLocation.toLowerCase())) ||
                             (selectedLocation === 'virtual' && event.location?.toLowerCase().includes('virtual')); // Assume 'virtual' maps to remote
     return matchesQuery && matchesLocation;
  });

  // Add filtering for mentors and courses when data is available
  const filteredMentors = mentors.filter(mentor =>
     mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     mentor.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
     mentor.expertise.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
     // Add location filter if mentors have location data
  );

  const filteredCourses = courses.filter(course =>
     course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     course.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
     course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
     // Add level or other filters if needed
  );
  // --- End Filtering Logic ---

  // --- Render Loading/Error States ---
  const renderLoading = () => (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-3 text-muted-foreground">Loading...</span>
    </div>
  );

  const renderError = () => (
     <div className="flex justify-center items-center py-20 text-center text-red-600 bg-red-50 p-6 rounded-md border border-red-200">
       <AlertTriangle className="h-8 w-8 mr-3 flex-shrink-0"/>
       <div>
         <p className="font-semibold">Oops! Failed to load data.</p>
         <p className="text-sm">{fetchError || "Please check the connection and try again."}</p>
       </div>
     </div>
  );
  // --- End Loading/Error States ---

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 text-center">
         <h1 className="text-3xl font-bold mb-2 tracking-tight">Discover Opportunities</h1>
         <p className="text-muted-foreground max-w-2xl mx-auto">
           Explore job opportunities, events, mentorship programs, and skill development courses tailored for your professional growth.
         </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Search by keyword, title, company..."
               className="pl-10"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2"> {/* Stack filters on small screens */}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="hyderabad">Hyderabad</SelectItem>
                <SelectItem value="pune">Pune</SelectItem>
                <SelectItem value="chennai">Chennai</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
            {/* Add more filter buttons/selects here as needed */}
            {/* <Button variant="outline" className="gap-2 w-full sm:w-auto"> <Filter className="h-4 w-4" /> More Filters </Button> */}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="jobs" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8 bg-muted p-1 rounded-lg">
          <TabsTrigger value="jobs" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"> <Briefcase className="h-4 w-4" /> Jobs </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"> <Calendar className="h-4 w-4" /> Events </TabsTrigger>
          <TabsTrigger value="mentors" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"> <Users className="h-4 w-4" /> Mentors </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"> <BookOpen className="h-4 w-4" /> Courses </TabsTrigger>
        </TabsList>

        {/* --- JOBS TAB --- */}
        <TabsContent value="jobs" className="space-y-6">
          {fetchError && activeTab === 'jobs' && renderError()}
          {isLoadingJobs ? renderLoading() : (
            filteredJobs.length === 0 && !fetchError ? (
              <p className="text-center text-muted-foreground py-10">No matching jobs found for your criteria.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="flex flex-col hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <CardTitle className="text-base font-semibold leading-snug">{job.title}</CardTitle>
                          <CardDescription className="flex items-center text-sm mt-1"> <Building className="h-4 w-4 mr-1.5 flex-shrink-0 text-muted-foreground" /> {job.company} </CardDescription>
                        </div>
                        <Badge variant={job.type?.toLowerCase() === "full-time" ? "default" : "secondary"} className="text-xs whitespace-nowrap flex-shrink-0">{job.type || 'N/A'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 flex-1">
                      <div className="flex flex-col space-y-1.5 text-sm"> {/* Reduced spacing */}
                        <div className="flex items-center text-muted-foreground"> <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" /> {job.location || 'N/A'} </div>
                        <div className="flex items-center text-muted-foreground"> <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" /> Deadline: {formatDate(job.deadline)} </div>
                        {job.description && <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{job.description}</p>}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-3 border-t mt-auto">
                      {job.applyUrl && job.applyUrl !== '#' ? (
                        <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm">
                            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">Apply Now</a>
                        </Button>
                      ) : (
                        <Button disabled variant="secondary" className="w-full h-9 text-sm">Apply Now</Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
             )
          )}
        </TabsContent>

        {/* --- EVENTS TAB --- */}
        <TabsContent value="events" className="space-y-6">
           {fetchError && activeTab === 'events' && renderError()}
           {isLoadingEvents ? renderLoading() : (
             filteredEvents.length === 0 && !fetchError ? (
                <p className="text-center text-muted-foreground py-10">No matching events found for your criteria.</p>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredEvents.map((event) => (
                   <Card key={event.id} className="flex flex-col hover:shadow-md transition-shadow duration-200">
                     <CardHeader className="pb-2">
                       <div className="flex justify-between items-start gap-2">
                         <div>
                           <CardTitle className="text-base font-semibold leading-snug">{event.title}</CardTitle>
                           <CardDescription className="flex items-center text-sm mt-1"> <Users className="h-4 w-4 mr-1.5 flex-shrink-0 text-muted-foreground" /> {event.organizer || 'N/A'} </CardDescription>
                         </div>
                         <Badge variant={event.location?.toLowerCase() === 'virtual' ? "secondary" : "default"} className="text-xs whitespace-nowrap flex-shrink-0">{event.location?.toLowerCase() === 'virtual' ? 'Virtual' : 'In-Person'}</Badge>
                       </div>
                     </CardHeader>
                     <CardContent className="pb-4 flex-1">
                       <div className="flex flex-col space-y-1.5 text-sm">
                         <div className="flex items-center text-muted-foreground"> <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" /> {formatDate(event.date)} </div>
                         <div className="flex items-center text-muted-foreground"> <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" /> {event.time || 'N/A'} </div>
                         <div className="flex items-center text-muted-foreground"> <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" /> {event.location || 'N/A'} </div>
                         {event.description && <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{event.description}</p>}
                         {event.tags && event.tags.length > 0 && (
                           <div className="flex flex-wrap gap-1.5 pt-1">
                             {event.tags.map((tag) => ( <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge> ))}
                           </div>
                         )}
                       </div>
                     </CardContent>
                     <CardFooter className="pt-3 border-t mt-auto">
                       {event.registerUrl && event.registerUrl !== '#' ? (
                            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm">
                                <a href={event.registerUrl} target="_blank" rel="noopener noreferrer">Register</a>
                            </Button>
                       ) : (
                            <Button disabled variant="secondary" className="w-full h-9 text-sm">Register</Button>
                       )}
                     </CardFooter>
                   </Card>
                 ))}
               </div>
             )
           )}
        </TabsContent>

        {/* --- MENTORS TAB --- */}
        <TabsContent value="mentors" className="space-y-6">
          {/* Placeholder - Add Loading/Error states and map over filteredMentors when data is fetched */}
           {filteredMentors.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No matching mentors found.</p>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredMentors.map((mentor) => (
                 <Card key={mentor.id} className="hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-muted border">
                          <img src={mentor.image || "/placeholder.svg"} alt={mentor.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}/>
                        </div>
                        <CardTitle className="text-base font-semibold">{mentor.name}</CardTitle>
                        <CardDescription className="mt-1 text-sm">{mentor.role}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex flex-col space-y-1.5 text-sm">
                        <div className="flex items-center text-muted-foreground"> <GraduationCap className="h-4 w-4 mr-1.5 flex-shrink-0" /> Exp: {mentor.experience} </div>
                        <div className="flex items-center text-muted-foreground"> <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" /> Avail: {mentor.availability} </div>
                        <div className="pt-1">
                          <p className="text-xs font-medium mb-1 text-muted-foreground">Expertise:</p>
                          <div className="flex flex-wrap gap-1.5"> {mentor.expertise.map((skill) => ( <Badge key={skill} variant="secondary" className="text-xs font-normal">{skill}</Badge> ))} </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-3 border-t">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm">Request Mentorship</Button>
                    </CardFooter>
                 </Card>
               ))}
             </div>
           )}
        </TabsContent>

        {/* --- COURSES TAB --- */}
        <TabsContent value="courses" className="space-y-6">
           {/* Placeholder - Add Loading/Error states and map over filteredCourses when data is fetched */}
           {filteredCourses.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No matching courses found.</p>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredCourses.map((course) => (
                 <Card key={course.id} className="flex flex-col hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2">
                      <div>
                        <CardTitle className="text-base font-semibold leading-snug">{course.title}</CardTitle>
                        <CardDescription className="mt-1 text-sm">{course.provider}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 flex-1">
                      <div className="flex flex-col space-y-1.5 text-sm">
                        <div className="flex items-center text-muted-foreground"> <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" /> Duration: {course.duration} </div>
                        <div className="flex items-center text-muted-foreground"> <GraduationCap className="h-4 w-4 mr-1.5 flex-shrink-0" /> Level: {course.level} </div>
                        <div className="flex items-center text-xs pt-1"> <span className="font-medium mr-1">Rating: {course.rating}/5</span> <span className="text-muted-foreground">({course.students} students)</span> </div>
                        <div className="flex flex-wrap gap-1.5 pt-1"> {course.tags.map((tag) => ( <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge> ))} </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-3 border-t mt-auto">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm">Enroll Now</Button>
                    </CardFooter>
                 </Card>
               ))}
             </div>
           )}
        </TabsContent>
      </Tabs>
    </div>
  )
}