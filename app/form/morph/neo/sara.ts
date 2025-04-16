import { SimpleMorph } from "../morph";
import { FormShape, FieldShape, FieldValidation } from "../../schema/form";
import { PropertyGraph, GraphEntity, GraphRelationship } from "./graph";
import { CognitiveWorkflow, CognitiveTask, TaskInput, TaskOutput } from "./task";
import { StateOfConsciousness, ConsciousWorkflow } from "./tara";

/**
 * Sara: The Relational Mediator between Objective Form (Morpheus) and Subjective Consciousness (Tara)
 * 
 * Sara represents the middle term of the syllogism:
 * Morpheus (thesis) -> Sara (synthesis/mediation) -> Tara (antithesis)
 * 
 * As the RelationEngine, Sara provides:
 * 1. Mediation between determinate forms and free consciousness
 * 2. Structured relations that preserve both objectivity and subjectivity
 * 3. Transformation mappings that maintain meaning across domains
 */

/**
 * A relation in the Sara system
 */
export interface SaraRelation {
  /** Unique relation identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Relation type */
  type: 'equivalence' | 'subsumption' | 'transformation' | 'correspondence' | 'participation' | 'causation';
  
  /** Source entity reference */
  source: EntityReference;
  
  /** Target entity reference */
  target: EntityReference;
  
  /** Directional properties from source to target */
  forwardProperties?: Record<string, any>;
  
  /** Directional properties from target to source */
  reverseProperties?: Record<string, any>;
  
  /** Property mappings between source and target */
  propertyMappings?: PropertyMapping[];
  
  /** Contextual validity constraints */
  validityConstraints?: ValidityConstraint[];
  
  /** Metadata about this relation */
  meta?: Record<string, any>;
}

/**
 * Reference to an entity in any domain (Form, Graph, Task, Consciousness)
 */
export interface EntityReference {
  /** Entity identifier */
  id: string;
  
  /** Entity domain */
  domain: 'form' | 'field' | 'graph' | 'entity' | 'relationship' | 'task' | 'workflow' | 'consciousness';
  
  /** Optional type specification */
  type?: string;
  
  /** Path to referenced entity (for nested references) */
  path?: string;
  
  /** Additional reference metadata */
  meta?: Record<string, any>;
}

/**
 * Mapping between properties of related entities
 */
export interface PropertyMapping {
  /** Source property path */
  sourcePath: string;
  
  /** Target property path */
  targetPath: string;
  
  /** Transformation direction */
  direction: 'source-to-target' | 'target-to-source' | 'bidirectional';
  
  /** Optional transformation function reference */
  transformation?: string;
  
  /** Parameters for the transformation */
  parameters?: Record<string, any>;
}

/**
 * Constraint on relation validity
 */
export interface ValidityConstraint {
  /** Constraint type */
  type: 'property' | 'existence' | 'cardinality' | 'temporal' | 'logical' | 'semantic';
  
  /** Expression that defines the constraint */
  expression: string;
  
  /** Properties this constraint depends on */
  dependencies?: string[];
  
  /** Error message if constraint is violated */
  message?: string;
  
  /** Severity of constraint violation */
  severity: 'info' | 'warning' | 'error' | 'fatal';
}

/**
 * A mediation registry that tracks and manages relations
 */
export interface MediationRegistry {
  /** Unique registry identifier */
  id: string;
  
  /** Relations managed by this registry */
  relations: SaraRelation[];
  
  /** Domains that this registry mediates between */
  domains: string[];
  
  /** Transformation policies */
  policies: MediationPolicy[];
  
  /** Global validity constraints */
  globalConstraints: ValidityConstraint[];
  
  /** Registry metadata */
  meta: Record<string, any>;
}

/**
 * Policy for mediation behavior
 */
export interface MediationPolicy {
  /** Policy name */
  name: string;
  
  /** Policy description */
  description?: string;
  
  /** Domains this policy applies to */
  domains: string[];
  
  /** Rules that implement this policy */
  rules: MediationRule[];
  
  /** Priority (higher values take precedence) */
  priority: number;
}

/**
 * Rule for mediating between domains
 */
export interface MediationRule {
  /** Rule name */
  name: string;
  
  /** Condition for rule application */
  condition: string;
  
  /** Action to take when condition is met */
  action: string;
  
  /** Priority within policy (higher values take precedence) */
  priority: number;
}

/**
 * Creates a mediation registry for a specific set of domains
 */
export const createMediationRegistry = (
  id: string,
  domains: string[],
  options?: {
    policies?: MediationPolicy[];
    constraints?: ValidityConstraint[];
    meta?: Record<string, any>;
  }
): MediationRegistry => {
  return {
    id,
    relations: [],
    domains,
    policies: options?.policies || [],
    globalConstraints: options?.constraints || [],
    meta: options?.meta || {
      createdAt: new Date().toISOString(),
      createdBy: 'sara'
    }
  };
};

/**
 * Transform a form to a set of Sara relations
 */
export const FormToSaraRelationsMorph = new SimpleMorph<FormShape, SaraRelation[]>(
  "FormToSaraRelationsMorph",
  (form, context) => {
    const relations: SaraRelation[] = [];
    
    // Create a relation for the form itself
    relations.push({
      id: `form-entity-${form.id}`,
      name: `Form Entity: ${form.name || form.id}`,
      type: 'correspondence',
      source: {
        id: form.id,
        domain: 'form',
        type: 'form'
      },
      target: {
        id: `entity-${form.id}`,
        domain: 'entity',
        type: 'FormEntity'
      },
      propertyMappings: [
        {
          sourcePath: 'id',
          targetPath: 'id',
          direction: 'source-to-target'
        },
        {
          sourcePath: 'name',
          targetPath: 'name',
          direction: 'source-to-target'
        },
        {
          sourcePath: 'description',
          targetPath: 'description',
          direction: 'source-to-target'
        }
      ]
    });
    
    // Create relations for each field
    form.fields.forEach(field => {
      relations.push(createFieldRelation(form, field));
    });
    
    // Create relations between related fields
    form.fields.forEach(field => {
      if (field.relatedTo) {
        const targetField = form.fields.find(f => f.id === field.relatedTo);
        if (targetField) {
          relations.push(createFieldToFieldRelation(form, field, targetField));
        }
      }
    });
    
    return relations;
  },
  {
    pure: true,
    fusible: false,
    cost: 3
  }
);

/**
 * Create a relation for a field
 */
function createFieldRelation(form: FormShape, field: FieldShape): SaraRelation {
  return {
    id: `field-property-${form.id}-${field.id}`,
    name: `Field Property: ${field.label || field.id}`,
    type: 'correspondence',
    source: {
      id: field.id,
      domain: 'field',
      path: `${form.id}.${field.id}`,
      type: field.type
    },
    target: {
      id: `property-${field.id}`,
      domain: 'property',
      type: mapFieldTypeToDomainType(field.type)
    },
    propertyMappings: [
      {
        sourcePath: 'value',
        targetPath: 'value',
        direction: 'bidirectional'
      },
      {
        sourcePath: 'label',
        targetPath: 'name',
        direction: 'source-to-target'
      },
      {
        sourcePath: 'validations',
        targetPath: 'constraints',
        direction: 'source-to-target',
        transformation: 'validationsToConstraints'
      }
    ],
    validityConstraints: field.validations?.map(validation => ({
      type: 'property',
      expression: createValidationExpression(validation),
      dependencies: ['value'],
      message: validation.message,
      severity: 'error'
    })) || []
  };
}

/**
 * Create a relation between related fields
 */
function createFieldToFieldRelation(
  form: FormShape, 
  sourceField: FieldShape, 
  targetField: FieldShape
): SaraRelation {
  return {
    id: `field-relation-${form.id}-${sourceField.id}-${targetField.id}`,
    name: `Field Relation: ${sourceField.label || sourceField.id} → ${targetField.label || targetField.id}`,
    type: 'participation',
    source: {
      id: sourceField.id,
      domain: 'field',
      path: `${form.id}.${sourceField.id}`,
      type: sourceField.type
    },
    target: {
      id: targetField.id,
      domain: 'field',
      path: `${form.id}.${targetField.id}`,
      type: targetField.type
    },
    forwardProperties: {
      relationType: sourceField.relationType || 'relates-to',
      role: 'source'
    },
    reverseProperties: {
      relationType: sourceField.relationType || 'relates-to',
      role: 'target'
    }
  };
}

/**
 * Transform a property graph to Sara relations
 */
export const GraphToSaraRelationsMorph = new SimpleMorph<PropertyGraph, SaraRelation[]>(
  "GraphToSaraRelationsMorph",
  (graph, context) => {
    const relations: SaraRelation[] = [];
    
    // Create a relation for the graph itself
    relations.push({
      id: `graph-registry-${graph.id}`,
      name: `Graph Registry: ${graph.name || graph.id}`,
      type: 'correspondence',
      source: {
        id: graph.id,
        domain: 'graph',
        type: 'PropertyGraph'
      },
      target: {
        id: `registry-${graph.id}`,
        domain: 'form',
        type: 'MediationRegistry'
      },
      propertyMappings: [
        {
          sourcePath: 'id',
          targetPath: 'id',
          direction: 'source-to-target'
        },
        {
          sourcePath: 'name',
          targetPath: 'meta.name',
          direction: 'source-to-target'
        },
        {
          sourcePath: 'meta',
          targetPath: 'meta',
          direction: 'source-to-target'
        }
      ]
    });
    
    // Create relations for each entity
    graph.entities.forEach(entity => {
      // Convert entity labels to domain
      const domainType = entity.labels[0].toLowerCase();
      
      relations.push({
        id: `entity-${entity.id}`,
        name: `Entity: ${entity.properties.name || entity.id}`,
        type: 'correspondence',
        source: {
          id: entity.id,
          domain: 'entity',
          type: entity.labels.join(':')
        },
        target: {
          id: entity.id,
          domain: domainType,
          type: entity.labels[0]
        },
        propertyMappings: Object.entries(entity.properties).map(([key, value]) => ({
          sourcePath: `properties.${key}`,
          targetPath: key,
          direction: 'bidirectional'
        }))
      });
    });
    
    // Create relations for each relationship
    graph.relationships.forEach(rel => {
      relations.push({
        id: `relationship-${rel.id}`,
        name: `Relationship: ${rel.type}`,
        type: 'participation',
        source: {
          id: rel.fromId,
          domain: 'entity',
          type: 'Entity'
        },
        target: {
          id: rel.toId,
          domain: 'entity',
          type: 'Entity'
        },
        forwardProperties: {
          relationType: rel.type,
          role: 'from',
          ...rel.properties
        },
        reverseProperties: {
          relationType: rel.type,
          role: 'to',
          ...rel.properties
        }
      });
    });
    
    return relations;
  },
  {
    pure: true,
    fusible: false,
    cost: 4
  }
);

/**
 * Transform a cognitive workflow to Sara relations
 */
export const WorkflowToSaraRelationsMorph = new SimpleMorph<CognitiveWorkflow, SaraRelation[]>(
  "WorkflowToSaraRelationsMorph",
  (workflow, context) => {
    const relations: SaraRelation[] = [];
    
    // Create a relation for the workflow itself
    relations.push({
      id: `workflow-registry-${workflow.id}`,
      name: `Workflow Registry: ${workflow.name}`,
      type: 'correspondence',
      source: {
        id: workflow.id,
        domain: 'workflow',
        type: 'CognitiveWorkflow'
      },
      target: {
        id: `registry-${workflow.id}`,
        domain: 'form',
        type: 'MediationRegistry'
      }
    });
    
    // Create relations for each task
    workflow.tasks.forEach(task => {
      // Task to entity relation
      relations.push({
        id: `task-entity-${task.id}`,
        name: `Task Entity: ${task.name}`,
        type: 'correspondence',
        source: {
          id: task.id,
          domain: 'task',
          type: task.operation
        },
        target: {
          id: `entity-${task.id}`,
          domain: 'entity',
          type: 'TaskEntity'
        },
        propertyMappings: [
          {
            sourcePath: 'id',
            targetPath: 'id',
            direction: 'source-to-target'
          },
          {
            sourcePath: 'name',
            targetPath: 'name',
            direction: 'source-to-target'
          },
          {
            sourcePath: 'description',
            targetPath: 'description',
            direction: 'source-to-target'
          },
          {
            sourcePath: 'operation',
            targetPath: 'operation',
            direction: 'source-to-target'
          }
        ]
      });
      
      // If task has consciousness integration
      if (task.consciousness) {
        if (task.consciousness.concept) {
          relations.push(createTaskToConsciousnessRelation(task, task.consciousness.concept, 'concept'));
        }
        if (task.consciousness.intention) {
          relations.push(createTaskToConsciousnessRelation(task, task.consciousness.intention, 'intention'));
        }
        if (task.consciousness.reflection) {
          relations.push(createTaskToConsciousnessRelation(task, task.consciousness.reflection, 'reflection'));
        }
      }
      
      // If task has form integration
      if (task.formIntegration?.sourceFormId) {
        relations.push({
          id: `task-form-${task.id}-${task.formIntegration.sourceFormId}`,
          name: `Task Form Integration: ${task.name}`,
          type: 'participation',
          source: {
            id: task.id,
            domain: 'task',
            type: task.operation
          },
          target: {
            id: task.formIntegration.sourceFormId,
            domain: 'form',
            type: 'form'
          },
          propertyMappings: task.formIntegration.fieldMappings?.map(mapping => ({
            sourcePath: mapping.taskProperty,
            targetPath: `${task.formIntegration?.sourceFormId}.${mapping.fieldId}`,
            direction: mapping.direction === 'form-to-task' ? 'target-to-source' :
                       mapping.direction === 'task-to-form' ? 'source-to-target' : 'bidirectional'
          })) || []
        });
      }
    });
    
    // Create relations for task dependencies
    workflow.dependencies.forEach(dep => {
      relations.push({
        id: `task-dependency-${dep.fromTaskId}-${dep.toTaskId}`,
        name: `Task Dependency: ${dep.type}`,
        type: 'causation',
        source: {
          id: dep.fromTaskId,
          domain: 'task',
          type: 'Task'
        },
        target: {
          id: dep.toTaskId,
          domain: 'task',
          type: 'Task'
        },
        forwardProperties: {
          dependencyType: dep.type,
          freedom: dep.dialectics?.freedom,
          necessity: dep.dialectics?.necessity,
          emergence: dep.dialectics?.emergence
        }
      });
    });
    
    // If workflow has Sara integration
    if (workflow.saraIntegration?.primaryFormId) {
      relations.push({
        id: `workflow-form-${workflow.id}-${workflow.saraIntegration.primaryFormId}`,
        name: `Workflow Form Integration`,
        type: 'correspondence',
        source: {
          id: workflow.id,
          domain: 'workflow',
          type: 'CognitiveWorkflow'
        },
        target: {
          id: workflow.saraIntegration.primaryFormId,
          domain: 'form',
          type: 'form'
        },
        propertyMappings: workflow.saraIntegration.fieldMappings?.map(mapping => ({
          sourcePath: mapping.workflowProperty || (mapping.taskId ? `tasks.${mapping.taskId}.${mapping.taskProperty}` : ''),
          targetPath: `${mapping.formId}.${mapping.fieldId}`,
          direction: mapping.direction === 'form-to-workflow' ? 'target-to-source' :
                     mapping.direction === 'workflow-to-form' ? 'source-to-target' : 'bidirectional'
        })) || []
      });
    }
    
    // If workflow has Tara integration
    if (workflow.taraIntegration?.consciousWorkflowId) {
      relations.push({
        id: `workflow-consciousness-${workflow.id}-${workflow.taraIntegration.consciousWorkflowId}`,
        name: `Workflow Consciousness Integration`,
        type: 'correspondence',
        source: {
          id: workflow.id,
          domain: 'workflow',
          type: 'CognitiveWorkflow'
        },
        target: {
          id: workflow.taraIntegration.consciousWorkflowId,
          domain: 'consciousness',
          type: 'ConsciousWorkflow'
        },
        propertyMappings: workflow.taraIntegration.stateMappings?.map(mapping => ({
          sourcePath: `tasks.${mapping.taskId}`,
          targetPath: `states.${mapping.consciousnessStateId}`,
          direction: 'bidirectional'
        })) || []
      });
    }
    
    return relations;
  },
  {
    pure: true,
    fusible: false,
    cost: 5
  }
);

/**
 * Create a relation between a task and consciousness state
 */
function createTaskToConsciousnessRelation(
  task: CognitiveTask,
  consciousnessStateId: string,
  stateType: 'intention' | 'concept' | 'reflection'
): SaraRelation {
  return {
    id: `task-consciousness-${task.id}-${consciousnessStateId}`,
    name: `Task ${stateType.charAt(0).toUpperCase() + stateType.slice(1)}: ${task.name}`,
    type: 'correspondence',
    source: {
      id: task.id,
      domain: 'task',
      type: task.operation
    },
    target: {
      id: consciousnessStateId,
      domain: 'consciousness',
      type: 'StateOfConsciousness'
    },
    forwardProperties: {
      stateType,
      taskOperation: task.operation
    },
    propertyMappings: [
      {
        sourcePath: 'name',
        targetPath: 'meaning',
        direction: 'source-to-target'
      },
      {
        sourcePath: stateType === 'concept' ? 'outputs[0].value' : 'meta',
        targetPath: 'content',
        direction: stateType === 'concept' ? 'source-to-target' : 'bidirectional'
      }
    ]
  };
}

/**
 * Transform consciousness states to Sara relations
 */
export const ConsciousnessToSaraRelationsMorph = new SimpleMorph<ConsciousWorkflow, SaraRelation[]>(
  "ConsciousnessToSaraRelationsMorph",
  (consciousness, context) => {
    const relations: SaraRelation[] = [];
    
    // Create a relation for the consciousness workflow
    relations.push({
      id: `consciousness-registry-${consciousness.id}`,
      name: `Consciousness Registry: ${consciousness.purpose}`,
      type: 'correspondence',
      source: {
        id: consciousness.id,
        domain: 'consciousness',
        type: 'ConsciousWorkflow'
      },
      target: {
        id: `registry-${consciousness.id}`,
        domain: 'form',
        type: 'MediationRegistry'
      }
    });
    
    // Create relations for each state
    consciousness.states.forEach(state => {
      relations.push({
        id: `consciousness-state-${state.id}`,
        name: `Consciousness State: ${state.meaning}`,
        type: 'correspondence',
        source: {
          id: state.id,
          domain: 'consciousness',
          type: 'StateOfConsciousness'
        },
        target: {
          id: `entity-${state.id}`,
          domain: 'entity',
          type: 'ConsciousnessEntity'
        },
        propertyMappings: [
          {
            sourcePath: 'id',
            targetPath: 'id',
            direction: 'source-to-target'
          },
          {
            sourcePath: 'meaning',
            targetPath: 'name',
            direction: 'source-to-target'
          },
          {
            sourcePath: 'content',
            targetPath: 'properties.content',
            direction: 'bidirectional'
          },
          {
            sourcePath: 'stateType',
            targetPath: 'properties.stateType',
            direction: 'source-to-target'
          },
          {
            sourcePath: 'qualities',
            targetPath: 'properties.qualities',
            direction: 'bidirectional'
          }
        ]
      });
      
      // If this state has objective correspondence
      if (state.objectiveCorrespondence) {
        const targetDomain = state.objectiveCorrespondence.entityId ? 'entity' : 'property';
        const targetId = state.objectiveCorrespondence.entityId || state.objectiveCorrespondence.propertyPath;
        
        relations.push({
          id: `consciousness-objective-${state.id}-${targetId}`,
          name: `Consciousness Objective Correspondence: ${state.meaning}`,
          type: 'correspondence',
          source: {
            id: state.id,
            domain: 'consciousness',
            type: 'StateOfConsciousness'
          },
          target: {
            id: targetId!,
            domain: targetDomain,
            path: state.objectiveCorrespondence.propertyPath
          },
          forwardProperties: {
            confidence: state.objectiveCorrespondence.confidence
          }
        });
      }
    });
    
    // Create relations for transitions
    consciousness.transitions.forEach(transition => {
      relations.push({
        id: `consciousness-transition-${transition.fromStateId}-${transition.toStateId}`,
        name: `Consciousness Transition: ${transition.transitionType}`,
        type: 'causation',
        source: {
          id: transition.fromStateId,
          domain: 'consciousness',
          type: 'StateOfConsciousness'
        },
        target: {
          id: transition.toStateId,
          domain: 'consciousness',
          type: 'StateOfConsciousness'
        },
        forwardProperties: {
          transitionType: transition.transitionType,
          freedom: transition.characteristics.freedom,
          necessity: transition.characteristics.necessity,
          emergence: transition.characteristics.emergence
        }
      });
    });
    
    // Sara integration if available
    if (consciousness.saraIntegration?.formId) {
      relations.push({
        id: `consciousness-form-${consciousness.id}-${consciousness.saraIntegration.formId}`,
        name: `Consciousness Form Integration`,
        type: 'correspondence',
        source: {
          id: consciousness.id,
          domain: 'consciousness',
          type: 'ConsciousWorkflow'
        },
        target: {
          id: consciousness.saraIntegration.formId,
          domain: 'form',
          type: 'form'
        },
        propertyMappings: consciousness.saraIntegration.propertyMappings.map(mapping => ({
          sourcePath: `states.${mapping.taraState}.content`,
          targetPath: mapping.saraProperty,
          direction: mapping.direction === 'sara-to-tara' ? 'target-to-source' :
                     mapping.direction === 'tara-to-sara' ? 'source-to-target' : 'bidirectional'
        }))
      });
    }
    
    return relations;
  },
  {
    pure: true,
    fusible: false,
    cost: 5
  }
);

/**
 * Transform Sara relations to a property graph
 */
export const SaraRelationsToGraphMorph = new SimpleMorph<SaraRelation[], PropertyGraph>(
  "SaraRelationsToGraphMorph",
  (relations, context) => {
    const graph: PropertyGraph = {
      id: `sara-relations-${Date.now()}`,
      name: "Sara Relations Graph",
      entities: [],
      relationships: []
    };
    
    // Track entities we've already created
    const entityMap = new Map<string, GraphEntity>();
    
    // Process all relations to create entities
    relations.forEach(relation => {
      // Process source entity
      if (!entityMap.has(relation.source.id)) {
        const entity: GraphEntity = {
          id: relation.source.id,
          labels: [relation.source.domain, relation.source.type || 'Unknown'].filter(Boolean) as string[],
          properties: {
            id: relation.source.id,
            domain: relation.source.domain,
            type: relation.source.type,
            path: relation.source.path
          }
        };
        
        entityMap.set(relation.source.id, entity);
        graph.entities.push(entity);
      }
      
      // Process target entity
      if (!entityMap.has(relation.target.id)) {
        const entity: GraphEntity = {
          id: relation.target.id,
          labels: [relation.target.domain, relation.target.type || 'Unknown'].filter(Boolean) as string[],
          properties: {
            id: relation.target.id,
            domain: relation.target.domain,
            type: relation.target.type,
            path: relation.target.path
          }
        };
        
        entityMap.set(relation.target.id, entity);
        graph.entities.push(entity);
      }
      
      // Create relationship
      const relationship: GraphRelationship = {
        id: relation.id,
        fromId: relation.source.id,
        toId: relation.target.id,
        type: relation.type.toUpperCase(),
        properties: {
          forwardProperties: relation.forwardProperties || {},
          reverseProperties: relation.reverseProperties || {},
          propertyMappings: relation.propertyMappings || []
        }
      };
      
      graph.relationships.push(relationship);
    });
    
    return graph;
  },
  {
    pure: true,
    fusible: false,
    cost: 3
  }
);

/**
 * Create a mediation layer between a form and a cognitive workflow
 */
export const FormWorkflowMediationMorph = new SimpleMorph<
  { form: FormShape; workflow: CognitiveWorkflow },
  MediationRegistry
>(
  "FormWorkflowMediationMorph",
  (input, context) => {
    const { form, workflow } = input;
    
    // Create the mediation registry
    const registry = createMediationRegistry(
      `form-workflow-${form.id}-${workflow.id}`,
      ['form', 'workflow'],
      {
        meta: {
          formId: form.id,
          workflowId: workflow.id,
          formName: form.name,
          workflowName: workflow.name
        }
      }
    );
    
    // Create form-to-workflow relations
    const formToSaraRelations = new FormToSaraRelationsMorph().transform(form, context);
    const workflowToSaraRelations = new WorkflowToSaraRelationsMorph().transform(workflow, context);
    
    // Combine the relations
    registry.relations = [...formToSaraRelations, ...workflowToSaraRelations];
    
    // Create field-to-task mappings
    form.fields.forEach(field => {
      // Find a suitable task to handle this field
      const taskForField = findTaskForField(workflow, field);
      
      if (taskForField) {
        registry.relations.push({
          id: `field-task-${field.id}-${taskForField.id}`,
          name: `Field Task Mapping: ${field.label || field.id} ↔ ${taskForField.name}`,
          type: 'transformation',
          source: {
            id: field.id,
            domain: 'field',
            path: `${form.id}.${field.id}`,
            type: field.type
          },
          target: {
            id: taskForField.id,
            domain: 'task',
            type: taskForField.operation
          },
          propertyMappings: [
            {
              sourcePath: 'value',
              targetPath: field.id,
              direction: 'bidirectional'
            }
          ]
        });
      }
    });
    
    // Create global mediation policies
    registry.policies.push({
      name: 'FormToWorkflowSync',
      description: 'Synchronizes form data with workflow tasks',
      domains: ['form', 'workflow'],
      rules: [
        {
          name: 'PropagateFormChanges',
          condition: 'source.domain === "form" && source.changed',
          action: 'propagateChanges(source, target)',
          priority: 10
        },
        {
          name: 'PropagateWorkflowResults',
          condition: 'source.domain === "workflow" && source.taskCompleted',
          action: 'updateFormWithResults(source, target)',
          priority: 8
        }
      ],
      priority: 5
    });
    
    return registry;
  },
  {
    pure: false,
    fusible: false,
    cost: 6
  }
);

/**
 * Create a mediation layer between a workflow and consciousness
 */
export const WorkflowConsciousnessMediationMorph = new SimpleMorph<
  { workflow: CognitiveWorkflow; consciousness: ConsciousWorkflow },
  MediationRegistry
>(
  "WorkflowConsciousnessMediationMorph",
  (input, context) => {
    const { workflow, consciousness } = input;
    
    // Create the mediation registry
    const registry = createMediationRegistry(
      `workflow-consciousness-${workflow.id}-${consciousness.id}`,
      ['workflow', 'consciousness'],
      {
        meta: {
          workflowId: workflow.id,
          consciousnessId: consciousness.id,
          workflowName: workflow.name,
          consciousnessPurpose: consciousness.purpose
        }
      }
    );
    
    // Create workflow-to-consciousness relations
    const workflowToSaraRelations = new WorkflowToSaraRelationsMorph().transform(workflow, context);
    const consciousnessToSaraRelations = new ConsciousnessToSaraRelationsMorph().transform(consciousness, context);
    
    // Combine the relations
    registry.relations = [...workflowToSaraRelations, ...consciousnessToSaraRelations];
    
    // Create task-to-state mappings if not already defined
    workflow.tasks.forEach(task => {
      // Skip if this task already has consciousness mappings
      if (task.consciousness?.concept || task.consciousness?.intention || task.consciousness?.reflection) {
        return;
      }
      
      // Find suitable states for this task
      const conceptState = findStateForTask(consciousness, task, 'concept');
      const intentionState = findStateForTask(consciousness, task, 'intention');
      const reflectionState = findStateForTask(consciousness, task, 'reflection');
      
      if (conceptState) {
        registry.relations.push({
          id: `task-concept-${task.id}-${conceptState.id}`,
          name: `Task Concept: ${task.name} ↔ ${conceptState.meaning}`,
          type: 'correspondence',
          source: {
            id: task.id,
            domain: 'task',
            type: task.operation
          },
          target: {
            id: conceptState.id,
            domain: 'consciousness',
            type: 'StateOfConsciousness'
          },
          propertyMappings: [
            {
              sourcePath: 'name',
              targetPath: 'meaning',
              direction: 'source-to-target'
            },
            {
              sourcePath: 'outputs[0].value',
              targetPath: 'content',
              direction: 'source-to-target'
            }
          ]
        });
      }
      
      if (intentionState) {
        registry.relations.push({
          id: `task-intention-${task.id}-${intentionState.id}`,
          name: `Task Intention: ${task.name} ↔ ${intentionState.meaning}`,
          type: 'correspondence',
          source: {
            id: task.id,
            domain: 'task',
            type: task.operation
          },
          target: {
            id: intentionState.id,
            domain: 'consciousness',
            type: 'StateOfConsciousness'
          },
          propertyMappings: [
            {
              sourcePath: 'description',
              targetPath: 'content.purpose',
              direction: 'source-to-target'
            },
            {
              sourcePath: 'operation',
              targetPath: 'content.operation',
              direction: 'source-to-target'
            }
          ]
        });
      }
      
      if (reflectionState) {
        registry.relations.push({
          id: `task-reflection-${task.id}-${reflectionState.id}`,
          name: `Task Reflection: ${task.name} ↔ ${reflectionState.meaning}`,
          type: 'correspondence',
          source: {
            id: task.id,
            domain: 'task',
            type: task.operation
          },
          target: {
            id: reflectionState.id,
            domain: 'consciousness',
            type: 'StateOfConsciousness'
          },
          propertyMappings: [
            {
              sourcePath: 'meta.results',
              targetPath: 'content',
              direction: 'source-to-target'
            }
          ]
        });
      }
    });
    
    // Create mediation policies
    registry.policies.push({
      name: 'WorkflowConsciousnessSync',
      description: 'Synchronizes task execution with consciousness states',
      domains: ['workflow', 'consciousness'],
      rules: [
        {
          name: 'TaskToConsciousness',
          condition: 'source.domain === "workflow" && source.taskExecuting',
          action: 'updateConsciousnessState(source, target)',
          priority: 10
        },
        {
          name: 'ConsciousnessToTask',
          condition: 'source.domain === "consciousness" && source.stateChanged',
          action: 'updateTaskFromConsciousness(source, target)',
          priority: 8
        }
      ],
      priority: 7
    });
    
    return registry;
  },
  {
    pure: false,
    fusible: false,
    cost: 7
  }
);

/**
 * Create a unified mediation layer for Sara-Tara-Neo integration
 */
export const UnifiedMediationMorph = new SimpleMorph<
  { 
    form?: FormShape; 
    graph?: PropertyGraph; 
    workflow?: CognitiveWorkflow; 
    consciousness?: ConsciousWorkflow 
  },
  MediationRegistry
>(
  "UnifiedMediationMorph",
  (input, context) => {
    const { form, graph, workflow, consciousness } = input;
    
    // Create the mediation registry
    const registry = createMediationRegistry(
      `unified-mediation-${Date.now()}`,
      ['form', 'graph', 'workflow', 'consciousness'].filter(domain => 
        (domain === 'form' && form) || 
        (domain === 'graph' && graph) || 
        (domain === 'workflow' && workflow) || 
        (domain === 'consciousness' && consciousness)
      ),
      {
        meta: {
          unifiedOrigin: 'UnifiedMediationMorph',
          timestamp: new Date().toISOString()
        }
      }
    );
    
    // Collect all relations
    let allRelations: SaraRelation[] = [];
    
    if (form) {
      const formRelations = new FormToSaraRelationsMorph().transform(form, context);
      allRelations = [...allRelations, ...formRelations];
    }
    
    if (graph) {
      const graphRelations = new GraphToSaraRelationsMorph().transform(graph, context);
      allRelations = [...allRelations, ...graphRelations];
    }
    
    if (workflow) {
      const workflowRelations = new WorkflowToSaraRelationsMorph().transform(workflow, context);
      allRelations = [...allRelations, ...workflowRelations];
    }
    
    if (consciousness) {
      const consciousnessRelations = new ConsciousnessToSaraRelationsMorph().transform(consciousness, context);
      allRelations = [...allRelations, ...consciousnessRelations];
    }
    
    // Create cross-domain relations
    if (form && workflow) {
      const formWorkflowRegistry = new FormWorkflowMediationMorph().transform({ form, workflow }, context);
      allRelations = [...allRelations, ...formWorkflowRegistry.relations];
    }
    
    if (workflow && consciousness) {
      const workflowConsciousnessRegistry = new WorkflowConsciousnessMediationMorph().transform(
        { workflow, consciousness }, 
        context
      );
      allRelations = [...allRelations, ...workflowConsciousnessRegistry.relations];
    }
    
    // Create form-consciousness relations if both exist but no workflow
    if (form && consciousness && !workflow) {
      form.fields.forEach(field => {
        // Find perception states that might correlate to this field
        const perceptionStates = consciousness.states.filter(s => 
          s.stateType === 'perception' && 
          s.meaning.toLowerCase().includes(field.id.toLowerCase() || field.label?.toLowerCase() || '')
        );
        
        perceptionStates.forEach(state => {
          allRelations.push({
            id: `field-perception-${field.id}-${state.id}`,
            name: `Field Perception: ${field.label || field.id} ↔ ${state.meaning}`,
            type: 'correspondence',
            source: {
              id: field.id,
              domain: 'field',
              path: `${form.id}.${field.id}`,
              type: field.type
            },
            target: {
              id: state.id,
              domain: 'consciousness',
              type: 'StateOfConsciousness'
            },
            propertyMappings: [
              {
                sourcePath: 'value',
                targetPath: 'content',
                direction: 'bidirectional'
              }
            ]
          });
        });
      });
    }
    
    // Add all relations to the registry
    registry.relations = allRelations;
    
    // Unify relations that reference the same entities
    unifyRelations(registry);
    
    // Create unified mediation policies
    registry.policies.push({
      name: 'UnifiedSyncPolicy',
      description: 'Synchronizes changes across all domains',
      domains: registry.domains,
      rules: [
        {
          name: 'PropagateChanges',
          condition: 'source.changed',
          action: 'propagateChangesAcrossDomains(source, registry)',
          priority: 10
        },
        {
          name: 'ResolveConflicts',
          condition: 'hasConflictingChanges(registry)',
          action: 'resolveConflicts(registry)',
          priority: 20
        },
        {
          name: 'IntegrateFeedback',
          condition: 'source.domain === "consciousness" && source.hasFeedback',
          action: 'integrateConsciousnessFeedback(source, registry)',
          priority: 15
        }
      ],
      priority: 10
    });
    
    return registry;
  },
  {
    pure: false,
    fusible: false,
    cost: 10
  }
);

/**
 * Utility functions
 */

/**
 * Find a task that could handle a specific field
 */
function findTaskForField(workflow: CognitiveWorkflow, field: FieldShape): CognitiveTask | undefined {
  // First look for tasks that explicitly reference this field
  for (const task of workflow.tasks) {
    if (task.formIntegration?.fieldMappings?.some(m => m.fieldId === field.id)) {
      return task;
    }
    
    if (task.inputs.some(input => 
      input.formField === field.id || 
      input.source.includes(field.id)
    )) {
      return task;
    }
    
    if (task.outputs.some(output => 
      output.formField === field.id || 
      output.destination?.includes(field.id)
    )) {
      return task;
    }
  }
  
  // If no explicit reference, guess based on naming and types
  for (const task of workflow.tasks) {
    // Check if task name or description mentions field
    if (
      task.name.toLowerCase().includes(field.id.toLowerCase()) || 
      task.name.toLowerCase().includes(field.label?.toLowerCase() || '') ||
      task.description?.toLowerCase().includes(field.id.toLowerCase()) ||
      task.description?.toLowerCase().includes(field.label?.toLowerCase() || '')
    ) {
      return task;
    }
    
    // For text fields, prefer analysis tasks
    if (
      (field.type === 'text' || field.type === 'textarea' || field.type === 'richtext') &&
      task.operation === 'analyze'
    ) {
      return task;
    }
    
    // For number fields, prefer transform tasks
    if (
      (field.type === 'number' || field.type === 'integer') &&
      task.operation === 'transform'
    ) {
      return task;
    }
  }
  
  // Return first task as fallback
  return workflow.tasks[0];
}

/**
 * Find a consciousness state that corresponds to a task
 */
function findStateForTask(
  consciousness: ConsciousWorkflow, 
  task: CognitiveTask,
  stateType: 'concept' | 'intention' | 'reflection'
): StateOfConsciousness | undefined {
  // First look for states that mention the task by name
  for (const state of consciousness.states) {
    if (state.stateType !== stateType) continue;
    
    if (
      state.meaning.toLowerCase().includes(task.name.toLowerCase()) ||
      state.meaning.toLowerCase().includes(task.id.toLowerCase())
    ) {
      return state;
    }
  }
  
  // Look for states that match the operation type
  for (const state of consciousness.states) {
    if (state.stateType !== stateType) continue;
    
    if (
      state.meaning.toLowerCase().includes(task.operation.toLowerCase())
    ) {
      return state;
    }
  }
  
  // Return any state of the correct type
  return consciousness.states.find(s => s.stateType === stateType);
}

/**
 * Map a field type to a domain type
 */
function mapFieldTypeToDomainType(fieldType: string): string {
  switch (fieldType) {
    case 'text': return 'TextProperty';
    case 'textarea': return 'TextProperty';
    case 'richtext': return 'RichTextProperty';
    case 'number': return 'NumberProperty';
    case 'integer': return 'IntegerProperty';
    case 'boolean': return 'BooleanProperty';
    case 'date': return 'DateProperty';
    case 'datetime': return 'DateTimeProperty';
    case 'select': return 'CategoryProperty';
    case 'multiselect': return 'CategoriesProperty';
    case 'file': return 'FileProperty';
    case 'image': return 'ImageProperty';
    default: return 'GenericProperty';
  }
}

/**
 * Create a validation expression from a field validation
 */
function createValidationExpression(validation: FieldValidation): string {
  switch (validation.type) {
    case 'required':
      return 'value !== null && value !== undefined && value !== ""';
    case 'min':
      return `value >= ${validation.min}`;
    case 'max':
      return `value <= ${validation.max}`;
    case 'minLength':
      return `value.length >= ${validation.length}`;
    case 'maxLength':
      return `value.length <= ${validation.length}`;
    case 'pattern':
      return `/${validation.pattern}/.test(value)`;
    case 'email':
      return '/^[^@]+@[^@]+\\.[^@]+$/.test(value)';
    case 'url':
      return '/^https?:\\/\\/[^\\s]+$/.test(value)';
    case 'custom':
      return validation.expression || 'true';
    default:
      return 'true';
  }
}

/**
 * Unify relations that reference the same entities
 */
function unifyRelations(registry: MediationRegistry): void {
  const relationsBySourceTarget: Map<string, SaraRelation[]> = new Map();
  
  // Group relations by source-target pairs
  registry.relations.forEach(relation => {
    const key = `${relation.source.id}|${relation.target.id}`;
    const existingRelations = relationsBySourceTarget.get(key) || [];
    existingRelations.push(relation);
    relationsBySourceTarget.set(key, existingRelations);
  });
  
  // Process each group
  const unifiedRelations: SaraRelation[] = [];
  relationsBySourceTarget.forEach((relationsGroup, key) => {
    if (relationsGroup.length === 1) {
      // No need to unify single relations
      unifiedRelations.push(relationsGroup[0]);
      return;
    }
    
    // Create a unified relation
    const baseRelation = relationsGroup[0];
    const unifiedRelation: SaraRelation = {
      id: `unified-${baseRelation.id}`,
      name: `Unified: ${baseRelation.name}`,
      type: baseRelation.type,
      source: baseRelation.source,
      target: baseRelation.target,
      forwardProperties: {},
      reverseProperties: {},
      propertyMappings: [],
      meta: {
        unified: true,
        sourceRelations: relationsGroup.map(r => r.id)
      }
    };
    
    // Merge properties from all relations
    relationsGroup.forEach(relation => {
      // Merge forward properties
      if (relation.forwardProperties) {
        unifiedRelation.forwardProperties = {
          ...unifiedRelation.forwardProperties,
          ...relation.forwardProperties
        };
      }
      
      // Merge reverse properties
      if (relation.reverseProperties) {
        unifiedRelation.reverseProperties = {
          ...unifiedRelation.reverseProperties,
          ...relation.reverseProperties
        };
      }
      
      // Merge property mappings
      if (relation.propertyMappings) {
        unifiedRelation.propertyMappings = [
          ...(unifiedRelation.propertyMappings || []),
          ...relation.propertyMappings
        ];
      }
      
      // Merge validity constraints
      if (relation.validityConstraints) {
        unifiedRelation.validityConstraints = [
          ...(unifiedRelation.validityConstraints || []),
          ...relation.validityConstraints
        ];
      }
    });
    
    // Remove duplicate property mappings
    if (unifiedRelation.propertyMappings) {
      const uniqueMappings: Record<string, PropertyMapping> = {};
      
      unifiedRelation.propertyMappings.forEach(mapping => {
        const key = `${mapping.sourcePath}|${mapping.targetPath}`;
        uniqueMappings[key] = mapping;
      });
      
      unifiedRelation.propertyMappings = Object.values(uniqueMappings);
    }
    
    unifiedRelations.push(unifiedRelation);
  });
  
  // Replace the original relations
  registry.relations = unifiedRelations;
}

/**
 * The complete unified Sara morphisms registry
 */
export const SaraMorphisms = {
  FormToSaraRelationsMorph,
  GraphToSaraRelationsMorph,
  WorkflowToSaraRelationsMorph,
  ConsciousnessToSaraRelationsMorph,
  SaraRelationsToGraphMorph,
  FormWorkflowMediationMorph,
  WorkflowConsciousnessMediationMorph,
  UnifiedMediationMorph
};

export default SaraMorphisms;