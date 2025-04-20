import { createMorph, morpheus } from "../morph";
import { isViewContext } from "../core/mode";
import { ViewOutput, ViewField } from "./pipeline";

/**
 * Field group configuration
 */
export interface FieldGroup {
  id: string;
  title: string;
  description?: string;
  fields: ViewField[];
  meta?: Record<string, any>;
}

/**
 * Configuration for grouping fields in view mode.
 */
export interface GroupingConfig {
  /** Default group ID if a field doesn't specify one. Defaults to 'general'. */
  defaultGroup?: string;
  /** Predefined groups with titles, descriptions, and metadata. */
  groups?: Array<{
    id: string;
    title?: string;
    description?: string;
    meta?: Record<string, any>;
  }>;
  /** Explicit mapping of field IDs to group IDs. */
  fieldGroups?: Record<string, string>;
  /** If true, groups with no fields will be removed. */
  removeEmpty?: boolean;
  /** Explicit order for sorting groups by their IDs. Ungrouped items are sorted alphabetically after. */
  groupOrder?: string[];
}

/**
 * Grouped view output
 */
export interface GroupedViewOutput extends Omit<ViewOutput, "fields"> {
  groups: FieldGroup[];
  meta: ViewOutput["meta"] & {
    grouping: {
      enabled: boolean;
      count: number;
    };
  };
}

/**
 * Group fields by specified categories
 */
export const GroupedViewMorph = createMorph<ViewOutput, GroupedViewOutput>(
  "GroupedViewMorph",
  (view, context) => {
    // Validate input
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to GroupedViewMorph");
    }

    // Check if context is ViewContext
    if (!isViewContext(context)) {
      // Use the standard type guard
      // If not ViewContext, we can't group. Decide how to handle: throw or return ungrouped?
      // Throwing is safer if grouping is mandatory for this morph.
      throw new Error("GroupedViewMorph requires a valid ViewContext.");
    }
    // --- Context is now known to be ViewContext ---
    const viewContext = context; // Assign to a new const for clarity (optional)

    // Get grouping configuration safely from ViewContext
    const groupConfig = viewContext.grouping;

    // If no grouping config is present even in ViewContext, handle it
    if (!groupConfig) {
      // Option 1: Throw error if grouping config is mandatory
      /*
      throw new Error(
        "GroupedViewMorph requires grouping configuration in ViewContext."
      );
      */
      // Option 2: Return a default structure (e.g., single group)
      const defaultGroupId = "general";
      return {
        ...view,
        groups: [
          {
            id: defaultGroupId,
            title: toTitleCase(defaultGroupId),
            description: "General information",
            fields: view.fields, // Put all fields in one group
            meta: {},
          },
        ],
        meta: {
          ...view.meta,
          grouping: { enabled: false, count: 1 },
        },
      };
    }

    const defaultGroup = groupConfig.defaultGroup || "general";

    // Initialize groups with any predefined ones
    const groupsMap: Record<string, FieldGroup> = {};

    // Add predefined groups
    if (groupConfig.groups) {
      // Add explicit type for 'group' parameter
      groupConfig.groups.forEach(
        (group: {
          id: string;
          title?: string;
          description?: string;
          meta?: Record<string, any>;
        }) => {
          groupsMap[group.id] = {
            id: group.id,
            title: group.title || toTitleCase(group.id),
            description: group.description,
            fields: [],
            meta: group.meta || {},
          };
        }
      );
    }

    // Create default group if not already defined
    if (!groupsMap[defaultGroup]) {
      groupsMap[defaultGroup] = {
        id: defaultGroup,
        title: toTitleCase(defaultGroup),
        description: "General information",
        fields: [],
      };
    }

    // Group fields
    view.fields.forEach((field) => {
      // Determine which group this field belongs to
      const groupId =
        field.meta?.group ||
        groupConfig.fieldGroups?.[field.id] ||
        defaultGroup;

      // Create group if it doesn't exist
      if (!groupsMap[groupId]) {
        groupsMap[groupId] = {
          id: groupId,
          title: toTitleCase(groupId),
          fields: [],
        };
      }

      // Add field to group
      groupsMap[groupId].fields.push(field);
    });

    // Convert map to array and sort groups
    let groups = Object.values(groupsMap);

    // Remove empty groups if specified
    if (groupConfig.removeEmpty) {
      groups = groups.filter((group) => group.fields.length > 0);
    }

    // Sort groups
    if (groupConfig.groupOrder) {
      groups.sort((a, b) => {
        const aIndex = groupConfig.groupOrder!.indexOf(a.id);
        const bIndex = groupConfig.groupOrder!.indexOf(b.id);

        if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
        if (aIndex >= 0) return -1;
        if (bIndex >= 0) return 1;
        return a.title.localeCompare(b.title);
      });
    } else {
      groups.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Return grouped view
    return {
      ...view, // Spread the original view output (like id, format, etc.)
      groups, // Replace fields with groups
      meta: {
        ...view.meta, // Keep original meta
        grouping: {
          // Add grouping status
          enabled: true,
          count: groups.length,
        },
      },
    };
  },
  {
    pure: false, // Depends on context config
    fusible: true, // Can potentially fuse if context is static
    cost: 2,
    memoizable: false, // Context dependency makes memoization tricky
  }
);

function groupFieldsByMetaKey(
  fields: ViewField[],
  key: string,
  defaultGroupId: string = "ungrouped"
): FieldGroup[] {
  const grouped: Record<string, ViewField[]> = {};
  fields.forEach((field) => {
    const groupId = field.meta?.[key] || defaultGroupId;
    if (!grouped[groupId]) {
      grouped[groupId] = [];
    }
    grouped[groupId].push(field);
  });

  return Object.entries(grouped).map(([id, groupFields]) => ({
    id: id,
    // You might want a way to get a title for the group ID
    title: id.charAt(0).toUpperCase() + id.slice(1),
    fields: groupFields,
  }));
}

/**
 * Convert a string to title case (helper function)
 */
function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/([A-Z])/g, " $1") // Insert space before capital letters
    .replace(/^./, (match) => match.toUpperCase()) // Capitalize first letter
    .replace(/([_-])/g, " ") // Replace underscores/hyphens with spaces
    .trim(); // Remove leading/trailing spaces
}

// Correct morpheus.define call with metadata object
morpheus.define(GroupedViewMorph, {
  description: "Groups view fields based on context configuration",
  category: "view-layout",
  tags: ["view", "group", "layout"],
  inputType: "ViewOutput",
  outputType: "GroupedViewOutput",
});
