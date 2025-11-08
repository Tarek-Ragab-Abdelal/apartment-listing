import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Hook to prefetch important routes after idle time
 * Helps improve perceived performance by warming up routes
 * that users are likely to visit next
 */
export function usePrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Use requestIdleCallback for better performance
    // Falls back to setTimeout for browsers that don't support it
    const prefetchAfterIdle = () => {
      // Prefetch commonly visited routes
      const routes = [
        '/apartment',
        '/messages', 
        '/watchlist',
        '/sell/new',
        '/login'
      ];

      for (const route of routes) {
        try {
          router.prefetch(route);
        } catch (error) {
          console.warn(`Failed to prefetch route ${route}:`, error);
        }
      }
    };

    // Use requestIdleCallback if available, otherwise fallback to setTimeout
    if (globalThis.window !== undefined) {
      if ('requestIdleCallback' in globalThis.window) {
        globalThis.window.requestIdleCallback(prefetchAfterIdle);
      } else {
        setTimeout(prefetchAfterIdle, 2000); // 2 second delay
      }
    }
  }, [router]);
}

/**
 * Hook to prefetch specific apartment routes
 * Use this when you have apartment IDs that users might visit
 */
export function usePrefetchApartments(apartmentIds: string[] = []) {
  const router = useRouter();

  useEffect(() => {
    if (apartmentIds.length === 0) return;

    const prefetchApartments = () => {
      for (const id of apartmentIds.slice(0, 5)) {
        try {
          router.prefetch(`/apartment/${id}`);
        } catch (error) {
          console.warn(`Failed to prefetch apartment ${id}:`, error);
        }
      }
    };

    if (globalThis.window !== undefined) {
      if ('requestIdleCallback' in globalThis.window) {
        globalThis.window.requestIdleCallback(prefetchApartments);
      } else {
        setTimeout(prefetchApartments, 3000);
      }
    }
  }, [router, apartmentIds]);
}