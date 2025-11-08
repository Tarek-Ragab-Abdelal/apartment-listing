'use client';

import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  /**
   * Custom padding for mobile and desktop
   */
  mobilePadding?: string;
  desktopPadding?: string;
  /**
   * Custom spacing between sections
   */
  mobileSpacing?: string;
  desktopSpacing?: string;
  /**
   * Background variant
   */
  variant?: 'default' | 'gradient' | 'muted';
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  mobilePadding = 'px-4 py-6',
  desktopPadding = 'px-4 py-8',
  mobileSpacing = 'space-y-6',
  desktopSpacing = 'space-y-8',
  variant = 'default',
}) => {
  const isMobile = useIsMobile();

  const getBackgroundStyles = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-br from-background to-muted/20';
      case 'muted':
        return 'bg-muted/5';
      default:
        return 'bg-background';
    }
  };

  return (
    <div className={cn(
      'min-h-screen',
      getBackgroundStyles(),
      className
    )}>
      <main className={cn(
        'container mx-auto',
        isMobile ? mobilePadding : desktopPadding,
        isMobile ? mobileSpacing : desktopSpacing
      )}>
        {children}
      </main>
    </div>
  );
};

interface ResponsiveSectionProps {
  children: ReactNode;
  className?: string;
  /**
   * Whether to apply different padding on mobile vs desktop
   */
  responsive?: boolean;
}

export const ResponsiveSection: React.FC<ResponsiveSectionProps> = ({
  children,
  className,
  responsive = true,
}) => {
  const isMobile = useIsMobile();

  return (
    <section className={cn(
      responsive && isMobile ? 'space-y-4' : 'space-y-6',
      className
    )}>
      {children}
    </section>
  );
};

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  /**
   * Number of columns on different screen sizes
   */
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  /**
   * Gap between grid items
   */
  gap?: {
    mobile?: string;
    desktop?: string;
  };
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 'gap-4', desktop: 'gap-6' },
}) => {
  const isMobile = useIsMobile();

  const getGridCols = () => {
    const { mobile = 1, tablet = 2, desktop = 3 } = cols;
    return `grid-cols-${mobile} sm:grid-cols-${tablet} lg:grid-cols-${desktop}`;
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      isMobile ? gap.mobile : gap.desktop,
      className
    )}>
      {children}
    </div>
  );
};

interface MobileOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const MobileOnly: React.FC<MobileOnlyProps> = ({ children, fallback }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) return <>{children}</>;
  return fallback ? <>{fallback}</> : null;
};

interface DesktopOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const DesktopOnly: React.FC<DesktopOnlyProps> = ({ children, fallback }) => {
  const isMobile = useIsMobile();
  
  if (!isMobile) return <>{children}</>;
  return fallback ? <>{fallback}</> : null;
};

/**
 * Hook for getting responsive values based on screen size
 */
export function useResponsiveValue<T>(mobileValue: T, desktopValue: T): T {
  const isMobile = useIsMobile();
  return isMobile ? mobileValue : desktopValue;
}