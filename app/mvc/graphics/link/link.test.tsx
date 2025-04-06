import { describe, it, expect, vi } from 'vitest';
import { renderLink } from './link';
import { Link } from '@/ui/graphics/schema/link';
import { render, screen } from '@testing-library/react';

// Mock Next/Link to avoid router context issues in tests
vi.mock('next/link', () => ({
  default: ({ href, className, children }: any) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  ),
}));

// Mock HeroIcons
vi.mock('@heroicons/react/24/outline', () => ({
  PencilIcon: () => <svg data-testid="pencil-icon" />,
  TrashIcon: () => <svg data-testid="trash-icon" />,
  PlusIcon: () => <svg data-testid="plus-icon" />,
}));

describe('renderLink', () => {
  it('should render a link with proper styling based on relation type', () => {
    // Test different relation types
    const relations = ['action', 'navigate', 'reference', undefined];

    for (const relation of relations) {
      const link: Link = {
        label: `${relation || 'default'} Link`,
        href: '/test-link',
        relation: relation as any,
      };

      // Render the link to DOM
      const { container, unmount } = render(<>{renderLink(link)}</>);

      // Get the anchor element
      const anchor = screen.getByTestId('next-link');

      // Check that the link has the correct href
      expect(anchor).toHaveAttribute('href', '/test-link');

      // Check that it has the correct label
      expect(anchor).toHaveTextContent(`${relation || 'default'} Link`);

      // Check styling based on relation
      switch (relation) {
        case 'action':
          expect(anchor.className).toContain('bg-blue-600');
          expect(anchor.className).toContain('text-white');
          break;
        case 'navigate':
          expect(anchor.className).toContain('text-blue-600');
          expect(anchor.className).toContain('hover:underline');
          break;
        case 'reference':
          expect(anchor.className).toContain('text-gray-600');
          break;
        default:
          expect(anchor.className).toContain('text-blue-600');
          break;
      }

      unmount();
    }
  });

  it('should include the icon when specified', () => {
    const iconTypes = ['pencil', 'trash', 'plus'];

    for (const iconType of iconTypes) {
      const link: Link = {
        label: 'Icon Link',
        href: '/icon-link',
        icon: iconType,
      };

      const { unmount } = render(<>{renderLink(link)}</>);

      // Check that the icon is present
      expect(screen.getByTestId(`${iconType}-icon`)).toBeInTheDocument();

      unmount();
    }
  });

  it('should not include icon when not specified', () => {
    const link: Link = {
      label: 'No Icon Link',
      href: '/no-icon',
    };

    render(<>{renderLink(link)}</>);

    // Should not have any icons
    expect(screen.queryByTestId(/icon$/)).not.toBeInTheDocument();
  });
});
