import { FormSection } from "../../schema/form";
import { createMorph } from "../morph";
import { isEditContext } from "../core/mode";
import { EditOutput } from "./pipeline";

/**
 * Apply edit-specific section layout
 *
 * This morph modifies form sections for edit mode:
 * - Groups modified fields together
 * - Applies edit-specific section styles
 * - Handles collapsible sections based on edit state
 */
export const EditSectionLayoutMorph = createMorph<EditOutput, EditOutput>(
  "EditSectionLayoutMorph",
  (shape, context) => {
    // No sections to process
    if (!shape.layout?.sections || shape.layout.sections.length === 0)
      return shape;

    // Get edit context options
    const editContext = isEditContext(context) ? context : undefined;

    // Get changed fields
    const changedFields = shape.meta?.edit?.changedFields || [];

    // Process sections
    const editSections = shape.layout.sections.map((section) => {
      // Check if any fields in this section have changed
      const hasChangedFields = section.fields.some((fieldId) =>
        changedFields.includes(fieldId)
      );

      // Determine if section should be collapsed
      let collapsed = section.collapsed;
      if (editContext?.expandChangedSections !== false && hasChangedFields) {
        collapsed = false; // Expand sections with changed fields
      }

      return {
        ...section,
        collapsed,
        meta: {
          ...(section.meta || {}),
          edit: {
            hasChangedFields,
            mode: "edit",
          },
        },
      };
    });

    return {
      ...shape,
      layout: {
        ...shape.layout,
        sections: editSections,
      },
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 1,
  }
);

/**
 * Create edit-specific dynamic layout
 *
 * This morph generates a dynamic layout optimized for editing:
 * - Fields are arranged for efficient editing
 * - Changed fields are emphasized
 * - Read-only fields are de-emphasized
 */
export const EditDynamicLayoutMorph = createMorph<EditOutput, EditOutput>(
  "EditDynamicLayoutMorph",
  (shape, context) => {
    // Skip if layout already exists
    if (shape.layout?.sections && shape.layout.sections.length > 0)
      return shape;

    // Get changed fields
    const changedFields = shape.meta?.edit?.changedFields || [];

    // Group fields into sections
    const groupedFields: Record<string, string[]> = {};

    // Group fields by their section hint or create a default grouping
    shape.fields.forEach((field) => {
      if (!field.id) return;

      const sectionKey = field.meta?.sectionHint || "default";

      if (!groupedFields[sectionKey]) {
        groupedFields[sectionKey] = [];
      }

      groupedFields[sectionKey].push(field.id);
    });

    // Create sections from the grouped fields
    const sections: FormSection[] = Object.entries(groupedFields).map(
      ([key, fieldIds], index) => {
        // Check if any fields in this section have changed
        const hasChangedFields = fieldIds.some((fieldId) =>
          changedFields.includes(fieldId)
        );

        return {
          id: `section-${index}`,
          title: key !== "default" ? key : "Form Fields",
          fields: fieldIds,
          priority: hasChangedFields ? 1 : 2, // Prioritize sections with changes
          collapsible: true,
          collapsed: !hasChangedFields, // Expand sections with changes
        };
      }
    );

    // Sort sections by priority
    const sortedSections = sections.sort((a, b) => {
      const aPriority = a.priority ?? 2; // Default to 2 if undefined
      const bPriority = b.priority ?? 2;
      return aPriority - bPriority;
    });

    return {
      ...shape,
      layout: {
        title: shape.title,
        sections: sortedSections,
      },
    };
  },
  {
    pure: true,
    fusible: true,
    cost: 2,
  }
);

/**
 * Complete edit layout pipeline
 */
import { createPipeline } from "../morph";

export const EditLayoutPipeline = createPipeline<EditOutput>(
  "EditLayoutPipeline"
)
  .pipe(EditSectionLayoutMorph)
  .pipe(EditDynamicLayoutMorph)
  .build({
    description: "Apply edit-specific layout transformations",
    category: "form",
    tags: ["form", "edit", "layout"],
    inputType: "EditOutput",
    outputType: "EditOutput",
  });
