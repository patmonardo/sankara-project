import { NeoCore, NeoExtension } from '../neo';
import { NeoEvent } from '../event';

/**
 * Task Definition for LangGraph
 */
export interface TaskDefinition {
  id: string;
  name: string;
  type: 'agent' | 'workflow' | 'tool' | 'rag';
  graph: {
    nodes: Array<{
      id: string;
      type: string;
      config: Record<string, any>;
    }>;
    edges: Array<{
      from: string;
      to: string;
      label?: string;
    }>;
  };
  inputs: Array<{
    name: string;
    type: string;
    description?: string;
    required: boolean;
    default?: any;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Tara Extension - Transcendental Task Definition Manager
 * 
 * Handles:
 * - Task definitions using LangGraph
 * - Workflow orchestration
 * - Bridge between Transcendental and Ordinary forms
 */
export class TaraExtension implements NeoExtension {
  id = 'tara';
  type = 'transcendental';
  capabilities = [
    'task.definition',     // Task definition management
    'workflow.execution',  // Workflow execution
    'langgraph.integration', // LangGraph integration
    'form.transformation'  // Form transformation
  ];
  
  private core: NeoCore | null = null;
  private neoExtension: any = null; // Reference to Neo extension
  private langGraphClient: any = null;
  
  constructor(private config: {
    langGraph?: {
      url: string;
      apiKey?: string;
    };
  } = {}) {}
  
  /**
   * Initialize with Neo core
   */
  async initialize(core: NeoCore): Promise<void> {
    this.core = core;
    
    console.log('[Tara] Initializing Transcendental Task Manager');
    
    // Get reference to Neo extension
    this.neoExtension = core.getExtension('neo');
    if (!this.neoExtension) {
      console.warn('[Tara] Neo extension not found, some features may be limited');
    }
    
    // Initialize LangGraph client
    if (this.config.langGraph) {
      try {
        this.langGraphClient = {
          // Placeholder for actual LangGraph client
          // In a real implementation, this would connect to LangGraph
          tasks: {
            create: async (definition: any) => {
              return { ...definition, id: definition.id || `task-${Date.now()}` };
            },
            run: async (taskId: string, inputs: any) => {
              return { taskId, result: `Simulated task result for ${taskId} with inputs: ${JSON.stringify(inputs)}` };
            },
            get: async (taskId: string) => {
              return { id: taskId, status: 'ready' };
            }
          }
        };
        console.log('[Tara] LangGraph client initialized');
      } catch (error) {
        console.error('[Tara] Failed to initialize LangGraph client:', error);
      }
    }
    
    // Set up event handlers
    this.setupEventHandlers();
    
    console.log('[Tara] Transcendental Task Manager initialized');
  }
  
  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    if (!this.core) return;
    
    // Task operations
    this.core.dialectic.onEvent('tara.task.create', this.handleTaskCreate.bind(this));
    this.core.dialectic.onEvent('tara.task.get', this.handleTaskGet.bind(this));
    this.core.dialectic.onEvent('tara.task.run', this.handleTaskRun.bind(this));
    this.core.dialectic.onEvent('tara.task.list', this.handleTaskList.bind(this));
    
    // Form transformation operations
    this.core.dialectic.onEvent('tara.form.transform', this.handleFormTransform.bind(this));
    this.core.dialectic.onEvent('tara.form.generate', this.handleFormGenerate.bind(this));
    
    // Bridge operations
    this.core.dialectic.onEvent('tara.bridge.transcendental', this.handleBridgeToTranscendental.bind(this));
    this.core.dialectic.onEvent('tara.bridge.ordinary', this.handleBridgeToOrdinary.bind(this));
  }
  
  /**
   * Handle task creation
   */
  private async handleTaskCreate(event: NeoEvent): Promise<void> {
    try {
      const taskDef: TaskDefinition = event.content;
      
      if (!taskDef.id) {
        taskDef.id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Validate task definition
      this.validateTaskDefinition(taskDef);
      
      // Store task as a transcendental form in Neo4j using Neo extension
      if (this.neoExtension && this.core) {
        const formResponse = await this.core.dialectic.emit({
          type: 'neo.form.create',
          content: {
            id: taskDef.id,
            type: 'context', // Tasks are represented as contexts
            name: taskDef.name,
            schema: {
              properties: {
                name: { type: 'string', required: true },
                type: { type: 'string', required: true },
                status: { type: 'string', default: 'created' },
                created: { type: 'number', default: Date.now() }
              },
              relations: [
                {
                  name: 'hasNode',
                  targetId: 'TaskNode',
                  cardinality: 'many'
                },
                {
                  name: 'hasEdge',
                  targetId: 'TaskEdge',
                  cardinality: 'many'
                }
              ]
            },
            metadata: {
              taskDefinition: taskDef,
              langgraph: true,
              inputs: taskDef.inputs,
              outputs: taskDef.outputs
            }
          }
        });
        
        // Register with LangGraph if client is available
        let langGraphTask;
        if (this.langGraphClient) {
          try {
            langGraphTask = await this.langGraphClient.tasks.create(taskDef);
          } catch (error) {
            console.error('[Tara] Failed to register task with LangGraph:', error);
          }
        }
        
        this.emitSuccess(event, {
          task: taskDef,
          form: formResponse?.content?.form,
          langGraph: langGraphTask
        });
      } else {
        // No Neo extension, just use in-memory storage
        this.emitSuccess(event, { task: taskDef });
      }
    } catch (error) {
      this.emitError(event, `Task creation error: ${error.message}`);
    }
  }
  
  /**
   * Validate task definition
   */
  private validateTaskDefinition(taskDef: TaskDefinition): void {
    if (!taskDef.name) {
      throw new Error('Task name is required');
    }
    
    if (!taskDef.type || !['agent', 'workflow', 'tool', 'rag'].includes(taskDef.type)) {
      throw new Error('Task type must be agent, workflow, tool, or rag');
    }
    
    if (!taskDef.graph || !Array.isArray(taskDef.graph.nodes) || !Array.isArray(taskDef.graph.edges)) {
      throw new Error('Task graph with nodes and edges is required');
    }
    
    if (taskDef.graph.nodes.length === 0) {
      throw new Error('Task graph must have at least one node');
    }
    
    // Validate nodes
    for (const node of taskDef.graph.nodes) {
      if (!node.id) {
        throw new Error('Each node must have an ID');
      }
      if (!node.type) {
        throw new Error(`Node ${node.id} must have a type`);
      }
    }
    
    // Validate edges
    for (const edge of taskDef.graph.edges) {
      if (!edge.from) {
        throw new Error('Each edge must have a from property');
      }
      if (!edge.to) {
        throw new Error('Each edge must have a to property');
      }
      
      // Verify that from and to nodes exist
      const fromNode = taskDef.graph.nodes.find(n => n.id === edge.from);
      const toNode = taskDef.graph.nodes.find(n => n.id === edge.to);
      
      if (!fromNode) {
        throw new Error(`Edge references non-existent from node: ${edge.from}`);
      }
      if (!toNode) {
        throw new Error(`Edge references non-existent to node: ${edge.to}`);
      }
    }
  }
  
  /**
   * Handle task retrieval
   */
  private async handleTaskGet(event: NeoEvent): Promise<void> {
    try {
      const { id } = event.content;
      
      if (!id) {
        this.emitError(event, 'Task ID is required');
        return;
      }
      
      // Try to get task from Neo4j via Neo extension
      if (this.neoExtension && this.core) {
        const formResponse = await this.core.dialectic.emit({
          type: 'neo.form.get',
          content: { id }
        });
        
        if (formResponse?.content?.form) {
          const form = formResponse.content.form;
          const taskDef = form.metadata?.taskDefinition;
          
          if (taskDef) {
            // Get LangGraph status if available
            let langGraphStatus;
            if (this.langGraphClient) {
              try {
                langGraphStatus = await this.langGraphClient.tasks.get(id);
              } catch (error) {
                console.warn(`[Tara] Failed to get LangGraph status for task ${id}:`, error);
              }
            }
            
            this.emitSuccess(event, {
              task: taskDef,
              form,
              langGraph: langGraphStatus
            });
            return;
          }
        }
        
        this.emitError(event, `Task not found: ${id}`);
      } else {
        this.emitError(event, 'Neo extension not available for task retrieval');
      }
    } catch (error) {
      this.emitError(event, `Task retrieval error: ${error.message}`);
    }
  }
  
  /**
   * Handle task execution
   */
  private async handleTaskRun(event: NeoEvent): Promise<void> {
    try {
      const { id, inputs } = event.content;
      
      if (!id) {
        this.emitError(event, 'Task ID is required');
        return;
      }
      
      if (!inputs) {
        this.emitError(event, 'Inputs are required');
        return;
      }
      
      // Get task definition
      let taskDef: TaskDefinition;
      
      if (this.neoExtension && this.core) {
        const formResponse = await this.core.dialectic.emit({
          type: 'neo.form.get',
          content: { id }
        });
        
        if (!formResponse?.content?.form || !formResponse.content.form.metadata?.taskDefinition) {
          this.emitError(event, `Task not found: ${id}`);
          return;
        }
        
        taskDef = formResponse.content.form.metadata.taskDefinition;
      } else {
        this.emitError(event, 'Neo extension not available for task retrieval');
        return;
      }
      
      // Validate inputs against task definition
      this.validateTaskInputs(inputs, taskDef);
      
      // Run task using LangGraph client
      let result;
      if (this.langGraphClient) {
        try {
          result = await this.langGraphClient.tasks.run(id, inputs);
        } catch (error) {
          this.emitError(event, `LangGraph execution error: ${error.message}`);
          return;
        }
      } else {
        // Simulate execution for testing
        result = {
          taskId: id,
          result: `Simulated execution of task ${id} with inputs: ${JSON.stringify(inputs)}`
        };
      }
      
      // Update task status in Neo4j
      if (this.core) {
        try {
          await this.core.dialectic.emit({
            type: 'neo.form.update',
            content: {
              id,
              updates: {
                metadata: {
                  lastRun: {
                    timestamp: Date.now(),
                    inputs,
                    result
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error('[Tara] Failed to update task status:', error);
        }
      }
      
      this.emitSuccess(event, { result });
    } catch (error) {
      this.emitError(event, `Task execution error: ${error.message}`);
    }
  }
  
  /**
   * Validate task inputs against definition
   */
  private validateTaskInputs(inputs: Record<string, any>, taskDef: TaskDefinition): void {
    // Check required inputs
    for (const inputDef of taskDef.inputs) {
      if (inputDef.required && inputs[inputDef.name] === undefined) {
        throw new Error(`Required input ${inputDef.name} is missing`);
      }
    }
  }
  
  /**
   * Handle task listing
   */
  private async handleTaskList(event: NeoEvent): Promise<void> {
    try {
      const { type, limit = 100, offset = 0 } = event.content || {};
      
      if (this.neoExtension && this.core) {
        // Query forms with taskDefinition in metadata
        const formListResponse = await this.core.dialectic.emit({
          type: 'neo.graph.query',
          content: {
            query: `
              MATCH (f:Form:Transcendental)
              WHERE f.type = 'context' AND exists(f.metadata)
              AND f.metadata CONTAINS 'taskDefinition'
              ${type ? "AND f.metadata CONTAINS $typePattern" : ""}
              RETURN f
              ORDER BY f.name
              SKIP $offset
              LIMIT $limit
            `,
            params: {
              typePattern: type ? `"type":"${type}"` : undefined,
              offset: parseInt(offset as any),
              limit: parseInt(limit as any)
            }
          }
        });
        
        const forms = formListResponse?.content?.result || [];
        
        // Extract task definitions
        const tasks = forms.map((result: any) => {
          const form = result.f;
          const metadata = JSON.parse(form.metadata || '{}');
          return metadata.taskDefinition || { id: form.id, name: form.name };
        });
        
        // Get total count
        const countResponse = await this.core.dialectic.emit({
          type: 'neo.graph.query',
          content: {
            query: `
              MATCH (f:Form:Transcendental)
              WHERE f.type = 'context' AND exists(f.metadata)
              AND f.metadata CONTAINS 'taskDefinition'
              ${type ? "AND f.metadata CONTAINS $typePattern" : ""}
              RETURN count(f) as count
            `,
            params: {
              typePattern: type ? `"type":"${type}"` : undefined
            }
          }
        });
        
        const total = countResponse?.content?.result?.[0]?.count || 0;
        
        this.emitSuccess(event, {
          tasks,
          pagination: {
            total,
            limit,
            offset,
            page: Math.floor(parseInt(offset as any) / parseInt(limit as any)) + 1,
            pages: Math.ceil(total / parseInt(limit as any))
          }
        });
      } else {
        this.emitError(event, 'Neo extension not available for task listing');
      }
    } catch (error) {
      this.emitError(event, `Task list error: ${error.message}`);
    }
  }
  
  /**
   * Handle form transformation
   */
  private async handleFormTransform(event: NeoEvent): Promise<void> {
    try {
      const { formId, targetFormat } = event.content;
      
      if (!formId) {
        this.emitError(event, 'Form ID is required');
        return;
      }
      
      if (!targetFormat) {
        this.emitError(event, 'Target format is required');
        return;
      }
      
      // Get the form
      if (!this.neoExtension || !this.core) {
        this.emitError(event, 'Neo extension not available');
        return;
      }
      
      const formResponse = await this.core.dialectic.emit({
        type: 'neo.form.get',
        content: { id: formId }
      });
      
      if (!formResponse?.content?.form) {
        this.emitError(event, `Form not found: ${formId}`);
        return;
      }
      
      const form = formResponse.content.form;
      
      // Transform the form based on target format
      let transformed;
      
      switch (targetFormat) {
        case 'prisma':
          transformed = this.transformToPrisma(form);
          break;
          
        case 'typescript':
          transformed = this.transformToTypescript(form);
          break;
          
        case 'json-schema':
          transformed = this.transformToJsonSchema(form);
          break;
          
        default:
          this.emitError(event, `Unsupported target format: ${targetFormat}`);
          return;
      }
      
      this.emitSuccess(event, {
        original: form,
        transformed,
        format: targetFormat
      });
    } catch (error) {
      this.emitError(event, `Form transformation error: ${error.message}`);
    }
  }
  
  /**
   * Transform form to Prisma schema
   */
  private transformToPrisma(form: any): string {
    // Generate Prisma model from form definition
    let prisma = `// Prisma model generated from form: ${form.name}\n\n`;
    
    // Generate model name (PascalCase)
    const modelName = form.name.replace(/(?:^|[-_\s])(\w)/g, (_, c) => c ? c.toUpperCase() : '');
    
    prisma += `model ${modelName} {\n`;
    
    // Add ID field
    prisma += `  id String @id @default(uuid())\n`;
    
    // Add fields from properties
    for (const [propName, propSchema] of Object.entries(form.schema.properties)) {
      if (propName === 'id') continue; // Skip id as we already defined it
      
      const property = propSchema as any;
      
      // Map property type to Prisma type
      let prismaType;
      switch (property.type) {
        case 'string':
          prismaType = 'String';
          break;
        case 'number':
          prismaType = 'Float';
          break;
        case 'integer':
          prismaType = 'Int';
          break;
        case 'boolean':
          prismaType = 'Boolean';
          break;
        case 'object':
          prismaType = 'Json';
          break;
        case 'array':
          prismaType = 'Json';
          break;
        default:
          prismaType = 'String';
      }
      
      // Add required marker
      const required = property.required ? '' : '?';
      
      // Add field
      prisma += `  ${propName} ${prismaType}${required}\n`;
    }
    
    // Add relation fields if present
    if (form.schema.relations) {
      prisma += '\n  // Relations\n';
      
      for (const relation of form.schema.relations) {
        const targetModelName = relation.target.replace(/(?:^|[-_\s])(\w)/g, (_, c) => c ? c.toUpperCase() : '');
        
        if (relation.cardinality === 'many') {
          prisma += `  ${relation.name.toLowerCase()} ${targetModelName}[] @relation("${relation.name}")\n`;
        } else {
          prisma += `  ${relation.name.toLowerCase()} ${targetModelName}? @relation("${relation.name}")\n`;
          prisma += `  ${relation.name.toLowerCase()}Id String?\n`;
        }
      }
    }
    
    // Add timestamps
    prisma += '\n  // Timestamps\n';
    prisma += '  createdAt DateTime @default(now())\n';
    prisma += '  updatedAt DateTime @updatedAt\n';
    
    prisma += '}\n';
    
    return prisma;
  }
  
  /**
   * Transform form to TypeScript interface
   */
  private transformToTypescript(form: any): string {
    // Generate TypeScript interface from form definition
    let ts = `// TypeScript interface generated from form: ${form.name}\n\n`;
    
    // Generate interface name (PascalCase)
    const interfaceName = form.name.replace(/(?:^|[-_\s])(\w)/g, (_, c) => c ? c.toUpperCase() : '') + 'Interface';
    
    ts += `export interface ${interfaceName} {\n`;
    
    // Add fields from properties
    for (const [propName, propSchema] of Object.entries(form.schema.properties)) {
      const property = propSchema as any;
      
      // Add documentation comment if description exists
      if (property.description) {
        ts += `  /**\n   * ${property.description}\n   */\n`;
      }
      
      // Map property type to TypeScript type
      let tsType;
      switch (property.type) {
        case 'string':
          tsType = 'string';
          break;
        case 'number':
        case 'integer':
          tsType = 'number';
          break;
        case 'boolean':
          tsType = 'boolean';
          break;
        case 'object':
          tsType = 'Record<string, any>';
          break;
        case 'array':
          tsType = 'any[]';
          break;
        default:
          tsType = 'any';
      }
      
      // Add optional marker
      const required = property.required ? '' : '?';
      
      // Add field
      ts += `  ${propName}${required}: ${tsType};\n`;
    }
    
    // Add relation fields if present
    if (form.schema.relations) {
      ts += '\n  // Relations\n';
      
      for (const relation of form.schema.relations) {
        const targetInterfaceName = relation.target.replace(/(?:^|[-_\s])(\w)/g, (_, c) => c ? c.toUpperCase() : '') + 'Interface';
        
        if (relation.cardinality === 'many') {
          ts += `  ${relation.name}: ${targetInterfaceName}[];\n`;
        } else {
          ts += `  ${relation.name}?: ${targetInterfaceName};\n`;
        }
      }
    }
    
    ts += '}\n';
    
    return ts;
  }
  
  /**
   * Transform form to JSON Schema
   */
  private transformToJsonSchema(form: any): any {
    // Generate JSON Schema from form definition
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: form.name,
      type: 'object',
      properties: {} as Record<string, any>,
      required: [] as string[]
    };
    
    // Add properties
    for (const [propName, propSchema] of Object.entries(form.schema.properties)) {
      const property = propSchema as any;
      
      // Map property to JSON Schema
      const propDef: Record<string, any> = {
        type: property.type
      };
      
      // Add description if present
      if (property.description) {
        propDef.description = property.description;
      }
      
      // Add default if present
      if (property.default !== undefined) {
        propDef.default = property.default;
      }
      
      // Add to required array if required
      if (property.required) {
        schema.required.push(propName);
      }
      
      schema.properties[propName] = propDef;
    }
    
    // Add relation properties if present
    if (form.schema.relations) {
      for (const relation of form.schema.relations) {
        if (relation.cardinality === 'many') {
          schema.properties[relation.name] = {
            type: 'array',
            items: {
              type: 'object',
              title: relation.target
            },
            description: relation.description || `Collection of ${relation.target} objects`
          };
        } else {
          schema.properties[relation.name] = {
            type: 'object',
            title: relation.target,
            description: relation.description || `Reference to ${relation.target} object`
          };
        }
      }
    }
    
    return schema;
  }
  
  /**
   * Handle form generation
   */
  private async handleFormGenerate(event: NeoEvent): Promise<void> {
    try {
      const { type, name, schema } = event.content;
      
      if (!type || !['entity', 'relation', 'context'].includes(type)) {
        this.emitError(event, 'Valid form type (entity, relation, or context) is required');
        return;
      }
      
      if (!name) {
        this.emitError(event, 'Form name is required');
        return;
      }
      
      // Generate form definition
      const formDef = {
        id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        name,
        schema: schema || this.generateDefaultSchema(type, name),
        metadata: {
          generated: true,
          generatedAt: Date.now(),
          generator: 'tara.form.generate'
        }
      };
      
      // Create form using Neo extension
      if (this.neoExtension && this.core) {
        const formResponse = await this.core.dialectic.emit({
          type: 'neo.form.create',
          content: formDef
        });
        
        if (formResponse?.content?.form) {
          this.emitSuccess(event, {
            form: formResponse.content.form,
            handle: formResponse.content.handle
          });
          return;
        }
      }
      
      // Fallback if Neo extension failed or isn't available
      this.emitSuccess(event, { form: formDef });
    } catch (error) {
      this.emitError(event, `Form generation error: ${error.message}`);
    }
  }
  
  /**
   * Generate default schema for a form type
   */
  private generateDefaultSchema(type: string, name: string): any {
    const baseProperties = {
      name: { type: 'string', required: true, description: 'Name of the item' },
      description: { type: 'string', description: 'Description of the item' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last updated timestamp' }
    };
    
    switch (type) {
      case 'entity':
        return {
          properties: {
            ...baseProperties,
            entityType: { type: 'string', required: true, description: 'Type of entity' },
            attributes: { type: 'object', description: 'Custom attributes for the entity' }
          }
        };
        
      case 'relation':
        return {
          properties: {
            ...baseProperties,
            relationType: { type: 'string', required: true, description: 'Type of relation' },
            strength: { type: 'number', description: 'Strength or weight of the relation' }
          },
          relations: [
            {
              name: 'source',
              targetId: 'Entity',
              cardinality: 'one',
              description: 'Source entity of the relation'
            },
            {
              name: 'target',
              targetId: 'Entity',
              cardinality: 'one',
              description: 'Target entity of the relation'
            }
          ]
        };
        
      case 'context':
        return {
          properties: {
            ...baseProperties,
            contextType: { type: 'string', required: true, description: 'Type of context' },
            scope: { type: 'string', description: 'Scope of the context' },
            validity: { type: 'object', description: 'Validity constraints for the context' }
          },
          relations: [
            {
              name: 'contains',
              targetId: 'Entity',
              cardinality: 'many',
              description: 'Entities contained in this context'
            }
          ]
        };
        
      default:
        return {
          properties: baseProperties
        };
    }
  }
  
  /**
   * Handle bridge to transcendental
   */
  private async handleBridgeToTranscendental(event: NeoEvent): Promise<void> {
    try {
      const { source, sourceType, targetType } = event.content;
      
      if (!source) {
        this.emitError(event, 'Source data is required');
        return;
      }
      
      if (!sourceType) {
        this.emitError(event, 'Source type is required');
        return;
      }
      
      if (!targetType) {
        this.emitError(event, 'Target type is required');
        return;
      }
      
      // Transform from ordinary to transcendental
      let transformed;
      
      switch (sourceType) {
        case 'json':
          transformed = this.transformJsonToTranscendental(source, targetType);
          break;
          
        case 'csv':
          transformed = this.transformCsvToTranscendental(source, targetType);
          break;
          
        case 'prisma':
          transformed = this.transformPrismaToTranscendental(source, targetType);
          break;
          
        default:
          this.emitError(event, `Unsupported source type: ${sourceType}`);
          return;
      }
      
      // Create form using transformed data if Neo extension is available
      if (this.neoExtension && this.core) {
        const formResponse = await this.core.dialectic.emit({
          type: 'neo.form.create',
          content: transformed
        });
        
        if (formResponse?.content?.form) {
          this.emitSuccess(event, {
            transformed,
            form: formResponse.content.form,
            handle: formResponse.content.handle
          });
          return;
        }
      }
      
      // Fallback if Neo extension failed or isn't available
      this.emitSuccess(event, { transformed });
    } catch (error) {
      this.emitError(event, `Bridge to transcendental error: ${error.message}`);
    }
  }
  
  /**
   * Transform JSON data to transcendental form
   */
  private transformJsonToTranscendental(source: any, targetType: string): any {
    // Basic implementation - would need enhancement for real-world use
    const schema = {
      properties: {} as Record<string, any>
    };
    
    // Generate schema from JSON data
    if (typeof source === 'object' && source !== null) {
      for (const [key, value] of Object.entries(source)) {
        const type = typeof value;
        
        if (type === 'object' && Array.isArray(value)) {
          schema.properties[key] = { type: 'array' };
        } else {
          schema.properties[key] = { type };
        }
      }
    }
    
    // Add relations if it's a relation form
    if (targetType === 'relation') {
      schema.relations = [
        {
          name: 'source',
          targetId: 'Entity',
          cardinality: 'one'
        },
        {
          name: 'target',
          targetId: 'Entity',
          cardinality: 'one'
        }
      ];
    }
    
    return {
      id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: targetType,
      name: source.name || 'Json-Derived Form',
      schema,
      metadata: {
        sourceType: 'json',
        transformedAt: Date.now(),
        original: source
      }
    };
  }
  
  /**
   * Transform CSV data to transcendental form
   */
  private transformCsvToTranscendental(source: string, targetType: string): any {
    // Very basic CSV parsing - would need a proper CSV parser for real-world use
    const lines = source.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Create schema from headers
    const schema = {
      properties: {} as Record<string, any>
    };
    
    // Use first data row to infer types
    const firstDataRow = lines[1].split(',').map(d => d.trim());
    
    headers.forEach((header, index) => {
      const value = firstDataRow[index];
      let type = 'string';
      
      // Very basic type inference
      if (!isNaN(parseFloat(value))) {
        type = 'number';
      } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        type = 'boolean';
      }
      
      schema.properties[header] = { type };
    });
    
    // Add relations for relation forms
    if (targetType === 'relation') {
      schema.relations = [
        {
          name: 'source',
          targetId: 'Entity',
          cardinality: 'one'
        },
        {
          name: 'target',
          targetId: 'Entity',
          cardinality: 'one'
        }
      ];
    }
    
    return {
      id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: targetType,
      name: 'CSV-Derived Form',
      schema,
      metadata: {
        sourceType: 'csv',
        transformedAt: Date.now(),
        headers,
        recordCount: lines.length - 1
      }
    };
  }
  
  /**
   * Transform Prisma schema to transcendental form
   */
  private transformPrismaToTranscendental(source: string, targetType: string): any {
    // Basic Prisma model parsing - would need a proper parser for real-world use
    
    // Try to extract model name
    const modelMatch = source.match(/model\s+(\w+)\s+\{/);
    const modelName = modelMatch ? modelMatch[1] : 'PrismaModel';
    
    // Try to extract fields
    const fieldMatches = source.matchAll(/\s+(\w+)\s+(\w+)(\??)/g);
    
    const schema = {
      properties: {} as Record<string, any>,
      relations: [] as any[]
    };
    
    // Process fields
    for (const match of fieldMatches) {
      const [, name, type, optional] = match;
      
      // Skip timestamps and id field - we'll add our own
      if (['createdAt', 'updatedAt', 'id'].includes(name)) continue;
      
      // Convert Prisma types to our schema types
      let schemaType;
      switch (type) {
        case 'String':
          schemaType = 'string';
          break;
        case 'Int':
        case 'Float':
        case 'Decimal':
          schemaType = 'number';
          break;
        case 'Boolean':
          schemaType = 'boolean';
          break;
        case 'DateTime':
          schemaType = 'string';
          break;
        case 'Json':
          schemaType = 'object';
          break;
        default:
          // Likely a relation type
          if (type.charAt(0).toUpperCase() === type.charAt(0)) {
            // Add to relations
            schema.relations.push({
              name,
              targetId: type.replace('[]', ''),
              cardinality: type.includes('[]') ? 'many' : 'one'
            });
            continue;
          } else {
            schemaType = 'string';
          }
      }
      
      schema.properties[name] = {
        type: schemaType,
        required: !optional
      };
    }
    
    // If this is a relation form but we didn't find relations, add default ones
    if (targetType === 'relation' && schema.relations.length === 0) {
      schema.relations.push(
        {
          name: 'source',
          targetId: 'Entity',
          cardinality: 'one'
        },
        {
          name: 'target',
          targetId: 'Entity',
          cardinality: 'one'
        }
      );
    }
    
    return {
      id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: targetType,
      name: modelName,
      schema,
      metadata: {
        sourceType: 'prisma',
        transformedAt: Date.now(),
        originalPrisma: source
      }
    };
  }
  
  /**
   * Handle bridge to ordinary
   */
  private async handleBridgeToOrdinary(event: NeoEvent): Promise<void> {
    try {
      const { formId, targetType } = event.content;
      
      if (!formId) {
        this.emitError(event, 'Form ID is required');
        return;
      }
      
      if (!targetType) {
        this.emitError(event, 'Target type is required');
        return;
      }
      
      // Get form definition
      if (!this.neoExtension || !this.core) {
        this.emitError(event, 'Neo extension not available');
        return;
      }
      
      const formResponse = await this.core.dialectic.emit({
        type: 'neo.form.get',
        content: { id: formId }
      });
      
      if (!formResponse?.content?.form) {
        this.emitError(event, `Form not found: ${formId}`);
        return;
      }
      
      const form = formResponse.content.form;
      
      // Transform to target type
      let result;
      switch (targetType) {
        case 'prisma':
          result = {
            type: 'prisma',
            content: this.transformToPrisma(form)
          };
          break;
          
        case 'typescript':
          result = {
            type: 'typescript',
            content: this.transformToTypescript(form)
          };
          break;
          
        case 'json-schema':
          result = {
            type: 'json-schema',
            content: this.transformToJsonSchema(form)
          };
          break;
          
        case 'sql':
          result = {
            type: 'sql',
            content: this.transformToSQL(form)
          };
          break;
          
        default:
          this.emitError(event, `Unsupported target type: ${targetType}`);
          return;
      }
      
      this.emitSuccess(event, {
        form,
        result
      });
    } catch (error) {
      this.emitError(event, `Bridge to ordinary error: ${error.message}`);
    }
  }
  
  /**
   * Transform form to SQL DDL
   */
  private transformToSQL(form: any): string {
    // Generate SQL table definition from form
    let sql = `-- SQL table generated from form: ${form.name}\n\n`;
    
    // Table name (snake_case)
    const tableName = form.name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    
    sql += `CREATE TABLE ${tableName} (\n`;
    
    // Add ID column
    sql += `  id VARCHAR(36) PRIMARY KEY,\n`;
    
    // Add columns from properties
    for (const [propName, propSchema] of Object.entries(form.schema.properties)) {
      if (propName === 'id') continue; // Skip id as we already defined it
      
      const property = propSchema as any;
      
      // Convert property name to snake_case
      const columnName = propName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      
      // Map property type to SQL type
      let sqlType;
      switch (property.type) {
        case 'string':
          sqlType = 'VARCHAR(255)';
          break;
        case 'number':
          sqlType = 'DOUBLE PRECISION';
          break;
        case 'integer':
          sqlType = 'INTEGER';
          break;
        case 'boolean':
          sqlType = 'BOOLEAN';
          break;
        case 'object':
        case 'array':
          sqlType = 'JSONB';
          break;
        default:
          sqlType = 'TEXT';
      }
      
      // Add required constraint
      const nullable = property.required ? ' NOT NULL' : '';
      
      // Add column
      sql += `  ${columnName} ${sqlType}${nullable},\n`;
    }
    
    // Add timestamp columns
    sql += `  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP\n`;
    
    sql += ');\n\n';
    
    // Add indexes
    sql += `-- Indexes for ${tableName}\n`;
    sql += `CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at);\n`;
    
    // Add foreign key constraints for relations
    if (form.schema.relations) {
      sql += `\n-- Foreign keys for ${tableName}\n`;
      
      for (const relation of form.schema.relations) {
        if (relation.cardinality === 'one') {
          const targetTable = relation.target.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
          const columnName = `${relation.name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()}_id`;
          
          sql += `ALTER TABLE ${tableName} ADD COLUMN ${columnName} VARCHAR(36);\n`;
          sql += `ALTER TABLE ${tableName} ADD CONSTRAINT fk_${tableName}_${columnName}\n`;
          sql += `  FOREIGN KEY (${columnName}) REFERENCES ${targetTable}(id);\n`;
        }
      }
      
      // For many-to-many relations
      for (const relation of form.schema.relations) {
        if (relation.cardinality === 'many') {
          const targetTable = relation.target.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
          const junctionTable = `${tableName}_${targetTable}`;
          
          sql += `\n-- Junction table for ${tableName} to ${targetTable} relationship\n`;
          sql += `CREATE TABLE ${junctionTable} (\n`;
          sql += `  ${tableName.slice(0, -1)}_id VARCHAR(36) NOT NULL,\n`;
          sql += `  ${targetTable.slice(0, -1)}_id VARCHAR(36) NOT NULL,\n`;
          sql += `  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n`;
          sql += `  PRIMARY KEY (${tableName.slice(0, -1)}_id, ${targetTable.slice(0, -1)}_id),\n`;
          sql += `  FOREIGN KEY (${tableName.slice(0, -1)}_id) REFERENCES ${tableName}(id) ON DELETE CASCADE,\n`;
          sql += `  FOREIGN KEY (${targetTable.slice(0, -1)}_id) REFERENCES ${targetTable}(id) ON DELETE CASCADE\n`;
          sql += `);\n`;
        }
      }
    }
    
    return sql;
  }
  
  /**
   * Emit success response
   */
  private emitSuccess(event: NeoEvent, content: any): void {
    // Extract the base event type (e.g., 'tara.task.create' -> 'tara.task')
    const baseParts = event.type.split('.');
    const baseType = baseParts.slice(0, 2).join('.');
    
    this.core?.dialectic.emit({
      type: `${baseType}.response`,
      subtype: 'success',
      content,
      relations: { requestId: event.id }
    });
  }
  
  /**
   * Emit error response
   */
  private emitError(event: NeoEvent, error: string): void {
    // Extract the base event type (e.g., 'tara.task.create' -> 'tara.task')
    const baseParts = event.type.split('.');
    const baseType = baseParts.slice(0, 2).join('.');
    
    this.core?.dialectic.emit({
      type: `${baseType}.response`,
      subtype: 'error',
      content: { error },
      relations: { requestId: event.id }
    });
  }
}

/**
 * Create a Tara Extension
 */
export function createTaraExtension(config: any = {}): TaraExtension {
  return new TaraExtension(config);
}