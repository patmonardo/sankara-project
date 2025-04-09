import { NeoNode, createNeoNode } from '../../neo/node';
import { NeoEntityId } from '../../neo/dialectic';
import { Being, BeingCategory, Characteristic, createCharacteristic } from './being';
import { Existence } from './existence';

/**
 * Hegelian Being-for-Self System
 * 
 * A TypeScript implementation of Hegel's theory of Being-for-Self
 * from his Science of Logic, representing the completion of qualitative being,
 * the sublation of existence, and the achievement of simple self-relation.
 */

// =========================================================
// BEING-FOR-SELF TYPES - The categories of being-for-self
// =========================================================

export type BeingForSelfCategory = 
  'being-for-self-general' | 
  'being-for-one' | 
  'the-one' |
  'the-many' |
  'repulsion-attraction';

export type BeingForSelfGeneralType = 
  'infinite-being' | 
  'self-relation' | 
  'ideality';

export type BeingForOneType = 
  'ideality-moment' | 
  'self-reference' | 
  'undistinguished-unity';

export type TheOneType = 
  'abstract-limit' | 
  'self-reference' | 
  'existent-for-itself';

export type TheManyType = 
  'plurality' | 
  'repelled-ones' | 
  'mutual-exclusion';

export type RepulsionAttractionType = 
  'repulsion' | 
  'attraction' | 
  'unity-of-forces';

// =========================================================
// CHARACTERISTICS OF BEING-FOR-SELF
// =========================================================

// Predefined characteristics of Being-for-Self
export const INFINITY = createCharacteristic(
  "Infinity",
  "The characteristic of Being-for-Self as infinite being"
);

export const NEGATION_OF_NEGATION = createCharacteristic(
  "Negation of Negation",
  "The process of double negation resulting in self-relation"
);

export const UNITY = createCharacteristic(
  "Unity",
  "The simple unity with itself that characterizes Being-for-Self"
);

export const IDEALITY = createCharacteristic(
  "Ideality",
  "The ideality of Being-for-Self that distinguishes it from material determination"
);

export const SUBLATION = createCharacteristic(
  "Sublation",
  "The negation, preservation and elevation of prior categories in Being-for-Self"
);

export const SELF_COMPLETION = createCharacteristic(
  "Self-Completion",
  "The characteristic of Being-for-Self as the completion of qualitative being"
);

// =========================================================
// BEING-FOR-SELF INTERFACE - Base for all forms of Being-for-Self
// =========================================================

/**
 * BeingForSelf Interface - Base for all forms of Being-for-Self
 */
export interface BeingForSelf extends Being {
  category: BeingForSelfCategory;
  
  // Core characteristics of all Being-for-Self forms
  sublatesExistence: boolean;
  embodiesInfinity: boolean;
  achievesUnity: boolean;
  containsNegationOfNegation: boolean;
}

// =========================================================
// BEING-FOR-SELF GENERAL - The most basic form of Being-for-Self
// =========================================================

/**
 * BeingForSelfGeneral - The general form of Being-for-Self
 */
export interface BeingForSelfGeneral extends BeingForSelf {
  category: 'being-for-self-general';
  subtype: BeingForSelfGeneralType;
  
  // Specific to Being-for-Self General
  completes: {
    qualitativeBeing: boolean;
    determinateBeing: boolean;
  };
  
  relationToExistence: {
    sublates: boolean;
    transcends: boolean;
    preserves: boolean;
  };
}

/**
 * Create Being-for-Self General
 */
export function createBeingForSelfGeneral(
  subtype: BeingForSelfGeneralType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
    existenceId?: string; // Reference to the sublated existence
  } = {}
): BeingForSelfGeneral {
  const id = options.id || `being-for-self:being-for-self-general:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'infinite-being':
      quality = "infinite qualitative being";
      customCharacteristics = [
        createCharacteristic("Infinite Inwardness", "The infinite inward depth of self-relation"),
        createCharacteristic("Transcended Finitude", "The transcendence of finite determinations")
      ];
      description = "Being-for-Self as infinite being, having transcended the limitations of finite existence.";
      transitionTarget = "being-for-self:being-for-self-general:self-relation";
      break;
      
    case 'self-relation':
      quality = "self-relating being";
      customCharacteristics = [
        createCharacteristic("Double Negation", "The result of negating the negation of being"),
        createCharacteristic("Absolute Determinateness", "Determinateness that is not relative to others")
      ];
      description = "Being-for-Self as self-relation, containing both the first negation and the negation of this negation.";
      transitionTarget = "being-for-self:being-for-self-general:ideality";
      break;
      
    case 'ideality':
      quality = "ideal being";
      customCharacteristics = [
        createCharacteristic("Sublated Determinateness", "Determinateness that has been sublated"),
        createCharacteristic("Ideal Moments", "The moments of Being-for-Self held in ideality")
      ];
      description = "Being-for-Self as ideality, where determinations are preserved in an idealized form.";
      transitionTarget = "being-for-self:being-for-one:ideality-moment";
      break;
  }
  
  return {
    id,
    type: 'being-for-self',
    category: 'being-for-self-general',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      determinate: true,
      immediate: false
    },
    essence: {
      reflective: true,
      appearance: subtype,
      mediated: true
    },
    concept: {
      universal: 'being-for-self',
      particular: 'being-for-self-general',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "existence:infinity:affirmative-infinite",
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      INFINITY,
      NEGATION_OF_NEGATION,
      UNITY,
      IDEALITY,
      SUBLATION,
      SELF_COMPLETION,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Being-for-Self specific
    sublatesExistence: true,
    embodiesInfinity: true,
    achievesUnity: true,
    containsNegationOfNegation: true,
    
    // Being-for-Self General specific
    completes: {
      qualitativeBeing: true,
      determinateBeing: true
    },
    
    relationToExistence: {
      sublates: true,
      transcends: true,
      preserves: true
    },
    
    // Description
    description
  };
}

// =========================================================
// BEING-FOR-ONE - The moment of reference to self
// =========================================================

/**
 * BeingForOne - The moment of reference to self in Being-for-Self
 */
export interface BeingForOne extends BeingForSelf {
  category: 'being-for-one';
  subtype: BeingForOneType;
  
  // Specific to Being-for-One
  isMomentOf: {
    beingForSelf: boolean;
    selfReferential: boolean;
  };
  
  undistinguishedUnity: {
    oneAndBeingFor: boolean;
    noDistinctOne: boolean;
  };
}

/**
 * Create Being-for-One
 */
export function createBeingForOne(
  subtype: BeingForOneType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
    beingForSelfId?: string; // Reference to the Being-for-Self it is a moment of
  } = {}
): BeingForOne {
  const id = options.id || `being-for-self:being-for-one:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'ideality-moment':
      quality = "ideal moment";
      customCharacteristics = [
        createCharacteristic("Ideality Expression", "The expression of ideality in Being-for-Self"),
        createCharacteristic("Non-Material", "The non-material, conceptual nature")
      ];
      description = "Being-for-One as the moment that expresses the ideality of Being-for-Self.";
      transitionTarget = "being-for-self:being-for-one:self-reference";
      break;
      
    case 'self-reference':
      quality = "self-referential moment";
      customCharacteristics = [
        createCharacteristic("Pure Self-Reference", "The pure self-referential aspect"),
        createCharacteristic("Internal Relation", "Relation that is entirely within itself")
      ];
      description = "Being-for-One as the moment that represents self-reference in Being-for-Self.";
      transitionTarget = "being-for-self:being-for-one:undistinguished-unity";
      break;
      
    case 'undistinguished-unity':
      quality = "undistinguished unity";
      customCharacteristics = [
        createCharacteristic("Simple Unity", "The simple unity without distinction"),
        createCharacteristic("Pre-Differentiation", "The state before differentiation into distinct moments")
      ];
      description = "Being-for-One as the undistinguished unity where the one and its being-for are not yet distinguished.";
      transitionTarget = "being-for-self:the-one:abstract-limit";
      break;
  }
  
  return {
    id,
    type: 'being-for-self',
    category: 'being-for-one',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      determinate: true,
      immediate: subtype === 'undistinguished-unity'
    },
    essence: {
      reflective: true,
      appearance: subtype,
      mediated: subtype !== 'undistinguished-unity'
    },
    concept: {
      universal: 'being-for-self',
      particular: 'being-for-one',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'ideality-moment' ? "being-for-self:being-for-self-general:ideality" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      IDEALITY,
      UNITY,
      NEGATION_OF_NEGATION,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Being-for-Self specific
    sublatesExistence: true,
    embodiesInfinity: true,
    achievesUnity: true,
    containsNegationOfNegation: true,
    
    // Being-for-One specific
    isMomentOf: {
      beingForSelf: true,
      selfReferential: true
    },
    
    undistinguishedUnity: {
      oneAndBeingFor: subtype === 'undistinguished-unity',
      noDistinctOne: true
    },
    
    // Description
    description
  };
}

// =========================================================
// THE ONE - The Being-for-Self as an existent-for-itself
// =========================================================

/**
 * TheOne - The Being-for-Self as an existent-for-itself
 */
export interface TheOne extends BeingForSelf {
  category: 'the-one';
  subtype: TheOneType;
  
  // Specific to The One
  isNegationOfNegation: {
    firstNegation: boolean;     // Negation of immediate being
    negationOfNegation: boolean; // Negation of this first negation
  };
  
  isAbstractLimit: {
    totallyAbstract: boolean;    // Totally abstract rather than concrete
    selfLimiting: boolean;       // Limits itself rather than being limited by others
  };
  
  arisesInImmediacy: {
    vanishingOfInnerMeaning: boolean;  // Inner meaning vanishes in immediacy
    manifestationOfOuterForm: boolean;  // Manifestation as external form
  };
}

/**
 * Create The One
 */
export function createTheOne(
  subtype: TheOneType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
    beingForSelfId?: string; // Reference to the Being-for-Self it emerges from
  } = {}
): TheOne {
  const id = options.id || `being-for-self:the-one:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'abstract-limit':
      quality = "absolutely limited being";
      customCharacteristics = [
        createCharacteristic("Abstract Limitation", "The totally abstract limit of itself"),
        createCharacteristic("Self-Enclosure", "Complete self-enclosure and exclusion of others")
      ];
      description = "The One as the totally abstract limit of itself, absolutely exclusive and self-enclosed.";
      transitionTarget = "being-for-self:the-one:self-reference";
      break;
      
    case 'self-reference':
      quality = "absolute self-reference";
      customCharacteristics = [
        createCharacteristic("Simple Self-Reference", "The simple self-relation of being"),
        createCharacteristic("Complete Self-Identity", "Absolute identity with itself")
      ];
      description = "The One as simple existent self-reference, representing the first negation of negation.";
      transitionTarget = "being-for-self:the-one:existent-for-itself";
      break;
      
    case 'existent-for-itself':
      quality = "existent-for-itself";
      customCharacteristics = [
        createCharacteristic("Immediate Existence", "Existence that is immediately for itself"),
        createCharacteristic("Manifested Unity", "The manifestation of Being-for-Self as existent")
      ];
      description = "The One as Being-for-Self that has become an existent-for-itself, representing the externalization of Being-for-Self.";
      transitionTarget = "being-for-self:the-many:plurality";
      break;
  }
  
  return {
    id,
    type: 'being-for-self',
    category: 'the-one',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      determinate: true,
      immediate: subtype === 'existent-for-itself'
    },
    essence: {
      reflective: true,
      appearance: subtype,
      mediated: subtype !== 'existent-for-itself'
    },
    concept: {
      universal: 'being-for-self',
      particular: 'the-one',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'abstract-limit' ? "being-for-self:being-for-one:undistinguished-unity" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      NEGATION_OF_NEGATION,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Being-for-Self specific
    sublatesExistence: true,
    embodiesInfinity: true,
    achievesUnity: true,
    containsNegationOfNegation: true,
    
    // The One specific
    isNegationOfNegation: {
      firstNegation: true,
      negationOfNegation: true
    },
    
    isAbstractLimit: {
      totallyAbstract: true,
      selfLimiting: true
    },
    
    arisesInImmediacy: {
      vanishingOfInnerMeaning: true,
      manifestationOfOuterForm: subtype === 'existent-for-itself'
    },
    
    // Description
    description
  };
}

// =========================================================
// THE MANY - The plurality that emerges from The One
// =========================================================

/**
 * TheMany - The plurality that emerges from The One
 */
export interface TheMany extends BeingForSelf {
  category: 'the-many';
  subtype: TheManyType;
  
  // Specific to The Many
  emergesThrough: {
    repulsion: boolean;          // Process of repulsion
    selfDifferentiation: boolean; // Self-differentiation of The One
  };
  
  relation: {
    betweenOnes: boolean;        // Relation between many ones
    external: boolean;           // External relation
    nonReferential: boolean;     // Non-referential relation
  };
  
  // Additional properties for specific subtypes
  void?: {                       // For mutual-exclusion
    separates: boolean;          // The void separates the many
    nonBeing: boolean;           // The void is non-being
  };
}

/**
 * Create The Many
 */
export function createTheMany(
  subtype: TheManyType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
    theOneId?: string; // Reference to The One it emerges from
  } = {}
): TheMany {
  const id = options.id || `being-for-self:the-many:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'plurality':
      quality = "plural being";
      customCharacteristics = [
        createCharacteristic("Multiplicity", "The state of being multiple and distinct"),
        createCharacteristic("Generated Plurality", "Plurality generated from unity")
      ];
      description = "The Many as the plurality that emerges from The One, representing the state of multiplicity.";
      transitionTarget = "being-for-self:the-many:repelled-ones";
      break;
      
    case 'repelled-ones':
      quality = "repelled being";
      customCharacteristics = [
        createCharacteristic("Mutual Repulsion", "Repulsion between the individual ones"),
        createCharacteristic("Discrete Existence", "Each existing as discrete and separate")
      ];
      description = "The Many as repelled ones, each maintaining its distinction through mutual repulsion.";
      transitionTarget = "being-for-self:the-many:mutual-exclusion";
      break;
      
    case 'mutual-exclusion':
      quality = "exclusive being";
      customCharacteristics = [
        createCharacteristic("Negative Self-Reference", "Self-reference that is negative and exclusive"),
        createCharacteristic("Abstract Void", "The abstract void that separates the many ones")
      ];
      description = "The Many in mutual exclusion, separated by the void and maintaining their distinction through negative self-reference.";
      transitionTarget = "being-for-self:repulsion-attraction:repulsion";
      break;
  }
  
  return {
    id,
    type: 'being-for-self',
    category: 'the-many',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      determinate: true,
      immediate: false
    },
    essence: {
      reflective: true,
      appearance: subtype,
      mediated: true
    },
    concept: {
      universal: 'being-for-self',
      particular: 'the-many',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'plurality' ? "being-for-self:the-one:existent-for-itself" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Being-for-Self specific
    sublatesExistence: true,
    embodiesInfinity: true,
    achievesUnity: false, // The Many has lost the immediate unity of The One
    containsNegationOfNegation: true,
    
    // The Many specific
    emergesThrough: {
      repulsion: true,
      selfDifferentiation: true
    },
    
    relation: {
      betweenOnes: true,
      external: true,
      nonReferential: subtype === 'mutual-exclusion'
    },
    
    // Specific to mutual-exclusion subtype
    void: subtype === 'mutual-exclusion' ? {
      separates: true,
      nonBeing: true
    } : undefined,
    
    // Description
    description
  };
}

// =========================================================
// REPULSION-ATTRACTION - The dialectic of forces
// =========================================================

/**
 * RepulsionAttraction - The dialectic of repulsion and attraction
 */
export interface RepulsionAttraction extends BeingForSelf {
  category: 'repulsion-attraction';
  subtype: RepulsionAttractionType;
  
  // Specific to Repulsion-Attraction
  forces: {
    repulsive: boolean;          // Repulsive force
    attractive: boolean;         // Attractive force
    mutuallyDetermining: boolean; // Forces determine each other
  };
  
  ideality: {
    ought: boolean;              // Represents the 'ought' of ideality
    realized: boolean;           // Realizes ideality
  };
  
  // More specific properties depending on subtype
  fragmentsOne?: boolean;        // For repulsion
  bringsTogetherMany?: boolean;  // For attraction
  achievesUnityOfOpposites?: boolean; // For unity-of-forces
}

/**
 * Create Repulsion-Attraction
 */
export function createRepulsionAttraction(
  subtype: RepulsionAttractionType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): RepulsionAttraction {
  const id = options.id || `being-for-self:repulsion-attraction:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'repulsion':
      quality = "repelling force";
      customCharacteristics = [
        createCharacteristic("Fragmenting Force", "The force that fragments the one into many"),
        createCharacteristic("Ought of Ideality", "Representing the 'ought' of ideality")
      ];
      description = "Repulsion as the force that fragments the one into many, representing the 'ought' of ideality.";
      transitionTarget = "being-for-self:repulsion-attraction:attraction";
      break;
      
    case 'attraction':
      quality = "attracting force";
      customCharacteristics = [
        createCharacteristic("Unifying Force", "The force that brings many ones into one one"),
        createCharacteristic("Realized Ideality", "The realization of ideality")
      ];
      description = "Attraction as the force that brings many ones into one one, realizing ideality.";
      transitionTarget = "being-for-self:repulsion-attraction:unity-of-forces";
      break;
      
    case 'unity-of-forces':
      quality = "unified forces";
      customCharacteristics = [
        createCharacteristic("Unity of Opposition", "The unity of opposing forces"),
        createCharacteristic("Accomplished Ideality", "The accomplished ideality in unity")
      ];
      description = "The Unity of Forces as the unity of repulsion and attraction, representing the accomplished ideality of Being-for-Self.";
      transitionTarget = "quantity"; // Transitions to Quantity
      break;
  }
  
  // Determine which force properties should be true based on subtype
  const isRepulsive = subtype === 'repulsion' || subtype === 'unity-of-forces';
  const isAttractive = subtype === 'attraction' || subtype === 'unity-of-forces';
  
  return {
    id,
    type: 'being-for-self',
    category: 'repulsion-attraction',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      determinate: true,
      immediate: false
    },
    essence: {
      reflective: true,
      appearance: subtype,
      mediated: true
    },
    concept: {
      universal: 'being-for-self',
      particular: 'repulsion-attraction',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'repulsion' ? "being-for-self:the-many:mutual-exclusion" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Being-for-Self specific
    sublatesExistence: true,
    embodiesInfinity: true,
    achievesUnity: subtype === 'unity-of-forces',
    containsNegationOfNegation: true,
    
    // Repulsion-Attraction specific
    forces: {
      repulsive: isRepulsive,
      attractive: isAttractive,
      mutuallyDetermining: true
    },
    
    ideality: {
      ought: subtype === 'repulsion',
      realized: subtype === 'attraction' || subtype === 'unity-of-forces'
    },
    
    // Subtype-specific properties
    fragmentsOne: isRepulsive,
    bringsTogetherMany: isAttractive,
    achievesUnityOfOpposites: subtype === 'unity-of-forces',
    
    // Description
    description
  };
}

// =========================================================
// BEING-FOR-SELF SYSTEM - Core functionality
// =========================================================

/**
 * BeingForSelf System
 * 
 * Main class that provides functionality for working with
 * Hegelian being-for-self categories in the BEC ecosystem
 */
export class BeingForSelfSystem {
  private beingsForSelf: Map<string, BeingForSelf> = new Map();
  
  /**
   * Create a being-for-self based on category
   */
  createBeingForSelf(
    category: BeingForSelfCategory,
    subtype: BeingForSelfGeneralType | BeingForOneType | TheOneType | TheManyType | RepulsionAttractionType,
    options: any = {}
  ): BeingForSelf {
    let beingForSelf: BeingForSelf;
    
    // Create being-for-self based on category
    if (category === 'being-for-self-general') {
      beingForSelf = createBeingForSelfGeneral(subtype as BeingForSelfGeneralType, options);
    } else if (category === 'being-for-one') {
      beingForSelf = createBeingForOne(subtype as BeingForOneType, options);
    } else if (category === 'the-one') {
      beingForSelf = createTheOne(subtype as TheOneType, options);
    } else if (category === 'the-many') {
      beingForSelf = createTheMany(subtype as TheManyType, options);
    } else if (category === 'repulsion-attraction') {
      beingForSelf = createRepulsionAttraction(subtype as RepulsionAttractionType, options);
    } else {
      throw new Error(`Invalid being-for-self category: ${category}`);
    }
    
    // Store being-for-self
    this.beingsForSelf.set(beingForSelf.id, beingForSelf);
    
    return beingForSelf;
  }
  
  /**
   * Get being-for-self by ID
   */
  getBeingForSelf(id: string): BeingForSelf | undefined {
    return this.beingsForSelf.get(id);
  }
  
  /**
   * Convert being-for-self to Neo node
   */
  toNode(beingForSelf: BeingForSelf): NeoNode {
    return createNeoNode({
      id: beingForSelf.id,
      type: `being-for-self:${beingForSelf.category}:${beingForSelf.subtype}`,
      being: beingForSelf.being,
      essence: beingForSelf.essence,
      concept: beingForSelf.concept,
      properties: {
        description: beingForSelf.description,
        characteristics: beingForSelf.characteristics.map(c => c.name),
        sublatesExistence: beingForSelf.sublatesExistence,
        embodiesInfinity: beingForSelf.embodiesInfinity,
        achievesUnity: beingForSelf.achievesUnity,
        containsNegationOfNegation: beingForSelf.containsNegationOfNegation,
        
        // Category-specific properties
        ...(beingForSelf.category === 'being-for-self-general' ? {
          completes: (beingForSelf as BeingForSelfGeneral).completes,
          relationToExistence: (beingForSelf as BeingForSelfGeneral).relationToExistence
        } : {}),
        
        ...(beingForSelf.category === 'being-for-one' ? {
          isMomentOf: (beingForSelf as BeingForOne).isMomentOf,
          undistinguishedUnity: (beingForSelf as BeingForOne).undistinguishedUnity
        } : {}),
        
        ...(beingForSelf.category === 'the-one' ? {
          isNegationOfNegation: (beingForSelf as TheOne).isNegationOfNegation,
          isAbstractLimit: (beingForSelf as TheOne).isAbstractLimit,
          arisesInImmediacy: (beingForSelf as TheOne).arisesInImmediacy
        } : {}),
        
        ...(beingForSelf.category === 'the-many' ? {
          emergesThrough: (beingForSelf as TheMany).emergesThrough,
          relation: (beingForSelf as TheMany).relation,
          void: (beingForSelf as TheMany).void
        } : {}),
        
        ...(beingForSelf.category === 'repulsion-attraction' ? {
          forces: (beingForSelf as RepulsionAttraction).forces,
          ideality: (beingForSelf as RepulsionAttraction).ideality,
          fragmentsOne: (beingForSelf as RepulsionAttraction).fragmentsOne,
          bringsTogetherMany: (beingForSelf as RepulsionAttraction).bringsTogetherMany,
          achievesUnityOfOpposites: (beingForSelf as RepulsionAttraction).achievesUnityOfOpposites
        } : {})
      },
      metadata: {
        emergesFrom: beingForSelf.emergesFrom,
        transitionsTo: beingForSelf.transitionsTo
      }
    });
  }
  
  /**
   * Develop being-for-self to next category in dialectical progression
   */
  developBeingForSelf(beingForSelf: BeingForSelf): BeingForSelf | null {
    if (!beingForSelf.transitionsTo) {
      return null;
    }
    
    const [category, subtype] = beingForSelf.transitionsTo.split(':').slice(1);
    
    if (!category || !subtype) {
      return null;
    }
    
    // Handle transition to quantity
    if (category === 'quantity') {
      return null; // End of qualitative being, transition to quantity
    }
    
    // Create the next being-for-self in the dialectical progression
    return this.createBeingForSelf(
      category as BeingForSelfCategory,
      subtype as any,
      { emergesFrom: beingForSelf.id }
    );
  }
  
  /**
   * Create complete dialectical progression of being-for-self
   * from infinite being to unity-of-forces
   */
  createDialecticalProgression(): BeingForSelf[] {
    const progression: BeingForSelf[] = [];
    
    // Start with infinite being (first form of being-for-self-general)
    let current = this.createBeingForSelf('being-for-self-general', 'infinite-being');
    progression.push(current);
    
    // Develop through all forms
    while (current && current.transitionsTo) {
      // Stop if we reach quantity (transition out of being-for-self)
      if (current.transitionsTo.includes('quantity')) {
        break;
      }
      
      const next = this.developBeingForSelf(current);
      if (!next) break;
      
      progression.push(next);
      current = next;
    }
    
    return progression;
  }
  
  /**
   * Create One-Many-Repulsion triad
   */
  createOneManyRepulsionTriad(): [TheOne, TheMany, RepulsionAttraction] {
    const one = this.createBeingForSelf(
      'the-one', 
      'existent-for-itself'
    ) as TheOne;
    
    const many = this.createBeingForSelf(
      'the-many',
      'mutual-exclusion',
      { emergesFrom: one.id }
    ) as TheMany;
    
    const repulsion = this.createBeingForSelf(
      'repulsion-attraction',
      'repulsion',
      { emergesFrom: many.id }
    ) as RepulsionAttraction;
    
    return [one, many, repulsion];
  }
  
  /**
   * Create Repulsion-Attraction dialectic
   */
  createRepulsionAttractionDialectic(): [RepulsionAttraction, RepulsionAttraction, RepulsionAttraction] {
    const repulsion = this.createBeingForSelf(
      'repulsion-attraction', 
      'repulsion'
    ) as RepulsionAttraction;
    
    const attraction = this.createBeingForSelf(
      'repulsion-attraction',
      'attraction',
      { emergesFrom: repulsion.id }
    ) as RepulsionAttraction;
    
    const unity = this.createBeingForSelf(
      'repulsion-attraction',
      'unity-of-forces',
      { emergesFrom: attraction.id }
    ) as RepulsionAttraction;
    
    return [repulsion, attraction, unity];
  }
  
  /**
   * Clear all beings-for-self
   */
  clear(): void {
    this.beingsForSelf.clear();
  }
}

/**
 * Create being-for-self system
 */
export function createBeingForSelfSystem(): BeingForSelfSystem {
  return new BeingForSelfSystem();
}

export default createBeingForSelfSystem;