import { z } from "zod";
import { FormShapeSchema, FormFieldSchema } from "./shape";

const EntityFieldSchema = FormFieldSchema.extend({
  /**
   * Unique identifier for the field.
   */
  id: z.string().uuid(),

  /**
   * The value of the field, which can be of any type.
   */
  value: z.any(),
});


/**
 * EntityShapeSchema - Represents the instance data (Contained) for an entity.
 * It holds the specific values for an entity, structured according to a
 * corresponding FormShape definition.
 */
export const EntityShapeSchema = FormShapeSchema.extend({
  /**
   * Unique identifier for this specific entity instance.
   */
  id: z.string().uuid(),
  name: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  kind: z.string(),

  /**
   * The ID of the FormShape that defines the structure and rules for this entity instance.
   * This links the Contained instance data to its Container definition.
   */
  formId: z.string().uuid(),
  
  /**
   * Optional tags specific to this entity instance.
   */
  tags: z.array(z.string()).optional(),

  fields: z.array(EntityFieldSchema).optional(),

  /**
   * Optional state information specific to this entity instance.
   */
  state: z.record(z.string(), z.any()).optional(),

  /**
   * Timestamp when this entity instance was created.
   */
  createdAt: z.string().datetime().optional(),

  /**
   * Timestamp when this entity instance was last updated.
   */
  updatedAt: z.string().datetime().optional(),

  // Consider adding versioning if needed for optimistic locking
  // version: z.number().int().optional(),

  // Maybe owner/permission info if applicable at instance level
  // ownerId: z.string().optional(),
});

// Export the inferred type
export type EntityField = z.infer<typeof EntityFieldSchema>;
export type EntityShape = z.infer<typeof EntityShapeSchema>;
