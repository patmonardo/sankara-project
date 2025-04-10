//@/form/search/search.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('query') || '';
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);

  // Restore focus when the component re-renders
  useEffect(() => {
    const isActive = document.activeElement === inputRef.current;
    if (inputRef.current && !isActive) {
      // Only restore focus if it was previously focused
      if (document.activeElement?.tagName === 'BODY') {
        inputRef.current.focus();
      }
    }
  }, [searchParams]);

  const handleSearch = (term: string) => {
    setQuery(term);
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }

    // Reset to first page when searching
    params.set('page', '1');

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        ref={inputRef}
        className="block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        id="search"
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
    </div>
  );
}
