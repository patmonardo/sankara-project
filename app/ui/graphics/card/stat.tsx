import React from "react";
import { Form } from "@/ui/graphics/form/form";
import type { FormMode, FormContent, FormHandler } from "@/ui/graphics/schema/form";
import { StatCardShape } from "../schema/card";
import { Card } from "./card";

// StatCard specialized class for statistical displays
export class StatCard<T extends StatCardShape> extends Card<T> {
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

  // Custom render method for stat cards
  async render(
    mode: FormMode,
    content: FormContent,
    handler: FormHandler
  ): Promise<React.ReactNode | string> {
    const {
      title,
      value,
      label,
      type = "default",
      icon,
      trend,
      change,
      description,
      onClick,
      className = "",
      compact = false,
      highlighted = false,
    } = this.data.layout;

    // We'll use the Card component's render method, but customize the wrapper
    const cardInstance = new Card(this.data);
    const cardContent = await cardInstance.render(mode, content, handler);

    // If not in JSX mode, just return the card content
    if (content !== "jsx" || typeof cardContent === "string") {
      return cardContent;
    }

    // For JSX mode, wrap the card content with stat-specific styling
    const statCardClass = `
      ${compact ? 'p-4' : ''}
      ${highlighted ? 'ring-2 ring-blue-500' : ''}
    `;

    return (
      <div className={`stat-card ${statCardClass}`}>
        {cardContent}

        {/* Add stat-specific features here if needed */}
        {/* For example, we could add a sparkline chart or other statistical visualization */}
        {this.data.layout.compact && trend && (
          <div className="stat-trend-indicator mt-2 h-1 w-full bg-gray-100 rounded overflow-hidden">
            <div
              className={`h-full ${trend === 'up' ? 'bg-green-500' : trend === 'down' ? 'bg-red-500' : 'bg-gray-400'}`}
              style={{ width: `${Math.min(Math.abs(change || 0) * 2, 100)}%` }}
            />
          </div>
        )}
      </div>
    );
  }
}

// React component wrapper for convenient JSX usage
export default function StatCardForm(props: StatCardShape) {
  const statCardInstance = new StatCard(props);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderCard = async () => {
      const renderedContent = await statCardInstance.render("edit", "jsx", {} as FormHandler);
      setContent(renderedContent);
    };
    renderCard();
  }, [statCardInstance, props]);

  return <>{content}</>;
}
