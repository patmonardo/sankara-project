import { createMorph } from "../core";
import { createPipeline } from "../core";
import {  ValueShape,  ValueField,  ValueContext } from "./value";

export interface FilterField extends  ValueField {
  value: any;
  filterApplied?: boolean;
  filterReasons?: string[];
  orderPosition?: number;
  orderDirection?: string;
  limitApplied?: boolean;
  skipValue?: number | null;
  limitValue?: number | null;
}

export interface FilterShape extends  ValueShape {
  fields: FilterField[];
  filterApplied?: boolean;
  filterCriteria?: string[];
  orderApplied?: boolean;
  orderCriteria?: string[];
  paginationBefore?: number;
  paginationAfter?: number;
  paginationSkip?: number;
  paginationLimit?: number;
}

/**
 * FilterContext – Context for filter processing.
 */
export interface FilterContext extends  ValueContext {
  filterValues?: Record<string, any>;
  filterFields?: string[];
  filterWhere?: string[];
  filterConditions?: string[];
  filterOrder?: string[];
  filterLimit?: number;
  filterSkip?: number;
  filterGroupBy?: string[];
  filterHaving?: string[];
  filterAggregate?: string[];
}

/**
 * Type guard to check if context is a valid  ValueContext.
 */
export function isFilterContext(context: any): context is FilterContext {
  return true;
}

export const FilterWhereMorph = createMorph<FilterShape, FilterShape>(
  "FilterWhereMorph",
  (shape, context) => {
    if (!isFilterContext(context)) return shape;

    // Get filter conditions from context
    const {
      filterValues = {}, // Values to filter by (key-value pairs)
      filterFields = [], // Explicit field IDs to include
      filterWhere = [], // Custom where conditions
    } = context;

    // First, determine if we're in include or exclude mode
    const includeMode = filterFields.length > 0;

    // Apply filtering
    const filteredFields = shape.fields.filter((field) => {
      if (!field.id) return true; // Always include fields without IDs

      // STEP 1: Check if field is explicitly included/excluded
      if (includeMode) {
        if (!filterFields.includes(field.id)) return false;
      }

      // STEP 2: Apply WHERE conditions if present
      for (const condition of filterWhere) {
        // Simple condition format: "fieldId:operator:value"
        // Example: "age:>:18" or "status:==:active"
        if (condition.startsWith(`${field.id}:`)) {
          const [_, operator, value] = condition.split(":");
          const fieldValue = field.value;

          // Process comparison operators
          switch (operator) {
            case "==":
              return fieldValue == value;
            case "!=":
              return fieldValue != value;
            case ">":
              return fieldValue > Number(value);
            case "<":
              return fieldValue < Number(value);
            case ">=":
              return fieldValue >= Number(value);
            case "<=":
              return fieldValue <= Number(value);
            case "contains":
              return String(fieldValue).includes(value);
            case "startsWith":
              return String(fieldValue).startsWith(value);
            case "endsWith":
              return String(fieldValue).endsWith(value);
            default:
              return true; // Unknown operator, include by default
          }
        }
      }

      // STEP 3: Check filter values if present
      if (field.id in filterValues) {
        return field.value === filterValues[field.id];
      }

      // If we get here, include the field (unless in include mode)
      return !includeMode;
    });
    
    // Now transform the fields to include filter metadata as direct properties
    const whereFields = filteredFields.map((field) => {
      // Skip fields without an identifier
      if (!field.id) return field;

      const fieldApplied = 
        field.id in filterValues ||
        filterFields.includes(field.id) ||
        filterWhere.some((c) => c.startsWith(`${field.id}:`));
          
      return {
        ...field,
        filtered: true,
        filterApplied: fieldApplied,
        filterReasons: getFilterReasons(field, filterValues, filterFields, filterWhere)
      };
    });

    return {
      ...shape,
      fields: whereFields,
      filterApplied: true,
      filterCriteria: [
        ...filterFields, 
        ...Object.keys(filterValues),
        ...filterWhere
      ]
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
  }
);

export const FilterOrderMorph = createMorph<FilterShape, FilterShape>(
  "FilterOrderMorph",
  (shape, context) => {
    if (!isFilterContext(context)) {
      throw new Error("FilterOrderMorph requires a valid FilterContext");
    }

    // Get order specifications from context
    const { filterOrder = [] } = context;

    // Return early if no ordering is specified
    if (filterOrder.length === 0) {
      return shape;
    }

    // Clone fields for sorting
    let orderFields = [...shape.fields];

    // Process sort specifications - format: "fieldId:direction"
    // ... existing sorting code ...

    // Add metadata to fields as direct properties
    const fieldsWithOrder = orderFields.map((field, index) => ({
      ...field,
      orderPosition: index,
      orderApplied: true,
      orderDirection: getFieldOrderDirection(field, filterOrder)
    }));

    return {
      ...shape,
      fields: fieldsWithOrder,
      orderApplied: true,
      orderCriteria: filterOrder
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
  }
);

export const FilterLimitMorph = createMorph<FilterShape, FilterShape>(
  "FilterLimitMorph",
  (shape, context) => {
    if (!isFilterContext(context)) {
      throw new Error("FilterLimitMorph requires a valid FilterContext");
    }

    // Get limit and skip values from context
    const {
      filterLimit = 0,
      filterSkip = 0,
    } = context;

    // Return early if no limit or skip is specified
    if (filterLimit <= 0 && filterSkip <= 0) {
      return shape;
    }

    // Apply skip and limit
    let limitedFields = shape.fields;

    // Apply skip first (if specified)
    if (filterSkip > 0) {
      limitedFields = limitedFields.slice(filterSkip);
    }

    // Then apply limit (if specified)
    if (filterLimit > 0) {
      limitedFields = limitedFields.slice(0, filterLimit);
    }

    // Add pagination info directly to fields
    const fieldsWithLimit = limitedFields.map((field) => ({
      ...field,
      limitApplied: true,
      skipValue: filterSkip > 0 ? filterSkip : null,
      limitValue: filterLimit > 0 ? filterLimit : null
    }));

    return {
      ...shape,
      fields: fieldsWithLimit,
      paginationBefore: shape.fields.length,
      paginationAfter: limitedFields.length,
      paginationSkip: filterSkip,
      paginationLimit: filterLimit
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
  }
);

// Helper function to get filter reasons
function getFilterReasons(field: FilterField, filterValues: Record<string, any>, 
                         filterFields: string[], filterWhere: string[]): string[] {
  if (!field.id) return [];
  
  const reasons: string[] = [];
  if (field.id in filterValues) {
    reasons.push('value-match');
  }
  if (filterFields.includes(field.id)) {
    reasons.push('explicit-include');
  }
  
  // Add where conditions that applied to this field
  const whereConditions = filterWhere
    .filter(c => c.startsWith(`${field.id}:`))
    .map(c => `where-${c.split(':')[1]}`);
    
  return [...reasons, ...whereConditions];
}

// Helper function to determine field order direction
function getFieldOrderDirection(field: FilterField, filterOrder: string[]): string | undefined {
  if (!field.id) return undefined;
  
  for (const orderSpec of filterOrder) {
    const [fieldId, direction = "asc"] = orderSpec.split(":");
    if (field.id === fieldId) {
      return direction;
    }
  }
  return undefined;
}

/**
 * Complete edit core pipeline
 */

export const  ValueFieldsPipeline = createPipeline<FilterShape>("CorePipeline")
  .pipe(FilterWhereMorph)
  .pipe(FilterOrderMorph)
  .pipe(FilterLimitMorph)
  .build({
    description: "Apply filterransformations to fields",
    category: "form",
    tags: ["form", "edit", "fields"],
    inputType: "FilterShape",
    outputType: "FilterShape",
  });
