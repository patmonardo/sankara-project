import React from 'react';
import NextLink from 'next/link';
import { Form } from '@/ui/graphics/form/form';
import type { FormMode, FormContent, FormHandler } from '@/ui/graphics/schema/form';
import { LinkShape } from '@/ui/graphics/schema/link';
import {
  PencilIcon, TrashIcon, PlusIcon, ArrowTopRightOnSquareIcon,
  ArrowRightIcon, ArrowLeftIcon, InformationCircleIcon,
  DocumentIcon, UserIcon, HomeIcon, CogIcon
} from '@heroicons/react/24/outline';

// Expanded icon map
const ICON_MAP: Record<string, React.ReactNode> = {
  'pencil': <PencilIcon className="w-5 h-5" />,
  'trash': <TrashIcon className="w-5 h-5" />,
  'plus': <PlusIcon className="w-5 h-5" />,
 // 'external': <ArrowTopRightOnSquareIcon className="w-5 h-5" />,
  'arrowRight': <ArrowRightIcon className="w-5 h-5" />,
  'arrowLeft': <ArrowLeftIcon className="w-5 h-5" />,
  'info': <InformationCircleIcon className="w-5 h-5" />,
  'document': <DocumentIcon className="w-5 h-5" />,
  'user': <UserIcon className="w-5 h-5" />,
  'home': <HomeIcon className="w-5 h-5" />,
  'settings': <CogIcon className="w-5 h-5" />,
  // Add more icons as needed
};

// Link class consistent with your Form architecture
export class Link<T extends LinkShape> extends Form<T> {
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

  // Custom render method for links
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    // If not rendering JSX, return simple representation
    if (content !== "jsx") {
      return this.data.layout.label;
    }

    // Extract link-specific props
    const {
      label,
      href,
      icon,
      relation = 'navigate',
      variant = 'primary',
      size = 'medium',
      disabled = false,
      className = '',
      target,
    } = this.data.layout;

    // Build class names based on properties
    const getStyleClasses = () => {
      const baseClasses = 'inline-flex items-center';
      const sizeClasses = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
      }[size] || 'text-base';

      // Different styles based on variant
      const variantClasses = {
        primary: 'text-blue-600 hover:text-blue-800',
        secondary: 'text-gray-600 hover:text-gray-800',
        ghost: 'text-gray-500 hover:text-gray-700',
        danger: 'text-red-600 hover:text-red-800',
        button: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700',
        buttonSecondary: 'px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300',
        buttonGhost: 'px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50',
        buttonDanger: 'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700',
      }[variant] || 'text-blue-600 hover:underline';

      // Disabled state
      const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

      return [baseClasses, sizeClasses, variantClasses, disabledClasses, className]
        .filter(Boolean)
        .join(' ');
    };

    // Determine icon to use
    const iconElement = icon ? ICON_MAP[icon] || null : null;

    // Handle action links (that trigger functions rather than navigate)
    if (this.data.type === 'action' || !href) {
      return (
        <button
          onClick={disabled ? undefined : () => handler.submit(this.data, {})}
          disabled={disabled}
          className={getStyleClasses()}
          title={label}
        >
          {iconElement && <span className="mr-2">{iconElement}</span>}
          {label}
        </button>
      );
    }

    // Handle external links
    const isExternal = href && (href.startsWith('http') || target === '_blank');

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={getStyleClasses()}
          title={label}
        >
          {iconElement && <span className="mr-2">{iconElement}</span>}
          {label}
          <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
        </a>
      );
    }

    // Handle internal navigation
    return (
      <NextLink
        href={href}
        className={getStyleClasses()}
        title={label}
      >
        {iconElement && <span className="mr-2">{iconElement}</span>}
        {label}
      </NextLink>
    );
  }
}

// React component wrapper for convenient JSX usage
export default function LinkForm(props: LinkShape) {
  const linkInstance = new Link(props);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderLink = async () => {
      const renderedContent = await linkInstance.render("create", "jsx", {
        submit: (actionId, data) => {
          console.log('Link action:', actionId, data);
          // Default handler for link actions
        }
      });
      setContent(renderedContent);
    };
    renderLink();
  }, [linkInstance, props]);

  return <>{content}</>;
}

// Simplified rendering function for use inside other components
export function renderLink(link: LinkShape, onAction?: (actionId: string) => void): React.ReactNode {
  const linkInstance = new Link(link);

  // Create a handler that forwards to the provided onAction function
  const handler: FormHandler = {
    submit: (actionId, _) => {
      if (onAction) {
       // onAction(actionId);
      }
    }
  };

  // We can't do async rendering in a synchronous function, so we'll use a basic approach
  if (link.type === 'action' || !link.layout.href) {
    return (
      <button
        onClick={() => handler.submit(link.layout.id, {})}
        disabled={link.layout.disabled}
        className={`inline-flex items-center ${getQuickStyleForLink(link)}`}
        title={link.layout.label}
      >
        {link.layout.icon && ICON_MAP[link.layout.icon] && (
          <span className="mr-2">{ICON_MAP[link.layout.icon]}</span>
        )}
        {link.layout.label}
      </button>
    );
  }

  const isExternal = link.layout.href &&
    (link.layout.href.startsWith('http') || link.layout.target === '_blank');

  if (isExternal) {
    return (
      <a
        href={link.layout.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center ${getQuickStyleForLink(link)}`}
        title={link.layout.label}
      >
        {link.layout.icon && ICON_MAP[link.layout.icon] && (
          <span className="mr-2">{ICON_MAP[link.layout.icon]}</span>
        )}
        {link.layout.label}
        <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
      </a>
    );
  }

  return (
    <NextLink
      href={link.layout.href}
      className={`inline-flex items-center ${getQuickStyleForLink(link)}`}
      title={link.layout.label}
    >
      {link.layout.icon && ICON_MAP[link.layout.icon] && (
        <span className="mr-2">{ICON_MAP[link.layout.icon]}</span>
      )}
      {link.layout.label}
    </NextLink>
  );
}

// Helper function for quick styling in the renderLink function
function getQuickStyleForLink(link: LinkShape): string {
  const { variant = 'primary', disabled = false, relation } = link.layout;

  // Start with relation-based styling
  let style = '';
  switch (relation) {
    case 'action':
      style = 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500';
      break;
    case 'navigate':
      style = 'text-blue-600 hover:underline';
      break;
    case 'reference':
      style = 'text-gray-600 hover:text-gray-900';
      break;
    default:
      style = 'text-blue-600 hover:underline';
  }

  // Apply variant styling - this would override relation styling
  switch (variant) {
    case 'primary':
      style = 'text-blue-600 hover:text-blue-800';
      break;
    case 'secondary':
      style = 'text-gray-600 hover:text-gray-800';
      break;
    case 'danger':
      style = 'text-red-600 hover:text-red-800';
      break;
    case 'button':
      style = 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700';
      break;
    case 'buttonSecondary':
      style = 'px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300';
      break;
    case 'buttonDanger':
      style = 'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700';
      break;
  }

  // Add disabled styling if needed
  if (disabled) {
    style += ' opacity-50 cursor-not-allowed';
  }

  return style;
}
