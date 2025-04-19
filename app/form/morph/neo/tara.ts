import { SimpleMorph } from "../morph";
import { PropertyGraph, GraphEntity, GraphRelationship } from "./graph";
import { CognitiveTask, CognitiveWorkflow, TaskDependency } from "./task";
import { NeoContext } from "./mode";
import { SaraRelation, EntityReference } from "./sara";

/**
 * Tara: The Citta Sattva framework for transcendent consciousness
 * Implementing Buddhi (wisdom), Ahamkara (identity), and Manas (mind)
 * Supporting the Free Concept and bridging to ObjectiveLogic
 */

/**
 * The three primary aspects of Citta (consciousness substance)
 */
export enum CittaAspect {
  /** 
   * Buddhi - Higher intellect, wisdom, discernment, insight
   * The faculty that knows, decides, and discriminates
   */
  BUDDHI = 'buddhi',
  
  /**
   * Ahamkara - Self-identity, ego-principle, "I-maker"
   * The faculty that creates the sense of self and individuality
   */
  AHAMKARA = 'ahamkara',
  
  /**
   * Manas - Mind, perception, thinking, feeling
   * The faculty that senses, processes, and coordinates
   */
  MANAS = 'manas'
}

/**
 * The three gunas or qualities that characterize all manifestation
 */
export enum Guna {
  /**
   * Sattva - Harmony, clarity, balance, purity
   * The quality of light, understanding, and peace
   */
  SATTVA = 'sattva',
  
  /**
   * Rajas - Activity, passion, change, movement
   * The quality of energy, desire, and action
   */
  RAJAS = 'rajas',
  
  /**
   * Tamas - Inertia, resistance, darkness, heaviness 
   * The quality of dullness, ignorance, and resistance
   */
  TAMAS = 'tamas'
}

/**
 * The levels of consciousness from gross to subtle
 */
export enum ConsciousnessLevel {
  /** Physical/sensory awareness */
  SENSORY = 'sensory',
  
  /** Emotional awareness */
  EMOTIONAL = 'emotional',
  
  /** Mental/conceptual awareness */
  MENTAL = 'mental',
  
  /** Intuitive awareness beyond concepts */
  INTUITIVE = 'intuitive',
  
  /** Witness consciousness, pure awareness */
  WITNESS = 'witness',
  
  /** Non-dual awareness beyond subject-object */
  NON_DUAL = 'non-dual'
}

/**
 * StateOfConsciousness represents a node in the conscious workflow
 * Enhanced with Citta Sattva principles
 */
export interface StateOfConsciousness {
  /** Unique state identifier */
  id: string;
  
  /** Semantic meaning of this state */
  meaning: string;
  
  /** Current content/value of this state */
  content: any;
  
  /** Type of consciousness state */
  stateType: 'perception' | 'concept' | 'intention' | 'memory' | 'reflection' | 'abstract';
  
  /** Primary Citta aspect of this state */
  cittaAspect: CittaAspect;
  
  /** Predominant guna quality */
  predominantGuna: Guna;
  
  /** Level of consciousness */
  level: ConsciousnessLevel;
  
  /** Cognitive qualities of this state */
  qualities: {
    /** Clarity level (0-1) */
    clarity: number;
    
    /** Stability level (0-1) */
    stability: number;
    
    /** Intensity level (0-1) */
    intensity: number;
    
    /** Integration with other states (0-1) */
    integration: number;
  };
  
  /** Gunas proportions (must sum to 1) */
  gunaProportions: {
    sattva: number;
    rajas: number;
    tamas: number;
  };
  
  /** How this state relates to objective reality */
  objectiveCorrespondence?: {
    /** Property graph entity this maps to */
    entityId?: string;
    
    /** Property path in objective reality */
    propertyPath?: string;
    
    /** Correspondence strength (0-1) */
    confidence: number;
    
    /** Mode of correspondence */
    mode: 'direct' | 'symbolic' | 'analogical' | 'metaphorical' | 'transcendent';
  };
  
  /** Subjective characteristics */
  subjectivity: {
    /** First-person phenomenal experience */
    experience: string;
    
    /** Qualia - qualitative character */
    qualia: string[];
    
    /** Degree of self-reference (0-1) */
    selfReference: number;
  };
  
  /** Metadata about this state */
  meta: Record<string, any>;
}

/**
 * ConsciousTransition enhanced with Citta Sattva principles
 */
export interface ConsciousTransition {
  /** Source state ID */
  fromStateId: string;
  
  /** Target state ID */
  toStateId: string;
  
  /** Type of transition */
  transitionType: 'causal' | 'associative' | 'intentional' | 'inferential' | 'dialectical' | 'transcendent';
  
  /** Citta aspect driving this transition */
  drivingAspect: CittaAspect;
  
  /** Gunas transformation */
  gunaTransformation: {
    /** How sattva changes */
    sattvaChange: 'increase' | 'decrease' | 'unchanged';
    
    /** How rajas changes */
    rajasChange: 'increase' | 'decrease' | 'unchanged';
    
    /** How tamas changes */
    tamasChange: 'increase' | 'decrease' | 'unchanged';
  };
  
  /** Transition characteristics */
  characteristics: {
    /** Freedom level (0-1) - higher means more non-deterministic */
    freedom: number;
    
    /** Necessity level (0-1) - higher means more logically necessary */
    necessity: number;
    
    /** Creative emergence level (0-1) */
    emergence: number;
    
    /** Transcendence potential (0-1) */
    transcendence: number;
  };
  
  /** Conditions that govern this transition */
  conditions?: ConsciousCondition[];
  
  /** Transition metadata */
  meta: Record<string, any>;
}

/**
 * ConsciousCondition enhanced with Citta Sattva principles
 */
export interface ConsciousCondition {
  /** Type of condition evaluation */
  evaluationType: 'logical' | 'semantic' | 'pattern' | 'emotional' | 'intuitive' | 'transcendent';
  
  /** Condition expression */
  expression: string;
  
  /** Context variables referenced */
  references: string[];
  
  /** Whether this is a hard condition (must be satisfied) or soft (preference) */
  required: boolean;
  
  /** Citta aspect evaluating this condition */
  evaluatingAspect: CittaAspect;
  
  /** Consciousness level at which this condition operates */
  operatingLevel: ConsciousnessLevel;
  
  /** Weight for soft conditions */
  weight?: number;
}

/**
 * BuddhiOperation represents a higher wisdom/intellect operation
 */
export interface BuddhiOperation {
  /** Unique operation identifier */
  id: string;
  
  /** Type of wisdom operation */
  type: 'discernment' | 'insight' | 'synthesis' | 'discrimination' | 'illumination' | 'comprehension';
  
  /** Input states */
  inputs: string[];
  
  /** Operation parameters */
  parameters: Record<string, any>;
  
  /** Wisdom characteristics */
  wisdom: {
    /** Clarity of discernment (0-1) */
    clarity: number;
    
    /** Depth of insight (0-1) */
    depth: number;
    
    /** Holistic integration (0-1) */
    integration: number;
  };
}

/**
 * AhamkaraOperation represents a self-identity operation
 */
export interface AhamkaraOperation {
  /** Unique operation identifier */
  id: string;
  
  /** Type of identity operation */
  type: 'identification' | 'differentiation' | 'appropriation' | 'attribution' | 'dissociation';
  
  /** Reference to self-concept */
  selfReference: string;
  
  /** Entity being related to self */
  entityReference: string;
  
  /** Identity characteristics */
  identity: {
    /** Strength of identification (0-1) */
    strength: number;
    
    /** Agency level (0-1) */
    agency: number;
    
    /** Attachment level (0-1) */
    attachment: number;
  };
}

/**
 * ManasOperation represents a mental processing operation
 */
export interface ManasOperation {
  /** Unique operation identifier */
  id: string;
  
  /** Type of mental operation */
  type: 'perception' | 'conception' | 'comparison' | 'imagination' | 'memory' | 'emotion';
  
  /** Sensory inputs */
  sensoryInputs?: string[];
  
  /** Conceptual inputs */
  conceptualInputs?: string[];
  
  /** Processing characteristics */
  processing: {
    /** Speed of processing (0-1) */
    speed: number;
    
    /** Stability of focus (0-1) */
    focus: number;
    
    /** Richness of detail (0-1) */
    detail: number;
  };
}

/**
 * ConsciousWorkflow enhanced with Citta Sattva principles
 */
export interface ConsciousWorkflow {
  /** Workflow identifier */
  id: string;
  
  /** Purpose or meaning of this workflow */
  purpose: string;
  
  /** Consciousness states */
  states: StateOfConsciousness[];
  
  /** Transitions between states */
  transitions: ConsciousTransition[];
  
  /** Buddhi operations */
  buddhiOperations: BuddhiOperation[];
  
  /** Ahamkara operations */
  ahamkaraOperations: AhamkaraOperation[];
  
  /** Manas operations */
  manasOperations: ManasOperation[];
  
  /** Entry points to the workflow */
  entryPoints: string[];
  
  /** Resolution points of the workflow */
  resolutionPoints: string[];
  
  /** Global consciousness context */
  context: ConsciousContext;
  
  /** Integration with Sara */
  saraIntegration?: {
    /** Sara form ID to interact with */
    formId?: string;
    
    /** Property mappings between Sara and Tara */
    propertyMappings: Array<{
      saraProperty: string;
      taraState: string;
      direction: 'sara-to-tara' | 'tara-to-sara' | 'bidirectional';
    }>;
  };
}

/**
 * ConsciousContext enhanced with Citta Sattva principles
 */
export interface ConsciousContext {
  /** Subject of consciousness (who/what is experiencing) */
  subject: {
    /** Subject identifier */
    id: string;
    
    /** Subject type */
    type: 'human' | 'agent' | 'collective' | 'abstract';
    
    /** Current dominant Citta aspect */
    dominantAspect: CittaAspect;
    
    /** Guna balance */
    gunaBalance: {
      sattva: number;
      rajas: number;
      tamas: number;
    };
    
    /** Subject characteristics */
    characteristics: Record<string, any>;
  };
  
  /** Objective situation parameters */
  situation: {
    /** Temporal context */
    temporality: {
      /** Current reference time */
      now: string;
      
      /** Relevant time horizon (past) in milliseconds */
      pastHorizon?: number;
      
      /** Relevant time horizon (future) in milliseconds */
      futureHorizon?: number;
      
      /** Experiential time flow rate relative to clock time */
      experientialTimeFlow: number;
    };
    
    /** Environmental factors */
    environment: Record<string, any>;
  };
  
  /** Active memory elements */
  activeMemory: Array<{
    /** Memory identifier */
    id: string;
    
    /** Memory content */
    content: any;
    
    /** Memory accessibility (0-1) */
    accessibility: number;
    
    /** Associated Citta aspect */
    cittaAspect: CittaAspect;
    
    /** Emotional coloring */
    emotionalValence: number;
  }>;
  
  /** Current values/priorities driving decisions */
  values: Array<{
    /** Value name */
    name: string;
    
    /** Current priority level (0-1) */
    priority: number;
    
    /** Associated Citta aspect */
    cittaAspect: CittaAspect;
  }>;
  
  /** Vasanas (latent tendencies/dispositions) */
  vasanas: Array<{
    /** Tendency name */
    name: string;
    
    /** Strength of tendency (0-1) */
    strength: number;
    
    /** Associated guna */
    primaryGuna: Guna;
    
    /** Activation conditions */
    activationConditions: string[];
  }>;
}

/**
 * Enhanced TaskToConsciousnessMorph with Citta Sattva principles
 */
export const TaskToConsciousnessMorph = new SimpleMorph<CognitiveWorkflow, ConsciousWorkflow>(
  "TaskToConsciousnessMorph",
  (workflow, context) => {
    // Create the conscious workflow
    const consciousWorkflow: ConsciousWorkflow = {
      id: `tara-${workflow.id}`,
      purpose: workflow.name,
      states: [],
      transitions: [],
      buddhiOperations: [],
      ahamkaraOperations: [],
      manasOperations: [],
      entryPoints: [],
      resolutionPoints: [],
      context: createInitialContext(workflow, context),
    };
    
    // Task state mappings
    const taskStateMap: Record<string, string> = {};
    
    // Create perceptual input states
    workflow.inputs.forEach(input => {
      const inputState = createPerceptionState(input);
      
      consciousWorkflow.states.push(inputState);
      consciousWorkflow.entryPoints.push(inputState.id);
      
      // Create corresponding Manas operation for this perception
      consciousWorkflow.manasOperations.push({
        id: `manas-perception-${input.id}`,
        type: 'perception',
        sensoryInputs: [input.source],
        processing: {
          speed: 0.8,
          focus: 0.7,
          detail: 0.9
        }
      });
    });
    
    // Transform each task into states and transitions
    workflow.tasks.forEach(task => {
      // Create states for this task using Citta aspects
      const intentionState = createIntentionState(task);
      const conceptState = createConceptState(task);
      const reflectionState = createReflectionState(task);
      
      // Store mapping for dependency creation
      taskStateMap[task.id] = conceptState.id;
      
      // Add states to workflow
      consciousWorkflow.states.push(intentionState);
      consciousWorkflow.states.push(conceptState);
      consciousWorkflow.states.push(reflectionState);
      
      // Create Citta operations for this task
      
      // Ahamkara identifies with the task intention
      consciousWorkflow.ahamkaraOperations.push({
        id: `ahamkara-identification-${task.id}`,
        type: 'identification',
        selfReference: consciousWorkflow.context.subject.id,
        entityReference: intentionState.id,
        identity: {
          strength: task.operation === 'create' ? 0.9 : 0.7, 
          agency: task.operation === 'transform' ? 0.9 : 0.8,
          attachment: task.operation === 'analyze' ? 0.5 : 0.7
        }
      });
      
      // Buddhi performs discernment on the concept
      consciousWorkflow.buddhiOperations.push({
        id: `buddhi-discernment-${task.id}`,
        type: 'discernment',
        inputs: [conceptState.id],
        parameters: {
          discernmentCriteria: task.constraints?.map(c => c.specification) || []
        },
        wisdom: {
          clarity: 0.9,
          depth: 0.8,
          integration: 0.7
        }
      });
      
      // Manas processes the task conceptually
      consciousWorkflow.manasOperations.push({
        id: `manas-conception-${task.id}`,
        type: 'conception',
        conceptualInputs: [intentionState.id],
        processing: {
          speed: 0.7,
          focus: 0.8,
          detail: 0.8
        }
      });
      
      // Create transitions with Citta Sattva characteristics
      
      // Intention to concept (Ahamkara to Buddhi)
      consciousWorkflow.transitions.push({
        fromStateId: intentionState.id,
        toStateId: conceptState.id,
        transitionType: 'intentional',
        drivingAspect: CittaAspect.AHAMKARA,
        gunaTransformation: {
          sattvaChange: 'increase',
          rajasChange: 'decrease',
          tamasChange: 'unchanged'
        },
        characteristics: {
          freedom: 0.3,
          necessity: 0.7,
          emergence: 0.4,
          transcendence: 0.2
        },
        meta: {
          description: `Movement from intention to concept for task ${task.id}`
        }
      });
      
      // Concept to reflection (Buddhi to integration)
      consciousWorkflow.transitions.push({
        fromStateId: conceptState.id,
        toStateId: reflectionState.id,
        transitionType: 'inferential',
        drivingAspect: CittaAspect.BUDDHI,
        gunaTransformation: {
          sattvaChange: 'increase',
          rajasChange: 'decrease',
          tamasChange: 'decrease'
        },
        characteristics: {
          freedom: 0.2,
          necessity: 0.8,
          emergence: 0.3,
          transcendence: 0.4
        },
        meta: {
          description: `Movement from concept to reflection for task ${task.id}`
        }
      });
      
      // Connect task inputs to intention (Manas to Ahamkara)
      task.inputs.forEach(input => {
        const perceivedInputId = `perception-${input.id}`;
        
        consciousWorkflow.transitions.push({
          fromStateId: perceivedInputId,
          toStateId: intentionState.id,
          transitionType: 'causal',
          drivingAspect: CittaAspect.MANAS,
          gunaTransformation: {
            sattvaChange: 'unchanged',
            rajasChange: 'increase',
            tamasChange: 'decrease'
          },
          characteristics: {
            freedom: 0.1,
            necessity: 0.9,
            emergence: 0.2,
            transcendence: 0.1
          },
          meta: {
            description: `Input flow from ${input.id} to task ${task.id}`
          }
        });
      });
      
      // If this is a terminal task, mark reflection as resolution point
      if (!workflow.dependencies.some(dep => dep.fromTaskId === task.id)) {
        consciousWorkflow.resolutionPoints.push(reflectionState.id);
      }
    });
    
    // Create transitions from task dependencies
    workflow.dependencies.forEach(dep => {
      const fromStateId = taskStateMap[dep.fromTaskId];
      const toStateId = taskStateMap[dep.toTaskId];
      
      if (fromStateId && toStateId) {
        // Determine the driving aspect based on dependency type
        const drivingAspect = determineDrivingAspect(dep.type);
        
        consciousWorkflow.transitions.push({
          fromStateId,
          toStateId,
          transitionType: mapDependencyTypeToTransition(dep.type),
          drivingAspect,
          gunaTransformation: determineGunaTransformation(dep.type),
          characteristics: {
            freedom: dep.type === 'control' ? 0.7 : 0.3,
            necessity: dep.type === 'data' ? 0.8 : 0.4,
            emergence: 0.5,
            transcendence: dep.type === 'temporal' ? 0.6 : 0.3
          },
          conditions: dep.conditions?.map(mapConditionToConsciousCondition),
          meta: {
            dependencyType: dep.type,
            description: `Task dependency from ${dep.fromTaskId} to ${dep.toTaskId}`
          }
        });
      }
    });
    
    // Add Sara integration if context provides it
    if (context?.sara?.formId) {
      consciousWorkflow.saraIntegration = {
        formId: context.sara.formId,
        propertyMappings: derivePropertyMappings(workflow, context)
      };
    }
    
    return consciousWorkflow;
  },
  {
    pure: false,
    fusible: false,
    cost: 8
  }
);

/**
 * Create a perception state with Citta Sattva principles
 */
function createPerceptionState(input: TaskInput): StateOfConsciousness {
  return {
    id: `perception-${input.id}`,
    meaning: `Perception of ${input.id}`,
    content: null, // Will be populated at runtime
    stateType: 'perception',
    cittaAspect: CittaAspect.MANAS,
    predominantGuna: Guna.RAJAS,
    level: ConsciousnessLevel.SENSORY,
    qualities: {
      clarity: 0.9,
      stability: 0.8,
      intensity: 0.7,
      integration: 0.5
    },
    gunaProportions: {
      sattva: 0.3,
      rajas: 0.6,
      tamas: 0.1
    },
    objectiveCorrespondence: {
      propertyPath: input.source,
      confidence: 0.9,
      mode: 'direct'
    },
    subjectivity: {
      experience: `Direct sensory engagement with ${input.id}`,
      qualia: ['perception', 'attention', 'sensation'],
      selfReference: 0.3
    },
    meta: {
      sourceInput: input.id,
      sourceType: input.sourceType
    }
  };
}

/**
 * Create an intention state with Citta Sattva principles
 */
function createIntentionState(task: CognitiveTask): StateOfConsciousness {
  return {
    id: `intention-${task.id}`,
    meaning: `Intention to ${task.operation} for ${task.name}`,
    content: {
      operation: task.operation,
      targetName: task.name,
      purpose: task.description
    },
    stateType: 'intention',
    cittaAspect: CittaAspect.AHAMKARA,
    predominantGuna: Guna.RAJAS,
    level: ConsciousnessLevel.MENTAL,
    qualities: {
      clarity: 0.8,
      stability: 0.7,
      intensity: 0.9,
      integration: 0.6
    },
    gunaProportions: {
      sattva: 0.4,
      rajas: 0.5,
      tamas: 0.1
    },
    objectiveCorrespondence: {
      entityId: task.id,
      confidence: 0.85,
      mode: 'symbolic'
    },
    subjectivity: {
      experience: `Will to accomplish ${task.name}`,
      qualia: ['intention', 'agency', 'purpose'],
      selfReference: 0.8
    },
    meta: {
      sourceTask: task.id,
      operation: task.operation
    }
  };
}

/**
 * Create a concept state with Citta Sattva principles
 */
function createConceptState(task: CognitiveTask): StateOfConsciousness {
  return {
    id: `concept-${task.id}`,
    meaning: `Conceptualization of ${task.name}`,
    content: null, // Will be populated during execution
    stateType: 'concept',
    cittaAspect: CittaAspect.BUDDHI,
    predominantGuna: Guna.SATTVA,
    level: ConsciousnessLevel.MENTAL,
    qualities: {
      clarity: 0.9,
      stability: 0.8,
      intensity: 0.7,
      integration: 0.8
    },
    gunaProportions: {
      sattva: 0.7,
      rajas: 0.2,
      tamas: 0.1
    },
    objectiveCorrespondence: {
      entityId: task.id,
      confidence: 0.9,
      mode: 'analogical'
    },
    subjectivity: {
      experience: `Clear understanding of ${task.name}`,
      qualia: ['clarity', 'insight', 'comprehension'],
      selfReference: 0.5
    },
    meta: {
      sourceTask: task.id,
      outputs: task.outputs.map(o => o.id),
      agent: task.agent
    }
  };
}

/**
 * Create a reflection state with Citta Sattva principles
 */
function createReflectionState(task: CognitiveTask): StateOfConsciousness {
  return {
    id: `reflection-${task.id}`,
    meaning: `Reflection on results of ${task.name}`,
    content: null, // Will be populated during execution
    stateType: 'reflection',
    cittaAspect: CittaAspect.BUDDHI,
    predominantGuna: Guna.SATTVA,
    level: ConsciousnessLevel.INTUITIVE,
    qualities: {
      clarity: 0.7,
      stability: 0.6,
      intensity: 0.5,
      integration: 0.9
    },
    gunaProportions: {
      sattva: 0.8,
      rajas: 0.1,
      tamas: 0.1
    },
    objectiveCorrespondence: {
      entityId: task.id,
      confidence: 0.7,
      mode: 'metaphorical'
    },
    subjectivity: {
      experience: `Contemplative awareness of ${task.name} completion`,
      qualia: ['reflection', 'evaluation', 'integration'],
      selfReference: 0.6
    },
    meta: {
      sourceTask: task.id,
      evaluationCriteria: task.constraints?.map(c => c.specification)
    }
  };
}

/**
 * Map a task dependency type to a conscious transition type
 */
function mapDependencyTypeToTransition(depType: string): ConsciousTransition['transitionType'] {
  switch (depType) {
    case 'data': return 'causal';
    case 'control': return 'intentional';
    case 'resource': return 'associative';
    case 'temporal': return 'dialectical';
    default: return 'associative';
  }
}

/**
 * Determine the driving Citta aspect based on dependency type
 */
function determineDrivingAspect(depType: string): CittaAspect {
  switch (depType) {
    case 'data': return CittaAspect.MANAS;
    case 'control': return CittaAspect.AHAMKARA;
    case 'resource': return CittaAspect.MANAS;
    case 'temporal': return CittaAspect.BUDDHI;
    default: return CittaAspect.MANAS;
  }
}

/**
 * Determine guna transformation based on dependency type
 */
function determineGunaTransformation(depType: string): ConsciousTransition['gunaTransformation'] {
  switch (depType) {
    case 'data':
      return {
        sattvaChange: 'increase',
        rajasChange: 'unchanged',
        tamasChange: 'decrease'
      };
    case 'control':
      return {
        sattvaChange: 'unchanged',
        rajasChange: 'increase',
        tamasChange: 'decrease'
      };
    case 'resource':
      return {
        sattvaChange: 'unchanged',
        rajasChange: 'increase',
        tamasChange: 'unchanged'
      };
    case 'temporal':
      return {
        sattvaChange: 'increase',
        rajasChange: 'decrease',
        tamasChange: 'decrease'
      };
    default:
      return {
        sattvaChange: 'unchanged',
        rajasChange: 'unchanged',
        tamasChange: 'unchanged'
      };
  }
}

/**
 * Map a property condition to a conscious condition
 */
function mapConditionToConsciousCondition(condition: any): ConsciousCondition {
  return {
    evaluationType: 'logical',
    expression: `${condition.left} ${condition.operator} ${condition.right}`,
    references: [condition.left],
    required: true,
    evaluatingAspect: CittaAspect.BUDDHI, // Discernment is a Buddhi function
    operatingLevel: ConsciousnessLevel.MENTAL
  };
}

/**
 * Enhanced initial context creation with Citta Sattva principles
 */
function createInitialContext(workflow: CognitiveWorkflow, context: any): ConsciousContext {
  return {
    subject: {
      id: context?.subject?.id || 'tara-agent',
      type: context?.subject?.type || 'agent',
      dominantAspect: CittaAspect.BUDDHI,
      gunaBalance: {
        sattva: 0.6,
        rajas: 0.3,
        tamas: 0.1
      },
      characteristics: context?.subject?.characteristics || {
        autonomy: 0.8,
        creativity: 0.7,
        rationality: 0.9,
        intuition: 0.6
      }
    },
    situation: {
      temporality: {
        now: new Date().toISOString(),
        pastHorizon: 60 * 60 * 1000, // 1 hour
        futureHorizon: 24 * 60 * 60 * 1000, // 1 day
        experientialTimeFlow: 1.0 // Normal flow
      },
      environment: context?.environment || {}
    },
    activeMemory: [],
    values: [
      { name: 'accuracy', priority: 0.9, cittaAspect: CittaAspect.BUDDHI },
      { name: 'coherence', priority: 0.8, cittaAspect: CittaAspect.BUDDHI },
      { name: 'utility', priority: 0.7, cittaAspect: CittaAspect.MANAS },
      { name: 'creativity', priority: 0.6, cittaAspect: CittaAspect.AHAMKARA }
    ],
    vasanas: [
      { 
        name: 'analysis',
        strength: 0.8,
        primaryGuna: Guna.SATTVA,
        activationConditions: ['complex data present', 'unclear patterns']
      },
      { 
        name: 'creation',
        strength: 0.7,
        primaryGuna: Guna.RAJAS,
        activationConditions: ['opportunity for novel solutions', 'creative challenge']
      },
      { 
        name: 'integration',
        strength: 0.9,
        primaryGuna: Guna.SATTVA,
        activationConditions: ['disparate elements present', 'synthesis required']
      }
    ]
  };
}

/**
 * Enhanced LangGraph configuration generation with Citta Sattva 
 */
export const ConsciousnessToLangGraphMorph = new SimpleMorph<ConsciousWorkflow, any>(
  "ConsciousnessToLangGraphMorph",
  (consciousness, context) => {
    // Map to LangGraph's state-based model with Citta Sattva enhancements
    const langGraphConfig = {
      // Standard LangGraph configuration fields
      nodes: consciousness.states.map(state => ({
        id: state.id,
        type: mapStateTypeToNodeType(state.stateType),
        config: {
          name: state.meaning,
          description: `State of consciousness: ${state.stateType}`,
          properties: {
            cittaAspect: state.cittaAspect,
            predominantGuna: state.predominantGuna,
            level: state.level,
            qualities: state.qualities,
            gunaProportions: state.gunaProportions,
            objectiveCorrespondence: state.objectiveCorrespondence,
            subjectivity: state.subjectivity
          },
          class_path: mapStateTypeToClass(state.stateType, state.cittaAspect)
        }
      })),
      
      edges: consciousness.transitions.map(transition => ({
        source: transition.fromStateId,
        target: transition.toStateId,
        type: transition.transitionType,
        config: {
          drivingAspect: transition.drivingAspect,
          gunaTransformation: transition.gunaTransformation,
          characteristics: transition.characteristics
        },
        conditions: transition.conditions?.map(condition => ({
          type: condition.evaluationType,
          expression: condition.expression,
          required: condition.required,
          evaluatingAspect: condition.evaluatingAspect,
          operatingLevel: condition.operatingLevel
        }))
      })),
      
      // Citta operations
      citta_operations: {
        buddhi: consciousness.buddhiOperations,
        ahamkara: consciousness.ahamkaraOperations,
        manas: consciousness.manasOperations
      },
      
      // Enhanced consciousness context
      conscious_context: {
        subject: consciousness.context.subject,
        situation: consciousness.context.situation,
        memory: consciousness.context.activeMemory,
        values: consciousness.context.values,
        vasanas: consciousness.context.vasanas
      },
      
      entry_points: consciousness.entryPoints,
      resolution_points: consciousness.resolutionPoints,
      
      // Special handling for the freedom-necessity dialectic
      dialectics: {
        freedom_necessity: consciousness.transitions.map(t => ({
          source: t.fromStateId,
          target: t.toStateId,
          freedom: t.characteristics.freedom,
          necessity: t.characteristics.necessity,
          emergence: t.characteristics.emergence,
          transcendence: t.characteristics.transcendence
        })),
        
        // Gunas dialectics
        gunas: consciousness.transitions.map(t => ({
          source: t.fromStateId,
          target: t.toStateId,
          sattvaDelta: t.gunaTransformation.sattvaChange,
          rajasDelta: t.gunaTransformation.rajasChange,
          tamasDelta: t.gunaTransformation.tamasChange
        })),
        
        // Citta aspects dialectics
        citta: consciousness.transitions.map(t => ({
          source: t.fromStateId,
          target: t.toStateId,
          drivingAspect: t.drivingAspect
        }))
      },
      
      // Integration with Sara (form system)
      sara_integration: consciousness.saraIntegration
    };
    
    return langGraphConfig;
  },
  {
    pure: true,
    fusible: false,
    cost: 4
  }
);

/**
 * Map a state type to a LangGraph node type, considering Citta aspects
 */
function mapStateTypeToNodeType(stateType: StateOfConsciousness['stateType']): string {
  switch (stateType) {
    case 'perception': return 'input';
    case 'concept': return 'agent';
    case 'intention': return 'router';
    case 'memory': return 'memory';
    case 'reflection': return 'output';
    case 'abstract': return 'tool';
    default: return 'generic';
  }
}

/**
 * Map a state type to a LangGraph class path, including Citta aspects
 */
function mapStateTypeToClass(
  stateType: StateOfConsciousness['stateType'], 
  cittaAspect: CittaAspect
): string {
  const aspect = cittaAspect.toLowerCase();
  
  switch (stateType) {
    case 'perception': return `tara.nodes.${aspect}.PerceptionNode`;
    case 'concept': return `tara.nodes.${aspect}.ConceptualizationNode`;
    case 'intention': return `tara.nodes.${aspect}.IntentionNode`;
    case 'memory': return `tara.nodes.${aspect}.MemoryNode`;
    case 'reflection': return `tara.nodes.${aspect}.ReflectionNode`;
    case 'abstract': return `tara.nodes.${aspect}.AbstractNode`;
    default: return `tara.nodes.${aspect}.GenericNode`;
  }
}

/**
 * Derive property mappings between Sara and Tara with Citta awareness
 */
function derivePropertyMappings(workflow: CognitiveWorkflow, context: any): Array<any> {
  const mappings: Array<any> = [];
  
  // Derive mappings from workflow inputs and outputs with Citta awareness
  workflow.inputs.forEach(input => {
    if (input.sourceType === 'property' && input.source.startsWith('form.')) {
      mappings.push({
        saraProperty: input.source.replace('form.', ''),
        taraState: `perception-${input.id}`,
        direction: 'sara-to-tara'
      });
    }
  });
  
  workflow.outputs.forEach(output => {
    if (output.destination?.startsWith('form.')) {
      // Find the task that produces this output
      const producingTask = workflow.tasks.find(t => 
        t.outputs.some(o => o.id === output.id)
      );
      
      if (producingTask) {
        mappings.push({
          saraProperty: output.destination.replace('form.', ''),
          taraState: `concept-${producingTask.id}`,
          direction: 'tara-to-sara'
        });
      }
    }
  });
  
  return mappings;
}

/**
 * Transform a PropertyGraph directly to a Tara ConsciousWorkflow
 */
export const GraphToConsciousnessMorph = new SimpleMorph<PropertyGraph, ConsciousWorkflow>(
  "GraphToConsciousnessMorph",
  (graph, context) => {
    // Use GraphToWorkflowMorph first, then pipe to TaskToConsciousnessMorph
    const workflowMorph = new GraphToWorkflowMorph();
    const consciousnessMorph = new TaskToConsciousnessMorph();
    
    const workflow = workflowMorph.transform(graph, context);
    return consciousnessMorph.transform(workflow, context);
  },
  {
    pure: false,
    fusible: false,
    cost: 10
  }
);

/**
 * Transform a form to consciousness directly
 */
export const FormToConsciousnessMorph = new SimpleMorph<any, ConsciousWorkflow>(
  "FormToConsciousnessMorph",
  (form, context) => {
    // Enhanced implementation that creates a consciousness workflow directly from a form
    // This would map form fields to perception states, create intention states for validation,
    // concept states for field interactions, etc.
    
    // Placeholder implementation that chains morphs
    const formToWorkflowMorph = new FormToWorkflowMorph();
    const taskToConsciousnessMorph = new TaskToConsciousnessMorph();
    
    const workflow = formToWorkflowMorph.transform(form, context);
    return taskToConsciousnessMorph.transform(workflow, context);
  },
  {
    pure: false,
    fusible: false,
    cost: 12
  }
);