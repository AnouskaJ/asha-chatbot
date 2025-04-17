'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserProfile, saveUserProfile } from '@/lib/firebase';
import { UserProfile, UserPreferences } from '@/types/user';

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile when auth state changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  // Function to update user profile
  const updateProfile = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to update your profile');
      return false;
    }

    try {
      setLoading(true);
      
      // Make sure we have the UID
      const updatedProfile = {
        ...profileData,
        uid: user.uid,
      };
      
      await saveUserProfile(user.uid, updatedProfile);
      
      // Update local state with new profile data
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile as UserProfile);
      
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to save user preferences
  const savePreferences = async (preferences: UserPreferences): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to update preferences');
      return false;
    }

    try {
      setLoading(true);
      
      await saveUserProfile(user.uid, { preferences });
      
      // Update local state with new preferences
      setProfile(prev => prev ? { ...prev, preferences } : { uid: user.uid, email: user.email || '', firstName: '', lastName: '', preferences } as UserProfile);
      
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, updateProfile, savePreferences };
}; 