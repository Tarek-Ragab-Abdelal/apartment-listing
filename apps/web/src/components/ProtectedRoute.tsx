'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setIsRedirecting(true);
        router.push('/login');
      } else if (adminOnly && !isAdmin) {
        setIsRedirecting(true);
        router.push('/');
      }
    }
  }, [isAuthenticated, isAdmin, adminOnly, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (isRedirecting) {
    return <LoadingScreen message="Redirecting..." />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  if (adminOnly && !isAdmin) {
    return <LoadingScreen message="Access denied. Redirecting..." />;
  }

  return <>{children}</>;
};
