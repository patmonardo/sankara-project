import React from "react";
import type {
  FormMode,
  FormContent,
  FormHandler,
} from "@/form/schema/form";
import { StatCardShape } from "../schema/card";
import { Card } from "./card";
import { md } from "@/ui/theme/token";

// Icon mapping (simplified for example)
const iconMap: Record<string, React.ReactNode> = {
  concept: <span>💡</span>,
  text: <span>📄</span>,
  relation: <span>🔄</span>,
  exploration: <span>🔍</span>,
  book: <span>📚</span>,
};
/**
 * Get appropriate color for a given type and usage
 * This helper respects the schema organization of colors
 *
 * @param type - The semantic type (primary, success, concept, etc)
 * @param usage - How the color will be used (text, bg, border)
 * @returns The appropriate color CSS class
 */
function getColorByType(
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

  // Get appropriate card styling based on type and highlighted state
  protected getCardStyle(): string {
    const { type = "default", highlighted = false } = this.data.layout;
    const elevationLevel = highlighted ? "level2" : "level1";

    // Base card style
    let cardStyle = `
      ${md.elevation[elevationLevel]}
      ${md.shape.medium}
    `;

    // Add highlighted style if needed
    if (highlighted) {
      cardStyle += ` ring-2 ${getColorByType(type, "border").replace(
        "border-",
        "ring-"
      )}`;
    }

    return cardStyle;
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

    const {
      previousValue,
      timeframe,
      comparison,
      showSparkline = false,
      precision = 0,
      goalValue,
      goalProgress,
    } = this.data.stats || {};

    // Get appropriate styling
    const cardStyle = this.getCardStyle();
    const padding = compact ? "p-4" : "p-6";

    // Get trend styling using our helper
    const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
    const trendColorType =
      trend === "up" ? "success" : trend === "down" ? "error" : "default";
    const trendColor = getColorByType(trendColorType, "text");

    // Get type-specific icon and color
    const iconElement = icon ? iconMap[icon] || null : null;
    const titleColor = getColorByType("default", "text");
    const valueColor = getColorByType(type, "text");

    return (
      <div
        className={`
          ${cardStyle}
          ${padding}
          ${className}
          ${md.pattern.interaction.hover}
        `}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <h3 className={`${md.type.label} text-[${md.color.neutral[600]}]`}>
            {title}
          </h3>
          {iconElement && <span className={valueColor}>{iconElement}</span>}
        </div>

        {/* Main Value */}
        <div className="mt-2 flex items-baseline">
          <p className={`${md.type.title} ${valueColor}`}>{value}</p>
          {label && (
            <span
              className={`ml-2 ${md.type.body2} text-[${md.color.neutral[500]}]`}
            >
              {label}
            </span>
          )}
        </div>

        {/* Previous Value */}
        {previousValue && (
          <div
            className={`mt-1 ${md.type.body2} text-[${md.color.neutral[500]}]`}
          >
            {comparison && <span className="mr-1">{comparison}:</span>}
            {previousValue}
            {timeframe && <span className="ml-1">({timeframe})</span>}
          </div>
        )}

        {/* Trend */}
        {trend && change !== undefined && (
          <div className="mt-2">
            <span
              className={`inline-flex items-center ${md.type.body2} ${trendColor}`}
            >
              {trendIcon} {change}%
              {description && (
                <span className={`ml-2 text-[${md.color.neutral[500]}]`}>
                  {description}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Goal Progress */}
        {goalProgress !== undefined && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span
                className={`${md.type.caption} text-[${md.color.neutral[500]}]`}
              >
                Goal: {goalValue || ""}
              </span>
              <span className={`${md.type.caption} ${valueColor}`}>
                {goalProgress}%
              </span>
            </div>
            <div
              className={`w-full h-2 bg-[${md.color.neutral[100]}] ${md.shape.full} overflow-hidden`}
            >
              <div
                className={`h-full ${getProgressBarColorByProgress(
                  type,
                  goalProgress
                )}`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Compact Mode Indicator */}
        {compact && trend && (
          <div className="mt-3 h-1 w-full bg-gray-100 rounded overflow-hidden">
            <div
              className={`h-full ${getColorByType(
                trend === "up" ? "success" : "error",
                "bg"
              )}`}
              style={{ width: `${Math.min(Math.abs(change || 0) * 2, 100)}%` }}
            />
          </div>
        )}

        {/* Sparkline Placeholder */}
        {showSparkline && (
          <div className="mt-3 h-12 w-full bg-gray-50 rounded-md flex items-center justify-center">
            <span
              className={`${md.type.caption} text-[${md.color.neutral[400]}]`}
            >
              Sparkline Chart
            </span>
          </div>
        )}
      </div>
    );
  }
}

/**
 * Get color for progress bar based on type and progress percentage
 * Uses semantic colors when available, falls back to progress-based coloring
 *
 * @param type - Card type (concept, success, primary, etc)
 * @param progress - Progress percentage (0-100)
 * @returns CSS background color class
 */
function getProgressBarColorByProgress(type: string, progress: number): string {
  // If it's a semantic type, use that color
  if (
    [
      "concept",
      "text",
      "relation",
      "exploration",
      "success",
      "error",
      "warning",
      "info",
      "primary",
      "secondary",
    ].includes(type)
  ) {
    return getColorByType(type, "bg");
  }

  // For default type, color based on progress value
  if (progress < 25) {
    return getColorByType("error", "bg");
  } else if (progress < 50) {
    return getColorByType("warning", "bg");
  } else if (progress < 75) {
    return getColorByType("info", "bg");
  } else {
    return getColorByType("success", "bg");
  }
}

// React component wrapper for convenient JSX usage
export default function StatCardForm(props: StatCardShape) {
  const statCardInstance = new StatCard(props);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const renderCard = async () => {
      const renderedContent = await statCardInstance.render(
        "edit",
        "jsx",
        {} as FormHandler
      );
      setContent(renderedContent);
    };
    renderCard();
  }, [statCardInstance, props]);

  return <>{content}</>;
}
