'use client';

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in older versions)
    },
  },
});

function PrefetchWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  usePrefetchRoutes();
  return <>{children}</>;
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <AppLayout>
            <TooltipProvider>
              <PrefetchWrapper>
                {children}
                <Toaster />
              </PrefetchWrapper>
            </TooltipProvider>
          </AppLayout>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
