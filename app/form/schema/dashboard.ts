import { z } from 'zod';
import { FormShapeSchema } from './form';

/**
 * Schema for dashboard visualization components
 */

// Basic component positioning
export const PositionSchema = z.object({
  x: z.number().int().nonnegative().default(0),
  y: z.number().int().nonnegative().default(0),
  w: z.number().int().positive().default(1), // Grid width units
  h: z.number().int().positive().default(1), // Grid height units
});

// Base dashboard component schema - no form inheritance
export const DashboardComponentBaseSchema = z.object({
  id: z.string().nonempty('Component ID is required'),
  type: z.string().nonempty('Component type is required'),
  title: z.string().optional(),
  position: PositionSchema.default({ x: 0, y: 0, w: 1, h: 1 }),
  className: z.string().optional()
});

// Entity schemas
export const ConceptItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  frequency: z.number().int().nonnegative()
});

export const ExplorationItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  createdAt: z.date().or(z.string()), // Allow string for serialization
  userId: z.string()
});

// Component schemas
export const StatCardSchema = DashboardComponentBaseSchema.extend({
  type: z.literal('stat-card'),
  value: z.number().or(z.string()),
  label: z.string().optional(),
  icon: z.string().optional(),
  change: z.number().optional(),
  trend: z.enum(['up', 'down', 'neutral']).optional(),
  color: z.string().optional()
});

export const ContainerSchema = DashboardComponentBaseSchema.extend({
  type: z.literal('container'),
  children: z.array(z.any()).optional(), // Allow any content
  padding: z.boolean().default(true),
  elevated: z.boolean().default(true)
});

export const ConceptCloudSchema = DashboardComponentBaseSchema.extend({
  type: z.literal('concept-cloud'),
  concepts: z.array(ConceptItemSchema).optional(),
  maxConcepts: z.number().int().positive().default(100),
  colorBy: z.enum(['category', 'frequency']).default('category')
});

export const ExplorationsListSchema = DashboardComponentBaseSchema.extend({
  type: z.literal('explorations-list'),
  explorations: z.array(ExplorationItemSchema).optional(),
  maxItems: z.number().int().positive().default(5),
  showDescription: z.boolean().default(true)
});

// Union of all component types
export const DashboardComponentSchema = z.discriminatedUnion('type', [
  StatCardSchema,
  ContainerSchema,
  ConceptCloudSchema,
  ExplorationsListSchema
]);

// Dashboard layout schema - separate from form layout
export const DashboardLayoutSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  gridColumns: z.number().int().positive().default(12),
  className: z.string().optional()
});

// Dashboard schema - extends FormShapeSchema for integration
export const DashboardShapeSchema = FormShapeSchema.extend({
  type: z.literal('dashboard').default('dashboard'),
  layout: DashboardLayoutSchema,
  components: z.array(DashboardComponentSchema)
});

// Export types
export type Position = z.infer<typeof PositionSchema>;
export type DashboardComponentBase = z.infer<typeof DashboardComponentBaseSchema>;
export type StatCard = z.infer<typeof StatCardSchema>;
export type Container = z.infer<typeof ContainerSchema>;
export type ConceptItem = z.infer<typeof ConceptItemSchema>;
export type ConceptCloud = z.infer<typeof ConceptCloudSchema>;
export type ExplorationItem = z.infer<typeof ExplorationItemSchema>;
export type ExplorationsList = z.infer<typeof ExplorationsListSchema>;
export type DashboardComponent = z.infer<typeof DashboardComponentSchema>;
export type DashboardLayout = z.infer<typeof DashboardLayoutSchema>;
export type DashboardShape = z.infer<typeof DashboardShapeSchema>;

/**
 * Default dashboard configuration
 */
export const DEFAULT_DASHBOARD: DashboardShape = {
  type: 'dashboard',
  fields: [], // Empty fields array since dashboards don't have input fields
  state: {
    status: 'idle'
  },
  layout: {
    title: 'Sankara Knowledge Explorer',
    description: 'Explore the concepts and texts in Sankara\'s philosophy',
    gridColumns: 12,
  },
  components: [
    {
      id: 'texts-stat',
      type: 'stat-card',
      title: 'Texts',
      position: { x: 0, y: 0, w: 3, h: 1 },
      value: 0,
      label: 'works',
      icon: 'text',
      color: 'text'
    },
    {
      id: 'concepts-stat',
      type: 'stat-card',
      title: 'Concepts',
      position: { x: 3, y: 0, w: 3, h: 1 },
      value: 0,
      label: 'mapped',
      icon: 'concept',
      color: 'concept'
    },
    {
      id: 'relations-stat',
      type: 'stat-card',
      title: 'Relations',
      position: { x: 6, y: 0, w: 3, h: 1 },
      value: 0,
      label: 'links',
      icon: 'relation',
      color: 'relation'
    },
    {
      id: 'explorations-stat',
      type: 'stat-card',
      title: 'Explorations',
      position: { x: 9, y: 0, w: 3, h: 1 },
      value: 0,
      label: 'saved',
      icon: 'exploration',
      color: 'exploration'
    },
    {
      id: 'concept-cloud',
      type: 'concept-cloud',
      title: 'Key Concepts',
      position: { x: 0, y: 1, w: 8, h: 2 },
      maxConcepts: 100,
      colorBy: 'category'
    },
    {
      id: 'explorations-list',
      type: 'explorations-list',
      title: 'Recent Explorations',
      position: { x: 8, y: 1, w: 4, h: 2 },
      maxItems: 5,
      showDescription: true
    }
  ]
};
