import { SimpleMorph } from "../morph";
import { PropertyGraph, GraphEntity, GraphRelationship } from "./graph";
import { NeoContext } from "./mode";
import { StateOfConsciousness, ConsciousTransition, ConsciousContext } from "./tara";
import { FormShape, FieldShape } from "../../schema/shape";

/**
 * Enhanced cognitive task to support Sara-Tara integration
 */
export interface CognitiveTask {
  /** Unique task identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Task purpose/description */
  description?: string;
  
  /** Type of cognitive operation */
  operation: 'analyze' | 'synthesize' | 'evaluate' | 'create' | 'transform' | 'relate';
  
  /** Input sources for the task */
  inputs: TaskInput[];
  
  /** Expected outputs */
  outputs: TaskOutput[];
  
  /** Processing agent assignment */
  agent?: string;
  
  /** Execution constraints */
  constraints?: TaskConstraint[];
  
  /** States of consciousness associated with this task */
  consciousness?: {
    /** The intention state */
    intention?: string;
    /** The concept state */
    concept?: string;
    /** The reflection state */
    reflection?: string;
  };
  
  /** Form integration points */
  formIntegration?: {
    /** The form that drives this task */
    sourceFormId?: string;
    /** Task-specific form field mappings */
    fieldMappings?: Array<{
      fieldId: string;
      taskProperty: string;
      direction: 'form-to-task' | 'task-to-form' | 'bidirectional';
    }>;
  };
  
  /** Metadata */
  meta?: Record<string, any>;
}

/**
 * Input for a cognitive task with enhanced Sara-Tara awareness
 */
export interface TaskInput {
  /** Input identifier */
  id: string;
  
  /** Input source type */
  sourceType: 'entity' | 'relationship' | 'property' | 'context' | 'constant' | 'computation' | 'form' | 'consciousness';
  
  /** Source specification */
  source: string;
  
  /** Filter to apply to source */
  filter?: PropertyCondition[];
  
  /** How to process the source */
  processing?: 'direct' | 'embed' | 'summarize' | 'extract' | 'transform';
  
  /** For form sources, the specific form field */
  formField?: string;
  
  /** For consciousness sources, the state type */
  consciousnessState?: 'perception' | 'concept' | 'intention' | 'memory' | 'reflection' | 'abstract';
}

/**
 * Expected output from a task with enhanced Sara-Tara awareness
 */
export interface TaskOutput {
  /** Output identifier */
  id: string;
  
  /** Output structure */
  structure: 'entity' | 'relationship' | 'property' | 'context' | 'text' | 'embedding' | 'form' | 'consciousness';
  
  /** Schema or shape of the output */
  schema?: string;
  
  /** Where to store the output */
  destination?: string;
  
  /** For form destinations, the specific form field */
  formField?: string;
  
  /** For consciousness destinations, the state to update */
  consciousnessState?: string;
  
  /** Validation rules */
  validation?: OutputValidation[];
}

/**
 * Constraint on task execution
 */
export interface TaskConstraint {
  /** Type of constraint */
  type: 'time' | 'resource' | 'quality' | 'security' | 'dependency' | 'freedom' | 'necessity';
  
  /** Constraint specification */
  specification: string;
  
  /** Severity if violated */
  severity: 'warning' | 'error' | 'fatal';
  
  /** For freedom/necessity constraints, the dialectical balance */
  dialectics?: {
    /** Freedom level (0-1) */
    freedom?: number;
    /** Necessity level (0-1) */
    necessity?: number;
    /** Emergence potential (0-1) */
    emergence?: number;
  };
}

/**
 * Complete workflow of cognitive tasks with Sara-Tara integration
 */
export interface CognitiveWorkflow {
  /** Workflow identifier */
  id: string;
  
  /** Workflow name */
  name: string;
  
  /** Tasks in this workflow */
  tasks: CognitiveTask[];
  
  /** Task dependencies */
  dependencies: TaskDependency[];
  
  /** Global inputs */
  inputs: TaskInput[];
  
  /** Global outputs */
  outputs: TaskOutput[];
  
  /** Execution context */
  context?: Record<string, any>;
  
  /** Integration with form system (Sara) */
  saraIntegration?: {
    /** Primary form driving this workflow */
    primaryFormId?: string;
    
    /** Additional related forms */
    relatedForms?: string[];
    
    /** Global form field mappings */
    fieldMappings?: Array<{
      formId: string;
      fieldId: string;
      taskId?: string;
      taskProperty?: string;
      workflowProperty?: string;
      direction: 'form-to-workflow' | 'workflow-to-form' | 'bidirectional';
    }>;
  };
  
  /** Integration with consciousness (Tara) */
  taraIntegration?: {
    /** Conscious workflow ID */
    consciousWorkflowId?: string;
    
    /** Mappings between tasks and consciousness states */
    stateMappings?: Array<{
      taskId: string;
      consciousnessStateId: string;
      mapping: 'intention' | 'concept' | 'reflection';
    }>;
    
    /** Global consciousness context */
    context?: ConsciousContext;
  };
}

/**
 * Dependency between tasks with dialectical characteristics
 */
export interface TaskDependency {
  /** Source task ID */
  fromTaskId: string;
  
  /** Target task ID */
  toTaskId: string;
  
  /** Type of dependency */
  type: 'data' | 'control' | 'resource' | 'temporal';
  
  /** Optional conditions for this dependency */
  conditions?: PropertyCondition[];
  
  /** Dialectical characteristics of this dependency */
  dialectics?: {
    /** Freedom level (0-1) - higher means more non-deterministic */
    freedom?: number;
    
    /** Necessity level (0-1) - higher means more logically necessary */
    necessity?: number;
    
    /** Creative emergence level (0-1) */
    emergence?: number;
  };
}

/**
 * PropertyCondition for task filtering
 */
export interface PropertyCondition {
  /** Left side of condition (property path) */
  left: string;
  
  /** Operator */
  operator: string;
  
  /** Right side value */
  right: any;
  
  /** Whether condition is parameterized */
  parameterized?: boolean;
  
  /** Parameter name if parameterized */
  paramName?: string;
}

/**
 * Output validation rule
 */
export interface OutputValidation {
  /** Type of validation */
  type: 'schema' | 'constraint' | 'consistency' | 'semantic';
  
  /** Rule specification */
  rule: string;
  
  /** Whether validation failure blocks downstream tasks */
  blocking: boolean;
}

/**
 * Transform a form into a cognitive workflow
 */
export const FormToWorkflowMorph = new SimpleMorph<FormShape, CognitiveWorkflow>(
  "FormToWorkflowMorph",
  (form, context) => {
    // Create a workflow based on the form
    const workflow: CognitiveWorkflow = {
      id: `workflow-${form.id}`,
      name: `Workflow for ${form.name || form.id}`,
      tasks: [],
      dependencies: [],
      inputs: [],
      outputs: [],
      saraIntegration: {
        primaryFormId: form.id,
        fieldMappings: []
      }
    };
    
    // Create input tasks for form data retrieval
    const retrieveTask: CognitiveTask = {
      id: `retrieve-${form.id}`,
      name: `Retrieve ${form.name || form.id} Data`,
      operation: 'retrieve',
      inputs: [],
      outputs: [],
      formIntegration: {
        sourceFormId: form.id
      }
    };
    
    // Map form fields to task outputs
    form.fields.forEach(field => {
      // Add an output for each field
      retrieveTask.outputs.push({
        id: `field-${field.id}`,
        structure: 'property',
        destination: `form.${field.id}`,
        formField: field.id
      });
      
      // Add a workflow-level field mapping
      if (workflow.saraIntegration?.fieldMappings) {
        workflow.saraIntegration.fieldMappings.push({
          formId: form.id,
          fieldId: field.id,
          taskId: retrieveTask.id,
          direction: 'form-to-workflow'
        });
      }
    });
    
    // Add retrieve task to workflow
    workflow.tasks.push(retrieveTask);
    
    // Create analysis tasks based on field types
    const textFields = form.fields.filter(f => 
      f.type === 'text' || f.type === 'textarea' || f.type === 'richtext'
    );
    
    if (textFields.length > 0) {
      const analyzeTask: CognitiveTask = {
        id: `analyze-text-${form.id}`,
        name: 'Analyze Text Content',
        operation: 'analyze',
        inputs: textFields.map(field => ({
          id: `input-${field.id}`,
          sourceType: 'form',
          source: `form.${field.id}`,
          formField: field.id
        })),
        outputs: [
          {
            id: 'text-analysis',
            structure: 'entity',
            schema: 'TextAnalysis'
          }
        ]
      };
      
      workflow.tasks.push(analyzeTask);
      
      // Add dependency from retrieve to analyze
      workflow.dependencies.push({
        fromTaskId: retrieveTask.id,
        toTaskId: analyzeTask.id,
        type: 'data',
        dialectics: {
          freedom: 0.3,
          necessity: 0.7,
          emergence: 0.4
        }
      });
    }
    
    // Create synthesis task if the form has multiple fields
    if (form.fields.length > 3) {
      const synthesizeTask: CognitiveTask = {
        id: `synthesize-${form.id}`,
        name: 'Synthesize Form Information',
        operation: 'synthesize',
        inputs: [
          {
            id: 'form-data',
            sourceType: 'form',
            source: form.id
          }
        ],
        outputs: [
          {
            id: 'synthesis',
            structure: 'text',
            destination: 'summary'
          }
        ]
      };
      
      workflow.tasks.push(synthesizeTask);
      
      // Add dependency from retrieve to synthesize
      workflow.dependencies.push({
        fromTaskId: retrieveTask.id,
        toTaskId: synthesizeTask.id,
        type: 'data',
        dialectics: {
          freedom: 0.6,
          necessity: 0.4,
          emergence: 0.7
        }
      });
    }
    
    return workflow;
  },
  {
    pure: false,
    fusible: false,
    cost: 4
  }
);

/**
 * Transform a property graph into a cognitive workflow
 */
export const GraphToWorkflowMorph = new SimpleMorph<PropertyGraph, CognitiveWorkflow>(
  "GraphToWorkflowMorph",
  (graph, context) => {
    // Enhanced implementation that extracts workflow structure from a property graph
    const workflow: CognitiveWorkflow = {
      id: `workflow-${graph.id}`,
      name: graph.name || "Graph-Based Workflow",
      tasks: [],
      dependencies: [],
      inputs: [],
      outputs: []
    };
    
    // Extract tasks from appropriate entity types
    graph.entities
      .filter(entity => entity.labels.includes('Task') || entity.labels.includes('Operation'))
      .forEach(entity => {
        workflow.tasks.push(convertEntityToTask(entity, graph));
      });
    
    // Extract dependencies from relationships
    graph.relationships
      .filter(rel => rel.type === 'DEPENDS_ON' || rel.type === 'FOLLOWS')
      .forEach(rel => {
        workflow.dependencies.push({
          fromTaskId: rel.fromId,
          toTaskId: rel.toId,
          type: rel.properties.dependencyType || 'data',
          conditions: rel.properties.conditions,
          dialectics: {
            freedom: rel.properties.freedom,
            necessity: rel.properties.necessity,
            emergence: rel.properties.emergence
          }
        });
      });
    
    // Extract form relationships (Sara integration)
    const formEntities = graph.entities.filter(e => e.labels.includes('Form'));
    if (formEntities.length > 0) {
      workflow.saraIntegration = {
        primaryFormId: formEntities[0].id,
        relatedForms: formEntities.slice(1).map(e => e.id),
        fieldMappings: []
      };
      
      // Extract field mappings from relationships
      graph.relationships
        .filter(rel => 
          (rel.type === 'MAPS_TO' || rel.type === 'USES_FIELD') && 
          formEntities.some(e => e.id === rel.fromId || e.id === rel.toId)
        )
        .forEach(rel => {
          const formEntity = formEntities.find(e => e.id === rel.fromId || e.id === rel.toId);
          const taskEntity = graph.entities.find(e => 
            (e.id === rel.fromId || e.id === rel.toId) && 
            e.id !== formEntity?.id
          );
          
          if (formEntity && taskEntity && workflow.saraIntegration?.fieldMappings) {
            workflow.saraIntegration.fieldMappings.push({
              formId: formEntity.id,
              fieldId: rel.properties.fieldId,
              taskId: taskEntity.id,
              taskProperty: rel.properties.taskProperty,
              direction: rel.properties.direction || 'bidirectional'
            });
          }
        });
    }
    
    // Extract consciousness relationships (Tara integration)
    const consciousnessEntities = graph.entities.filter(e => 
      e.labels.includes('Consciousness') || e.labels.includes('StateOfConsciousness')
    );
    
    if (consciousnessEntities.length > 0) {
      workflow.taraIntegration = {
        consciousWorkflowId: consciousnessEntities[0].id,
        stateMappings: []
      };
      
      // Extract state mappings from relationships
      graph.relationships
        .filter(rel => 
          rel.type === 'HAS_STATE' || rel.type === 'MAPS_TO_STATE'
        )
        .forEach(rel => {
          const taskEntity = graph.entities.find(e => 
            e.id === rel.fromId && 
            (e.labels.includes('Task') || e.labels.includes('Operation'))
          );
          
          const stateEntity = graph.entities.find(e => 
            e.id === rel.toId && 
            (e.labels.includes('StateOfConsciousness') || e.labels.includes('ConsciousnessState'))
          );
          
          if (taskEntity && stateEntity && workflow.taraIntegration?.stateMappings) {
            workflow.taraIntegration.stateMappings.push({
              taskId: taskEntity.id,
              consciousnessStateId: stateEntity.id,
              mapping: rel.properties.mapping || 'concept'
            });
          }
        });
    }
    
    return workflow;
  },
  {
    pure: true,
    fusible: false,
    cost: 5
  }
);

/**
 * Convert a graph entity to a cognitive task with Sara-Tara awareness
 */
function convertEntityToTask(entity: GraphEntity, graph: PropertyGraph): CognitiveTask {
  // Basic task properties
  const task: CognitiveTask = {
    id: entity.id,
    name: entity.properties.name || entity.id,
    description: entity.properties.description,
    operation: entity.properties.operation || 'analyze',
    inputs: [],
    outputs: [],
    meta: {
      ...entity.meta,
      sourceEntity: entity.id
    }
  };
  
  // Extract inputs from relationships
  graph.relationships
    .filter(rel => rel.toId === entity.id && rel.type === 'INPUTS')
    .forEach(rel => {
      const inputEntity = graph.entities.find(e => e.id === rel.fromId);
      if (inputEntity) {
        task.inputs.push({
          id: inputEntity.id,
          sourceType: determineSourceType(inputEntity),
          source: inputEntity.id,
          processing: rel.properties.processing || 'direct',
          formField: inputEntity.labels.includes('Field') ? inputEntity.id : undefined,
          consciousnessState: inputEntity.labels.includes('StateOfConsciousness') ? 
            inputEntity.properties.stateType : undefined
        });
      }
    });
  
  // Extract outputs from relationships
  graph.relationships
    .filter(rel => rel.fromId === entity.id && rel.type === 'OUTPUTS')
    .forEach(rel => {
      const outputEntity = graph.entities.find(e => e.id === rel.toId);
      if (outputEntity) {
        task.outputs.push({
          id: outputEntity.id,
          structure: determineOutputStructure(outputEntity),
          schema: outputEntity.properties.schema,
          destination: outputEntity.properties.destination,
          formField: outputEntity.labels.includes('Field') ? outputEntity.id : undefined,
          consciousnessState: outputEntity.labels.includes('StateOfConsciousness') ? 
            outputEntity.id : undefined
        });
      }
    });
  
  // Extract form integration
  const formRelationships = graph.relationships.filter(rel => 
    (rel.fromId === entity.id || rel.toId === entity.id) &&
    (rel.type === 'USES_FORM' || rel.type === 'FORM_DRIVEN')
  );
  
  if (formRelationships.length > 0) {
    const formRel = formRelationships[0];
    const formId = formRel.fromId === entity.id ? formRel.toId : formRel.fromId;
    
    task.formIntegration = {
      sourceFormId: formId
    };
    
    // Extract field mappings
    const fieldMappings = graph.relationships.filter(rel => 
      (rel.fromId === entity.id || rel.toId === entity.id) &&
      (rel.type === 'MAPS_FIELD' || rel.type === 'USES_FIELD')
    );
    
    if (fieldMappings.length > 0) {
      task.formIntegration.fieldMappings = fieldMappings.map(rel => {
        const fieldId = rel.properties.fieldId;
        return {
          fieldId,
          taskProperty: rel.properties.taskProperty || fieldId,
          direction: rel.properties.direction || 'bidirectional'
        };
      });
    }
  }
  
  // Extract consciousness states
  const consciousnessRelationships = graph.relationships.filter(rel => 
    (rel.fromId === entity.id || rel.toId === entity.id) &&
    (rel.type === 'HAS_STATE' || rel.type === 'MAPS_TO_STATE')
  );
  
  if (consciousnessRelationships.length > 0) {
    task.consciousness = {};
    
    consciousnessRelationships.forEach(rel => {
      const stateId = rel.fromId === entity.id ? rel.toId : rel.fromId;
      const stateEntity = graph.entities.find(e => e.id === stateId);
      
      if (stateEntity && stateEntity.properties.stateType) {
        const mapping = rel.properties.mapping || stateEntity.properties.stateType;
        
        switch (mapping) {
          case 'intention':
            task.consciousness!.intention = stateId;
            break;
          case 'concept':
            task.consciousness!.concept = stateId;
            break;
          case 'reflection':
            task.consciousness!.reflection = stateId;
            break;
        }
      }
    });
  }
  
  return task;
}

/**
 * Determine source type from entity with Sara-Tara awareness
 */
function determineSourceType(entity: GraphEntity): TaskInput['sourceType'] {
  if (entity.labels.includes('Form')) return 'form';
  if (entity.labels.includes('Field')) return 'form';
  if (entity.labels.includes('Property')) return 'property';
  if (entity.labels.includes('Entity')) return 'entity';
  if (entity.labels.includes('Relationship')) return 'relationship';
  if (entity.labels.includes('Context')) return 'context';
  if (entity.labels.includes('Constant')) return 'constant';
  if (entity.labels.includes('Computation')) return 'computation';
  if (entity.labels.includes('StateOfConsciousness')) return 'consciousness';
  if (entity.labels.includes('ConsciousnessState')) return 'consciousness';
  return 'entity';
}

/**
 * Determine output structure from entity with Sara-Tara awareness
 */
function determineOutputStructure(entity: GraphEntity): TaskOutput['structure'] {
  if (entity.labels.includes('Form')) return 'form';
  if (entity.labels.includes('Field')) return 'form';
  if (entity.labels.includes('Entity')) return 'entity';
  if (entity.labels.includes('Relationship')) return 'relationship';
  if (entity.labels.includes('Property')) return 'property';
  if (entity.labels.includes('Context')) return 'context';
  if (entity.labels.includes('Text')) return 'text';
  if (entity.labels.includes('Embedding')) return 'embedding';
  if (entity.labels.includes('StateOfConsciousness')) return 'consciousness';
  if (entity.labels.includes('ConsciousnessState')) return 'consciousness';
  return 'entity';
}

/**
 * Unified morph that bridges Sara, Tara, and Neo
 */
export const UnifiedWorkflowMorph = new SimpleMorph<any, CognitiveWorkflow>(
  "UnifiedWorkflowMorph",
  (input, context) => {
    // This morph can work with various input types and create a unified workflow
    let workflow: CognitiveWorkflow;
    
    if (input.fields) {
      // Input is a form
      const formToWorkflow = new FormToWorkflowMorph();
      workflow = formToWorkflow.transform(input, context);
    } else if (input.entities && input.relationships) {
      // Input is a property graph
      const graphToWorkflow = new GraphToWorkflowMorph();
      workflow = graphToWorkflow.transform(input, context);
    } else if (input.states && input.transitions) {
      // Input is a conscious workflow
      workflow = convertConsciousWorkflowToTaskWorkflow(input, context);
    } else {
      // Default empty workflow
      workflow = {
        id: `workflow-${Date.now()}`,
        name: "Unified Workflow",
        tasks: [],
        dependencies: [],
        inputs: [],
        outputs: []
      };
    }
    
    // Add unified context that spans Sara-Tara-Neo
    workflow.context = {
      ...workflow.context,
      unifiedOrigin: 'UnifiedWorkflowMorph',
      timestamp: new Date().toISOString(),
      relationalAspects: {
        sara: !!workflow.saraIntegration,
        tara: !!workflow.taraIntegration,
        neo: true
      }
    };
    
    return workflow;
  },
  {
    pure: false,
    fusible: false,
    cost: 6
  }
);

/**
 * Convert a conscious workflow to a task workflow
 */
function convertConsciousWorkflowToTaskWorkflow(
  consciousWorkflow: any, 
  context: any
): CognitiveWorkflow {
  // Create a task workflow that mirrors the conscious workflow
  const workflow: CognitiveWorkflow = {
    id: `task-${consciousWorkflow.id}`,
    name: consciousWorkflow.purpose || "Conscious Workflow",
    tasks: [],
    dependencies: [],
    inputs: [],
    outputs: [],
    taraIntegration: {
      consciousWorkflowId: consciousWorkflow.id,
      stateMappings: []
    }
  };
  
  // Group states by their roles in the process
  const perceptionStates = consciousWorkflow.states.filter((s: any) => s.stateType === 'perception');
  const intentionStates = consciousWorkflow.states.filter((s: any) => s.stateType === 'intention');
  const conceptStates = consciousWorkflow.states.filter((s: any) => s.stateType === 'concept');
  const reflectionStates = consciousWorkflow.states.filter((s: any) => s.stateType === 'reflection');
  
  // Create tasks based on concept states (the core of cognitive operations)
  conceptStates.forEach((conceptState: any) => {
    // Find related intention and reflection states
    const relatedIntention = findRelatedState(consciousWorkflow, conceptState.id, intentionStates, 'intentional');
    const relatedReflection = findRelatedState(consciousWorkflow, conceptState.id, reflectionStates, 'inferential');
    
    // Find input perception states
    const inputPerceptions = perceptionStates.filter((p: any) => {
      return consciousWorkflow.transitions.some((t: any) => 
        t.fromStateId === p.id && 
        (t.toStateId === conceptState.id || (relatedIntention && t.toStateId === relatedIntention.id))
      );
    });
    
    // Create a task for this concept
    const task: CognitiveTask = {
      id: `task-${conceptState.id}`,
      name: conceptState.meaning || `Task for ${conceptState.id}`,
      description: conceptState.meta?.description,
      operation: determineOperationFromState(conceptState),
      inputs: inputPerceptions.map((p: any) => ({
        id: `input-${p.id}`,
        sourceType: 'consciousness',
        source: p.id,
        consciousnessState: 'perception'
      })),
      outputs: [
        {
          id: `output-${conceptState.id}`,
          structure: 'consciousness',
          consciousnessState: conceptState.id
        }
      ],
      consciousness: {
        concept: conceptState.id,
        intention: relatedIntention?.id,
        reflection: relatedReflection?.id
      }
    };
    
    workflow.tasks.push(task);
    
    // Add state mappings to integration
    if (workflow.taraIntegration?.stateMappings) {
      workflow.taraIntegration.stateMappings.push({
        taskId: task.id,
        consciousnessStateId: conceptState.id,
        mapping: 'concept'
      });
      
      if (relatedIntention) {
        workflow.taraIntegration.stateMappings.push({
          taskId: task.id,
          consciousnessStateId: relatedIntention.id,
          mapping: 'intention'
        });
      }
      
      if (relatedReflection) {
        workflow.taraIntegration.stateMappings.push({
          taskId: task.id,
          consciousnessStateId: relatedReflection.id,
          mapping: 'reflection'
        });
      }
    }
  });
  
  // Create dependencies between tasks based on transitions between concept states
  conceptStates.forEach((fromState: any) => {
    conceptStates.forEach((toState: any) => {
      if (fromState.id === toState.id) return;
      
      // Check if there's a transition between these states
      const transition = consciousWorkflow.transitions.find((t: any) => 
        t.fromStateId === fromState.id && t.toStateId === toState.id
      );
      
      if (transition) {
        workflow.dependencies.push({
          fromTaskId: `task-${fromState.id}`,
          toTaskId: `task-${toState.id}`,
          type: mapTransitionTypeToDependencyType(transition.transitionType),
          dialectics: {
            freedom: transition.characteristics?.freedom || 0.5,
            necessity: transition.characteristics?.necessity || 0.5,
            emergence: transition.characteristics?.emergence || 0.5
          }
        });
      }
    });
  });
  
  // Add Sara integration if available in the context
  if (context?.sara?.formId) {
    workflow.saraIntegration = {
      primaryFormId: context.sara.formId
    };
    
    // Add field mappings if available
    if (consciousWorkflow.saraIntegration?.propertyMappings) {
      workflow.saraIntegration.fieldMappings = consciousWorkflow.saraIntegration.propertyMappings.map(
        (mapping: any) => {
          // Find the task for this state
          const stateId = mapping.taraState;
          const state = consciousWorkflow.states.find((s: any) => s.id === stateId);
          const taskId = state ? `task-${findConceptStateForPerception(consciousWorkflow, state)}` : undefined;
          
          return {
            formId: consciousWorkflow.saraIntegration.formId,
            fieldId: mapping.saraProperty,
            taskId,
            direction: mapping.direction === 'sara-to-tara' ? 'form-to-workflow' :
                       mapping.direction === 'tara-to-sara' ? 'workflow-to-form' : 'bidirectional'
          };
        }
      );
    }
  }
  
  return workflow;
}

/**
 * Find a related state through transitions
 */
function findRelatedState(
  consciousWorkflow: any, 
  stateId: string, 
  candidateStates: any[], 
  transitionType: string
): any {
  // Find incoming transitions of the specified type
  const incomingTransitions = consciousWorkflow.transitions.filter((t: any) => 
    t.toStateId === stateId && t.transitionType === transitionType
  );
  
  // Find outgoing transitions of the specified type
  const outgoingTransitions = consciousWorkflow.transitions.filter((t: any) => 
    t.fromStateId === stateId && t.transitionType === transitionType
  );
  
  // Check candidates in incoming transitions
  for (const transition of incomingTransitions) {
    const candidateState = candidateStates.find(s => s.id === transition.fromStateId);
    if (candidateState) return candidateState;
  }
  
  // Check candidates in outgoing transitions
  for (const transition of outgoingTransitions) {
    const candidateState = candidateStates.find(s => s.id === transition.toStateId);
    if (candidateState) return candidateState;
  }
  
  return null;
}

/**
 * Determine the concept state that a perception state feeds into
 */
function findConceptStateForPerception(consciousWorkflow: any, perceptionState: any): string {
  // Find the intention state that this perception feeds
  const intentionTransition = consciousWorkflow.transitions.find((t: any) => 
    t.fromStateId === perceptionState.id && 
    t.transitionType === 'causal'
  );
  
  if (!intentionTransition) return '';
  
  const intentionState = consciousWorkflow.states.find((s: any) => 
    s.id === intentionTransition.toStateId && 
    s.stateType === 'intention'
  );
  
  if (!intentionState) return '';
  
  // Find the concept state that this intention feeds
  const conceptTransition = consciousWorkflow.transitions.find((t: any) => 
    t.fromStateId === intentionState.id && 
    t.transitionType === 'intentional'
  );
  
  if (!conceptTransition) return '';
  
  return conceptTransition.toStateId;
}

/**
 * Determine operation type from a consciousness state
 */
function determineOperationFromState(state: any): CognitiveTask['operation'] {
  if (state.meaning) {
    const meaning = state.meaning.toLowerCase();
    if (meaning.includes('analyz')) return 'analyze';
    if (meaning.includes('synthe')) return 'synthesize';
    if (meaning.includes('evaluat')) return 'evaluate';
    if (meaning.includes('creat')) return 'create';
    if (meaning.includes('transform')) return 'transform';
    if (meaning.includes('relat')) return 'relate';
  }
  
  // Default based on state properties
  if (state.properties?.operation) return state.properties.operation as CognitiveTask['operation'];
  
  return 'analyze'; // Default
}

/**
 * Map transition type to dependency type
 */
function mapTransitionTypeToDependencyType(transitionType: string): TaskDependency['type'] {
  switch (transitionType) {
    case 'causal': return 'data';
    case 'intentional': return 'control';
    case 'associative': return 'resource';
    case 'inferential': return 'data';
    case 'dialectical': return 'temporal';
    default: return 'data';
  }
}

/**
 * Transform a workflow to LangGraph configuration
 */
export const WorkflowToLangGraphMorph = new SimpleMorph<CognitiveWorkflow, any>(
  "WorkflowToLangGraphMorph",
  (workflow, context) => {
    // Enhanced implementation that generates LangGraph configuration from the workflow
    const langGraphConfig = {
      // Define the workflow graph
      workflow: {
        id: workflow.id,
        name: workflow.name,
        nodes: workflow.tasks.map(task => ({
          id: task.id,
          type: task.operation,
          config: {
            name: task.name,
            description: task.description,
            agent: task.agent,
            input_keys: task.inputs.map(input => input.id),
            output_keys: task.outputs.map(output => output.id)
          },
          class_path: mapOperationToLangGraphClass(task.operation)
        })),
        edges: workflow.dependencies.map(dep => ({
          source: dep.fromTaskId,
          target: dep.toTaskId,
          type: dep.type,
          data: {
            dialectics: dep.dialectics
          },
          conditions: dep.conditions?.map(condition => ({
            left: condition.left,
            operator: condition.operator,
            right: condition.right
          }))
        }))
      },
      
      // Add Sara integration if present
      form_integration: workflow.saraIntegration ? {
        primary_form: workflow.saraIntegration.primaryFormId,
        related_forms: workflow.saraIntegration.relatedForms || [],
        field_mappings: workflow.saraIntegration.fieldMappings?.map(mapping => ({
          form_id: mapping.formId,
          field_id: mapping.fieldId,
          task_id: mapping.taskId,
          task_property: mapping.taskProperty,
          workflow_property: mapping.workflowProperty,
          direction: mapping.direction
        }))
      } : undefined,
      
      // Add Tara integration if present
      consciousness_integration: workflow.taraIntegration ? {
        conscious_workflow_id: workflow.taraIntegration.consciousWorkflowId,
        state_mappings: workflow.taraIntegration.stateMappings?.map(mapping => ({
          task_id: mapping.taskId,
          consciousness_state_id: mapping.consciousnessStateId,
          mapping: mapping.mapping
        })),
        context: workflow.taraIntegration.context
      } : undefined,
      
      // Add Neo-specific configuration
      graph_execution: {
        track_state_as_graph: true,
        state_graph_schema: {
          node_types: [
            { type: "task", properties: ["id", "name", "status"] },
            { type: "state", properties: ["key", "value", "type"] }
          ],
          edge_types: [
            { type: "PRODUCED", direction: "OUT" },
            { type: "CONSUMED", direction: "IN" },
            { type: "EXECUTED", direction: "OUT" }
          ]
        }
      },
      
      // Add execution config
      execution_config: {
        allow_parallel: true,
        max_workers: 4,
        track_history: true,
        skip_validation_for_speed: false
      },
      
      // Add state management
      state_management: {
        state_key: "workflow_state",
        initial_state: {}
      }
    };
    
    return langGraphConfig;
  },
  {
    pure: true,
    fusible: false,
    cost: 3
  }
);

/**
 * Map task operation to LangGraph class
 */
function mapOperationToLangGraphClass(operation: string): string {
  switch (operation) {
    case 'analyze': return 'langgraph.nodes.AnalysisNode';
    case 'synthesize': return 'langgraph.nodes.SynthesisNode';
    case 'evaluate': return 'langgraph.nodes.EvaluationNode';
    case 'create': return 'langgraph.nodes.CreationNode';
    case 'transform': return 'langgraph.nodes.TransformationNode';
    case 'relate': return 'langgraph.nodes.RelationNode';
    case 'retrieve': return 'langgraph.nodes.RetrievalNode';
    default: return 'langgraph.nodes.GenericNode';
  }
}