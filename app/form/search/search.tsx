"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { createMorph, createPipeline } from "@/form/morph/core";
import { cn } from "@/form/lib/utils";

// --- TYPES ---

export interface SearchProps {
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'rounded';
  size?: 'sm' | 'md' | 'lg';
  paramName?: string; // URL param name, defaults to 'query'
  initialValue?: string; // Can override URL param
  onSearch?: (term: string) => void; // Optional callback for search changes
  icon?: React.ReactNode;
  showClearButton?: boolean;
  debounce?: number; // Milliseconds to debounce, 0 to disable
}

export interface SearchMorphInput {
  props: SearchProps;
}

// --- PRIMITIVE COMPONENTS ---

const SearchContainerPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex flex-1", className)}
    {...props}
  />
));
SearchContainerPrimitive.displayName = "SearchContainerPrimitive";

const SearchInputPrimitive = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "block w-full border py-2 pl-10 text-sm outline-2 placeholder:text-muted-foreground",
      "focus:outline-none focus:ring-2 focus:ring-primary",
      className
    )}
    type="search"
    {...props}
  />
));
SearchInputPrimitive.displayName = "SearchInputPrimitive";

const SearchIconPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-muted", className)}
    {...props}
  />
));
SearchIconPrimitive.displayName = "SearchIconPrimitive";

const ClearButtonPrimitive = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground",
      className
    )}
    type="button"
    {...props}
  />
));
ClearButtonPrimitive.displayName = "ClearButtonPrimitive";

// --- MORPH DEFINITIONS ---

// Base Search morph - sets up container structure
const SearchBaseMorph = createMorph<
  SearchMorphInput,
  React.ReactElement
>("SearchBaseMorph", ({ props }, context) => {
  return (
    <SearchContainerPrimitive>
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      {/* Search input will be added by subsequent morphs */}
    </SearchContainerPrimitive>
  );
});

// Core Input morph - adds the functional search input with URL integration
const SearchInputMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("SearchInputMorph", (element, context) => {
  const { props } = context as SearchMorphInput;
  const {
    placeholder = "Search...",
    paramName = "query",
    initialValue,
    onSearch,
    debounce = 0,
    showClearButton = true
  } = props;
  
  // Create the functional search component
  const SearchComponent = () => {
    // Hooks for router and URL parameters
    const searchParams = useSearchParams();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Get initial query from URL or props
    const urlQuery = searchParams.get(paramName) || '';
    const startingQuery = initialValue !== undefined ? initialValue : urlQuery;
    
    // State for controlled input
    const [query, setQuery] = useState(startingQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(startingQuery);
    
    // Debounce timer reference
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Focus management
    useEffect(() => {
      const isActive = document.activeElement === inputRef.current;
      if (inputRef.current && !isActive) {
        // Only restore focus if it was previously focused
        if (document.activeElement?.tagName === 'BODY') {
          inputRef.current.focus();
        }
      }
    }, [searchParams]);
    
    // Handle debounced URL updates
    useEffect(() => {
      // Skip if debounce is disabled
      if (debounce <= 0) return;
      
      // Clear previous timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Set new timer
      timerRef.current = setTimeout(() => {
        setDebouncedQuery(query);
      }, debounce);
      
      // Cleanup
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [query, debounce]);
    
    // Update URL when query changes (debounced or immediate)
    useEffect(() => {
      const queryToUse = debounce > 0 ? debouncedQuery : query;
      
      const params = new URLSearchParams(searchParams);
      
      if (queryToUse) {
        params.set(paramName, queryToUse);
      } else {
        params.delete(paramName);
      }
      
      // Reset to first page when searching
      params.set('page', '1');
      
      // Update URL without page reload
      router.replace(`?${params.toString()}`, { scroll: false });
      
      // Call onSearch callback if provided
      if (onSearch) {
        onSearch(queryToUse);
      }
    }, [debounce > 0 ? debouncedQuery : query, paramName, searchParams, router, onSearch]);
    
    // Handle search input changes
    const handleSearch = (term: string) => {
      setQuery(term);
      
      // If not debouncing, update immediately
      if (debounce <= 0) {
        const params = new URLSearchParams(searchParams);
        
        if (term) {
          params.set(paramName, term);
        } else {
          params.delete(paramName);
        }
        
        // Reset to first page when searching
        params.set('page', '1');
        
        router.replace(`?${params.toString()}`, { scroll: false });
        
        if (onSearch) {
          onSearch(term);
        }
      }
    };
    
    // Handle clear button click
    const handleClear = () => {
      setQuery('');
      setDebouncedQuery('');
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // Update URL and callback immediately when clearing
      const params = new URLSearchParams(searchParams);
      params.delete(paramName);
      params.set('page', '1');
      router.replace(`?${params.toString()}`, { scroll: false });
      
      if (onSearch) {
        onSearch('');
      }
    };
    
    return (
      <>
        <SearchInputPrimitive
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          id="search"
          autoComplete="off"
        />
        <SearchIconPrimitive>
          {props.icon || <MagnifyingGlassIcon className="h-[18px] w-[18px]" />}
        </SearchIconPrimitive>
        
        {showClearButton && query && (
          <ClearButtonPrimitive onClick={handleClear} aria-label="Clear search">
            <XMarkIcon className="h-4 w-4" />
          </ClearButtonPrimitive>
        )}
      </>
    );
  };
  
  // Add search component to the container
  return React.cloneElement(element, {
    children: <SearchComponent />
  });
});

// Style morph - applies styling based on variant and size
const SearchStyleMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("SearchStyleMorph", (element, context) => {
  const { props } = context as SearchMorphInput;
  const { variant = 'default', size = 'md', className = '' } = props;
  
  // Find the input element
  const children = React.Children.toArray(element.props.children);
  if (!React.isValidElement(children[0])) return element;
  
  // Get SearchComponent children
  const searchChildren = React.Children.toArray(children[0].props.children);
  
  // Find the input element
  const inputIndex = searchChildren.findIndex(
    child => React.isValidElement(child) && child.type === SearchInputPrimitive
  );
  
  if (inputIndex === -1) return element;
  
  // Get styling based on variant
  const variantClasses = {
    default: "rounded-md border border-input bg-background",
    minimal: "border-b border-input bg-transparent rounded-none px-0",
    rounded: "rounded-full border border-input bg-background"
  }[variant];
  
  // Get sizing classes
  const sizeClasses = {
    sm: "py-1 text-xs",
    md: "py-2 text-sm",
    lg: "py-3 text-base"
  }[size];
  
  // Clone the input with additional classes
  const updatedInput = React.cloneElement(
    searchChildren[inputIndex] as React.ReactElement,
    {
      className: cn(
        variantClasses,
        sizeClasses,
        variant === 'minimal' && "pl-0",
        (searchChildren[inputIndex] as React.ReactElement).props.className
      )
    }
  );
  
  // Update the icon positioning based on variant
  const iconIndex = searchChildren.findIndex(
    child => React.isValidElement(child) && child.type === SearchIconPrimitive
  );
  
  let updatedSearchChildren = [...searchChildren];
  updatedSearchChildren[inputIndex] = updatedInput;
  
  // Update icon position for minimal variant
  if (iconIndex !== -1 && variant === 'minimal') {
    const updatedIcon = React.cloneElement(
      searchChildren[iconIndex] as React.ReactElement,
      {
        className: cn("left-auto right-0", (searchChildren[iconIndex] as React.ReactElement).props.className)
      }
    );
    updatedSearchChildren[iconIndex] = updatedIcon;
  }
  
  // Update the SearchComponent with modified children
  const updatedSearchComponent = React.cloneElement(
    children[0] as React.ReactElement,
    {},
    ...updatedSearchChildren
  );
  
  // Apply container classes
  return React.cloneElement(element, {
    className: cn(
      element.props.className,
      className
    ),
    children: updatedSearchComponent
  });
});

// Complete search pipeline
const SearchPipeline = createPipeline<SearchMorphInput, React.ReactElement>("SearchPipeline")
  .pipe(SearchBaseMorph)
  .pipe(SearchInputMorph)
  .pipe(SearchStyleMorph)
  .build();

// --- EXPORTED COMPONENTS ---

export default function Search(props: SearchProps) {
  return SearchPipeline.transform({ props }, { props });
}

// Legacy export for backward compatibility
export function SimpleSearch({ placeholder }: { placeholder: string }) {
  return <Search placeholder={placeholder} />;
}