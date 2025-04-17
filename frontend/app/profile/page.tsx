"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react" // Added useCallback
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, Settings, Shield, History, Briefcase, GraduationCap, Award, X, Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getUserProfile, saveUserProfile } from "@/lib/firebase"
// Make sure this import path points to your actual types file
import { UserProfile, UserPreferences } from "@/types/user"

// Define initial states clearly
const initialFormData: Partial<UserProfile> = {
  firstName: "",
  lastName: "",
  email: "",
  age: undefined,
  gender: "",
  university: "",
  phoneNumber: "",
  location: "",
  bio: "",
  jobTitle: "",
  company: "", // Keep this initialization
  industry: "",
  yearsOfExperience: "",
  skills: [],
  domainsOfInterest: [],
  careerGoals: "",
};

const initialPreferencesData: UserPreferences = {
  emailNotifications: true,
  jobAlerts: true,
  eventNotifications: true,
  mentorshipUpdates: true,
  newsletterSubscription: true,
  profileVisibility: 'public',
  language: 'English',
  theme: 'light'
};


export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null); // Store the full fetched profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state (initialized with defaults)
  const [formData, setFormData] = useState<Partial<UserProfile>>(initialFormData);

  // Preferences state (initialized with defaults)
  const [preferencesData, setPreferencesData] = useState<UserPreferences>(initialPreferencesData);

  // UI/Interaction state
  const [newSkill, setNewSkill] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferencesSaveSuccess, setPreferencesSaveSuccess] = useState(false);


  // Fetch user profile on mount or when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        // Don't necessarily clear profile if user logs out mid-session,
        // let the redirect handle it or decide based on UX.
        // setProfile(null);
        // setFormData(initialFormData);
        // setPreferencesData(initialPreferencesData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null); // Clear previous errors
      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile); // Store the fetched profile

        if (userProfile) {
          // Update form data with fetched profile data, providing defaults
          setFormData({
            firstName: userProfile.firstName || "",
            lastName: userProfile.lastName || "",
            email: userProfile.email || user.email || "", // Use auth email as fallback
            age: userProfile.age, // Keep undefined if not set
            gender: userProfile.gender || "",
            university: userProfile.university || "",
            phoneNumber: userProfile.phoneNumber || "",
            location: userProfile.location || "",
            bio: userProfile.bio || "",
            jobTitle: userProfile.jobTitle || "",
            company: userProfile.company || "", // Now valid because type is updated
            industry: userProfile.industry || "",
            yearsOfExperience: userProfile.yearsOfExperience || "",
            skills: userProfile.skills || [],
            domainsOfInterest: userProfile.domainsOfInterest || [],
            careerGoals: userProfile.careerGoals || "",
          });

          // Update preferences, merging with defaults
          setPreferencesData({
            ...initialPreferencesData, // Start with defaults
            ...(userProfile.preferences || {}), // Override with saved prefs
          });
        } else {
           // Profile doesn't exist, set form email from auth user
           setFormData(prev => ({ ...prev, email: user.email || "" }));
           setPreferencesData(initialPreferencesData); // Reset prefs to default
        }

      } catch (err: unknown) { // Catch unknown for type safety
        console.error('Error fetching profile:', err);
        const message = err instanceof Error ? err.message : 'Failed to load profile data.';
        setError(message);
        // Optionally reset form data on error?
        // setFormData(initialFormData);
        // setPreferencesData(initialPreferencesData);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) { // Fetch only if auth is resolved and user exists
      fetchProfile();
    } else if (!authLoading && !user) {
      // If auth is resolved but no user, stop loading and prepare for redirect
      setLoading(false);
    }
  }, [user, authLoading]); // Dependencies


  // Redirect if not logged in (runs after initial load attempt)
  useEffect(() => {
    if (!authLoading && !user && !loading) { // Ensure loading is false before redirecting
      router.push("/login?redirect=/profile"); // Add redirect query param
    }
  }, [user, authLoading, loading, router]);


  // --- Form Input Handlers using useCallback ---
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleAgeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
    // Optional: Add validation for age range if needed
    setFormData(prev => ({ ...prev, age: value }));
  }, []);

  const handleSelectChange = useCallback((id: keyof UserProfile, value: string) => {
    // Added type safety for id
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSwitchChange = useCallback((id: keyof UserPreferences) => {
    setPreferencesData((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handlePreferenceSelectChange = useCallback((id: keyof UserPreferences, value: string) => {
     // Type assertion might be needed if TS complains about value type mismatch
     setPreferencesData(prev => ({ ...prev, [id]: value as any }));
  }, []);


  // --- List Management Handlers ---
  const addListItem = useCallback((listKey: 'skills' | 'domainsOfInterest', newItem: string, setNewItemState: React.Dispatch<React.SetStateAction<string>>) => {
    const trimmedItem = newItem.trim();
    if (trimmedItem !== "") {
      setFormData((prev) => {
        const currentList = prev[listKey] || [];
        // Prevent duplicates
        if (!currentList.includes(trimmedItem)) {
          return { ...prev, [listKey]: [...currentList, trimmedItem] };
        }
        return prev; // Return previous state if duplicate
      });
      setNewItemState(""); // Clear input field
    }
  }, []);

  const removeListItem = useCallback((listKey: 'skills' | 'domainsOfInterest', itemToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      [listKey]: prev[listKey]?.filter((item: string) => item !== itemToRemove)
    }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) { // Prevent submission on Shift+Enter in textareas
      e.preventDefault(); // Prevent default form submission on Enter
      callback();
    }
  }, []);


  // --- Save Handlers ---
  const handleSaveChanges = useCallback(async () => {
    if (!user) return;

    setIsSavingProfile(true);
    setProfileSaveSuccess(false);
    setError(null); // Clear previous errors

    // Prepare data to save, ensuring uid and timestamp are included
    const profileDataToSave: Partial<UserProfile> = {
      ...formData,
      uid: user.uid, // Ensure UID is set
      updatedAt: Date.now() // Add/update timestamp
    };

    // Remove email from saved data if it's not allowed to be changed
    // delete profileDataToSave.email; // Uncomment if email shouldn't be saved

    try {
      await saveUserProfile(user.uid, profileDataToSave);
      setProfileSaveSuccess(true);
      // Update local profile state optimistically or refetch if needed
      setProfile(prev => ({ ...(prev || {} as UserProfile), ...profileDataToSave }));
      setTimeout(() => setProfileSaveSuccess(false), 3000); // Hide success message
    } catch (err: unknown) {
      console.error("Error saving profile:", err);
      const message = err instanceof Error ? err.message : "Failed to save profile changes.";
      setError(message); // Show error message
    } finally {
      setIsSavingProfile(false);
    }
  }, [user, formData]);


  const handleSavePreferences = useCallback(async () => {
    if (!user) return;

    setIsSavingPreferences(true);
    setPreferencesSaveSuccess(false);
    setError(null);

    // Prepare data: only save preferences and the update timestamp
    const dataToSave: Partial<UserProfile> = {
      preferences: preferencesData,
      updatedAt: Date.now()
    };

    try {
      await saveUserProfile(user.uid, dataToSave);
      setPreferencesSaveSuccess(true);
      // Update local profile state optimistically or refetch if needed
      setProfile(prev => ({
          ...(prev || {} as UserProfile),
          preferences: preferencesData,
          updatedAt: dataToSave.updatedAt
      }));
      setTimeout(() => setPreferencesSaveSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Error saving preferences:", err);
      const message = err instanceof Error ? err.message : "Failed to save preferences.";
      setError(message);
    } finally {
      setIsSavingPreferences(false);
    }
  }, [user, preferencesData]);


  // --- Render Logic ---

  // Loading state for auth or profile fetch
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  // Should be handled by redirect effect, but provides fallback message
  if (!user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Please <a href="/login" className="text-primary underline">log in</a> to view your profile.</p>
        </div>
    );
  }

  // Helper to render list items (Skills, Domains)
  const renderListInput = (
    listKey: 'skills' | 'domainsOfInterest',
    label: string,
    placeholder: string,
    newItem: string,
    setNewItem: React.Dispatch<React.SetStateAction<string>>,
    addItemHandler: () => void,
    removeItemHandler: (item: string) => void
  ) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]"> {/* Ensure minimum height */}
        {formData[listKey]?.map((item) => (
            <Badge key={item} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
                {item}
                <button
                    type="button" // Prevent form submission
                    onClick={() => removeItemHandler(item)}
                    className="ml-1 rounded-full hover:bg-background/60 p-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
                    aria-label={`Remove ${item}`}
                >
                    <X className="h-3 w-3" />
                </button>
            </Badge>
        ))}
        </div>
        <div className="flex gap-2">
        <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, addItemHandler)}
            disabled={isSavingProfile} // Disable while saving
        />
        <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addItemHandler}
            disabled={isSavingProfile || !newItem.trim()} // Also disable if input is empty
            aria-label={`Add ${label.toLowerCase().replace('s', '')}`}
        >
            <Plus className="h-4 w-4" />
        </Button>
        </div>
    </div>
  );


  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar (Simplified - functionality can be added later) */}
        <aside className="w-full md:w-64 space-y-4 md:sticky md:top-8 self-start">
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-muted flex items-center justify-center border">
                {/* Basic placeholder or image */}
                {profile?.profileImage ? (
                     <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                     <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <h2 className="font-semibold text-lg truncate w-full" title={`${formData.firstName} ${formData.lastName}`}>
                  {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : (user.email || 'User')}
              </h2>
              <p className="text-sm text-muted-foreground mb-2 truncate w-full" title={formData.jobTitle || ''}>
                  {formData.jobTitle || 'No title set'}
              </p>

            </CardContent>
          </Card>

          {/* Optional Navigation Card - Can link to sections or future pages */}
          {/* <Card> ... navigation buttons ... </Card> */}
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Global Error/Success Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {/* Display save success messages discretely */}
          {profileSaveSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="status">
              Profile updated successfully!
            </div>
          )}
           {preferencesSaveSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="status">
              Preferences updated successfully!
            </div>
          )}

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6">
              <TabsTrigger value="profile"><User className="h-4 w-4 mr-1" /> Profile</TabsTrigger>
              <TabsTrigger value="preferences"><Settings className="h-4 w-4 mr-1" /> Preferences</TabsTrigger>
              <TabsTrigger value="security" disabled><Shield className="h-4 w-4 mr-1" /> Security</TabsTrigger> {/* Keep disabled for now */}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}> {/* Allow form submission */}
              <div className="space-y-6">
                  {/* Personal Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                        <Label htmlFor="firstName">First name</Label>
                          <Input id="firstName" value={formData.firstName} onChange={handleInputChange} disabled={isSavingProfile} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="lastName">Last name</Label>
                          <Input id="lastName" value={formData.lastName} onChange={handleInputChange} disabled={isSavingProfile}/>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <Label htmlFor="age">Age</Label>
                           <Input id="age" type="number" value={formData.age ?? ""} onChange={handleAgeChange} min="0" disabled={isSavingProfile} />
                         </div>
                         <div className="space-y-1">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)} disabled={isSavingProfile}>
                                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="non-binary">Non-binary</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                      </div>
                       <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={formData.email ?? ""} disabled title="Email cannot be changed" />
                          <p className="text-xs text-muted-foreground pt-1">Email cannot be changed.</p>
                    </div>
                       <div className="space-y-1">
                          <Label htmlFor="phoneNumber">Phone number</Label>
                          <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} disabled={isSavingProfile}/>
                    </div>
                       <div className="space-y-1">
                      <Label htmlFor="location">Location</Label>
                          <Input id="location" value={formData.location} onChange={handleInputChange} placeholder="e.g., City, Country" disabled={isSavingProfile}/>
                       </div>
                       <div className="space-y-1">
                          <Label htmlFor="university">University/Institution</Label>
                          <Input id="university" value={formData.university} onChange={handleInputChange} placeholder="Enter your university" disabled={isSavingProfile}/>
                    </div>
                       <div className="space-y-1">
                      <Label htmlFor="bio">Bio</Label>
                         <Textarea id="bio" rows={4} value={formData.bio} onChange={handleInputChange} placeholder="Tell us a bit about yourself..." disabled={isSavingProfile}/>
                       </div>
                       <div className="space-y-1">
                          <Label htmlFor="careerGoals">Career Goals</Label>
                          <Textarea id="careerGoals" rows={3} value={formData.careerGoals} onChange={handleInputChange} placeholder="Describe your career aspirations..." disabled={isSavingProfile}/>
                    </div>
                        {/* Domains of Interest Input */}
                        {renderListInput(
                            'domainsOfInterest',
                            'Domains of Interest',
                            'Add a domain (e.g., AI, Healthcare)',
                            newDomain,
                            setNewDomain,
                            () => addListItem('domainsOfInterest', newDomain, setNewDomain),
                            (item) => removeListItem('domainsOfInterest', item)
                        )}
                  </CardContent>
                  <CardFooter>
                        <Button type="submit" disabled={isSavingProfile}>
                            {isSavingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Personal Info"}
                        </Button>
                  </CardFooter>
                </Card>

                  {/* Professional Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                      <CardDescription>Detail your work experience and skills.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="jobTitle">Current Job Title</Label>
                        <Input id="jobTitle" value={formData.jobTitle} onChange={handleInputChange} disabled={isSavingProfile}/>
                    </div>
                      <div className="space-y-1">
                        {/* This input relies on the 'company' field being added to UserProfile type */}
                      <Label htmlFor="company">Current Company</Label>
                        <Input id="company" value={formData.company} onChange={handleInputChange} disabled={isSavingProfile}/>
                    </div>
                      <div className="space-y-1">
                      <Label htmlFor="industry">Industry</Label>
                        <Select value={formData.industry} onValueChange={(value) => handleSelectChange('industry', value)} disabled={isSavingProfile}>
                            <SelectTrigger><SelectValue placeholder="Select an industry" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                                {/* Add more relevant industries */}
                                <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                      <div className="space-y-1">
                        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                         <Select value={formData.yearsOfExperience} onValueChange={(value) => handleSelectChange('yearsOfExperience', value)} disabled={isSavingProfile}>
                            <SelectTrigger><SelectValue placeholder="Select experience range" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-2">0-2 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="5-10">5-10 years</SelectItem>
                          <SelectItem value="10+">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                       {/* Skills Input */}
                       {renderListInput(
                            'skills',
                            'Skills',
                            'Add a skill (e.g., Python, Marketing)',
                            newSkill,
                            setNewSkill,
                            () => addListItem('skills', newSkill, setNewSkill),
                            (item) => removeListItem('skills', item)
                        )}
                    </CardContent>
                     <CardFooter>
                        {/* Use type="submit" if this button should also submit the form */}
                        <Button type="button" onClick={handleSaveChanges} disabled={isSavingProfile}>
                            {isSavingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Professional Info"}
                        </Button>
                  </CardFooter>
                </Card>
              </div>
              </form>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <form onSubmit={(e) => { e.preventDefault(); handleSavePreferences(); }}>
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                      <CardDescription>Manage notifications and application settings.</CardDescription>
                </CardHeader>
                    <CardContent className="space-y-6 divide-y divide-border">
                        {/* Notifications Section */}
                        <div className="pt-6 space-y-4">
                            <h3 className="text-lg font-medium">Notifications</h3>
                             {/* Refactored Switch Item */}
                            {[
                                { id: 'emailNotifications' as keyof UserPreferences, label: 'Email Notifications', description: 'Receive emails about activity.' },
                                { id: 'jobAlerts' as keyof UserPreferences, label: 'Job Alerts', description: 'Get notified about new jobs.' },
                                { id: 'eventNotifications' as keyof UserPreferences, label: 'Event Notifications', description: 'Receive updates on events.' },
                                { id: 'mentorshipUpdates' as keyof UserPreferences, label: 'Mentorship Updates', description: 'Get mentorship program updates.' },
                            ].map(item => (
                                <div key={item.id} className="flex items-center justify-between py-2">
                                    <div className="max-w-[80%]">
                                        <Label htmlFor={item.id} className="font-medium cursor-pointer">{item.label}</Label>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                                    <Switch
                                        id={item.id}
                                        checked={!!preferencesData[item.id]} 
                                        onCheckedChange={() => handleSwitchChange(item.id)}
                                        disabled={isSavingPreferences}
                                        aria-labelledby={`${item.id}-label`}
                                    />
                                    {/* Hidden label for aria */}
                                    <span id={`${item.id}-label`} className="sr-only">{item.label}</span>
                      </div>
                            ))}
                  </div>

                        {/* General Settings Section */}
                        <div className="pt-6 space-y-4">
                            <h3 className="text-lg font-medium">General Settings</h3>
                            <div className="space-y-1">
                        <Label htmlFor="language">Language</Label>
                                <Select
                                    value={preferencesData.language}
                                    onValueChange={(value) => handlePreferenceSelectChange('language', value)}
                                    disabled={isSavingPreferences}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                          <SelectContent>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="Hindi">Hindi</SelectItem>
                                        {/* Add more languages */}
                          </SelectContent>
                        </Select>
                      </div>
                            <div className="space-y-1">
                                <Label htmlFor="theme">Theme</Label>
                                <Select
                                    value={preferencesData.theme}
                                    onValueChange={(value) => handlePreferenceSelectChange('theme', value)}
                                    disabled={isSavingPreferences}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select theme" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="system">System</SelectItem>
                                    </SelectContent>
                                </Select>
                        </div>
                            <div className="space-y-1">
                                <Label htmlFor="profileVisibility">Profile Visibility</Label>
                                <Select
                                    value={preferencesData.profileVisibility}
                                    onValueChange={(value) => handlePreferenceSelectChange('profileVisibility', value)}
                                    disabled={isSavingPreferences}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="connections">Connections Only</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground pt-1">Controls who can view your profile.</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                        <Button type="submit" disabled={isSavingPreferences}>
                            {isSavingPreferences ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Preferences"}
                        </Button>
                </CardFooter>
              </Card>
              </form>
            </TabsContent>

            {/* Security Tab (Content Placeholder) */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security (functionality pending).</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Password change and other security features will be available here.</p>
                  {/* Add password change form etc. here later */}
                </CardContent>
                {/* <CardFooter>
                    <Button disabled>Update Security Settings</Button>
                </CardFooter> */}
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}