'use client';

import { Button } from '@/components/ui/button';
import { LoadMoreSkeleton } from '@/components/ui/skeleton-loading';

interface LoadMoreSectionProps {
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export const LoadMoreSection: React.FC<LoadMoreSectionProps> = ({
  hasMore,
  isLoadingMore,
  onLoadMore,
}) => {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="flex justify-center">
      {isLoadingMore ? (
        <LoadingMoreState />
      ) : (
        <LoadMoreButton onLoadMore={onLoadMore} />
      )}
    </div>
  );
};

const LoadingMoreState: React.FC = () => {
  return <LoadMoreSkeleton />;
};

interface LoadMoreButtonProps {
  onLoadMore: () => void;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ onLoadMore }) => {
  return (
    <Button
      onClick={onLoadMore}
      variant="outline"
      size="lg"
      className="min-w-[160px] hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-sm hover:shadow-md"
    >
      Load More Apartments
    </Button>
  );
};