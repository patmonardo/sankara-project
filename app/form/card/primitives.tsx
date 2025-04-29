import React from "react";
import { cn } from "@/form/lib/utils";

// --- PRIMITIVE COMPONENTS ---

export const CardPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-md bg-white overflow-hidden", className)}
    {...props}
  />
));
CardPrimitive.displayName = "CardPrimitive";

export const CardHeaderPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between p-6", className)}
    {...props}
  />
));
CardHeaderPrimitive.displayName = "CardHeaderPrimitive";

export const CardTitlePrimitive = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-md font-medium text-gray-600", className)}
    {...props}
  />
));
CardTitlePrimitive.displayName = "CardTitlePrimitive";

export const CardIconPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-center", className)}
    {...props}
  />
));
CardIconPrimitive.displayName = "CardIconPrimitive";

export const CardContentPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6 pt-2 pb-6", className)}
    {...props}
  />
));
CardContentPrimitive.displayName = "CardContentPrimitive";

export const CardValuePrimitive = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xl font-semibold text-gray-900", className)}
    {...props}
  />
));
CardValuePrimitive.displayName = "CardValuePrimitive";

export const CardLabelPrimitive = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("ml-2 text-sm text-gray-500", className)}
    {...props}
  />
));
CardLabelPrimitive.displayName = "CardLabelPrimitive";

export const CardDescriptionPrimitive = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mt-1 text-sm text-gray-500", className)}
    {...props}
  />
));
CardDescriptionPrimitive.displayName = "CardDescriptionPrimitive";

export const CardTrendPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    trend?: "up" | "down" | "neutral";
  }
>(({ className, trend, ...props }, ref) => {
  const trendColor = 
    trend === "up" ? "text-green-600" : 
    trend === "down" ? "text-red-600" : 
    "text-gray-600";
  
  return (
    <div
      ref={ref}
      className={cn("mt-2 flex items-center text-sm", trendColor, className)}
      {...props}
    />
  );
});
CardTrendPrimitive.displayName = "CardTrendPrimitive";

export const CardProgressPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    progress: number;
    color?: string;
  }
>(({ className, progress, color = "bg-blue-600", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-3 w-full", className)}
    {...props}
  >
    <div className="flex justify-between mb-1 text-xs">
      <span>{props.children}</span>
      <span>{progress}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div 
        className={cn("h-full", color)} 
        style={{ width: `${progress}%` }} 
      />
    </div>
  </div>
));
CardProgressPrimitive.displayName = "CardProgressPrimitive";

export const CardFooterPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-4 flex justify-end space-x-2 px-6 pb-6", className)}
    {...props}
  />
));
CardFooterPrimitive.displayName = "CardFooterPrimitive";

export const CardButtonPrimitive = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "default";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    default: "bg-gray-100 text-gray-800 hover:bg-gray-200"
  };
  
  return (
    <button
      ref={ref}
      className={cn(
        "px-4 py-2 rounded-md text-sm font-medium transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
CardButtonPrimitive.displayName = "CardButtonPrimitive";

// For container cards
export const CardGridPrimitive = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    columns?: number;
    gap?: number;
  }
>(({ className, columns = 2, gap = 4, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid grid-cols-1 gap-4", 
      columns > 1 && `sm:grid-cols-2 md:grid-cols-${Math.min(columns, 4)}`,
      className
    )}
    {...props}
  />
));
CardGridPrimitive.displayName = "CardGridPrimitive";