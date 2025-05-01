"use client"

import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createMorph, createPipeline } from "@/form/morph/core";
import { cn } from "@/form/lib/utils";

// --- TYPES ---

export interface PaginationProps {
  totalPages: number;
  currentPage?: number;
  // If provided, this will override URL-based navigation
  onPageChange?: (page: number) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'simple';
}

export interface PaginationMorphInput {
  props: PaginationProps;
}

// --- HELPER FUNCTIONS ---

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
};

// --- PRIMITIVE COMPONENTS ---

const PaginationPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("inline-flex items-center justify-center", className)}
    {...props}
  />
));
PaginationPrimitive.displayName = "PaginationPrimitive";

const PaginationItemsPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex -space-x-px", className)}
    {...props}
  />
));
PaginationItemsPrimitive.displayName = "PaginationItemsPrimitive";

// --- MORPH DEFINITIONS ---

// Base Pagination morph - sets up container structure
const PaginationBaseMorph = createMorph<
  PaginationMorphInput,
  React.ReactElement
>("PaginationBaseMorph", ({ props }, context) => {
  return (
    <PaginationPrimitive className={props.className}>
      <PaginationItemsPrimitive>
        {/* Content will be added by subsequent morphs */}
      </PaginationItemsPrimitive>
    </PaginationPrimitive>
  );
});

// Controls morph - adds pagination controls
const PaginationControlsMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("PaginationControlsMorph", (element, context) => {
  const { props } = context as PaginationMorphInput;
  const { totalPages, variant = 'default', onPageChange } = props;
  
  // Create functional pagination component
  const PaginationControls = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = props.currentPage || Number(searchParams.get('page')) || 1;
    
    const createPageURL = (pageNumber: number | string) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', pageNumber.toString());
      return `${pathname}?${params.toString()}`;
    };
    
    const handlePageChange = (page: number) => {
      if (onPageChange) {
        onPageChange(page);
      }
    };
    
    // Generate pagination numbers based on current page and total pages
    const allPages = generatePagination(currentPage, totalPages);
    
    // Function to render pagination number
    const renderPaginationNumber = (page: number | string, index: number) => {
      let position: 'first' | 'last' | 'single' | 'middle' | undefined;
      
      if (index === 0) position = 'first';
      if (index === allPages.length - 1) position = 'last';
      if (allPages.length === 1) position = 'single';
      if (page === '...') position = 'middle';
      
      const isActive = currentPage === page;
      
      const className = cn(
        'flex h-10 w-10 items-center justify-center text-sm border',
        {
          'rounded-l-md': position === 'first' || position === 'single',
          'rounded-r-md': position === 'last' || position === 'single',
          'z-10 bg-primary border-primary text-primary-foreground': isActive,
          'hover:bg-accent': !isActive && position !== 'middle',
          'text-muted': position === 'middle',
        }
      );
      
      return isActive || position === 'middle' ? (
        <div key={`${page}-${index}`} className={className}>{page}</div>
      ) : (
        onPageChange ? (
          <button
            key={`${page}-${index}`}
            className={className}
            onClick={() => handlePageChange(Number(page))}
          >
            {page}
          </button>
        ) : (
          <Link
            key={`${page}-${index}`}
            href={createPageURL(page)}
            className={className}
          >
            {page}
          </Link>
        )
      );
    };
    
    // Function to render pagination arrow
    const renderPaginationArrow = (direction: 'left' | 'right') => {
      const isLeft = direction === 'left';
      const targetPage = isLeft ? currentPage - 1 : currentPage + 1;
      const isDisabled = isLeft ? currentPage <= 1 : currentPage >= totalPages;
      
      const className = cn(
        'flex h-10 w-10 items-center justify-center rounded-md border',
        {
          'pointer-events-none text-muted': isDisabled,
          'hover:bg-accent': !isDisabled,
          'mr-2 md:mr-4': isLeft,
          'ml-2 md:ml-4': !isLeft,
        }
      );
      
      const icon = isLeft ? (
        <ArrowLeftIcon className="w-4" />
      ) : (
        <ArrowRightIcon className="w-4" />
      );
      
      return isDisabled ? (
        <div className={className}>{icon}</div>
      ) : onPageChange ? (
        <button
          className={className}
          onClick={() => handlePageChange(targetPage)}
        >
          {icon}
        </button>
      ) : (
        <Link
          className={className}
          href={createPageURL(targetPage)}
        >
          {icon}
        </Link>
      );
    };
    
    // Render different variants
    if (variant === 'compact') {
      return (
        <>
          {renderPaginationArrow('left')}
          <div className="flex items-center justify-center px-4">
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          {renderPaginationArrow('right')}
        </>
      );
    }
    
    if (variant === 'simple') {
      return (
        <div className="flex items-center space-x-6">
          {renderPaginationArrow('left')}
          {renderPaginationArrow('right')}
        </div>
      );
    }
    
    // Default variant
    return (
      <>
        {renderPaginationArrow('left')}
        <div className="flex -space-x-px">
          {allPages.map((page, index) => renderPaginationNumber(page, index))}
        </div>
        {renderPaginationArrow('right')}
      </>
    );
  };
  
  // Replace the content of the items element
  const itemsElement = React.Children.toArray(element.props.children)[0];
  
  if (!React.isValidElement(itemsElement)) return element;
  
  return React.cloneElement(element, {
    children: React.cloneElement(
      itemsElement,
      {},
      <PaginationControls />
    )
  });
});

// Accessibility morph - adds ARIA attributes for better screen reader support
const PaginationAccessibilityMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("PaginationAccessibilityMorph", (element, context) => {
  // Add aria-label to pagination container
  return React.cloneElement(element, {
    "aria-label": "Pagination navigation",
    role: "navigation"
  });
});

// Complete pagination pipeline
const PaginationPipeline = createPipeline<PaginationMorphInput, React.ReactElement>("PaginationPipeline")
  .pipe(PaginationBaseMorph)
  .pipe(PaginationControlsMorph)
  .pipe(PaginationAccessibilityMorph)
  .build();

// --- EXPORTED COMPONENT ---

export default function Pagination(props: PaginationProps) {
  return PaginationPipeline.run({ props }, { props });
}