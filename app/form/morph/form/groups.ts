import { createMorph } from "../core";
import { FormShape, FormField } from "./types";
import { FormContext, isFormContext } from "./types";

/**
 * Extended shape for create mode that includes grouping output.
 */
export interface GroupedShape extends FormShape {
  groupedFields: GroupedField[];
  meta?: FormShape["meta"] & {
    grouping: {
      enabled: boolean;
      count: number;
    };
  };
}

/**
 * Extended field for the grouped create mode.
 */
export interface GroupedField extends FormField {
  group?: string;
  meta?: FormField["meta"] & {  
    grouping?: {
      groupId: string;
      groupTitle: string;
    };
  };
}

/**
 * Configuration options for grouping fields in create mode.
 */
export interface GroupingOptions {
  /** Default group if a field isn’t assigned explicitly (defaults to 'general'). */
  defaultGroup?: string;
  /** Predefined groups with title, description and metadata. */
  groups?: Array<{
    id: string;
    title?: string;
    description?: string;
    meta?: Record<string, any>;
  }>;
  /** Explicit mapping of field IDs to group IDs. */
  fieldGroups?: Record<string, string>;
  /** Remove groups with no fields if true. */
  removeEmpty?: boolean;
  /** Order for sorting group IDs. */
  groupOrder?: string[];
}

/**
 * A specialized context for creation that includes grouping information.
 */
export interface GroupedContext extends FormContext {
  data: FormContext["data"] & {
    groupingOptions?: GroupingOptions;
  };
}

/**
 * Apply grouping configuration to a create form.
 * This morph works only when a GroupedContext (with groupingOptions) is provided.
 */
export const ApplyGroupMorph = createMorph<GroupedShape, GroupedShape>(
  "ApplyGroupMorph",
  (shape: GroupedShape, context: GroupedContext) => {
    if (!isFormContext(context)) {
      throw new Error("ApplyGroupMorph requires a valid FormContext");
    }
    const groupingOptions = context.data.groupingOptions;
    const defaultGroup = groupingOptions?.defaultGroup || "general";

    // Build a groups map from any predefined groups
    const groupsMap: Record<
      string,
      { title: string; fields: GroupedField[] }
    > = {};
    if (groupingOptions?.groups) {
      groupingOptions.groups.forEach(g => {
        groupsMap[g.id] = {
          title: g.title || toTitleCase(g.id),
          fields: [],
        };
      });
    }
    // Ensure the default group exists
    if (!groupsMap[defaultGroup]) {
      groupsMap[defaultGroup] = {
        title: toTitleCase(defaultGroup),
        fields: [],
      };
    }

    // Process each field to assign it to a group
    const groupedFields: GroupedField[] = shape.fields.map(
      (field: GroupedField) => {
        // Determine the group by checking field meta, explicit mapping, or defaulting
        const groupId =
          (field.group) ||
          (groupingOptions?.fieldGroups
            ? groupingOptions.fieldGroups[field.id]
            : undefined) ||
          defaultGroup;

        if (!groupsMap[groupId]) {
          groupsMap[groupId] = {
            title: toTitleCase(groupId),
            fields: [],
          };
        }

        const newField: GroupedField = {
          ...field,
          group: groupId,
          meta: {
            ...field.meta || {},
            grouping: {
              groupId,
              groupTitle: groupsMap[groupId].title,
            },
          },
        } as GroupedField;
        groupsMap[groupId].fields.push(newField);
        return newField;
      }
    );

    // Optionally remove empty groups if specified
    let groupCount = Object.keys(groupsMap).length;
    if (groupingOptions?.removeEmpty) {
      for (const groupId in groupsMap) {
        if (groupsMap[groupId].fields.length === 0) {
          delete groupsMap[groupId];
        }
      }
      groupCount = Object.keys(groupsMap).length;
    }

    // Optionally sort groups
    let sortedGroupIds = Object.keys(groupsMap);
    if (groupingOptions?.groupOrder) {
      sortedGroupIds.sort((a, b) => {
        const aIndex = groupingOptions.groupOrder!.indexOf(a);
        const bIndex = groupingOptions.groupOrder!.indexOf(b);
        if (aIndex === -1 && bIndex === -1) {
          return a.localeCompare(b);
        }
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return {
      ...shape,
      groupedFields,
      meta: {
        ...shape.meta,
        grouping: {
          enabled: Boolean(groupingOptions),
          count: groupCount,
        },
      },
    };
  },
  {
    pure: false,
    fusible: true,
    cost: 2,
    memoizable: false,
    description:
      "Groups create form fields based on groupingOptions in GroupedContext",
  }
);

/**
 * Helper function: Convert a string to Title Case.
 */
function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (match) => match.toUpperCase())
    .replace(/([_-])/g, " ")
    .trim();
}

/**
 * Helper function to create a GroupedContext from a base FormContext.
 */
export function withGrouping(
  baseContext: Partial<FormContext> = {},
  groupingOptions: GroupingOptions
): GroupedContext {
  return {
    ...baseContext,
    id: baseContext.id || `create-form-${Date.now()}`,
    timestamp: baseContext.timestamp || Date.now(),
    operation: "create",
    data: {
      ...(baseContext.data || {}),
      groupingOptions,
    },
  } as GroupedContext;
}
