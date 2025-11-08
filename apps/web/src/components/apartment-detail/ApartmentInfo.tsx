'use client';

import { Home, MapPin, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Apartment } from '@/services/api';
import { PropertyDetails } from './PropertyDetails';
import { formatPrice } from '@/lib/utils';

interface ApartmentInfoProps {
  apartment: Apartment;
  isInWatchlist: boolean;
  canToggleWatchlist: boolean;
  onToggleWatchlist: () => void;
  className?: string;
}

export const ApartmentInfo: React.FC<ApartmentInfoProps> = ({
  apartment,
  isInWatchlist,
  canToggleWatchlist,
  onToggleWatchlist,
  className
}) => {
  return (
    <div className={className}>
      {/* Title and Watchlist */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-3xl font-bold leading-tight pr-4">{apartment.unitName}</h1>
        {canToggleWatchlist && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleWatchlist}
            className="ml-2 flex-shrink-0"
            aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Heart 
              className={`w-4 h-4 ${
                isInWatchlist 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-muted-foreground hover:text-red-500'
              }`} 
            />
          </Button>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {apartment.project && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Home className="w-3 h-3 mr-1" />
            {apartment.project.name}
          </Badge>
        )}
        {apartment.project?.city && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            <MapPin className="w-3 h-3 mr-1" />
            {apartment.project.city.name}
          </Badge>
        )}
        <Badge 
          variant={apartment.status === 'ACTIVE' ? 'default' : 'secondary'} 
          className="text-sm px-3 py-1"
        >
          {apartment.status}
        </Badge>
      </div>

      {/* Price */}
      {apartment.priceEgp && (
        <div className="mb-6">
          <p className="text-4xl font-bold text-primary">
            {formatPrice(apartment.priceEgp)}
          </p>
        </div>
      )}

      {/* Property Details */}
      <PropertyDetails apartment={apartment} className="mb-6" />

      {/* Description */}
      {apartment.description && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {apartment.description}
          </p>
        </div>
      )}

      {/* Amenities */}
      {apartment.amenities && apartment.amenities.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {apartment.amenities.map((amenity) => (
              <Badge key={amenity.id} variant="outline" className="text-sm">
                {amenity.amenity}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};