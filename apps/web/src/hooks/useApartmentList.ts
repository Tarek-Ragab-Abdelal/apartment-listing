'use client';

import { useState, useEffect, useCallback } from 'react';
import { apartmentApi, watchlistApi, Apartment, ApartmentFilters, ApartmentSearchBody } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalFiltered: number; 
  hasMore: boolean;
}

interface LoadingState {
  isLoading: boolean;
  isLoadingMore: boolean;
  isInitialLoad: boolean;
}

export const useApartmentList = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<ApartmentFilters>({});
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 12,
    total: 0,
    totalFiltered: 0,
    hasMore: false,
  });
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isLoadingMore: false,
    isInitialLoad: true,
  });

  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const updateLoadingState = useCallback((updates: Partial<LoadingState>) => {
    setLoadingState(prev => ({ ...prev, ...updates }));
  }, []);

  const showErrorToast = useCallback((description: string) => {
    toast({
      title: 'Error',
      description,
      variant: 'destructive',
    });
  }, [toast]);

  const showSuccessToast = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
    });
  }, [toast]);

  const fetchApartments = useCallback(async (
    filters?: ApartmentFilters, 
    page: number = 1, 
    reset: boolean = true
  ) => {
    const isFirstPage = page === 1;
    
    updateLoadingState({
      isLoading: isFirstPage,
      isLoadingMore: !isFirstPage,
    });

    try {
      // Check if we have any multi-value filters to determine which endpoint to use
      const hasMultiValueFilters = filters && (
        (Array.isArray(filters.projectId) && filters.projectId.length > 1) ||
        (Array.isArray(filters.cityId) && filters.cityId.length > 1) ||
        (Array.isArray(filters.status) && filters.status.length > 1) ||
        (Array.isArray(filters.bedrooms) && filters.bedrooms.length > 0) ||
        (Array.isArray(filters.bathrooms) && filters.bathrooms.length > 0) ||
        // Also use the new endpoint if we have any arrays at all
        Array.isArray(filters.projectId) ||
        Array.isArray(filters.cityId) ||
        Array.isArray(filters.status)
      );

      let response;
      
      if (hasMultiValueFilters) {
        // Use the new POST /apartments/search endpoint for multi-value filters
        const searchBody = {
          projectIds: Array.isArray(filters?.projectId) ? filters.projectId : (filters?.projectId ? [filters.projectId] : undefined),
          cityIds: Array.isArray(filters?.cityId) ? filters.cityId : (filters?.cityId ? [filters.cityId] : undefined),
          listerIds: filters?.listerId ? [filters.listerId] : undefined,
          statuses: Array.isArray(filters?.status) ? filters.status : (filters?.status ? [filters.status] : undefined),
          minPrice: filters?.minPrice,
          maxPrice: filters?.maxPrice,
          minArea: filters?.minArea,
          maxArea: filters?.maxArea,
          // For bedrooms/bathrooms, if we get an array from the UI, we'll need to convert it appropriately
          // For now, let's take the first value or convert it to what the API expects
          bedrooms: Array.isArray(filters?.bedrooms) && filters.bedrooms.length > 0 ? filters.bedrooms[0] : 
                   (typeof filters?.bedrooms === 'number' ? filters.bedrooms : undefined),
          bathrooms: Array.isArray(filters?.bathrooms) && filters.bathrooms.length > 0 ? filters.bathrooms[0] : 
                    (typeof filters?.bathrooms === 'number' ? filters.bathrooms : undefined),
          search: filters?.search,
          page,
          limit: pagination.limit,
        };
        
        // Remove undefined properties
        Object.keys(searchBody).forEach(key => {
          if (searchBody[key as keyof typeof searchBody] === undefined) {
            delete searchBody[key as keyof typeof searchBody];
          }
        });

        response = await apartmentApi.search(searchBody);
      } else {
        // Use the original GET /apartments endpoint for simple queries
        response = await apartmentApi.getAll({
          ...filters,
          page,
          limit: pagination.limit,
        });
      }

      console.log('API Response structure:', {
        success: response.success,
        dataLength: response.data?.length,
        totalFiltered: 'meta' in response ? response.meta?.totalFiltered : (response as any).totalFiltered,
        total: 'meta' in response ? response.meta?.total : (response as any).total,
        meta: 'meta' in response ? response.meta : (response as any).meta,
        fullResponse: response
      });

      if (response.success && response.data) {
        const newApartments = Array.isArray(response.data) ? response.data : [];
        
        setApartments(prev => reset ? newApartments : [...prev, ...newApartments]);

        // Update pagination info
        const hasMore = newApartments.length === pagination.limit;
        
        // Get totalFiltered from meta object (prioritize meta if available)
        const metaData = 'meta' in response ? response.meta : (response as any).meta;
        const totalFiltered = metaData?.totalFiltered ?? metaData?.total ?? ('totalFiltered' in response ? response.totalFiltered : 0);
        
        console.log('Meta data:', metaData);
        console.log('totalFiltered from meta:', totalFiltered);
        
        setPagination(prev => ({
          ...prev,
          page,
          hasMore,
          total: reset ? newApartments.length : prev.total + newApartments.length,
          totalFiltered: totalFiltered,
        }));
      } else {
        if (reset) {
          setApartments([]);
        }
        setPagination(prev => ({ ...prev, hasMore: false }));
      }
    } catch (error) {
      console.error('Failed to fetch apartments:', error);
      if (reset) {
        setApartments([]);
      }
      showErrorToast('Failed to load apartments. Please try again.');
    } finally {
      updateLoadingState({
        isLoading: false,
        isLoadingMore: false,
      });
    }
  }, [pagination.limit, updateLoadingState, showErrorToast]);

  const fetchUserWatchlist = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await watchlistApi.getAll({ userId: user.id });
      if (response.success && response.data) {
        const apartmentIds = response.data.map((item: any) => item.apartmentId);
        setWatchlist(apartmentIds);
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    }
  }, [user]);

  const handleFilterChange = useCallback((filters: ApartmentFilters) => {
    setCurrentFilters(filters);
    setPagination(prev => ({ ...prev, page: 1, total: 0, totalFiltered: 0 }));
    fetchApartments(filters, 1, true);
  }, [fetchApartments]);

  const handleLoadMore = useCallback(() => {
    const nextPage = pagination.page + 1;
    fetchApartments(currentFilters, nextPage, false);
  }, [pagination.page, currentFilters, fetchApartments]);

  const handleRefresh = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 1, total: 0, totalFiltered: 0 }));
    fetchApartments(currentFilters, 1, true);
  }, [currentFilters, fetchApartments]);

  const toggleWatchlist = useCallback(async (apartmentId: string) => {
    if (!user) {
      showErrorToast('Please login to add apartments to your watchlist');
      return;
    }

    const isInWatchlist = watchlist.includes(apartmentId);

    try {
      if (isInWatchlist) {
        await watchlistApi.remove(user.id, apartmentId);
        setWatchlist(prev => prev.filter(id => id !== apartmentId));
        showSuccessToast('Removed from watchlist', 'Apartment removed from your watchlist');
      } else {
        await watchlistApi.add(user.id, apartmentId);
        setWatchlist(prev => [...prev, apartmentId]);
        showSuccessToast('Added to watchlist', 'Apartment added to your watchlist');
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
      showErrorToast('Failed to update watchlist. Please try again.');
    }
  }, [user, watchlist, showErrorToast, showSuccessToast]);

  const getActiveFiltersCount = useCallback(() => {
    return Object.values(currentFilters).filter(value => 
      value !== null && value !== undefined && value !== '' && 
      !(Array.isArray(value) && value.length === 0)
    ).length;
  }, [currentFilters]);

  const hasActiveFilters = getActiveFiltersCount() > 0;

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      updateLoadingState({ isInitialLoad: true });
      await fetchApartments();
      updateLoadingState({ isInitialLoad: false });
    };
    loadInitialData();
  }, []);

  // Fetch watchlist when user changes
  useEffect(() => {
    if (user) {
      fetchUserWatchlist();
    }
  }, [user, fetchUserWatchlist]);

  return {
    // State
    apartments,
    watchlist,
    currentFilters,
    pagination,
    loadingState,
    
    // Computed values
    hasActiveFilters,
    activeFiltersCount: getActiveFiltersCount(),
    
    // Auth
    user,
    isAdmin,
    
    // Actions
    handleFilterChange,
    handleLoadMore,
    handleRefresh,
    toggleWatchlist,
  };
};