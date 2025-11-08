import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { citiesApi, projectsApi, City, Project, type ApartmentFilters } from '@/services/api';
import { EnhancedTooltip, InfoTooltip } from '@/components/ui/enhanced-tooltip';
import { formatPrice, debounce, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface FilterValues {
  search: string;
  cityId: string[];
  projectId: string[];
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  bedrooms: string[];
  bathrooms: string[];
  status: string[];
}

interface ApartmentFiltersProps {
  onFilterChange: (filters: ApartmentFilters) => void;
}

// Helper functions to reduce complexity
const getMultiSelectOptions = {
  status: (): MultiSelectOption[] => [
    { value: 'ACTIVE', label: 'Active', description: 'Available apartments' },
    { value: 'INACTIVE', label: 'Inactive', description: 'Not currently available' },
    { value: 'SOLD', label: 'Sold', description: 'Already sold apartments' }
  ],
  bedrooms: (): MultiSelectOption[] => [
    { value: '1', label: '1 bedroom' },
    { value: '2', label: '2 bedrooms' },
    { value: '3', label: '3 bedrooms' },
    { value: '4', label: '4 bedrooms' },
    { value: '5', label: '5+ bedrooms' }
  ],
  bathrooms: (): MultiSelectOption[] => [
    { value: '1', label: '1 bathroom' },
    { value: '2', label: '2 bathrooms' },
    { value: '3', label: '3 bathrooms' },
    { value: '4', label: '4+ bathrooms' }
  ]
};

const buildApiFilters = (filterValues: FilterValues): ApartmentFilters => {
  const apiFilters: ApartmentFilters = {};
  
  if (filterValues.search.trim()) {
    apiFilters.search = filterValues.search.trim();
  }
  if (filterValues.cityId.length > 0) {
    apiFilters.cityId = filterValues.cityId;
  }
  if (filterValues.projectId.length > 0) {
    apiFilters.projectId = filterValues.projectId;
  }
  if (filterValues.minPrice) {
    apiFilters.minPrice = Number(filterValues.minPrice);
  }
  if (filterValues.maxPrice) {
    apiFilters.maxPrice = Number(filterValues.maxPrice);
  }
  if (filterValues.minArea) {
    apiFilters.minArea = Number(filterValues.minArea);
  }
  if (filterValues.maxArea) {
    apiFilters.maxArea = Number(filterValues.maxArea);
  }
  if (filterValues.bedrooms.length > 0) {
    apiFilters.bedrooms = filterValues.bedrooms.map(Number);
  }
  if (filterValues.bathrooms.length > 0) {
    apiFilters.bathrooms = filterValues.bathrooms.map(Number);
  }
  if (filterValues.status.length > 0) {
    apiFilters.status = filterValues.status as ('ACTIVE' | 'INACTIVE' | 'SOLD')[];
  }

  return apiFilters;
};

const countActiveFilters = (filters: FilterValues): number => {
  let count = 0;
  if (filters.search.trim()) count++;
  count += filters.cityId.length;
  count += filters.projectId.length;
  if (filters.minPrice.trim()) count++;
  if (filters.maxPrice.trim()) count++;
  if (filters.minArea.trim()) count++;
  if (filters.maxArea.trim()) count++;
  count += filters.bedrooms.length;
  count += filters.bathrooms.length;
  count += filters.status.length;
  return count;
};

const getFilterSummary = (filters: FilterValues, cities: City[], projects: Project[]) => {
  const activeFilters: string[] = [];
  
  if (filters.search) {
    activeFilters.push(`Search: "${filters.search}"`);
  }
  
  if (filters.cityId.length > 0) {
    const cityNames = filters.cityId.map(id => {
      const city = cities.find(c => c.id === id);
      return city?.name || 'Unknown';
    });
    activeFilters.push(`Cities: ${cityNames.join(', ')}`);
  }
  
  if (filters.projectId.length > 0) {
    const projectNames = filters.projectId.map(id => {
      const project = projects.find(p => p.id === id);
      return project?.name || 'Unknown';
    });
    activeFilters.push(`Projects: ${projectNames.join(', ')}`);
  }
  
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? formatPrice(Number(filters.minPrice)) : '0 EGP';
    const max = filters.maxPrice ? formatPrice(Number(filters.maxPrice)) : '∞';
    activeFilters.push(`Price: ${min} - ${max}`);
  }
  
  if (filters.minArea || filters.maxArea) {
    const min = filters.minArea || '0';
    const max = filters.maxArea || '∞';
    activeFilters.push(`Area: ${min} - ${max} m²`);
  }
  
  if (filters.bedrooms.length > 0) {
    activeFilters.push(`Bedrooms: ${filters.bedrooms.join(', ')}`);
  }
  
  if (filters.bathrooms.length > 0) {
    activeFilters.push(`Bathrooms: ${filters.bathrooms.join(', ')}`);
  }
  
  if (filters.status.length > 0) {
    activeFilters.push(`Status: ${filters.status.join(', ')}`);
  }

  return activeFilters;
};

// Extracted components for better organization and reduced complexity
interface FilterSectionProps {
  filters: FilterValues;
  handleChange: (field: keyof FilterValues, value: string) => void;
  handleArrayChange: (field: keyof FilterValues, value: string[]) => void;
  handleApply: () => void;
  isMobile: boolean;
}

const SearchSection: React.FC<FilterSectionProps> = ({ filters, handleChange, handleApply, isMobile }) => (
  <div className="space-y-2">
    <Label htmlFor="search" className="font-medium flex items-center gap-3 text-sm">
      <Search className="w-4 h-4 text-primary" />
      Search
      <InfoTooltip content="Search by apartment name, description, or project details" />
    </Label>
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        id="search"
        placeholder={isMobile ? "Search apartments..." : "Search apartments, projects, or locations..."}
        value={filters.search}
        onChange={(e) => handleChange('search', e.target.value)}
        className={cn(
          "pl-9 border-border/40 focus:border-primary/50 transition-colors",
          isMobile ? "h-12" : "h-11"
        )}
        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
      />
    </div>
  </div>
);

interface LocationFiltersProps extends FilterSectionProps {
  cities: City[];
  projects: Project[];
  isLoadingCities: boolean;
  isLoadingProjects: boolean;
}

const LocationFilters: React.FC<LocationFiltersProps> = ({ 
  filters, 
  handleArrayChange, 
  cities, 
  projects, 
  isLoadingCities, 
  isLoadingProjects, 
  isMobile 
}) => {
  const getCityOptions = (): MultiSelectOption[] => {
    return cities.map(city => ({
      value: city.id,
      label: `${city.name}, ${city.country}`,
      description: city.country
    }));
  };

  const getProjectOptions = (): MultiSelectOption[] => {
    return projects.map(project => ({
      value: project.id,
      label: project.name,
      description: project.city?.name
    }));
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm font-medium flex items-center gap-3">
          Cities
          <InfoTooltip content="Select cities to filter apartments by location" />
        </Label>
        <MultiSelect
          options={getCityOptions()}
          value={filters.cityId}
          onChange={(value) => handleArrayChange('cityId', value)}
          placeholder="Select cities"
          searchPlaceholder="Search cities..."
          emptyText="No cities found"
          loading={isLoadingCities}
          className={isMobile ? "h-12" : "h-11"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project" className="text-sm font-medium flex items-center gap-3">
          Projects
          <InfoTooltip content="Select specific projects within the chosen cities" />
        </Label>
        <MultiSelect
          options={getProjectOptions()}
          value={filters.projectId}
          onChange={(value) => handleArrayChange('projectId', value)}
          placeholder="Select projects"
          searchPlaceholder="Search projects..."
          emptyText="No projects found"
          loading={isLoadingProjects}
          disabled={filters.cityId.length === 0}
          className={isMobile ? "h-12" : "h-11"}
        />
      </div>
    </>
  );
};

const StatusFilters: React.FC<FilterSectionProps> = ({ filters, handleArrayChange, isMobile }) => (
  <div className="space-y-2">
    <Label htmlFor="status" className="text-sm font-medium flex items-center gap-3">
      Status
      <InfoTooltip content="Filter by apartment availability status" />
    </Label>
    <MultiSelect
      options={getMultiSelectOptions.status()}
      value={filters.status}
      onChange={(value) => handleArrayChange('status', value)}
      placeholder="Any status"
      searchPlaceholder="Search status..."
      emptyText="No status found"
      className={isMobile ? "h-12" : "h-11"}
    />
  </div>
);

const PriceRangeFilters: React.FC<FilterSectionProps> = ({ filters, handleChange, isMobile }) => (
  <>
    <div className="space-y-2">
      <Label htmlFor="minPrice" className="text-sm font-medium flex items-center gap-3">
        Min Price
        <InfoTooltip content="Minimum price in Egyptian Pounds (EGP)" />
      </Label>
      <Input
        id="minPrice"
        type="number"
        placeholder="0"
        value={filters.minPrice}
        onChange={(e) => handleChange('minPrice', e.target.value)}
        min="0"
        className={cn(
          "border-border/40 focus:border-primary/50",
          isMobile ? "h-12" : "h-11"
        )}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="maxPrice" className="text-sm font-medium flex items-center gap-3">
        Max Price
        <InfoTooltip content="Maximum price in Egyptian Pounds (EGP)" />
      </Label>
      <Input
        id="maxPrice"
        type="number"
        placeholder="10,000,000"
        value={filters.maxPrice}
        onChange={(e) => handleChange('maxPrice', e.target.value)}
        min="0"
        className={cn(
          "border-border/40 focus:border-primary/50",
          isMobile ? "h-12" : "h-11"
        )}
      />
    </div>
  </>
);

const AreaRangeFilters: React.FC<FilterSectionProps> = ({ filters, handleChange, isMobile }) => (
  <>
    <div className="space-y-2">
      <Label htmlFor="minArea" className="text-sm font-medium flex items-center gap-3">
        Min Area
        <InfoTooltip content="Minimum area in square meters" />
      </Label>
      <Input
        id="minArea"
        type="number"
        placeholder="0"
        value={filters.minArea}
        onChange={(e) => handleChange('minArea', e.target.value)}
        min="0"
        className={cn(
          "border-border/40 focus:border-primary/50",
          isMobile ? "h-12" : "h-11"
        )}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="maxArea" className="text-sm font-medium flex items-center gap-3">
        Max Area
        <InfoTooltip content="Maximum area in square meters" />
      </Label>
      <Input
        id="maxArea"
        type="number"
        placeholder="500"
        value={filters.maxArea}
        onChange={(e) => handleChange('maxArea', e.target.value)}
        min="0"
        className={cn(
          "border-border/40 focus:border-primary/50",
          isMobile ? "h-12" : "h-11"
        )}
      />
    </div>
  </>
);

const RoomFilters: React.FC<FilterSectionProps> = ({ filters, handleArrayChange, isMobile }) => (
  <>
    <div className="space-y-2">
      <Label htmlFor="bedrooms" className="text-sm font-medium flex items-center gap-3">
        Bedrooms
        <InfoTooltip content="Number of bedrooms" />
      </Label>
      <MultiSelect
        options={getMultiSelectOptions.bedrooms()}
        value={filters.bedrooms}
        onChange={(value) => handleArrayChange('bedrooms', value)}
        placeholder="Any"
        searchPlaceholder="Search bedrooms..."
        emptyText="No options found"
        className={isMobile ? "h-12" : "h-11"}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="bathrooms" className="text-sm font-medium flex items-center gap-3">
        Bathrooms
        <InfoTooltip content="Number of bathrooms" />
      </Label>
      <MultiSelect
        options={getMultiSelectOptions.bathrooms()}
        value={filters.bathrooms}
        onChange={(value) => handleArrayChange('bathrooms', value)}
        placeholder="Any"
        searchPlaceholder="Search bathrooms..."
        emptyText="No options found"
        className={isMobile ? "h-12" : "h-11"}
      />
    </div>
  </>
);

export const ApartmentFiltersComponent: React.FC<ApartmentFiltersProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    cityId: [],
    projectId: [],
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    bedrooms: [],
    bathrooms: [],
    status: [],
  });

  const [isOpen, setIsOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const isMobile = useIsMobile();

  // Debounced search handler for better UX
  const debouncedFilterChange = debounce((newFilters: ApartmentFilters) => {
    onFilterChange(newFilters);
  }, 300);

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setIsLoadingCities(true);
    try {
      const response = await citiesApi.getAll({ limit: 100 });
      setCities(response.data || []);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const fetchProjectsForCities = async (cityIds: string[]) => {
    setIsLoadingProjects(true);
    try {
      const allProjects = await Promise.all(
        cityIds.map(cityId => projectsApi.getAll({ cityId, limit: 100 }))
      );
      const combinedProjects = allProjects.flatMap(response => response.data || []);
      const uniqueProjects = combinedProjects.filter((project, index, arr) =>
        arr.findIndex(p => p.id === project.id) === index
      );
      setProjects(uniqueProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Fetch projects when a city is selected
  useEffect(() => {
    if (filters.cityId.length > 0) {
      fetchProjectsForCities(filters.cityId);
    } else {
      setProjects([]);
      if (filters.projectId.length > 0) {
        setFilters(prev => ({ ...prev, projectId: [] }));
      }
    }
  }, [filters.cityId, filters.projectId.length]);

  const handleChange = (field: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);

    // For search, use debounced update
    if (field === 'search') {
      debouncedFilterChange(buildApiFilters(newFilters));
    }
  };

  const handleArrayChange = (field: keyof FilterValues, value: string[]) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  const handleApply = () => {
    const apiFilters = buildApiFilters(filters);
    onFilterChange(apiFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: FilterValues = {
      search: '',
      cityId: [],
      projectId: [],
      minPrice: '',
      maxPrice: '',
      minArea: '',
      maxArea: '',
      bedrooms: [],
      bathrooms: [],
      status: [],
    };
    setFilters(resetFilters);
    onFilterChange({});
  };

  const activeFiltersCount = countActiveFilters(filters);

  return (
    <Card className="border-border/40 shadow-lg bg-card/50 backdrop-blur-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn(
            "cursor-pointer hover:bg-muted/50 transition-all duration-200 rounded-t-lg",
            isOpen && "bg-muted/30",
            isMobile ? "p-4" : "px-6 py-4"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "bg-primary/10 rounded-lg",
                  isMobile ? "p-1.5" : "p-2"
                )}>
                  <Filter className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Filters
                  </CardTitle>
                  {activeFiltersCount > 0 && (
                    <p className={cn(
                      "text-muted-foreground",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      {activeFiltersCount} active filter{activeFiltersCount === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <EnhancedTooltip content={isOpen ? 'Collapse filters' : 'Expand filters'}>
                <div className={cn(
                  "hover:bg-muted/50 rounded-md transition-colors",
                  isMobile ? "p-2" : "p-1"
                )}>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </EnhancedTooltip>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2">
          <CardContent className={cn(
            "space-y-6",
            isMobile ? "pt-0 pb-4 px-4" : "pt-0 pb-6 px-6"
          )}>
            <SearchSection 
              filters={filters}
              handleChange={handleChange}
              handleArrayChange={handleArrayChange}
              handleApply={handleApply}
              isMobile={isMobile}
            />

            <div className={cn(
              "grid gap-6",
              isMobile 
                ? "grid-cols-1" 
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}>
              <LocationFilters 
                filters={filters}
                handleChange={handleChange}
                handleArrayChange={handleArrayChange}
                handleApply={handleApply}
                cities={cities}
                projects={projects}
                isLoadingCities={isLoadingCities}
                isLoadingProjects={isLoadingProjects}
                isMobile={isMobile}
              />

              <StatusFilters 
                filters={filters}
                handleChange={handleChange}
                handleArrayChange={handleArrayChange}
                handleApply={handleApply}
                isMobile={isMobile}
              />

              <PriceRangeFilters 
                filters={filters}
                handleChange={handleChange}
                handleArrayChange={handleArrayChange}
                handleApply={handleApply}
                isMobile={isMobile}
              />

              <AreaRangeFilters 
                filters={filters}
                handleChange={handleChange}
                handleArrayChange={handleArrayChange}
                handleApply={handleApply}
                isMobile={isMobile}
              />

              <RoomFilters 
                filters={filters}
                handleChange={handleChange}
                handleArrayChange={handleArrayChange}
                handleApply={handleApply}
                isMobile={isMobile}
              />
            </div>

            {/* Active filters summary */}
            {activeFiltersCount > 0 && (
              <div className={cn(
                "bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20",
                isMobile ? "p-3" : "p-4"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-foreground flex items-center gap-2 text-sm">
                    <Filter className="w-4 h-4 text-primary" />
                    Active filters ({activeFiltersCount}):
                  </span>
                  <EnhancedTooltip content="Clear all active filters">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleReset}
                      className={cn(
                        "h-auto text-xs hover:bg-destructive/10 hover:text-destructive transition-colors",
                        isMobile ? "p-2" : "p-1"
                      )}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  </EnhancedTooltip>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getFilterSummary(filters, cities, projects).map((filter, index) => (
                    <Badge 
                      key={`filter-${filter.slice(0, 20)}-${index}`} 
                      variant="secondary" 
                      className="text-xs bg-primary/10 text-primary border-primary/20"
                    >
                      {filter}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className={cn(
              "flex gap-3 pt-2",
              isMobile ? "flex-col space-y-2" : "flex-row"
            )}>
              <Button 
                onClick={handleApply} 
                className={cn(
                  "font-medium",
                  isMobile ? "w-full h-12" : "flex-1 h-11"
                )}
              >
                Apply Filters
              </Button>
              <Button 
                onClick={handleReset} 
                variant="outline" 
                className={cn(
                  isMobile ? "w-full h-12" : "h-11 px-6"
                )}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export { ApartmentFiltersComponent as ApartmentFilters };