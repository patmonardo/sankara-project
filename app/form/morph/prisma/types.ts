import { GraphShape } from "../graph/types";
import { FormMeta } from "../../schema/shape";

/**
 * PrismaShape extends GraphShape to include Prisma-specific query definitions.
 */
export interface PrismaShape extends GraphShape {
  // Array of generated Prisma queries or mutation definitions.
  prismaQueries: PrismaQuery[];
  
  // Any additional intrinsic properties for Prisma generation.
  generatedAt?: string;
  queryCount?: number;
  
  // Optionally, concise auxiliary metadata.
  meta?: Partial<FormMeta>;
}

/**
 * Represents a single Prisma query (or mutation).
 */
export interface PrismaQuery {
  id: string;
  name: string;
  query: string;
  purpose: "create" | "read" | "update" | "delete" | "custom";
}

/**
 * Context for the Prisma morph.
 */
export interface PrismaContext {
  // Any extension-specific configuration, such as mapping rules.
  prismaConfig?: {
    defaultModel?: string;
    // ...other options...
  };
}