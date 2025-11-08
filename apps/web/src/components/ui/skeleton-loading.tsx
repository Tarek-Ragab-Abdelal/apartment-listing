'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonLoadingProps {
  className?: string;
}

/**
 * Skeleton loading component for apartment cards
 */
export const ApartmentCardSkeleton: React.FC<SkeletonLoadingProps> = ({ className }) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Image skeleton */}
      <div className="aspect-video overflow-hidden bg-muted">
        <Skeleton className="w-full h-full animate-pulse" />
      </div>
      
      <CardContent className="p-4">
        {/* Title and heart icon */}
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-6 w-3/4 animate-pulse" />
          <Skeleton className="h-8 w-8 rounded-full animate-pulse" />
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Skeleton className="h-5 w-16 rounded-full animate-pulse" />
          <Skeleton className="h-5 w-20 rounded-full animate-pulse" />
          <Skeleton className="h-5 w-12 rounded-full animate-pulse" />
        </div>

        {/* Property details */}
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-4 w-8 animate-pulse" />
          <Skeleton className="h-4 w-8 animate-pulse" />
          <Skeleton className="h-4 w-12 animate-pulse" />
        </div>
        
        {/* Description */}
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full animate-pulse" />
          <Skeleton className="h-4 w-2/3 animate-pulse" />
        </div>
        
        {/* Price */}
        <Skeleton className="h-8 w-32 animate-pulse" />
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full animate-pulse" />
      </CardFooter>
    </Card>
  );
};

/**
 * Skeleton loading for apartment list grid
 */
export const ApartmentGridSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 6, 
  className 
}) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {Array.from({ length: count }, (_, index) => `apartment-skeleton-${index}-${Date.now()}`).map((key) => (
        <ApartmentCardSkeleton key={key} />
      ))}
    </div>
  );
};

/**
 * Skeleton loading for filters section
 */
export const FiltersSkeleton: React.FC<SkeletonLoadingProps> = ({ className }) => {
  return (
    <Card className={className}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 animate-pulse" />
            <Skeleton className="h-5 w-16 animate-pulse" />
          </div>
          <Skeleton className="h-4 w-4 animate-pulse" />
        </div>
        
        {/* Search bar */}
        <div className="mb-4">
          <Skeleton className="h-10 w-full animate-pulse" />
        </div>
        
        {/* Filter options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }, (_, index) => `filter-option-${index}`).map((key) => (
            <div key={key} className="space-y-2">
              <Skeleton className="h-4 w-16 animate-pulse" />
              <Skeleton className="h-10 w-full animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-10 flex-1 animate-pulse" />
          <Skeleton className="h-10 w-20 animate-pulse" />
        </div>
      </div>
    </Card>
  );
};

/**
 * Page header skeleton
 */
export const PageHeaderSkeleton: React.FC<SkeletonLoadingProps> = ({ className }) => {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <Skeleton className="h-10 w-80 mb-2 animate-pulse" />
          <Skeleton className="h-5 w-60 animate-pulse" />
        </div>
        <Skeleton className="h-10 w-24 animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Full page skeleton for apartment list
 */
export const ApartmentListPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <PageHeaderSkeleton />
        <FiltersSkeleton className="mb-8" />
        <ApartmentGridSkeleton />
      </main>
    </div>
  );
};

/**
 * Load more skeleton
 */
export const LoadMoreSkeleton: React.FC<SkeletonLoadingProps> = ({ className }) => {
  return (
    <div className={cn("flex justify-center mt-8", className)}>
      <Skeleton className="h-10 w-32 animate-pulse" />
    </div>
  );
};