'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ClientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ClientButton({ 
  children, 
  variant = 'default', 
  size = 'default',
  ...props 
}: ClientButtonProps) {
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