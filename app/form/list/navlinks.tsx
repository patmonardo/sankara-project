import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createMorph, createPipeline } from "@/form/morph/core";
import { cn } from "@/form/lib/utils";

// --- TYPES ---

export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  disabled?: boolean;
}

export interface NavLinksProps {
  items: NavItem[];
  variant?: "vertical" | "horizontal" | "minimal";
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
  activeClassName?: string;
  itemClassName?: string;
}

export interface NavLinksMorphInput {
  props: NavLinksProps;
}

// --- PRIMITIVE COMPONENTS ---

const NavLinksPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex", className)}
    {...props}
  />
));
NavLinksPrimitive.displayName = "NavLinksPrimitive";

const NavLinkItemPrimitive = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link> & {
    active?: boolean;
    disabled?: boolean;
  }
>(({ className, active, disabled, ...props }, ref) => (
  <Link
    ref={ref}
    className={cn(
      "flex items-center gap-2 transition-colors",
      disabled && "pointer-events-none opacity-60",
      className
    )}
    aria-disabled={disabled}
    {...props}
  />
));
NavLinkItemPrimitive.displayName = "NavLinkItemPrimitive";

// --- MORPH DEFINITIONS ---

// Base NavLinks morph - creates container and applies layout
const NavLinksBaseMorph = createMorph<
  NavLinksMorphInput,
  React.ReactElement
>("NavLinksBaseMorph", ({ props }, context) => {
  const { variant = "vertical" } = props;
  
  // Apply layout based on variant
  const layoutClassName = {
    vertical: "flex-col space-y-2",
    horizontal: "flex-row space-x-4",
    minimal: "flex-col space-y-1"
  }[variant];
  
  return (
    <NavLinksPrimitive className={layoutClassName}>
      {/* Items will be added by subsequent morphs */}
    </NavLinksPrimitive>
  );
});

// Items morph - processes and adds individual nav links
const NavLinksItemsMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("NavLinksItemsMorph", (element, context) => {
  const { props } = context as NavLinksMorphInput;
  const { items, variant = "vertical", size = "md", activeClassName, itemClassName, iconClassName } = props;
  
  // Create functional component for path-based active state
  const NavItems = () => {
    const pathname = usePathname();
    
    // Size classes for items
    const sizeClasses = {
      sm: "text-sm py-1 px-2",
      md: "text-base py-2 px-3",
      lg: "text-lg py-3 px-4"
    }[size];
    
    // Base item classes
    const baseItemClasses = cn(
      "rounded-md",
      "flex items-center gap-2",
      variant === "vertical" ? "w-full" : "",
      variant === "minimal" ? "py-1 px-2" : sizeClasses,
      "font-medium",
      "hover:bg-accent hover:text-accent-foreground",
      "transition-colors",
      itemClassName
    );
    
    // Active item classes
    const activeItemClasses = activeClassName || "bg-accent text-accent-foreground";
    
    // Icon sizing
    const iconSizeClass = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6"
    }[size];
    
    return (
      <>
        {items.map((item) => {
          const isActive = pathname === item.href;
          const LinkIcon = item.icon;
          
          return (
            <NavLinkItemPrimitive
              key={item.name}
              href={item.href}
              active={isActive}
              disabled={item.disabled}
              className={cn(
                baseItemClasses,
                isActive && activeItemClasses
              )}
            >
              {LinkIcon && (
                <LinkIcon className={cn(iconSizeClass, iconClassName)} />
              )}
              <span className={variant === "minimal" ? "sr-only md:not-sr-only" : ""}>
                {item.name}
              </span>
            </NavLinkItemPrimitive>
          );
        })}
      </>
    );
  };
  
  // Add nav items to the container
  return React.cloneElement(element, {
    children: <NavItems />
  });
});

// NavLinks pipeline
const NavLinksPipeline = createPipeline<NavLinksMorphInput, React.ReactElement>("NavLinksPipeline")
  .pipe(NavLinksBaseMorph)
  .pipe(NavLinksItemsMorph)
  .build();

// --- EXPORTED COMPONENT ---

export function NavLinks(props: NavLinksProps) {
  return NavLinksPipeline.transform({ props }, { props });
}

// --- DATA EXPORT ---

// Default navigation data - exported so SideNav can use it
export const defaultNavItems: NavItem[] = [
  { name: 'Home', href: '/', icon: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
      strokeLinejoin="round" {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )},
  { name: 'Invoices', href: '/invoices', icon: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
      strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )},
  { name: 'Customers', href: '/customers', icon: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
      strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )},
];