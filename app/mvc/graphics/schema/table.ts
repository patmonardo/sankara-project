import { z } from "zod";

// Define TableMode type
export const TableModeSchema = z.enum(["list", "detail"]).default("list");

// Define TableContent type
export const TableContentSchema = z.enum(["jsx", "json"]).default("jsx");

// Column definition
export const TableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  className: z.string().optional(),
  width: z.string().optional(),
  sortable: z.boolean().optional().default(false),
  filterable: z.boolean().optional().default(false),
});

// Action definition
export const TableActionSchema = z.object({
  id: z.string(),
  type: z.enum(["edit", "delete", "view", "custom"]),
  label: z.string().optional(),
  icon: z.string().optional(),
  variant: z
    .enum(["primary", "secondary", "ghost"])
    .default("secondary")
    .optional(),
});

// Table layout
export const TableLayoutSchema = z.object({
  title: z.string(),
  searchable: z.boolean().optional().default(true),
  responsive: z.boolean().optional().default(true),
  striped: z.boolean().optional().default(false),
  hoverable: z.boolean().optional().default(false),
  paginated: z.boolean().optional().default(true),
  addButton: z
    .object({
      label: z.string(),
      href: z.string(),
      icon: z.string().default("plus").optional(),
    })
    .optional(),
});

// Table state
export const TableStateSchema = z.object({
  status: z.enum(["idle", "loading", "error", "success"]),
  message: z.string().optional(),
  page: z.number().default(1).optional(),
  totalPages: z.number().optional().default(1),
  sortColumn: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

// Complete table definition
export const TableShapeSchema = z.object({
  columns: z.array(TableColumnSchema),
  layout: TableLayoutSchema,
  state: TableStateSchema,
  actions: z.array(TableActionSchema).optional(),
});

// Export types from schemas
export type TableData = Record<string, any>;
export type TableMode = z.infer<typeof TableModeSchema>;
export type TableContent = z.infer<typeof TableContentSchema>;
export type TableColumn = z.infer<typeof TableColumnSchema>;
export type TableAction = z.infer<typeof TableActionSchema>;
export type TableLayout = z.infer<typeof TableLayoutSchema>;
export type TableState = z.infer<typeof TableStateSchema>;
export type TableShape = z.infer<typeof TableShapeSchema>;

export function defineTable(config: Partial<TableShape>): TableShape {
  // Instead of manually building the object, let Zod parse and validate
  return TableShapeSchema.parse({
    columns: config.columns || [],
    layout: {
      title: config.layout?.title || "Data Table",
      // Don't manually default these - let Zod handle it
      responsive: config.layout?.responsive,
      searchable: config.layout?.searchable,
      striped: config.layout?.striped,
      hoverable: config.layout?.hoverable,
      paginated: config.layout?.paginated,
      addButton: config.layout?.addButton,
    },
    state: {
      status: config.state?.status || "idle",
      // Let Zod handle the defaults
      page: config.state?.page,
      totalPages: config.state?.totalPages,
      message: config.state?.message,
      sortColumn: config.state?.sortColumn,
      sortDirection: config.state?.sortDirection,
    },
    actions: config.actions || [],
  } as Partial<TableShape>);
}
