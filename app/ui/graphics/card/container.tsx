import React from "react";
import { Form } from "@/ui/graphics/form/form";
import type { FormMode, FormContent, FormHandler } from "@/ui/graphics/schema/form";
import { ContainerCardShape } from "../schema/card";
import { Card } from "./card";

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

  // Custom render method for container cards
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    // Extract container-specific props from layout
    const {
      title,
      subtitle,
      headerAction,
      footerAction,
      padding = true,
      elevated = true,
      bordered = false,
      contentClassName = '',
      headerClassName = '',
      footerClassName = '',
      className = '',
    } = this.data.layout;

    // If not rendering JSX, defer to parent implementation
    if (content !== "jsx") {
      return super.render(mode, content, handler);
    }

    // For JSX, create container-specific UI
    const cardClasses = [
      'bg-white rounded-xl',
      elevated ? 'shadow-sm' : '',
      bordered ? 'border border-gray-200' : '',
      className
    ].filter(Boolean).join(' ');

    const contentClasses = [
      padding ? 'p-6' : '',
      contentClassName
    ].filter(Boolean).join(' ');

    // Handle content rendering
    let childContent: React.ReactNode = null;

    // If we have a nested form, render it
    if (this.data.content) {
      // This would be where we'd render a nested form from content
      // For now, we'll just show a placeholder
      childContent = <div>Content would be rendered here</div>;
    } else if (this.data.children) {
      // Handle direct children if they exist (for JSX-style usage)
      childContent = this.data.children;
    }

    return (
      <div className={cardClasses}>
        {title && (
          <div className={`flex items-center justify-between ${padding ? 'px-6 pt-6 pb-4' : 'p-4'} ${headerClassName}`}>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            {headerAction && (
              <div className="ml-auto">{headerAction}</div>
            )}
          </div>
        )}

        <div className={contentClasses}>
          {childContent}
        </div>

        {footerAction && (
          <div className={`${padding ? 'px-6 py-4' : 'p-4'} ${footerClassName}`}>
            {footerAction}
          </div>
        )}
      </div>
    );
  }
}

// React component wrapper for convenient JSX usage
export default function ContainerCardForm(props: ContainerCardShape) {
  const containerCardInstance = new ContainerCard(props);
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
