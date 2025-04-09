import { z } from "zod";
import { FormActionSchema, FormSectionSchema, FormShapeSchema } from "./form";

// Schema for card layouts (without statistical properties)
export const CardLayoutSchema = z.object({
  // Form-compatible properties
  title: z.string().min(1, "Title is required"),
  columns: z.enum(["single", "double"]).default("single"),
  actions: z.array(FormActionSchema).default([]), // Use this instead of onClick
  sections: z.array(FormSectionSchema).optional(),

  // Card-specific properties
  label: z.string().optional(),
  type: z
    .enum([
      "default",
      "primary",
      "secondary",
      "success",
      "warning",
      "danger",
      "info",
    ])
    .default("default"),
  icon: z.string().optional(),
  description: z.string().optional(),
  className: z.string().optional(),
  compact: z.boolean().optional(),
  highlighted: z.boolean().optional(),
});

// The base card shape (without statistical properties)
export const CardShapeSchema = FormShapeSchema.extend({
  layout: CardLayoutSchema,
});

// Schema for statistical cards (with trend and value-related properties)
export const StatCardSchema = CardShapeSchema.extend({
  stats: z.object({
    value: z.string(), // The main value to display
    trend: z.enum(["up", "down", "neutral"]).optional(),
    change: z.number().optional(),
    previousValue: z.string().optional(),
    timeframe: z.string().optional(),
    comparison: z.string().optional(),
    showSparkline: z.boolean().optional(),
    precision: z.number().optional(),
    goalValue: z.string().optional(),
    goalProgress: z.number().min(0).max(100).optional(),
  }),
});

// Container card schema remains the same
export const ContainerCardSchema = CardShapeSchema.extend({
  container: z
    .object({
      items: z.array(z.unknown()),
      layout: z.enum(["grid", "list", "carousel"]).default("grid"),
      columns: z.number().min(1).max(4).default(2),
      gap: z.number().default(4),
      responsive: z.boolean().default(true),
    })
    .optional(),
});

export type CardShape = z.infer<typeof CardShapeSchema>;
export type StatCardShape = z.infer<typeof StatCardSchema>;
export type ContainerCardShape = z.infer<typeof ContainerCardSchema>;
