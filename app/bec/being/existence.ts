import { NeoNode, createNeoNode } from '../../neo/entity';
import { Being, BeingCategory, Characteristic, createCharacteristic } from './being';

/**
 * Hegelian Existence System
 * 
 * A TypeScript implementation of Hegel's theory of Existence (Dasein)
 * from his Science of Logic, representing determinate being with
 * its existent determinateness (quality), characterized by opposition,
 * alterability, and finitude.
 */

// =========================================================
// EXISTENCE TYPES - The categories of existence
// =========================================================

export type ExistenceCategory = 
  'existence-as-such' | 
  'something-other' | 
  'finitude' |
  'infinity';

export type ExistenceAsSuchType = 
  'quality' | 
  'reality' | 
  'negation';

export type SomethingOtherType = 
  'something' | 
  'other' | 
  'determination' | 
  'constitution' | 
  'limit';

export type FinitudeType = 
  'restriction' | 
  'ought' | 
  'transition';

export type InfinityType =
  'bad-infinite' | 
  'alternating-determination' | 
  'affirmative-infinite';

// =========================================================
// CHARACTERISTICS OF EXISTENCE
// =========================================================

// Predefined characteristics of Existence
export const DETERMINATENESS = createCharacteristic(
  "Determinateness",
  "The quality of having specific qualities that distinguish it from others"
);

export const QUALITY = createCharacteristic(
  "Quality",
  "The existent determinateness that characterizes Existence and enables opposition to others"
);

export const LIMITATION = createCharacteristic(
  "Limitation",
  "The boundary or restriction that defines and constrains existence"
);

export const FINITUDE = createCharacteristic(
  "Finitude",
  "Being limited and bounded in its existence"
);

export const ALTERABILITY = createCharacteristic(
  "Alterability",
  "The capacity to change and be affected by other existences"
);

export const OPPOSITION = createCharacteristic(
  "Opposition",
  "The relation of contrast and difference to other existences"
);

// =========================================================
// EXISTENCE INTERFACE - Base for all forms of existence
// =========================================================

/**
 * Existence Interface - Base for all forms of Existence
 */
export interface Existence extends Being {
  category: ExistenceCategory;
  subtype: string; // Added subtype property to base interface
  
  // Additional properties specific to existence
  hasDeterminateness: boolean;
  isOpposedToOthers: boolean;
  isAlterable: boolean;
  isFinite: boolean;
}

// =========================================================
// EXISTENCE AS SUCH - The most basic form of existence
// =========================================================

/**
 * ExistenceAsSuch - The first major division of existence
 */
export interface ExistenceAsSuch extends Existence {
  category: 'existence-as-such';
  subtype: ExistenceAsSuchType;
  
  // Specific to existence-as-such
  form?: {
    immediateUnity: boolean; // Unity of being and nothing
    simpleUnity: boolean;    // Simple rather than complex
  };
  
  quality?: {
    determinate: boolean;    // Has determinate quality
    existent: boolean;       // Quality is in the form of being
    simple: boolean;         // Quality is totally simple
    immediate: boolean;      // Quality is immediate
  };
}

/**
 * Create ExistenceAsSuch
 */
export function createExistenceAsSuch(
  subtype: ExistenceAsSuchType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): ExistenceAsSuch {
  const id = options.id || `existence:existence-as-such:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'quality':
      quality = "existent determinateness";
      customCharacteristics = [
        createCharacteristic("Existent Determinateness", "Determinateness in the form of being"),
        createCharacteristic("Simple Immediacy", "The quality of being simple and immediate")
      ];
      description = "Quality as existent determinateness, representing the immediate unity of being with its determinateness.";
      transitionTarget = "existence:existence-as-such:reality";
      break;
      
    case 'reality':
      quality = "affirmative existence";
      customCharacteristics = [
        createCharacteristic("Affirmative Being", "Being with positive determination")
      ];
      description = "Reality as the affirmative aspect of existence, representing positive determination.";
      transitionTarget = "existence:existence-as-such:negation";
      break;
      
    case 'negation':
      quality = "negative existence";
      customCharacteristics = [
        createCharacteristic("Negative Being", "Being with negative determination")
      ];
      description = "Negation as the negative aspect of existence, representing negative determination.";
      transitionTarget = "existence:something-other:something";
      break;
  }
  
  return {
    id,
    type: 'determinate-being', // Existence is a form of determinate being
    category: 'existence-as-such',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      determinate: true,
      immediate: subtype === 'quality'
    },
    essence: {
      reflective: subtype === 'negation',
      appearance: subtype,
      mediated: subtype !== 'quality'
    },
    concept: {
      universal: 'existence',
      particular: 'existence-as-such',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || "being:becoming",
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      DETERMINATENESS,
      QUALITY,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Existence specific
    hasDeterminateness: true,
    isOpposedToOthers: subtype !== 'quality',
    isAlterable: false,
    isFinite: false,
    
    // Form-specific properties
    form: {
      immediateUnity: true,
      simpleUnity: true
    },
    
    // Quality-specific properties
    quality: {
      determinate: true,
      existent: true,
      simple: true,
      immediate: subtype === 'quality'
    },
    
    // Description
    description
  };
}

// =========================================================
// SOMETHING-OTHER - The second division of existence
// =========================================================

/**
 * SomethingOther - The dialectic of something and other
 */
export interface SomethingOther extends Existence {
  category: 'something-other';
  subtype: SomethingOtherType;
  
  // Specific to something-other
  beingInItself?: {
    selfReferential: boolean;    // Self-referring aspect
    intrinsic: boolean;          // Intrinsic nature
    preserved: boolean;          // Preserved in relation
  };
  
  beingForOther?: {
    relational: boolean;         // Relation to others
    external: boolean;           // External facing
    mutable: boolean;            // Subject to change
  };
  
  // More specific properties depending on subtype
  selfRelation?: boolean;        // For something
  negationOfNegation?: boolean;  // For something
  relation?: {                   // For limit
    connects: boolean;           // Connects something and other
    separates: boolean;          // Separates something and other
    unifies: boolean;            // Unifies determination and constitution
  };
}

/**
 * Create SomethingOther
 */
export function createSomethingOther(
  subtype: SomethingOtherType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
    otherEntityId?: string;      // Reference to an "other" entity
  } = {}
): SomethingOther {
  const id = options.id || `existence:something-other:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'something':
      quality = "self-relating existence";
      customCharacteristics = [
        createCharacteristic("Self-Relation", "Being that relates to itself"),
        createCharacteristic("First Negation of Negation", "Being that has negated its negation")
      ];
      description = "Something as the first negation of negation, representing simple existent self-reference.";
      transitionTarget = "existence:something-other:other";
      break;
      
    case 'other':
      quality = "relational existence";
      customCharacteristics = [
        createCharacteristic("Relation", "Being that essentially relates to something")
      ];
      description = "Other as that which stands in essential relation to something, representing the moment of difference in existence.";
      transitionTarget = "existence:something-other:determination";
      break;
      
    case 'determination':
      quality = "intrinsic nature";
      customCharacteristics = [
        createCharacteristic("Intrinsic Quality", "The quality by which something abides in its existence"),
        createCharacteristic("Self-Preservation", "Enables something to preserve itself in relation to other")
      ];
      description = "Determination as the intrinsic nature of something, the quality by which it abides in its existence.";
      transitionTarget = "existence:something-other:constitution";
      break;
      
    case 'constitution':
      quality = "external relatedness";
      customCharacteristics = [
        createCharacteristic("External Relation", "The aspect of something exposed to external influences"),
        createCharacteristic("Alterability", "The capacity to change while maintaining determination")
      ];
      description = "Constitution as the aspect of something that is caught up in external relationships and influences.";
      transitionTarget = "existence:something-other:limit";
      break;
      
    case 'limit':
      quality = "bounded existence";
      customCharacteristics = [
        createCharacteristic("Boundary", "The point where something and other meet"),
        createCharacteristic("Unifying Principle", "Unifies determination and constitution")
      ];
      description = "Limit as the boundary between something and other, representing both their distinction and connection.";
      transitionTarget = "existence:finitude:restriction";
      break;
  }
  
  return {
    id,
    type: 'determinate-being', // Existence is a form of determinate being
    category: 'something-other',
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
      universal: 'existence',
      particular: 'something-other',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'something' ? "existence:existence-as-such:negation" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      DETERMINATENESS,
      QUALITY,
      OPPOSITION,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Existence specific
    hasDeterminateness: true,
    isOpposedToOthers: true,
    isAlterable: subtype === 'constitution' || subtype === 'limit',
    isFinite: subtype === 'limit',
    
    // Something-Other specific properties
    beingInItself: {
      selfReferential: subtype === 'something' || subtype === 'determination',
      intrinsic: subtype === 'determination',
      preserved: subtype !== 'other'
    },
    
    beingForOther: {
      relational: subtype === 'other' || subtype === 'constitution',
      external: subtype === 'constitution' || subtype === 'limit',
      mutable: subtype === 'constitution'
    },
    
    // Subtype-specific properties
    selfRelation: subtype === 'something',
    negationOfNegation: subtype === 'something',
    relation: subtype === 'limit' ? {
      connects: true,
      separates: true,
      unifies: true
    } : undefined,
    
    // Description
    description
  };
}

// =========================================================
// FINITUDE - The third division of existence
// =========================================================

/**
 * Finitude - The dialectic of restriction and ought
 */
export interface Finitude extends Existence {
  category: 'finitude';
  subtype: FinitudeType;
  
  // Specific to finitude
  inherentContradiction: {
    betweenExistenceAndCeasing: boolean;  // Contradiction between existence and ceasing-to-be
    betweenRestrictionAndOught: boolean;  // Contradiction between restriction and ought
  };
  
  // More specific properties depending on subtype
  restriction?: {
    definesLimitation: boolean;         // Defines specific limitations
    impliesOught: boolean;              // Implies the ought
  };
  
  ought?: {
    impliesPotential: boolean;          // Implies potential beyond restrictions
    pointsToTranscendence: boolean;     // Points toward transcendence
  };
  
  transition?: {
    toInfinity: boolean;                // Transition toward infinity
    selfTranscending: boolean;          // Self-transcending process
  };
}

/**
 * Create Finitude
 */
export function createFinitude(
  subtype: FinitudeType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): Finitude {
  const id = options.id || `existence:finitude:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'restriction':
      quality = "limited existence";
      customCharacteristics = [
        createCharacteristic("Specific Limitation", "The specific boundary that defines a finite entity"),
        createCharacteristic("Implied Ought", "Implies what lies beyond the restriction")
      ];
      description = "Restriction as the specific limitation of a finite entity, defining its boundaries.";
      transitionTarget = "existence:finitude:ought";
      break;
      
    case 'ought':
      quality = "potential existence";
      customCharacteristics = [
        createCharacteristic("Potential Beyond", "What a finite entity should be or become"),
        createCharacteristic("Tension", "Tension between current state and potential state")
      ];
      description = "The Ought as what a finite entity should be or become, implying a tension between current state and potential state.";
      transitionTarget = "existence:finitude:transition";
      break;
      
    case 'transition':
      quality = "self-transcending existence";
      customCharacteristics = [
        createCharacteristic("Self-Transcendence", "Process of overcoming finite limitations"),
        createCharacteristic("Movement to Infinity", "The dialectical movement towards infinity")
      ];
      description = "The Transition of finite entities driven by their internal contradictions towards infinity.";
      transitionTarget = "existence:infinity:bad-infinite";
      break;
  }
  
  return {
    id,
    type: 'determinate-being', // Existence is a form of determinate being
    category: 'finitude',
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
      universal: 'existence',
      particular: 'finitude',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'restriction' ? "existence:something-other:limit" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      DETERMINATENESS,
      QUALITY,
      FINITUDE,
      LIMITATION,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Existence specific
    hasDeterminateness: true,
    isOpposedToOthers: true,
    isAlterable: true,
    isFinite: true,
    
    // Finitude specific
    inherentContradiction: {
      betweenExistenceAndCeasing: true,
      betweenRestrictionAndOught: subtype === 'ought' || subtype === 'transition'
    },
    
    // Subtype-specific properties
    restriction: subtype === 'restriction' ? {
      definesLimitation: true,
      impliesOught: true
    } : undefined,
    
    ought: subtype === 'ought' ? {
      impliesPotential: true,
      pointsToTranscendence: true
    } : undefined,
    
    transition: subtype === 'transition' ? {
      toInfinity: true,
      selfTranscending: true
    } : undefined,
    
    // Description
    description
  };
}

// =========================================================
// INFINITY - The fourth division of existence
// =========================================================

/**
 * Infinity - The dialectic resulting from finitude
 */
export interface Infinity extends Existence {
  category: 'infinity';
  subtype: InfinityType;
  
  // Specific to infinity
  relation: {
    toFinite: boolean;             // Relation to the finite
    selfRelation: boolean;         // Self-relation
  };
  
  // More specific properties depending on subtype
  badInfinite?: {
    endlessProgression: boolean;   // Endless progression or regress
    oppositionalToFinite: boolean; // Merely opposed to the finite
  };
  
  alternatingDetermination?: {
    mutualDefinition: boolean;     // Mutual definition with finite
    transitionBetween: boolean;    // Transition between finite and infinite
  };
  
  affirmativeInfinite?: {
    concreteUnity: boolean;        // Concrete unity of finite and infinite
    selfDetermined: boolean;       // Self-determined and self-related
    dialecticalResolution: boolean; // Resolution of dialectic
  };
}

/**
 * Create Infinity
 */
export function createInfinity(
  subtype: InfinityType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): Infinity {
  const id = options.id || `existence:infinity:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'bad-infinite':
      quality = "endless existence";
      customCharacteristics = [
        createCharacteristic("Endless Progression", "Indefinite sequence without resolution"),
        createCharacteristic("Opposition to Finite", "Defined merely in opposition to the finite")
      ];
      description = "The Bad Infinite as an endless progression or regress, defined merely in opposition to the finite.";
      transitionTarget = "existence:infinity:alternating-determination";
      break;
      
    case 'alternating-determination':
      quality = "dialectical existence";
      customCharacteristics = [
        createCharacteristic("Mutual Definition", "The mutual definition of finite and infinite"),
        createCharacteristic("Dialectical Transition", "The transition of each into the other")
      ];
      description = "Alternating Determination as the mutual definition and transition between the finite and infinite.";
      transitionTarget = "existence:infinity:affirmative-infinite";
      break;
      
    case 'affirmative-infinite':
      quality = "true infinite existence";
      customCharacteristics = [
        createCharacteristic("Concrete Unity", "The concrete unity of finite and infinite"),
        createCharacteristic("Self-Determination", "Self-determined and self-related totality"),
        createCharacteristic("Dialectical Resolution", "Resolution of the dialectic of finite and infinite")
      ];
      description = "The Affirmative Infinite as the true resolution of the dialectic between finite and infinite, representing a self-related, concrete totality.";
      transitionTarget = "being:being-for-self:one";
      break;
  }
  
  return {
    id,
    type: 'determinate-being', // Existence is a form of determinate being
    category: 'infinity',
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
      universal: 'existence',
      particular: 'infinity',
      individual: subtype
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'bad-infinite' ? "existence:finitude:transition" : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      DETERMINATENESS,
      QUALITY,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Existence specific
    hasDeterminateness: true,
    isOpposedToOthers: subtype !== 'affirmative-infinite',
    isAlterable: subtype !== 'affirmative-infinite',
    isFinite: false,
    
    // Infinity specific
    relation: {
      toFinite: true,
      selfRelation: subtype === 'affirmative-infinite'
    },
    
    // Subtype-specific properties
    badInfinite: subtype === 'bad-infinite' ? {
      endlessProgression: true,
      oppositionalToFinite: true
    } : undefined,
    
    alternatingDetermination: subtype === 'alternating-determination' ? {
      mutualDefinition: true,
      transitionBetween: true
    } : undefined,
    
    affirmativeInfinite: subtype === 'affirmative-infinite' ? {
      concreteUnity: true,
      selfDetermined: true,
      dialecticalResolution: true
    } : undefined,
    
    // Description
    description
  };
}

// =========================================================
// EXISTENCE SYSTEM - Core functionality
// =========================================================

/**
 * Existence System
 * 
 * Main class that provides functionality for working with
 * Hegelian existence categories in the BEC ecosystem
 */
export class ExistenceSystem {
  private existences: Map<string, Existence> = new Map();
  
  /**
   * Create an existence based on category
   */
  createExistence(
    category: ExistenceCategory,
    subtype: ExistenceAsSuchType | SomethingOtherType | FinitudeType | InfinityType,
    options: any = {}
  ): Existence {
    let existence: Existence;
    
    // Create existence based on category
    if (category === 'existence-as-such') {
      existence = createExistenceAsSuch(subtype as ExistenceAsSuchType, options);
    } else if (category === 'something-other') {
      existence = createSomethingOther(subtype as SomethingOtherType, options);
    } else if (category === 'finitude') {
      existence = createFinitude(subtype as FinitudeType, options);
    } else if (category === 'infinity') {
      existence = createInfinity(subtype as InfinityType, options);
    } else {
      throw new Error(`Invalid existence category: ${category}`);
    }
    
    // Store existence
    this.existences.set(existence.id, existence);
    
    return existence;
  }
  
  /**
   * Get existence by ID
   */
  getExistence(id: string): Existence | undefined {
    return this.existences.get(id);
  }
  
  /**
   * Convert existence to Neo node
   */
  toNode(existence: Existence): NeoNode {
    return createNeoNode({
      id: existence.id,
      type: `existence:${existence.category}:${existence.subtype}`,
      being: existence.being,
      essence: existence.essence,
      concept: existence.concept,
      properties: {
        description: existence.description,
        characteristics: existence.characteristics.map(c => c.name),
        hasDeterminateness: existence.hasDeterminateness,
        isOpposedToOthers: existence.isOpposedToOthers,
        isAlterable: existence.isAlterable,
        isFinite: existence.isFinite,
        
        // Category-specific properties
        ...(existence.category === 'existence-as-such' ? {
          form: (existence as ExistenceAsSuch).form,
          quality: (existence as ExistenceAsSuch).quality
        } : {}),
        
        ...(existence.category === 'something-other' ? {
          beingInItself: (existence as SomethingOther).beingInItself,
          beingForOther: (existence as SomethingOther).beingForOther,
          selfRelation: (existence as SomethingOther).selfRelation,
          negationOfNegation: (existence as SomethingOther).negationOfNegation,
          relation: (existence as SomethingOther).relation
        } : {}),
        
        ...(existence.category === 'finitude' ? {
          inherentContradiction: (existence as Finitude).inherentContradiction,
          restriction: (existence as Finitude).restriction,
          ought: (existence as Finitude).ought,
          transition: (existence as Finitude).transition
        } : {}),
        
        ...(existence.category === 'infinity' ? {
          relation: (existence as Infinity).relation,
          badInfinite: (existence as Infinity).badInfinite,
          alternatingDetermination: (existence as Infinity).alternatingDetermination,
          affirmativeInfinite: (existence as Infinity).affirmativeInfinite
        } : {})
      },
      metadata: {
        emergesFrom: existence.emergesFrom,
        transitionsTo: existence.transitionsTo
      }
    });
  }
  
  /**
   * Develop existence to next category in dialectical progression
   */
  developExistence(existence: Existence): Existence | null {
    if (!existence.transitionsTo) {
      return null;
    }
    
    const [category, subtype] = existence.transitionsTo.split(':').slice(1);
    
    if (!category || !subtype) {
      return null;
    }
    
    // Create the next existence in the dialectical progression
    return this.createExistence(
      category as ExistenceCategory,
      subtype as any,
      { emergesFrom: existence.id }
    );
  }
  
  /**
   * Create complete dialectical progression of existence
   * from quality to affirmative infinity
   */
  createDialecticalProgression(): Existence[] {
    const progression: Existence[] = [];
    
    // Start with quality (existence-as-such)
    let current = this.createExistence('existence-as-such', 'quality');
    progression.push(current);
    
    // Develop through all forms
    while (current && current.transitionsTo) {
      const next = this.developExistence(current);
      if (!next) break;
      
      // Stop if we reach being-for-self (transition out of existence)
      if (next.transitionsTo?.includes('being:being-for-self')) {
        progression.push(next);
        break;
      }
      
      progression.push(next);
      current = next;
    }
    
    return progression;
  }
  
  /**
   * Create a specific dialectical progression within existence
   */
  createSpecificProgression(startCategory: ExistenceCategory, startSubtype: string): Existence[] {
    const progression: Existence[] = [];
    
    // Start with specified category and subtype
    let current = this.createExistence(
      startCategory,
      startSubtype as any
    );
    progression.push(current);
    
    // Develop through all forms
    while (current && current.transitionsTo) {
      const next = this.developExistence(current);
      if (!next) break;
      
      // Stop if we reach being-for-self (transition out of existence)
      if (next.transitionsTo?.includes('being:being-for-self')) {
        progression.push(next);
        break;
      }
      
      progression.push(next);
      current = next;
    }
    
    return progression;
  }
  
  /**
   * Create SomethingOther pair
   */
  createSomethingOtherPair(): { 
    something: SomethingOther, 
    other: SomethingOther 
  } {
    // Create Something
    const something = this.createExistence(
      'something-other', 
      'something'
    ) as SomethingOther;
    
    // Create Other with reference to Something
    const other = this.createExistence(
      'something-other',
      'other',
      {
        emergesFrom: something.id,
        otherEntityId: something.id
      }
    ) as SomethingOther;
    
    return { something, other };
  }
  
  /**
   * Clear all existences
   */
  clear(): void {
    this.existences.clear();
  }
}

/**
 * Create existence system
 */
export function createExistenceSystem(): ExistenceSystem {
  return new ExistenceSystem();
}

export default createExistenceSystem;