import React from "react";
import {
  DocumentTextIcon,
  LightBulbIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import type {
  FormMode,
  FormContent,
  FormHandler,
} from "@/ui/graphics/schema/form";
import { Form } from "@/ui/graphics/form/form";
import type { CardShape } from "../schema/card";

// Map icon names to components
const iconMap: Record<string, React.ReactElement> = {
  text: <DocumentTextIcon className="h-5 w-5" />,
  concept: <LightBulbIcon className="h-5 w-5" />,
  relation: <ArrowsRightLeftIcon className="h-5 w-5" />,
  exploration: <MagnifyingGlassIcon className="h-5 w-5" />,
  book: <BookOpenIcon className="h-5 w-5" />,
};

// Map card types to colors
const colorMap: Record<string, string> = {
  default: "text-gray-600",
  primary: "text-blue-600",
  secondary: "text-purple-600",
  success: "text-green-600",
  warning: "text-yellow-600",
  danger: "text-red-600",
  info: "text-cyan-600",
  concept: "text-indigo-600",
  text: "text-emerald-600",
  relation: "text-amber-600",
  exploration: "text-violet-600",
};

// Card component for displaying a simple metric
export class Card<T extends CardShape> extends Form<T> {
  constructor(protected readonly data: T) {
    super(data);
  }

  // Implement required Form abstract methods
  protected async createForm(): Promise<T> {
    // Here you would normally create a new form with default values
    return this.data;
  }

  protected async editForm(): Promise<T> {
    // Here you would normally populate a form with existing values
    return this.data;
  }

  // Custom render method for cards
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
    } = this.data.layout;

    // Get icon component
    const iconComponent = icon ? iconMap[icon] || null : null;

    // Get color for type
    const colorClass = colorMap[type] || colorMap.default;

    // Trend styling
    const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
    const trendColor =
      trend === "up"
        ? "text-green-600"
        : trend === "down"
        ? "text-red-600"
        : "text-gray-600";

    return (
      <div
        className={`rounded-xl bg-white p-6 shadow-sm ${className}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          {iconComponent && <span className={colorClass}>{iconComponent}</span>}
        </div>

        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {label && <span className="ml-2 text-sm text-gray-500">{label}</span>}
        </div>

        {(trend || description) && (
          <div className="mt-2">
            {trend && change !== undefined && (
              <span
                className={`inline-flex items-center text-sm ${trendColor}`}
              >
                {trendIcon} {change}%
              </span>
            )}

            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
}

// React component wrapper for convenient JSX usage
export default function CardForm(props: CardShape) {
  const cardInstance = new Card(props);
  return <>{cardInstance.render("edit","jsx", {} as FormHandler)}</>;
}
