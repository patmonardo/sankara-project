import { z } from 'zod';
import { EntityTypeSchema, EntityInstanceSchema, EntityStateSchema } from './entity';

//------------------------------------------------
// CHARACTERISTIC SYSTEM: Judgment as Determinateness
//------------------------------------------------

// Database column types (physical determinations)
export const ColumnTypeSchema = z.enum([
  'varchar',
  'text',
  'integer',
  'decimal',
  'boolean',
  'date',
  'timestamp',
  'json',
  'uuid',
  'blob'
]);

export type ColumnType = z.infer<typeof ColumnTypeSchema>;

// Storage mapping schema (property to column mappings)
export const ColumnMappingSchema = z.object({
  property: z.string(),  // Property name
  column: z.string(),    // Column name (defaults to property name)
  type: ColumnTypeSchema, // Physical storage type
  length: z.number().optional(),
  precision: z.number().optional(),
  scale: z.number().optional(),
  nullable: z.boolean().optional().default(true),
  defaultValue: z.string().optional(),
});

export type ColumnMapping = z.infer<typeof ColumnMappingSchema>;

// Index schema (performance characteristic)
export const IndexSchema = z.object({
  name: z.string(),
  columns: z.array(z.string()),
  type: z.enum(['btree', 'hash', 'gin', 'gist']).optional(),
  unique: z.boolean().optional().default(false),
});

export type Index = z.infer<typeof IndexSchema>;

// Constraint schema (integrity characteristic)
export const ConstraintSchema = z.object({
  name: z.string(),
  type: z.enum(['primary', 'unique', 'foreign', 'check']),
  columns: z.array(z.string()),
  references: z.object({
    table: z.string(),
    columns: z.array(z.string()),
  }).optional(),
  expression: z.string().optional(),
  onDelete: z.enum(['cascade', 'restrict', 'set null', 'no action']).optional(),
  onUpdate: z.enum(['cascade', 'restrict', 'set null', 'no action']).optional(),
});

export type Constraint = z.infer<typeof ConstraintSchema>;

// Table Type Schema - Definition of table characteristics
export const TableTypeSchema = EntityTypeSchema.extend({
  // Storage characteristics
  tableName: z.string().optional(),  // Physical table name
  schema: z.string().optional().default('public'),  // Database schema

  // Column mappings (property to physical storage)
  columns: z.record(ColumnMappingSchema).optional(),

  // Performance characteristics
  indexes: z.array(IndexSchema).optional(),

  // Integrity characteristics
  constraints: z.array(ConstraintSchema).optional(),

  // Storage characteristics
  options: z.record(z.string()).optional(),  // Database-specific options

  // Evolution characteristics
  version: z.number().int().optional().default(1),
  migrations: z.array(z.string()).optional(),  // Migration history
});

// Table Instance Schema - An entity in table storage
export const TableInstanceSchema = EntityInstanceSchema.extend({
  // Storage version
  _version: z.number().int().optional(),

  // Storage metadata
  _storageInfo: z.object({
    partition: z.string().optional(),
    lastSync: z.date().optional(),
  }).optional(),
});

// Table State Schema - Table record lifecycle
export const TableStateSchema = EntityStateSchema.extend({
  // Storage state characteristics
  isDirty: z.boolean().optional().default(false),  // Has unsaved changes
  isLocked: z.boolean().optional().default(false), // Is being edited
  lastSyncedAt: z.date().optional(),  // When last synced with storage
});

// Table Shape Schema - Complete table record
export const TableShapeSchema = z.object({
  base: TableInstanceSchema,
  state: TableStateSchema
});

// Export types
export type TableType = z.infer<typeof TableTypeSchema>;
export type TableInstance = z.infer<typeof TableInstanceSchema>;
export type TableState = z.infer<typeof TableStateSchema>;
export type TableShape = z.infer<typeof TableShapeSchema>;

//------------------------------------------------
// TABLE SERVICE INTERFACE: Operations on Tables
//------------------------------------------------

export interface TableService {
  // Table type operations
  registerTableType(tableType: Omit<TableType, 'id' | 'createdAt' | 'updatedAt'>): TableType;
  getTableType(id: string): TableType | undefined;

  // Table instance operations
  createTable(tableId: string, data: Record<string, any>): Promise<TableInstance>;
  getTable(tableId: string, id: string): Promise<TableInstance | null>;
  updateTable(tableId: string, id: string, data: Record<string, any>): Promise<TableInstance>;
  deleteTable(tableId: string, id: string): Promise<boolean>;
  queryTables(tableId: string, query: any): Promise<TableInstance[]>;

  // Schema operations
  createTableSchema(tableTypeId: string): Promise<void>;
  updateTableSchema(tableTypeId: string): Promise<void>;
  dropTableSchema(tableTypeId: string): Promise<void>;
}
