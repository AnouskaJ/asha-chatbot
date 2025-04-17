// User-related types for the application

// Base User interface that represents the Firebase User object plus custom fields
export interface User {
  uid: string;
  email: string | null;
  emailVerified?: boolean;
  displayName?: string | null;
  photoURL?: string | null;
  lastActive?: number;
  createdAt?: number;
  updatedAt?: number;
  sessionCount?: number;
  isAdmin?: boolean;
}

// User Profile interface for extended profile information
export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  // Personal fields
  age?: number;
  gender?: string;
  university?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  // Professional fields
  jobTitle?: string;
  // --- ADDED FIELD ---
  company?: string; // Represents the user's current or primary company
  // -------------------
  industry?: string;
  yearsOfExperience?: string; // Consider number or specific range type?
  skills?: string[];
  domainsOfInterest?: string[];
  careerGoals?: string;
  education?: Education[]; // Array of education history
  workExperience?: WorkExperience[]; // Array of work history
  profileImage?: string;
  // Preferences
  preferences?: UserPreferences;
  createdAt?: number;
  updatedAt?: number;
}

// Education entry for a user's profile
export interface Education {
  id?: string; // Optional ID for specific entries
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string; // Consider using Date or ISO string format?
  endDate?: string; // Consider using Date or ISO string format?
  isOngoing?: boolean;
  description?: string;
}

// Work experience entry for a user's profile
export interface WorkExperience {
  id?: string; // Optional ID for specific entries
  company: string; // Company for *this specific* experience
  position: string; // Job title for *this specific* experience
  startDate: string; // Consider using Date or ISO string format?
  endDate?: string; // Consider using Date or ISO string format?
  isCurrentPosition?: boolean;
  description?: string;
  location?: string;
}

// User preferences for notifications and settings
export interface UserPreferences {
  emailNotifications: boolean;
  jobAlerts: boolean;
  eventNotifications: boolean;
  mentorshipUpdates: boolean;
  newsletterSubscription: boolean;
  profileVisibility: 'public' | 'private' | 'connections';
  language: string; // Consider specific language codes (e.g., 'en-US', 'hi-IN')?
  theme: 'light' | 'dark' | 'system';
}