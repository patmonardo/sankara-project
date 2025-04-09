import { NeoNode, createNeoNode } from '../../neo/node';
import { NeoEntityId } from '../../neo/dialectic';

/**
 * Hegelian Being System
 * 
 * A TypeScript implementation of Hegel's theory of Being 
 * from his Science of Logic, representing the dialectical
 * development from pure Being through Nothing to Becoming,
 * and onwards to more determined forms of Being.
 */

// =========================================================
// BEING TYPES - The fundamental categories
// =========================================================

export type BeingCategory = 
  'pure-being' | 
  'nothing' | 
  'becoming' |
  'determinate-being' |
  'being-for-self';

export type DeterminateBeingType = 
  'quality' | 
  'reality' | 
  'negation' | 
  'something' | 
  'other' |
  'limit' |
  'finitude' |
  'infinity';

export type BeingForSelfType = 
  'one' | 
  'many' | 
  'repulsion' | 
  'attraction';

// =========================================================
// CHARACTERISTICS OF BEING
// =========================================================

/**
 * Characteristic Interface - Qualities that characterize Being
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

// Predefined characteristics of Pure Being
export const INDETERMINATENESS = createCharacteristic(
  "Indeterminateness",
  "The quality of having no determinations or distinguishing characteristics"
);

export const IMMEDIACY = createCharacteristic(
  "Immediacy",
  "The state of being direct and without mediation"
);

export const EMPTINESS = createCharacteristic(
  "Emptiness",
  "The state of containing nothing, being void of content"
);

// Equivalents to Pure Being
export const PURE_INTUITING = createCharacteristic(
  "Pure Intuiting",
  "The act of intuiting without any specific content"
);

export const EMPTY_THINKING = createCharacteristic(
  "Empty Thinking",
  "The act of thinking without any specific content or determination"
);

// =========================================================
// BEING INTERFACE - Base for all forms of Being
// =========================================================

/**
 * Being Interface - Base for all forms of Being
 */
export interface Being {
  id: string;
  type: BeingCategory;
  
  // BEC Structure - aligns with Neo infrastructure
  being: {
    quality?: string;
    determinate: boolean;
    immediate: boolean;
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
  equivalents?: Characteristic[];
  
  // Dialectical properties
  hasNoDifference?: boolean;
  isEqualToSelf?: boolean;
  isEquivalentTo?: string[];
  
  // Additional properties
  description: string;
}

// =========================================================
// PURE BEING - The most abstract form of being
// =========================================================

/**
 * Pure Being - The most abstract and indeterminate form of being
 */
export interface PureBeing extends Being {
  type: 'pure-being';
}

/**
 * Create Pure Being
 */
export function createPureBeing(options: {
  id?: string;
  characteristics?: Characteristic[];
  equivalents?: Characteristic[];
} = {}): PureBeing {
  const id = options.id || `being:pure-being:${Date.now()}`;
  
  return {
    id,
    type: 'pure-being',
    
    // BEC Structure
    being: {
      quality: 'indeterminate',
      determinate: false,
      immediate: true
    },
    essence: {
      reflective: false,
      appearance: 'pure being',
      mediated: false
    },
    concept: {
      universal: 'being',
      particular: 'pure being',
      individual: 'pure being'
    },
    
    // Dialectical relations
    transitionsTo: 'being:nothing',
    
    // Characteristics
    characteristics: options.characteristics || [
      INDETERMINATENESS,
      IMMEDIACY,
      EMPTINESS
    ],
    equivalents: options.equivalents || [
      PURE_INTUITING,
      EMPTY_THINKING
    ],
    
    // Dialectical properties
    hasNoDifference: true,
    isEqualToSelf: true,
    isEquivalentTo: ['pure-intuiting', 'empty-thinking'],
    
    // Description
    description: "Pure being, without further determination. It is the most abstract and immediate concept, devoid of any specific content or characteristics."
  };
}

// =========================================================
// NOTHING - The absolute absence of determination
// =========================================================

/**
 * Nothing - The absolute absence of determination
 */
export interface Nothing extends Being {
  type: 'nothing';
}

/**
 * Create Nothing
 */
export function createNothing(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): Nothing {
  const id = options.id || `being:nothing:${Date.now()}`;
  
  // Create characteristics specific to Nothing
  const ABSENCE = createCharacteristic(
    "Absence", 
    "The complete lack of any determinations"
  );
  
  const VOID = createCharacteristic(
    "Void",
    "The total emptiness without any content"
  );
  
  const NEGATION = createCharacteristic(
    "Negation",
    "The negative aspect that stands in relation to being"
  );
  
  return {
    id,
    type: 'nothing',
    
    // BEC Structure
    being: {
      quality: 'absence',
      determinate: false,
      immediate: true
    },
    essence: {
      reflective: false,
      appearance: 'nothing',
      mediated: false
    },
    concept: {
      universal: 'non-being',
      particular: 'nothing',
      individual: 'nothing'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || 'being:pure-being',
    transitionsTo: 'being:becoming',
    
    // Characteristics
    characteristics: options.characteristics || [
      ABSENCE,
      VOID,
      NEGATION,
      IMMEDIACY // Shared with Pure Being
    ],
    
    // Dialectical properties
    hasNoDifference: true,
    isEqualToSelf: true,
    
    // Description
    description: "Nothing, the complete absence of determination and content. It is immediate and simple, like pure being, but represents the absolute negation of all determinations."
  };
}

// =========================================================
// BECOMING - The unity of Being and Nothing
// =========================================================

/**
 * Becoming - The unity and truth of Being and Nothing
 */
export interface Becoming extends Being {
  type: 'becoming';
  movements: {
    comingToBe: boolean;
    ceasingToBe: boolean;
  };
}

/**
 * Create Becoming
 */
export function createBecoming(options: {
  id?: string;
  emergesFrom?: string;
  characteristics?: Characteristic[];
} = {}): Becoming {
  const id = options.id || `being:becoming:${Date.now()}`;
  
  // Create characteristics specific to Becoming
  const MOVEMENT = createCharacteristic(
    "Movement",
    "The restless process of transition between being and nothing"
  );
  
  const UNITY = createCharacteristic(
    "Unity",
    "The unification of being and nothing in a dynamic relation"
  );
  
  const VANISHING = createCharacteristic(
    "Vanishing",
    "The disappearing of distinctions between being and nothing"
  );
  
  return {
    id,
    type: 'becoming',
    
    // BEC Structure
    being: {
      quality: 'movement',
      determinate: true, // Now has some determination
      immediate: false  // No longer immediate
    },
    essence: {
      reflective: true, // Reflects the relation between being and nothing
      appearance: 'becoming',
      mediated: true  // Mediated by the unity of being and nothing
    },
    concept: {
      universal: 'transition',
      particular: 'becoming',
      individual: 'becoming'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || 'being:nothing',
    transitionsTo: 'being:determinate-being',
    
    // Characteristics
    characteristics: options.characteristics || [
      MOVEMENT,
      UNITY,
      VANISHING
    ],
    
    // Movements of Becoming
    movements: {
      comingToBe: true,
      ceasingToBe: true
    },
    
    // Description
    description: "Becoming, the unity and truth of being and nothing. It represents the movement and transition between being and nothing, containing both coming-to-be and ceasing-to-be as its moments."
  };
}

// =========================================================
// DETERMINATE BEING - Being with a specific quality
// =========================================================

/**
 * Determinate Being - Being with specific quality
 */
export interface DeterminateBeing extends Being {
  type: 'determinate-being';
  subtype: DeterminateBeingType;
  determination?: {
    quality: string;
    reality: boolean;
    negation: boolean;
  };
}

/**
 * Create Determinate Being
 */
export function createDeterminateBeing(
  subtype: DeterminateBeingType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
    quality?: string;
    reality?: boolean;
    negation?: boolean;
  } = {}
): DeterminateBeing {
  const id = options.id || `being:determinate-being:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  const DETERMINATENESS = createCharacteristic(
    "Determinateness",
    "Having specific qualities that distinguish it from others"
  );
  
  const FINITUDE = createCharacteristic(
    "Finitude",
    "Being limited and bounded in its existence"
  );
  
  // Customize based on subtype
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = options.quality || "";
  
  switch(subtype) {
    case 'quality':
      quality = "existent determinateness";
      customCharacteristics = [
        createCharacteristic("Qualitative Being", "Existence defined by its specific quality")
      ];
      description = "Quality as determinate being, representing the immediate unity of being with its determinateness.";
      break;
      
    case 'reality':
      quality = "affirmative existence";
      customCharacteristics = [
        createCharacteristic("Affirmative Being", "Being with positive determination")
      ];
      description = "Reality as the affirmative aspect of determinate being, representing positive determination.";
      break;
      
    case 'negation':
      quality = "negative existence";
      customCharacteristics = [
        createCharacteristic("Negative Being", "Being with negative determination")
      ];
      description = "Negation as the negative aspect of determinate being, representing negative determination.";
      break;
      
    case 'something':
      quality = "self-relating existence";
      customCharacteristics = [
        createCharacteristic("Self-Relation", "Being that relates to itself"),
        createCharacteristic("First Negation of Negation", "Being that has negated its negation")
      ];
      description = "Something as the first negation of negation, representing simple existent self-reference.";
      break;
      
    case 'other':
      quality = "relational existence";
      customCharacteristics = [
        createCharacteristic("Relation", "Being that essentially relates to something")
      ];
      description = "Other as that which stands in essential relation to something, representing the moment of difference in determinate being.";
      break;
      
    case 'limit':
      quality = "bounded existence";
      customCharacteristics = [
        createCharacteristic("Boundary", "The point where something and other meet"),
        createCharacteristic("Determination", "That which defines the nature of something")
      ];
      description = "Limit as the boundary between something and other, representing both their distinction and connection.";
      break;
      
    case 'finitude':
      quality = "limited existence";
      customCharacteristics = [
        createCharacteristic("Internal Contradiction", "The tension between existence and ceasing-to-be"),
        createCharacteristic("Ought", "The inherent striving beyond limitations")
      ];
      description = "Finitude as the explicit limitedness of determinate being, containing the internal contradiction that drives it beyond itself.";
      break;
      
    case 'infinity':
      quality = "self-transcending existence";
      customCharacteristics = [
        createCharacteristic("Self-Transcendence", "Going beyond finite limitations"),
        createCharacteristic("True Infinite", "The unity of finite and infinite")
      ];
      description = "Infinity as the self-transcendence of finitude, representing the resolution of the contradiction of finite being.";
      break;
  }
  
  return {
    id,
    type: 'determinate-being',
    subtype,
    
    // BEC Structure
    being: {
      quality,
      determinate: true,
      immediate: subtype === 'quality' || subtype === 'reality' // Only the initial forms are immediate
    },
    essence: {
      reflective: subtype !== 'quality' && subtype !== 'reality', // Later forms involve reflection
      appearance: subtype,
      mediated: subtype !== 'quality' // All but the first form are mediated
    },
    concept: {
      universal: 'determinate being',
      particular: subtype,
      individual: id.split(':').pop() || id
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'quality' ? 'being:becoming' : undefined),
    transitionsTo: subtype === 'infinity' ? 'being:being-for-self' : undefined,
    
    // Characteristics
    characteristics: [
      DETERMINATENESS,
      FINITUDE,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Determination
    determination: {
      quality,
      reality: options.reality !== undefined ? options.reality : (subtype === 'reality' || subtype === 'something'),
      negation: options.negation !== undefined ? options.negation : (subtype === 'negation' || subtype === 'other')
    },
    
    // Description
    description
  };
}

// =========================================================
// BEING-FOR-SELF - The completion of qualitative being
// =========================================================

/**
 * Being-for-self - The completion of qualitative being
 */
export interface BeingForSelf extends Being {
  type: 'being-for-self';
  subtype: BeingForSelfType;
  
  // Specific to Being-for-self
  sublatesExistence: boolean;
  embodiesInfinity: boolean;
  achievesUnity: boolean;
}

/**
 * Create Being-for-self
 */
export function createBeingForSelf(
  subtype: BeingForSelfType,
  options: {
    id?: string;
    emergesFrom?: string;
    characteristics?: Characteristic[];
  } = {}
): BeingForSelf {
  const id = options.id || `being:being-for-self:${subtype}:${Date.now()}`;
  
  // Create basic characteristics
  const INFINITY = createCharacteristic(
    "Infinity",
    "The characteristic of Being-for-itself as infinite being"
  );
  
  const NEGATION_OF_NEGATION = createCharacteristic(
    "Negation of Negation",
    "The process of double negation resulting in self-relation"
  );
  
  const UNITY = createCharacteristic(
    "Unity",
    "The simple unity with itself that characterizes Being-for-itself"
  );
  
  // Customize based on subtype
  let customCharacteristics: Characteristic[] = [];
  let description = "";
  let quality = "";
  let transitionTarget = "";
  
  switch(subtype) {
    case 'one':
      quality = "singular unity";
      customCharacteristics = [
        createCharacteristic("Abstract Limit", "The totally abstract limit of itself"),
        createCharacteristic("Simple Self-Reference", "The simple self-relation of being")
      ];
      description = "The One as the first negation of negation, representing simple existent self-reference and the abstract limit of itself.";
      transitionTarget = "being:being-for-self:many";
      break;
      
    case 'many':
      quality = "plural unity";
      customCharacteristics = [
        createCharacteristic("Plurality", "The state of multiplicity that emerges from The One"),
        createCharacteristic("Repulsion", "The process by which The One generates The Many")
      ];
      description = "The Many as the plurality that emerges from The One through the process of repulsion.";
      transitionTarget = "being:being-for-self:repulsion";
      break;
      
    case 'repulsion':
      quality = "differentiating force";
      customCharacteristics = [
        createCharacteristic("Fragmenting Force", "The force that fragments the one into many"),
        createCharacteristic("Ought of Ideality", "Representing the 'ought' of ideality")
      ];
      description = "Repulsion as the force that fragments the one into many, representing the 'ought' of ideality.";
      transitionTarget = "being:being-for-self:attraction";
      break;
      
    case 'attraction':
      quality = "unifying force";
      customCharacteristics = [
        createCharacteristic("Unifying Force", "The force that brings many ones into one one"),
        createCharacteristic("Realized Ideality", "The realization of ideality")
      ];
      description = "Attraction as the force that brings many ones into one one, realizing ideality.";
      transitionTarget = "quantity"; // Transitions out of Quality to Quantity
      break;
  }
  
  return {
    id,
    type: 'being-for-self',
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
      particular: subtype,
      individual: id.split(':').pop() || id
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || (subtype === 'one' ? 'being:determinate-being:infinity' : undefined),
    transitionsTo: transitionTarget,
    
    // Characteristics
    characteristics: [
      INFINITY,
      NEGATION_OF_NEGATION,
      UNITY,
      ...(options.characteristics || []),
      ...customCharacteristics
    ],
    
    // Specific to Being-for-self
    sublatesExistence: true,
    embodiesInfinity: true,
    achievesUnity: true,
    
    // Description
    description
  };
}

// =========================================================
// BEING SYSTEM - Core functionality
// =========================================================

/**
 * Being System
 * 
 * Main class that provides functionality for working with
 * Hegelian being categories in the BEC ecosystem
 */
export class BeingSystem {
  private beings: Map<string, Being> = new Map();
  
  /**
   * Create a being based on type
   */
  createBeing(
    type: BeingCategory,
    subtype?: DeterminateBeingType | BeingForSelfType,
    options: any = {}
  ): Being {
    let being: Being;
    
    // Create being based on type
    if (type === 'pure-being') {
      being = createPureBeing(options);
    } else if (type === 'nothing') {
      being = createNothing(options);
    } else if (type === 'becoming') {
      being = createBecoming(options);
    } else if (type === 'determinate-being' && subtype) {
      being = createDeterminateBeing(subtype as DeterminateBeingType, options);
    } else if (type === 'being-for-self' && subtype) {
      being = createBeingForSelf(subtype as BeingForSelfType, options);
    } else {
      throw new Error(`Invalid being type: ${type}${subtype ? ` with subtype: ${subtype}` : ''}`);
    }
    
    // Store being
    this.beings.set(being.id, being);
    
    return being;
  }
  
  /**
   * Get being by ID
   */
  getBeing(id: string): Being | undefined {
    return this.beings.get(id);
  }
  
  /**
   * Convert being to Neo node
   */
  toNode(being: Being): NeoNode {
    return createNeoNode({
      id: being.id,
      type: `being:${being.type}`,
      being: being.being,
      essence: being.essence,
      concept: being.concept,
      properties: {
        description: being.description,
        characteristics: being.characteristics.map(c => c.name),
        ...(being.hasNoDifference !== undefined ? { hasNoDifference: being.hasNoDifference } : {}),
        ...(being.isEqualToSelf !== undefined ? { isEqualToSelf: being.isEqualToSelf } : {}),
        ...(being.isEquivalentTo ? { isEquivalentTo: being.isEquivalentTo } : {}),
        ...('subtype' in being ? { subtype: being.subtype } : {}),
        ...('determination' in being ? { determination: (being as DeterminateBeing).determination } : {}),
        ...('movements' in being ? { movements: (being as Becoming).movements } : {}),
        ...('sublatesExistence' in being ? { sublatesExistence: (being as BeingForSelf).sublatesExistence } : {}),
      },
      metadata: {
        emergesFrom: being.emergesFrom,
        transitionsTo: being.transitionsTo
      }
    });
  }
  
  /**
   * Develop being to next category in dialectical progression
   */
  developBeing(being: Being): Being | null {
    if (!being.transitionsTo) {
      return null;
    }
    
    const [type, subtype] = being.transitionsTo.split(':').slice(1);
    
    if (!type) {
      return null;
    }
    
    // Create the next being in the dialectical progression
    return this.createBeing(
      type as BeingCategory,
      subtype as (DeterminateBeingType | BeingForSelfType),
      { emergesFrom: being.id }
    );
  }
  
  /**
   * Create entire dialectical progression from pure being to being-for-self
   */
  createDialecticalProgression(): Being[] {
    const progression: Being[] = [];
    
    // Start with pure being
    let current = this.createBeing('pure-being');
    progression.push(current);
    
    // Develop through all forms
    while (current && current.transitionsTo) {
      const next = this.developBeing(current);
      if (!next) break;
      
      progression.push(next);
      current = next;
    }
    
    return progression;
  }
  
  /**
   * Create the fundamental dialectical triad of being, nothing, and becoming
   */
  createFundamentalTriad(): [PureBeing, Nothing, Becoming] {
    const pureBeing = createPureBeing() as PureBeing;
    this.beings.set(pureBeing.id, pureBeing);
    
    const nothing = createNothing({ emergesFrom: pureBeing.id });
    this.beings.set(nothing.id, nothing);
    
    const becoming = createBecoming({ emergesFrom: nothing.id });
    this.beings.set(becoming.id, becoming);
    
    return [pureBeing, nothing, becoming];
  }
  
  /**
   * Clear all beings
   */
  clear(): void {
    this.beings.clear();
  }
}

/**
 * Create being system
 */
export function createBeingSystem(): BeingSystem {
  return new BeingSystem();
}

export default createBeingSystem;