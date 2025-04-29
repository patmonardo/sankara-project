"use client";

import React from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Form } from '@/form/form/form';
import { FormMode, FormContent, FormHandler } from '@/form/schema/form';
import { ButtonShape } from '@/form/schema/button';
import { createMorph, createPipeline } from '@/form/morph/core';
import { cn } from "@/form/lib/utils";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  CogIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// --- TYPES ---

export interface ButtonMorphInput {
  shape: ButtonShape;
  router: ReturnType<typeof useRouter>;
  handler?: FormHandler;
}

// --- ICON MAP ---

const ICON_MAP: Record<string, React.ReactNode> = {
  'pencil': <PencilIcon className="h-4 w-4" />,
  'trash': <TrashIcon className="h-4 w-4" />,
  'plus': <PlusIcon className="h-4 w-4" />,
  'eye': <EyeIcon className="h-4 w-4" />,
  'cog': <CogIcon className="h-4 w-4" />,
  'external': <ArrowTopRightOnSquareIcon className="h-4 w-4" />,
  'arrow': <ArrowRightIcon className="h-4 w-4" />,
  'check': <CheckIcon className="h-4 w-4" />,
  'close': <XMarkIcon className="h-4 w-4" />,
};

// --- PRIMITIVE COMPONENTS ---

const ButtonPrimitive = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn("inline-flex items-center justify-center", className)}
    {...props}
  />
));
ButtonPrimitive.displayName = "ButtonPrimitive";

const LinkPrimitive = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, ...props }, ref) => (
  <Link
    ref={ref}
    className={cn("inline-flex items-center justify-center", className)}
    {...props}
  />
));
LinkPrimitive.displayName = "LinkPrimitive";

// --- MORPH DEFINITIONS ---

// Base morph - decides whether to use a button or link
const ButtonBaseMorph = createMorph<
  ButtonMorphInput,
  React.ReactElement
>("ButtonBaseMorph", ({ shape, router, handler }, context) => {
  const { href, disabled } = shape;
  
  if (href && !disabled) {
    return <LinkPrimitive href={href}></LinkPrimitive>;
  } else {
    return <ButtonPrimitive></ButtonPrimitive>;
  }
});

// Style morph - applies styling based on variant, size, etc.
const ButtonStyleMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("ButtonStyleMorph", (element, context) => {
  const { shape } = context as ButtonMorphInput;
  const { variant = 'default', size = 'md', disabled, customClass } = shape;
  
  // If custom class is provided, use it directly
  if (customClass) {
    return React.cloneElement(element, {
      className: customClass
    });
  }
  
  // Base styles for all buttons
  const baseStyles = "font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  // Variant styles
  const variantStyles = {
    default: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500",
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600",
    link: "bg-transparent text-blue-600 hover:underline p-0 h-auto"
  }[variant] || "bg-gray-100 text-gray-800 hover:bg-gray-200";
  
  // Size styles
  const sizeStyles = {
    xs: "text-xs py-1 px-2",
    sm: "text-sm py-1 px-3",
    md: "text-sm py-2 px-4",
    lg: "text-base py-2 px-6",
    xl: "text-lg py-3 px-8"
  }[size] || "text-sm py-2 px-4";
  
  // Disabled styles
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  
  // Combine all styles
  const className = cn(
    baseStyles,
    variantStyles,
    sizeStyles,
    disabledStyles
  );
  
  return React.cloneElement(element, { className });
});

// Content morph - adds label and icon content
const ButtonContentMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("ButtonContentMorph", (element, context) => {
  const { shape } = context as ButtonMorphInput;
  const { icon, label, srOnly, iconPosition = 'right' } = shape;
  
  // Get icon element if specified
  let iconElement = null;
  if (icon) {
    iconElement = ICON_MAP[icon] || (
      <span 
        className={`icon icon-${icon} ${iconPosition === 'left' ? 'mr-2' : 'ml-2'}`} 
        aria-hidden="true" 
      />
    );
  }
  
  // Create appropriate content based on options
  let content: React.ReactNode[] = [];
  
  // Screen reader only content
  if (srOnly && label) {
    content.push(<span key="sr-label" className="sr-only">{label}</span>);
  } 
  // Visible label
  else if (label) {
    content.push(<span key="label">{label}</span>);
  }
  
  // Add icon in correct position
  if (iconElement) {
    if (iconPosition === 'left') {
      content = [
        <span key="icon-left" className="mr-2">{iconElement}</span>,
        ...content
      ];
    } else {
      content.push(
        <span key="icon-right" className="ml-2">{iconElement}</span>
      );
    }
  }
  
  return React.cloneElement(element, {}, ...content);
});

// Behavior morph - adds click handlers, confirmation, etc.
const ButtonBehaviorMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("ButtonBehaviorMorph", (element, context) => {
  const { shape, router, handler } = context as ButtonMorphInput;
  const { onClick, confirmMessage, refreshAfterAction, disabled } = shape;
  
  // Create click handler
  const handleClick = async (e: React.MouseEvent) => {
    // If disabled, do nothing
    if (disabled) return;
    
    // Check for confirmation message
    if (confirmMessage && !window.confirm(confirmMessage)) {
      e.preventDefault();
      return;
    }
    
    // Run onClick handler if provided
    if (onClick) {
      await onClick(e);
    }
    
    // Run form handler if provided
    if (handler) {
      await handler.submit(shape, {});
    }
    
    // Refresh if needed
    if (refreshAfterAction && router) {
      router.refresh();
    }
  };
  
  // Add click handler to element
  return React.cloneElement(element, {
    onClick: handleClick,
    disabled
  });
});

// Complete button pipeline
const ButtonPipeline = createPipeline<ButtonMorphInput, React.ReactElement>("ButtonPipeline")
  .pipe(ButtonBaseMorph)
  .pipe(ButtonStyleMorph)
  .pipe(ButtonContentMorph)
  .pipe(ButtonBehaviorMorph)
  .build();

// --- BUTTON COMPONENT ---

/**
 * ButtonComponent - renders a button using morphology
 */
export function ButtonComponent({ shape, handler }: { shape: ButtonShape, handler?: FormHandler }) {
  const router = useRouter();
  
  return ButtonPipeline.transform({ shape, router, handler }, { shape, router, handler });
}

/**
 * Abstract base class for all button types
 * Now leverages the morphology pipeline
 */
export abstract class Button<T extends ButtonShape> extends Form<T> {
  /**
   * Get the button shape configuration
   */
  protected abstract getButtonShape(): T;

  /**
   * Create form implementation
   */
  protected async createForm(): Promise<T> {
    return this.getButtonShape();
  }

  /**
   * Edit form implementation
   */
  protected async editForm(): Promise<T> {
    return this.getButtonShape();
  }

  /**
   * Render the button as a React component 
   * using morphology pipeline
   */
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    // Return simple string for non-jsx content
    if (content !== 'jsx') {
      const shape = this.getButtonShape();
      return shape.label || 'Button';
    }
    
    // Use ButtonComponent for JSX rendering
    const shape = this.getButtonShape();
    return <ButtonComponent shape={shape} handler={handler} />;
  }
}

// Simple functional component for direct use in JSX
export default function ButtonForm(props: ButtonShape) {
  return <ButtonComponent shape={props} />;
}