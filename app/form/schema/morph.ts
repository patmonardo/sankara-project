import { z } from "zod";
import { MorpheusContextSchema } from "./context";

/**
 * Implementation schema - defines how a morph is implemented at runtime
 */
export const ImplementationSchema = z.object({
  module: z.string().optional(),
  class: z.string().optional(),
  factory: z.string().optional()
});

export type Implementation = z.infer<typeof ImplementationSchema>;

/**
 * Base configuration for all morphs
 */
export const FormMorphSchema = z.object({
  // Basic information
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),

  // Type information
  inputType: z.string().default("FormShape"),
  outputType: z.string().default("FormShape"),

  // Transform function reference
  transformFn: z.string(),

  // Additional configuration
  config: z.record(z.any()).optional(),

  // Composition structure
  composition: z.object({
    type: z.enum(["single", "composite", "pipeline"]).default("single"),
    morphs: z.array(z.string()).optional(),
    compositionType: z.enum(["sequential", "parallel", "conditional"]).optional()
  }).optional(),

  // Metadata
  meta: z.record(z.any()).optional(),

  // Runtime implementation details (directly in base schema)
  implementation: ImplementationSchema.optional()
});

/**
 * Pipeline of morphs
 */
export const FormMorphPipelineSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  morphs: z.array(z.string()), // Array of morph IDs
  inputType: z.string().default("FormShape"),
  outputType: z.string().default("FormShape"),
  config: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional(),
  // Add optimization flag to the base schema
  optimized: z.boolean().optional()
});

/**
 * Result of applying a morph
 */
export const FormMorphResultSchema = z.object({
  success: z.boolean(),
  outputType: z.string(),
  output: z.any(),
  morphId: z.string(),
  context: MorpheusContextSchema,
  meta: z.record(z.any()).optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional()
  }).optional()
});

/**
 * Utility function to create a morph definition with correct types
 *
 * @param config The morph configuration
 * @returns A validated FormMorphDef object
 */
export function defineMorph(config: {
  // Required fields
  id: string;
  transformFn: string;

  // Common optional fields
  name?: string;
  description?: string;
  inputType?: string;
  outputType?: string;
  config?: Record<string, any>;
  meta?: Record<string, any>;

  // Composition (for complex morphs)
  composition?: {
    type: "single" | "composite" | "pipeline";
    morphs?: string[];
    compositionType?: "sequential" | "parallel" | "conditional";
  };

  // Implementation details (for runtime resolution)
  implementation?: {
    module?: string;
    class?: string;
    factory?: string;
  };
}): FormMorph {
  // Parse and validate with the schema
  return FormMorphSchema.parse({
    ...config,
    inputType: config.inputType || "FormShape",
    outputType: config.outputType || "FormShape"
  });
}

/**
 * Utility function to create a pipeline definition
 *
 * @param id The pipeline ID
 * @param morphIds The IDs of morphs in the pipeline
 * @param options Additional pipeline options
 * @returns A validated MorphPipelineDef object
 */
export function defineMorphPipeline(
  id: string,
  morphIds: string[],
  options: {
    name?: string;
    description?: string;
    inputType?: string;
    outputType?: string;
    config?: Record<string, any>;
    meta?: Record<string, any>;
    optimized?: boolean; // Add this line
  } = {}
): FormMorphPipeline {
  return FormMorphPipelineSchema.parse({
    id,
    morphs: morphIds,
    ...options
  });
}

export type FormMorph = z.infer<typeof FormMorphSchema>;
export type FormMorphPipeline = z.infer<typeof FormMorphPipelineSchema>;
