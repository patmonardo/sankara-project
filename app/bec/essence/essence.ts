import { NeoNode, createNeoNode } from '../../neo/node';
import { NeoEntityId } from '../../neo/dialectic';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Import subsystems
import { ReflectionSystem, Reflection, DeterminationOfReflection, Shine } from './reflection';
import { GroundSystem, Ground, AbsoluteGround } from './ground';

/**
 * Hegelian Essence System
 * 
 * A TypeScript implementation of Hegel's theory of Essence
 * from his Science of Logic, representing the second major division
 * of the Logic as the truth of Being, expressed through reflection and mediation.
 */

// =========================================================
// ESSENCE TYPES - The categories of essence
// =========================================================

export type EssenceCategory = 
  'essence-general' | 
  'simple-reference' | 
  'specifying-determination' | 
  'contradiction-essence';

export type EssenceGeneralType = 
  'truth-of-being' | 
  'mediated-knowledge' | 
  'reflection-process';

export type SimpleReferenceType = 
  'identity' | 
  'pure-self-reference' | 
  'essential-shine';

export type SpecifyingDeterminationType = 
  'difference' | 
  'diversity' | 
  'opposition';

export type ContradictionType = 
  'positive-negative-unity' | 
  'self-contradiction' | 
  'ground-emergence';

// =========================================================
// CHARACTERISTICS OF ESSENCE
// =========================================================

/**
 * Characteristic Interface - Qualities that characterize Essence
 */
export interface Characteristic {
  id: string;
  name: string;
  description: string;
}

/**
 * Create a characteristic
 */
export function createCharacteristic(
  name: string, 
  description: string
): Characteristic {
  return {
    id: `characteristic:${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    description
  };
}

// Predefined characteristics of Essence
export const TRUTH_OF_BEING = createCharacteristic(
  "Truth of Being",
  "The quality of being the deeper truth behind immediate being"
);

export const MEDIATED_KNOWLEDGE = createCharacteristic(
  "Mediated Knowledge",
  "Knowledge achieved through mediation rather than immediately"
);

export const REFLECTIVE_PROCESS = createCharacteristic(
  "Reflective Process",
  "The process of reflection central to essence"
);

export const SUBLATION = createCharacteristic(
  "Sublation",
  "The process of negating, preserving, and elevating a concept"
);

export const SELF_RELATION = createCharacteristic(
  "Self-Relation",
  "The quality of relating to itself rather than to another"
);

// =========================================================
// ESSENCE INTERFACES - Base types for forms of essence
// =========================================================

/**
 * Essence Interface - Base for all forms of essence
 */
export interface Essence {
  id: string;
  type: EssenceCategory;
  
  // BEC Structure
  being: {
    quality?: string;
    immediate: boolean;
    determinate: boolean;
  };
  essence: {
    reflective: boolean;
    appearance?: string;
    mediated: boolean;
  };
  concept: {
    universal?: string;
    particular?: string;
    individual?: string;
  };
  
  // Dialectical relations
  emergesFrom?: string;
  transitionsTo?: string;
  
  // Characteristics
  characteristics: Characteristic[];
  
  // Properties specific to essence
  transcendsBeing: boolean;
  involvesReflection: boolean;
  isMediated: boolean;
  
  // Description
  description: string;
}

// =========================================================
// ESSENCE GENERAL - The general concept of essence
// =========================================================

/**
 * EssenceGeneral - The general concept of essence
 */
export interface EssenceGeneral extends Essence {
  type: 'essence-general';
  subtype: EssenceGeneralType;
  
  // Properties specific to general essence
  relation: {
    toBeing: string;
    toReflection: string;
    toSelf: string;
  };
  
  process: {
    progressesThroughStages: boolean;
    resultsInGround: boolean;
  };
}

/**
 * Create Essence General
 */
export function createEssenceGeneral(
  subtype: EssenceGeneralType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): EssenceGeneral {
  const id = options.id || `essence:essence-general:${subtype}:${uuidv4()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'truth-of-being':
      quality = "truth behind appearance";
      customCharacteristics = [
        createCharacteristic("Underlying Reality", "The hidden truth behind immediate being"),
        createCharacteristic("Deepened Understanding", "A more profound understanding of being")
      ];
      description = "Essence as the truth of being, representing the deeper reality behind the immediate appearances of being.";
      transitionTarget = "essence:essence-general:mediated-knowledge";
      break;
      
    case 'mediated-knowledge':
      quality = "mediated knowing";
      customCharacteristics = [
        createCharacteristic("Non-Immediacy", "Knowledge not given immediately but through reflection"),
        createCharacteristic("Processual Understanding", "Understanding through a process rather than directly")
      ];
      description = "Essence as mediated knowledge, achieved not immediately but through a process of reflection and mediation.";
      transitionTarget = "essence:essence-general:reflection-process";
      break;
      
    case 'reflection-process':
      quality = "reflective movement";
      customCharacteristics = [
        createCharacteristic("Self-Referential Movement", "Movement that refers back to itself"),
        createCharacteristic("Internal Development", "Development occurring within itself")
      ];
      description = "Essence as reflective process, involving infinite self-contained movement within itself.";
      transitionTarget = "essence:simple-reference:identity";
      break;
  }
  
  return {
    id,
    type: 'essence-general',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: subtype,
      mediated: true
    },
    concept: {
      universal: 'essence',
      particular: 'essence-general',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "being:being-for-itself:repulsion-attraction:unity-of-forces",
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      TRUTH_OF_BEING,
      MEDIATED_KNOWLEDGE,
      REFLECTIVE_PROCESS,
      SUBLATION,
      SELF_RELATION,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Properties specific to essence
    transcendsBeing: true,
    involvesReflection: true,
    isMediated: true,
    
    // Properties specific to essence general
    relation: {
      toBeing: 'transcends',
      toReflection: 'involves',
      toSelf: 'self-determines'
    },
    
    process: {
      progressesThroughStages: true,
      resultsInGround: true
    },
    
    // Description
    description
  };
}

// =========================================================
// SIMPLE REFERENCE - The first stage of essence
// =========================================================

/**
 * SimpleReference - The first stage of essence
 */
export interface SimpleReference extends Essence {
  type: 'simple-reference';
  subtype: SimpleReferenceType;
  
  // Properties specific to simple reference
  identityRelation: {
    isPure: boolean;
    isSelfsame: boolean;
    containsNoOther: boolean;
  };
  
  movementType: {
    isImmediateIdentity: boolean;
    isSimpleRelation: boolean;
  };
}

/**
 * Create Simple Reference
 */
export function createSimpleReference(
  subtype: SimpleReferenceType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): SimpleReference {
  const id = options.id || `essence:simple-reference:${subtype}:${uuidv4()}`;
  
  // Create specific characteristics for simple reference
  const PURE_IDENTITY = createCharacteristic(
    "Pure Identity",
    "The state of being purely self-identical"
  );
  
  const SELF_SAMENESS = createCharacteristic(
    "Self-Sameness",
    "The quality of being the same as itself without reference to an other"
  );
  
  const IMMEDIATE_SELF_RELATION = createCharacteristic(
    "Immediate Self-Relation",
    "An immediate relation to self rather than mediated through another"
  );
  
  // Configure based on subtype
  let quality = "";
  let description = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'identity':
      quality = "pure identity";
      description = "Simple Reference as identity, representing the pure self-sameness of essence without reference to otherness.";
      transitionTarget = "essence:simple-reference:pure-self-reference";
      break;
      
    case 'pure-self-reference':
      quality = "pure self-relation";
      description = "Simple Reference as pure self-reference, where essence relates only to itself immediately.";
      transitionTarget = "essence:simple-reference:essential-shine";
      break;
      
    case 'essential-shine':
      quality = "essential shining";
      description = "Simple Reference as essential shine, where essence shines within itself, manifesting its pure identity.";
      transitionTarget = "essence:specifying-determination:difference";
      break;
  }
  
  return {
    id,
    type: 'simple-reference',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      immediate: subtype === 'identity',
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: `simple reference: ${subtype}`,
      mediated: subtype !== 'identity'
    },
    concept: {
      universal: 'essence',
      particular: 'simple-reference',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'identity' ? "essence:essence-general:reflection-process" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      TRUTH_OF_BEING,
      REFLECTIVE_PROCESS,
      SELF_RELATION,
      PURE_IDENTITY,
      SELF_SAMENESS,
      IMMEDIATE_SELF_RELATION,
      ...(options.characteristics || [])
    ],
    
    // Properties specific to essence
    transcendsBeing: true,
    involvesReflection: true,
    isMediated: subtype !== 'identity',
    
    // Properties specific to simple reference
    identityRelation: {
      isPure: true,
      isSelfsame: true,
      containsNoOther: true
    },
    
    movementType: {
      isImmediateIdentity: subtype === 'identity',
      isSimpleRelation: true
    },
    
    // Description
    description
  };
}

// =========================================================
// SPECIFYING DETERMINATION - The second stage of essence
// =========================================================

/**
 * SpecifyingDetermination - The second stage of essence
 */
export interface SpecifyingDetermination extends Essence {
  type: 'specifying-determination';
  subtype: SpecifyingDeterminationType;
  
  // Properties specific to specifying determination
  differenceRelation: {
    containsOther: boolean;
    isInternalDifference: boolean;
    hasNegativeReference: boolean;
  };
  
  developmentStage: {
    isSimpleDifference: boolean;
    isExternalDiversity: boolean;
    isInternalOpposition: boolean;
  };
}

/**
 * Create Specifying Determination
 */
export function createSpecifyingDetermination(
  subtype: SpecifyingDeterminationType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): SpecifyingDetermination {
  const id = options.id || `essence:specifying-determination:${subtype}:${uuidv4()}`;
  
  // Create specific characteristics for specifying determination
  const NEGATIVE_REFERENCE = createCharacteristic(
    "Negative Reference",
    "Reference that is negative or involves negation"
  );
  
  const INTERNAL_DIFFERENTIATION = createCharacteristic(
    "Internal Differentiation",
    "Differentiation that occurs within the concept itself"
  );
  
  const OTHER_REFERENCE = createCharacteristic(
    "Other Reference",
    "Reference to otherness or alterity"
  );
  
  // Configure based on subtype
  let quality = "";
  let description = "";
  let transitionTarget = "";
  let developmentStage = {
    isSimpleDifference: false,
    isExternalDiversity: false,
    isInternalOpposition: false
  };
  
  switch(subtype) {
    case 'difference':
      quality = "essential difference";
      description = "Specifying Determination as difference, representing the emergence of distinction within essence.";
      transitionTarget = "essence:specifying-determination:diversity";
      developmentStage = {
        isSimpleDifference: true,
        isExternalDiversity: false,
        isInternalOpposition: false
      };
      break;
      
    case 'diversity':
      quality = "essential diversity";
      description = "Specifying Determination as diversity, representing the state where differences appear as external to each other.";
      transitionTarget = "essence:specifying-determination:opposition";
      developmentStage = {
        isSimpleDifference: false,
        isExternalDiversity: true,
        isInternalOpposition: false
      };
      break;
      
    case 'opposition':
      quality = "essential opposition";
      description = "Specifying Determination as opposition, representing the state where differences are internally related as opposites.";
      transitionTarget = "essence:contradiction-essence:positive-negative-unity";
      developmentStage = {
        isSimpleDifference: false,
        isExternalDiversity: false,
        isInternalOpposition: true
      };
      break;
  }
  
  return {
    id,
    type: 'specifying-determination',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: `specifying determination: ${subtype}`,
      mediated: true
    },
    concept: {
      universal: 'essence',
      particular: 'specifying-determination',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'difference' ? "essence:simple-reference:essential-shine" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      TRUTH_OF_BEING,
      REFLECTIVE_PROCESS,
      NEGATIVE_REFERENCE,
      INTERNAL_DIFFERENTIATION,
      OTHER_REFERENCE,
      ...(options.characteristics || [])
    ],
    
    // Properties specific to essence
    transcendsBeing: true,
    involvesReflection: true,
    isMediated: true,
    
    // Properties specific to specifying determination
    differenceRelation: {
      containsOther: true,
      isInternalDifference: subtype !== 'diversity',
      hasNegativeReference: true
    },
    
    developmentStage,
    
    // Description
    description
  };
}

// =========================================================
// CONTRADICTION - The third stage of essence
// =========================================================

/**
 * ContradictionEssence - The third stage of essence
 */
export interface ContradictionEssence extends Essence {
  type: 'contradiction-essence';
  subtype: ContradictionType;
  
  // Properties specific to contradiction
  contradictionRelation: {
    positiveNegativeUnity: boolean;
    selfContradicting: boolean;
    immanentCollapse: boolean;
  };
  
  resolution: {
    resolvesToGround: boolean;
    completelyMediated: boolean;
  };
}

/**
 * Create Contradiction Essence
 */
export function createContradictionEssence(
  subtype: ContradictionType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): ContradictionEssence {
  const id = options.id || `essence:contradiction-essence:${subtype}:${uuidv4()}`;
  
  // Create specific characteristics for contradiction
  const POSITIVE_NEGATIVE_UNITY = createCharacteristic(
    "Positive-Negative Unity",
    "The unity of positive and negative determinations"
  );
  
  const SELF_CONTRADICTION = createCharacteristic(
    "Self-Contradiction",
    "The state of contradicting oneself internally"
  );
  
  const GROUND_EMERGENCE = createCharacteristic(
    "Ground Emergence",
    "The emergence of ground from contradiction"
  );
  
  // Configure based on subtype
  let quality = "";
  let description = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'positive-negative-unity':
      quality = "positive-negative unity";
      description = "Contradiction as positive-negative unity, representing the unity of opposites within essence.";
      transitionTarget = "essence:contradiction-essence:self-contradiction";
      break;
      
    case 'self-contradiction':
      quality = "self-contradicting essence";
      description = "Contradiction as self-contradiction, representing the state where essence contradicts itself internally.";
      transitionTarget = "essence:contradiction-essence:ground-emergence";
      break;
      
    case 'ground-emergence':
      quality = "ground-emerging essence";
      description = "Contradiction as ground-emergence, representing the state where contradiction resolves into ground.";
      transitionTarget = "ground:absolute-ground:form-matter";
      break;
  }
  
  return {
    id,
    type: 'contradiction-essence',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: `contradiction: ${subtype}`,
      mediated: true
    },
    concept: {
      universal: 'essence',
      particular: 'contradiction-essence',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'positive-negative-unity' ? "essence:specifying-determination:opposition" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      TRUTH_OF_BEING,
      REFLECTIVE_PROCESS,
      POSITIVE_NEGATIVE_UNITY,
      SELF_CONTRADICTION,
      GROUND_EMERGENCE,
      ...(options.characteristics || [])
    ],
    
    // Properties specific to essence
    transcendsBeing: true,
    involvesReflection: true,
    isMediated: true,
    
    // Properties specific to contradiction
    contradictionRelation: {
      positiveNegativeUnity: true,
      selfContradicting: subtype === 'self-contradiction' || subtype === 'ground-emergence',
      immanentCollapse: subtype === 'ground-emergence'
    },
    
    resolution: {
      resolvesToGround: subtype === 'ground-emergence',
      completelyMediated: true
    },
    
    // Description
    description
  };
}

// =========================================================
// CIT-CITI-CITTA - Special Essences (Truth of Being Categories)
// =========================================================

/**
 * Cit - Truth of Being
 */
export interface Cit extends Essence {
  type: 'essence-general';
  
  // Properties specific to Cit
  truthOf: string; // "being"
  
  essentialQuality: {
    consciousness: boolean;
    awareness: boolean;
  };
}

/**
 * Create Cit
 */
export function createCit(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): Cit {
  const id = options.id || `essence:cit:${uuidv4()}`;
  
  // Create specific characteristics for Cit
  const CONSCIOUSNESS = createCharacteristic(
    "Consciousness",
    "The quality of awareness or sentience"
  );
  
  const BEING_TRUTH = createCharacteristic(
    "Being's Truth",
    "The essential truth underlying the immediacy of being"
  );
  
  return {
    id,
    type: 'essence-general',
    
    // BEC Structure
    being: {
      quality: "conscious essence",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "consciousness",
      mediated: true
    },
    concept: {
      universal: 'essence',
      particular: 'cit',
      individual: 'consciousness-truth'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "being",
    transitionsTo: "essence:citi",
    
    // Characteristics
    characteristics: [
      TRUTH_OF_BEING,
      CONSCIOUSNESS,
      BEING_TRUTH,
      ...(options.characteristics || [])
    ],
    
    // Properties specific to essence
    transcendsBeing: true,
    involvesReflection: true,
    isMediated: true,
    
    // Properties specific to Cit
    truthOf: "being",
    
    essentialQuality: {
      consciousness: true,
      awareness: true
    },
    
    // Description
    description: "Cit as the conscious essence that is the truth of being, representing the awareness underlying immediate existence."
  };
}

/**
 * Citi - Truth of Nothing
 */
export interface Citi extends Essence {
  type: 'essence-general';
  
  // Properties specific to Citi
  truthOf: string; // "nothing"
  
  essentialQuality: {
    intelligence: boolean;
    discernment: boolean;
  };
}

/**
 * Create Citi
 */
export function createCiti(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): Citi {
  const id = options.id || `essence:citi:${uuidv4()}`;
  
  // Create specific characteristics for Citi
  const INTELLIGENCE = createCharacteristic(
    "Intelligence",
    "The quality of understanding or discernment"
  );
  
  const NOTHING_TRUTH = createCharacteristic(
    "Nothing's Truth",
    "The essential truth underlying the emptiness of nothing"
  );
  
  return {
    id,
    type: 'essence-general',
    
    // BEC Structure
    being: {
      quality: "intelligent essence",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "intelligence",
      mediated: true
    },
    concept: {
      universal: 'essence',
      particular: 'citi',
      individual: 'intelligence-truth'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "essence:cit",
    transitionsTo: "essence:citta",
    
    // Characteristics
    characteristics: [
      TRUTH_OF_BEING,
      INTELLIGENCE,
      NOTHING_TRUTH,
      ...(options.characteristics || [])
    ],
    
    // Properties specific to essence
    transcendsBeing: true,
    involvesReflection: true,
    isMediated: true,
    
    // Properties specific to Citi
    truthOf: "nothing",
    
    essentialQuality: {
      intelligence: true,
      discernment: true
    },
    
    // Description
    description: "Citi as the intelligent essence that is the truth of nothing, representing the discernment that differentiates within emptiness."
  };
}

/**
 * Citta - Truth of Becoming
 */
export interface Citta extends Essence {
  type: 'essence-general';
  
  // Properties specific to Citta
  truthOf: string; // "becoming"
  
  essentialQuality: {
    mindfulness: boolean;
    intentionality: boolean;
  };
}

/**
 * Create Citta
 */
export function createCitta(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): Citta {
  const id = options.id || `essence:citta:${uuidv4()}`;
  
  // Create specific characteristics for Citta
  const MINDFULNESS = createCharacteristic(
    "Mindfulness",
    "The quality of attentive awareness"
  );
  
  const BECOMING_TRUTH = createCharacteristic(
    "Becoming's Truth",
    "The essential truth underlying the process of becoming"
  );
  
  return {
    id,
    type: 'essence-general',
    
    // BEC Structure
    being: {
      quality: "mindful essence",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "mindfulness",
      mediated: true
    },
    concept: {
      universal: 'essence',
      particular: 'citta',
      individual: 'mindfulness-truth'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "essence:citi",
    transitionsTo: "essence:essence-general:truth-of-being",
    
    // Characteristics
    characteristics: [
      TRUTH_OF_BEING,
      MINDFULNESS,
      BECOMING_TRUTH,
      ...(options.characteristics || [])
    ],
    
    // Properties specific to essence
    transcendsBeing: true,
    involvesReflection: true,
    isMediated: true,
    
    // Properties specific to Citta
    truthOf: "becoming",
    
    essentialQuality: {
      mindfulness: true,
      intentionality: true
    },
    
    // Description
    description: "Citta as the mindful essence that is the truth of becoming, representing the intentional awareness underlying processes of change."
  };
}

// =========================================================
// ESSENCE SYSTEM - Core functionality
// =========================================================

/**
 * Essence System
 * 
 * Main class that provides functionality for working with
 * Hegelian essence categories in the BEC ecosystem
 */
export class EssenceSystem extends EventEmitter {
  private essences: Map<string, Essence> = new Map();
  private reflectionSystem: ReflectionSystem;
  private groundSystem: GroundSystem;
  
  constructor() {
    super();
    this.reflectionSystem = ReflectionSystem.getInstance();
    this.groundSystem = GroundSystem.getInstance();
  }
  
  /**
   * Create an essence based on type
   */
  createEssence(
    type: EssenceCategory,
    subtype: EssenceGeneralType | SimpleReferenceType | SpecifyingDeterminationType | ContradictionType,
    options: any = {}
  ): Essence {
    let essence: Essence;
    
    // Create essence based on type
    if (type === 'essence-general') {
      essence = createEssenceGeneral(subtype as EssenceGeneralType, options);
    } else if (type === 'simple-reference') {
      essence = createSimpleReference(subtype as SimpleReferenceType, options);
    } else if (type === 'specifying-determination') {
      essence = createSpecifyingDetermination(subtype as SpecifyingDeterminationType, options);
    } else if (type === 'contradiction-essence') {
      essence = createContradictionEssence(subtype as ContradictionType, options);
    } else {
      throw new Error(`Invalid essence type: ${type}`);
    }
    
    // Store essence
    this.essences.set(essence.id, essence);
    
    // Emit event
    this.emit('essence:created', { essence });
    
    return essence;
  }
  
  /**
   * Create a Cit-Citi-Citta essence
   */
  createTranscendentalEssence(
    type: 'cit' | 'citi' | 'citta',
    options: any = {}
  ): Cit | Citi | Citta {
    let essence: Cit | Citi | Citta;
    
    // Create essence based on type
    if (type === 'cit') {
      essence = createCit(options);
    } else if (type === 'citi') {
      essence = createCiti(options);
    } else if (type === 'citta') {
      essence = createCitta(options);
    } else {
      throw new Error(`Invalid transcendental essence type: ${type}`);
    }
    
    // Store essence
    this.essences.set(essence.id, essence as Essence);
    
    // Emit event
    this.emit('essence:created', { essence });
    
    return essence;
  }
  
  /**
   * Get essence by ID
   */
  getEssence(id: string): Essence | undefined {
    return this.essences.get(id);
  }
  
  /**
   * Convert essence to Neo node
   */
  essenceToNode(essence: Essence): NeoNode {
    let properties: any = {
      description: essence.description,
      characteristics: essence.characteristics.map(c => c.name),
      transcendsBeing: essence.transcendsBeing,
      involvesReflection: essence.involvesReflection,
      isMediated: essence.isMediated
    };
    
    // Add type-specific properties
    if (essence.type === 'essence-general') {
      if ('truthOf' in essence) {
        // Handle Cit-Citi-Citta
        if ('essentialQuality' in essence) {
          const transcendentalEssence = essence as (Cit | Citi | Citta);
          properties = {
            ...properties,
            truthOf: transcendentalEssence.truthOf,
            essentialQuality: transcendentalEssence.essentialQuality
          };
        }
      } else {
        // Handle regular EssenceGeneral
        const essenceGeneral = essence as EssenceGeneral;
        properties = {
          ...properties,
          relation: essenceGeneral.relation,
          process: essenceGeneral.process
        };
      }
    } else if (essence.type === 'simple-reference') {
      const simpleReference = essence as SimpleReference;
      properties = {
        ...properties,
        identityRelation: simpleReference.identityRelation,
        movementType: simpleReference.movementType
      };
    } else if (essence.type === 'specifying-determination') {
      const specifyingDetermination = essence as SpecifyingDetermination;
      properties = {
        ...properties,
        differenceRelation: specifyingDetermination.differenceRelation,
        developmentStage: specifyingDetermination.developmentStage
      };
    } else if (essence.type === 'contradiction-essence') {
      const contradictionEssence = essence as ContradictionEssence;
      properties = {
        ...properties,
        contradictionRelation: contradictionEssence.contradictionRelation,
        resolution: contradictionEssence.resolution
      };
    }
    
    return createNeoNode({
      id: essence.id,
      type: `essence:${essence.type}${'subtype' in essence ? `:${(essence as any).subtype}` : ''}`,
      being: essence.being,
      essence: essence.essence,
      concept: essence.concept,
      properties,
      metadata: {
        emergesFrom: essence.emergesFrom,
        transitionsTo: essence.transitionsTo
      }
    });
  }
  
  /**
   * Develop essence to next category in dialectical progression
   */
  developEssence(essence: Essence): Essence | Ground | Reflection | null {
    if (!essence.transitionsTo) {
      return null;
    }
    
    const [category, type, subtype] = essence.transitionsTo.split(':');
    
    // If transitions to another system
    if (category === 'ground') {
      return this.groundSystem.createAbsoluteGround(subtype as any, { emergesFrom: essence.id });
    } else if (category === 'reflection') {
      // Implement if needed
      return null;
    } else if (category !== 'essence') {
      return null;
    }
    
    // Create the next essence in the dialectical progression
    if (type === 'essence-general') {
      return this.createEssence(
        type as EssenceCategory,
        subtype as EssenceGeneralType,
        { emergesFrom: essence.id }
      );
    } else if (type === 'simple-reference') {
      return this.createEssence(
        type as EssenceCategory,
        subtype as SimpleReferenceType,
        { emergesFrom: essence.id }
      );
    } else if (type === 'specifying-determination') {
      return this.createEssence(
        type as EssenceCategory,
        subtype as SpecifyingDeterminationType,
        { emergesFrom: essence.id }
      );
    } else if (type === 'contradiction-essence') {
      return this.createEssence(
        type as EssenceCategory,
        subtype as ContradictionType,
        { emergesFrom: essence.id }
      );
    } else if (type === 'citi') {
      return this.createTranscendentalEssence('citi', { emergesFrom: essence.id });
    } else if (type === 'citta') {
      return this.createTranscendentalEssence('citta', { emergesFrom: essence.id });
    }
    
    return null;
  }
  
  /**
   * Create complete dialectical progression of essence
   */
  createEssenceProgression(): Essence[] {
    const progression: Essence[] = [];
    
    // Start with essence general
    let current = this.createEssence('essence-general', 'truth-of-being');
    progression.push(current);
    
    // Develop through all forms
    while (current) {
      const next = this.developEssence(current);
      if (!next || next.type === 'absolute-ground') break;
      
      progression.push(next as Essence);
      current = next as Essence;
    }
    
    return progression;
  }
  
  /**
   * Create Cit-Citi-Citta triad
   */
  createTranscendentalTriad(): [Cit, Citi, Citta] {
    const cit = this.createTranscendentalEssence('cit') as Cit;
    const citi = this.createTranscendentalEssence('citi', { emergesFrom: cit.id }) as Citi;
    const citta = this.createTranscendentalEssence('citta', { emergesFrom: citi.id }) as Citta;
    
    return [cit, citi, citta];
  }
  
  /**
   * Process an entity through the essence system
   */
  processEntity(entityId: string): Promise<NeoNode> {
    return new Promise(async (resolve, reject) => {
      try {
        // First process through reflection
        const reflectionResult = await this.reflectionSystem.processEntity(entityId);
        
        // Then process through ground
        const groundResult = await this.groundSystem.processEntity(entityId, reflectionResult);
        
        // Create the essence progression
        const essenceProgression = this.createEssenceProgression();
        
        // Connect to the entity
        const firstEssence = essenceProgression[0];
        firstEssence.emergesFrom = entityId;
        
        // The final result is the ground result
        const resultNode = groundResult;
        
        // Emit completion event
        this.emit('essence:entity.processed', { 
          entityId,
          result: resultNode,
          essences: essenceProgression
        });
        
        resolve(resultNode);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Clear all essences
   */
  clear(): void {
    this.essences.clear();
    this.reflectionSystem.clear();
    this.groundSystem.clear();
  }
  
  /**
   * Get instance of EssenceSystem (singleton)
   */
  static getInstance(): EssenceSystem {
    if (!EssenceSystem.instance) {
      EssenceSystem.instance = new EssenceSystem();
    }
    return EssenceSystem.instance;
  }
  
  private static instance: EssenceSystem;
}

/**
 * Export singleton instance
 */
export const essenceSystem = EssenceSystem.getInstance();

export default essenceSystem;