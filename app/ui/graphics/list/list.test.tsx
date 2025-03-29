import { describe, it, expect, vi } from 'vitest';
import { renderList } from './render';
import { List } from '@/ui/graphics/schema/list';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock renderLink function
vi.mock('@/ui/graphics/links/link', () => ({
  renderLink: ({ label, href }: any) => (
    <a href={href} data-testid={`link-${label.replace(/\s+/g, '-').toLowerCase()}`}>
      {label}
    </a>
  )
}));

describe('renderList', () => {
  // Test fixture: complete List with all features
  const testItems = [
    {
      id: '1',
      content: { name: 'Item 1', description: 'First item', id: '1' },
      relations: [
        { label: 'Edit', href: '/edit/1', relation: 'action' },
        { label: 'Delete', href: '/delete/1', relation: 'action' }
      ]
    },
    {
      id: '2',
      content: { name: 'Item 2', description: 'Second item', id: '2' },
      relations: [
        { label: 'Edit', href: '/edit/2', relation: 'action' },
        { label: 'Delete', href: '/delete/2', relation: 'action' }
      ]
    },
    {
      id: '3',
      content: { name: 'Item 3', description: 'Third item', id: '3' },
      relations: [
        { label: 'Edit', href: '/edit/3', relation: 'action' },
        { label: 'Delete', href: '/delete/3', relation: 'action' }
      ]
    },
    {
      id: '4',
      content: { name: 'Item 4', description: 'Fourth item', id: '4' },
      relations: [
        { label: 'Edit', href: '/edit/4', relation: 'action' },
        { label: 'Delete', href: '/delete/4', relation: 'action' }
      ]
    },
    {
      id: '5',
      content: { name: 'Item 5', description: 'Fifth item', id: '5' },
      relations: [
        { label: 'Edit', href: '/edit/5', relation: 'action' },
        { label: 'Delete', href: '/delete/5', relation: 'action' }
      ]
    },
    {
      id: '6',
      content: { name: 'Item 6', description: 'Sixth item', id: '6' },
      relations: [
        { label: 'Edit', href: '/edit/6', relation: 'action' },
        { label: 'Delete', href: '/delete/6', relation: 'action' }
      ]
    },
    {
      id: '7',
      content: { name: 'Item 7', description: 'Seventh item', id: '7' },
      relations: [
        { label: 'Edit', href: '/edit/7', relation: 'action' },
        { label: 'Delete', href: '/delete/7', relation: 'action' }
      ]
    },
    {
      id: '8',
      content: { name: 'Item 8', description: 'Eigth item', id: '8' },
      relations: [
        { label: 'Edit', href: '/edit/8', relation: 'action' },
        { label: 'Delete', href: '/delete/8', relation: 'action' }
      ]
    },
    {
      id: '9',
      content: { name: 'Item 9', description: 'Nineth item', id: '9' },
      relations: [
        { label: 'Edit', href: '/edit/9', relation: 'action' },
        { label: 'Delete', href: '/delete/9', relation: 'action' }
      ]
    },
    {
      id: '10',
      content: { name: 'Item 10', description: 'Tenth item', id: '10' },
      relations: [
        { label: 'Edit', href: '/edit/10', relation: 'action' },
        { label: 'Delete', href: '/delete/10', relation: 'action' }
      ]
    },
    {
      id: '11',
      content: { name: 'Item 11', description: 'Eleventh Item', id: '11' },
      relations: [
        { label: 'Edit', href: '/edit/11', relation: 'action' },
        { label: 'Delete', href: '/delete/11', relation: 'action' }
      ]
    },
    {
      id: '12',
      content: { name: 'Item 12', description: 'Twelth item', id: '12' },
      relations: [
        { label: 'Edit', href: '/edit/12', relation: 'action' },
        { label: 'Delete', href: '/delete/12', relation: 'action' }
      ]
    }
  ];

  const fullList: List = {
    items: testItems as any,
    layout: { type: 'linear' },
    navigation: { search: true, pagination: true },
    relations: [{ label: 'Add Item', href: '/add', relation: 'action' }]
  };

  it('should render the complete list structure', () => {
    render(<>{renderList(fullList)}</>);

    // Test global actions
    expect(screen.getByTestId('link-add-item')).toBeInTheDocument();

    // Test search functionality
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();

    // Test items rendering (first page only)
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 10')).toBeInTheDocument();

    // Test pagination
    expect(screen.getByText('1')).toBeInTheDocument(); // First page
    expect(screen.getByText('2')).toBeInTheDocument(); // Second page
  });

  it('should filter items based on search query', async () => {
    render(<>{renderList(fullList)}</>);

    // Get search input
    const searchInput = screen.getByPlaceholderText('Search...');

    // Search for specific item
    fireEvent.change(searchInput, { target: { value: 'Item 2' } });

    // Check filtered results
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('should paginate correctly', () => {
    render(<>{renderList(fullList)}</>);

    // Check initial page
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Item 11')).not.toBeInTheDocument();

    // Click second page
    fireEvent.click(screen.getByText('2'));

    // Check items on second page
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    expect(screen.getByText('Item 11')).toBeInTheDocument();
  });

  it('should render empty state when no items match filter', () => {
    render(<>{renderList(fullList)}</>);

    // Search for non-existent item
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'nonexistent item' }
    });

    // Check empty state
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('should respect different layout types', () => {
    // Test grid layout
    const gridList: List = {
      ...fullList,
      layout: { type: 'grid' }
    };

    const { unmount } = render(<>{renderList(gridList)}</>);
    expect(document.querySelector('.grid')).toBeInTheDocument();
    unmount();

    // Test hierarchical layout
    const hierarchicalList: List = {
      ...fullList,
      layout: { type: 'hierarchical' }
    };

    render(<>{renderList(hierarchicalList)}</>);
    expect(document.querySelector('.border-l')).toBeInTheDocument();
  });
});
