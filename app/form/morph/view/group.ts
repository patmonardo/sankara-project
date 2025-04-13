import { createMorph } from "../morph";  // Use factory function
import { FormExecutionContext } from "../../schema/context";
import { ViewOutput, ViewField } from "./display";

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
 * Grouped view output
 */
export interface GroupedViewOutput extends Omit<ViewOutput, 'fields'> {
  groups: FieldGroup[];
  meta: ViewOutput['meta'] & {
    grouping: {
      enabled: boolean;
      count: number;
    }
  }
}

// Helper to check for view context
function hasGroupingConfig(context: any): boolean {
  return context && (context.grouping !== undefined || 
                     (context.paryāvaraṇa && context.paryāvaraṇa.grouping !== undefined));
}

/**
 * Group fields by specified categories
 */
export const GroupedViewMorph = createMorph<ViewOutput, GroupedViewOutput>(
  "GroupedViewMorph",
  (view, context: FormExecutionContext) => {
    // Validate input
    if (!view || !Array.isArray(view.fields)) {
      throw new Error("Invalid view output provided to GroupedViewMorph");
    }

    // Check for grouping configuration
    if (!hasGroupingConfig(context)) {
      throw new Error("GroupedViewMorph requires grouping configuration in context");
    }
    
    // Get grouping configuration from context
    const groupConfig = context.paryāvaraṇa?.grouping || context.grouping || {
      defaultGroup: "general"
    };
    
    const defaultGroup = groupConfig.defaultGroup || "general";
    
    // Initialize groups with any predefined ones
    const groupsMap: Record<string, FieldGroup> = {};
    
    // Add predefined groups
    if (groupConfig.groups) {
      groupConfig.groups.forEach(group => {
        groupsMap[group.id] = {
          id: group.id,
          title: group.title || toTitleCase(group.id),
          description: group.description,
          fields: [],
          meta: group.meta || {}
        };
      });
    }
    
    // Create default group if not already defined
    if (!groupsMap[defaultGroup]) {
      groupsMap[defaultGroup] = {
        id: defaultGroup,
        title: toTitleCase(defaultGroup),
        description: "General information",
        fields: []
      };
    }
    
    // Group fields
    view.fields.forEach(field => {
      // Determine which group this field belongs to
      const groupId = field.meta?.group || 
                     groupConfig.fieldGroups?.[field.id] || 
                     defaultGroup;
      
      // Create group if it doesn't exist
      if (!groupsMap[groupId]) {
        groupsMap[groupId] = {
          id: groupId,
          title: toTitleCase(groupId),
          fields: []
        };
      }
      
      // Add field to group
      groupsMap[groupId].fields.push(field);
    });
    
    // Convert map to array and sort groups
    let groups = Object.values(groupsMap);
    
    // Remove empty groups if specified
    if (groupConfig.removeEmpty) {
      groups = groups.filter(group => group.fields.length > 0);
    }
    
    // Sort groups
    if (groupConfig.groupOrder) {
      groups.sort((a, b) => {
        const aIndex = groupConfig.groupOrder!.indexOf(a.id);
        const bIndex = groupConfig.groupOrder!.indexOf(b.id);
        
        // If both have explicit order, sort by that
        if (aIndex >= 0 && bIndex >= 0) {
          return aIndex - bIndex;
        }
        
        // Items with explicit order come first
        if (aIndex >= 0) return -1;
        if (bIndex >= 0) return 1;
        
        // Otherwise sort alphabetically
        return a.title.localeCompare(b.title);
      });
    } else {
      // Default to alphabetical sort
      groups.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    // Return grouped view
    return {
      ...view,
      groups,
      meta: {
        ...view.meta,
        grouping: {
          enabled: true,
          count: groups.length
        }
      }
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
    memoizable: true
  }
);

/**
 * Convert a string to title case (helper function)
 */
function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
    .replace(/^./, match => match.toUpperCase()) // Capitalize first letter
    .replace(/([_-])/g, ' ') // Replace underscores/hyphens with spaces
    .trim(); // Remove leading/trailing spaces
}

// Register with the transformation registry
import { morphRegistry } from "../registry";

morphRegistry.registerMorph("GroupedViewMorph", GroupedViewMorph);