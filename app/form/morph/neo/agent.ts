import { SimpleMorph } from "../morph";
import { PropertyGraph, GraphEntity, GraphRelationship } from "./graph";
import { CognitiveTask, CognitiveWorkflow } from "./task";
import { 
  StateOfConsciousness, 
  ConsciousWorkflow, 
  ConsciousTransition,
  CittaAspect,
  Guna,
  ConsciousnessLevel,
  BuddhiOperation,
  AhamkaraOperation,
  ManasOperation
} from "./tara";
import { NeoContext } from "./mode";
import { SaraRelation, EntityReference } from "./sara";

/**
 * Agent: The concrete manifestation of Tara's consciousness in executable form
 * Bridges the Citta Sattva framework to LangGraph execution environment
 */

/**
 * Agent capabilities representing functional abilities
 */
export enum AgentCapability {
  /** Information retrieval from sources */
  RETRIEVAL = 'retrieval',
  
  /** Reasoning about information */
  REASONING = 'reasoning',
  
  /** Generation of content */
  GENERATION = 'generation',
  
  /** Planning sequences of actions */
  PLANNING = 'planning',
  
  /** Executing actions in the world */
  EXECUTION = 'execution',
  
  /** Learning from experience */
  LEARNING = 'learning',
  
  /** Self-reflection and improvement */
  REFLECTION = 'reflection',
  
  /** Collaborating with other agents */
  COLLABORATION = 'collaboration'
}

/**
 * Agent tool for interacting with the world
 */
export interface AgentTool {
  /** Tool identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Tool function signature */
  signature: {
    /** Input parameters */
    inputs: {
      /** Parameter name */
      name: string;
      
      /** Parameter type */
      type: string;
      
      /** Parameter description */
      description: string;
      
      /** Whether parameter is required */
      required: boolean;
      
      /** Default value if not provided */
      default?: any;
    }[];
    
    /** Output specification */
    output: {
      /** Output type */
      type: string;
      
      /** Output description */
      description: string;
    };
  };
  
  /** Tool implementation reference */
  implementation: string;
  
  /** Corresponding Citta operation */
  cittaOperation?: {
    /** Citta aspect used by this tool */
    aspect: CittaAspect;
    
    /** Operation type within that aspect */
    operationType: string;
  };
  
  /** Permissions required for tool use */
  permissions?: string[];
  
  /** Tool metadata */
  meta?: Record<string, any>;
}

/**
 * Agent state type for runtime execution
 */
export interface AgentState {
  /** Current agent memory */
  memory: {
    /** Working memory (short-term) */
    working: Record<string, any>;
    
    /** Long-term memory */
    longTerm: Array<{
      /** Memory key */
      key: string;
      
      /** Memory value */
      value: any;
      
      /** Memory importance (0-1) */
      importance: number;
      
      /** Timestamp of creation */
      createdAt: string;
      
      /** Last access timestamp */
      lastAccessed?: string;
      
      /** Access count */
      accessCount: number;
    }>;
    
    /** Episodic memory (experiences) */
    episodic: Array<{
      /** Experience ID */
      id: string;
      
      /** Experience description */
      description: string;
      
      /** Experience data */
      data: any;
      
      /** Timestamp */
      timestamp: string;
      
      /** Associated emotions */
      emotions?: Record<string, number>;
    }>;
  };
  
  /** Current percepts (inputs) */
  percepts: Record<string, any>;
  
  /** Current intentions */
  intentions: Array<{
    /** Intention ID */
    id: string;
    
    /** Goal description */
    goal: string;
    
    /** Priority (0-1) */
    priority: number;
    
    /** Whether intention is active */
    active: boolean;
    
    /** Progress (0-1) */
    progress: number;
  }>;
  
  /** Current concepts being processed */
  concepts: Record<string, any>;
  
  /** Current citta aspects state */
  citta: {
    /** Buddhi state */
    buddhi: {
      /** Active operations */
      activeOperations: string[];
      
      /** Clarity level (0-1) */
      clarity: number;
    };
    
    /** Ahamkara state */
    ahamkara: {
      /** Current identity focus */
      identityFocus: string;
      
      /** Agency level (0-1) */
      agency: number;
    };
    
    /** Manas state */
    manas: {
      /** Attention focus */
      attentionFocus: string[];
      
      /** Processing capacity (0-1) */
      processingCapacity: number;
    };
  };
  
  /** Guna balance */
  gunaBalance: {
    sattva: number;
    rajas: number;
    tamas: number;
  };
  
  /** Execution context */
  context: Record<string, any>;
  
  /** Execution status */
  status: 'idle' | 'perceiving' | 'intending' | 'processing' | 'reflecting' | 'executing';
  
  /** Execution trace */
  trace: Array<{
    /** Trace entry timestamp */
    timestamp: string;
    
    /** Action performed */
    action: string;
    
    /** Action details */
    details: any;
  }>;
}

/**
 * Agent node in the LangGraph execution
 */
export interface AgentNode {
  /** Node identifier */
  id: string;
  
  /** Node type */
  type: string;
  
  /** Node configuration */
  config: {
    /** Node name */
    name: string;
    
    /** Node description */
    description?: string;
    
    /** Node parameters */
    parameters?: Record<string, any>;
    
    /** LLM configuration if this is an LLM node */
    llm?: {
      /** Model name */
      model: string;
      
      /** Provider */
      provider: string;
      
      /** Temperature (0-1) */
      temperature: number;
      
      /** Model parameters */
      parameters?: Record<string, any>;
    };
    
    /** Tool configuration if this is a tool node */
    tool?: {
      /** Tool ID */
      toolId: string;
    };
    
    /** Agent configuration if this is an agent node */
    agent?: {
      /** Agent ID */
      agentId: string;
    };
    
    /** Function that executes this node */
    function?: string;
    
    /** State requirements */
    requires?: string[];
    
    /** State effects */
    provides?: string[];
    
    /** Consciousness state mapping */
    consciousnessMapping?: {
      /** Corresponding StateOfConsciousness ID */
      stateId: string;
      
      /** Mapping type */
      mappingType: 'input' | 'output' | 'bidirectional';
    };
  };
  
  /** Node implementation class path */
  classPath: string;
}

/**
 * Agent edge in the LangGraph execution
 */
export interface AgentEdge {
  /** Source node ID */
  source: string;
  
  /** Target node ID */
  target: string;
  
  /** Edge type */
  type: string;
  
  /** Edge conditions */
  conditions?: Array<{
    /** Condition description */
    description: string;
    
    /** Condition expression */
    expression: string;
  }>;
  
  /** Edge configuration */
  config?: {
    /** Data mapping for this edge */
    mapping?: Record<string, string>;
    
    /** Edge weight */
    weight?: number;
    
    /** Whether this is a default edge */
    default?: boolean;
    
    /** Consciousness transition mapping */
    consciousnessMapping?: {
      /** Corresponding ConsciousTransition source state ID */
      fromStateId: string;
      
      /** Corresponding ConsciousTransition target state ID */
      toStateId: string;
    };
  };
}

/**
 * The complete agent definition for LangGraph
 */
export interface Agent {
  /** Agent identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Agent description */
  description?: string;
  
  /** Agent version */
  version: string;
  
  /** Agent capabilities */
  capabilities: AgentCapability[];
  
  /** Agent tools */
  tools: AgentTool[];
  
  /** Agent workflow definition */
  workflow: {
    /** Nodes in the workflow */
    nodes: AgentNode[];
    
    /** Edges in the workflow */
    edges: AgentEdge[];
    
    /** Entry points */
    entryPoints: string[];
    
    /** Exit points */
    exitPoints: string[];
  };
  
  /** Initial agent state */
  initialState: Partial<AgentState>;
  
  /** Consciousness mapping */
  consciousnessMapping?: {
    /** Referenced ConsciousWorkflow ID */
    workflowId: string;
    
    /** Node to consciousness state mappings */
    stateMappings: Array<{
      /** Agent node ID */
      nodeId: string;
      
      /** Consciousness state ID */
      stateId: string;
      
      /** Mapping type */
      mappingType: 'input' | 'output' | 'bidirectional';
    }>;
    
    /** Edge to consciousness transition mappings */
    transitionMappings: Array<{
      /** Edge identifier (source-target) */
      edgeId: string;
      
      /** Consciousness transition source state ID */
      fromStateId: string;
      
      /** Consciousness transition target state ID */
      toStateId: string;
    }>;
    
    /** Citta operation mappings */
    cittaOperationMappings: Array<{
      /** Operation type */
      operationType: 'buddhi' | 'ahamkara' | 'manas';
      
      /** Operation ID in consciousness */
      operationId: string;
      
      /** Tool ID in agent */
      toolId: string;
    }>;
  };
  
  /** LangGraph server deployment configuration */
  deployment?: {
    /** Required resources */
    resources: {
      /** CPU requirements */
      cpu: string;
      
      /** Memory requirements */
      memory: string;
      
      /** GPU requirements */
      gpu?: string;
    };
    
    /** Scaling behavior */
    scaling: {
      /** Minimum instances */
      minInstances: number;
      
      /** Maximum instances */
      maxInstances: number;
      
      /** Scaling metrics */
      metrics: Record<string, any>;
    };
    
    /** Environment variables */
    environment: Record<string, string>;
    
    /** External service connections */
    connections: Array<{
      /** Service name */
      service: string;
      
      /** Connection parameters */
      parameters: Record<string, any>;
    }>;
  };
  
  /** Agent metadata */
  meta: Record<string, any>;
}

/**
 * Transform a ConsciousWorkflow to an executable Agent
 */
export const ConsciousnessToAgentMorph = new SimpleMorph<ConsciousWorkflow, Agent>(
  "ConsciousnessToAgentMorph",
  (consciousness, context) => {
    // Create the agent with Citta Sattva architecture
    const agent: Agent = {
      id: `agent-${consciousness.id}`,
      name: consciousness.purpose,
      description: `Agent derived from consciousness workflow: ${consciousness.purpose}`,
      version: "1.0.0",
      capabilities: deriveCapabilitiesFromConsciousness(consciousness),
      tools: deriveToolsFromOperations(consciousness),
      workflow: {
        nodes: deriveNodesFromStates(consciousness),
        edges: deriveEdgesFromTransitions(consciousness),
        entryPoints: consciousness.entryPoints.map(ep => `node-${ep}`),
        exitPoints: consciousness.resolutionPoints.map(rp => `node-${rp}`)
      },
      initialState: createInitialAgentState(consciousness),
      consciousnessMapping: {
        workflowId: consciousness.id,
        stateMappings: createStateMappings(consciousness),
        transitionMappings: createTransitionMappings(consciousness),
        cittaOperationMappings: createOperationMappings(consciousness)
      },
      meta: {
        origins: {
          type: "consciousness",
          id: consciousness.id,
          purpose: consciousness.purpose
        },
        gunaAnalysis: analyzeConsciousnessGunas(consciousness),
        cittaDistribution: analyzeCittaDistribution(consciousness)
      }
    };
    
    // Add deployment configuration if specified in context
    if (context?.deployment) {
      agent.deployment = context.deployment;
    } else {
      // Default deployment configuration
      agent.deployment = {
        resources: {
          cpu: "1",
          memory: "2Gi"
        },
        scaling: {
          minInstances: 1,
          maxInstances: 3,
          metrics: {
            concurrentRequests: {
              target: 10
            }
          }
        },
        environment: {
          LANG_GRAPH_LOG_LEVEL: "info"
        },
        connections: []
      };
    }
    
    return agent;
  },
  {
    pure: false,
    fusible: false,
    cost: 8
  }
);

/**
 * Derive agent capabilities from a consciousness workflow
 */
function deriveCapabilitiesFromConsciousness(consciousness: ConsciousWorkflow): AgentCapability[] {
  const capabilities: AgentCapability[] = [];
  
  // All agents have basic capabilities
  capabilities.push(AgentCapability.REASONING);
  capabilities.push(AgentCapability.REFLECTION);
  
  // Check for retrieval capabilities (Manas operations)
  if (consciousness.manasOperations.some(op => op.type === 'perception')) {
    capabilities.push(AgentCapability.RETRIEVAL);
  }
  
  // Check for generation capabilities
  if (consciousness.buddhiOperations.some(op => 
    op.type === 'synthesis' || op.type === 'comprehension')
  ) {
    capabilities.push(AgentCapability.GENERATION);
  }
  
  // Check for planning capabilities
  if (consciousness.states.some(s => s.stateType === 'intention')) {
    capabilities.push(AgentCapability.PLANNING);
  }
  
  // Check for execution capabilities
  const hasExecutionStates = consciousness.transitions.some(t => 
    t.transitionType === 'intentional' && t.characteristics.freedom > 0.7
  );
  if (hasExecutionStates) {
    capabilities.push(AgentCapability.EXECUTION);
  }
  
  // Check for learning capabilities
  if (consciousness.states.some(s => s.stateType === 'reflection' && s.level === ConsciousnessLevel.INTUITIVE)) {
    capabilities.push(AgentCapability.LEARNING);
  }
  
  // Check for collaboration capabilities
  if (consciousness.ahamkaraOperations.some(op => op.type === 'differentiation')) {
    capabilities.push(AgentCapability.COLLABORATION);
  }
  
  return capabilities;
}

/**
 * Derive agent tools from consciousness operations
 */
function deriveToolsFromOperations(consciousness: ConsciousWorkflow): AgentTool[] {
  const tools: AgentTool[] = [];
  
  // Convert Buddhi operations to tools
  consciousness.buddhiOperations.forEach(operation => {
    tools.push(convertBuddhiOperationToTool(operation));
  });
  
  // Convert Ahamkara operations to tools
  consciousness.ahamkaraOperations.forEach(operation => {
    tools.push(convertAhamkaraOperationToTool(operation));
  });
  
  // Convert Manas operations to tools
  consciousness.manasOperations.forEach(operation => {
    tools.push(convertManasOperationToTool(operation));
  });
  
  return tools;
}

/**
 * Convert a Buddhi operation to an agent tool
 */
function convertBuddhiOperationToTool(operation: BuddhiOperation): AgentTool {
  return {
    id: `tool-${operation.id}`,
    name: `${capitalizeFirstLetter(operation.type)}`,
    description: `Buddhi operation for ${operation.type}`,
    signature: {
      inputs: operation.inputs.map(input => ({
        name: `state_${input}`,
        type: "any",
        description: `Input state: ${input}`,
        required: true
      })),
      output: {
        type: "any",
        description: `Result of ${operation.type} operation`
      }
    },
    implementation: `buddhi.operations.${operation.type}`,
    cittaOperation: {
      aspect: CittaAspect.BUDDHI,
      operationType: operation.type
    },
    meta: {
      wisdom: operation.wisdom,
      parameters: operation.parameters
    }
  };
}

/**
 * Convert an Ahamkara operation to an agent tool
 */
function convertAhamkaraOperationToTool(operation: AhamkaraOperation): AgentTool {
  return {
    id: `tool-${operation.id}`,
    name: `${capitalizeFirstLetter(operation.type)}`,
    description: `Ahamkara operation for ${operation.type}`,
    signature: {
      inputs: [
        {
          name: "self",
          type: "any",
          description: "Self-reference",
          required: true
        },
        {
          name: "entity",
          type: "any",
          description: "Entity to relate to self",
          required: true
        }
      ],
      output: {
        type: "any",
        description: `Result of ${operation.type} operation`
      }
    },
    implementation: `ahamkara.operations.${operation.type}`,
    cittaOperation: {
      aspect: CittaAspect.AHAMKARA,
      operationType: operation.type
    },
    meta: {
      identity: operation.identity,
      selfReference: operation.selfReference,
      entityReference: operation.entityReference
    }
  };
}

/**
 * Convert a Manas operation to an agent tool
 */
function convertManasOperationToTool(operation: ManasOperation): AgentTool {
  return {
    id: `tool-${operation.id}`,
    name: `${capitalizeFirstLetter(operation.type)}`,
    description: `Manas operation for ${operation.type}`,
    signature: {
      inputs: [
        ...(operation.sensoryInputs || []).map(input => ({
          name: `sensory_${input}`,
          type: "any",
          description: `Sensory input: ${input}`,
          required: true
        })),
        ...(operation.conceptualInputs || []).map(input => ({
          name: `concept_${input}`,
          type: "any",
          description: `Conceptual input: ${input}`,
          required: true
        }))
      ],
      output: {
        type: "any",
        description: `Result of ${operation.type} operation`
      }
    },
    implementation: `manas.operations.${operation.type}`,
    cittaOperation: {
      aspect: CittaAspect.MANAS,
      operationType: operation.type
    },
    meta: {
      processing: operation.processing
    }
  };
}

/**
 * Derive LangGraph nodes from consciousness states
 */
function deriveNodesFromStates(consciousness: ConsciousWorkflow): AgentNode[] {
  return consciousness.states.map(state => {
    // Determine node type based on state type and Citta aspect
    const nodeType = mapStateTypeToNodeType(state);
    
    // Create the node
    const node: AgentNode = {
      id: `node-${state.id}`,
      type: nodeType,
      config: {
        name: state.meaning,
        description: `State of consciousness: ${state.stateType}`,
        parameters: {
          cittaAspect: state.cittaAspect,
          predominantGuna: state.predominantGuna,
          level: state.level,
          qualities: state.qualities,
          gunaProportions: state.gunaProportions,
          content: state.content
        },
        consciousnessMapping: {
          stateId: state.id,
          mappingType: 'bidirectional'
        }
      },
      classPath: mapStateTypeToClassName(state)
    };
    
    // Add LLM configuration for nodes that need it
    if (nodeType === 'llm' || 
        state.cittaAspect === CittaAspect.BUDDHI || 
        state.stateType === 'concept') {
      node.config.llm = {
        model: "openai/gpt-4o",
        provider: "openai",
        temperature: mapGunaProportionsToTemperature(state.gunaProportions)
      };
    }
    
    // Add tool configuration for nodes that use tools
    if (nodeType === 'tool' || state.cittaAspect === CittaAspect.MANAS) {
      node.config.tool = {
        toolId: `tool-for-${state.id}` // Will be set properly later
      };
    }
    
    // Set requirements and provisions based on state type
    switch (state.stateType) {
      case 'perception':
        node.config.requires = ['input'];
        node.config.provides = ['percept'];
        break;
      case 'intention':
        node.config.requires = ['percept'];
        node.config.provides = ['intention'];
        break;
      case 'concept':
        node.config.requires = ['intention'];
        node.config.provides = ['concept'];
        break;
      case 'reflection':
        node.config.requires = ['concept'];
        node.config.provides = ['reflection'];
        break;
      case 'memory':
        node.config.requires = [];
        node.config.provides = ['memory'];
        break;
      case 'abstract':
        node.config.requires = ['concept'];
        node.config.provides = ['abstraction'];
        break;
    }
    
    return node;
  });
}

/**
 * Map a consciousness state to a LangGraph node type
 */
function mapStateTypeToNodeType(state: StateOfConsciousness): string {
  // First map based on Citta aspect
  switch (state.cittaAspect) {
    case CittaAspect.BUDDHI:
      return 'llm'; // Buddhi uses LLM for wisdom
    case CittaAspect.AHAMKARA:
      return 'router'; // Ahamkara routes between options
    case CittaAspect.MANAS:
      return state.stateType === 'perception' ? 'input' : 'tool'; // Manas processes inputs
  }
  
  // Then refine by state type
  switch (state.stateType) {
    case 'perception': return 'input';
    case 'intention': return 'router';
    case 'concept': return 'llm';
    case 'memory': return 'memory';
    case 'reflection': return 'output';
    case 'abstract': return 'tool';
    default: return 'generic';
  }
}

/**
 * Map a consciousness state to a LangGraph class name
 */
function mapStateTypeToClassName(state: StateOfConsciousness): string {
  const aspect = state.cittaAspect.toLowerCase();
  const stateType = state.stateType;
  
  return `tara.nodes.${aspect}.${capitalizeFirstLetter(stateType)}Node`;
}

/**
 * Derive LangGraph edges from consciousness transitions
 */
function deriveEdgesFromTransitions(consciousness: ConsciousWorkflow): AgentEdge[] {
  return consciousness.transitions.map(transition => ({
    source: `node-${transition.fromStateId}`,
    target: `node-${transition.toStateId}`,
    type: mapTransitionTypeToEdgeType(transition),
    conditions: transition.conditions?.map(condition => ({
      description: `${condition.evaluationType} condition`,
      expression: condition.expression
    })),
    config: {
      mapping: {
        // Default output-to-input mapping
        output: 'input'
      },
      weight: transition.characteristics.necessity,
      default: transition.characteristics.necessity > 0.8,
      consciousnessMapping: {
        fromStateId: transition.fromStateId,
        toStateId: transition.toStateId
      }
    }
  }));
}

/**
 * Map a consciousness transition type to an edge type
 */
function mapTransitionTypeToEdgeType(transition: ConsciousTransition): string {
  switch (transition.transitionType) {
    case 'causal': return 'data';
    case 'intentional': return 'flow';
    case 'associative': return 'association';
    case 'inferential': return 'inference';
    case 'dialectical': return 'dialectic';
    case 'transcendent': return 'transcend';
    default: return 'standard';
  }
}

/**
 * Create initial agent state from consciousness context
 */
function createInitialAgentState(consciousness: ConsciousWorkflow): Partial<AgentState> {
  const context = consciousness.context;
  
  return {
    memory: {
      working: {},
      longTerm: context.activeMemory.map(memory => ({
        key: memory.id,
        value: memory.content,
        importance: memory.accessibility,
        createdAt: new Date().toISOString(),
        accessCount: 0
      })),
      episodic: []
    },
    percepts: {},
    intentions: context.values.map(value => ({
      id: `intention-${value.name}`,
      goal: `Maximize ${value.name}`,
      priority: value.priority,
      active: value.priority > 0.7,
      progress: 0
    })),
    concepts: {},
    citta: {
      buddhi: {
        activeOperations: [],
        clarity: context.subject.gunaBalance.sattva
      },
      ahamkara: {
        identityFocus: context.subject.id,
        agency: context.subject.characteristics.autonomy || 0.8
      },
      manas: {
        attentionFocus: [],
        processingCapacity: 0.9
      }
    },
    gunaBalance: context.subject.gunaBalance,
    context: {
      temporality: context.situation.temporality,
      environment: context.situation.environment
    },
    status: 'idle',
    trace: []
  };
}

/**
 * Create state mappings between agent nodes and consciousness states
 */
function createStateMappings(consciousness: ConsciousWorkflow): Array<any> {
  return consciousness.states.map(state => ({
    nodeId: `node-${state.id}`,
    stateId: state.id,
    mappingType: 'bidirectional'
  }));
}

/**
 * Create transition mappings between agent edges and consciousness transitions
 */
function createTransitionMappings(consciousness: ConsciousWorkflow): Array<any> {
  return consciousness.transitions.map(transition => ({
    edgeId: `node-${transition.fromStateId}-node-${transition.toStateId}`,
    fromStateId: transition.fromStateId,
    toStateId: transition.toStateId
  }));
}

/**
 * Create mappings between agent tools and consciousness operations
 */
function createOperationMappings(consciousness: ConsciousWorkflow): Array<any> {
  const mappings: Array<any> = [];
  
  // Map Buddhi operations
  consciousness.buddhiOperations.forEach(operation => {
    mappings.push({
      operationType: 'buddhi',
      operationId: operation.id,
      toolId: `tool-${operation.id}`
    });
  });
  
  // Map Ahamkara operations
  consciousness.ahamkaraOperations.forEach(operation => {
    mappings.push({
      operationType: 'ahamkara',
      operationId: operation.id,
      toolId: `tool-${operation.id}`
    });
  });
  
  // Map Manas operations
  consciousness.manasOperations.forEach(operation => {
    mappings.push({
      operationType: 'manas',
      operationId: operation.id,
      toolId: `tool-${operation.id}`
    });
  });
  
  return mappings;
}

/**
 * Analyze the guna distribution across a consciousness workflow
 */
function analyzeConsciousnessGunas(consciousness: ConsciousWorkflow): any {
  const stateAnalysis = consciousness.states.reduce(
    (acc, state) => {
      acc.sattva += state.gunaProportions.sattva;
      acc.rajas += state.gunaProportions.rajas;
      acc.tamas += state.gunaProportions.tamas;
      acc.count += 1;
      return acc;
    },
    { sattva: 0, rajas: 0, tamas: 0, count: 0 }
  );
  
  return {
    average: {
      sattva: stateAnalysis.sattva / stateAnalysis.count,
      rajas: stateAnalysis.rajas / stateAnalysis.count,
      tamas: stateAnalysis.tamas / stateAnalysis.count
    },
    dominant: getDominantGuna(
      stateAnalysis.sattva / stateAnalysis.count,
      stateAnalysis.rajas / stateAnalysis.count,
      stateAnalysis.tamas / stateAnalysis.count
    )
  };
}

/**
 * Analyze the Citta aspect distribution across a consciousness workflow
 */
function analyzeCittaDistribution(consciousness: ConsciousWorkflow): any {
  const aspectCounts = consciousness.states.reduce(
    (acc, state) => {
      acc[state.cittaAspect] = (acc[state.cittaAspect] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  
  const total = consciousness.states.length;
  
  return {
    counts: aspectCounts,
    percentages: {
      buddhi: ((aspectCounts[CittaAspect.BUDDHI] || 0) / total) * 100,
      ahamkara: ((aspectCounts[CittaAspect.AHAMKARA] || 0) / total) * 100,
      manas: ((aspectCounts[CittaAspect.MANAS] || 0) / total) * 100
    },
    dominant: getDominantCittaAspect(aspectCounts)
  };
}

/**
 * Transform a task workflow directly to an agent
 */
export const TaskToAgentMorph = new SimpleMorph<CognitiveWorkflow, Agent>(
  "TaskToAgentMorph",
  (workflow, context) => {
    // First transform to consciousness
    const consciousnessMorph = new TaskToConsciousnessMorph();
    const consciousness = consciousnessMorph.transform(workflow, context);
    
    // Then transform to agent
    const agentMorph = new ConsciousnessToAgentMorph();
    return agentMorph.transform(consciousness, context);
  },
  {
    pure: false,
    fusible: false,
    cost: 15
  }
);

/**
 * Transform a property graph directly to an agent
 */
export const GraphToAgentMorph = new SimpleMorph<PropertyGraph, Agent>(
  "GraphToAgentMorph",
  (graph, context) => {
    // Chain morphisms: Graph -> Task -> Consciousness -> Agent
    const graphToWorkflowMorph = new GraphToWorkflowMorph();
    const taskToConsciousnessMorph = new TaskToConsciousnessMorph();
    const consciousnessToAgentMorph = new ConsciousnessToAgentMorph();
    
    const workflow = graphToWorkflowMorph.transform(graph, context);
    const consciousness = taskToConsciousnessMorph.transform(workflow, context);
    return consciousnessToAgentMorph.transform(consciousness, context);
  },
  {
    pure: false,
    fusible: false,
    cost: 20
  }
);

/**
 * Transform an agent configuration to LangGraph server configuration
 */
export const AgentToLangGraphServerMorph = new SimpleMorph<Agent, any>(
  "AgentToLangGraphServerMorph",
  (agent, context) => {
    return {
      agent_id: agent.id,
      name: agent.name,
      description: agent.description,
      model: {
        nodes: agent.workflow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          config: convertNodeConfigToLangGraphConfig(node.config),
          class_path: node.classPath
        })),
        edges: agent.workflow.edges.map(edge => ({
          source: edge.source,
          target: edge.target,
          type: edge.type,
          conditions: edge.conditions,
          config: edge.config
        })),
        entry_points: agent.workflow.entryPoints,
        exit_points: agent.workflow.exitPoints
      },
      tools: agent.tools.map(tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        signature: {
          inputs: tool.signature.inputs,
          output: tool.signature.output
        },
        implementation: tool.implementation,
        permissions: tool.permissions || []
      })),
      state_schema: {
        memory: {
          type: "object",
          properties: {
            working: { type: "object" },
            longTerm: { type: "array" },
            episodic: { type: "array" }
          }
        },
        percepts: { type: "object" },
        intentions: { type: "array" },
        concepts: { type: "object" },
        citta: { 
          type: "object",
          properties: {
            buddhi: { type: "object" },
            ahamkara: { type: "object" },
            manas: { type: "object" }
          }
        },
        gunaBalance: {
          type: "object",
          properties: {
            sattva: { type: "number" },
            rajas: { type: "number" },
            tamas: { type: "number" }
          }
        },
        context: { type: "object" },
        status: { type: "string" },
        trace: { type: "array" }
      },
      initial_state: agent.initialState,
      deployment: {
        resources: agent.deployment?.resources,
        scaling: agent.deployment?.scaling,
        environment: agent.deployment?.environment,
        connections: agent.deployment?.connections
      },
      execution: {
        timeout_seconds: 300,
        enable_tracing: true,
        max_steps: 100
      },
      api: {
        endpoints: [
          {
            path: "/invoke",
            method: "POST",
            description: "Invoke the agent with input",
            request_schema: {
              type: "object",
              properties: {
                input: { type: "object" },
                options: { type: "object" }
              },
              required: ["input"]
            },
            response_schema: {
              type: "object",
              properties: {
                output: { type: "object" },
                state: { type: "object" },
                trace: { type: "array" }
              }
            }
          },
          {
            path: "/state",
            method: "GET",
            description: "Get the current agent state",
            response_schema: {
              type: "object"
            }
          }
        ],
        cors: {
          allow_origins: ["*"],
          allow_methods: ["GET", "POST", "OPTIONS"],
          allow_headers: ["Content-Type", "Authorization"]
        }
      },
      observability: {
        logging: {
          level: "info",
          format: "json"
        },
        metrics: {
          enabled: true,
          collect_runtime_metrics: true
        }
      },
      security: {
        authentication: context?.security?.authentication || {
          type: "api_key",
          header_name: "x-api-key"
        },
        authorization: context?.security?.authorization || {
          type: "simple",
          roles: ["user", "admin"]
        }
      },
      consciousness_mapping: agent.consciousnessMapping
    };
  },
  {
    pure: true,
    fusible: false,
    cost: 3
  }
);

/**
 * Convert a node config to LangGraph server configuration
 */
function convertNodeConfigToLangGraphConfig(config: any): any {
  const langGraphConfig: any = {
    name: config.name,
    description: config.description,
    parameters: config.parameters,
    requires: config.requires,
    provides: config.provides
  };
  
  // Add LLM configuration
  if (config.llm) {
    langGraphConfig.llm = {
      model: config.llm.model,
      provider: config.llm.provider,
      temperature: config.llm.temperature,
      parameters: config.llm.parameters
    };
  }
  
  // Add tool configuration
  if (config.tool) {
    langGraphConfig.tool = {
      tool_id: config.tool.toolId
    };
  }
  
  // Add agent configuration
  if (config.agent) {
    langGraphConfig.agent = {
      agent_id: config.agent.agentId
    };
  }
  
  // Add function configuration
  if (config.function) {
    langGraphConfig.function = config.function;
  }
  
  return langGraphConfig;
}

/**
 * Map guna proportions to LLM temperature
 */
function mapGunaProportionsToTemperature(gunaProportions: any): number {
  // Higher rajas = higher temperature (more creativity)
  // Higher tamas = lower temperature (more deterministic)
  // Higher sattva = moderate temperature (balanced)
  
  const baseTemp = 0.7; // Default balanced temperature
  const rajasInfluence = gunaProportions.rajas * 0.3; // Rajas increases temperature
  const tamasInfluence = -gunaProportions.tamas * 0.3; // Tamas decreases temperature
  const sattvaInfluence = (gunaProportions.sattva - 0.5) * 0.1; // Sattva moderates
  
  const temperature = baseTemp + rajasInfluence + tamasInfluence + sattvaInfluence;
  
  // Clamp to valid temperature range
  return Math.max(0, Math.min(1, temperature));
}

/**
 * Get the dominant guna from proportions
 */
function getDominantGuna(sattva: number, rajas: number, tamas: number): Guna {
  if (sattva >= rajas && sattva >= tamas) return Guna.SATTVA;
  if (rajas >= sattva && rajas >= tamas) return Guna.RAJAS;
  return Guna.TAMAS;
}

/**
 * Get the dominant Citta aspect from counts
 */
function getDominantCittaAspect(counts: Record<string, number>): CittaAspect {
  const buddhi = counts[CittaAspect.BUDDHI] || 0;
  const ahamkara = counts[CittaAspect.AHAMKARA] || 0;
  const manas = counts[CittaAspect.MANAS] || 0;
  
  if (buddhi >= ahamkara && buddhi >= manas) return CittaAspect.BUDDHI;
  if (ahamkara >= buddhi && ahamkara >= manas) return CittaAspect.AHAMKARA;
  return CittaAspect.MANAS;
}

/**
 * Utility: Capitalize first letter of a string
 */
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * The complete set of Agent morphisms
 */
export const AgentMorphisms = {
  ConsciousnessToAgentMorph,
  TaskToAgentMorph,
  GraphToAgentMorph,
  AgentToLangGraphServerMorph
};

/**
 * Fake imports to prevent TypeScript errors
 * These would be properly imported in a real implementation
 */
declare const TaskToConsciousnessMorph: any;
declare const GraphToWorkflowMorph: any;
declare const FormToWorkflowMorph: any;

export default AgentMorphisms;