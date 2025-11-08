'use client';

import { Header } from '@/components/Header';
import dynamic from 'next/dynamic';
import { ResponsiveLayout, ResponsiveSection } from '@/components/layout/ResponsiveLayout';
import {
  ApartmentGridSkeleton,
  FiltersSkeleton,
  PageHeaderSkeleton,
} from '@/components/ui/skeleton-loading';
import {
  PageHeader,
  EmptyState,
  ApartmentsGrid,
  LoadMoreSection
} from '@/components/apartment-list';
import { useApartmentList } from '@/hooks/useApartmentList';
import { usePrefetchApartments } from '@/hooks/usePrefetchRoutes';

// Dynamically import the heavy ApartmentFilters component
const ApartmentFiltersComponent = dynamic(
  () => import('@/components/ApartmentFilters').then(mod => ({ default: mod.ApartmentFiltersComponent })),
  {
    ssr: false,
    loading: () => <FiltersSkeleton />,
  }
);

const ApartmentList = () => {
  const {
    apartments,
    watchlist,
    pagination,
    loadingState,
    hasActiveFilters,
    activeFiltersCount,
    isAdmin,
    handleFilterChange,
    handleLoadMore,
    handleRefresh,
    toggleWatchlist,
  } = useApartmentList();

  // Prefetch apartment detail pages for the first few apartments
  const apartmentIds = apartments.slice(0, 5).map(apt => apt.id);
  usePrefetchApartments(apartmentIds);

  const renderInitialLoading = () => (
    <ResponsiveLayout variant="gradient">
      <Header />
      <ResponsiveSection>
        <PageHeaderSkeleton />
        <FiltersSkeleton />
        <ApartmentGridSkeleton count={12} />
      </ResponsiveSection>
    </ResponsiveLayout>
  );

  const renderEmptyState = () => (
    <EmptyState
      hasActiveFilters={hasActiveFilters}
      onClearFilters={() => handleFilterChange({})}
    />
  );

  const renderApartmentsContent = () => {
    if (loadingState.isLoading) {
      return <ApartmentGridSkeleton count={12} />;
    }

    if (apartments.length === 0) {
      return renderEmptyState();
    }

    return (
      <>
        <ApartmentsGrid
          apartments={apartments}
          isLoading={loadingState.isLoading}
          watchlist={watchlist}
          isAdmin={isAdmin}
          onToggleWatchlist={toggleWatchlist}
        />
        <LoadMoreSection
          hasMore={pagination.hasMore}
          isLoadingMore={loadingState.isLoadingMore}
          onLoadMore={handleLoadMore}
        />
      </>
    );
  };

  const renderMainContent = () => (
    <ResponsiveLayout variant="gradient">
      <Header />
      <ResponsiveSection>
        <PageHeader
          totalFiltered={pagination.totalFiltered}
          activeFiltersCount={activeFiltersCount}
          isLoading={loadingState.isLoading}
          onRefresh={handleRefresh}
        />

        <ApartmentFiltersComponent onFilterChange={handleFilterChange} />

        {renderApartmentsContent()}
      </ResponsiveSection>
    </ResponsiveLayout>
  );

  // Show initial loading state with skeletons
  if (loadingState.isInitialLoad) {
    return renderInitialLoading();
  }

  return renderMainContent();
};

export default ApartmentList;
