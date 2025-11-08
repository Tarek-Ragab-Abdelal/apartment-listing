import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;
const DESKTOP_BREAKPOINT = 1280;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(globalThis.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(globalThis.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = globalThis.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);
    const onChange = () => {
      const width = globalThis.innerWidth;
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    
    // Initial check
    const width = globalThis.innerWidth;
    setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = globalThis.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = () => {
      setIsDesktop(globalThis.innerWidth >= DESKTOP_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsDesktop(globalThis.innerWidth >= DESKTOP_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isDesktop;
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');

  React.useEffect(() => {
    const updateDeviceType = () => {
      const width = globalThis.innerWidth;
      if (width < MOBILE_BREAKPOINT) {
        setDeviceType('mobile');
      } else if (width < TABLET_BREAKPOINT) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Initial check
    updateDeviceType();

    // Listen for resize events
    globalThis.addEventListener('resize', updateDeviceType);
    return () => globalThis.removeEventListener('resize', updateDeviceType);
  }, []);

  return deviceType;
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState({
    width: globalThis.window ? globalThis.innerWidth : 0,
    height: globalThis.window ? globalThis.innerHeight : 0,
  });

  React.useEffect(() => {
    const updateSize = () => {
      setScreenSize({
        width: globalThis.innerWidth,
        height: globalThis.innerHeight,
      });
    };

    globalThis.addEventListener('resize', updateSize);
    updateSize(); // Set initial size

    return () => globalThis.removeEventListener('resize', updateSize);
  }, []);

  return screenSize;
}

/**
 * Get responsive values based on current device type
 */
export function useResponsiveBreakpoint<T>(
  mobileValue: T,
  tabletValue: T,
  desktopValue: T
): T {
  const deviceType = useDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return mobileValue;
    case 'tablet':
      return tabletValue;
    case 'desktop':
      return desktopValue;
    default:
      return desktopValue;
  }
}

/**
 * Check if device supports touch
 */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    setIsTouch(
      'ontouchstart' in globalThis ||
      globalThis.navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      globalThis.navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * Get orientation of the device
 */
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');

  React.useEffect(() => {
    const updateOrientation = () => {
      setOrientation(globalThis.innerHeight > globalThis.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    globalThis.addEventListener('resize', updateOrientation);
    globalThis.addEventListener('orientationchange', updateOrientation);

    return () => {
      globalThis.removeEventListener('resize', updateOrientation);
      globalThis.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}
