'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Bed, Bath, Square, MapPin, ImageIcon } from 'lucide-react';
import { Apartment } from '@/services/api';
import { formatPrice, formatArea, truncateText, cn } from '@/lib/utils';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';

interface ApartmentCardProps {
  apartment: Apartment;
  onToggleWatchlist?: (id: string) => void;
  isInWatchlist?: boolean;
  className?: string;
  priority?: boolean; // For image loading optimization
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({ 
  apartment, 
  onToggleWatchlist,
  isInWatchlist = false,
  className,
  priority = false
}) => {
  const isMobile = useIsMobile();
  
  const getImageUrl = () => {
    if (apartment.images && apartment.images.length > 0) {
      return apartment.images[0].imageUrl;
    }
    // Fallback to placeholder with apartment-specific seed for consistency
    return `https://picsum.photos/600/400?random=${apartment.id}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'SOLD':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
  };

  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-300 border-0 shadow-md bg-white dark:bg-gray-950 flex flex-col",
      "hover:shadow-2xl hover:-translate-y-1 hover:ring-1 hover:ring-primary/20",
      // Mobile-responsive height and touch optimizations
      isMobile 
        ? "h-auto min-h-[400px] active:scale-[0.98] transition-transform" 
        : "h-[520px]",
      className
    )}>
      <Link href={`/apartment/${apartment.id}`}>
        <div className={cn(
          "overflow-hidden bg-muted/30 relative",
          // Mobile-optimized aspect ratio
          isMobile ? "aspect-[4/3]" : "aspect-video"
        )}>
          {apartment.images && apartment.images.length > 0 ? (
            <img
              src={getImageUrl()}
              alt={apartment.unitName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading={priority ? 'eager' : 'lazy'}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://picsum.photos/600/400?random=${apartment.id}`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
              <ImageIcon className={cn(
                "text-muted-foreground/40",
                isMobile ? "w-10 h-10" : "w-12 h-12"
              )} />
            </div>
          )}
          
          {/* Image overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          
          {/* Status badge on image */}
          <div className={cn(
            "absolute top-2 left-2",
            isMobile && "top-3 left-3"
          )}>
            <Badge 
              className={cn(
                "font-medium border backdrop-blur-sm",
                isMobile ? "text-xs" : "text-xs",
                getStatusColor(apartment.status)
              )}
            >
              {apartment.status}
            </Badge>
          </div>

          {/* Images count badge */}
          {apartment.images && apartment.images.length > 1 && (
            <div className={cn(
              "absolute top-2 right-2",
              isMobile && "top-3 right-3"
            )}>
              <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-black/40 text-white border-0">
                {apartment.images.length} photos
              </Badge>
            </div>
          )}
        </div>
      </Link>
      
      <CardContent className={cn(
        "space-y-3 flex-1 flex flex-col",
        isMobile ? "p-3" : "p-4"
      )}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <EnhancedTooltip content={apartment.unitName}>
              <Link href={`/apartment/${apartment.id}`}>
                <h3 className={cn(
                  "font-semibold text-foreground hover:text-primary transition-colors duration-200 line-clamp-1 cursor-pointer",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  {truncateText(apartment.unitName, isMobile ? 30 : 40)}
                </h3>
              </Link>
            </EnhancedTooltip>
          </div>
          
          {onToggleWatchlist && (
            <EnhancedTooltip content={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleWatchlist(apartment.id)}
                className={cn(
                  "transition-all duration-200 shrink-0",
                  // Mobile-friendly touch target
                  isMobile ? "p-2 min-w-[44px] min-h-[44px]" : "p-2 hover:scale-110",
                  isInWatchlist ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"
                )}
              >
                <Heart 
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "w-5 h-5" : "w-5 h-5",
                    isInWatchlist && "fill-current"
                  )} 
                />
              </Button>
            </EnhancedTooltip>
          )}
        </div>
        
        {/* Location info */}
        {(apartment.project) && (
          <div className="flex flex-wrap gap-1.5">
            {apartment.project && (
              <EnhancedTooltip content={`Project: ${apartment.project.name}`}>
                <Badge variant="secondary" className="text-xs hover:bg-secondary/80 transition-colors">
                  {truncateText(apartment.project.name, isMobile ? 15 : 20)}
                </Badge>
              </EnhancedTooltip>
            )}
            {apartment.project?.city && (
              <EnhancedTooltip content={`Location: ${apartment.project.city.name}, ${apartment.project.city.country}`}>
                <Badge variant="outline" className="text-xs hover:bg-accent transition-colors">
                  <MapPin className="w-3 h-3 mr-1" />
                  {apartment.project.city.name}
                </Badge>
              </EnhancedTooltip>
            )}
          </div>
        )}

        {/* Property Details */}
        <div className={cn(
          "flex items-center text-muted-foreground",
          isMobile ? "gap-3 text-xs" : "gap-4 text-sm"
        )}>
          {apartment.bedrooms && (
            <EnhancedTooltip content={`${apartment.bedrooms} bedroom${apartment.bedrooms !== 1 ? 's' : ''}`}>
              <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Bed className="w-4 h-4" />
                <span className="font-medium">{apartment.bedrooms}</span>
              </div>
            </EnhancedTooltip>
          )}
          {apartment.bathrooms && (
            <EnhancedTooltip content={`${apartment.bathrooms} bathroom${apartment.bathrooms !== 1 ? 's' : ''}`}>
              <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Bath className="w-4 h-4" />
                <span className="font-medium">{apartment.bathrooms}</span>
              </div>
            </EnhancedTooltip>
          )}
          {apartment.areaSqm && (
            <EnhancedTooltip content={`Area: ${formatArea(apartment.areaSqm)}`}>
              <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Square className="w-4 h-4" />
                <span className="font-medium">{formatArea(apartment.areaSqm)}</span>
              </div>
            </EnhancedTooltip>
          )}
        </div>
        
        {apartment.description && (
          <EnhancedTooltip content={apartment.description}>
            <p className={cn(
              "text-muted-foreground line-clamp-2 hover:text-foreground transition-colors cursor-default",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {truncateText(apartment.description, isMobile ? 80 : 100)}
            </p>
          </EnhancedTooltip>
        )}
        
        {apartment.priceEgp && (
          <div className="flex items-center justify-between mt-auto">
            <p className={cn(
              "font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              {formatPrice(apartment.priceEgp)}
            </p>
            {apartment.areaSqm && apartment.priceEgp && (
              <EnhancedTooltip content={`${formatPrice(apartment.priceEgp / apartment.areaSqm)} per m²`}>
                <span className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-xs" : "text-xs"
                )}>
                  {formatPrice(apartment.priceEgp / apartment.areaSqm)}/m²
                </span>
              </EnhancedTooltip>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className={cn(
        "mt-auto",
        isMobile ? "p-3 pt-0" : "p-4 pt-0"
      )}>
        <Link href={`/apartment/${apartment.id}`} className="w-full">
          <Button 
            variant="outline" 
            className={cn(
              "w-full hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-medium",
              // Mobile-friendly touch target
              isMobile && "h-11"
            )}
          >
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
