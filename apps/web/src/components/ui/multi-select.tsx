'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxSelectedDisplay?: number;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  selectAllOption?: boolean;
}

/**
 * Advanced MultiSelect component with search, select all, and badge display
 */
export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyText = 'No items found',
  maxSelectedDisplay = 3,
  className,
  disabled = false,
  loading = false,
  clearable = true,
  selectAllOption = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  const selectedOptions = React.useMemo(() => 
    options.filter(option => value.includes(option.value)),
    [options, value]
  );

  const isAllSelected = React.useMemo(() => 
    filteredOptions.length > 0 && filteredOptions.every(option => 
      value.includes(option.value) || option.disabled
    ),
    [filteredOptions, value]
  );

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all filtered options
      const filteredValues = filteredOptions.map(option => option.value);
      onChange(value.filter(val => !filteredValues.includes(val)));
    } else {
      // Select all non-disabled filtered options
      const newSelections = filteredOptions
        .filter(option => !option.disabled)
        .map(option => option.value);
      const currentOthers = value.filter(val => 
        !filteredOptions.some(option => option.value === val)
      );
      onChange(Array.from(new Set([...currentOthers, ...newSelections])));
    }
  };

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(val => val !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter(val => val !== optionValue));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    
    const selectedLabels = selectedOptions.map(opt => opt.label);
    
    if (selectedLabels.length <= maxSelectedDisplay) {
      return selectedLabels.join(', ');
    }
    
    return `${selectedLabels.slice(0, maxSelectedDisplay).join(', ')} +${selectedLabels.length - maxSelectedDisplay} more`;
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] py-2"
            disabled={disabled || loading}
          >
            <span className="truncate text-left flex-1">
              {loading ? 'Loading...' : getDisplayText()}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={searchPlaceholder} 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {selectAllOption && filteredOptions.length > 0 && (
                  <CommandItem
                    onSelect={handleSelectAll}
                    className="font-medium"
                  >
                    <Checkbox
                      checked={isAllSelected}
                      className="mr-2"
                    />
                    Select All ({filteredOptions.filter(opt => !opt.disabled).length})
                  </CommandItem>
                )}
                
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className="flex items-start gap-2"
                  >
                    <Checkbox
                      checked={value.includes(option.value)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        value.includes(option.value) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.slice(0, maxSelectedDisplay).map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="text-xs flex items-center gap-1 max-w-[150px]"
            >
              <span className="truncate">{option.label}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option.value);
                  }}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </Badge>
          ))}
          
          {value.length > maxSelectedDisplay && (
            <Badge variant="outline" className="text-xs">
              +{value.length - maxSelectedDisplay} more
            </Badge>
          )}
          
          {clearable && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Simple MultiSelect for basic use cases
 */
export const SimpleMultiSelect: React.FC<Omit<MultiSelectProps, 'selectAllOption' | 'maxSelectedDisplay'>> = (props) => {
  return (
    <MultiSelect
      {...props}
      selectAllOption={false}
      maxSelectedDisplay={2}
    />
  );
};

/**
 * Advanced MultiSelect with all features enabled
 */
export const AdvancedMultiSelect: React.FC<MultiSelectProps> = (props) => {
  return (
    <MultiSelect
      {...props}
      selectAllOption={true}
      clearable={true}
    />
  );
};