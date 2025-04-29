import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createMorph, createPipeline } from '@/form/morph/core';
import { cn } from '@/form/lib/utils';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

// --- TYPES ---

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
  children?: BreadcrumbItem[]; // For dropdown items
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  maxItems?: number; // Maximum items to show before collapsing
  variant?: 'default' | 'expanded' | 'minimal';
  className?: string;
  separatorIcon?: React.ReactNode;
  homeIcon?: React.ReactNode;
}

export interface BreadcrumbMorphInput {
  props: BreadcrumbsProps;
}

// --- PRIMITIVE COMPONENTS ---

/**
 * Breadcrumb container primitive
 */
const BreadcrumbPrimitive = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="Breadcrumb"
    className={cn("mb-4", className)}
    {...props}
  />
));
BreadcrumbPrimitive.displayName = "BreadcrumbPrimitive";

/**
 * Breadcrumb list primitive
 */
const BreadcrumbListPrimitive = React.forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center space-x-1 md:space-x-2 text-sm sm:text-base",
      className
    )}
    {...props}
  />
));
BreadcrumbListPrimitive.displayName = "BreadcrumbListPrimitive";

/**
 * Breadcrumb separator primitive
 */
const BreadcrumbSeparatorPrimitive = ({ 
  children, 
  className 
}: { 
  children?: React.ReactNode,
  className?: string 
}) => (
  <li className={cn("flex items-center text-gray-400", className)} aria-hidden="true">
    {children || <ChevronRightIcon className="h-4 w-4" />}
  </li>
);
BreadcrumbSeparatorPrimitive.displayName = "BreadcrumbSeparatorPrimitive";

/**
 * Breadcrumb item primitive
 */
const BreadcrumbItemPrimitive = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement> & {
    isCurrent?: boolean;
    isCollapsible?: boolean;
  }
>(({ className, isCurrent, isCollapsible, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(
      "inline-flex items-center",
      isCollapsible && "breadcrumb-collapsible",
      className
    )}
    aria-current={isCurrent ? "page" : undefined}
    {...props}
  />
));
BreadcrumbItemPrimitive.displayName = "BreadcrumbItemPrimitive";

/**
 * Breadcrumb dropdown primitive
 */
const BreadcrumbDropdownPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean;
    items: BreadcrumbItem[];
    onToggle: () => void;
  }
>(({ className, isOpen, items, onToggle, ...props }, ref) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) && 
        isOpen
      ) {
        onToggle();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);
  
  return (
    <div ref={dropdownRef} className={cn("relative", className)} {...props}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex items-center px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
      >
        <span className="mx-1">...</span>
        <ChevronDownIcon className={cn(
          "h-4 w-4 transition-transform duration-200",
          isOpen ? "transform rotate-180" : ""
        )} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 py-1 bg-white rounded-md shadow-lg border border-gray-200 z-10 min-w-[150px]">
          {items.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <div className="flex items-center">
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});
BreadcrumbDropdownPrimitive.displayName = "BreadcrumbDropdownPrimitive";

// --- MORPH DEFINITIONS ---

// Base breadcrumb morph - sets up the container structure
const BreadcrumbBaseMorph = createMorph<
  BreadcrumbMorphInput,
  React.ReactElement
>("BreadcrumbBaseMorph", ({ props }, context) => {
  return (
    <BreadcrumbPrimitive className={props.className}>
      <BreadcrumbListPrimitive>
        {/* Content will be added by subsequent morphs */}
      </BreadcrumbListPrimitive>
    </BreadcrumbPrimitive>
  );
});

// Items morph - processes and adds breadcrumb items
const BreadcrumbItemsMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("BreadcrumbItemsMorph", (element, context) => {
  const { props } = context as BreadcrumbMorphInput;
  const { items, maxItems = 4, variant = 'default', separatorIcon, homeIcon } = props;
  
  // Responsive breadcrumb component with dropdown for middle items when needed
  const BreadcrumbsContent = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const pathname = usePathname();
    
    // Determine if we need to collapse items
    const needsCollapsing = items.length > maxItems && variant !== 'expanded';
    
    // Calculate which items to show directly and which to collapse
    let visibleItems: BreadcrumbItem[] = items;
    let collapsedItems: BreadcrumbItem[] = [];
    
    if (needsCollapsing) {
      // Always show first and last item, collapse middle ones
      const firstItem = items[0];
      const lastItems = items.slice(-2); // Get last two items
      
      // Items to collapse (skip first and last two)
      collapsedItems = items.slice(1, -2);
      
      // Visible items are first + last two
      visibleItems = [firstItem, ...lastItems];
    }
    
    return (
      <>
        {/* First item (often home) */}
        {visibleItems.length > 0 && (
          <BreadcrumbItemPrimitive key={visibleItems[0].href}>
            <Link
              href={visibleItems[0].href}
              className={cn(
                "flex items-center text-gray-500 hover:text-gray-700",
                visibleItems[0].active && "text-gray-900 font-medium"
              )}
            >
              {visibleItems[0].icon || homeIcon || (
                <svg 
                  className="h-4 w-4" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              )}
              {variant !== 'minimal' && (
                <span className="ml-1">{visibleItems[0].label}</span>
              )}
            </Link>
          </BreadcrumbItemPrimitive>
        )}
        
        {/* Separator */}
        {visibleItems.length > 0 && (
          <BreadcrumbSeparatorPrimitive>
            {separatorIcon}
          </BreadcrumbSeparatorPrimitive>
        )}
        
        {/* Collapsed items dropdown */}
        {needsCollapsing && collapsedItems.length > 0 && (
          <>
            <BreadcrumbItemPrimitive isCollapsible>
              <BreadcrumbDropdownPrimitive
                isOpen={dropdownOpen}
                items={collapsedItems}
                onToggle={() => setDropdownOpen(!dropdownOpen)}
              />
            </BreadcrumbItemPrimitive>
            
            <BreadcrumbSeparatorPrimitive>
              {separatorIcon}
            </BreadcrumbSeparatorPrimitive>
          </>
        )}
        
        {/* Remaining visible items */}
        {visibleItems.slice(1).map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbItemPrimitive isCurrent={item.active || pathname === item.href}>
              <Link
                href={item.href}
                className={cn(
                  "text-gray-500 hover:text-gray-700",
                  (item.active || pathname === item.href) && "text-gray-900 font-medium"
                )}
                aria-current={item.active ? 'page' : undefined}
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </Link>
              
              {/* Dropdown for items with children */}
              {item.children && item.children.length > 0 && (
                <BreadcrumbDropdownPrimitive
                  items={item.children}
                  isOpen={false}
                  onToggle={() => {}}
                  className="ml-1"
                />
              )}
            </BreadcrumbItemPrimitive>
            
            {/* Add separator if not the last item */}
            {index < visibleItems.slice(1).length - 1 && (
              <BreadcrumbSeparatorPrimitive>
                {separatorIcon}
              </BreadcrumbSeparatorPrimitive>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };
  
  // Clone element and replace the children with our content
  return React.cloneElement(element, {
    children: React.cloneElement(
      React.Children.only(element.props.children),
      {},
      <BreadcrumbsContent />
    )
  });
});

// Interactivity morph - adds animations and hover effects
const BreadcrumbInteractivityMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("BreadcrumbInteractivityMorph", (element, context) => {
  // This would add animation classes, hover effects, etc.
  // For now, we'll just return the element unchanged
  return element;
});

// Complete breadcrumbs pipeline
const BreadcrumbsPipeline = createPipeline<BreadcrumbMorphInput, React.ReactElement>("BreadcrumbsPipeline")
  .pipe(BreadcrumbBaseMorph)
  .pipe(BreadcrumbItemsMorph)
  .pipe(BreadcrumbInteractivityMorph)
  .build();

// --- EXPORTED COMPONENT ---

export default function Breadcrumbs(props: BreadcrumbsProps) {
  return BreadcrumbsPipeline.transform({ props }, { props });
}

// Helper component for creating a custom breadcrumb separator
export function BreadcrumbSeparator({ children }: { children?: React.ReactNode }) {
  return <BreadcrumbSeparatorPrimitive>{children}</BreadcrumbSeparatorPrimitive>;
}