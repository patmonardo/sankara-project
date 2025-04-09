import { NeoNode, createNeoNode } from '../../neo/node';
import { NeoEntityId } from '../../neo/dialectic';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hegelian Reflection System
 * 
 * A TypeScript implementation of Hegel's theory of Reflection
 * from his Science of Logic, representing the self-referential 
 * determinations of Essence and their dialectical development.
 */

// =========================================================
// REFLECTION TYPES - The categories of reflection
// =========================================================

export type ReflectionCategory = 
  'reflection-general' |
  'positing-reflection' |
  'external-reflection' |
  'determining-reflection';

export type DeterminationOfReflectionType =
  'identity' |
  'difference' |
  'diversity' |
  'opposition' |
  'contradiction';

export type ShineType =
  'immediate-non-existence' |
  'reflected-immediacy' |
  'negative-positedness';

// =========================================================
// CHARACTERISTICS OF REFLECTION
// =========================================================

/**
 * Characteristic Interface - Qualities that characterize Reflection
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

// Predefined characteristics of Reflection
export const SELF_REFERENCE = createCharacteristic(
  "Self-Reference",
  "The movement of reflection referring back to itself"
);

export const ABSOLUTE_MEDIATION = createCharacteristic(
  "Absolute Mediation",
  "The process of mediation that is absolute within itself"
);

export const NEGATION_OF_NEGATION = createCharacteristic(
  "Negation of Negation",
  "The double negation process central to reflection"
);

export const ESSENCE_SHINING = createCharacteristic(
  "Essence Shining",
  "The process of essence shining within itself"
);

export const INFINITE_MOVEMENT = createCharacteristic(
  "Infinite Movement",
  "The infinite self-contained movement within reflection"
);

// =========================================================
// REFLECTION INTERFACES - Base types for forms of reflection
// =========================================================

/**
 * Reflection Interface - Base for all forms of reflection
 */
export interface Reflection {
  id: string;
  type: ReflectionCategory;
  
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
  
  // Properties specific to reflection
  isInfiniteMovement: boolean;
  isSelfReferring: boolean;
  isAbsoluteMediation: boolean;
  
  // Description
  description: string;
}

/**
 * Shine - The manifestation of being within essence
 */
export interface Shine {
  id: string;
  type: ShineType;
  
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
  
  // Relations
  existsWithin: string; // Reference to essence
  
  // Characteristic properties
  isNothingness: boolean;
  isNegative: boolean;
  isPosited: boolean;
  
  // Description
  description: string;
}

/**
 * Determination of Reflection - The specific determinations
 * that emerge through reflection
 */
export interface DeterminationOfReflection {
  id: string;
  type: DeterminationOfReflectionType;
  
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
  
  // Properties specific to determinations of reflection
  isSelfSubsistent: boolean;
  isReflectedDetermination: boolean;
  hasOpposition?: boolean;
  
  // Description
  description: string;
}

// =========================================================
// REFLECTION GENERAL - Overarching reflection concept
// =========================================================

/**
 * ReflectionGeneral - The general concept of reflection
 */
export interface ReflectionGeneral extends Reflection {
  type: 'reflection-general';
  
  // Properties specific to general reflection
  containsShine: boolean;
  isEssenceSelfMovement: boolean;
}

/**
 * Create Reflection General
 */
export function createReflectionGeneral(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): ReflectionGeneral {
  const id = options.id || `reflection:reflection-general:${uuidv4()}`;
  
  return {
    id,
    type: 'reflection-general',
    
    // BEC Structure
    being: {
      quality: "infinite movement",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "essence self-relation",
      mediated: true
    },
    concept: {
      universal: "reflection",
      particular: "general reflection",
      individual: "essence self-movement"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "essence:shine",
    transitionsTo: "reflection:positing-reflection",
    
    // Characteristics
    characteristics: options.characteristics || [
      SELF_REFERENCE,
      ABSOLUTE_MEDIATION,
      NEGATION_OF_NEGATION,
      ESSENCE_SHINING,
      INFINITE_MOVEMENT
    ],
    
    // Properties specific to reflection
    isInfiniteMovement: true,
    isSelfReferring: true,
    isAbsoluteMediation: true,
    
    // Properties specific to general reflection
    containsShine: true,
    isEssenceSelfMovement: true,
    
    // Description
    description: "The process of essence shining within itself, characterized by self-reference, absolute mediation, and infinite movement."
  };
}

// =========================================================
// POSITING REFLECTION - First form of reflection
// =========================================================

/**
 * PositingReflection - The first specific form of reflection
 */
export interface PositingReflection extends Reflection {
  type: 'positing-reflection';
  
  // Properties specific to positing reflection
  movement: {
    fromNothingToNothing: boolean;
    selfCoincidingNegation: boolean;
    immediacyThroughMediation: boolean;
  };
}

/**
 * Create Positing Reflection
 */
export function createPositingReflection(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): PositingReflection {
  const id = options.id || `reflection:positing-reflection:${uuidv4()}`;
  
  // Specific characteristics of positing reflection
  const NOTHING_TO_NOTHING_MOVEMENT = createCharacteristic(
    "Nothing-to-Nothing Movement",
    "The characteristic movement from nothing to nothing"
  );
  
  const SELF_COINCIDING_NEGATION = createCharacteristic(
    "Self-Coinciding Negation",
    "Negation that coincides with itself"
  );
  
  const IMMEDIACY_THROUGH_MEDIATION = createCharacteristic(
    "Immediacy Through Mediation",
    "The achievement of immediacy through the process of mediation"
  );
  
  return {
    id,
    type: 'positing-reflection',
    
    // BEC Structure
    being: {
      quality: "self-coinciding negativity",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "positing reflection",
      mediated: true
    },
    concept: {
      universal: "reflection",
      particular: "positing reflection",
      individual: "self-negating negativity"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "reflection:reflection-general",
    transitionsTo: "reflection:external-reflection",
    
    // Characteristics
    characteristics: [
      ...(options.characteristics || []),
      SELF_REFERENCE,
      NEGATION_OF_NEGATION,
      NOTHING_TO_NOTHING_MOVEMENT,
      SELF_COINCIDING_NEGATION,
      IMMEDIACY_THROUGH_MEDIATION
    ],
    
    // Properties specific to reflection
    isInfiniteMovement: true,
    isSelfReferring: true,
    isAbsoluteMediation: true,
    
    // Properties specific to positing reflection
    movement: {
      fromNothingToNothing: true,
      selfCoincidingNegation: true,
      immediacyThroughMediation: true
    },
    
    // Description
    description: "Positing Reflection as the movement from nothing to nothing, where negation coincides with itself, resulting in a simple equality with itself achieved through mediation."
  };
}

// =========================================================
// EXTERNAL REFLECTION - Second form of reflection
// =========================================================

/**
 * ExternalReflection - The second specific form of reflection
 */
export interface ExternalReflection extends Reflection {
  type: 'external-reflection';
  
  // Properties specific to external reflection
  presupposition: {
    sublatedPresupposition: boolean;
    immediateStartingPoint: boolean;
    doubledRelation: boolean;
  };
}

/**
 * Create External Reflection
 */
export function createExternalReflection(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): ExternalReflection {
  const id = options.id || `reflection:external-reflection:${uuidv4()}`;
  
  // Specific characteristics of external reflection
  const PRESUPPOSITION = createCharacteristic(
    "Presupposition",
    "The presupposition of something immediate that is then sublated"
  );
  
  const DOUBLED_RELATION = createCharacteristic(
    "Doubled Relation",
    "The doubling of relation between presupposition and negative self-reference"
  );
  
  const EXTERNALITY = createCharacteristic(
    "Externality",
    "The quality of being external or related to apparent otherness"
  );
  
  return {
    id,
    type: 'external-reflection',
    
    // BEC Structure
    being: {
      quality: "external relation",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "external reflection",
      mediated: true
    },
    concept: {
      universal: "reflection",
      particular: "external reflection",
      individual: "presupposing reflection"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "reflection:positing-reflection",
    transitionsTo: "reflection:determining-reflection",
    
    // Characteristics
    characteristics: [
      ...(options.characteristics || []),
      SELF_REFERENCE,
      ABSOLUTE_MEDIATION,
      PRESUPPOSITION,
      DOUBLED_RELATION,
      EXTERNALITY
    ],
    
    // Properties specific to reflection
    isInfiniteMovement: true,
    isSelfReferring: true,
    isAbsoluteMediation: true,
    
    // Properties specific to external reflection
    presupposition: {
      sublatedPresupposition: true,
      immediateStartingPoint: true,
      doubledRelation: true
    },
    
    // Description
    description: "External Reflection as the form that presupposes itself as sublated and relates to an apparent externality or otherness, involving a doubling of presupposition and negative self-reference."
  };
}

// =========================================================
// DETERMINING REFLECTION - Third form of reflection
// =========================================================

/**
 * DeterminingReflection - The third specific form of reflection
 */
export interface DeterminingReflection extends Reflection {
  type: 'determining-reflection';
  
  // Properties specific to determining reflection
  unity: {
    ofPositingAndExternal: boolean;
    producesDeterminations: boolean;
    containsPositionAndPresupposition: boolean;
  };
}

/**
 * Create Determining Reflection
 */
export function createDeterminingReflection(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): DeterminingReflection {
  const id = options.id || `reflection:determining-reflection:${uuidv4()}`;
  
  // Specific characteristics of determining reflection
  const UNITY_OF_REFLECTIONS = createCharacteristic(
    "Unity of Reflections",
    "The unity of positing and external reflection"
  );
  
  const DETERMINATION_PRODUCTION = createCharacteristic(
    "Determination Production",
    "The production of determinations through unified reflection"
  );
  
  const CONCRETE_TOTALITY = createCharacteristic(
    "Concrete Totality",
    "Reflection as a concrete totality containing both positing and presupposition"
  );
  
  return {
    id,
    type: 'determining-reflection',
    
    // BEC Structure
    being: {
      quality: "determinative movement",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "determining reflection",
      mediated: true
    },
    concept: {
      universal: "reflection",
      particular: "determining reflection",
      individual: "reflected determination"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "reflection:external-reflection",
    transitionsTo: "essence:determination-of-reflection:identity",
    
    // Characteristics
    characteristics: [
      ...(options.characteristics || []),
      SELF_REFERENCE,
      ABSOLUTE_MEDIATION,
      NEGATION_OF_NEGATION,
      UNITY_OF_REFLECTIONS,
      DETERMINATION_PRODUCTION,
      CONCRETE_TOTALITY
    ],
    
    // Properties specific to reflection
    isInfiniteMovement: true,
    isSelfReferring: true,
    isAbsoluteMediation: true,
    
    // Properties specific to determining reflection
    unity: {
      ofPositingAndExternal: true,
      producesDeterminations: true,
      containsPositionAndPresupposition: true
    },
    
    // Description
    description: "Determining Reflection as the unity of positing and external reflection, containing both positing and presupposition moments, and producing determinations of reflection through this unity."
  };
}

// =========================================================
// SHINE - The manifestation of being within essence
// =========================================================

/**
 * Create Shine
 */
export function createShine(
  type: ShineType,
  options: {
    id?: string;
    essenceId?: string;
    isNothingness?: boolean;
    isNegative?: boolean;
    isPosited?: boolean;
  } = {}
): Shine {
  const id = options.id || `shine:${type}:${uuidv4()}`;
  
  let quality = "";
  let description = "";
  
  switch(type) {
    case 'immediate-non-existence':
      quality = "non-existent immediacy";
      description = "Shine as immediate non-existence, the nothingness of being within essence.";
      break;
      
    case 'reflected-immediacy':
      quality = "reflected immediacy";
      description = "Shine as reflected immediacy, the form of immediacy that is reflected and mediated through negation.";
      break;
      
    case 'negative-positedness':
      quality = "negative positedness";
      description = "Shine as negative positedness, the negative posited as negative within essence.";
      break;
  }
  
  return {
    id,
    type,
    
    // BEC Structure
    being: {
      quality,
      immediate: type === 'immediate-non-existence',
      determinate: false
    },
    essence: {
      reflective: type !== 'immediate-non-existence',
      appearance: type,
      mediated: type !== 'immediate-non-existence'
    },
    
    // Relations
    existsWithin: options.essenceId || "essence:general",
    
    // Characteristic properties
    isNothingness: options.isNothingness !== undefined ? options.isNothingness : true,
    isNegative: options.isNegative !== undefined ? options.isNegative : true,
    isPosited: options.isPosited !== undefined ? options.isPosited : true,
    
    // Description
    description
  };
}

// =========================================================
// DETERMINATIONS OF REFLECTION - Specific determinations
// =========================================================

/**
 * Create Identity - The first determination of reflection
 */
export function createIdentity(options: {
  id?: string;
  emergesFrom?: string;
} = {}): DeterminationOfReflection {
  const id = options.id || `determination:identity:${uuidv4()}`;
  
  return {
    id,
    type: 'identity',
    
    // BEC Structure
    being: {
      quality: "simple self-equality",
      immediate: true,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "identity",
      mediated: true
    },
    concept: {
      universal: "determination of reflection",
      particular: "identity",
      individual: "pure self-production"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "reflection:determining-reflection",
    transitionsTo: "essence:determination-of-reflection:difference",
    
    // Properties specific to determinations of reflection
    isSelfSubsistent: true,
    isReflectedDetermination: true,
    hasOpposition: false,
    
    // Description
    description: "Identity as the immediacy of reflection, characterized by pure self-production and essential self-sameness, representing simple negativity of being in itself."
  };
}

/**
 * Create Difference - The second determination of reflection
 */
export function createDifference(options: {
  id?: string;
  emergesFrom?: string;
} = {}): DeterminationOfReflection {
  const id = options.id || `determination:difference:${uuidv4()}`;
  
  return {
    id,
    type: 'difference',
    
    // BEC Structure
    being: {
      quality: "absolute difference",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "difference",
      mediated: true
    },
    concept: {
      universal: "determination of reflection",
      particular: "difference",
      individual: "not in A and not-A"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "essence:determination-of-reflection:identity",
    transitionsTo: "essence:determination-of-reflection:diversity",
    
    // Properties specific to determinations of reflection
    isSelfSubsistent: true,
    isReflectedDetermination: true,
    hasOpposition: false,
    
    // Description
    description: "Absolute Difference as the negativity that reflection possesses in itself, an essential moment of identity, representing difference in and for itself."
  };
}

/**
 * Create Diversity - The third determination of reflection
 */
export function createDiversity(options: {
  id?: string;
  emergesFrom?: string;
} = {}): DeterminationOfReflection {
  const id = options.id || `determination:diversity:${uuidv4()}`;
  
  return {
    id,
    type: 'diversity',
    
    // BEC Structure
    being: {
      quality: "external difference",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "diversity",
      mediated: true
    },
    concept: {
      universal: "determination of reflection",
      particular: "diversity",
      individual: "indifferent difference"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "essence:determination-of-reflection:difference",
    transitionsTo: "essence:determination-of-reflection:opposition",
    
    // Properties specific to determinations of reflection
    isSelfSubsistent: true,
    isReflectedDetermination: true,
    hasOpposition: false,
    
    // Description
    description: "Diversity as the state resulting from identity breaking apart internally, characterized by indifference and subsistence, where differences remain external to each other."
  };
}

/**
 * Create Opposition - The fourth determination of reflection
 */
export function createOpposition(options: {
  id?: string;
  emergesFrom?: string;
} = {}): DeterminationOfReflection {
  const id = options.id || `determination:opposition:${uuidv4()}`;
  
  return {
    id,
    type: 'opposition',
    
    // BEC Structure
    being: {
      quality: "determined opposition",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "opposition",
      mediated: true
    },
    concept: {
      universal: "determination of reflection",
      particular: "opposition",
      individual: "positive and negative"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "essence:determination-of-reflection:diversity",
    transitionsTo: "essence:determination-of-reflection:contradiction",
    
    // Properties specific to determinations of reflection
    isSelfSubsistent: true,
    isReflectedDetermination: true,
    hasOpposition: true,
    
    // Description
    description: "Opposition as the unity of identity and diversity, containing diverse moments within one identity, consisting of positive and negative sides that are determined through each other."
  };
}

/**
 * Create Contradiction - The fifth determination of reflection
 */
export function createContradiction(options: {
  id?: string;
  emergesFrom?: string;
} = {}): DeterminationOfReflection {
  const id = options.id || `determination:contradiction:${uuidv4()}`;
  
  return {
    id,
    type: 'contradiction',
    
    // BEC Structure
    being: {
      quality: "self-contradictory unity",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "contradiction",
      mediated: true
    },
    concept: {
      universal: "determination of reflection",
      particular: "contradiction",
      individual: "unity of positive and negative"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "essence:determination-of-reflection:opposition",
    transitionsTo: "essence:ground",
    
    // Properties specific to determinations of reflection
    isSelfSubsistent: true,
    isReflectedDetermination: true,
    hasOpposition: true,
    
    // Description
    description: "Contradiction as the state where moments of difference are both self-subsisting and mutually determining, containing the whole opposition within each moment, resolving itself through self-sublation."
  };
}

// =========================================================
// REFLECTION SYSTEM - Core functionality
// =========================================================

/**
 * Reflection System
 * 
 * Main class that provides functionality for working with
 * Hegelian reflection categories in the BEC ecosystem
 */
export class ReflectionSystem extends EventEmitter {
  private reflections: Map<string, Reflection> = new Map();
  private shines: Map<string, Shine> = new Map();
  private determinations: Map<string, DeterminationOfReflection> = new Map();
  
  constructor() {
    super();
  }
  
  /**
   * Create a reflection based on type
   */
  createReflection(
    type: ReflectionCategory,
    options: any = {}
  ): Reflection {
    let reflection: Reflection;
    
    // Create reflection based on type
    if (type === 'reflection-general') {
      reflection = createReflectionGeneral(options);
    } else if (type === 'positing-reflection') {
      reflection = createPositingReflection(options);
    } else if (type === 'external-reflection') {
      reflection = createExternalReflection(options);
    } else if (type === 'determining-reflection') {
      reflection = createDeterminingReflection(options);
    } else {
      throw new Error(`Invalid reflection type: ${type}`);
    }
    
    // Store reflection
    this.reflections.set(reflection.id, reflection);
    
    // Emit event
    this.emit('reflection:created', { reflection });
    
    return reflection;
  }
  
  /**
   * Create Shine
   */
  createShine(
    type: ShineType,
    options: any = {}
  ): Shine {
    const shine = createShine(type, options);
    
    // Store shine
    this.shines.set(shine.id, shine);
    
    // Emit event
    this.emit('shine:created', { shine });
    
    return shine;
  }
  
  /**
   * Create a determination of reflection
   */
  createDetermination(
    type: DeterminationOfReflectionType,
    options: any = {}
  ): DeterminationOfReflection {
    let determination: DeterminationOfReflection;
    
    // Create determination based on type
    if (type === 'identity') {
      determination = createIdentity(options);
    } else if (type === 'difference') {
      determination = createDifference(options);
    } else if (type === 'diversity') {
      determination = createDiversity(options);
    } else if (type === 'opposition') {
      determination = createOpposition(options);
    } else if (type === 'contradiction') {
      determination = createContradiction(options);
    } else {
      throw new Error(`Invalid determination type: ${type}`);
    }
    
    // Store determination
    this.determinations.set(determination.id, determination);
    
    // Emit event
    this.emit('determination:created', { determination });
    
    return determination;
  }
  
  /**
   * Get reflection by ID
   */
  getReflection(id: string): Reflection | undefined {
    return this.reflections.get(id);
  }
  
  /**
   * Get shine by ID
   */
  getShine(id: string): Shine | undefined {
    return this.shines.get(id);
  }
  
  /**
   * Get determination by ID
   */
  getDetermination(id: string): DeterminationOfReflection | undefined {
    return this.determinations.get(id);
  }
  
  /**
   * Convert reflection to Neo node
   */
  reflectionToNode(reflection: Reflection): NeoNode {
    return createNeoNode({
      id: reflection.id,
      type: `reflection:${reflection.type}`,
      being: reflection.being,
      essence: reflection.essence,
      concept: reflection.concept,
      properties: {
        description: reflection.description,
        characteristics: reflection.characteristics.map(c => c.name),
        isInfiniteMovement: reflection.isInfiniteMovement,
        isSelfReferring: reflection.isSelfReferring,
        isAbsoluteMediation: reflection.isAbsoluteMediation,
        
        // Type-specific properties
        ...(reflection.type === 'positing-reflection' ? {
          movement: (reflection as PositingReflection).movement
        } : {}),
        
        ...(reflection.type === 'external-reflection' ? {
          presupposition: (reflection as ExternalReflection).presupposition
        } : {}),
        
        ...(reflection.type === 'determining-reflection' ? {
          unity: (reflection as DeterminingReflection).unity
        } : {}),
        
        ...(reflection.type === 'reflection-general' ? {
          containsShine: (reflection as ReflectionGeneral).containsShine,
          isEssenceSelfMovement: (reflection as ReflectionGeneral).isEssenceSelfMovement
        } : {})
      },
      metadata: {
        emergesFrom: reflection.emergesFrom,
        transitionsTo: reflection.transitionsTo
      }
    });
  }
  
  /**
   * Convert shine to Neo node
   */
  shineToNode(shine: Shine): NeoNode {
    return createNeoNode({
      id: shine.id,
      type: `shine:${shine.type}`,
      being: shine.being,
      essence: shine.essence,
      properties: {
        description: shine.description,
        isNothingness: shine.isNothingness,
        isNegative: shine.isNegative,
        isPosited: shine.isPosited
      },
      metadata: {
        existsWithin: shine.existsWithin
      }
    });
  }
  
  /**
   * Convert determination to Neo node
   */
  determinationToNode(determination: DeterminationOfReflection): NeoNode {
    return createNeoNode({
      id: determination.id,
      type: `determination:${determination.type}`,
      being: determination.being,
      essence: determination.essence,
      concept: determination.concept,
      properties: {
        description: determination.description,
        isSelfSubsistent: determination.isSelfSubsistent,
        isReflectedDetermination: determination.isReflectedDetermination,
        hasOpposition: determination.hasOpposition
      },
      metadata: {
        emergesFrom: determination.emergesFrom,
        transitionsTo: determination.transitionsTo
      }
    });
  }
  
  /**
   * Develop reflection to next category in dialectical progression
   */
  developReflection(reflection: Reflection): Reflection | null {
    if (!reflection.transitionsTo) {
      return null;
    }
    
    const [category, type] = reflection.transitionsTo.split(':');
    
    if (category !== 'reflection') {
      // Transitions to another category (e.g., determination or ground)
      return null;
    }
    
    // Create the next reflection in the dialectical progression
    return this.createReflection(
      type as ReflectionCategory,
      { emergesFrom: reflection.id }
    );
  }
  
  /**
   * Develop determination to next category in dialectical progression
   */
  developDetermination(determination: DeterminationOfReflection): DeterminationOfReflection | null {
    if (!determination.transitionsTo) {
      return null;
    }
    
    const [category, _, type] = determination.transitionsTo.split(':');
    
    if (category !== 'essence' || _ !== 'determination-of-reflection') {
      // Transitions to another category (e.g., ground)
      return null;
    }
    
    // Create the next determination in the dialectical progression
    return this.createDetermination(
      type as DeterminationOfReflectionType,
      { emergesFrom: determination.id }
    );
  }
  
  /**
   * Create complete dialectical progression of reflection forms
   */
  createReflectionProgression(): Reflection[] {
    const progression: Reflection[] = [];
    
    // Start with reflection general
    let current = this.createReflection('reflection-general');
    progression.push(current);
    
    // Develop through all forms
    while (current) {
      const next = this.developReflection(current);
      if (!next) break;
      
      progression.push(next);
      current = next;
    }
    
    return progression;
  }
  
  /**
   * Create complete dialectical progression of determinations
   */
  createDeterminationProgression(): DeterminationOfReflection[] {
    const progression: DeterminationOfReflection[] = [];
    
    // Start with identity
    let current = this.createDetermination('identity');
    progression.push(current);
    
    // Develop through all forms
    while (current) {
      const next = this.developDetermination(current);
      if (!next) break;
      
      progression.push(next);
      current = next;
    }
    
    return progression;
  }
  
  /**
   * Process an entity through the reflection system
   */
  processEntity(entityId: string): Promise<NeoNode> {
    return new Promise((resolve, reject) => {
      try {
        // Start with the most basic reflection
        const reflectionGeneral = this.createReflection('reflection-general');
        
        // Create a shine for this entity
        const shine = this.createShine('reflected-immediacy', {
          essenceId: entityId
        });
        
        // Process through the reflection progression
        const reflectionProgression = this.createReflectionProgression();
        
        // Create the first determination
        const identity = this.createDetermination('identity');
        
        // Process through determination progression
        const determinations = this.createDeterminationProgression();
        
        // The final result is a Neo node representing the contradiction
        // which will lead to ground
        const contradiction = determinations[determinations.length - 1];
        const resultNode = this.determinationToNode(contradiction);
        
        // Emit completion event
        this.emit('reflection:entity.processed', { 
          entityId,
          result: resultNode,
          reflections: reflectionProgression,
          shine,
          determinations
        });
        
        resolve(resultNode);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Clear all reflections and determinations
   */
  clear(): void {
    this.reflections.clear();
    this.shines.clear();
    this.determinations.clear();
  }
  
  /**
   * Get instance of ReflectionSystem (singleton)
   */
  static getInstance(): ReflectionSystem {
    if (!ReflectionSystem.instance) {
      ReflectionSystem.instance = new ReflectionSystem();
    }
    return ReflectionSystem.instance;
  }
  
  private static instance: ReflectionSystem;
}

export default ReflectionSystem;