'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const { user, isAdminUser, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireAdmin && !isAdminUser) {
        router.push('/unauthorized');
      } else if (allowedRoles.length > 0) {
        const needsAdmin = allowedRoles.includes('admin');
        if (needsAdmin && !isAdminUser) {
          router.push('/unauthorized');
        } else {
          setAuthorized(true);
        }
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading, isAdminUser, requireAdmin, allowedRoles, router]);

  if (loading || !authorized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <>{children}</>;
} 