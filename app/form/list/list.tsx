import React, { useState, useMemo } from 'react';
import { createMorph, createPipeline } from '@/form/morph/core';
import { Form } from '@/form/form/form';
import type { FormMode, FormContent, FormHandler, FormData } from '@/form/schema/shape';
import { ListShape, ListItem } from '@/form/schema/list';
import { renderLink } from '@/form/link/link';
import { cn } from '@/form/lib/utils';
import { useDebounce } from 'use-debounce';

// --- PRIMITIVE COMPONENTS ---

/**
 * List primitive - foundation for all list variations
 */
const ListPrimitive = React.forwardRef<
  HTMLUListElement, 
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("list-none p-0", className)}
    {...props}
  />
));
ListPrimitive.displayName = "ListPrimitive";

/**
 * List item primitive
 */
const ListItemPrimitive = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
));
ListItemPrimitive.displayName = "ListItemPrimitive";

/**
 * Search input primitive
 */
const SearchInputPrimitive = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className="relative">
    <input
      ref={ref}
      type="search"
      className={cn(
        "w-full px-4 py-2 pr-8 border rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        className
      )}
      {...props}
    />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>
));
SearchInputPrimitive.displayName = "SearchInputPrimitive";

/**
 * Pagination control primitive
 */
const PaginationPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }
>(({ className, currentPage, totalPages, onPageChange, ...props }, ref) => (
  <div ref={ref} className={cn("flex justify-center", className)} {...props}>
    <nav aria-label="Pagination" className="inline-flex space-x-1">
      <button
        className={cn(
          "px-2 py-1 rounded-md",
          currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"
        )}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &larr;
      </button>
      
      {/* Dynamic page buttons */}
      {[...Array(totalPages)].map((_, i) => {
        // Show current page, first, last, and pages around current
        const pageNum = i + 1;
        const shouldShow = 
          pageNum === 1 || 
          pageNum === totalPages ||
          Math.abs(pageNum - currentPage) <= 1;
          
        if (!shouldShow && pageNum === 2) {
          return <span key="ellipsis-start" className="px-2 py-1">…</span>;
        }
        
        if (!shouldShow && pageNum === totalPages - 1) {
          return <span key="ellipsis-end" className="px-2 py-1">…</span>;
        }
        
        if (!shouldShow) return null;
        
        return (
          <button
            key={pageNum}
            className={cn(
              "px-3 py-1 rounded-md",
              currentPage === pageNum
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            )}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        );
      })}
      
      <button
        className={cn(
          "px-2 py-1 rounded-md",
          currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"
        )}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &rarr;
      </button>
    </nav>
  </div>
));
PaginationPrimitive.displayName = "PaginationPrimitive";

// --- MORPH DEFINITIONS ---

// Types for our morph inputs/outputs
interface ListMorphInput {
  list: ListShape;
  handler: FormHandler;
}

// Base list morph - processes list structure and creates base component
const ListBaseMorph = createMorph<
  ListMorphInput,
  React.ReactElement
>("ListBaseMorph", ({ list, handler }, context) => {
  // Use our primitive components directly here
  return (
    <div className="list-container space-y-4">
      {/* We'll add content in subsequent morphs */}
      <div className="list-content" data-list-id={list.id}></div>
    </div>
  );
});

// Actions morph - adds action links to the list
const ListActionsMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("ListActionsMorph", (element, context) => {
  const { list } = context as ListMorphInput;
  
  if (!list.relations || list.relations.length === 0) {
    return element;
  }
  
  // Create the actions element
  const actionsElement = (
    <div className="flex justify-end space-x-2 mb-4">
      {list.relations.map((link, index) => (
        <span key={index}>{renderLink(link)}</span>
      ))}
    </div>
  );
  
  // Clone the element and insert actions at the top
  return React.cloneElement(element, {
    children: [
      actionsElement,
      ...React.Children.toArray(element.props.children)
    ]
  });
});

// Search morph - adds search functionality to the list
const ListSearchMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("ListSearchMorph", (element, context) => {
  const { list } = context as ListMorphInput;
  
  if (!list.navigation?.search) {
    return element;
  }
  
  // Create functional search component
  const SearchComponent = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 300);
    
    // Store the query in the element's context for use by other morphs
    React.useEffect(() => {
      // This is where we'd update a shared context
      // For now, we'll use a data attribute as a simple mechanism
      const listContent = document.querySelector(`[data-list-id="${list.id}"]`);
      if (listContent) {
        listContent.setAttribute('data-search-query', debouncedQuery);
        
        // Dispatch a custom event that other components can listen to
        const searchEvent = new CustomEvent('list-search', { 
          detail: { query: debouncedQuery, listId: list.id }
        });
        listContent.dispatchEvent(searchEvent);
      }
    }, [debouncedQuery]);
    
    return (
      <SearchInputPrimitive
        placeholder={list.navigation.search.placeholder || "Search..."}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />
    );
  };
  
  // Clone element and add search
  const children = React.Children.toArray(element.props.children);
  
  return React.cloneElement(element, {
    children: [
      children[0], // Actions come first
      <SearchComponent key="search" />,
      ...children.slice(1)
    ]
  });
});

// Items morph - processes and displays list items
const ListItemsMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("ListItemsMorph", (element, context) => {
  const { list, handler } = context as ListMorphInput;
  
  // Create functional items component
  const ItemsComponent = () => {
    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const itemsPerPage = list.navigation?.pagination?.itemsPerPage || 10;
    
    // Listen for search events
    React.useEffect(() => {
      const listContent = document.querySelector(`[data-list-id="${list.id}"]`);
      if (!listContent) return;
      
      const handleSearch = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail.listId === list.id) {
          setSearchQuery(customEvent.detail.query);
          setCurrentPage(1); // Reset to first page on search
        }
      };
      
      listContent.addEventListener('list-search', handleSearch);
      return () => listContent.removeEventListener('list-search', handleSearch);
    }, []);
    
    // Filter items based on search
    const filteredItems = useMemo(() => {
      if (!searchQuery) return list.items;
      
      return list.items.filter(item => {
        // Search in all content properties
        const searchable = Object.values(item.content)
          .filter(value => typeof value === 'string' || typeof value === 'number')
          .join(' ')
          .toLowerCase();
        return searchable.includes(searchQuery.toLowerCase());
      });
    }, [list.items, searchQuery]);
    
    // Paginate items
    const currentItems = useMemo(() => {
      if (!list.navigation?.pagination) return filteredItems;
      
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      return filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredItems, currentPage, itemsPerPage]);
    
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    
    // Get css classes for list layout
    const getLayoutClasses = () => {
      switch (list.layout?.type) {
        case 'grid':
          return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
        case 'hierarchical':
          return "pl-4 border-l border-gray-200 space-y-4";
        case 'card':
          return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
        case 'table':
          return "table w-full";
        case 'linear':
        default:
          return "divide-y divide-gray-200";
      }
    };
    
    // Get item classes based on layout
    const getItemClasses = (item: ListItem) => {
      const baseClasses = "py-4";
      
      switch (list.layout?.type) {
        case 'grid':
          return cn(baseClasses, "flex flex-col h-full");
        case 'card':
          return cn(baseClasses, "bg-white rounded-lg shadow p-4 flex flex-col h-full");
        case 'table':
          return "table-row";
        default:
          return cn(baseClasses, "flex justify-between items-center");
      }
    };
    
    // Handle item action
    const handleItemAction = (actionId: string, itemId: string) => {
      handler.submit(actionId, { itemId });
    };
    
    return (
      <>
        {currentItems.length > 0 ? (
          <ListPrimitive className={getLayoutClasses()}>
            {currentItems.map(item => (
              <ListItemPrimitive key={item.id} className={getItemClasses(item)}>
                <div className={list.layout?.type === 'table' ? "table-cell py-2" : "flex-grow"}>
                  {/* Render item content */}
                  {Object.entries(item.content).map(([key, value]) => {
                    if (key === 'id' || typeof value === 'object') return null;
                    
                    // Different styling for key fields
                    const isKeyField = key === 'name' || key === 'title';
                    
                    return (
                      <div 
                        key={key} 
                        className={cn(
                          isKeyField ? "font-medium text-gray-900" : "text-sm text-gray-500",
                          list.layout?.type === 'table' ? "table-cell px-4" : ""
                        )}
                      >
                        {String(value)}
                      </div>
                    );
                  })}
                </div>

                {/* Item relations/actions */}
                {item.relations && (
                  <div className={cn(
                    "flex space-x-2", 
                    list.layout?.type === 'table' ? "table-cell" : "flex-shrink-0"
                  )}>
                    {item.relations.map((link, index) => (
                      <span key={index}>
                        {renderLink({
                          ...link,
                          // Override the handler to include item context
                          layout: {
                            ...link.layout,
                            // Add item context to any button clicks
                            onClick: () => handleItemAction(link.layout.id, item.id)
                          }
                        })}
                      </span>
                    ))}
                  </div>
                )}
              </ListItemPrimitive>
            ))}
          </ListPrimitive>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
            No items found
          </div>
        )}
        
        {/* Pagination */}
        {list.navigation?.pagination && totalPages > 1 && (
          <PaginationPrimitive
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-4"
          />
        )}
      </>
    );
  };
  
  // Find the content element and replace it
  const listContentIndex = React.Children.toArray(element.props.children)
    .findIndex((child: any) => 
      child?.props?.className === 'list-content'
    );
  
  if (listContentIndex === -1) return element;
  
  const children = React.Children.toArray(element.props.children);
  
  return React.cloneElement(element, {
    children: [
      ...children.slice(0, listContentIndex),
      <div key="list-content" className="list-content" data-list-id={list.id}>
        <ItemsComponent />
      </div>,
      ...children.slice(listContentIndex + 1)
    ]
  });
});

// List pagination morph - adds pagination to lists
const ListPaginationMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("ListPaginationMorph", (element, context) => {
  const { list, handler } = context as ListMorphInput;
  
  // Skip if pagination not needed
  if (!list.navigation?.pagination) return element;
  
  // PaginationComponent - manages pagination state
  const PaginationComponent = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalItems = list.items.length;
    const itemsPerPage = list.navigation?.pagination?.itemsPerPage || 10;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    // Handle page changes
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
      
      // Notify the list content about page change
      const listContent = document.querySelector(`[data-list-id="${list.id}"]`);
      if (listContent) {
        const pageEvent = new CustomEvent('list-page-change', { 
          detail: { page, listId: list.id }
        });
        listContent.dispatchEvent(pageEvent);
      }
      
      // Call handler if provided
      if (handler.onPageChange) {
        handler.onPageChange(page);
      }
    };
    
    return (
      <div className="mt-6">
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          variant={list.navigation.pagination.variant || 'default'}
        />
      </div>
    );
  };
  
  // Add pagination after the list content
  return React.cloneElement(element, {
    children: [
      ...React.Children.toArray(element.props.children),
      <PaginationComponent key="pagination" />
    ]
  });
});

// Update our list pipeline
const ListPipeline = createPipeline<ListMorphInput, React.ReactElement>("ListPipeline")
  .pipe(ListBaseMorph)
  .pipe(ListActionsMorph)
  .pipe(ListSearchMorph)
  .pipe(ListItemsMorph)
  .pipe(ListPaginationMorph)  // Add pagination morph
  .build();

// --- FORM CLASS IMPLEMENTATION ---

export class List<T extends ListShape> extends Form<T> {
  constructor(protected readonly data: T) {
    super(data);
  }
  
  // Implement required Form abstract methods
  protected async createForm(): Promise<T> {
    return this.data;
  }

  protected async editForm(): Promise<T> {
    return this.data;
  }

  // Custom render method for lists using morphology
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    // If not rendering JSX, return simple representation
    if (content !== "jsx") {
      return `List: ${this.data.items.length} items`;
    }

    // Use our morphology pipeline
    return ListPipeline.transform({
      list: this.data,
      handler
    }, {
      list: this.data,
      handler
    });
  }
}

// React component wrapper for convenient JSX usage
export default function ListForm(props: ListShape) {
  const listInstance = new List(props);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderList = async () => {
      const renderedContent = await listInstance.render('create', 'jsx', {
        submit: (actionId, data) => {
          console.log('List action:', actionId, data);
          // Handle list actions here
        }
      });
      setContent(renderedContent);
    };
    renderList();
  }, [listInstance, props]);

  return <>{content}</>;
}