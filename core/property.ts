import { z } from "zod";

/**
 * Property types for the system
 */
export enum PropertyType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  OBJECT = "object",
  ARRAY = "array",
  REFERENCE = "reference",
  EXPRESSION = "expression",
  ANY = "any",
}

/**
 * Property definition schema
 */
export const PropertyDefinitionSchema = z.object({
  key: z.string(),
  type: z.nativeEnum(PropertyType),
  required: z.boolean().default(false),
  indexed: z.boolean().default(false),
  unique: z.boolean().default(false),
  default: z.any().optional(),
  constraints: z
    .array(
      z.object({
        type: z.string(),
        params: z.record(z.any()).default({}),
        message: z.string().optional(),
      })
    )
    .default([]),
  metadata: z.record(z.any()).default({}),
});

export type PropertyDefinition = z.infer<typeof PropertyDefinitionSchema>;

/**
 * Property value with metadata
 */
export interface PropertyValue<T = any> {
  value: T;
  metadata?: Record<string, any>;
}

/**
 * Property filter operations
 */
export enum PropertyFilterOperation {
  EQUALS = "eq",
  NOT_EQUALS = "neq",
  GREATER_THAN = "gt",
  GREATER_THAN_OR_EQUAL = "gte",
  LESS_THAN = "lt",
  LESS_THAN_OR_EQUAL = "lte",
  CONTAINS = "contains",
  STARTS_WITH = "startsWith",
  ENDS_WITH = "endsWith",
  MATCHES = "matches",
  IN = "in",
  NOT_IN = "notIn",
  EXISTS = "exists",
  NOT_EXISTS = "notExists",
}

/**
 * Property filter value
 */
export interface PropertyFilterValue {
  operation: PropertyFilterOperation;
  value: any;
}

/**
 * Property handler system
 */
export class SystemPropertyHandler {
  /**
   * Validate a property value against its definition
   */
  static validateProperty(
    value: any,
    definition: PropertyDefinition
  ): string[] {
    const errors: string[] = [];

    // Type validation
    if (!this.validateType(value, definition.type)) {
      errors.push(`Invalid type. Expected ${definition.type}`);
    }

    // Required validation
    if (definition.required && (value === undefined || value === null)) {
      errors.push("Property is required");
    }

    // Constraints validation
    for (const constraint of definition.constraints) {
      const valid = this.validateConstraint(value, constraint);
      if (!valid.success) {
        errors.push(
          constraint.message || valid.error || "Constraint validation failed"
        );
      }
    }

    return errors;
  }

  /**
   * Validate type
   */
  private static validateType(value: any, type: PropertyType): boolean {
    if (value === undefined || value === null) {
      return true; // Null/undefined are valid for any type unless required
    }

    switch (type) {
      case PropertyType.STRING:
        return typeof value === "string";
      case PropertyType.NUMBER:
        return typeof value === "number" && !isNaN(value);
      case PropertyType.BOOLEAN:
        return typeof value === "boolean";
      case PropertyType.DATE:
        return (
          value instanceof Date ||
          (typeof value === "string" && !isNaN(Date.parse(value)))
        );
      case PropertyType.OBJECT:
        return (
          typeof value === "object" && !Array.isArray(value) && value !== null
        );
      case PropertyType.ARRAY:
        return Array.isArray(value);
      case PropertyType.REFERENCE:
        return (
          typeof value === "string" ||
          (typeof value === "object" && "id" in value)
        );
      case PropertyType.EXPRESSION:
        return typeof value === "string" || typeof value === "function";
      case PropertyType.ANY:
        return true;
      default:
        return false;
    }
  }

  /**
   * Validate constraint
   */
  private static validateConstraint(
    value: any,
    constraint: PropertyDefinition["constraints"][0]
  ): { success: boolean; error?: string } {
    if (value === undefined || value === null) {
      return { success: true }; // Null/undefined pass constraints unless required
    }

    switch (constraint.type) {
      case "min":
        return {
          success:
            typeof value === "number" && value >= constraint.params.value,
          error: `Value must be at least ${constraint.params.value}`,
        };
      case "max":
        return {
          success:
            typeof value === "number" && value <= constraint.params.value,
          error: `Value must be at most ${constraint.params.value}`,
        };
      case "minLength":
        return {
          success:
            typeof value === "string" &&
            value.length >= constraint.params.value,
          error: `Length must be at least ${constraint.params.value} characters`,
        };
      case "maxLength":
        return {
          success:
            typeof value === "string" &&
            value.length <= constraint.params.value,
          error: `Length must be at most ${constraint.params.value} characters`,
        };
      case "pattern":
        return {
          success:
            typeof value === "string" &&
            new RegExp(constraint.params.pattern).test(value),
          error: "Value does not match the required pattern",
        };
      case "enum":
        return {
          success:
            Array.isArray(constraint.params.values) &&
            constraint.params.values.includes(value),
          error: `Value must be one of: ${constraint.params.values.join(", ")}`,
        };
      case "custom":
        if (typeof constraint.params.validate === "function") {
          try {
            return {
              success: constraint.params.validate(value),
              error: "Custom validation failed",
            };
          } catch (e) {
            // Fix: properly type the error and access its message
            const error = e as Error;
            return {
              success: false,
              error: error.message || "Custom validation error",
            };
          }
        }
        return { success: false, error: "Invalid custom validator" };
      default:
        return { success: true };
    }
  }

  /**
   * Check if a property value matches a filter
   */
  static matchesPropertyFilter(
    propValue: any,
    filter: PropertyFilterValue
  ): boolean {
    if (propValue === undefined || propValue === null) {
      return filter.operation === PropertyFilterOperation.NOT_EXISTS;
    }

    switch (filter.operation) {
      case PropertyFilterOperation.EQUALS:
        return propValue === filter.value;
      case PropertyFilterOperation.NOT_EQUALS:
        return propValue !== filter.value;
      case PropertyFilterOperation.GREATER_THAN:
        return propValue > filter.value;
      case PropertyFilterOperation.GREATER_THAN_OR_EQUAL:
        return propValue >= filter.value;
      case PropertyFilterOperation.LESS_THAN:
        return propValue < filter.value;
      case PropertyFilterOperation.LESS_THAN_OR_EQUAL:
        return propValue <= filter.value;
      case PropertyFilterOperation.CONTAINS:
        if (typeof propValue === "string") {
          return propValue.includes(String(filter.value));
        } else if (Array.isArray(propValue)) {
          return propValue.some((item) => item === filter.value);
        }
        return false;
      case PropertyFilterOperation.STARTS_WITH:
        return (
          typeof propValue === "string" &&
          propValue.startsWith(String(filter.value))
        );
      case PropertyFilterOperation.ENDS_WITH:
        return (
          typeof propValue === "string" &&
          propValue.endsWith(String(filter.value))
        );
      case PropertyFilterOperation.MATCHES:
        return (
          typeof propValue === "string" &&
          new RegExp(filter.value).test(propValue)
        );
      case PropertyFilterOperation.IN:
        return Array.isArray(filter.value) && filter.value.includes(propValue);
      case PropertyFilterOperation.NOT_IN:
        return Array.isArray(filter.value) && !filter.value.includes(propValue);
      case PropertyFilterOperation.EXISTS:
        return true; // We already checked for undefined/null
      case PropertyFilterOperation.NOT_EXISTS:
        return false; // We already checked for undefined/null
      default:
        return false;
    }
  }

  /**
   * Coerce a value to the specified property type
   */
  static coerceValue(value: any, type: PropertyType): any {
    if (value === undefined || value === null) {
      return value;
    }

    switch (type) {
      case PropertyType.STRING:
        return String(value);
      case PropertyType.NUMBER:
        return Number(value);
      case PropertyType.BOOLEAN:
        return Boolean(value);
      case PropertyType.DATE:
        if (value instanceof Date) return value;

        // Handle ISO date strings (YYYY-MM-DD) to avoid timezone issues
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [year, month, day] = value.split("-").map(Number);
          return new Date(Date.UTC(year, month - 1, day));
        }

        return new Date(value);
      case PropertyType.OBJECT:
        return typeof value === "object" ? value : { value };
      case PropertyType.ARRAY:
        return Array.isArray(value) ? value : [value];
      default:
        return value;
    }
  }

  /**
   * Get default value for a property
   */
  static getDefaultValue(definition: PropertyDefinition): any {
    if ("default" in definition) {
      if (typeof definition.default === "function") {
        return definition.default();
      }
      return definition.default;
    }

    switch (definition.type) {
      case PropertyType.STRING:
        return "";
      case PropertyType.NUMBER:
        return 0;
      case PropertyType.BOOLEAN:
        return false;
      case PropertyType.DATE:
        return new Date();
      case PropertyType.OBJECT:
        return {};
      case PropertyType.ARRAY:
        return [];
      default:
        return null;
    }
  }
}
