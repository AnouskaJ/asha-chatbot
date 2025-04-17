'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ClientOnlyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ClientOnlyButton({ 
  children, 
  variant = 'default', 
  size = 'default',
  ...props 
}: ClientOnlyButtonProps) {
  // Use client-side only rendering to avoid hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return a placeholder during server-side rendering
    return <span className="opacity-0">{typeof children === 'string' ? children : null}</span>;
  }
  
  // Only render the actual button on the client after hydration
  return (
    <Button 
      variant={variant} 
      size={size} 
      {...props} 
    >
      {children}
    </Button>
  );
} 