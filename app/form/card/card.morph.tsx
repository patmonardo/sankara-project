import React from "react";
import { createMorph, createPipeline } from "@/form/morph/core";
import { cn } from "@/form/lib/utils";
import { md } from "@/form/theme/token";
import { kb } from "@/form/theme/kb";
import {
  DocumentTextIcon,
  LightBulbIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import {
  CardPrimitive,
  CardHeaderPrimitive,
  CardTitlePrimitive,
  CardIconPrimitive,
  CardContentPrimitive,
  CardValuePrimitive,
  CardLabelPrimitive,
  CardDescriptionPrimitive,
  CardTrendPrimitive,
  CardProgressPrimitive,
  CardFooterPrimitive,
  CardButtonPrimitive,
  CardGridPrimitive
} from "./primitives";
import { CardShape, StatCardShape, ContainerCardShape } from "@/form/schema/card";

// --- ICON MAP ---
const iconMap: Record<string, React.ReactNode> = {
  text: <DocumentTextIcon className="h-5 w-5" />,
  concept: <LightBulbIcon className="h-5 w-5" />,
  relation: <ArrowsRightLeftIcon className="h-5 w-5" />,
  exploration: <MagnifyingGlassIcon className="h-5 w-5" />,
  book: <BookOpenIcon className="h-5 w-5" />,
  up: <ChevronUpIcon className="h-4 w-4" />,
  down: <ChevronDownIcon className="h-4 w-4" />,
  neutral: <MinusIcon className="h-4 w-4" />,
};

// --- HELPERS ---

// Get color by type helper (simplified version of your existing function)
export function getColorByType(
  type: string,
  usage: "text" | "bg" | "border" = "text"
): string {
  // Determine the color value based on semantic type
  let colorValue: string;

  // Check for knowledge domain types
  if (["concept", "text", "relation", "exploration"].includes(type)) {
    colorValue = md.color.knowledge[type as keyof typeof md.color.knowledge];
  }
  // Check for state types
  else if (["success", "error", "warning", "info"].includes(type)) {
    colorValue = md.color.state[type as keyof typeof md.color.state];
  }
  // Check for theme colors
  else if (type === "primary") {
    colorValue = md.color.primary.main;
  } else if (type === "secondary") {
    colorValue = md.color.secondary.main;
  }
  // Default to neutral colors
  else {
    colorValue = usage === "text" ? md.color.neutral[900] : md.color.neutral[200];
  }

  // Return the appropriate CSS class based on usage
  switch (usage) {
    case "text": return `text-[${colorValue}]`;
    case "bg": return `bg-[${colorValue}]`;
    case "border": return `border-[${colorValue}]`;
    default: return `text-[${colorValue}]`;
  }
}

// --- MORPH TYPES ---

// Define input types for morphs
export interface CardMorphInput {
  shape: CardShape;
  handler?: {
    onAction?: (actionId: string, data: CardShape) => void;
  };
}

export interface StatCardMorphInput extends CardMorphInput {
  shape: StatCardShape;
}

export interface ContainerCardMorphInput extends CardMorphInput {
  shape: ContainerCardShape;
  children?: React.ReactNode;
}

// --- BASE CARD MORPHS ---

// Base Card morph - creates the basic card structure
export const CardBaseMorph = createMorph<
  CardMorphInput,
  React.ReactElement
>("CardBaseMorph", ({ shape, handler }, context) => {
  const { type = "default" } = shape.layout;
  
  // Get styling based on type
  let cardStyle = "";
  
  // Knowledge domain cards get special styling from kb helper
  if (["concept", "text", "relation", "exploration"].includes(type)) {
    switch (type) {
      case "concept": cardStyle = kb.card.concept("level2"); break;
      case "text": cardStyle = kb.card.text("level1"); break;
      case "relation": cardStyle = kb.card.relation("level1"); break;
      case "exploration": cardStyle = kb.card.exploration("level2"); break;
    }
  } else {
    // Default styling
    cardStyle = `
      ${md.elevation.level1}
      ${md.shape.medium}
      ${md.pattern.surface.elevated}
    `;
  }
  
  // Add onClick if there's a primary action
  const primaryAction = shape.layout.actions?.[0];
  const handleClick = primaryAction && handler?.onAction 
    ? () => handler.onAction(primaryAction.id, shape)
    : undefined;
  
  return (
    <CardPrimitive
      className={cardStyle}
      onClick={handleClick}
      role={handleClick ? "button" : undefined}
      tabIndex={handleClick ? 0 : undefined}
    />
  );
});

// Header morph - adds title and icon
export const CardHeaderMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("CardHeaderMorph", (element, context) => {
  const { shape } = context as CardMorphInput;
  const { title, icon, type = "default" } = shape.layout;
  
  if (!title && !icon) return element;
  
  // Get icon component
  const iconComponent = icon ? iconMap[icon] || null : null;
  
  // Get styling
  const colorClass = getColorByType(type, "text");
  const neutralTextColor = `text-[${md.color.neutral[500]}]`;
  
  const header = (
    <CardHeaderPrimitive>
      <CardTitlePrimitive className={neutralTextColor}>
        {title}
      </CardTitlePrimitive>
      {iconComponent && (
        <CardIconPrimitive className={colorClass}>
          {iconComponent}
        </CardIconPrimitive>
      )}
    </CardHeaderPrimitive>
  );
  
  // Add header to the card
  return React.cloneElement(element, {
    children: [
      header,
      <CardContentPrimitive key="content" />
    ]
  });
});

// Content morph - adds main content (value, label, description)
export const CardContentMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("CardContentMorph", (element, context) => {
  const { shape } = context as CardMorphInput;
  const { value, label, description, type = "default", trend, change } = shape.layout;
  
  // Find content element
  const children = React.Children.toArray(element.props.children);
  const contentIndex = children.findIndex(child => 
    React.isValidElement(child) && 
    child.type === CardContentPrimitive
  );
  
  if (contentIndex === -1) return element;
  
  // Styling
  const neutralTextColor = `text-[${md.color.neutral[500]}]`;
  const neutralDarkTextColor = `text-[${md.color.neutral[900]}]`;
  const trendType = trend === "up" ? "success" : trend === "down" ? "error" : "default";
  const trendIcon = trend ? iconMap[trend] : null;
  
  // Create content elements
  const valueElement = value && (
    <div className="flex items-baseline" key="value-container">
      <CardValuePrimitive className={neutralDarkTextColor}>
        {value}
      </CardValuePrimitive>
      {label && (
        <CardLabelPrimitive className={neutralTextColor}>
          {label}
        </CardLabelPrimitive>
      )}
    </div>
  );
  
  const trendElement = (trend && change !== undefined) && (
    <CardTrendPrimitive trend={trend as any} key="trend">
      {trendIcon}
      <span className="ml-1">{change}%</span>
    </CardTrendPrimitive>
  );
  
  const descriptionElement = description && (
    <CardDescriptionPrimitive key="description" className={neutralTextColor}>
      {description}
    </CardDescriptionPrimitive>
  );
  
  // Update content element with value, trend and description
  const updatedContent = React.cloneElement(
    children[contentIndex] as React.ReactElement,
    {},
    valueElement,
    trendElement,
    descriptionElement
  );
  
  // Update children array
  const updatedChildren = [...children];
  updatedChildren[contentIndex] = updatedContent;
  
  // Add footer placeholder for actions
  return React.cloneElement(element, {
    children: [
      ...updatedChildren,
      <CardFooterPrimitive key="footer" />
    ]
  });
});

// Actions morph - adds action buttons
export const CardActionsMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("CardActionsMorph", (element, context) => {
  const { shape, handler } = context as CardMorphInput;
  const actions = shape.layout.actions || [];
  
  if (actions.length === 0) return element;
  
  // Find footer element
  const children = React.Children.toArray(element.props.children);
  const footerIndex = children.findIndex(child => 
    React.isValidElement(child) && 
    child.type === CardFooterPrimitive
  );
  
  if (footerIndex === -1) return element;
  
  // Create action buttons
  const actionButtons = actions.map(action => (
    <CardButtonPrimitive
      key={action.id}
      variant={action.type as any}
      onClick={(e) => {
        e.stopPropagation(); // Prevent card click
        if (handler?.onAction) {
          handler.onAction(action.id, shape);
        }
      }}
    >
      {action.label}
    </CardButtonPrimitive>
  ));
  
  // Update footer with action buttons
  const updatedFooter = React.cloneElement(
    children[footerIndex] as React.ReactElement,
    {},
    ...actionButtons
  );
  
  // Update children array
  const updatedChildren = [...children];
  updatedChildren[footerIndex] = updatedFooter;
  
  return React.cloneElement(element, {
    children: updatedChildren
  });
});

// --- STAT CARD SPECIFIC MORPHS ---

// Stat Card Progress morph - adds progress bars and stats
export const StatCardProgressMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("StatCardProgressMorph", (element, context) => {
  const { shape } = context as StatCardMorphInput;
  const stats = shape.stats;
  
  if (!stats || !stats.goalProgress) return element;
  
  // Find content element
  const children = React.Children.toArray(element.props.children);
  const contentIndex = children.findIndex(child => 
    React.isValidElement(child) && 
    child.type === CardContentPrimitive
  );
  
  if (contentIndex === -1) return element;
  
  // Get content children
  const contentChildren = React.Children.toArray(
    (children[contentIndex] as React.ReactElement).props.children
  );
  
  // Create progress element
  const progressColor = getColorByType(shape.layout.type || 'default', 'bg');
  const progressElement = (
    <CardProgressPrimitive
      key="progress"
      progress={stats.goalProgress}
      color={progressColor}
    >
      Goal: {stats.goalValue || ''}
    </CardProgressPrimitive>
  );
  
  // Update content with progress bar
  const updatedContent = React.cloneElement(
    children[contentIndex] as React.ReactElement,
    {},
    [...contentChildren, progressElement]
  );
  
  // Update children array
  const updatedChildren = [...children];
  updatedChildren[contentIndex] = updatedContent;
  
  return React.cloneElement(element, {
    children: updatedChildren
  });
});

// --- CONTAINER CARD SPECIFIC MORPHS ---

// Container Layout morph - sets up grid/list container
export const ContainerLayoutMorph = createMorph<
  React.ReactElement,
  React.ReactElement
>("ContainerLayoutMorph", (element, context) => {
  const { shape, children } = context as ContainerCardMorphInput;
  const container = shape.container || {};
  
  // Find content element
  const elementChildren = React.Children.toArray(element.props.children);
  const contentIndex = elementChildren.findIndex(child => 
    React.isValidElement(child) && 
    child.type === CardContentPrimitive
  );
  
  if (contentIndex === -1) return element;
  
  // Get content component
  let contentElement;
  const containerLayout = container.layout || "grid";
  const columns = container.columns || 2;
  const gap = container.gap || 4;
  
  if (containerLayout === "grid") {
    contentElement = (
      <CardGridPrimitive columns={columns} gap={gap}>
        {children || (container.items || []).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded flex items-center justify-center">
            Item {i + 1}
          </div>
        ))}
      </CardGridPrimitive>
    );
  } else if (containerLayout === "list") {
    contentElement = (
      <div className={`flex flex-col gap-${gap}`}>
        {children || (container.items || []).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded flex items-center px-4">
            Item {i + 1}
          </div>
        ))}
      </div>
    );
  } else { // carousel
    contentElement = (
      <div className={`flex overflow-x-auto gap-${gap} snap-x`}>
        {children || (container.items || []).map((_, i) => (
          <div key={i} className="min-w-[200px] h-32 bg-gray-100 rounded flex items-center justify-center snap-start">
            Item {i + 1}
          </div>
        ))}
      </div>
    );
  }
  
  // Update content with container layout
  const updatedContent = React.cloneElement(
    elementChildren[contentIndex] as React.ReactElement,
    {},
    contentElement
  );
  
  // Update children array
  const updatedChildren = [...elementChildren];
  updatedChildren[contentIndex] = updatedContent;
  
  return React.cloneElement(element, {
    children: updatedChildren
  });
});

// --- PIPELINES ---

// Standard Card Pipeline
export const CardPipeline = createPipeline<CardMorphInput, React.ReactElement>("CardPipeline")
  .pipe(CardBaseMorph)
  .pipe(CardHeaderMorph)
  .pipe(CardContentMorph)
  .pipe(CardActionsMorph)
  .build();

// Stat Card Pipeline
export const StatCardPipeline = createPipeline<StatCardMorphInput, React.ReactElement>("StatCardPipeline")
  .pipe(CardBaseMorph)
  .pipe(CardHeaderMorph)
  .pipe(CardContentMorph)
  .pipe(StatCardProgressMorph)
  .pipe(CardActionsMorph)
  .build();

// Container Card Pipeline
export const ContainerCardPipeline = createPipeline<ContainerCardMorphInput, React.ReactElement>("ContainerCardPipeline")
  .pipe(CardBaseMorph)
  .pipe(CardHeaderMorph)
  .pipe(CardContentMorph)
  .pipe(ContainerLayoutMorph)
  .pipe(CardActionsMorph)
  .build();