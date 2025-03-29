//@/lib/data/schema/base.ts
import { z } from 'zod'

// Base Schema (all entities have these properties)
export const BaseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

// Base State (runtime state)
export const BaseStateSchema = z.object({
  status: z.enum(['active', 'archived', 'deleted']),
  validation: z.record(z.array(z.string())).optional(),
  message: z.string().optional()
})

// Base Shape (Structure + State)
export const BaseShapeSchema = z.object({
  base: BaseSchema,
  state: BaseStateSchema
})

export type OperationResult<T> =
  | { data: T; status: "success"; message: string; }
  | { data: null; status: "error"; message: string; errors?: Record<string, string[]>; };

export function flattenZodErrors(
  formatted: z.ZodFormattedError<any>
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  // Handle missing input
  if (!formatted) return result;

  // Process each field
  for (const [field, error] of Object.entries(formatted)) {
    // Skip the special _errors field - we'll handle it differently
    if (field === "_errors") continue;

    // If this field has direct errors, add them
    if (error && "_errors" in error && Array.isArray(error._errors) && error._errors.length > 0) {
      result[field] = error._errors;
    }

    // If this field has nested errors (object), recursively process them
    if (error && typeof error === "object" && !Array.isArray(error) && !("_errors" in error)) {
      const nestedErrors = flattenZodErrors(error as z.ZodFormattedError<any>);

      // Add nested errors with path prefixing
      for (const [nestedField, messages] of Object.entries(nestedErrors)) {
        result[`${field}.${nestedField}`] = messages;
      }
    }
  }

  // Add top-level errors with special key if desired
  if (formatted._errors && formatted._errors.length > 0) {
    result["_form"] = formatted._errors;
  }

  return result;
}

// Base monetary value
export const MonetarySchema = z.object({
  amount: z.number(),
  currency: z.string().default('USD')
})

// Base time period
export const PeriodSchema = z.object({
  startDate: z.date(),
  endDate: z.date().optional()
})

export type Base = z.infer<typeof BaseSchema>
export type BaseState = z.infer<typeof BaseStateSchema>
export type BaseShape = z.infer<typeof BaseShapeSchema>
export type Monetary = z.infer<typeof MonetarySchema>
export type Period = z.infer<typeof PeriodSchema>
