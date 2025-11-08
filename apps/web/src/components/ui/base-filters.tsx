'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { EnhancedTooltip, InfoTooltip } from '@/components/ui/enhanced-tooltip';
import { cn, debounce } from '@/lib/utils';

// Base filter field types
export interface BaseFilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BaseFilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'range' | 'search';
  placeholder?: string;
  options?: BaseFilterOption[];
  tooltip?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  className?: string;
  loading?: boolean;
}

export interface BaseFilterFieldGroup {
  title?: string;
  fields: BaseFilterField[];
  className?: string;
  columns?: number;
}

export interface BaseFiltersProps {
  title?: string;
  searchPlaceholder?: string;
  fields?: BaseFilterField[];
  fieldGroups?: BaseFilterFieldGroup[];
  values: Record<string, any>;
  onValuesChange: (values: Record<string, any>) => void;
  onApply?: () => void;
  onReset?: () => void;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  showSearch?: boolean;
  searchDebounceMs?: number;
  className?: string;
  loading?: boolean;
  showActiveFilters?: boolean;
}

/**
 * Base reusable filters component that can be used across different pages
 */
export const BaseFilters: React.FC<BaseFiltersProps> = ({
  title = 'Filters',
  searchPlaceholder = 'Search...',
  fields = [],
  fieldGroups = [],
  values,
  onValuesChange,
  onApply,
  onReset,
  isCollapsible = true,
  defaultOpen = false,
  showSearch = true,
  searchDebounceMs = 300,
  className,
  loading = false,
  showActiveFilters = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const searchValue = values.search || '';

  // Debounced search handler
  const debouncedSearch = React.useMemo(
    () => debounce((searchTerm: string) => {
      onValuesChange({ ...values, search: searchTerm });
    }, searchDebounceMs),
    [values, onValuesChange, searchDebounceMs]
  );

  const handleValueChange = (key: string, value: any) => {
    const newValues = { ...values, [key]: value };
    onValuesChange(newValues);
  };

  const handleSearchChange = (value: string) => {
    // Update local state immediately for responsive UI
    handleValueChange('search', value);
    // Debounce the actual filter change
    debouncedSearch(value);
  };

  const handleReset = () => {
    onValuesChange({});
    onReset?.();
  };

  const getActiveFiltersCount = () => {
    return Object.values(values).filter(value => 
      value !== null && value !== undefined && value !== '' && 
      !(Array.isArray(value) && value.length === 0)
    ).length;
  };

  const getActiveFiltersSummary = () => {
    const activeFilters: string[] = [];
    const allFields = [...fields, ...fieldGroups.flatMap(group => group.fields)];

    Object.entries(values).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return;
      }

      const field = allFields.find(f => f.key === key);
      if (!field) return;

      if (field.type === 'select' && field.options) {
        const option = field.options.find(opt => opt.value === value);
        if (option) {
          activeFilters.push(`${field.label}: ${option.label}`);
        }
      } else if (field.type === 'multiselect' && Array.isArray(value)) {
        const selectedLabels = value.map(val => {
          const option = field.options?.find(opt => opt.value === val);
          return option ? option.label : val;
        });
        if (selectedLabels.length > 0) {
          activeFilters.push(`${field.label}: ${selectedLabels.join(', ')}`);
        }
      } else if (key === 'search') {
        activeFilters.push(`Search: "${value}"`);
      } else {
        activeFilters.push(`${field.label}: ${value}`);
      }
    });

    return activeFilters;
  };

  const renderField = (field: BaseFilterField) => {
    const commonProps = {
      disabled: loading || field.loading,
    };

    const fieldLabel = (
      <div className="flex items-center gap-1">
        <Label htmlFor={field.key} className="text-sm font-medium">
          {field.label}
        </Label>
        {field.tooltip && <InfoTooltip content={field.tooltip} />}
      </div>
    );

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={field.key} className={cn('space-y-2', field.className)}>
            {fieldLabel}
            <Input
              id={field.key}
              type={field.type}
              placeholder={field.placeholder}
              value={values[field.key] || ''}
              onChange={(e) => handleValueChange(field.key, e.target.value)}
              min={field.min}
              max={field.max}
              step={field.step}
              {...commonProps}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className={cn('space-y-2', field.className)}>
            {fieldLabel}
            <Select 
              value={values[field.key] || undefined} 
              onValueChange={(value) => handleValueChange(field.key, value)}
              disabled={commonProps.disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.loading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  field.options?.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case 'range':
        return (
          <div key={field.key} className={cn('space-y-2', field.className)}>
            {fieldLabel}
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={values[`${field.key}Min`] || ''}
                onChange={(e) => handleValueChange(`${field.key}Min`, e.target.value)}
                min={field.min}
                max={field.max}
                step={field.step}
                {...commonProps}
              />
              <Input
                type="number"
                placeholder="Max"
                value={values[`${field.key}Max`] || ''}
                onChange={(e) => handleValueChange(`${field.key}Max`, e.target.value)}
                min={field.min}
                max={field.max}
                step={field.step}
                {...commonProps}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <CardContent className="pt-0">
      {/* Search field */}
      {showSearch && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && onApply?.()}
            />
          </div>
        </div>
      )}

      {/* Individual fields */}
      {fields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {fields.map(renderField)}
        </div>
      )}

      {/* Field groups */}
      {fieldGroups.map((group, groupIndex) => (
        <div key={groupIndex} className={cn('mb-4', group.className)}>
          {group.title && (
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              {group.title}
            </h4>
          )}
          <div 
            className={cn(
              'grid gap-4',
              group.columns ? `grid-cols-${group.columns}` : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {group.fields.map(renderField)}
          </div>
        </div>
      ))}

      {/* Active filters summary */}
      {showActiveFilters && getActiveFiltersCount() > 0 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Active filters:</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="h-auto p-1 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {getActiveFiltersSummary().map((filter, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {filter}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        {onApply && (
          <Button onClick={onApply} className="flex-1" disabled={loading}>
            Apply Filters
          </Button>
        )}
        <Button onClick={handleReset} variant="outline" disabled={loading}>
          Reset
        </Button>
      </div>
    </CardContent>
  );

  if (!isCollapsible) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">{title}</CardTitle>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
        </CardHeader>
        {content}
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-base">{title}</CardTitle>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </div>
              <EnhancedTooltip content={isOpen ? 'Collapse filters' : 'Expand filters'}>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </EnhancedTooltip>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {content}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};