import React, { useState } from 'react';
import type { FormMatter, FormHandler } from '@/ui/graphics/schema/form';
import { ListShape } from '@/ui/graphics/schema/list';
import { Form } from '@/ui/graphics/form/form';
import { renderLink } from '@/ui/graphics/link/link';

export class List<T extends ListShape> extends Form<T> {
  // Implement required abstract methods
  protected async createForm(): Promise<T> {
    return this.data as T;
  }

  protected async editForm(): Promise<T> {
    return this.data as T;
  }

  // Override renderJSX for specialized list rendering
  renderJSX(shape: T, data: FormMatter, handler: FormHandler): React.ReactNode {
    // Since we need React hooks, we'll return a functional component
    return <ListRenderer list={shape} handler={handler} />;
  }
}

// Separate functional component that uses hooks
function ListRenderer({ list, handler }: { list: ListShape, handler: FormHandler }) {
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter items based on search
  const filteredItems = list.items.filter(item => {
    // Simple search implementation
    const searchable = Object.values(item.content).join(' ').toLowerCase();
    return searchable.includes(searchQuery.toLowerCase());
  });

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Determine list layout classes
  const getLayoutClasses = () => {
    const baseClass = 'divide-y divide-gray-200';

    switch (list.layout.type) {
      case 'grid':
        return `${baseClass} grid grid-cols-2 md:grid-cols-3 gap-4`;
      case 'hierarchical':
        return `${baseClass} ml-4 border-l border-gray-200`;
      case 'linear':
      default:
        return baseClass;
    }
  };

  // Handle item action
  const handleItemAction = (actionId: string, itemId: string) => {
    handler.submit(actionId, { itemId });
  };

  return (
    <div className="space-y-4">
      {/* Header with global actions */}
      {list.relations && (
        <div className="flex justify-end space-x-2">
          {list.relations.map((link, index) => (
            <span key={index}>{renderLink(link)}</span>
          ))}
        </div>
      )}

      {/* Search functionality */}
      {list.navigation?.search && (
        <div className="relative">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* List items */}
      {currentItems.length > 0 ? (
        <ul className={getLayoutClasses()}>
          {currentItems.map(item => (
            <li key={item.id} className="py-4 flex justify-between items-center">
              <div>
                {/* Render item content */}
                {Object.entries(item.content).map(([key, value]) => {
                  if (key === 'id' || typeof value === 'object') return null;
                  return (
                    <div key={key} className={key === 'name' ? 'font-medium' : 'text-sm text-gray-500'}>
                      {String(value)}
                    </div>
                  );
                })}
              </div>

              {/* Item relations/actions */}
              {item.relations && (
                <div className="flex space-x-2">
                  {item.relations.map((link, index) => (
                    <span key={index}>
                      {renderLink(link)}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4 text-gray-500">No items found</div>
      )}

      {/* Pagination */}
      {list.navigation?.pagination && totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="inline-flex space-x-1">
            {Array.from({length: totalPages}).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-1 ${
                  currentPage === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                } rounded`}
              >
                {index + 1}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
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
