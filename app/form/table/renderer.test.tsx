import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableRenderer } from './renderer';
import { Table } from './table';
import { TableShape } from '../schema/table';
import { ButtonShape } from '../schema/button';

// Type the mocks properly
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) =>
    <a href={href}>{children}</a>
}));

// Add this mock
vi.mock('@/form/buttons/renderer', () => ({
  ButtonRenderer: ({ shape }: { shape: ButtonShape }) =>
    <button data-testid="mock-button">{shape.label}</button>
}));

vi.mock('@/form/search/search', () => ({
  default: ({ placeholder }: { placeholder: string }) =>
    <div data-testid="search">{placeholder}</div>
}));

vi.mock('@/form/links/pagination', () => ({
  default: ({ totalPages }: { totalPages: number }) =>
    <div data-testid="pagination">Pages: {totalPages}</div>
}));

// Sample data for testing
const mockData = [
  { id: '1', name: 'Test Item', value: 100 }
];

// Create a test table class
class TestTable extends Table<TableShape> {
  constructor(data: any[]) {
    super(data);
  }

  getTableShape(): TableShape {
    return {
      columns: [
        { key: 'name', label: 'Name', sortable: true, filterable: true },
        { key: 'value', label: 'Value', sortable: true, filterable: true },
      ],
      layout: {
        title: 'Test Table',
        responsive: true,
        searchable: true,
        paginated: true,
        striped: false,
        hoverable: true,
        addButton: {
          label: 'Add New',
          href: '/create'
        }
      },
      state: {
        status: 'idle',
        page: 1,
        totalPages: 3
      },
      actions: [
        {
          id: 'edit-1',
          type: 'edit',
          variant: 'primary',
          label: 'Edit',
          icon: 'pencil'
        },
        {
          id: 'delete-1',
          type: 'delete',
          variant: 'secondary',
          label: 'Delete',
          icon: 'trash'
        }
      ]
    };
  }
}

describe('TableRenderer', () => {
  let table: TestTable;
  let shape: TableShape;

  beforeEach(() => {
    table = new TestTable(mockData);
    shape = table.getTableShape();
  });

  it('renders table title', () => {
    render(<TableRenderer table={table} shape={shape} data={mockData} />);
    expect(screen.getByText('Test Table')).toBeInTheDocument();
  });

  it('renders add button when configured', () => {
    render(<TableRenderer table={table} shape={shape} data={mockData} />);
    const addButton = screen.getByText('Add New');
    expect(addButton).toBeInTheDocument();
    expect(addButton.closest('a')).toHaveAttribute('href', '/create');
  });

  it('renders search when searchable is true', () => {
    render(<TableRenderer table={table} shape={shape} data={mockData} />);
    expect(screen.getByTestId('search')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<TableRenderer table={table} shape={shape} data={mockData} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<TableRenderer table={table} shape={shape} data={mockData} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<TableRenderer table={table} shape={shape} data={mockData} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders pagination when paginated is true and totalPages > 1', () => {
    render(<TableRenderer table={table} shape={shape} data={mockData} />);
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByText('Pages: 3')).toBeInTheDocument();
  });

  it('renders empty state when no data is provided', () => {
    render(<TableRenderer table={table} shape={shape} data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});
