'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * App layout wrapper that handles global authentication loading state
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isLoading } = useAuth();

  // Show global loading screen during initial auth check
  if (isLoading) {
    return <LoadingScreen message="Initializing application..." />;
  }

  return <>{children}</>;
};