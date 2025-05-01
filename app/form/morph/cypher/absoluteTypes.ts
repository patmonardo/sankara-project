import { GraphShape } from "../graph/types";
import { FormMeta } from "../../schema/shape";

/**
 * AbsoluteCypherShape – a relational version of CypherShape.
 * Instead of bundling relational info into meta, we map entities and relationships explicitly.
 */
export interface AbsoluteCypherShape extends GraphShape {
  queries: CypherQuery[];
  parameters: Record<string, any>;
  generatedAt?: string;
  queryCount?: number;

  // Relational mappings (e.g., foreign key relationships, join associations)
  entities: AbsoluteCypherEntity[];
  relationships: AbsoluteCypherRelationship[];

  // Auxiliary meta for non-intrinsic data.
  meta?: Partial<FormMeta>;
}

export interface AbsoluteCypherEntity {
  id: string;
  label: string;
  properties?: Record<string, any>;
  // Explicit relational links—for example, connecting to related entities.
  relatedEntityIds?: string[];
}

export interface AbsoluteCypherRelationship {
  id: string;
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
}

export interface CypherQuery {
  id: string;
  name: string;
  query: string;
  purpose: "create" | "read" | "update" | "delete" | "schema" | "custom";
}