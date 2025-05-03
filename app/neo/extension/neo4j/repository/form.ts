import { Neo4jConnection } from "../connection";
import {
  FormOption,
  FormTag,
  FormField,
  FormSection,
  FormAction,
  FormLayout,
  FormShape,
} from "@/form/schema/shape";
import { FormShapeSchema } from "@/form/schema/shape";
import { ManagedTransaction, Session } from "neo4j-driver"; // Removed unused Transaction import
import neo4j, { Integer } from "neo4j-driver";
import { v4 as uuidv4 } from "uuid"; // Import uuid

/**
 * FormShapeRepository
 *
 * Manages the persistence of Forms in Neo4j,
 * representing the concrete manifestation of forms that users interact with.
 * This repository handles the empirical representation of forms as values.
 */
export class FormShapeRepository {
  private connection: Neo4jConnection;

  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }

  /**
   * Saves or updates a FormShape in Neo4j.
   * Handles creation/update of the main node and its related subgraph
   * (Fields, Options, Layout, Sections, Actions, Tags).
   */
  async saveForm(shape: FormShape): Promise<FormShape> {
    // 1. Validate input shape against the Zod schema
    const validatedShape = FormShapeSchema.parse(shape);

    // 2. Get Neo4j driver and session
    const driver = this.connection.getDriver();
    const session: Session = driver.session({
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      // 3. Prepare data for Cypher query
      const shapeId = validatedShape.id;
      const now = Date.now();
      const createdAt = validatedShape.createdAt ?? now;
      const updatedAt = now;

      // Main FormShape properties
      const props = {
        id: shapeId,
        name: validatedShape.name,
        title: validatedShape.title ?? null,
        description: validatedShape.description ?? null,
        data: validatedShape.data ? JSON.stringify(validatedShape.data) : null,
        state: validatedShape.state
          ? JSON.stringify(validatedShape.state)
          : null,
        meta: validatedShape.meta ? JSON.stringify(validatedShape.meta) : null,
        createdAt: createdAt,
        updatedAt: updatedAt,
        isValid: validatedShape.isValid ?? null,
      };

      // FormTag data
      const tagsData = (validatedShape.tags || []).map((tag) => tag.value);

      // FormField data (Processed before Layout)
      const fieldsData = (validatedShape.fields || []).map((field) => {
        const fieldCreatedAt = field.createdAt ?? now;
        const fieldUpdatedAt = now;
        const { options, validation, meta, ...simpleFieldProps } = field;
        return {
          ...simpleFieldProps,
          validation: validation ? JSON.stringify(validation) : null,
          meta: meta ? JSON.stringify(meta) : null,
          options: options || [], // Keep options array for Cypher UNWIND
          createdAt: fieldCreatedAt,
          updatedAt: fieldUpdatedAt,
        };
      });

      // FormLayout, FormSection, and FormAction data
      const layoutData = validatedShape.layout
        ? {
            // Use spread first for layout base properties
            ...validatedShape.layout,
            // Overwrite/ensure ID, timestamps, and potentially stringified complex props
            id: validatedShape.layout.id ?? uuidv4(),
            createdAt: validatedShape.layout.createdAt ?? now,
            updatedAt: now,
            responsive: validatedShape.layout.responsive
              ? JSON.stringify(validatedShape.layout.responsive)
              : null,
            // Map sections
            sections: (validatedShape.layout.sections || []).map((section) => ({
              // Use spread first for section base properties
              ...section,
              // Overwrite/ensure ID, timestamps, and potentially stringified complex props
              id: section.id ?? uuidv4(),
              createdAt: section.createdAt ?? now,
              updatedAt: now,
              fields: section.fields || [], // Keep field IDs list
            })),
            // Map actions
            actions: (validatedShape.layout.actions || []).map((action) => ({
              // Use spread first for action base properties
              ...action,
              // Overwrite/ensure ID and timestamps
              id: action.id ?? uuidv4(),
              createdAt: action.createdAt ?? now,
              updatedAt: now,
            })),
          }
        : null;

      // 4. Define the Cypher query
      // ... inside saveForm method ...
      // ... inside saveForm method ...
      const cypher = `
              // 1. Merge main :FormShape node & set properties
              MERGE (fs:FormShape {id: $shapeId})
              ON CREATE SET fs.createdAt = $props.createdAt
              SET fs += apoc.map.removeKeys($props, ['createdAt']) // Update properties, keep updatedAt
      
              // 2. Detach and delete existing subgraph components
              // ... (DETACH DELETE part remains the same) ...
              WITH fs
              OPTIONAL MATCH (fs)-[r1:HAS_FIELD]->(oldField:FormField)
              OPTIONAL MATCH (oldField)-[r2:HAS_OPTION]->(oldOption:FormOption)
              OPTIONAL MATCH (fs)-[r3:HAS_LAYOUT]->(oldLayout:FormLayout)
              OPTIONAL MATCH (oldLayout)-[r4:HAS_SECTION]->(oldSection:FormSection)
              OPTIONAL MATCH (oldLayout)-[r5:HAS_ACTION]->(oldAction:FormAction)
              OPTIONAL MATCH (fs)-[r6:HAS_TAG]->(oldTag:FormTag) // Detach old tags before sync
              DETACH DELETE oldOption, oldField, oldAction, oldSection, oldLayout, oldTag // Delete all detached sub-nodes
      
      
              // 3. Create new Fields and Options (Uses fieldsData prepared earlier)
              // ... (UNWIND fieldsData part remains the same) ...
              WITH fs
              UNWIND $fieldsData AS fieldMap
              CREATE (newField:FormField)
              SET newField = apoc.map.removeKeys(fieldMap, ['options']) // Set props, remove options map
              CREATE (fs)-[:HAS_FIELD]->(newField)
              // Create Options for the current field if they exist
              WITH fs, newField, fieldMap.options AS optionList WHERE size(optionList) > 0
              UNWIND optionList AS optionMap
              CREATE (newOption:FormOption)
              SET newOption = optionMap // Assuming simple {value, label}
              CREATE (newField)-[:HAS_OPTION]->(newOption)
      
      
              // 4. Create new Layout, Sections, and Actions conditionally (Uses layoutData)
              WITH DISTINCT fs // Ensure we only proceed once per FormShape
              CALL apoc.do.when($layoutData IS NOT NULL,
                '
                // Create Layout node
                CREATE (newLayout:FormLayout)
                // Set layout props, remove nested sections and actions maps
                SET newLayout = apoc.map.removeKeys($layoutData, ["sections", "actions"])
                CREATE (fs)-[:HAS_LAYOUT]->(newLayout)
      
                // Create Sections and link fields if sections exist
                WITH newLayout, $layoutData.sections AS sectionList WHERE size(sectionList) > 0
                UNWIND sectionList AS sectionMap
                CREATE (newSection:FormSection)
                // Set section props, remove nested fields list
                SET newSection = apoc.map.removeKeys(sectionMap, ["fields"])
                CREATE (newLayout)-[:HAS_SECTION]->(newSection)
                // Link fields contained within this section if fields exist
                WITH newLayout, newSection, sectionMap.fields AS fieldIdList WHERE size(fieldIdList) > 0
                UNWIND fieldIdList AS fieldId
                // Find the field created earlier in this transaction by ID
                MATCH (targetField:FormField {id: fieldId}) // REMOVED the WHERE clause here
                CREATE (newSection)-[:CONTAINS_FIELD]->(targetField)
      
                // Create Actions if actions exist
                WITH DISTINCT newLayout // Operate on the single newLayout node
                WHERE size($layoutData.actions) > 0
                UNWIND $layoutData.actions AS actionMap
                CREATE (newAction:FormAction)
                SET newAction = actionMap // Set action properties from map
                CREATE (newLayout)-[:HAS_ACTION]->(newAction) // Link action to layout
      
                RETURN count(*) // Must return something from within apoc.do.when branch
                ',
                // Else branch if $layoutData is NULL
                'RETURN 0',
                // Parameters for apoc.do.when
                { fs: fs, layoutData: $layoutData }
              ) YIELD value AS layoutResult
      
              // 5. Synchronize Tags (Uses tagsData)
              // ... (UNWIND tagsData part remains the same) ...
              WITH fs
              // Merge tags from the new list, ensuring they exist
              UNWIND $tagsData AS tagValue
              MERGE (newTag:FormTag {value: tagValue})
              // Ensure relationship exists between FormShape and Tag
              MERGE (fs)-[:HAS_TAG]->(newTag)
      
      
              // 6. Return ID (optional, for confirmation)
              RETURN fs.id AS id
            `;
      // 5. Execute the Cypher query
      await session.executeWrite(async (tx: ManagedTransaction) => {
        await tx.run(cypher, {
          shapeId,
          props,
          tagsData,
          fieldsData,
          layoutData,
        });
      });

      // 6. Construct the final saved shape object to return (Spread First approach)
      const savedShape: FormShape = {
        ...validatedShape, // Spread base validated shape first
        createdAt: createdAt, // Overwrite timestamp
        updatedAt: updatedAt, // Overwrite timestamp
        // Reconstruct layout
        layout: layoutData
          ? {
              ...validatedShape.layout, // Spread original layout first
              id: layoutData.id, // Overwrite ID
              createdAt: layoutData.createdAt, // Overwrite timestamp
              updatedAt: layoutData.updatedAt, // Overwrite timestamp
              // Reconstruct sections
              sections: layoutData.sections.map((secData) => {
                const originalSection = validatedShape.layout?.sections?.find(
                  (s) => s.id === secData.id
                );
                return {
                  ...originalSection, // Spread original section first
                  id: secData.id, // Overwrite ID
                  createdAt: secData.createdAt, // Overwrite timestamp
                  updatedAt: secData.updatedAt, // Overwrite timestamp
                  fields: secData.fields, // Use prepared field IDs
                };
              }),
              // Reconstruct actions
              actions: layoutData.actions.map((actData) => {
                const originalAction = validatedShape.layout?.actions?.find(
                  (a) => a.id === actData.id
                );
                return {
                  ...originalAction, // Spread original action first
                  id: actData.id, // Overwrite ID
                  createdAt: actData.createdAt, // Overwrite timestamp
                  updatedAt: actData.updatedAt, // Overwrite timestamp
                };
              }),
            }
          : undefined, // Use undefined if layout was null
        // Reconstruct fields
        fields: fieldsData.map((fieldData) => {
          const originalField = validatedShape.fields?.find(
            (f) => f.id === fieldData.id
          );
          // Destructure prepared data to separate simple props
          const {
            options,
            validation,
            meta,
            createdAt: _c,
            updatedAt: _u,
            ...simplePreparedProps
          } = fieldData;
          return {
            ...originalField, // Spread original field first
            ...simplePreparedProps, // Overwrite simple props from prepared data
            createdAt: fieldData.createdAt, // Use prepared timestamp
            updatedAt: fieldData.updatedAt, // Use prepared timestamp
            // Ensure complex objects from original are preserved if not explicitly handled
            options: originalField?.options,
            validation: originalField?.validation,
            meta: originalField?.meta,
          };
        }),
        // Tags remain as they were in the validated input
        tags: validatedShape.tags,
      };

      // 7. Validate the final constructed shape (optional but recommended)
      return savedShape; // FormShapeSchema.parse(savedShape);
    } catch (error) {
      // 8. Error Handling
      console.error(`Error saving FormShape with id ${shape.id}:`, error);
      if (error instanceof neo4j.Neo4jError) {
        console.error(`Neo4j Error Code: ${error.code}`);
        console.error(`Neo4j Error Message: ${error.message}`);
      }
      if (error instanceof Error) {
        throw new Error(
          `Failed to save FormShape ${shape.id}: ${error.message}`
        );
      } else {
        throw new Error(
          `An unknown error occurred while saving FormShape ${shape.id}`
        );
      }
    } finally {
      // 9. Close the session
      await session.close();
    }
  }

  /**
   * Retrieves a complete FormShape by its ID from Neo4j.
   * Fetches the main node and its related subgraph, structuring the query
   * to mirror the FormShape schema.
   */
  async getFormById(id: string): Promise<FormShape | null> {
    const session: Session = this.connection.getSession({
      defaultAccessMode: neo4j.session.READ,
    });
    try {
      const result = await session.run(
        `
        MATCH (fs:FormShape {id: $id})

        // Collect Tags
        CALL {
          WITH fs
          OPTIONAL MATCH (fs)-[:HAS_TAG]->(t:FormTag)
          RETURN collect(t) AS tags
        }

        // Collect Fields and their Options
        CALL {
          WITH fs
          OPTIONAL MATCH (fs)-[:HAS_FIELD]->(f:FormField)
          ORDER BY f.createdAt
          CALL {
              WITH f
              OPTIONAL MATCH (f)-[:HAS_OPTION]->(o:FormOption)
              RETURN collect(o) AS options
          }
          RETURN collect({ field: f, options: options }) AS fieldsData
        }

        // Find Layout (if exists)
        OPTIONAL MATCH (fs)-[:HAS_LAYOUT]->(l:FormLayout)

        // Collect Sections (conditionally on l existing)
        CALL {
            WITH l // Import l1
            //WHERE l IS NOT NULL // Filter HERE, before further MATCH
            OPTIONAL MATCH (l)-[:HAS_SECTION]->(s:FormSection)
            ORDER BY s.createdAt
            CALL {
                WITH s // Import s
                // WHERE s IS NOT NULL // Also check section exists if optional
                OPTIONAL MATCH (s)-[:CONTAINS_FIELD]->(sf:FormField)
                RETURN collect(sf.id) AS fieldIds
            }
            // Collect even if sections don't exist (returns empty list)
            RETURN collect({ section: s, fieldIds: fieldIds }) AS sectionsData
        }

        // Collect Actions (conditionally on l existing)
        CALL {
            WITH l // Import l2
            //WHERE l IS NOT NULL // Filter HERE
            OPTIONAL MATCH (l)-[:HAS_ACTION]->(a:FormAction)
            ORDER BY a.createdAt
            // Collect even if actions don't exist (returns empty list)
            RETURN collect(a) AS actionsData
        }

        // Return the main shape properties along with collected nested data
        RETURN
          fs { .* },
          tags,
          fieldsData,
          // Return layout node itself, and the conditionally collected sections/actions
          l AS layoutNode, // Return the layout node or null
          sectionsData,    // Will be list, potentially empty
          actionsData      // Will be list, potentially empty
        `,
        { id }
      );

      if (result.records.length === 0) {
        return null; // FormShape not found
      }

      const record = result.records[0];
      const formShapeProps = record.get("fs");
      const tagsResult = record.get("tags");
      const fieldsDataResult = record.get("fieldsData");
      // Get the potentially null layout node and the collected lists
      const layoutNode = record.get("layoutNode");
      const sectionsDataResult = record.get("sectionsData");
      const actionsDataResult = record.get("actionsData");

      // Reconstruct Tags
      const tags: FormTag[] = (tagsResult || [])
        .filter((tag: any) => tag)
        .map((tag: any) => ({
          ...tag.properties,
          createdAt: this.toNumber(tag.properties.createdAt),
          updatedAt: this.toNumber(tag.properties.updatedAt),
        }));

      // Reconstruct Fields
      const fields: FormField[] = (fieldsDataResult || [])
        .filter((fd: any) => fd && fd.field)
        .map((fd: any) => {
          const fieldProps = fd.field.properties;
          const options: FormOption[] = (fd.options || [])
            .filter((opt: any) => opt)
            .map((opt: any) => ({
              ...opt.properties,
              createdAt: this.toNumber(opt.properties.createdAt),
              updatedAt: this.toNumber(opt.properties.updatedAt),
            }));
          return {
            ...fieldProps,
            validation: this.safeJsonParse(fieldProps.validation),
            meta: this.safeJsonParse(fieldProps.meta),
            options: options.length > 0 ? options : undefined,
            createdAt: this.toNumber(fieldProps.createdAt),
            updatedAt: this.toNumber(fieldProps.updatedAt),
          };
        });

      // Reconstruct Layout (conditionally)
      let layout: FormLayout | undefined = undefined;
      if (layoutNode) { // Check if layout node exists
          const layoutProps = layoutNode.properties;
          // Reconstruct sections from sectionsDataResult
          const sections: FormSection[] = (sectionsDataResult || [])
              .filter((sd: any) => sd && sd.section) // Filter out null sections if OPTIONAL MATCH yielded nothing
              .map((sd: any) => {
                  const sectionProps = sd.section.properties;
                  return {
                      ...sectionProps,
                      fields: sd.fieldIds || [], // Use collected field IDs
                      createdAt: this.toNumber(sectionProps.createdAt),
                      updatedAt: this.toNumber(sectionProps.updatedAt),
                  };
              });

          // Reconstruct actions from actionsDataResult
          const actions: FormAction[] = (actionsDataResult || [])
              .filter((act: any) => act) // Filter out null actions
              .map((act: any) => {
                  const actionProps = act.properties;
                  return {
                      ...actionProps,
                      createdAt: this.toNumber(actionProps.createdAt),
                      updatedAt: this.toNumber(actionProps.updatedAt),
                  };
              });

          layout = {
              ...layoutProps,
              responsive: this.safeJsonParse(layoutProps.responsive),
              createdAt: this.toNumber(layoutProps.createdAt),
              updatedAt: this.toNumber(layoutProps.updatedAt),
              sections: sections.length > 0 ? sections : undefined,
              actions: actions.length > 0 ? actions : undefined,
          };
      }

      // Construct final FormShape
      const formShape: FormShape = {
        ...formShapeProps,
        schemaId: formShapeProps.schemaId, // Ensure schemaId is mapped
        data: this.safeJsonParse(formShapeProps.data),
        state: this.safeJsonParse(formShapeProps.state),
        meta: this.safeJsonParse(formShapeProps.meta),
        fields: fields.length > 0 ? fields : undefined,
        layout: layout, // Use the conditionally reconstructed layout
        tags: tags.length > 0 ? tags : undefined,
        createdAt: this.toNumber(formShapeProps.createdAt),
        updatedAt: this.toNumber(formShapeProps.updatedAt),
        isValid: this.toBoolean(formShapeProps.isValid),
      };

      // Validate final shape before returning
      return formShape; //FormShapeSchema.parse(formShape);

    } catch (error) {
      console.error(`Error getting FormShape by id ${id}:`, error);
      if (error instanceof neo4j.Neo4jError) {
        console.error(`Neo4j Error Code: ${error.code}`);
        console.error(`Neo4j Error Message: ${error.message}`);
      }
      // Throw a more specific error or handle as needed
      throw new Error(`Failed to retrieve FormShape ${id}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await session.close();
    }
  }

  async findForms(
    criteria: {
      name?: string;
      schemaId?: string; // Assuming FormShape relates to FormDefinition
      tags?: string[];
    } = {}
  ): Promise<FormShape[]> {
    const session: Session = this.connection.getSession({
      defaultAccessMode: neo4j.session.READ,
    });
    const forms: FormShape[] = [];

    try {
      const params: Record<string, any> = {};
      let matchClause = `MATCH (fs:FormShape)`;
      let whereClauses: string[] = [];

      // Add criteria to MATCH or WHERE clauses
      if (criteria.name) {
        whereClauses.push(
          `(toLower(fs.name) CONTAINS toLower($name) OR toLower(fs.title) CONTAINS toLower($name))`
        );
        params.name = criteria.name;
      }
      if (criteria.schemaId) {
        matchClause += `, (fs)-[:IMPLEMENTS_SCHEMA]->(:FormDefinition {id: $schemaId})`;
        params.schemaId = criteria.schemaId;
      }
      if (criteria.tags && criteria.tags.length > 0) {
        whereClauses.push(
          `ALL(tagValue IN $tags WHERE (fs)-[:HAS_TAG]->(:FormTag {value: tagValue}))`
        );
        params.tags = criteria.tags;
      }

      const query = `
        ${matchClause}
        ${whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : ""}

        // Collect Tags for each matching fs
        CALL {
          WITH fs
          OPTIONAL MATCH (fs)-[:HAS_TAG]->(t:FormTag)
          RETURN collect(t) AS tags
        }

        // Collect Fields and their Options for each matching fs
        CALL {
          WITH fs
          OPTIONAL MATCH (fs)-[:HAS_FIELD]->(f:FormField)
          // Order fields BEFORE collecting options and the final list
          ORDER BY f.createdAt // <-- ORDER HERE
          CALL {
              WITH f // f is now ordered
              OPTIONAL MATCH (f)-[:HAS_OPTION]->(o:FormOption)
              RETURN collect(o) AS options
          }
          RETURN collect({ field: f, options: options }) AS fieldsData // <-- REMOVED ORDER BY HERE
        }

        // Collect Layout, Sections, and Actions for each matching fs
        CALL {
          WITH fs
          OPTIONAL MATCH (fs)-[:HAS_LAYOUT]->(l:FormLayout)
          CALL {
              WITH l
              // WHERE l IS NOT NULL
              CALL {
                  WITH l
                  OPTIONAL MATCH (l)-[:HAS_SECTION]->(s:FormSection)
                  // Order sections before collecting field IDs
                  ORDER BY s.createdAt // <-- ORDER SECTIONS HERE
                  CALL {
                      WITH s
                      OPTIONAL MATCH (s)-[:CONTAINS_FIELD]->(sf:FormField)
                      RETURN collect(sf.id) AS fieldIds
                  }
                  RETURN collect({ section: s, fieldIds: fieldIds }) AS sectionsData // <-- REMOVED ORDER BY HERE
              }
              CALL {
                  WITH l
                  OPTIONAL MATCH (l)-[:HAS_ACTION]->(a:FormAction)
                  // Order actions before collecting
                  ORDER BY a.createdAt // <-- ORDER ACTIONS HERE
                  RETURN collect(a) AS actionsData // <-- REMOVED ORDER BY HERE
              }
              RETURN l AS layout, sectionsData, actionsData
          }
          RETURN { layout: layout, sections: sectionsData, actions: actionsData } AS layoutData
        }

        // Return the data for each matching FormShape
        RETURN
          fs { .* },
          tags,
          fieldsData,
          layoutData
        ORDER BY fs.updatedAt DESC // Keep the final ordering of forms
      `;

      const result = await session.run(query, params);

      // Reconstruct each FormShape from the results
      for (const record of result.records) {
        // Start loop for each record (FormShape)
        const formShapeProps = record.get("fs");
        const tagsResult = record.get("tags");
        const fieldsDataResult = record.get("fieldsData");
        const layoutDataResult = record.get("layoutData");

        // Reconstruct Tags (Correctly placed within the loop)
        const tags: FormTag[] = (tagsResult || [])
          .filter((tag: any) => tag)
          .map((tag: any) => ({
            ...tag.properties,
            createdAt: this.toNumber(tag.properties.createdAt),
            updatedAt: this.toNumber(tag.properties.updatedAt),
          }));

        // Reconstruct Fields (Correctly placed within the loop)
        const fields: FormField[] = (fieldsDataResult || [])
          .filter((fd: any) => fd && fd.field)
          .map((fd: any) => {
            // Start map callback for fields
            const fieldProps = fd.field.properties;
            const options: FormOption[] = (fd.options || [])
              .filter((opt: any) => opt)
              .map((opt: any) => ({
                ...opt.properties,
                createdAt: this.toNumber(opt.properties.createdAt),
                updatedAt: this.toNumber(opt.properties.updatedAt),
              }));

            // *** Added missing return statement for the field object ***
            return {
              ...fieldProps,
              validation: this.safeJsonParse(fieldProps.validation),
              meta: this.safeJsonParse(fieldProps.meta),
              options: options.length > 0 ? options : undefined,
              createdAt: this.toNumber(fieldProps.createdAt),
              updatedAt: this.toNumber(fieldProps.updatedAt),
              required: this.toBoolean(fieldProps.required),
              disabled: this.toBoolean(fieldProps.disabled),
              readOnly: this.toBoolean(fieldProps.readOnly),
              visible: this.toBoolean(fieldProps.visible),
            };
          }); // *** End map callback for fields ***

        // Reconstruct Layout (Correctly placed within the loop, after fields)
        let layout: FormLayout | undefined = undefined;
        if (layoutDataResult && layoutDataResult.layout) {
          const layoutProps = layoutDataResult.layout.properties;
          const sectionsData = layoutDataResult.sections || [];
          const actionsData = layoutDataResult.actions || [];

          const sections: FormSection[] = sectionsData
            .filter((sd: any) => sd && sd.section)
            .map((sd: any) => {
              const sectionProps = sd.section.properties;
              return {
                ...sectionProps,
                fields: sd.fieldIds || [],
                meta: this.safeJsonParse(sectionProps.meta),
                columns: this.toNumber(sectionProps.columns),
                priority: this.toNumber(sectionProps.priority),
                collapsible: this.toBoolean(sectionProps.collapsible),
                collapsed: this.toBoolean(sectionProps.collapsed),
                createdAt: this.toNumber(sectionProps.createdAt),
                updatedAt: this.toNumber(sectionProps.updatedAt),
              };
            });

          const actions: FormAction[] = actionsData
            .filter((act: any) => act)
            .map((act: any) => {
              const actionProps = act.properties;
              return {
                id: actionProps.id,
                type: actionProps.type,
                label: actionProps.label,
                primary: this.toBoolean(actionProps.primary),
                disabled: this.toBoolean(actionProps.disabled),
                position: actionProps.position ?? null,
                createdAt: this.toNumber(actionProps.createdAt),
                updatedAt: this.toNumber(actionProps.updatedAt),
              };
            });

          layout = {
            ...layoutProps,
            responsive: this.safeJsonParse(layoutProps.responsive),
            sections: sections.length > 0 ? sections : undefined,
            actions: actions.length > 0 ? actions : undefined,
            columns: this.toNumber(layoutProps.columns),
            createdAt: this.toNumber(layoutProps.createdAt),
            updatedAt: this.toNumber(layoutProps.updatedAt),
          };
        } // End layout reconstruction

        // Construct the final FormShape object (Correctly placed within the loop)
        const formShape: FormShape = {
          ...formShapeProps,
          data: this.safeJsonParse(formShapeProps.data),
          state: this.safeJsonParse(formShapeProps.state),
          meta: this.safeJsonParse(formShapeProps.meta),
          fields: fields.length > 0 ? fields : undefined,
          layout: layout,
          tags: tags.length > 0 ? tags : undefined,
          createdAt: this.toNumber(formShapeProps.createdAt),
          updatedAt: this.toNumber(formShapeProps.updatedAt),
          isValid: this.toBoolean(formShapeProps.isValid),
        };

        // Validate and push the fully reconstructed shape (Correctly placed within the loop)
        try {
          forms.push(formShape) // (FormShapeSchema.parse(formShape));
        } catch (validationError) {
          console.error(
            `Validation Error for FormShape ${formShape.id}:`,
            (validationError as any).errors
          );
          // Decide whether to skip invalid forms or throw
        }
      } // End loop for each record

      return forms;
    } catch (error) {
      console.error(`Error finding FormShapes:`, error);
      if (error instanceof neo4j.Neo4jError) {
        console.error(`Neo4j Error Code: ${error.code}`);
        console.error(`Neo4j Error Message: ${error.message}`);
      }
      throw new Error(
        `Failed to find FormShapes: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a FormShape by ID, including its entire subgraph.
   */
  async deleteForm(id: string): Promise<boolean> {
    const session: Session = this.connection.getSession({
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      const result = await session.executeWrite(
        async (tx: ManagedTransaction) => {
          // Match the FormShape and its potential subgraph components
          const queryResult = await tx.run(
            `
            MATCH (fs:FormShape {id: $id})
            // Find all related nodes to clean up
            OPTIONAL MATCH (fs)-[:HAS_FIELD]->(field:FormField)
            OPTIONAL MATCH (field)-[:HAS_OPTION]->(option:FormOption)
            OPTIONAL MATCH (fs)-[:HAS_LAYOUT]->(layout:FormLayout)
            OPTIONAL MATCH (layout)-[:HAS_SECTION]->(section:FormSection)
            OPTIONAL MATCH (layout)-[:HAS_ACTION]->(action:FormAction)
            OPTIONAL MATCH (fs)-[:HAS_TAG]->(tag:FormTag) // Include tags

            // Detach and delete all found nodes (FormShape and its subgraph)
            DETACH DELETE fs, field, option, layout, section, action, tag

            RETURN count(fs) as deletedCount // Return count of deleted FormShape nodes
            `,
            { id }
          );

          // Check if the query returned a result and if the count is greater than 0
          if (queryResult.records.length > 0) {
            const deletedCountValue =
              queryResult.records[0].get("deletedCount");
            // Use the toNumber helper to safely convert the count
            const count = this.toNumber(deletedCountValue);
            // Return true if the count is a number and greater than 0
            return typeof count === "number" && count > 0;
          }
          // If no records were returned, the node wasn't found/deleted
          return false;
        }
      );
      // executeWrite returns the value returned by the inner function
      return result ?? false; // Ensure boolean return even if inner function somehow returns undefined/null
    } catch (error) {
      console.error(`Error deleting FormShape with id ${id}:`, error);
      if (error instanceof neo4j.Neo4jError) {
        console.error(`Neo4j Error Code: ${error.code}`);
        console.error(`Neo4j Error Message: ${error.message}`);
      }
      // Re-throw or return false based on desired error handling
      throw new Error(
        `Failed to delete FormShape ${id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      // return false; // Alternatively, return false on error
    } finally {
      await session.close();
    }
  }

  /**
   * Clone a form
   *
   * Creates a new form based on an existing one with a new ID
   */
  async cloneForm(
    sourceId: string,
    newId: string,
    newName?: string
  ): Promise<FormShape | null> {
    // Get the source form using the reliable getFormById
    const sourceForm = await this.getFormById(sourceId);

    if (!sourceForm) {
      console.warn(
        `Clone failed: Source FormShape with id ${sourceId} not found.`
      );
      return null;
    }

    // Create a deep copy of the source form data, excluding potentially problematic properties if necessary
    // Using structuredClone for a deep copy, but be mindful of complex objects/types it might not handle
    let clonedData: FormShape;
    try {
      // structuredClone is generally good for POJOs from JSON-like structures
      clonedData = structuredClone(sourceForm);
    } catch (cloneError) {
      console.error(
        "Error during structuredClone, falling back to JSON parse/stringify:",
        cloneError
      );
      // Fallback: Less robust, loses non-JSON types like Dates if not handled
      clonedData = JSON.parse(JSON.stringify(sourceForm));
    }

    // Modify the cloned data
    clonedData.id = newId; // Assign the new ID
    clonedData.name = newName || `Copy of ${sourceForm.name}`; // Assign new name or default
    // Reset timestamps for the new entity
    const now = Date.now();
    clonedData.createdAt = now;
    clonedData.updatedAt = now;

    // Recursively update IDs and timestamps for nested structures (Fields, Layout, Sections, Actions)
    // This prevents reusing old IDs in the new graph structure

    // Update Field IDs and timestamps
    if (clonedData.fields) {
      clonedData.fields = clonedData.fields.map((field) => ({
        ...field,
        id: uuidv4(), // Generate new ID for the cloned field
        createdAt: now,
        updatedAt: now,
        // Options don't typically have IDs in this schema, but if they did, update here
        options: field.options?.map((opt) => ({
          ...opt,
          // id: uuidv4(), // If options had IDs
          createdAt: now,
          updatedAt: now,
        })),
      }));
    }

    // Create a map of old field IDs to new field IDs for updating section references
    const fieldIdMap = new Map<string, string>();
    sourceForm.fields?.forEach((originalField, index) => {
      if (clonedData.fields && clonedData.fields[index]) {
        fieldIdMap.set(originalField.id, clonedData.fields[index].id);
      }
    });

    // Update Layout, Section, and Action IDs and timestamps
    if (clonedData.layout) {
      clonedData.layout.id = uuidv4(); // New Layout ID
      clonedData.layout.createdAt = now;
      clonedData.layout.updatedAt = now;

      if (clonedData.layout.sections) {
        clonedData.layout.sections = clonedData.layout.sections.map(
          (section) => ({
            ...section,
            id: uuidv4(), // New Section ID
            createdAt: now,
            updatedAt: now,
            // Update field references within the section using the map
            fields:
              section.fields?.map(
                (oldFieldId) => fieldIdMap.get(oldFieldId) ?? oldFieldId
              ) ?? [],
          })
        );
      }

      if (clonedData.layout.actions) {
        clonedData.layout.actions = clonedData.layout.actions.map((action) => ({
          ...action,
          id: uuidv4(), // New Action ID
          createdAt: now,
          updatedAt: now,
        }));
      }
    }

    // Tags are usually simple values, cloning the array is often sufficient
    // If tags had IDs or complex structures, they'd need updating too.
    // clonedData.tags = sourceForm.tags ? [...sourceForm.tags] : undefined; // Already handled by deep clone

    // Save the modified cloned data as a new FormShape
    // The saveForm method will handle validation and persistence
    try {
      return await this.saveForm(clonedData);
    } catch (saveError) {
      console.error(
        `Error saving cloned FormShape with new id ${newId}:`,
        saveError
      );
      // Depending on requirements, you might want to throw, return null, or attempt cleanup
      return null;
    }
  }

  /**
   * Get forms that implement a specific schema (using findForms for efficiency)
   */
  async getFormsBySchema(schemaId: string): Promise<FormShape[]> {
    // Reuse findForms for consistency and efficiency
    return this.findForms({ schemaId: schemaId });
  }

  private safeJsonParse(
    jsonString: string | null | undefined,
    defaultValue: any = null
  ): any {
    if (!jsonString) return defaultValue;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Error parsing JSON property:", e, "String:", jsonString);
      return defaultValue;
    }
  }

  private toNumber(value: Integer | number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    if (neo4j.isInt(value)) {
      return value.toNumber();
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private toBoolean(value: boolean | null | undefined): boolean | null {
    if (value === null || value === undefined) return null;
    return Boolean(value);
  }
}
