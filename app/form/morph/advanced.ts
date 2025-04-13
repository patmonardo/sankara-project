import { FormShape, FormField, FormSection } from "../schema/form";
import { ValidationResult } from "../schema/form";
import { MorpheusContext } from "../schema/context";
import { createAdvancedContext, isAdvancedContext } from "../schema/context";
import { createMorph } from "./morph";


/**
 * Helper to organize fields into sections based on their types and metadata
 */
function organizeIntoSections(
  fields: FormField[],
  context: MorpheusContext
): FormSection[] {
  if (!fields || !Array.isArray(fields)) {
    return [];
  }

  // Group fields by their section hint or type
  const groupedByType = fields.reduce<Record<string, FormField[]>>(
    (acc, field) => {
      if (!field || !field.id) return acc;

      // Get section hint from field or metadata with safe access
      const sectionHint = field.meta?.sectionHint || field.type || "other";

      // Initialize array if this is the first field of this type
      if (!acc[sectionHint]) {
        acc[sectionHint] = [];
      }

      // Add field to appropriate group
      acc[sectionHint].push(field);
      return acc;
    },
    {}
  );

  // Create sections according to the schema
  const sections: FormSection[] = [];

  // Get device information with safe defaults
  const constraints = context.constraints || {};
  const device = constraints.device || "desktop";
  const isMobile = device === "mobile";

  // Helper function to create a section with proper types
  function createSection(
    id: string,
    title: string,
    fieldIds: string[],
    cols: number,
    prio: number
  ): FormSection {
    if (!fieldIds || !Array.isArray(fieldIds) || fieldIds.length === 0) {
      throw new Error(`Cannot create section "${id}" with empty fields`);
    }

    return {
      id,
      title,
      fields: fieldIds,
      columns: cols,
      priority: prio,
      // Add other possibly needed properties with defaults
      description: undefined,
      collapsible: false,
      collapsed: false,
      className: undefined,
    };
  }

  // Create sections based on field types
  if (groupedByType["personal"] && groupedByType["personal"].length > 0) {
    const personalFields = groupedByType["personal"];
    sections.push(
      createSection(
        "personal-info",
        "Personal Information",
        personalFields.map((f) => f.id),
        isMobile ? 1 : 2,
        1
      )
    );
  }

  // Combine financial fields
  const financialFields = [
    ...(groupedByType["currency"] || []),
    ...(groupedByType["payment"] || []),
    ...(groupedByType["creditCard"] || []),
  ];

  if (financialFields.length > 0) {
    sections.push(
      createSection(
        "financial-info",
        "Financial Information",
        financialFields.map((f) => f.id),
        1,
        2
      )
    );
  }

  // Collect all field IDs that have been assigned to sections
  const handledFieldIds = new Set([
    ...(groupedByType["personal"] || []).map((f) => f.id),
    ...financialFields.map((f) => f.id),
  ]);

  // Remaining fields go in a general section
  const remainingFields = fields.filter(
    (f) => f && f.id && !handledFieldIds.has(f.id)
  );

  if (remainingFields.length > 0) {
    sections.push(
      createSection(
        "additional-info",
        "Additional Information",
        remainingFields.map((f) => f.id),
        isMobile ? 1 : 3,
        3
      )
    );
  }

  return sections;
}

/**
 * DynamicLayoutMorph
 * Reorganizes shape layout based on context and content
 */
export const DynamicLayoutMorph = createMorph<FormShape, FormShape>(
  "DynamicLayoutMorph",
  (shape, context) => {
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to DynamicLayoutMorph");
    }

    // Start with a deep copy of the shape
    const result = {
      ...shape,
      fields: shape.fields.map((field) => ({ ...field })),
    };

    // Get device information from context with safe defaults
    const constraints = context.constraints || {};
    const device = constraints.device || "desktop";
    const orientation = constraints.orientation || "portrait";

    try {
      // Organize fields into sections
      const sections = organizeIntoSections(shape.fields, context);

      // Only proceed if we have valid sections
      if (sections && sections.length > 0) {
        // Create dynamicLayout object
        result.dynamicLayout = {
          type: "responsive",
          sections: sections,
          device: device,
          orientation: orientation,
          generated: true,
        };
      }

      // Add metadata
      result.meta = {
        ...(result.meta || {}),
        layout: {
          source: "DynamicLayoutMorph",
          timestamp: Date.now(),
          generated: true,
        },
      };

      return result;
    } catch (error) {
      console.error("Error in DynamicLayoutMorph:", error);

      // Return original shape on error, but add error info to metadata
      return {
        ...shape,
        meta: {
          ...(shape.meta || {}),
          layout: {
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          },
        },
      };
    }
  },
  {
    pure: false,
    fusible: true,
    cost: 3,
  }
);

/**
 * AccessibilityMorph - Enhances the shape with accessible qualities
 */
export const AccessibilityMorph = createMorph<FormShape, FormShape>(
  "AccessibilityMorph",
  (shape, context) => {
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to AccessibilityMorph");
    }

    // Get accessibility level from context with safe default
    const constraints = context.constraints || {};
    const accessibilityLevel = constraints.accessibilityLevel || "AA";

    // Create a new shape with enhanced accessibility
    return {
      ...shape,
      fields: shape.fields.map((field) => {
        if (!field || !field.id) return field;

        // Get validation state to link error messages
        const hasErrors =
          field.validation?.valid === false &&
          field.validation.errors &&
          field.validation.errors.length > 0;

        return {
          ...field,
          // Add appropriate ARIA attributes
          ariaLabel: field.ariaLabel || field.label || field.id,
          ariaDescribedBy:
            field.ariaDescribedBy ||
            (field.description ? `${field.id}-desc` : undefined),
          // Add description ID if present
          descriptionId: field.description ? `${field.id}-desc` : undefined,
          // Add any error message IDs
          ariaErrorMessage: hasErrors ? `${field.id}-error` : undefined,
          // Track whether field has been enhanced
          meta: {
            ...(field.meta || {}),
            accessibility: {
              enhanced: true,
              level: accessibilityLevel,
              guideline: "WCAG 2.1",
            },
          },
        };
      }),
      meta: {
        ...(shape.meta || {}),
        accessibility: {
          enhanced: true,
          timestamp: new Date().toISOString(),
          level: accessibilityLevel,
        },
      },
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 2,
  }
);

/**
 * LocalizationMorph - Applies localization to the form
 */
export const LocalizationMorph = createMorph<FormShape, FormShape>(
  "LocalizationMorph",
  (shape, context) => {
    if (!shape || !Array.isArray(shape.fields)) {
      throw new Error("Invalid form shape provided to LocalizationMorph");
    }

    // Get locale from context with safe default
    const constraints = context.constraints || {};
    const locale = constraints.locale || "en-US";
    const translations = constraints.translations || {};

    // Helper function to safely get translated text
    const translate = (key: string, defaultText: string): string => {
      // Safely access nested properties
      const localeTranslations = translations[locale] || {};
      return localeTranslations[key] !== undefined
        ? localeTranslations[key]
        : defaultText;
    };

    // Apply translations to shape
    return {
      ...shape,
      title: translate(`form.${shape.id}.title`, shape.title || ""),
      description: translate(
        `form.${shape.id}.description`,
        shape.description || ""
      ),
      fields: shape.fields.map((field) => {
        if (!field || !field.id) return field;

        const translatedField = {
          ...field,
          label: translate(`field.${field.id}.label`, field.label || ""),
          description: translate(
            `field.${field.id}.description`,
            field.description || ""
          ),
          placeholder: translate(
            `field.${field.id}.placeholder`,
            field.placeholder || ""
          ),
          meta: {
            ...(field.meta || {}),
            localization: {
              applied: true,
              locale,
            },
          },
        };

        // Translate option labels for select/radio fields
        if (field.options && Array.isArray(field.options)) {
          translatedField.options = field.options.map((option) => {
            if (!option || !option.value) return option;

            return {
              ...option,
              label: translate(
                `field.${field.id}.option.${option.value}`,
                option.label || String(option.value)
              ),
            };
          });
        }

        return translatedField;
      }),
      meta: {
        ...(shape.meta || {}),
        localization: {
          applied: true,
          locale,
          timestamp: new Date().toISOString(),
        },
      },
    };
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 3,
  }
);

import { createPipeline } from "./pipeline";

// Add this after all the morph definitions and before processWithAdvancedMorphs

/**
 * Standard pipeline combining all advanced morphs
 */
export const advancedPipeline = createPipeline<FormShape>(
  "AdvancedMorphPipeline"
)
  .pipe(LocalizationMorph)
  .pipe(AdvancedValidationMorph)
  .pipe(DynamicLayoutMorph)
  .pipe(AccessibilityMorph)
  .build({
    description:
      "Comprehensive pipeline for processing forms with advanced features",
    category: "advanced",
    tags: [
      "form",
      "advanced",
      "validation",
      "layout",
      "accessibility",
      "localization",
    ],
    inputType: "FormShape",
    outputType: "FormShape",
  });

/**
 * Process a form shape with all advanced morphs
 */
export function processWithAdvancedMorphs(
  shape: FormShape,
  options: Parameters<typeof createAdvancedContext>[0] = {}
): FormShape {
  if (!shape) {
    throw new Error("Invalid form shape provided to processWithAdvancedMorphs");
  }

  try {
    // Create context with proper validation
    const context = createAdvancedContext(options);

    // Double check with our schema-based type guard
    if (!isAdvancedContext(context)) {
      throw new Error(
        "Invalid context type - advanced processing requires AdvancedContext"
      );
    }

    // Process with pipeline
    return advancedPipeline.apply(shape, context);
  } catch (error) {
    console.error("Error processing form with advanced morphs:", error);

    // Create a properly structured error object
    const errorMessage = error instanceof Error ? error.message : String(error);
    const timestamp = new Date().toISOString();

    // Return the original form but with error information in metadata
    const result: FormShape = {
      ...shape,
      meta: {
        ...(shape.meta || {}),
      },
    };
    return result;
  }
}
