import { NeoNode, createNeoNode } from '../../neo/node';
import { NeoEntityId } from '../../neo/dialectic';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { DeterminationOfReflection } from './reflection';

/**
 * Hegelian Ground System
 * 
 * A TypeScript implementation of Hegel's theory of Ground
 * from his Science of Logic, representing the foundation or basis
 * from which essence emerges and which mediates essence with itself.
 */

// =========================================================
// GROUND TYPES - The categories of ground
// =========================================================

export type GroundCategory = 
  'absolute-ground' | 
  'formal-ground' | 
  'real-ground' | 
  'complete-ground';

export type AbsoluteGroundType = 
  'form-matter' | 
  'form-content' | 
  'form-essence';

export type FormalGroundType = 
  'tautological' | 
  'pure-form' | 
  'external';

export type RealGroundType = 
  'essential-content' | 
  'complete-content' | 
  'insufficient';

export type CompleteGroundType = 
  'relative-unconditioned' | 
  'absolute-unconditioned' | 
  'emergent-existence';

// =========================================================
// CHARACTERISTICS OF GROUND
// =========================================================

/**
 * Characteristic Interface - Qualities that characterize Ground
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

// Predefined characteristics of Ground
export const SELF_DETERMINATION = createCharacteristic(
  "Self-Determination",
  "The quality of determining itself without external influence"
);

export const MEDIATION = createCharacteristic(
  "Mediation",
  "The process of connecting or reconciling different elements within the dialectical process"
);

export const REFLECTION = createCharacteristic(
  "Reflection",
  "The process of self-reference central to the concept of ground"
);

export const NEGATIVITY = createCharacteristic(
  "Negativity",
  "The quality of being negating or expressing negation"
);

export const UNITY_OF_OPPOSITES = createCharacteristic(
  "Unity of Opposites",
  "The quality of containing and reconciling opposing determinations"
);

// =========================================================
// GROUND INTERFACES - Base types for forms of ground
// =========================================================

/**
 * Ground Interface - Base for all forms of ground
 */
export interface Ground {
  id: string;
  type: GroundCategory;
  
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
  
  // Properties specific to ground
  isSelfDetermined: boolean;
  isMediating: boolean;
  isReflective: boolean;
  isNegative: boolean;
  
  // Description
  description: string;
}

// =========================================================
// ABSOLUTE GROUND - The first form of ground
// =========================================================

/**
 * AbsoluteGround - The first form of ground
 */
export interface AbsoluteGround extends Ground {
  type: 'absolute-ground';
  subtype: AbsoluteGroundType;
  
  // Properties specific to absolute ground
  form: {
    isDetermining: boolean;
    standsOverAgainst?: string;
  };
  
  matter?: {
    isSimpleIdentity: boolean;
    isVoidOfDistinction: boolean;
  };
  
  content?: {
    isUnityOfFormAndMatter: boolean;
    isInformedMatter: boolean;
  };
}

/**
 * Create Absolute Ground - Form-Matter
 */
export function createFormMatterGround(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): AbsoluteGround {
  const id = options.id || `ground:absolute-ground:form-matter:${uuidv4()}`;
  
  // Create specific characteristics for form-matter
  const FORM_DETERMINATION = createCharacteristic(
    "Form Determination",
    "The power of form to determine and shape matter"
  );
  
  const MATTER_SUBSTRATE = createCharacteristic(
    "Matter as Substrate",
    "The role of matter as the indeterminate substrate for form"
  );
  
  const DIALECTICAL_OPPOSITION = createCharacteristic(
    "Dialectical Opposition",
    "The opposition and mutual presupposition of form and matter"
  );
  
  return {
    id,
    type: 'absolute-ground',
    subtype: 'form-matter',
    
    // BEC Structure
    being: {
      quality: "form-matter relation",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "absolute form-matter",
      mediated: true
    },
    concept: {
      universal: "ground",
      particular: "absolute ground",
      individual: "form-matter"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "essence:determination-of-reflection:contradiction",
    transitionsTo: "ground:absolute-ground:form-content",
    
    // Characteristics
    characteristics: options.characteristics || [
      SELF_DETERMINATION,
      MEDIATION,
      REFLECTION,
      FORM_DETERMINATION,
      MATTER_SUBSTRATE,
      DIALECTICAL_OPPOSITION
    ],
    
    // Properties specific to ground
    isSelfDetermined: true,
    isMediating: true,
    isReflective: true,
    isNegative: true,
    
    // Properties specific to form-matter
    form: {
      isDetermining: true,
      standsOverAgainst: "matter"
    },
    
    matter: {
      isSimpleIdentity: true,
      isVoidOfDistinction: true
    },
    
    // Description
    description: "Absolute Ground as Form-Matter relation, where form determines matter, and matter serves as the substrate for form, with both standing in dialectical opposition yet mutual presupposition."
  };
}

/**
 * Create Absolute Ground - Form-Content
 */
export function createFormContentGround(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): AbsoluteGround {
  const id = options.id || `ground:absolute-ground:form-content:${uuidv4()}`;
  
  // Create specific characteristics for form-content
  const CONTENT_AS_UNITY = createCharacteristic(
    "Content as Unity",
    "Content as the unity of form and matter"
  );
  
  const FORM_SUBORDINATION = createCharacteristic(
    "Form Subordination",
    "The subordination of form to content as unessential compared to it"
  );
  
  const CONTENT_SUBSTRATE = createCharacteristic(
    "Content as Substrate",
    "The role of content as the substrate for form"
  );
  
  return {
    id,
    type: 'absolute-ground',
    subtype: 'form-content',
    
    // BEC Structure
    being: {
      quality: "form-content relation",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "absolute form-content",
      mediated: true
    },
    concept: {
      universal: "ground",
      particular: "absolute ground",
      individual: "form-content"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "ground:absolute-ground:form-matter",
    transitionsTo: "ground:absolute-ground:form-essence",
    
    // Characteristics
    characteristics: options.characteristics || [
      SELF_DETERMINATION,
      MEDIATION,
      REFLECTION,
      CONTENT_AS_UNITY,
      FORM_SUBORDINATION,
      CONTENT_SUBSTRATE
    ],
    
    // Properties specific to ground
    isSelfDetermined: true,
    isMediating: true,
    isReflective: true,
    isNegative: true,
    
    // Properties specific to form-content
    form: {
      isDetermining: false,
      standsOverAgainst: "content"
    },
    
    content: {
      isUnityOfFormAndMatter: true,
      isInformedMatter: true
    },
    
    // Description
    description: "Absolute Ground as Form-Content relation, where content is the unity of form and matter, and form stands over against content but is unessential compared to it, with content constituting the substrate for form."
  };
}

/**
 * Create Absolute Ground - Form-Essence
 */
export function createFormEssenceGround(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): AbsoluteGround {
  const id = options.id || `ground:absolute-ground:form-essence:${uuidv4()}`;
  
  // Create specific characteristics for form-essence
  const FORM_AS_ESSENCE = createCharacteristic(
    "Form as Essence",
    "Form revealing itself as the essence of matter"
  );
  
  const ESSENCE_SELF_DETERMINATION = createCharacteristic(
    "Essence Self-Determination",
    "Essence determining itself as ground"
  );
  
  const NEGATIVE_SIMPLICITY = createCharacteristic(
    "Negative Simplicity",
    "The characteristic of essence as negative simplicity"
  );
  
  return {
    id,
    type: 'absolute-ground',
    subtype: 'form-essence',
    
    // BEC Structure
    being: {
      quality: "essence-form identity",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "absolute form-essence",
      mediated: true
    },
    concept: {
      universal: "ground",
      particular: "absolute ground",
      individual: "form-essence"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "ground:absolute-ground:form-content",
    transitionsTo: "ground:formal-ground:tautological",
    
    // Characteristics
    characteristics: options.characteristics || [
      SELF_DETERMINATION,
      MEDIATION,
      REFLECTION,
      FORM_AS_ESSENCE,
      ESSENCE_SELF_DETERMINATION,
      NEGATIVE_SIMPLICITY
    ],
    
    // Properties specific to ground
    isSelfDetermined: true,
    isMediating: true,
    isReflective: true,
    isNegative: true,
    
    // Properties specific to form-essence
    form: {
      isDetermining: true
    },
    
    // Description
    description: "Absolute Ground as Form-Essence relation, where form reveals itself as the essence of matter, and essence determines itself as ground, characterized by negative simplicity and absolute self-mediation."
  };
}

// =========================================================
// FORMAL GROUND - The second form of ground
// =========================================================

/**
 * FormalGround - The second form of ground
 */
export interface FormalGround extends Ground {
  type: 'formal-ground';
  subtype: FormalGroundType;
  
  // Properties specific to formal ground
  ground: {
    hasDeterminateContent: boolean;
  };
  
  grounded: {
    hasIdenticalContent: boolean;
    hasDifferentForm: boolean;
  };
  
  relation: {
    isEmptyTautological: boolean;
    providesSufficientExplanation: boolean;
  };
}

/**
 * Create Formal Ground
 */
export function createFormalGround(
  subtype: FormalGroundType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): FormalGround {
  const id = options.id || `ground:formal-ground:${subtype}:${uuidv4()}`;
  
  // Create specific characteristics for formal ground
  const TAUTOLOGICAL_RELATION = createCharacteristic(
    "Tautological Relation",
    "The relation where the ground and grounded have the same content"
  );
  
  const FORMAL_DISTINCTION = createCharacteristic(
    "Formal Distinction",
    "The distinction between ground and grounded is merely formal"
  );
  
  const CONTENT_IDENTITY = createCharacteristic(
    "Content Identity",
    "The identity of content between ground and grounded"
  );
  
  // Configure based on subtype
  let quality = "";
  let description = "";
  let transitionTarget = "";
  let providesExplanation = false;
  
  switch(subtype) {
    case 'tautological':
      quality = "tautological relation";
      description = "Formal Ground as a tautological relation, where the explanation is merely a restatement of what is to be explained, with the same content in different form.";
      transitionTarget = "ground:formal-ground:pure-form";
      providesExplanation = false;
      break;
      
    case 'pure-form':
      quality = "pure formal relation";
      description = "Formal Ground as pure form, where the content is the same in both ground and grounded, but the form provides a semblance of explanation.";
      transitionTarget = "ground:formal-ground:external";
      providesExplanation = false;
      break;
      
    case 'external':
      quality = "external relation";
      description = "Formal Ground as external relation, where the content remains identical but the external form supplies an apparent explanatory connection.";
      transitionTarget = "ground:real-ground:essential-content";
      providesExplanation = false;
      break;
  }
  
  return {
    id,
    type: 'formal-ground',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: `formal ground: ${subtype}`,
      mediated: true
    },
    concept: {
      universal: "ground",
      particular: "formal ground",
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'tautological' ? "ground:absolute-ground:form-essence" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: options.characteristics || [
      MEDIATION,
      REFLECTION,
      TAUTOLOGICAL_RELATION,
      FORMAL_DISTINCTION,
      CONTENT_IDENTITY
    ],
    
    // Properties specific to ground
    isSelfDetermined: false,
    isMediating: true,
    isReflective: true,
    isNegative: false,
    
    // Properties specific to formal ground
    ground: {
      hasDeterminateContent: true
    },
    
    grounded: {
      hasIdenticalContent: true,
      hasDifferentForm: true
    },
    
    relation: {
      isEmptyTautological: true,
      providesSufficientExplanation: providesExplanation
    },
    
    // Description
    description
  };
}

// =========================================================
// REAL GROUND - The third form of ground
// =========================================================

/**
 * RealGround - The third form of ground
 */
export interface RealGround extends Ground {
  type: 'real-ground';
  subtype: RealGroundType;
  
  // Properties specific to real ground
  ground: {
    hasEssentialContent: boolean;
  };
  
  grounded: {
    hasDifferentContent: boolean;
    hasUnessentialElements: boolean;
  };
  
  relation: {
    isContingentConnection: boolean;
    fullyExplainsNecessity: boolean;
  };
}

/**
 * Create Real Ground
 */
export function createRealGround(
  subtype: RealGroundType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): RealGround {
  const id = options.id || `ground:real-ground:${subtype}:${uuidv4()}`;
  
  // Create specific characteristics for real ground
  const CONTENT_DIFFERENCE = createCharacteristic(
    "Content Difference",
    "The difference in content between ground and grounded"
  );
  
  const ESSENTIAL_DETERMINATION = createCharacteristic(
    "Essential Determination",
    "The ground contains the essential determination of the grounded"
  );
  
  const CONTINGENT_CONNECTION = createCharacteristic(
    "Contingent Connection",
    "The connection between ground and grounded involves contingent elements"
  );
  
  // Configure based on subtype
  let quality = "";
  let description = "";
  let transitionTarget = "";
  let fullyExplains = false;
  
  switch(subtype) {
    case 'essential-content':
      quality = "essential content relation";
      description = "Real Ground as essential content relation, where the ground contains the essential determination of the grounded, but with different content.";
      transitionTarget = "ground:real-ground:complete-content";
      fullyExplains = false;
      break;
      
    case 'complete-content':
      quality = "complete content relation";
      description = "Real Ground as complete content relation, where the ground contains more complete content needed to explain the grounded, but still with contingent connection.";
      transitionTarget = "ground:real-ground:insufficient";
      fullyExplains = false;
      break;
      
    case 'insufficient':
      quality = "insufficient relation";
      description = "Real Ground as insufficient relation, where despite containing essential determination, the contingent connection reveals the limitations of real ground.";
      transitionTarget = "ground:complete-ground:relative-unconditioned";
      fullyExplains = false;
      break;
  }
  
  return {
    id,
    type: 'real-ground',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: `real ground: ${subtype}`,
      mediated: true
    },
    concept: {
      universal: "ground",
      particular: "real ground",
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'essential-content' ? "ground:formal-ground:external" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: options.characteristics || [
      MEDIATION,
      REFLECTION,
      CONTENT_DIFFERENCE,
      ESSENTIAL_DETERMINATION,
      CONTINGENT_CONNECTION
    ],
    
    // Properties specific to ground
    isSelfDetermined: true,
    isMediating: true,
    isReflective: true,
    isNegative: true,
    
    // Properties specific to real ground
    ground: {
      hasEssentialContent: true
    },
    
    grounded: {
      hasDifferentContent: true,
      hasUnessentialElements: true
    },
    
    relation: {
      isContingentConnection: true,
      fullyExplainsNecessity: fullyExplains
    },
    
    // Description
    description
  };
}

// =========================================================
// COMPLETE GROUND - The fourth form of ground
// =========================================================

/**
 * CompleteGround - The fourth form of ground
 */
export interface CompleteGround extends Ground {
  type: 'complete-ground';
  subtype: CompleteGroundType;
  
  // Properties specific to complete ground
  synthesisForms: {
    formal: boolean;
    real: boolean;
    relative?: boolean;
    absolute?: boolean;
  };
  
  condition?: {
    isImmediate: boolean;
    isEssential: boolean;
    isNonEssential: boolean;
  };
  
  unconditioned?: {
    isSelfSubsistent: boolean;
    isSelfDetermining: boolean;
  };
  
  emergence?: {
    toExistence: boolean;
    fromUnconditioned: boolean;
  };
}

/**
 * Create Complete Ground - Relatively Unconditioned
 */
export function createRelativelyUnconditionedGround(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): CompleteGround {
  const id = options.id || `ground:complete-ground:relative-unconditioned:${uuidv4()}`;
  
  // Create specific characteristics for relatively unconditioned
  const GROUND_CONDITION_SYNTHESIS = createCharacteristic(
    "Ground-Condition Synthesis",
    "The synthesis of ground and its conditions"
  );
  
  const IMMEDIACY_MEDIATION_UNITY = createCharacteristic(
    "Immediacy-Mediation Unity",
    "The unity of immediacy and mediation in the relatively unconditioned"
  );
  
  const DEPENDENT_INDEPENDENCE = createCharacteristic(
    "Dependent Independence",
    "The state of being independent yet still dependent on conditions"
  );
  
  return {
    id,
    type: 'complete-ground',
    subtype: 'relative-unconditioned',
    
    // BEC Structure
    being: {
      quality: "relatively unconditioned unity",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "relatively unconditioned",
      mediated: true
    },
    concept: {
      universal: "ground",
      particular: "complete ground",
      individual: "relatively unconditioned"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "ground:real-ground:insufficient",
    transitionsTo: "ground:complete-ground:absolute-unconditioned",
    
    // Characteristics
    characteristics: options.characteristics || [
      SELF_DETERMINATION,
      MEDIATION,
      REFLECTION,
      GROUND_CONDITION_SYNTHESIS,
      IMMEDIACY_MEDIATION_UNITY,
      DEPENDENT_INDEPENDENCE
    ],
    
    // Properties specific to ground
    isSelfDetermined: true,
    isMediating: true,
    isReflective: true,
    isNegative: false,
    
    // Properties specific to complete ground
    synthesisForms: {
      formal: true,
      real: true,
      relative: true
    },
    
    condition: {
      isImmediate: true,
      isEssential: true,
      isNonEssential: true
    },
    
    // Description
    description: "Complete Ground as Relatively Unconditioned, a synthesis of ground and condition, combining immediacy and mediation, representing a higher stage in the dialectical development of ground while still dependent on its conditions."
  };
}

/**
 * Create Complete Ground - Absolutely Unconditioned
 */
export function createAbsolutelyUnconditionedGround(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): CompleteGround {
  const id = options.id || `ground:complete-ground:absolute-unconditioned:${uuidv4()}`;
  
  // Create specific characteristics for absolutely unconditioned
  const SELF_SUBSISTENCE = createCharacteristic(
    "Self-Subsistence",
    "The quality of being self-sustaining or independent in existence"
  );
  
  const SELF_DETERMINING = createCharacteristic(
    "Self-Determining",
    "The quality of determining one's own nature or characteristics"
  );
  
  const FORM_CONTENT_UNITY = createCharacteristic(
    "Form-Content Unity",
    "The unity of form and content in the absolutely unconditioned"
  );
  
  return {
    id,
    type: 'complete-ground',
    subtype: 'absolute-unconditioned',
    
    // BEC Structure
    being: {
      quality: "absolutely unconditioned unity",
      immediate: false,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "absolutely unconditioned",
      mediated: true
    },
    concept: {
      universal: "ground",
      particular: "complete ground",
      individual: "absolutely unconditioned"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "ground:complete-ground:relative-unconditioned",
    transitionsTo: "ground:complete-ground:emergent-existence",
    
    // Characteristics
    characteristics: options.characteristics || [
      SELF_DETERMINATION,
      MEDIATION,
      REFLECTION,
      SELF_SUBSISTENCE,
      SELF_DETERMINING,
      FORM_CONTENT_UNITY
    ],
    
    // Properties specific to ground
    isSelfDetermined: true,
    isMediating: true,
    isReflective: true,
    isNegative: false,
    
    // Properties specific to complete ground
    synthesisForms: {
      formal: true,
      real: true,
      absolute: true
    },
    
    unconditioned: {
      isSelfSubsistent: true,
      isSelfDetermining: true
    },
    
    // Description
    description: "Complete Ground as Absolutely Unconditioned, representing the highest unity of ground and its conditions, transcending the relatively unconditioned through self-subsistence and self-determination."
  };
}

/**
 * Create Complete Ground - Emergent Existence
 */
export function createEmergentExistenceGround(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): CompleteGround {
  const id = options.id || `ground:complete-ground:emergent-existence:${uuidv4()}`;
  
  // Create specific characteristics for emergent existence
  const GROUND_CONDITION_UNITY = createCharacteristic(
    "Ground-Condition Unity",
    "The unity of ground and condition in emergent existence"
  );
  
  const IMMEDIATE_ESSENCE = createCharacteristic(
    "Immediate Essence",
    "Essence that has become immediate through the fact"
  );
  
  const EXISTENCE_EMERGENCE = createCharacteristic(
    "Existence Emergence",
    "The emergence of existence from ground and essence"
  );
  
  return {
    id,
    type: 'complete-ground',
    subtype: 'emergent-existence',
    
    // BEC Structure
    being: {
      quality: "factual existence",
      immediate: true,
      determinate: true
    },
    essence: {
      reflective: true,
      appearance: "emergent existence",
      mediated: true
    },
    concept: {
      universal: "ground",
      particular: "complete ground",
      individual: "emergent existence"
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "ground:complete-ground:absolute-unconditioned",
    transitionsTo: "existence",
    
    // Characteristics
    characteristics: options.characteristics || [
      SELF_DETERMINATION,
      MEDIATION,
      REFLECTION,
      GROUND_CONDITION_UNITY,
      IMMEDIATE_ESSENCE,
      EXISTENCE_EMERGENCE
    ],
    
    // Properties specific to ground
    isSelfDetermined: true,
    isMediating: true,
    isReflective: true,
    isNegative: false,
    
    // Properties specific to complete ground
    synthesisForms: {
      formal: true,
      real: true
    },
    
    emergence: {
      toExistence: true,
      fromUnconditioned: true
    },
    
    // Description
    description: "Complete Ground as Emergent Existence, representing the final stage of ground where the unity of ground and condition proceeds into concrete existence, dissolving the ground-relation into the immediate fact of existence."
  };
}

// =========================================================
// GROUND SYSTEM - Core functionality
// =========================================================

/**
 * Ground System
 * 
 * Main class that provides functionality for working with
 * Hegelian ground categories in the BEC ecosystem
 */
export class GroundSystem extends EventEmitter {
  private grounds: Map<string, Ground> = new Map();
  
  constructor() {
    super();
  }
  
  /**
   * Create an absolute ground
   */
  createAbsoluteGround(
    subtype: AbsoluteGroundType,
    options: any = {}
  ): AbsoluteGround {
    let ground: AbsoluteGround;
    
    // Create ground based on subtype
    if (subtype === 'form-matter') {
      ground = createFormMatterGround(options);
    } else if (subtype === 'form-content') {
      ground = createFormContentGround(options);
    } else if (subtype === 'form-essence') {
      ground = createFormEssenceGround(options);
    } else {
      throw new Error(`Invalid absolute ground subtype: ${subtype}`);
    }
    
    // Store ground
    this.grounds.set(ground.id, ground);
    
    // Emit event
    this.emit('ground:created', { ground });
    
    return ground;
  }
  
  /**
   * Create a formal ground
   */
  createFormalGround(
    subtype: FormalGroundType,
    options: any = {}
  ): FormalGround {
    const ground = createFormalGround(subtype, options);
    
    // Store ground
    this.grounds.set(ground.id, ground);
    
    // Emit event
    this.emit('ground:created', { ground });
    
    return ground;
  }
  
  /**
   * Create a real ground
   */
  createRealGround(
    subtype: RealGroundType,
    options: any = {}
  ): RealGround {
    const ground = createRealGround(subtype, options);
    
    // Store ground
    this.grounds.set(ground.id, ground);
    
    // Emit event
    this.emit('ground:created', { ground });
    
    return ground;
  }
  
  /**
   * Create a complete ground
   */
  createCompleteGround(
    subtype: CompleteGroundType,
    options: any = {}
  ): CompleteGround {
    let ground: CompleteGround;
    
    // Create ground based on subtype
    if (subtype === 'relative-unconditioned') {
      ground = createRelativelyUnconditionedGround(options);
    } else if (subtype === 'absolute-unconditioned') {
      ground = createAbsolutelyUnconditionedGround(options);
    } else if (subtype === 'emergent-existence') {
      ground = createEmergentExistenceGround(options);
    } else {
      throw new Error(`Invalid complete ground subtype: ${subtype}`);
    }
    
    // Store ground
    this.grounds.set(ground.id, ground);
    
    // Emit event
    this.emit('ground:created', { ground });
    
    return ground;
  }
  
  /**
   * Get ground by ID
   */
  getGround(id: string): Ground | undefined {
    return this.grounds.get(id);
  }
  
  /**
   * Convert ground to Neo node
   */
  groundToNode(ground: Ground): NeoNode {
    let properties: any = {
      description: ground.description,
      characteristics: ground.characteristics.map(c => c.name),
      isSelfDetermined: ground.isSelfDetermined,
      isMediating: ground.isMediating,
      isReflective: ground.isReflective,
      isNegative: ground.isNegative
    };
    
    // Add type-specific properties
    if (ground.type === 'absolute-ground') {
      const absoluteGround = ground as AbsoluteGround;
      properties = {
        ...properties,
        form: absoluteGround.form,
        matter: absoluteGround.matter,
        content: absoluteGround.content
      };
    } else if (ground.type === 'formal-ground') {
      const formalGround = ground as FormalGround;
      properties = {
        ...properties,
        ground: formalGround.ground,
        grounded: formalGround.grounded,
        relation: formalGround.relation
      };
    } else if (ground.type === 'real-ground') {
      const realGround = ground as RealGround;
      properties = {
        ...properties,
        ground: realGround.ground,
        grounded: realGround.grounded,
        relation: realGround.relation
      };
    } else if (ground.type === 'complete-ground') {
      const completeGround = ground as CompleteGround;
      properties = {
        ...properties,
        synthesisForms: completeGround.synthesisForms,
        condition: completeGround.condition,
        unconditioned: completeGround.unconditioned,
        emergence: completeGround.emergence
      };
    }
    
    return createNeoNode({
      id: ground.id,
      type: `ground:${ground.type}${'subtype' in ground ? `:${(ground as any).subtype}` : ''}`,
      being: ground.being,
      essence: ground.essence,
      concept: ground.concept,
      properties,
      metadata: {
        emergesFrom: ground.emergesFrom,
        transitionsTo: ground.transitionsTo
      }
    });
  }
  
  /**
   * Develop ground to next category in dialectical progression
   */
  developGround(ground: Ground): Ground | null {
    if (!ground.transitionsTo) {
      return null;
    }
    
    // If transitions to existence, we've reached the end
    if (ground.transitionsTo === 'existence') {
      return null;
    }
    
    const [category, type, subtype] = ground.transitionsTo.split(':');
    
    if (category !== 'ground') {
      // Transitions to another category
      return null;
    }
    
    // Create the next ground in the dialectical progression
    if (type === 'absolute-ground') {
      return this.createAbsoluteGround(subtype as AbsoluteGroundType, { emergesFrom: ground.id });
    } else if (type === 'formal-ground') {
      return this.createFormalGround(subtype as FormalGroundType, { emergesFrom: ground.id });
    } else if (type === 'real-ground') {
      return this.createRealGround(subtype as RealGroundType, { emergesFrom: ground.id });
    } else if (type === 'complete-ground') {
      return this.createCompleteGround(subtype as CompleteGroundType, { emergesFrom: ground.id });
    }
    
    return null;
  }
  
  /**
   * Create complete dialectical progression of ground
   */
  createGroundProgression(startPoint?: DeterminationOfReflection): Ground[] {
    const progression: Ground[] = [];
    
    // Start with form-matter ground (first form of absolute ground)
    let current: Ground;
    
    if (startPoint) {
      // Start from a determination of reflection (typically contradiction)
      current = this.createAbsoluteGround('form-matter', { emergesFrom: startPoint.id });
    } else {
      current = this.createAbsoluteGround('form-matter');
    }
    
    progression.push(current);
    
    // Develop through all forms
    while (current && current.transitionsTo && current.transitionsTo !== 'existence') {
      const next = this.developGround(current);
      if (!next) break;
      
      progression.push(next);
      current = next;
    }
    
    return progression;
  }
  
  /**
   * Create absolute ground progression
   */
  createAbsoluteGroundProgression(): AbsoluteGround[] {
    const formMatter = this.createAbsoluteGround('form-matter');
    const formContent = this.createAbsoluteGround('form-content', { emergesFrom: formMatter.id });
    const formEssence = this.createAbsoluteGround('form-essence', { emergesFrom: formContent.id });
    
    return [formMatter, formContent, formEssence];
  }
  
  /**
   * Create formal ground progression
   */
  createFormalGroundProgression(): FormalGround[] {
    // Get the form-essence ground as the starting point
    const formEssence = this.createAbsoluteGround('form-essence');
    
    // Create the formal grounds
    const tautological = this.createFormalGround('tautological', { emergesFrom: formEssence.id });
    const pureForm = this.createFormalGround('pure-form', { emergesFrom: tautological.id });
    const external = this.createFormalGround('external', { emergesFrom: pureForm.id });
    
    return [tautological, pureForm, external];
  }
  
  /**
   * Create real ground progression
   */
  createRealGroundProgression(): RealGround[] {
    // Get the external formal ground as the starting point
    const external = this.createFormalGround('external');
    
    // Create the real grounds
    const essentialContent = this.createRealGround('essential-content', { emergesFrom: external.id });
    const completeContent = this.createRealGround('complete-content', { emergesFrom: essentialContent.id });
    const insufficient = this.createRealGround('insufficient', { emergesFrom: completeContent.id });
    
    return [essentialContent, completeContent, insufficient];
  }
  
  /**
   * Create complete ground progression
   */
  createCompleteGroundProgression(): CompleteGround[] {
    // Get the insufficient real ground as the starting point
    const insufficient = this.createRealGround('insufficient');
    
    // Create the complete grounds
    const relativeUnconditioned = this.createCompleteGround('relative-unconditioned', { emergesFrom: insufficient.id });
    const absoluteUnconditioned = this.createCompleteGround('absolute-unconditioned', { emergesFrom: relativeUnconditioned.id });
    const emergentExistence = this.createCompleteGround('emergent-existence', { emergesFrom: absoluteUnconditioned.id });
    
    return [relativeUnconditioned, absoluteUnconditioned, emergentExistence];
  }
  
  /**
   * Process an entity through the ground system
   */
  processEntity(entityId: string, contradictionNode: NeoNode): Promise<NeoNode> {
    return new Promise((resolve, reject) => {
      try {
        // Create the complete dialectical progression of ground
        const groundProgression = this.createGroundProgression();
        
        // Connect the contradiction to the first ground
        const firstGround = groundProgression[0];
        firstGround.emergesFrom = entityId;
        
        // The final result is the emergent existence
        const emergentExistence = groundProgression[groundProgression.length - 1];
        const resultNode = this.groundToNode(emergentExistence);
        
        // Emit completion event
        this.emit('ground:entity.processed', { 
          entityId,
          result: resultNode,
          grounds: groundProgression
        });
        
        resolve(resultNode);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Clear all grounds
   */
  clear(): void {
    this.grounds.clear();
  }
  
  /**
   * Get instance of GroundSystem (singleton)
   */
  static getInstance(): GroundSystem {
    if (!GroundSystem.instance) {
      GroundSystem.instance = new GroundSystem();
    }
    return GroundSystem.instance;
  }
  
  private static instance: GroundSystem;
}

/**
 * Export singleton instance
 */
export const groundSystem = GroundSystem.getInstance();

export default groundSystem;