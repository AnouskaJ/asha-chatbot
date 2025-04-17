'use client';

import { useState, useEffect } from 'react';
import { auth, onAuthStateChange, isAdmin } from '@/lib/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const adminStatus = await isAdmin(user.uid);
          setIsAdminUser(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdminUser(false);
        }
      } else {
        setIsAdminUser(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isAdminUser, loading };
}; 