'use client';

import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
}

/**
 * Full-screen loading component with spinner and customizable message
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  className,
  size = 'md',
  fullscreen = true
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const containerClasses = fullscreen 
    ? "flex items-center justify-center min-h-screen bg-background"
    : "flex items-center justify-center p-8";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="text-center">
        <div className={cn(
          "animate-spin rounded-full border-b-2 border-primary mx-auto mb-4",
          sizeClasses[size]
        )} />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

/**
 * Inline loading spinner for buttons and smaller components
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'sm', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn(
      "animate-spin rounded-full border-b-2 border-current",
      sizeClasses[size],
      className
    )} />
  );
};

/**
 * Loading overlay for existing content
 */
export const LoadingOverlay: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  className,
  size = 'md'
}) => {
  return (
    <div className={cn(
      "absolute inset-0 bg-background/80 backdrop-blur-sm z-50",
      "flex items-center justify-center",
      className
    )}>
      <div className="text-center">
        <LoadingSpinner size={size} className="mx-auto mb-2 text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};