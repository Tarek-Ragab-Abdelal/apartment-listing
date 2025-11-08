'use client';

import { ApartmentCard } from '@/components/ApartmentCard';
import { ApartmentGridSkeleton } from '@/components/ui/skeleton-loading';
import { Apartment } from '@/services/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ApartmentsGridProps {
  apartments: Apartment[];
  isLoading: boolean;
  watchlist: string[];
  isAdmin: boolean;
  onToggleWatchlist: (apartmentId: string) => void;
}

export const ApartmentsGrid: React.FC<ApartmentsGridProps> = ({
  apartments,
  isLoading,
  watchlist,
  isAdmin,
  onToggleWatchlist,
}) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return <ApartmentGridSkeleton count={12} />;
  }

  return (
    <div className={cn(
      "grid gap-6",
      // Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop
      isMobile 
        ? "grid-cols-1 gap-4" 
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
    )}>
      {apartments.map((apartment, index) => (
        <ApartmentGridItem
          key={apartment.id}
          apartment={apartment}
          index={index}
          watchlist={watchlist}
          isAdmin={isAdmin}
          onToggleWatchlist={onToggleWatchlist}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
};

interface ApartmentGridItemProps {
  apartment: Apartment;
  index: number;
  watchlist: string[];
  isAdmin: boolean;
  onToggleWatchlist: (apartmentId: string) => void;
  isMobile: boolean;
}

const ApartmentGridItem: React.FC<ApartmentGridItemProps> = ({
  apartment,
  index,
  watchlist,
  isAdmin,
  onToggleWatchlist,
  isMobile,
}) => {
  const isInWatchlist = watchlist.includes(apartment.id);
  const shouldPrioritizeImage = index < 6; // Prioritize loading first 6 images
  const watchlistHandler = isAdmin ? undefined : onToggleWatchlist;

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4",
        // Mobile: Reduce animation delay for faster perceived loading
        isMobile && "duration-300"
      )}
      style={{
        animationDelay: isMobile ? `${index * 25}ms` : `${index * 50}ms`,
        animationFillMode: 'both'
      }}
    >
      <ApartmentCard
        apartment={apartment}
        onToggleWatchlist={watchlistHandler}
        isInWatchlist={isInWatchlist}
        priority={shouldPrioritizeImage}
      />
    </div>
  );
};