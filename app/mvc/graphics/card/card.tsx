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
import { md } from "@/ui/theme/token";
import { kb } from "@/ui/theme/kb";

// Map icon names to components
const iconMap: Record<string, React.ReactElement> = {
  text: <DocumentTextIcon className="h-5 w-5" />,
  concept: <LightBulbIcon className="h-5 w-5" />,
  relation: <ArrowsRightLeftIcon className="h-5 w-5" />,
  exploration: <MagnifyingGlassIcon className="h-5 w-5" />,
  book: <BookOpenIcon className="h-5 w-5" />,
};

/**
 * Get appropriate color for a given type and usage
 * This helper respects the schema organization of colors
 *
 * @param type - The semantic type (primary, success, concept, etc)
 * @param usage - How the color will be used (text, bg, border)
 * @returns The appropriate color CSS class
 */
export function getColorByType(
  type: string,
  usage: "text" | "bg" | "border" = "text"
): string {
  // Determine the color value based on semantic type
  let colorValue: string;

  // Check for knowledge domain types
  if (
    type === "concept" ||
    type === "text" ||
    type === "relation" ||
    type === "exploration"
  ) {
    // Use direct property access instead of string indexing
    switch (type) {
      case "concept":
        colorValue = md.color.knowledge.concept;
        break;
      case "text":
        colorValue = md.color.knowledge.text;
        break;
      case "relation":
        colorValue = md.color.knowledge.relation;
        break;
      case "exploration":
        colorValue = md.color.knowledge.exploration;
        break;
    }
  }
  // Check for state types
  else if (["success", "error", "danger", "warning", "info"].includes(type)) {
    // Map danger to error as a convenience
    const stateKey = type === "danger" ? "error" : type;
    // Use direct property access for state colors as well
    switch (stateKey) {
      case "success":
        colorValue = md.color.state.success;
        break;
      case "error":
        colorValue = md.color.state.error;
        break;
      case "warning":
        colorValue = md.color.state.warning;
        break;
      case "info":
        colorValue = md.color.state.info;
        break;
      default:
        colorValue = md.color.state.info; // Fallback
    }
  }
  // Check for theme colors with variants
  else if (type === "primary") {
    colorValue = md.color.primary.main;
  } else if (type === "secondary") {
    colorValue = md.color.secondary.main;
  }
  // Default to neutral colors
  else {
    colorValue =
      usage === "text" ? md.color.neutral[900] : md.color.neutral[200];
  }

  // Return the appropriate CSS class based on usage
  switch (usage) {
    case "text":
      return `text-[${colorValue}]`;
    case "bg":
      return `bg-[${colorValue}]`;
    case "border":
      return `border-[${colorValue}]`;
    default:
      return `text-[${colorValue}]`;
  }
}

// Card component for displaying a simple metric
export class Card<T extends CardShape> extends Form<T> {
  constructor(protected readonly data: T) {
    super(data);
  }

  protected async getCardShape(mode: FormMode): Promise<T> {
    const {
      title,
      value,
      label,
      description,
      type = "default",
      icon,
      actions = [], // Ensure actions exists
    } = this.data.layout;

    // Prepare base shape - consistent across all modes
    const baseShape = {
      layout: {
        title,
        value,
        label,
        type,
        icon,
        description,
      },
      // Add any common fields here
    };

    // Mode-specific customizations
    if (mode === "view") {
      // View mode shows primary action as card click and renders others as buttons
      return {
        ...this.data,
        layout: {
          ...this.data.layout,
          // We keep actions as-is for view mode
        },
      } as T;
    }
    else if (mode === "edit") {
      // Edit mode replaces actions with save/cancel
      return {
        ...this.data,
        layout: {
          ...this.data.layout,
          title: `Edit ${title}`, // Optional: modify title to show mode
          actions: [
            {
              id: "save",
              label: "Save Changes",
              type: "primary",
              variant: "primary",
            },
            {
              id: "cancel",
              label: "Cancel",
              type: "secondary",
              variant: "secondary",
            },
          ],
        },
        // Add any edit-specific fields here
      } as T;
    }
    else { // create mode
      // Create mode has different actions and empty values
      return {
        ...this.data,
        layout: {
          ...this.data.layout,
          title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`, // E.g. "New Concept"
          value: "", // Empty in create mode
          label: "",
          description: "",
          actions: [
            {
              id: "create",
              label: "Create",
              type: "primary",
              variant: "primary",
            },
            {
              id: "cancel",
              label: "Cancel",
              type: "secondary",
              variant: "secondary",
            },
          ],
        },
        // Add any create-specific fields here
      } as T;
    }
  }

  // Implement the abstract methods from Form
  protected async viewForm(): Promise<T> {
    return this.getCardShape("view");
  }

  protected async createForm(): Promise<T> {
    return this.getCardShape("create");
  }

  protected async editForm(): Promise<T> {
    return this.getCardShape("edit");
  }

  // Get the appropriate card styling based on type
  protected getCardStyle(): string {
    const { type = "default" } = this.data.layout;

    // Map card types to the appropriate kb card style
    switch (type) {
      case "concept":
        return kb.card.concept("level2");
      case "text":
        return kb.card.text("level1");
      case "relation":
        return kb.card.relation("level1");
      case "exploration":
        return kb.card.exploration("level2");
      default:
        return `
          ${md.elevation.level1}
          ${md.shape.medium}
          ${md.pattern.surface.elevated}
        `;
    }
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
      className = "",
    } = this.data.layout;

    // Get icon component
    const iconComponent = icon ? iconMap[icon] || null : null;

    // Get color for type using our helper function
    const colorClass = getColorByType(type, "text");

    // Get card style based on type
    const cardStyle = this.getCardStyle();

    // Trend styling with helper function
    const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
    const trendType =
      trend === "up" ? "success" : trend === "down" ? "error" : "default";
    const trendColor = getColorByType(trendType, "text");

    const neutralTextColor = `text-[${md.color.neutral[500]}]`;
    const neutralDarkTextColor = `text-[${md.color.neutral[900]}]`;

    const primaryAction =
      this.data.layout.actions && this.data.layout.actions.length > 0
        ? this.data.layout.actions[0]
        : null;

    const handleClick = primaryAction
      ? () => {
          handler.onAction(primaryAction.id, this.data);
        }
      : undefined;

    return (
      <div
        className={`...`}
        onClick={handleClick}
        role={handleClick ? "button" : undefined}
        tabIndex={handleClick ? 0 : undefined}
      >
        <div className={`flex items-center justify-between`}>
          <h3 className={`${md.type.label} ${neutralTextColor}`}>{title}</h3>
          {iconComponent && <span className={colorClass}>{iconComponent}</span>}
        </div>

        <div className="mt-2 flex items-baseline">
          <p className={`${md.type.title} ${neutralDarkTextColor}`}>{value}</p>
          {label && (
            <span className={`ml-2 ${md.type.body2} ${neutralTextColor}`}>
              {label}
            </span>
          )}
        </div>

        {(trend || description) && (
          <div className={`${md.pattern.content.secondaryContent} mt-2`}>
            {trend && change !== undefined && (
              <span
                className={`inline-flex items-center ${md.type.body2} ${trendColor}`}
              >
                {trendIcon} {change}%
              </span>
            )}

            {description && (
              <p className={`mt-1 ${md.type.body2} ${neutralTextColor}`}>
                {description}
              </p>
            )}
          </div>
        )}
        {/* You can also render action buttons if needed */}
        {this.data.layout.actions && this.data.layout.actions.length > 0 && (
          <div className="mt-4 flex justify-end space-x-2">
            {this.data.layout.actions.map((action) => (
              <button
                key={action.id}
                className={`${
                  md.type.button
                } px-3 py-1 rounded ${getActionButtonStyle(action.type)}`}
                onClick={() => handler.onAction(action.id, this.data)}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
}

// Helper function for action button styling
function getActionButtonStyle(type: string): string {
  switch (type) {
    case "primary":
      return `bg-[${md.color.primary.main}] text-white`;
    case "secondary":
      return `bg-[${md.color.secondary.main}] text-white`;
    case "danger":
      return `bg-[${md.color.state.error}] text-white`;
    default:
      return `bg-gray-200 text-gray-800`;
  }
}

export default function CardForm(props: CardShape & {
  mode?: FormMode,
  onAction?: (actionId: string, data: CardShape) => void
}) {
  const { mode = "view", onAction, ...cardProps } = props;
  const cardInstance = new Card(cardProps as CardShape);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderCard = async () => {
      const handler: FormHandler = onAction
        ? {
            onAction: (id, data) => onAction(id, data),
            // Add any other handlers needed
          }
        : {} as FormHandler;

      const renderedContent = await cardInstance.render(
        mode,
        "jsx",
        handler
      );
      setContent(renderedContent);
    };
    renderCard();
  }, [cardInstance, mode, onAction, props]);

  return <>{content}</>;
}

// Export specialized card subclasses for different knowledge domain entities
export class ConceptCard<T extends CardShape> extends Card<T> {
  protected getCardStyle(): string {
    return kb.card.concept("level2");
  }
}

export class TextCard<T extends CardShape> extends Card<T> {
  protected getCardStyle(): string {
    return kb.card.text("level1");
  }
}

export class RelationCard<T extends CardShape> extends Card<T> {
  protected getCardStyle(): string {
    return kb.card.relation("level1");
  }
}

export class ExplorationCard<T extends CardShape> extends Card<T> {
  protected getCardStyle(): string {
    return kb.card.exploration("level2");
  }
}
