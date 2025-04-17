// frontend/app/page.tsx

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Briefcase, Calendar, Users, BookOpen, MessageSquare, ArrowRight, // Globe is removed
  Mic, VolumeIcon as VolumeUp, Heart, GraduationCap, Star, MapPin, Building, Clock, Loader2, AlertTriangle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useCallback } from "react"
import Image from "next/image";
import { API_URL } from "@/lib/constants" // Assuming constants file exists

// --- TYPE DEFINITIONS ---
interface SessionEvent {
  id: string | number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  registerUrl?: string;
  organizer?: string;
  verified?: boolean;
  category?: string;
  tags?: string[];
  source?: string;
}

interface JobListing {
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
// --- END TYPE DEFINITIONS ---


export default function HomePage() {
  const [upcomingEvents, setUpcomingEvents] = useState<SessionEvent[]>([])
  const [jobListings, setJobListings] = useState<JobListing[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // --- Data Fetching Callbacks ---
  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true)
    setFetchError(prev => prev === "Failed to load events" || prev === "Failed to load data" ? null : prev);
    try {
      const response = await fetch(`${API_URL}/admin/sessions`)
      if (!response.ok) throw new Error(`Failed to fetch events: ${response.statusText}`)
      const data = await response.json()
      setUpcomingEvents(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Error fetching events:", err)
      setFetchError("Failed to load events")
      setUpcomingEvents([])
    } finally {
      setIsLoadingEvents(false)
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setIsLoadingJobs(true)
    setFetchError(prev => prev === "Failed to load jobs" || prev === "Failed to load data" ? null : prev);
    try {
      const response = await fetch(`${API_URL}/admin/jobs`)
      if (!response.ok) throw new Error(`Failed to fetch jobs: ${response.statusText}`)
      const data = await response.json()
      setJobListings(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Error fetching jobs:", err)
      setFetchError("Failed to load jobs")
      setJobListings([])
    } finally {
      setIsLoadingJobs(false)
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchEvents()
    fetchJobs()
  }, [fetchEvents, fetchJobs])

  // --- Helper Functions ---
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Invalid Date";
    }
  };

  // --- Render Loading/Error States ---
   const renderLoading = (text = "Loading...") => ( <div className="flex justify-center items-center py-10 col-span-1 md:col-span-3"> <Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2 text-muted-foreground">{text}</span> </div> );
   const renderError = (defaultMessage = "Failed to load data.") => ( <div className="flex justify-center items-center py-10 text-center text-red-600 bg-red-50 p-4 rounded-md border border-red-200 col-span-1 md:col-span-3"> <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0"/> <p className="text-sm">{fetchError || defaultMessage}</p> </div> );
   // --- End Loading/Error States ---

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent/20 to-background" />
         <div className="container relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
           {/* Left Text Content */}
           <div className="flex-1 space-y-6 text-center md:text-left">
             <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"> <span className="block">Empowering Women to</span> <span className="text-primary">Restart Their Careers</span> </h1>
             <p className="text-lg md:text-xl text-muted-foreground max-w-2xl md:mx-0 mx-auto"> JobsForHer Foundation is dedicated to enhancing the status of women in the workplace and beyond. We promote gender equality and empower women through education, skill development, and connecting them with opportunities. </p>
             <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link href="/chat" passHref>
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90"> Start Chatting </Button>
                </Link>
                <Link href="/discover" passHref>
                   <Button size="lg" variant="outline"> Explore Opportunities </Button>
                </Link>
             </div>
           </div>
           {/* Right Mock Chat UI */}
           <div className="flex-1 w-full max-w-md">
             <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl bg-card p-4">
               <div className="absolute inset-0 bg-gradient-to-br from-accent to-primary/20 opacity-50" />
               <div className="relative h-full flex flex-col">
                 <div className="flex items-center justify-between mb-4"> <div className="flex items-center space-x-2"> <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"> <MessageSquare className="h-5 w-5 text-primary-foreground" /> </div> <span className="font-semibold">Asha AI</span> </div> <div className="flex items-center space-x-3"> <Image src="/logo.png" alt="Asha AI Logo" width={20} height={20} className="h-5 w-auto" /> <Button variant="ghost" size="icon" className="h-8 w-8"> <VolumeUp className="h-4 w-4" /> </Button> </div> </div>
                 <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin scrollbar-thumb-muted"> <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]"> <p className="text-sm">Hi there! I'm Asha, your AI career assistant. How can I help you restart your career journey today?</p> </div> <div className="bg-primary/10 p-3 rounded-lg rounded-tr-none max-w-[80%] ml-auto"> <p className="text-sm">I'm looking to restart my career after a break. What options do I have?</p> </div> <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]"> <p className="text-sm"> I can help with that! JobsForHer Foundation offers skill development programs, mentorship opportunities, and job connections specifically for women restarting their careers. Would you like to explore specific industries or roles? </p> </div> </div>
                 <div className="relative mt-auto flex-shrink-0"> <input type="text" placeholder="Type your message..." className="w-full rounded-full border border-input bg-background px-4 py-2 pr-12 text-sm shadow-sm focus:ring-1 focus:ring-primary focus:outline-none" /> <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary hover:bg-primary/90" aria-label="Send message or use mic"> <Mic className="h-4 w-4 text-primary-foreground" /> </Button> </div>
               </div>
             </div>
           </div>
         </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-green-50/60 dark:bg-background">
        <div className="container">
          <div className="text-center mb-12"> <h2 className="text-3xl font-bold mb-4 tracking-tight">Our Initiatives</h2> <p className="text-muted-foreground max-w-2xl mx-auto"> JobsForHer Foundation offers various programs designed to support women in rebuilding their confidence and restarting their careers. </p> </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Card 1 */}
            <Card className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-transparent hover:border-primary/20">
              <CardContent className="pt-6 flex flex-col h-full"> <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 flex-shrink-0"> <Briefcase className="h-6 w-6 text-primary" /> </div> <h3 className="text-lg font-semibold mb-2">Career Opportunities</h3> <p className="text-muted-foreground text-sm mb-4 flex-grow"> Connect with employers who value diversity and are looking to hire women returning to the workforce. </p> <Link href="/discover?tab=jobs" className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center mt-auto self-start"> Find Jobs <ArrowRight className="ml-1 h-4 w-4" /> </Link> </CardContent>
            </Card>
            {/* Feature Card 2 */}
            <Card className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-transparent hover:border-primary/20">
              <CardContent className="pt-6 flex flex-col h-full"> <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 flex-shrink-0"> <GraduationCap className="h-6 w-6 text-primary" /> </div> <h3 className="text-lg font-semibold mb-2">herShakti Program</h3> <p className="text-muted-foreground text-sm mb-4 flex-grow"> Upskill in emerging technologies including AI/ML, Big Data, Blockchain, Cybersecurity and Cloud Computing. </p> <Link href="/discover?tab=courses" className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center mt-auto self-start"> Learn More <ArrowRight className="ml-1 h-4 w-4" /> </Link> </CardContent>
            </Card>
            {/* Feature Card 3 */}
            <Card className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-transparent hover:border-primary/20">
              <CardContent className="pt-6 flex flex-col h-full"> <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 flex-shrink-0"> <Users className="h-6 w-6 text-primary" /> </div> <h3 className="text-lg font-semibold mb-2">Mentorship</h3> <p className="text-muted-foreground text-sm mb-4 flex-grow"> Connect with experienced career coaches who can guide your professional journey and boost your confidence. </p> <Link href="/discover?tab=mentors" className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center mt-auto self-start"> Find Mentors <ArrowRight className="ml-1 h-4 w-4" /> </Link> </CardContent>
            </Card>
            {/* Feature Card 4 */}
            <Card className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-transparent hover:border-primary/20">
               <CardContent className="pt-6 flex flex-col h-full"> <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 flex-shrink-0"> <Heart className="h-6 w-6 text-primary" /> </div> <h3 className="text-lg font-semibold mb-2">DivHERsity Club</h3> <p className="text-muted-foreground text-sm mb-4 flex-grow"> A community for leaders committed to creating diverse and inclusive workplaces for women. </p> <Link href="/discover" className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center mt-auto self-start"> Join Community <ArrowRight className="ml-1 h-4 w-4" /> </Link> </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6"> <h2 className="text-3xl font-bold tracking-tight">Our Vision and Mission</h2> <p className="text-muted-foreground leading-relaxed"> With a keen understanding of the importance of enabling women, JobsForHer Foundation is on a mission to foster women's career advancement. We unlock untapped potential and enhance self-confidence through initiatives in: </p> <ul className="space-y-3"> <li className="flex items-start"> <Star className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" /> <span>Education and continuous learning opportunities</span> </li> <li className="flex items-start"> <Star className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" /> <span>Skill development in emerging technologies</span> </li> <li className="flex items-start"> <Star className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" /> <span>Connecting women with career opportunities</span> </li> <li className="flex items-start"> <Star className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" /> <span>Promoting gender equality in the workplace</span> </li> </ul> </div>
            <div className="grid grid-cols-2 gap-4"> <div className="bg-green-50/70 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800/30"> <h3 className="font-bold text-2xl mb-2 text-primary dark:text-green-300">3.5M+</h3> <p className="text-sm text-muted-foreground">Women helped to join the workforce after career breaks</p> </div> <div className="bg-green-50/70 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800/30"> <h3 className="font-bold text-2xl mb-2 text-primary dark:text-green-300">15K+</h3> <p className="text-sm text-muted-foreground">Partner companies committed to gender diversity</p> </div> <div className="bg-green-50/70 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800/30"> <h3 className="font-bold text-2xl mb-2 text-primary dark:text-green-300">800+</h3> <p className="text-sm text-muted-foreground">Learning partners providing upskilling opportunities</p> </div> <div className="bg-green-50/70 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800/30"> <h3 className="font-bold text-2xl mb-2 text-primary dark:text-green-300">100K+</h3> <p className="text-sm text-muted-foreground">Career experts and mentors in our network</p> </div> </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 bg-secondary/10 dark:bg-card">
        <div className="container">
          <div className="text-center mb-12"> <Badge className="bg-secondary hover:bg-secondary/80 mb-4 text-secondary-foreground">Upcoming</Badge> <h2 className="text-3xl font-bold mb-4 tracking-tight">Events Calendar</h2> <p className="text-muted-foreground max-w-2xl mx-auto"> Join our upcoming events to enhance your career, learn new skills, and connect with professionals. </p> </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {isLoadingEvents && renderLoading("Loading events...")}
             {!isLoadingEvents && fetchError && upcomingEvents.length === 0 && renderError("Failed to load events.")}
             {!isLoadingEvents && !fetchError && upcomingEvents.length === 0 && ( <p className="text-center text-muted-foreground py-10 col-span-1 md:col-span-3">No upcoming events found.</p> )}
              {!isLoadingEvents && !fetchError && upcomingEvents.slice(0, 3).map((event) => (
                <Card key={event.id} className="border-accent hover:border-secondary/30 transition-colors duration-300 flex flex-col bg-card shadow-sm">
                  <CardHeader className="bg-muted/40 rounded-t-lg p-4"> <CardTitle className="text-secondary text-base font-semibold leading-snug">{event.title}</CardTitle> <CardDescription className="text-secondary/80 font-medium pt-1 text-xs"> {formatDate(event.date)} {event.time ? `at ${event.time}` : ''} </CardDescription> </CardHeader>
                  <CardContent className="pt-4 px-4 pb-2 flex-1"> <div className="flex items-start mb-2"> <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" /> <span className="text-sm">{event.location || "Online"}</span> </div> <p className="text-muted-foreground text-sm line-clamp-3">{event.description}</p> </CardContent>
                  <CardFooter className="border-t p-3 mt-auto flex justify-end">
                    {event.registerUrl && event.registerUrl !== '#' ? (
                      <Button asChild size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-9">
                        <a href={event.registerUrl} target="_blank" rel="noopener noreferrer">Register Now</a>
                      </Button>
                    ) : ( <Button size="sm" disabled variant="outline" className="h-9">Register Now</Button> )}
                  </CardFooter>
                </Card>
              ))}
            </div>
            {!isLoadingEvents && !fetchError && upcomingEvents.length > 3 && ( <div className="text-center mt-12"> <Link href="/discover?tab=events"> <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10"> View All Events <ArrowRight className="ml-2 h-4 w-4" /> </Button> </Link> </div> )}
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-16 bg-primary/5 dark:bg-card">
        <div className="container">
          <div className="text-center mb-12"> <Badge className="bg-primary hover:bg-primary/80 mb-4 text-primary-foreground">Opportunities</Badge> <h2 className="text-3xl font-bold mb-4 tracking-tight">Latest Job Openings</h2> <p className="text-muted-foreground max-w-2xl mx-auto"> Explore career opportunities with companies committed to gender diversity and supporting women's professional growth. </p> </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {isLoadingJobs && renderLoading("Loading jobs...")}
             {!isLoadingJobs && fetchError && jobListings.length === 0 && renderError("Failed to load jobs.")}
             {!isLoadingJobs && !fetchError && jobListings.length === 0 && ( <p className="text-center text-muted-foreground py-10 col-span-1 md:col-span-3">No job openings found currently.</p> )}
              {!isLoadingJobs && !fetchError && jobListings.slice(0, 3).map((job) => (
                <Card key={job.id} className="border-accent hover:border-primary/30 transition-colors duration-300 flex flex-col bg-card shadow-sm">
                  <CardHeader className="bg-muted/40 rounded-t-lg p-4"> <CardTitle className="text-primary text-base font-semibold leading-snug">{job.title}</CardTitle> <CardDescription className="text-primary/80 font-medium flex items-center pt-1 text-xs"> <Building className="h-4 w-4 mr-1.5" /> {job.company} </CardDescription> </CardHeader>
                  <CardContent className="pt-4 px-4 pb-2 space-y-2 flex-1"> <div className="flex items-center text-sm text-muted-foreground"> <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" /> <span>{job.location || "N/A"}</span> </div> <div className="flex items-center text-sm text-muted-foreground"> <Briefcase className="h-4 w-4 mr-1.5 flex-shrink-0" /> <span>{job.type || "N/A"}</span> </div> <div className="flex items-center text-sm text-muted-foreground"> <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" /> <span>Deadline: {formatDate(job.deadline)}</span> </div> </CardContent>
                  <CardFooter className="border-t p-3 mt-auto flex justify-end">
                    {job.applyUrl && job.applyUrl !== '#' ? (
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9">
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">Apply Now</a>
                      </Button>
                    ) : ( <Button size="sm" disabled variant="outline" className="h-9">Apply Now</Button> )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          {!isLoadingJobs && !fetchError && jobListings.length > 3 && ( <div className="text-center mt-12"> <Link href="/discover?tab=jobs"> <Button variant="outline" className="border-primary text-primary hover:bg-primary/10"> View All Job Opportunities <ArrowRight className="ml-2 h-4 w-4" /> </Button> </Link> </div> )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
         <div className="container text-center">
           <h2 className="text-3xl font-bold mb-4">Ready to Restart Your Career?</h2>
           <p className="max-w-2xl mx-auto mb-8 text-primary-foreground/90"> Join thousands of women who have successfully returned to the workforce with JobsForHer Foundation's support. </p>
           <div className="flex flex-wrap gap-4 justify-center">
             <Link href="/signup"> <Button size="lg" variant="secondary" className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90"> Sign Up Now </Button> </Link>
             <Link href="/chat"> <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"> Chat with Asha </Button> </Link>
           </div>
         </div>
      </section>
    </div>
  )
}