import { z } from "zod";

/**
 * DisplayShape - The presentation model ready for rendering
 *
 * This is the output of the form transformation pipeline and
 * serves as the input to the UI rendering system.
 */
export const DisplayShapeSchema = z.object({
  // Core display properties
  type: z.string(),
  component: z.string(),

  // Component props
  props: z.object({
    id: z.string(),

    // Field definitions
    fields: z.array(z.object({
      id: z.string(),
      component: z.string(),
      props: z.record(z.any())
    })),

    // Optional styling properties
    className: z.string().optional(),
    style: z.record(z.any()).optional(),

    // Mode information
    mode: z.enum(["view", "edit", "create"]).optional(),

    // Other component-specific props
    [z.string().optional()]: z.any(),
  }),

  // Metadata
  meta: z.record(z.any()).optional(),
});

export type DisplayShape = z.infer<typeof DisplayShapeSchema>;

/**
 * FieldDisplayShape - The display representation of a single field
 */
export const FieldDisplayShapeSchema = z.object({
  id: z.string(),
  component: z.string(),
  props: z.record(z.any()),
});

export type FieldDisplayShape = z.infer<typeof FieldDisplayShapeSchema>;

/**
 * Display components registry
 */
export const standardComponents = [
  'FormView',
  'FormEdit',
  'FormCreate',
  'TextField',
  'NumberField',
  'BooleanField',
  'DateField',
  'SelectField',
  'TextAreaField',
  'ObjectField',
  'ArrayField',
] as const;

export type StandardComponent = typeof standardComponents[number];

/**
 * Helper function to check if a component is a standard component
 */
export function isStandardComponent(component: string): component is StandardComponent {
  return standardComponents.includes(component as StandardComponent);
}
