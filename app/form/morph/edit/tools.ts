import { createMorph } from "../morph";
import { EditContext } from "../mode";
import { EditOutput } from "./pipeline";

/**
 * Matrix Power Tools for Knowledge Base editing
 *
 * A collection of high-level operations that work across the entire
 * form system for sophisticated KB manipulation, similar to how
 * tools like Awk and Sed process text.
 */

/**
 * Global field transformation
 *
 * Applies a transformation to multiple fields matching a pattern.
 * Similar to how `sed` performs global text replacements.
 */
export const GlobalFieldTransformMorph = createMorph<EditOutput, EditOutput>(
  "GlobalFieldTransformMorph",
  (shape, context) => {
    // Get transformation parameters
    const { fieldPattern, transform, options } =
      context.tools?.globalTransform || {};

    // Skip if no transformation defined
    if (!fieldPattern || !transform) return shape;

    // Create regex from pattern if string
    const pattern =
      typeof fieldPattern === "string"
        ? new RegExp(fieldPattern)
        : fieldPattern;

    // Apply transformation to matching fields
    const transformedFields = shape.fields.map((field) => {
      // Skip fields without IDs or that don't match pattern
      if (!field.id || !pattern.test(field.id)) return field;

      // Apply transformation function
      return transform(field, shape, context);
    });

    return {
      ...shape,
      fields: transformedFields,
      meta: {
        ...shape.meta,
        tools: {
          ...(shape.meta?.tools || {}),
          lastTransform: {
            type: "global",
            timestamp: new Date().toISOString(),
            pattern: fieldPattern.toString(),
            fieldsAffected: transformedFields.filter(
              (f, i) => f !== shape.fields[i]
            ).length,
          },
        },
      },
    };
  },
  {
    pure: false, // Not pure due to timestamp and potential side effects
    fusible: true,
    cost: 3,
  }
);

/**
 * Field query and filter
 *
 * Finds and filters fields based on complex queries.
 * Similar to how `awk` selects rows based on patterns.
 */
export const QueryFilterFieldsMorph = createMorph<EditOutput, EditOutput>(
  "QueryFilterFieldsMorph",
  (shape, context) => {
    // Get query parameters
    const { query, visible, highlight } = context.tools?.fieldQuery || {};

    // Skip if no query defined
    if (!query) return shape;

    // Evaluate fields against query
    const queryResults = shape.fields.map((field) => {
      // Evaluate query (which can be a function or object pattern)
      const matches =
        typeof query === "function"
          ? query(field, shape)
          : Object.entries(query).every(([key, value]) => {
              const fieldValue = key
                .split(".")
                .reduce((obj, path) => obj?.[path], field);
              return value instanceof RegExp
                ? value.test(fieldValue)
                : fieldValue === value;
            });

      // Apply visibility and highlighting based on query results
      if (visible !== undefined && matches) {
        field = { ...field, visible };
      }

      if (highlight && matches) {
        field = {
          ...field,
          meta: {
            ...(field.meta || {}),
            ui: {
              ...(field.meta?.ui || {}),
              highlighted: true,
              highlightType: highlight,
            },
          },
        };
      }

      return { field, matches };
    });

    // Extract just the fields
    const filteredFields = queryResults.map((result) => result.field);

    // Track matched fields
    const matchedFieldIds = queryResults
      .filter((result) => result.matches)
      .map((result) => result.field.id)
      .filter(Boolean);

    return {
      ...shape,
      fields: filteredFields,
      meta: {
        ...shape.meta,
        tools: {
          ...(shape.meta?.tools || {}),
          lastQuery: {
            timestamp: new Date().toISOString(),
            matchedFields: matchedFieldIds,
            queryType: typeof query === "function" ? "function" : "pattern",
            totalMatches: matchedFieldIds.length,
          },
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
 * Batch operations
 *
 * Applies multiple operations to selected fields in a single transaction.
 * Similar to batch processing in shell scripts.
 */
export const BatchOperationsMorph = createMorph<EditOutput, EditOutput>(
  "BatchOperationsMorph",
  (shape, context) => {
    // Get batch operations
    const { operations, selection } = context.tools?.batch || {};

    // Skip if no operations defined
    if (!operations || operations.length === 0) return shape;

    // Start with original shape
    let resultShape = { ...shape };

    // Apply selected fields filter if present
    let targetFieldIds: string[] = [];
    if (selection) {
      if (Array.isArray(selection)) {
        targetFieldIds = selection;
      } else if (typeof selection === "function") {
        targetFieldIds = shape.fields
          .filter((field) => field.id && selection(field, shape))
          .map((field) => field.id!)
          .filter(Boolean);
      } else if (selection instanceof RegExp) {
        targetFieldIds = shape.fields
          .filter((field) => field.id && selection.test(field.id))
          .map((field) => field.id!)
          .filter(Boolean);
      }
    } else {
      // All fields if no selection criteria
      targetFieldIds = shape.fields
        .map((field) => field.id)
        .filter(Boolean) as string[];
    }

    // Apply operations in sequence
    const operationResults = operations.map((operation) => {
      // Apply the operation
      const result = {
        operationName: operation.name || "unnamed",
        before: JSON.parse(JSON.stringify(resultShape)),
        operationApplied: false,
      };

      try {
        // Create fields mapper that only applies to selected fields
        const transformedFields = resultShape.fields.map((field) => {
          if (!field.id || !targetFieldIds.includes(field.id)) return field;
          return operation.transform(field, resultShape, context);
        });

        // Update the result shape
        resultShape = {
          ...resultShape,
          fields: transformedFields,
        };

        result.operationApplied = true;
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
      }

      return result;
    });

    return {
      ...resultShape,
      meta: {
        ...resultShape.meta,
        tools: {
          ...(resultShape.meta?.tools || {}),
          batchOperation: {
            timestamp: new Date().toISOString(),
            selectedFields: targetFieldIds,
            operations: operationResults.map((r) => ({
              name: r.operationName,
              applied: r.operationApplied,
              error: r.error,
            })),
            success: operationResults.every((r) => r.operationApplied),
          },
        },
      },
    };
  },
  {
    pure: false, // Not pure due to timestamp and potential side effects
    fusible: false, // Batch operations shouldn't be fused
    cost: 4,
  }
);

/**
 * Template application
 *
 * Applies templates to fields or sections.
 * Similar to templating engines for text.
 */
export const ApplyTemplateMorph = createMorph<EditOutput, EditOutput>(
  "ApplyTemplateMorph",
  (shape, context) => {
    // Get template parameters
    const { template, target, data } = context.tools?.template || {};

    // Skip if no template defined
    if (!template) return shape;

    // Helper to apply a template to a single field
    const applyFieldTemplate = (field: any, templateData: any) => {
      // Simple template replacement
      const applyStringTemplate = (str: string) => {
        return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          return key
            .split(".")
            .reduce((obj, path) => obj?.[path] ?? match, templateData);
        });
      };

      // Process field recursively
      const processValue = (value: any): any => {
        if (typeof value === "string") {
          return applyStringTemplate(value);
        } else if (Array.isArray(value)) {
          return value.map(processValue);
        } else if (value !== null && typeof value === "object") {
          return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, processValue(v)])
          );
        }
        return value;
      };

      // Create a copy of the field and apply template
      const result = { ...field };

      // Apply template to appropriate properties
      if (result.label && typeof result.label === "string") {
        result.label = applyStringTemplate(result.label);
      }

      if (result.placeholder && typeof result.placeholder === "string") {
        result.placeholder = applyStringTemplate(result.placeholder);
      }

      if (result.help && typeof result.help === "string") {
        result.help = applyStringTemplate(result.help);
      }

      // Process meta object if present
      if (result.meta) {
        result.meta = processValue(result.meta);
      }

      return result;
    };

    // Apply template based on target type
    if (target === "allFields") {
      // Apply to all fields
      return {
        ...shape,
        fields: shape.fields.map((field) =>
          applyFieldTemplate(field, { ...data, field })
        ),
      };
    } else if (
      target === "selectedFields" &&
      Array.isArray(context.tools?.template?.fields)
    ) {
      // Apply to selected fields
      const templateFields = new Set(context.tools.template.fields);

      return {
        ...shape,
        fields: shape.fields.map((field) =>
          field.id && templateFields.has(field.id)
            ? applyFieldTemplate(field, { ...data, field })
            : field
        ),
      };
    } else if (target === "sections" && shape.layout?.sections) {
      // Apply to sections
      return {
        ...shape,
        layout: {
          ...shape.layout,
          sections: shape.layout.sections.map((section) => ({
            ...section,
            title:
              typeof section.title === "string"
                ? section.title.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
                    return key
                      .split(".")
                      .reduce((obj, path) => obj?.[path] ?? match, {
                        ...data,
                        section,
                      });
                  })
                : section.title,
            meta: section.meta
              ? {
                  ...section.meta,
                  template: {
                    applied: true,
                    timestamp: new Date().toISOString(),
                  },
                }
              : {
                  template: {
                    applied: true,
                    timestamp: new Date().toISOString(),
                  },
                },
          })),
        },
      };
    }

    // If no matching target or missing data, return original
    return shape;
  },
  {
    pure: false, // Not pure due to timestamp
    fusible: true,
    cost: 3,
  }
);

/**
 * Knowledge base refactoring
 *
 * Performs structural changes to the knowledge base schema.
 * Similar to database refactoring tools.
 */
export const KBRefactorMorph = createMorph<EditOutput, EditOutput>(
  "KBRefactorMorph",
  (shape, context: EditContext) => {
    // Get refactoring operations
    const { operations } = context.tools?.refactor || {};

    // Skip if no operations defined
    if (!operations || operations.length === 0) return shape;

    // Start with original shape
    let resultShape = { ...shape };
    const refactoringLog: any[] = [];

    // Apply operations sequentially
    for (const operation of operations) {
      const operationLog = {
        type: operation.type,
        success: false,
        timestamp: new Date().toISOString(),
      };

      try {
        switch (operation.type) {
          case "renameField":
            if (operation.oldId && operation.newId) {
              // Find the field to rename
              const fieldIndex = resultShape.fields.findIndex(
                (f) => f.id === operation.oldId
              );

              if (fieldIndex >= 0) {
                // Create new fields array with renamed field
                const fields = [...resultShape.fields];
                fields[fieldIndex] = {
                  ...fields[fieldIndex],
                  id: operation.newId,
                  meta: {
                    ...(fields[fieldIndex].meta || {}),
                    originalId: operation.oldId,
                    renamed: true,
                  },
                };

                // Update any references in layout sections
                let layout = resultShape.layout;
                if (layout?.sections) {
                  layout = {
                    ...layout,
                    sections: layout.sections.map((section) => ({
                      ...section,
                      fields: section.fields.map((id) =>
                        id === operation.oldId ? operation.newId : id
                      ),
                    })),
                  };
                }

                resultShape = { ...resultShape, fields, layout };
                operationLog.success = true;
                operationLog.details = {
                  field: operation.oldId,
                  newId: operation.newId,
                };
              } else {
                operationLog.error = `Field ${operation.oldId} not found`;
              }
            }
            break;

          case "moveField":
            if (operation.fieldId && operation.targetSection) {
              // Find the field and sections
              const field = resultShape.fields.find(
                (f) => f.id === operation.fieldId
              );
              let layout = resultShape.layout;

              if (field && layout?.sections) {
                // Remove field from current section
                const updatedSections = layout.sections.map((section) => ({
                  ...section,
                  fields: section.fields.filter(
                    (id) => id !== operation.fieldId
                  ),
                }));

                // Add field to target section
                const targetSectionIndex = updatedSections.findIndex(
                  (s) =>
                    s.id === operation.targetSection ||
                    s.title === operation.targetSection
                );

                if (targetSectionIndex >= 0) {
                  updatedSections[targetSectionIndex] = {
                    ...updatedSections[targetSectionIndex],
                    fields: [
                      ...updatedSections[targetSectionIndex].fields,
                      operation.fieldId,
                    ],
                  };

                  resultShape = {
                    ...resultShape,
                    layout: { ...layout, sections: updatedSections },
                  };
                  operationLog.success = true;
                  operationLog.details = {
                    field: operation.fieldId,
                    target: operation.targetSection,
                  };
                } else {
                  operationLog.error = `Target section ${operation.targetSection} not found`;
                }
              } else {
                operationLog.error = field
                  ? "Layout sections not defined"
                  : `Field ${operation.fieldId} not found`;
              }
            }
            break;

          case "splitField":
            if (operation.sourceId && operation.targetFields) {
              // Find the source field
              const sourceIndex = resultShape.fields.findIndex(
                (f) => f.id === operation.sourceId
              );

              if (sourceIndex >= 0) {
                const sourceField = resultShape.fields[sourceIndex];
                const sourceValue = sourceField.value;

                // Create new fields based on the split configuration
                const newFields = operation.targetFields.map((target: any) => ({
                  id: target.id,
                  label: target.label || target.id,
                  type: target.type || sourceField.type,
                  value:
                    typeof target.extractor === "function"
                      ? target.extractor(sourceValue, sourceField)
                      : undefined,
                  meta: {
                    ...(target.meta || {}),
                    splitFrom: operation.sourceId,
                    originalValue: sourceValue,
                  },
                }));

                // Replace the source field with the new fields
                const fields = [
                  ...resultShape.fields.slice(0, sourceIndex),
                  ...newFields,
                  ...resultShape.fields.slice(sourceIndex + 1),
                ];

                resultShape = { ...resultShape, fields };
                operationLog.success = true;
                operationLog.details = {
                  source: operation.sourceId,
                  newFields: newFields.map((f: any) => f.id),
                };
              } else {
                operationLog.error = `Source field ${operation.sourceId} not found`;
              }
            }
            break;

          case "mergeFields":
            if (operation.sourceIds && operation.targetId && operation.merger) {
              // Find all source fields
              const sourceFields = resultShape.fields.filter(
                (f) => f.id && operation.sourceIds.includes(f.id)
              );

              if (sourceFields.length === operation.sourceIds.length) {
                // Create merged field
                const mergedValue = operation.merger(sourceFields);
                const mergedField = {
                  id: operation.targetId,
                  label: operation.label || operation.targetId,
                  type: operation.type || sourceFields[0].type,
                  value: mergedValue,
                  meta: {
                    ...(operation.meta || {}),
                    mergedFrom: operation.sourceIds,
                    originalFields: sourceFields.map((f) => ({
                      id: f.id,
                      value: f.value,
                    })),
                  },
                };

                // Remove source fields and add merged field
                const fields = resultShape.fields.filter(
                  (f) => !(f.id && operation.sourceIds.includes(f.id))
                );
                fields.push(mergedField);

                resultShape = { ...resultShape, fields };
                operationLog.success = true;
                operationLog.details = {
                  sources: operation.sourceIds,
                  target: operation.targetId,
                };
              } else {
                operationLog.error = `Not all source fields found`;
              }
            }
            break;

          default:
            operationLog.error = `Unknown operation type: ${operation.type}`;
        }
      } catch (error) {
        operationLog.error =
          error instanceof Error ? error.message : String(error);
      }

      refactoringLog.push(operationLog);
    }

    return {
      ...resultShape,
      meta: {
        ...resultShape.meta,
        tools: {
          ...(resultShape.meta?.tools || {}),
          refactoring: {
            timestamp: new Date().toISOString(),
            operations: refactoringLog,
            success: refactoringLog.every((log) => log.success),
          },
        },
      },
    };
  },
  {
    pure: false, // Not pure due to timestamp and side effects
    fusible: false, // Refactoring shouldn't be fused
    cost: 5,
  }
);

/**
 * Knowledge graph operations
 *
 * Manages relationships between entities in the knowledge base.
 * Similar to graph manipulation tools.
 */
export const KnowledgeGraphMorph = createMorph<EditOutput, EditOutput>(
  "KnowledgeGraphMorph",
  (shape, context) => {
    // Get graph operations
    const { operations } = context.tools?.graph || {};

    // Skip if no operations defined
    if (!operations || operations.length === 0) return shape;

    // Extract current relationships or initialize
    const currentRelationships = shape.meta?.relationships || [];
    let relationships = [...currentRelationships];
    const graphLog: any[] = [];

    // Apply operations
    for (const operation of operations) {
      const operationLog = {
        type: operation.type,
        success: false,
        timestamp: new Date().toISOString(),
      };

      try {
        switch (operation.type) {
          case "addRelationship":
            if (operation.source && operation.target && operation.type) {
              // Add the relationship
              relationships.push({
                id: operation.id || `rel_${Date.now()}`,
                source: operation.source,
                target: operation.target,
                type: operation.relationType,
                meta: operation.meta || {},
              });

              operationLog.success = true;
              operationLog.details = {
                source: operation.source,
                target: operation.target,
                type: operation.relationType,
              };
            } else {
              operationLog.error = "Missing relationship details";
            }
            break;

          case "removeRelationship":
            if (operation.id) {
              // Remove relationship by ID
              const initialCount = relationships.length;
              relationships = relationships.filter(
                (r) => r.id !== operation.id
              );

              operationLog.success = relationships.length < initialCount;
              operationLog.details = { id: operation.id };

              if (!operationLog.success) {
                operationLog.error = `Relationship ${operation.id} not found`;
              }
            } else if (operation.source && operation.target) {
              // Remove relationship by source and target
              const initialCount = relationships.length;
              relationships = relationships.filter(
                (r) =>
                  !(
                    r.source === operation.source &&
                    r.target === operation.target &&
                    (!operation.relationType ||
                      r.type === operation.relationType)
                  )
              );

              operationLog.success = relationships.length < initialCount;
              operationLog.details = {
                source: operation.source,
                target: operation.target,
                type: operation.relationType,
              };

              if (!operationLog.success) {
                operationLog.error = "Relationship not found";
              }
            } else {
              operationLog.error = "Missing relationship criteria";
            }
            break;

          case "updateRelationship":
            if (operation.id && operation.updates) {
              // Find and update relationship
              const relationshipIndex = relationships.findIndex(
                (r) => r.id === operation.id
              );

              if (relationshipIndex >= 0) {
                relationships[relationshipIndex] = {
                  ...relationships[relationshipIndex],
                  ...operation.updates,
                  meta: {
                    ...relationships[relationshipIndex].meta,
                    ...(operation.updates.meta || {}),
                  },
                };

                operationLog.success = true;
                operationLog.details = {
                  id: operation.id,
                  updates: Object.keys(operation.updates),
                };
              } else {
                operationLog.error = `Relationship ${operation.id} not found`;
              }
            } else {
              operationLog.error = "Missing relationship ID or updates";
            }
            break;

          default:
            operationLog.error = `Unknown operation type: ${operation.type}`;
        }
      } catch (error) {
        operationLog.error =
          error instanceof Error ? error.message : String(error);
      }

      graphLog.push(operationLog);
    }

    return {
      ...shape,
      meta: {
        ...shape.meta,
        relationships,
        tools: {
          ...(shape.meta?.tools || {}),
          graph: {
            timestamp: new Date().toISOString(),
            operations: graphLog,
            success: graphLog.every((log) => log.success),
            relationshipCount: relationships.length,
          },
        },
      },
    };
  },
  {
    pure: false, // Not pure due to timestamp and side effects
    fusible: false, // Graph operations shouldn't be fused
    cost: 4,
  }
);

/**
 * Style and formatting power tools
 *
 * Applies consistent styling and formatting across the KB.
 * Similar to code formatting tools.
 */
export const StyleFormattingMorph = createMorph<EditOutput, EditOutput>(
  "StyleFormattingMorph",
  (shape, context) => {
    // Get style operations
    const { styleRules, scope } = context.tools?.style || {};

    // Skip if no style rules defined
    if (!styleRules || Object.keys(styleRules).length === 0) return shape;

    // Determine target fields based on scope
    let targetFields: string[] = [];
    if (scope) {
      if (Array.isArray(scope)) {
        targetFields = scope;
      } else if (typeof scope === "function") {
        targetFields = shape.fields
          .filter((field) => field.id && scope(field, shape))
          .map((field) => field.id!)
          .filter(Boolean);
      } else if (scope instanceof RegExp) {
        targetFields = shape.fields
          .filter((field) => field.id && scope.test(field.id))
          .map((field) => field.id!)
          .filter(Boolean);
      }
    } else {
      // All fields if no scope defined
      targetFields = shape.fields
        .map((field) => field.id)
        .filter(Boolean) as string[];
    }

    // Apply style rules to fields
    const styledFields = shape.fields.map((field) => {
      if (!field.id || !targetFields.includes(field.id)) return field;

      let fieldWithStyle = { ...field };

      // Apply each style rule
      Object.entries(styleRules).forEach(([styleKey, styleValue]) => {
        switch (styleKey) {
          case "labelCase":
            if (
              fieldWithStyle.label &&
              typeof fieldWithStyle.label === "string"
            ) {
              switch (styleValue) {
                case "title":
                  fieldWithStyle.label = fieldWithStyle.label
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ");
                  break;
                case "sentence":
                  fieldWithStyle.label =
                    fieldWithStyle.label.charAt(0).toUpperCase() +
                    fieldWithStyle.label.slice(1).toLowerCase();
                  break;
                case "upper":
                  fieldWithStyle.label = fieldWithStyle.label.toUpperCase();
                  break;
                case "lower":
                  fieldWithStyle.label = fieldWithStyle.label.toLowerCase();
                  break;
              }
            }
            break;

          case "placeholderPrefix":
            if (styleValue && typeof styleValue === "string") {
              fieldWithStyle.placeholder = fieldWithStyle.placeholder
                ? `${styleValue} ${fieldWithStyle.placeholder}`
                : `${styleValue} ${fieldWithStyle.label || field.id}`;
            }
            break;

          case "helpSuffix":
            if (styleValue && typeof styleValue === "string") {
              fieldWithStyle.help = fieldWithStyle.help
                ? `${fieldWithStyle.help} ${styleValue}`
                : styleValue;
            }
            break;

          case "theme":
            fieldWithStyle.meta = {
              ...(fieldWithStyle.meta || {}),
              theme: styleValue,
            };
            break;

          case "uiClass":
            fieldWithStyle.meta = {
              ...(fieldWithStyle.meta || {}),
              ui: {
                ...(fieldWithStyle.meta?.ui || {}),
                className: styleValue,
              },
            };
            break;
        }
      });

      return fieldWithStyle;
    });

    // Apply style to layout if needed
    let styledLayout = shape.layout;
    if (styleRules.sectionStyle && styledLayout?.sections) {
      styledLayout = {
        ...styledLayout,
        sections: styledLayout.sections.map((section) => ({
          ...section,
          meta: {
            ...(section.meta || {}),
            style: {
              ...(section.meta?.style || {}),
              ...styleRules.sectionStyle,
            },
          },
        })),
      };
    }

    return {
      ...shape,
      fields: styledFields,
      layout: styledLayout,
      meta: {
        ...shape.meta,
        tools: {
          ...(shape.meta?.tools || {}),
          styling: {
            timestamp: new Date().toISOString(),
            appliedRules: Object.keys(styleRules),
            fieldsAffected: targetFields.length,
          },
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
 * Complete Power Tools pipeline
 */
import { createPipeline } from "../morph";

export const KBPowerToolsPipeline = createPipeline<EditOutput>(
  "KBPowerToolsPipeline"
)
  .pipe(GlobalFieldTransformMorph)
  .pipe(QueryFilterFieldsMorph)
  .pipe(BatchOperationsMorph)
  .pipe(ApplyTemplateMorph)
  .pipe(KBRefactorMorph)
  .pipe(KnowledgeGraphMorph)
  .pipe(StyleFormattingMorph)
  .build({
    description: "Apply power tools for knowledge base editing",
    category: "form",
    tags: ["form", "edit", "power-tools", "kb"],
    inputType: "EditOutput",
    outputType: "EditOutput",
  });

// Export all power tools
export * from "./pipeline";
export * from "./actions";
