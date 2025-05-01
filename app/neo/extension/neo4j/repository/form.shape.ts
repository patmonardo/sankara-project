import { Neo4jConnection } from '../connection';
import { FormShape, FormField, FormSection, FormLayout, FormOption } from '@/form/schema/shape';

/**
 * FormRepository
 * 
 * Manages the persistence of Forms in Neo4j,
 * representing the concrete manifestation of forms that users interact with.
 * This repository handles the empirical representation of forms as values.
 */
export class FormRepository {
  private connection: Neo4jConnection;
  
  constructor(connection: Neo4jConnection) {
    this.connection = connection;
  }
  
  /**
   * Persist a FormShape to Neo4j
   * 
   * Stores the complete form structure including fields, layout, and metadata.
   */
  async saveForm(form: FormShape): Promise<FormShape> {
    const session = this.connection.getSession();
    
    try {
      const txc = session.beginTransaction();
      
      // Create Form node
      await txc.run(`
        MERGE (f:Form {id: $id})
        SET f.name = $name,
            f.title = $title,
            f.description = $description,
            f.createdAt = $createdAt,
            f.updatedAt = $updatedAt
        
        // If the form references a schema, connect it
        // WITH f
        // FOREACH (__ IN CASE WHEN $schemaId IS NOT NULL THEN [1] ELSE [] END | 
        //   MERGE (s:FormDefinition {id: $schemaId})
        //   MERGE (f)-[:IMPLEMENTS_SCHEMA]->(s)
        // )
        
        RETURN f
      `, {
        id: form.id,
        name: form.name,
        title: form.title || form.name,
        description: form.description || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        schemaId: form.matter?.source?.entityRef?.entity
      });
      
      // Store form data
      if (form.data && Object.keys(form.data).length > 0) {
        await txc.run(`
          MATCH (f:Form {id: $id})
          SET f.data = $data
          RETURN f
        `, {
          id: form.id,
          data: JSON.stringify(form.data)
        });
      }
      
      // Store form matter (data access patterns)
      if (form.matter) {
        await txc.run(`
          MATCH (f:Form {id: $id})
          SET f.matter = $matter
          RETURN f
        `, {
          id: form.id,
          matter: JSON.stringify(form.matter)
        });
      }
      
      // Process fields - first remove old fields to avoid duplicates
      await txc.run(`
        MATCH (f:Form {id: $id})-[r:HAS_FIELD]->(field:FormField)
        DETACH DELETE field
      `, { id: form.id });
      
      // Create new field nodes
      for (const field of form.fields) {
        await txc.run(`
          MATCH (f:Form {id: $id})
          
          CREATE (field:FormField {
            id: $fieldId,
            formId: $id,
            type: $type,
            name: $name,
            label: $label,
            description: $description,
            placeholder: $placeholder,
            required: $required,
            disabled: $disabled,
            readOnly: $readOnly,
            visible: $visible
          })
          
          // Set optional properties
          FOREACH (__ IN CASE WHEN $defaultValue IS NOT NULL THEN [1] ELSE [] END | 
            SET field.defaultValue = $defaultValue)
            
          FOREACH (__ IN CASE WHEN $createOnly = true THEN [1] ELSE [] END | 
            SET field.createOnly = true)
            
          FOREACH (__ IN CASE WHEN $editOnly = true THEN [1] ELSE [] END | 
            SET field.editOnly = true)
            
          FOREACH (__ IN CASE WHEN $inputType IS NOT NULL THEN [1] ELSE [] END | 
            SET field.inputType = $inputType)
            
          FOREACH (__ IN CASE WHEN $format IS NOT NULL THEN [1] ELSE [] END | 
            SET field.format = $format)
            
          FOREACH (__ IN CASE WHEN $validation IS NOT NULL THEN [1] ELSE [] END | 
            SET field.validation = $validation)
            
          // Link to form
          CREATE (f)-[:HAS_FIELD {order: $index}]->(field)
          
          RETURN field
        `, {
          id: form.id,
          fieldId: field.id,
          type: field.type,
          name: field.name || field.id,
          label: field.label || field.name || field.id,
          description: field.description || '',
          placeholder: field.placeholder || '',
          required: field.required || false,
          disabled: field.disabled || false,
          readOnly: field.readOnly || false,
          visible: field.visible !== undefined ? field.visible : true,
          defaultValue: field.defaultValue !== undefined ? 
            (typeof field.defaultValue === 'object' ? 
              JSON.stringify(field.defaultValue) : field.defaultValue.toString()) : 
            null,
          createOnly: field.createOnly || false,
          editOnly: field.editOnly || false,
          inputType: field.inputType || null,
          format: field.format || null,
          validation: field.validation ? JSON.stringify(field.validation) : null,
          index: form.fields.indexOf(field)
        });
        
        // Add field options if present
        if (field.options && field.options.length > 0) {
          for (let i = 0; i < field.options.length; i++) {
            const option = field.options[i];
            await txc.run(`
              MATCH (field:FormField {id: $fieldId})
              
              CREATE (o:FormOption {
                id: $optionId,
                fieldId: $fieldId,
                label: $label,
                value: $value
              })
              
              CREATE (field)-[:HAS_OPTION {order: $index}]->(o)
              
              RETURN o
            `, {
              fieldId: field.id,
              optionId: `${field.id}_option_${i}`,
              label: option.label,
              value: typeof option.value === 'object' ? 
                JSON.stringify(option.value) : option.value.toString(),
              index: i
            });
          }
        }
      }
      
      // Process layout if present
      if (form.layout) {
        await txc.run(`
          MATCH (f:Form {id: $id})
          
          MERGE (layout:FormLayout {id: $layoutId})
          SET layout.title = $title,
              layout.columns = $columns
              
          MERGE (f)-[:HAS_LAYOUT]->(layout)
          
          RETURN layout
        `, {
          id: form.id,
          layoutId: `${form.id}_layout`,
          title: form.layout.title || form.name,
          columns: form.layout.columns || 'single'
        });
        
        // Process sections if present
        if (form.layout.sections && form.layout.sections.length > 0) {
          // First clean up old sections
          await txc.run(`
            MATCH (layout:FormLayout {id: $layoutId})-[r:HAS_SECTION]->(s:FormSection)
            DETACH DELETE s
          `, { layoutId: `${form.id}_layout` });
          
          // Create new sections
          for (let i = 0; i < form.layout.sections.length; i++) {
            const section = form.layout.sections[i];
            await txc.run(`
              MATCH (layout:FormLayout {id: $layoutId})
              
              CREATE (s:FormSection {
                id: $sectionId,
                name: $name,
                title: $title,
                description: $description,
                columns: $columns,
                priority: $priority,
                collapsible: $collapsible,
                collapsed: $collapsed,
                className: $className
              })
              
              CREATE (layout)-[:HAS_SECTION {order: $index}]->(s)
              
              RETURN s
            `, {
              layoutId: `${form.id}_layout`,
              sectionId: section.id,
              name: section.name || section.id,
              title: section.title || section.name || section.id,
              description: section.description || '',
              columns: section.columns || 1,
              priority: section.priority || 1,
              collapsible: section.collapsible || false,
              collapsed: section.collapsed || false,
              className: section.className || '',
              index: i
            });
            
            // Connect fields to this section
            if (section.fields && section.fields.length > 0) {
              for (let j = 0; j < section.fields.length; j++) {
                const fieldId = section.fields[j];
                await txc.run(`
                  MATCH (s:FormSection {id: $sectionId})
                  MATCH (f:FormField {id: $fieldId})
                  MERGE (s)-[:CONTAINS_FIELD {order: $index}]->(f)
                  RETURN f
                `, {
                  sectionId: section.id,
                  fieldId: fieldId,
                  index: j
                });
              }
            }
          }
        }
        
        // Process actions if present
        if (form.layout.actions && form.layout.actions.length > 0) {
          // First clean up old actions
          await txc.run(`
            MATCH (layout:FormLayout {id: $layoutId})-[r:HAS_ACTION]->(a:FormAction)
            DETACH DELETE a
          `, { layoutId: `${form.id}_layout` });
          
          // Create new actions
          for (let i = 0; i < form.layout.actions.length; i++) {
            const action = form.layout.actions[i];
            await txc.run(`
              MATCH (layout:FormLayout {id: $layoutId})
              
              CREATE (a:FormAction {
                id: $actionId,
                type: $type,
                label: $label,
                primary: $primary,
                disabled: $disabled,
                position: $position
              })
              
              CREATE (layout)-[:HAS_ACTION {order: $index}]->(a)
              
              RETURN a
            `, {
              layoutId: `${form.id}_layout`,
              actionId: action.id,
              type: action.type,
              label: action.label,
              primary: action.primary || false,
              disabled: action.disabled || false,
              position: action.position || 'bottom',
              index: i
            });
          }
        }
      }
      
      // Store form state if present
      if (form.state) {
        await txc.run(`
          MATCH (f:Form {id: $id})
          SET f.state = $state
          RETURN f
        `, {
          id: form.id,
          state: JSON.stringify(form.state)
        });
      }
      
      
      await txc.commit();
      
      // Return updated form with current timestamp
      return {
        ...form,
       
      };
    } catch (error) {
      console.error(`Error saving form to Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Get a form by ID
   * 
   * Retrieves the complete form structure from Neo4j
   */
  async getFormById(id: string): Promise<FormShape | null> {
    const session = this.connection.getSession({ defaultAccessMode: 'READ' });
    
    try {
      // Get the form node
      const formResult = await session.run(`
        MATCH (f:Form {id: $id})
        OPTIONAL MATCH (f)-[:IMPLEMENTS_SCHEMA]->(s:FormDefinition)
        RETURN f, s.id as schemaId
      `, { id });
      
      if (formResult.records.length === 0) {
        return null;
      }
      
      const formNode = formResult.records[0].get('f').properties;
      const schemaId = formResult.records[0].get('schemaId');
      
      // Parse JSON fields
      let data = {};
      if (formNode.data) {
        try {
          data = JSON.parse(formNode.data);
        } catch (e) {
          console.error('Error parsing form data:', e);
        }
      }
      
      let matter = undefined;
      if (formNode.matter) {
        try {
          matter = JSON.parse(formNode.matter);
        } catch (e) {
          console.error('Error parsing form matter:', e);
        }
      }
      
      let state = undefined;
      if (formNode.state) {
        try {
          state = JSON.parse(formNode.state);
        } catch (e) {
          console.error('Error parsing form state:', e);
        }
      }
      
      // If schema ID is present and matter is undefined, create it
      if (schemaId && !matter) {
        matter = {
          sourceId: {
            type: 'entity',
            entityRef: {
              entity: schemaId,
              id: id
            }
          }
        };
      }
      
      // Get fields
      const fields = await this.getFormFields(id, session);
      
      // Get layout
      const layout = await this.getFormLayout(id, session);
      
      // Build the complete form
      const form: FormShape = {
        id: formNode.id,
        name: formNode.name,
        title: formNode.title,
        description: formNode.description,
        fields,
        data,
        matter,
        layout,
        state,
      };
      
      return form;
    } catch (error) {
      console.error(`Error getting form from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Get fields for a form
   */
  private async getFormFields(formId: string, session: any): Promise<FormField[]> {
    const fieldsResult = await session.run(`
      MATCH (f:Form {id: $formId})-[r:HAS_FIELD]->(field:FormField)
      OPTIONAL MATCH (field)-[optRel:HAS_OPTION]->(opt:FormOption)
      WITH field, r.order as fieldOrder, collect({
        option: opt,
        order: optRel.order
      }) as options
      ORDER BY fieldOrder
      RETURN field, options
    `, { formId });
    
    const fields: FormField[] = [];
    
    for (const record of fieldsResult.records) {
      const field = record.get('field').properties;
      const options = record.get('options');
      
      // Parse validation if exists
      let validation = undefined;
      if (field.validation) {
        try {
          validation = JSON.parse(field.validation);
        } catch (e) {
          console.error('Error parsing field validation:', e);
        }
      }
      
      // Parse default value if it's JSON
      let defaultValue = field.defaultValue;
      if (typeof defaultValue === 'string') {
        try {
          if (defaultValue.startsWith('{') || defaultValue.startsWith('[')) {
            defaultValue = JSON.parse(defaultValue);
          }
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      
      // Process options
      const fieldOptions: FormOption[] = [];
      if (options && options.length > 0) {
        const validOptions = options.filter((opt: any) => opt.option !== null);
        
        validOptions.sort((a: any, b: any) => a.order - b.order);
        
        for (const opt of validOptions) {
          const option = opt.option.properties;
          
          // Parse value if it's JSON
          let value = option.value;
          try {
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
              value = JSON.parse(value);
            }
          } catch (e) {
            // Keep as string if parsing fails
          }
          
          fieldOptions.push({
            value,
            label: option.label
          });
        }
      }
      
      fields.push({
        id: field.id,
        type: field.type,
        name: field.name,
        title: field.title,
        description: field.description,
        label: field.label,
        placeholder: field.placeholder,
        defaultValue,
        required: field.required,
        disabled: field.disabled,
        createOnly: field.createOnly,
        editOnly: field.editOnly,
        readOnly: field.readOnly,
        visible: field.visible,
        validation,
        options: fieldOptions.length > 0 ? fieldOptions : undefined,
        inputType: field.inputType,
        format: field.format,
      });
    }
    
    return fields;
  }
  
  /**
   * Get layout for a form
   */
  private async getFormLayout(formId: string, session: any): Promise<FormLayout | undefined> {
    const layoutResult = await session.run(`
      MATCH (f:Form {id: $formId})-[:HAS_LAYOUT]->(layout:FormLayout)
      RETURN layout
    `, { formId });
    
    if (layoutResult.records.length === 0) {
      return undefined;
    }
    
    const layoutNode = layoutResult.records[0].get('layout').properties;
    
    // Get sections
    const sectionsResult = await session.run(`
      MATCH (layout:FormLayout {id: $layoutId})-[r:HAS_SECTION]->(section:FormSection)
      OPTIONAL MATCH (section)-[fieldRel:CONTAINS_FIELD]->(field:FormField)
      WITH section, r.order as sectionOrder, collect({
        fieldId: field.id,
        order: fieldRel.order
      }) as sectionFields
      ORDER BY sectionOrder
      RETURN section, sectionFields
    `, { layoutId: `${formId}_layout` });
    
    const sections: FormSection[] = [];
    
    for (const record of sectionsResult.records) {
      const section = record.get('section').properties;
      const sectionFields = record.get('sectionFields');
      
      // Process fields
      const fields: string[] = [];
      if (sectionFields && sectionFields.length > 0) {
        const validFields = sectionFields.filter((f: any) => f.fieldId !== null);
        
        validFields.sort((a: any, b: any) => a.order - b.order);
        
        for (const f of validFields) {
          fields.push(f.fieldId);
        }
      }
      
      sections.push({
        id: section.id,
        name: section.name,
        title: section.title,
        description: section.description,
        fields,
        columns: parseInt(section.columns),
        priority: parseInt(section.priority),
        collapsible: section.collapsible,
        collapsed: section.collapsed,
        className: section.className,
      });
    }
    
    // Get actions
    const actionsResult = await session.run(`
      MATCH (layout:FormLayout {id: $layoutId})-[r:HAS_ACTION]->(action:FormAction)
      WITH action, r.order as actionOrder
      ORDER BY actionOrder
      RETURN action
    `, { layoutId: `${formId}_layout` });
    
    const actions = actionsResult.records.map((record: any)  => {
      const action = record.get('action').properties;
      return {
        id: action.id,
        type: action.type,
        label: action.label,
        primary: action.primary,
        disabled: action.disabled,
        position: action.position
      };
    });
    
    return {
      title: layoutNode.title,
      columns: layoutNode.columns,
      sections: sections.length > 0 ? sections : undefined,
      actions: actions.length > 0 ? actions : undefined
    };
  }
  
  /**
   * Find forms by criteria
   */
  async findForms(criteria: {
    name?: string;
    schemaId?: string;
    tags?: string[];
  } = {}): Promise<FormShape[]> {
    const session = this.connection.getSession({ defaultAccessMode: 'READ' });
    
    try {
      let query = `
        MATCH (f:Form)
        WHERE 1=1
      `;
      
      const params: Record<string, any> = {};
      
      if (criteria.name) {
        query += ` AND (f.name CONTAINS $name OR f.title CONTAINS $name)`;
        params.name = criteria.name;
      }
      
      if (criteria.schemaId) {
        query += ` AND (f)-[:IMPLEMENTS_SCHEMA]->(:FormDefinition {id: $schemaId})`;
        params.schemaId = criteria.schemaId;
      }
      
      if (criteria.tags && criteria.tags.length > 0) {
        query += ` AND (f)-[:HAS_TAG]->(:Tag) WHERE tag.name IN $tags`;
        params.tags = criteria.tags;
      }
      
      query += ` RETURN f.id as id`;
      
      const result = await session.run(query, params);
      
      const forms: FormShape[] = [];
      
      for (const record of result.records) {
        const id = record.get('id');
        const form = await this.getFormById(id);
        
        if (form) {
          forms.push(form);
        }
      }
      
      return forms;
    } catch (error) {
      console.error(`Error finding forms in Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Delete a form by ID
   */
  async deleteForm(id: string): Promise<boolean> {
    const session = this.connection.getSession();
    
    try {
      const txc = session.beginTransaction();
      
      // Delete form and all its related structures
      await txc.run(`
        MATCH (f:Form {id: $id})
        
        // Find all related nodes to clean up
        OPTIONAL MATCH (f)-[:HAS_FIELD]->(field:FormField)
        OPTIONAL MATCH (field)-[:HAS_OPTION]->(option:FormOption)
        OPTIONAL MATCH (f)-[:HAS_LAYOUT]->(layout:FormLayout)
        OPTIONAL MATCH (layout)-[:HAS_SECTION]->(section:FormSection)
        OPTIONAL MATCH (layout)-[:HAS_ACTION]->(action:FormAction)
        
        // Delete all relationships and nodes
        DETACH DELETE option, field, action, section, layout, f
        
        RETURN count(*) as deleted
      `, { id });
      
      await txc.commit();
      
      return true;
    } catch (error) {
      console.error(`Error deleting form from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Clone a form
   * 
   * Creates a new form based on an existing one with a new ID
   */
  async cloneForm(sourceId: string, newId: string, newName?: string): Promise<FormShape | null> {
    // Get the source form
    const sourceForm = await this.getFormById(sourceId);
    
    if (!sourceForm) {
      return null;
    }
    
    // Create a new form with the source form's data
    const clonedForm: FormShape = {
      ...sourceForm,
      id: newId,
      name: newName || `Copy of ${sourceForm.name}`,
    };
    
    // Save the new form
    return this.saveForm(clonedForm);
  }
  
  /**
   * Get forms that implement a specific schema
   */
  async getFormsBySchema(schemaId: string): Promise<FormShape[]> {
    const session = this.connection.getSession({ defaultAccessMode: 'READ' });
    
    try {
      const result = await session.run(`
        MATCH (f:Form)-[:IMPLEMENTS_SCHEMA]->(:FormDefinition {id: $schemaId})
        RETURN f.id as id
      `, { schemaId });
      
      const forms: FormShape[] = [];
      
      for (const record of result.records) {
        const id = record.get('id');
        const form = await this.getFormById(id);
        
        if (form) {
          forms.push(form);
        }
      }
      
      return forms;
    } catch (error) {
      console.error(`Error getting forms by schema from Neo4j: ${error}`);
      throw error;
    } finally {
      await session.close();
    }
  }
}