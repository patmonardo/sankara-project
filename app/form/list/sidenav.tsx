import React from "react";
import { createMorph, createPipeline } from "@/form/morph/core";
import { cn } from "@/form/lib/utils";
import Link from "next/link";
import { NavLinks, defaultNavItems, NavItem } from "@/form/nav/navlinks";

// --- TYPES ---

export interface SideNavProps {
  logo?: React.ReactNode;
  logoHref?: string;
  navItems?: NavItem[];
  footer?: React.ReactNode;
  collapsed?: boolean;
  className?: string;
  variant?: "default" | "minimal" | "floating";
}

export interface SideNavMorphInput {
  props: SideNavProps;
}

// --- PRIMITIVE COMPONENTS ---

const SideNavPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-full flex-col", className)}
    {...props}
  />
));
SideNavPrimitive.displayName = "SideNavPrimitive";

const SideNavHeaderPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
));
SideNavHeaderPrimitive.displayName = "SideNavHeaderPrimitive";

const SideNavContentPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex grow flex-col", className)}
    {...props}
  />
));
SideNavContentPrimitive.displayName = "SideNavContentPrimitive";

const SideNavFooterPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-auto", className)}
    {...props}
  />
));
SideNavFooterPrimitive.displayName = "SideNavFooterPrimitive";

// --- DEFAULT COMPONENTS ---

const DefaultLogo = () => (
  <div className="font-bold text-xl text-primary">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  </div>
);

const DefaultFooter = () => (
  <button className="flex w-full items-center gap-2 rounded-md bg-muted p-2 text-sm font-medium hover:bg-muted/80">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
    <span>Sign Out</span>
  </button>
);

// --- MORPH DEFINITIONS ---

// Base SideNav morph - creates the container structure
const SideNavBaseMorph = createMorph<
  SideNavMorphInput,
  React.ReactElement
>("SideNavBaseMorph", ({ props }, context) => {
  const { className, variant = "default", collapsed } = props;
  
  // Apply variant styling
  const variantClasses = {
    default: "border-r bg-background",
    minimal: "border-r bg-background w-[60px] md:w-[80px]",
    floating: "rounded-xl border shadow-lg bg-background m-2"
  }[variant];
  
  // Collapsed state (for responsive designs)
  const collapsedClass = collapsed ? "w-[60px]" : "";
  
  return (
    <SideNavPrimitive className={cn(
      "p-2 md:p-4",
      variantClasses,
      collapsedClass,
      className
    )}>
      {/* Content will be added by subsequent morphs */}
    </SideNavPrimitive>
  );
});

// Logo morph - adds the logo/header area
const SideNavLogoMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("SideNavLogoMorph", (element, context) => {
  const { props } = context as SideNavMorphInput;
  const { logo, logoHref = "/", variant } = props;
  
  // Create the logo element
  const logoElement = (
    <SideNavHeaderPrimitive className="mb-4">
      <Link
        href={logoHref}
        className={cn(
          "flex items-center rounded-md p-2",
          variant === "default" ? "h-14" : "h-10",
          "transition-colors hover:bg-accent"
        )}
      >
        {logo || <DefaultLogo />}
      </Link>
    </SideNavHeaderPrimitive>
  );
  
  // Add logo to the container
  return React.cloneElement(element, {
    children: [
      logoElement,
      // Placeholder for content that will be added by subsequent morphs
      <SideNavContentPrimitive key="content" />
    ]
  });
});

// Content morph - adds the NavLinks to the content area
const SideNavContentMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("SideNavContentMorph", (element, context) => {
  const { props } = context as SideNavMorphInput;
  const { navItems = defaultNavItems, variant, collapsed } = props;
  
  // Find content element
  const children = React.Children.toArray(element.props.children);
  const contentIndex = children.findIndex(child => 
    React.isValidElement(child) && 
    child.type === SideNavContentPrimitive
  );
  
  if (contentIndex === -1) return element;
  
  // Set NavLinks variant based on SideNav variant/collapsed state
  let navLinksVariant: "vertical" | "horizontal" | "minimal" = "vertical";
  if (variant === "minimal" || collapsed) {
    navLinksVariant = "minimal";
  }
  
  // Create the navigation element using NavLinks morph
  const navigationElement = (
    <NavLinks
      items={navItems}
      variant={navLinksVariant}
      className="mb-4"
      itemClassName={variant === "minimal" || collapsed 
        ? "justify-center" 
        : ""}
    />
  );
  
  // Add spacer
  const spacerElement = (
    <div className="flex-1" />
  );
  
  // Update content element with navigation
  const updatedContent = React.cloneElement(
    children[contentIndex] as React.ReactElement,
    {},
    navigationElement,
    spacerElement
  );
  
  // Replace content element in children array
  const updatedChildren = [...children];
  updatedChildren[contentIndex] = updatedContent;
  
  // Return updated element
  return React.cloneElement(element, {
    children: [
      ...updatedChildren,
      // Placeholder for footer that will be added by subsequent morph
      <SideNavFooterPrimitive key="footer" />
    ]
  });
});

// Footer morph - adds the footer area
const SideNavFooterMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("SideNavFooterMorph", (element, context) => {
  const { props } = context as SideNavMorphInput;
  const { footer, variant, collapsed } = props;
  
  // Find footer element
  const children = React.Children.toArray(element.props.children);
  const footerIndex = children.findIndex(child => 
    React.isValidElement(child) && 
    child.type === SideNavFooterPrimitive
  );
  
  if (footerIndex === -1) return element;
  
  // Create footer content
  const footerContent = footer || <DefaultFooter />;
  
  // Hide text in footer if minimal or collapsed
  const hideText = variant === "minimal" || collapsed;
  
  // Update footer element
  const updatedFooter = React.cloneElement(
    children[footerIndex] as React.ReactElement,
    {},
    hideText ? (
      <div className="flex justify-center p-2">
        {footerContent}
      </div>
    ) : footerContent
  );
  
  // Replace footer element in children array
  const updatedChildren = [...children];
  updatedChildren[footerIndex] = updatedFooter;
  
  // Return updated element
  return React.cloneElement(element, {
    children: updatedChildren
  });
});

// Complete SideNav pipeline
const SideNavPipeline = createPipeline<SideNavMorphInput, React.ReactElement>("SideNavPipeline")
  .pipe(SideNavBaseMorph)
  .pipe(SideNavLogoMorph)
  .pipe(SideNavContentMorph)
  .pipe(SideNavFooterMorph)
  .build();

// --- EXPORTED COMPONENT ---

export function SideNav(props: SideNavProps) {
  return SideNavPipeline.transform({ props }, { props });
}