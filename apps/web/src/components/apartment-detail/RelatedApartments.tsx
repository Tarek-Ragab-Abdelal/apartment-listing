'use client';

import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ApartmentCard } from '@/components/ApartmentCard';
import { Apartment } from '@/services/api';

interface RelatedApartmentsProps {
  relatedApartments: Apartment[];
  isLoading: boolean;
  watchlist: string[];
  canToggleWatchlist: boolean;
  onToggleWatchlist?: (apartmentId: string) => void;
  className?: string;
}

export const RelatedApartments: React.FC<RelatedApartmentsProps> = ({
  relatedApartments,
  isLoading,
  watchlist,
  canToggleWatchlist,
  onToggleWatchlist,
  className
}) => {
  if (relatedApartments.length === 0 && !isLoading) return null;

  return (
    <div className={className}>
      <Separator className="mb-8" />
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Related Apartments</h2>
        <p className="text-muted-foreground">
          Similar apartments you might be interested in
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedApartments.map((relatedApartment) => (
            <ApartmentCard
              key={relatedApartment.id}
              apartment={relatedApartment}
              onToggleWatchlist={canToggleWatchlist && onToggleWatchlist ? () => {
                onToggleWatchlist(relatedApartment.id);
              } : undefined}
              isInWatchlist={watchlist.includes(relatedApartment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};