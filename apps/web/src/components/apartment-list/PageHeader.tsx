'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';
import { formatNumber, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageHeaderProps {
  totalFiltered: number;
  activeFiltersCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  totalFiltered,
  activeFiltersCount,
  isLoading,
  onRefresh,
}) => {
  const hasActiveFilters = activeFiltersCount > 0;
  const isMobile = useIsMobile();

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 shadow-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
      
      {/* Content */}
      <div className={cn("relative z-10", isMobile ? "p-5" : "p-8")}>
        <div className={cn(
          "flex gap-4",
          isMobile ? "flex-col space-y-4" : "flex-col lg:flex-row lg:justify-between lg:items-start lg:space-y-0"
        )}>
          <HeaderContent 
            totalFiltered={totalFiltered} 
            hasActiveFilters={hasActiveFilters}
            isMobile={isMobile} 
          />
          <HeaderActions
            hasActiveFilters={hasActiveFilters}
            activeFiltersCount={activeFiltersCount}
            isLoading={isLoading}
            onRefresh={onRefresh}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
};

interface HeaderContentProps {
  totalFiltered: number;
  hasActiveFilters: boolean;
  isMobile: boolean;
}

const HeaderContent: React.FC<HeaderContentProps> = ({ 
  totalFiltered, 
  hasActiveFilters, 
  isMobile 
}) => {
  return (
    <div className="space-y-3">
      <h1 className={cn(
        "font-bold text-foreground leading-tight",
        isMobile ? "text-xl" : "text-2xl lg:text-3xl"
      )}>
        Find Your Dream Apartment
      </h1>
      <p className={cn(
        "text-muted-foreground max-w-2xl leading-relaxed",
        isMobile ? "text-sm" : "text-base"
      )}>
        Browse through our collection of premium apartments with advanced filters
      </p>
      <ApartmentCountDisplay
        apartmentCount={totalFiltered}
        hasActiveFilters={hasActiveFilters}
        isMobile={isMobile}
      />
    </div>
  );
};

interface ApartmentCountDisplayProps {
  apartmentCount: number;
  hasActiveFilters: boolean;
  isMobile: boolean;
}

const ApartmentCountDisplay: React.FC<ApartmentCountDisplayProps> = ({ 
  apartmentCount, 
  hasActiveFilters, 
  isMobile 
}) => {
  if (apartmentCount === 0 && !hasActiveFilters) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-background via-muted/30 to-background",
      isMobile ? "text-sm" : "text-base"
    )}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Search className="w-4 h-4 text-primary" />
        <div className="flex items-center gap-1">
          <span>
            {hasActiveFilters ? 'Found' : 'Over'} 
            <span className="font-semibold text-primary text-lg mx-2">
              {formatNumber(apartmentCount)}
            </span>
            apartment{apartmentCount === 1 ? '' : 's'} 
            {hasActiveFilters ? ' matching your filters' : ' available'}
          </span>
        </div>
      </div>
      {hasActiveFilters && (
        <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
          <SlidersHorizontal className="w-3 h-3" />
          <span>Filtered</span>
        </div>
      )}
    </div>
  );
};

interface HeaderActionsProps {
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  isMobile: boolean;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  hasActiveFilters,
  activeFiltersCount,
  isLoading,
  onRefresh,
  isMobile,
}) => {
  return (
    <div className={cn(
      "flex gap-3",
      isMobile ? "flex-row" : "flex-row lg:flex-col lg:items-end lg:gap-2"
    )}>
      <RefreshButton isLoading={isLoading} onRefresh={onRefresh} isMobile={isMobile} />
    </div>
  );
};

interface RefreshButtonProps {
  isLoading: boolean;
  onRefresh: () => void;
  isMobile: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ isLoading, onRefresh, isMobile }) => {
  return (
    <EnhancedTooltip content="Refresh apartment listings">
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isLoading}
        size={isMobile ? "default" : "sm"}
        className={cn(
          "flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300",
          "backdrop-blur-sm bg-background/90 border-primary/30 shadow-sm hover:shadow-md",
          "hover:scale-105 active:scale-95",
          isMobile && "h-10 min-w-[100px]"
        )}
      >
        <RefreshCw className={cn(
          "w-4 h-4 transition-transform duration-300",
          isLoading ? 'animate-spin' : 'group-hover:rotate-180'
        )} />
        {!isMobile && 'Refresh'}
      </Button>
    </EnhancedTooltip>
  );
};

interface ActiveFiltersIndicatorProps {
  count: number;
  isMobile: boolean;
}
