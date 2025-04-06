import React from "react";
import type { FormMode, FormContent, FormHandler } from "@/ui/graphics/schema/form";
import { ContainerCardShape } from "../schema/card";
import { Card, getColorByType } from "./card";
import { md } from "@/ui/theme/token";

// ContainerCard specialized class for wrapping content
export class ContainerCard<T extends ContainerCardShape> extends Card<T> {
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

  // Get the appropriate card styling based on type and container properties
  protected getContainerStyle(): string {
    const {
      type = "default",
    } = this.data.layout;

    // Start with base styles
    let styles = `
      ${md.shape.medium}
      bg-white
    `;

    // Add elevation
    styles += ` ${md.elevation.level1}`;

    // Add type-specific styling
    if (type !== "default") {
      styles += ` border-l-4 border-[${getColorByType(type, "text").replace("text-[", "").replace("]", "")}]`;
    }

    return styles;
  }

  // Custom render method for container cards
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    // If not rendering JSX, defer to parent implementation
    if (content !== "jsx") {
      return super.render(mode, content, handler);
    }

    // Extract basic props - only use what's in the schema
    const {
      title,
      type = "default",
      description,
    } = this.data.layout;

    // Default values for props not in the schema
    const subtitle = description;
    const padding = true;
    const className = '';
    const contentClassName = '';
    const headerClassName = '';
    const footerClassName = '';

    // Extract container config safely
    const container = this.data.container || {};
    const items = container.items || [];
    const containerLayout = container.layout || "grid";
    const columns = container.columns || 2;
    const gap = container.gap || 4;
    const responsive = container.responsive !== false;

    // Get styling
    const containerStyle = this.getContainerStyle();
    const titleColor = getColorByType(type, "text");
    const subtitleColor = getColorByType("default", "text");

    // Determine content padding
    const paddingClasses = padding ? 'p-6' : '';

    // Simplified layout classes
    let layoutClasses = '';
    if (containerLayout === "grid") {
      layoutClasses = `grid grid-cols-1 gap-${gap}`;
      if (responsive) {
        layoutClasses += ` sm:grid-cols-2 md:grid-cols-${Math.min(columns, 4)}`;
      } else {
        layoutClasses += ` grid-cols-${Math.min(columns, 4)}`;
      }
    } else if (containerLayout === "list") {
      layoutClasses = `flex flex-col gap-${gap}`;
    } else if (containerLayout === "carousel") {
      layoutClasses = `flex overflow-x-auto gap-${gap} snap-x`;
    }

    return (
      <div className={`${containerStyle} ${className}`}>
        {/* Header Section */}
        {title && (
          <div className={`${padding ? 'px-6 pt-6 pb-4' : 'p-4'} ${headerClassName}`}>
            <div>
              <h3 className={`${md.type.title} ${titleColor}`}>{title}</h3>
              {subtitle && <p className={`mt-1 ${md.type.body2} ${subtitleColor}`}>{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className={`${paddingClasses} ${contentClassName}`}>
          {/* Render child items if they exist */}
          {items.length > 0 ? (
            <div className={layoutClasses}>
              {items.map((item, index) => (
                <div key={index} className={containerLayout === "carousel" ? "snap-start" : ""}>
                  {/* Simple placeholder for items */}
                  <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                    Item {index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // If no items, show the container's children (for JSX usage)
            // @ts-ignore - children is added in the wrapper component
            this.data.children || null
          )}
        </div>

        {/* No footer for now */}
      </div>
    );
  }
}

// React component wrapper for convenient JSX usage
export default function ContainerCardForm(props: ContainerCardShape & { children?: React.ReactNode }) {
  // Create a modified version of props that includes children
  const containerProps = {
    ...props,
    // Add children as a custom property
    children: props.children
  } as ContainerCardShape & { children?: React.ReactNode };

  const containerCardInstance = new ContainerCard(containerProps);

  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderCard = async () => {
      const renderedContent = await containerCardInstance.render("edit", "jsx", {} as FormHandler);
      setContent(renderedContent);
    };
    renderCard();
  }, [containerCardInstance, props]);

  return <>{content}</>;
}
