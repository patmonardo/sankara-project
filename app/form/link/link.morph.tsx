import * as React from 'react';
import NextLink from 'next/link';
import { createMorph, createPipeline } from '@/form/morph/core';
import { LinkShape } from '@/form/schema/link';
import { FormHandler } from '@/form/schema/form';
import { cn } from '@/form/lib/utils';

// Import Lucide icons (modern alternative to heroicons)
import { 
  Pencil, Trash, Plus, ArrowUpRight,
  ArrowRight, ArrowLeft, Info,
  File, User, Home, Settings
} from 'lucide-react';

// 1. Define the morph input/output types
export interface LinkMorphInput {
  link: LinkShape;
  handler?: FormHandler;
}

export type LinkMorphOutput = React.ReactElement;

// 2. Create the icon registry with Lucide icons
const ICON_REGISTRY: Record<string, React.ReactNode> = {
  'pencil': <Pencil className="w-4 h-4" />,
  'trash': <Trash className="w-4 h-4" />,
  'plus': <Plus className="w-4 h-4" />,
  'external': <ArrowUpRight className="w-4 h-4" />,
  'arrowRight': <ArrowRight className="w-4 h-4" />,
  'arrowLeft': <ArrowLeft className="w-4 h-4" />,
  'info': <Info className="w-4 h-4" />,
  'document': <File className="w-4 h-4" />,
  'user': <User className="w-4 h-4" />,
  'home': <Home className="w-4 h-4" />,
  'settings': <Settings className="w-4 h-4" />,
};

// 3. Link Primitive Morph - Handles core link behavior
export const LinkPrimitiveMorph = createMorph<LinkMorphInput, LinkMorphOutput>(
  "LinkPrimitiveMorph",
  ({ link, handler }, context) => {
    const { href, label, target, disabled = false } = link.layout;
    
    // Action link (button)
    if (link.type === 'action' || !href) {
      return (
        <button
          onClick={disabled ? undefined : () => handler?.submit(link, {})}
          disabled={disabled}
          aria-label={label}
          type="button"
        >
          {label}
        </button>
      );
    }
    
    // External link
    const isExternal = href && (href.startsWith('http') || target === '_blank');
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
        >
          {label}
        </a>
      );
    }
    
    // Internal link
    return (
      <NextLink
        href={href}
        aria-label={label}
      >
        {label}
      </NextLink>
    );
  }
);

// 4. Link Variant Morph - Applies styling
export const LinkVariantMorph = createMorph<LinkMorphOutput, LinkMorphOutput>(
  "LinkVariantMorph",
  (element, context) => {
    const { link } = context as LinkMorphInput;
    const { variant = 'primary', size = 'medium', disabled = false, className = '' } = link.layout;
    
    // Base classes
    const baseClasses = 'inline-flex items-center gap-2 transition-colors';
    
    // Size classes
    const sizeClasses = {
      'small': 'text-sm py-1 px-2',
      'medium': 'text-base py-1.5 px-3',
      'large': 'text-lg py-2 px-4',
    }[size] || 'text-base py-1.5 px-3';
    
    // Variant classes
    const variantClasses = {
      'primary': 'text-primary hover:text-primary/90 font-medium',
      'secondary': 'text-muted-foreground hover:text-foreground',
      'ghost': 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
      'danger': 'text-destructive hover:text-destructive/90',
      'button': 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md',
      'buttonSecondary': 'bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md',
      'buttonGhost': 'border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md',
      'buttonDanger': 'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md',
    }[variant] || 'text-primary hover:text-primary/90';
    
    // Disabled state
    const disabledClasses = disabled ? 'opacity-50 pointer-events-none' : '';
    
    // Combine classes using the cn utility
    const combinedClasses = cn(
      baseClasses,
      sizeClasses,
      variantClasses,
      disabledClasses,
      className
    );
    
    // Clone the element with new className
    return React.cloneElement(element, {
      className: combinedClasses,
      ...element.props
    });
  }
);

// 5. Link Icon Morph - Adds icon support
export const LinkIconMorph = createMorph<LinkMorphOutput, LinkMorphOutput>(
  "LinkIconMorph",
  (element, context) => {
    const { link } = context as LinkMorphInput;
    const { icon, label } = link.layout;
    
    if (!icon) return element;
    
    const iconElement = ICON_REGISTRY[icon] || null;
    if (!iconElement) return element;
    
    const isExternal = link.layout.href && 
      (link.layout.href.startsWith('http') || link.layout.target === '_blank');
    
    // Create children with icon
    const children = (
      <>
        <span className="inline-flex items-center justify-center">{iconElement}</span>
        <span>{label}</span>
        {isExternal && <ArrowUpRight className="ml-1 h-3 w-3" />}
      </>
    );
    
    // Clone the element with new children
    return React.cloneElement(element, {
      children,
      ...element.props
    });
  }
);

// 6. Create the complete pipeline
export const LinkMorphPipeline = createPipeline<LinkMorphInput, LinkMorphOutput>("LinkPipeline")
  .pipe(LinkPrimitiveMorph)
  .pipe(LinkVariantMorph)
  .pipe(LinkIconMorph)
  .build();

// 7. Create a React component that uses the morphology
export function LinkComponent(props: { link: LinkShape; handler?: FormHandler }) {
  return LinkMorphPipeline.transform(props, props);
}