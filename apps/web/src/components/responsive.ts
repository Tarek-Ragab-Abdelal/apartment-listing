// Export all responsive layout components and utilities
export {
  ResponsiveLayout,
  ResponsiveSection,
  ResponsiveGrid,
  MobileOnly,
  DesktopOnly,
  useResponsiveValue,
} from './layout/ResponsiveLayout';

// Export all mobile detection hooks and utilities
export {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useDeviceType,
  useScreenSize,
  useResponsiveBreakpoint,
  useIsTouch,
  useOrientation,
  type DeviceType,
} from '../hooks/use-mobile';

// Responsive utility classes and helper functions
export const responsiveClasses = {
  // Padding
  padding: {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8',
  },
  // Margins
  margin: {
    mobile: 'm-4',
    tablet: 'm-6',
    desktop: 'm-8',
  },
  // Text sizes
  text: {
    small: {
      mobile: 'text-xs',
      tablet: 'text-sm',
      desktop: 'text-sm',
    },
    medium: {
      mobile: 'text-sm',
      tablet: 'text-base',
      desktop: 'text-base',
    },
    large: {
      mobile: 'text-base',
      tablet: 'text-lg',
      desktop: 'text-xl',
    },
    xlarge: {
      mobile: 'text-lg',
      tablet: 'text-xl',
      desktop: 'text-2xl',
    },
  },
  // Gaps
  gap: {
    small: {
      mobile: 'gap-2',
      tablet: 'gap-3',
      desktop: 'gap-4',
    },
    medium: {
      mobile: 'gap-4',
      tablet: 'gap-6',
      desktop: 'gap-8',
    },
    large: {
      mobile: 'gap-6',
      tablet: 'gap-8',
      desktop: 'gap-12',
    },
  },
  // Button heights
  buttonHeight: {
    mobile: 'h-12',
    desktop: 'h-11',
  },
  // Touch targets (minimum 44px for mobile)
  touchTarget: {
    mobile: 'min-w-[44px] min-h-[44px]',
    desktop: '',
  },
} as const;

// Helper function to get responsive class based on device type
export function getResponsiveClass(
  classes: Record<string, string>,
  deviceType: 'mobile' | 'tablet' | 'desktop'
): string {
  return classes[deviceType] || classes.desktop || '';
}