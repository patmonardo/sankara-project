import { z } from 'zod';
import { FormLayoutSchema, FormShapeSchema } from './form';

// Card types
export const CardTypeSchema = z.enum([
  'default',
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'info',
  'concept',
  'text',
  'relation',
  'exploration',
]);

// Card schema
export const CardLayoutSchema = FormLayoutSchema.extend({
  type: CardTypeSchema.optional().default('default'),
  title: z.string(),
  value: z.string().or(z.number()),
  label: z.string().optional(),
  icon: z.string().optional(),
  trend: z.enum(['up', 'down', 'neutral']).optional(),
  change: z.number().optional(),
  description: z.string().optional(),
  className: z.string().optional(),
  onClick: z.function().args(z.any()).returns(z.void()).optional(),
});

export const CardShapeSchema = FormShapeSchema.extend({
  layout: CardLayoutSchema
});

// ContainerCard schema for wrapping content
export const ContainerCardLayoutSchema = CardLayoutSchema.extend({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  headerAction: z.any().optional(), // Can be any React node
  footerAction: z.any().optional(), // Can be any React node
  padding: z.boolean().default(true),
  elevated: z.boolean().default(true),
  bordered: z.boolean().default(false),
  contentClassName: z.string().optional(),
  headerClassName: z.string().optional(),
  footerClassName: z.string().optional(),
});

export const ContainerCardShapeSchema = CardShapeSchema.extend({
  layout: ContainerCardLayoutSchema
});

// StatCard schema is a specialized Card
export const StatCardLayoutSchema = CardLayoutSchema.extend({
  compact: z.boolean().optional().default(false),
  highlighted: z.boolean().optional().default(false),
});

export const StatCardShapeSchema = CardShapeSchema.extend({
  layout: StatCardLayoutSchema
});

/**
 * Card schema builder for knowledge graph visualization
 */
export class CardSchemaBuilder {
  private schema: Partial<CardShape>;

  constructor(title: string, description?: string) {
    this.schema = {
      title,
      description,
      layout: {
        title,
        type: 'default',
        value: '',
        columns: 'single',
        actions: []
      },
      fields: {}
    };
  }

  /**
   * Link this card to a knowledge entity
   */
  entity(entityId: string): CardSchemaBuilder {
    this.schema.entity = entityId;
    return this;
  }

  /**
   * Set the visual type of this card
   */
  type(cardType: CardType): CardSchemaBuilder {
    if (this.schema.layout) {
      this.schema.layout.type = cardType;
    }
    return this;
  }

  /**
   * Set the primary value displayed on the card
   */
  value(val: string | number): CardSchemaBuilder {
    if (this.schema.layout) {
      this.schema.layout.value = val;
    }
    return this;
  }

  /**
   * Set a label for the value
   */
  label(text: string): CardSchemaBuilder {
    if (this.schema.layout) {
      this.schema.layout.label = text;
    }
    return this;
  }

  /**
   * Add an icon to the card
   */
  icon(iconName: string): CardSchemaBuilder {
    if (this.schema.layout) {
      this.schema.layout.icon = iconName;
    }
    return this;
  }

  /**
   * For stat cards, set trend information
   */
  trend(direction: 'up' | 'down' | 'neutral', changeValue?: number): CardSchemaBuilder {
    if (this.schema.layout) {
      this.schema.layout.trend = direction;
      if (changeValue !== undefined) {
        this.schema.layout.change = changeValue;
      }
    }
    return this;
  }

  /**
   * Add a section to organize fields on the card
   */
  section(title: string, fieldIds: string[], description?: string): CardSchemaBuilder {
    if (!this.schema.layout) {
      this.schema.layout = {
        title: this.schema.title || '',
        type: 'default',
        value: '',
        columns: 'single',
        actions: []
      };
    }

    this.schema.layout.sections = this.schema.layout.sections || [];
    this.schema.layout.sections.push({
      title,
      description,
      fields: fieldIds,
      collapsible: false,
      collapsed: false
    });
    return this;
  }

  /**
   * Add an action to the card (like navigation or edit)
   */
  action(config: {
    label: string;
    action: string;
    target?: string;
    icon?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
  }): CardSchemaBuilder {
    // Add to layout actions for rendering
    if (this.schema.layout) {
      this.schema.layout.actions = this.schema.layout.actions || [];
      this.schema.layout.actions.push({
        id: config.action,
        type: 'button' as const,
        label: config.label,
        variant: config.variant || 'primary'
      });
    }

    // Add to card actions for behavior
    this.schema.actions = this.schema.actions || [];
    this.schema.actions.push({
      label: config.label,
      action: config.action,
      target: config.target,
      icon: config.icon
    });

    return this;
  }

  /**
   * Set a CSS class for the card
   */
  className(cssClass: string): CardSchemaBuilder {
    if (this.schema.layout) {
      this.schema.layout.className = cssClass;
    }
    return this;
  }

  /**
   * Set a click handler for the entire card
   */
  onClick(handler: (event: any) => void): CardSchemaBuilder {
    if (this.schema.layout) {
      this.schema.layout.onClick = handler;
    }
    return this;
  }

  /**
   * Convert to a container card
   */
  asContainer(options?: {
    subtitle?: string;
    padding?: boolean;
    elevated?: boolean;
    bordered?: boolean;
    headerAction?: any;
    footerAction?: any;
    contentClassName?: string;
    headerClassName?: string;
    footerClassName?: string;
  }): CardSchemaBuilder {
    const currentLayout = this.schema.layout || {
      title: this.schema.title || '',
      type: 'default',
      value: '',
      columns: 'single',
      actions: []
    };

    // Apply container-specific properties
    const containerLayout = {
      ...currentLayout,
      subtitle: options?.subtitle,
      padding: options?.padding !== undefined ? options.padding : true,
      elevated: options?.elevated !== undefined ? options.elevated : true,
      bordered: options?.bordered !== undefined ? options.bordered : false,
      headerAction: options?.headerAction,
      footerAction: options?.footerAction,
      contentClassName: options?.contentClassName,
      headerClassName: options?.headerClassName,
      footerClassName: options?.footerClassName
    };

    this.schema.layout = containerLayout;
    return this;
  }

  /**
   * Convert to a stat card
   */
  asStat(options?: {
    compact?: boolean;
    highlighted?: boolean;
  }): CardSchemaBuilder {
    const currentLayout = this.schema.layout || {
      title: this.schema.title || '',
      type: 'default',
      value: '',
      columns: 'single',
      actions: []
    };

    // Apply stat-specific properties
    const statLayout = {
      ...currentLayout,
      compact: options?.compact !== undefined ? options.compact : false,
      highlighted: options?.highlighted !== undefined ? options.highlighted : false
    };

    this.schema.layout = statLayout;
    return this;
  }

  /**
   * Build the final card schema
   */
  build(): CardShape {
    // Ensure required fields
    if (!this.schema.title) {
      throw new Error('Card title is required');
    }

    if (!this.schema.layout?.title) {
      throw new Error('Card layout title is required');
    }

    // Ensure value exists (required by your schema)
    if (this.schema.layout && !('value' in this.schema.layout)) {
      this.schema.layout.value = '';  // Default empty value
    }

    return this.schema as CardShape;
  }
}

/**
 * Create a new card schema with the builder pattern
 */
export function defineCard(title: string, description?: string): CardSchemaBuilder {
  return new CardSchemaBuilder(title, description);
}

// Additional helpers for common card types
export function defineEntityCard(entityType: string, title: string, description?: string): CardSchemaBuilder {
  return defineCard(title, description)
    .entity(entityType)
    .type(entityType as CardType);
}

export function defineStatCard(title: string, value: string | number, options?: {
  label?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  highlighted?: boolean;
  compact?: boolean;
}): CardSchemaBuilder {
  const card = defineCard(title)
    .value(value)
    .asStat({
      highlighted: options?.highlighted,
      compact: options?.compact
    });

  if (options?.label) {
    card.label(options.label);
  }

  if (options?.trend) {
    card.trend(options.trend, options.change);
  }

  return card;
}

export function defineContainerCard(title: string, subtitle?: string): CardSchemaBuilder {
  return defineCard(title)
    .value('') // Required by schema
    .asContainer({
      subtitle,
      elevated: true,
      padding: true
    });
}

// Type definitions for the card system
export type CardType = z.infer<typeof CardTypeSchema>;
export type CardLayout = z.infer<typeof CardLayoutSchema>;
export type CardShape = z.infer<typeof CardShapeSchema>;
export type ContainerCardLayout = z.infer<typeof ContainerCardLayoutSchema>;
export type ContainerCardShape = z.infer<typeof ContainerCardShapeSchema>;
export type StatCardLayout = z.infer<typeof StatCardLayoutSchema>;
export type StatCardShape = z.infer<typeof StatCardShapeSchema>;
export type CardAction = { label: string; action: string; target?: string; icon?: string; };
