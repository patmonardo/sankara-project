import { z } from "zod";
import { NeoComponentId } from "@/neo/extension";

/**
 * PropertyScriptType - Defines the types of scripts a property can execute
 */
export const PropertyScriptTypeSchema = z.enum([
  "getter",      // Gets a value
  "setter",      // Sets a value
  "transformer", // Transforms data
  "validator",   // Validates data
  "calculator",  // Computes a value
  "generator",   // Generates new content
  "predicate",   // Tests a condition
  "reducer",     // Reduces multiple values to one
]);

export type PropertyScriptType = z.infer<typeof PropertyScriptTypeSchema>;

/**
 * PropertyScript - A script that executes within a Context
 * 
 * Property Scripts operate as the Essential Being of Thingness - they
 * mediate between essence and existence, operating within the realm
 * of Appearance and Essential Relation.
 */
export const PropertyScriptSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  
  // Classification
  scriptType: PropertyScriptTypeSchema,
  
  // Execution
  contextId: z.string(),
  code: z.any(), // Use z.any() instead of z.function().or(z.string()) to avoid TS confusion
  
  // Input/Output
  input: z.record(z.any()).optional(),
  output: z.record(z.any()).optional(),
  
  // Dependencies
  dependencies: z.array(z.string()).optional(),
  
  // Connection to Form
  formId: z.string().optional(),
  entityId: z.string().optional(),
  relationId: z.string().optional(),
  
  // Execution options
  caching: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().optional(),
  }).optional(),
  
  // Metadata
  created: z.date().default(() => new Date()),
  updated: z.date().default(() => new Date()),
});

export type PropertyScript = z.infer<typeof PropertyScriptSchema>;