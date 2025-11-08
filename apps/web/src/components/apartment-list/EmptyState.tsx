'use client';

import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface EmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasActiveFilters,
  onClearFilters,
}) => {
  return (
    <div className="text-center py-20 space-y-6">
      <EmptyStateIcon />
      <EmptyStateContent hasActiveFilters={hasActiveFilters} />
      {hasActiveFilters && (
        <ClearFiltersAction onClearFilters={onClearFilters} />
      )}
    </div>
  );
};

const EmptyStateIcon: React.FC = () => {
  return (
    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
      <Search className="w-12 h-12 text-muted-foreground/40" />
    </div>
  );
};

interface EmptyStateContentProps {
  hasActiveFilters: boolean;
}

const EmptyStateContent: React.FC<EmptyStateContentProps> = ({
  hasActiveFilters,
}) => {
  return (
    <div className="space-y-2">
      <p className="text-xl font-semibold text-foreground">No apartments found</p>
      <EmptyStateDescription hasActiveFilters={hasActiveFilters} />
    </div>
  );
};

interface EmptyStateDescriptionProps {
  hasActiveFilters: boolean;
}

const EmptyStateDescription: React.FC<EmptyStateDescriptionProps> = ({
  hasActiveFilters,
}) => {
  const message = hasActiveFilters 
    ? "Try adjusting your search filters or browse all apartments"
    : "We couldn't find any apartments at the moment. Please check back later.";

  return (
    <p className="text-muted-foreground max-w-md mx-auto">
      {message}
    </p>
  );
};

interface ClearFiltersActionProps {
  onClearFilters: () => void;
}

const ClearFiltersAction: React.FC<ClearFiltersActionProps> = ({
  onClearFilters,
}) => {
  return (
    <Button 
      variant="outline" 
      onClick={onClearFilters}
      className="hover:bg-primary hover:text-primary-foreground transition-colors"
    >
      <X className="w-4 h-4 mr-2" />
      Clear All Filters
    </Button>
  );
};