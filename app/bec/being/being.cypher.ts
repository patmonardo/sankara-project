import { NeoNode, createNeoNode } from '@/neo/entity';

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
   * Generate Qualitative Cypher (First-order Logic)
   * 
   * Creates Cypher queries that deal with entities and their immediate qualities.
   * These queries focus on creating and matching entities with specific properties.
   */
  generateQualitativeCypher(being: Being): string {
    if (!being) return '';
    
    // For pure being - create the most basic entity
    if (being.type === 'pure-being') {
      return `
        // Pure Being - First-order immediate creation
        CREATE (b:Being {
          id: '${being.id}',
          type: 'pure-being',
          quality: 'indeterminate',
          immediate: true,
          determinate: false
        })
        RETURN b
      `;
    }
    
    // For nothing - express absence through negation
    if (being.type === 'nothing') {
      return `
        // Nothing - First-order immediate negation
        MATCH (b:Being {id: '${being.emergesFrom}'})
        CREATE (n:Being {
          id: '${being.id}',
          type: 'nothing',
          quality: 'absence',
          immediate: true,
          determinate: false
        })
        CREATE (n)-[:EMERGES_FROM]->(b)
        RETURN n
      `;
    }
    
    // For becoming - connect being and nothing
    if (being.type === 'becoming') {
      return `
        // Becoming - First-order synthesis
        MATCH (n:Being {type: 'nothing'})
        MATCH (b:Being {type: 'pure-being'})
        CREATE (becoming:Being {
          id: '${being.id}',
          type: 'becoming',
          quality: 'movement',
          immediate: false,
          determinate: true
        })
        CREATE (becoming)-[:EMERGES_FROM]->(n)
        CREATE (becoming)-[:UNIFIES]->(b)
        CREATE (becoming)-[:UNIFIES]->(n)
        RETURN becoming
      `;
    }
    
    // For determinate being - create with specific quality
    if (being.type === 'determinate-being') {
      const det = being as DeterminateBeing;
      return `
        // Determinate Being - First-order determination
        MATCH (source:Being {id: '${being.emergesFrom}'})
        CREATE (d:Being:Determinate {
          id: '${being.id}',
          type: 'determinate-being',
          subtype: '${det.subtype}',
          quality: '${det.being.quality}',
          determinate: true,
          immediate: ${det.being.immediate}
        })
        CREATE (d)-[:EMERGES_FROM]->(source)
        RETURN d
      `;
    }
    
    // For being-for-self - create with self-reference
    if (being.type === 'being-for-self') {
      const bfs = being as BeingForSelf;
      return `
        // Being-for-self - First-order self-reference
        MATCH (source:Being {id: '${being.emergesFrom}'})
        CREATE (s:Being:ForSelf {
          id: '${being.id}',
          type: 'being-for-self',
          subtype: '${bfs.subtype}',
          quality: '${bfs.being.quality}',
          determinate: true,
          immediate: false,
          sublatesExistence: true,
          embodiesInfinity: true
        })
        CREATE (s)-[:EMERGES_FROM]->(source)
        CREATE (s)-[:REFERS_TO]->(s)
        RETURN s
      `;
    }
    
    return `// Unable to generate qualitative Cypher for being type: ${being.type}`;
  }
  
  /**
   * Generate Quantitative Cypher (Second-order Logic)
   * 
   * Creates Cypher queries that handle numerical relations, sets, and magnitudes.
   * These queries focus on counting, collecting, and quantitative operations.
   */
  generateQuantitativeCypher(beings: Being[] | Set<Being>): string {
    const beingsArray = Array.isArray(beings) ? beings : Array.from(beings);
    
    if (beingsArray.length === 0) return '';
    
    // Count entities by type
    const countByType = `
      // Quantitative Logic - Count entities by type
      MATCH (b:Being)
      WITH b.type AS type, COUNT(b) AS count
      RETURN type, count
      ORDER BY count DESC
    `;
    
    // Collect entities into a set
    const collectIntoSet = `
      // Quantitative Logic - Collect entities into a set
      MATCH (b:Being)
      WITH b.type AS type, COLLECT(b.id) AS entities
      RETURN type, entities, SIZE(entities) AS count
    `;
    
    // Find paths between entities (measuring distance)
    const pathsBetween = `
      // Quantitative Logic - Path measurements
      MATCH path = (start:Being {id: '${beingsArray[0].id}'})-[*..5]-(end:Being)
      WHERE end.id IN [${beingsArray.slice(1).map(b => `'${b.id}'`).join(', ')}]
      RETURN start.id AS from, end.id AS to, LENGTH(path) AS distance
      ORDER BY distance
    `;
    
    return `${countByType}\n\n${collectIntoSet}\n\n${pathsBetween}`;
  }
  
  /**
   * Generate Measure Cypher (Higher-order Logic)
   * 
   * Creates Cypher queries that combine qualitative and quantitative aspects.
   * These queries represent the unity of quality and quantity in concrete determinations.
   */
  generateMeasureCypher(beings: Being[]): string {
    if (!beings || beings.length === 0) return '';
    
    // Find clusters of beings with similar characteristics
    const clusterAnalysis = `
      // Measure Logic - Cluster analysis of beings
      MATCH (b:Being)
      WITH b.quality AS quality, COLLECT(b) AS beings,
           COUNT(b) AS count, AVG(b.determinate) AS determinateness
      RETURN quality, count, determinateness,
             [b IN beings | b.id] AS members
      ORDER BY count DESC
    `;
    
    // Analyze dialectical progression
    const dialecticalProgression = `
      // Measure Logic - Analyze dialectical progression
      MATCH path = (start:Being)-[:EMERGES_FROM*]->(end:Being)
      WHERE NOT (start)<-[:EMERGES_FROM]-()
      WITH path, LENGTH(path) AS depth
      RETURN [node IN NODES(path) | node.type] AS progression,
             depth AS dialecticalDistance,
             EXTRACT(n IN NODES(path) | n.quality) AS qualitativeShift
      ORDER BY depth DESC
      LIMIT 1
    `;
    
    // Unity of quality and quantity - Measure proper
    const measure = `
      // Measure Logic - Unity of quality and quantity
      MATCH (b:Being)
      WITH b.type AS type,
           COUNT(b) AS quantitative,
           COLLECT(DISTINCT b.quality) AS qualities,
           SIZE(COLLECT(DISTINCT b.quality)) AS qualitativeVariety
      RETURN type,
             quantitative,
             qualitativeVariety,
             1.0 * qualitativeVariety / quantitative AS measureRatio,
             qualities
      ORDER BY measureRatio DESC
    `;
    
    return `${clusterAnalysis}\n\n${dialecticalProgression}\n\n${measure}`;
  }
  
  /**
   * Generate the Nine Qualitative Logic Triples as Cypher pipeline
   * 
   * Creates a series of connected Cypher queries that represent the 9 dialectical triads
   * within Hegel's Qualitative Logic, each producing an (Entity,Relation,Context) triple.
   * 
   * Color coding system:
   * - RED: Immediacy (direct determination without mediation)
   * - WHITE: Mediation (reflective determination through relation)
   * - BLACK: Unity (speculative determination through concept)
   */
  generateQualitativeTriplePipeline(): { triple: string; cypher: string }[] {
    const triples: { triple: string; cypher: string }[] = [];
    
    // SECTION 1: PURE BEING
    // Triple 1: Being - Nothing - Becoming
    triples.push({
      triple: "Being-Nothing-Becoming",
      cypher: `
        // RED - Immediacy (Being) - The immediate positing
        CREATE (being:Entity {
          id: 'being',
          type: 'pure-being',
          quality: 'indeterminate',
          immediate: true
        })
        
        // WHITE - Mediation (Nothing) - The mediating negation
        CREATE (nothing:Entity {
          id: 'nothing',
          type: 'nothing',
          quality: 'absence',
          immediate: true
        })
        
        // Create relation between Being and Nothing
        CREATE (being)-[:NEGATES]->(nothing)
        CREATE (nothing)-[:NEGATES]->(being)
        
        // BLACK - Unity (Becoming) - The speculative unity
        CREATE (becoming:Context {
          id: 'becoming',
          type: 'becoming',
          quality: 'movement'
        })
        
        // Connect the context to its entities
        CREATE (becoming)-[:CONTAINS]->(being)
        CREATE (becoming)-[:CONTAINS]->(nothing)
        CREATE (becoming)-[:UNIFIES {through: 'dialectical-movement'}]->(being)
        CREATE (becoming)-[:UNIFIES {through: 'dialectical-movement'}]->(nothing)
        
        RETURN being, nothing, becoming
      `
    });
    
    // Triple 2: Coming-to-be - Ceasing-to-be - Sublation
    triples.push({
      triple: "Coming-to-be-Ceasing-to-be-Sublation",
      cypher: `
        // RED - Immediacy (Coming-to-be)
        MATCH (becoming:Context {id: 'becoming'})
        CREATE (comingToBe:Entity {
          id: 'coming-to-be', 
          type: 'coming-to-be',
          quality: 'emergence',
          direction: 'from-nothing-to-being'
        })
        
        // WHITE - Mediation (Ceasing-to-be)
        CREATE (ceasingToBe:Entity {
          id: 'ceasing-to-be',
          type: 'ceasing-to-be',
          quality: 'vanishing',
          direction: 'from-being-to-nothing'
        })
        
        // Create relation between the two moments
        CREATE (comingToBe)-[:OPPOSES]->(ceasingToBe)
        CREATE (ceasingToBe)-[:OPPOSES]->(comingToBe)
        
        // BLACK - Unity (Sublation)
        CREATE (sublation:Context {
          id: 'sublation',
          type: 'sublation',
          quality: 'preservation-through-negation'
        })
        
        // Connect context to its entities
        CREATE (sublation)-[:CONTAINS]->(comingToBe)
        CREATE (sublation)-[:CONTAINS]->(ceasingToBe)
        CREATE (sublation)-[:UNIFIES {through: 'aufhebung'}]->(comingToBe)
        CREATE (sublation)-[:UNIFIES {through: 'aufhebung'}]->(ceasingToBe)
        
        // Connect to prior triple
        CREATE (sublation)-[:EMERGES_FROM]->(becoming)
        
        RETURN comingToBe, ceasingToBe, sublation
      `
    });
    
    // Triple 3: Reality - Negation - Something
    triples.push({
      triple: "Reality-Negation-Something", 
      cypher: `
        // RED - Immediacy (Reality)
        MATCH (sublation:Context {id: 'sublation'})
        CREATE (reality:Entity {
          id: 'reality',
          type: 'reality',
          quality: 'affirmative-existence'
        })
        
        // WHITE - Mediation (Negation)
        CREATE (negation:Entity {
          id: 'negation',
          type: 'negation',
          quality: 'negative-existence'
        })
        
        // Create relation
        CREATE (reality)-[:NEGATES]->(negation)
        CREATE (negation)-[:NEGATES]->(reality)
        
        // BLACK - Unity (Something)
        CREATE (something:Context {
          id: 'something',
          type: 'something',
          quality: 'determinate-being'
        })
        
        // Connect context to entities
        CREATE (something)-[:CONTAINS]->(reality)
        CREATE (something)-[:CONTAINS]->(negation)
        CREATE (something)-[:UNIFIES {through: 'negation-of-negation'}]->(reality)
        CREATE (something)-[:UNIFIES {through: 'negation-of-negation'}]->(negation)
        
        // Connect to prior triple
        CREATE (something)-[:EMERGES_FROM]->(sublation)
        
        RETURN reality, negation, something
      `
    });
    
    // SECTION 2: DETERMINATE BEING (EXISTENCE)
    // Triple 4: Something - Other - Alteration
    triples.push({
      triple: "Something-Other-Alteration",
      cypher: `
        // RED - Immediacy (Something)
        MATCH (somethingContext:Context {id: 'something'})
        CREATE (somethingEntity:Entity {
          id: 'something-entity',
          type: 'something',
          quality: 'self-relation'
        })
        
        // WHITE - Mediation (Other)
        CREATE (other:Entity {
          id: 'other',
          type: 'other',
          quality: 'otherness'
        })
        
        // Create relation
        CREATE (somethingEntity)-[:DIFFERS_FROM]->(other)
        CREATE (other)-[:DIFFERS_FROM]->(somethingEntity)
        
        // BLACK - Unity (Alteration)
        CREATE (alteration:Context {
          id: 'alteration',
          type: 'alteration',
          quality: 'becoming-other'
        })
        
        // Connect context to entities
        CREATE (alteration)-[:CONTAINS]->(somethingEntity)
        CREATE (alteration)-[:CONTAINS]->(other)
        CREATE (alteration)-[:UNIFIES {through: 'mutual-determination'}]->(somethingEntity)
        CREATE (alteration)-[:UNIFIES {through: 'mutual-determination'}]->(other)
        
        // Connect to prior triple
        CREATE (alteration)-[:EMERGES_FROM]->(somethingContext)
        
        RETURN somethingEntity, other, alteration
      `
    });
    
    // Triple 5: Being-in-itself - Being-for-other - Determination
    triples.push({
      triple: "Being-in-itself-Being-for-other-Determination",
      cypher: `
        // RED - Immediacy (Being-in-itself)
        MATCH (alteration:Context {id: 'alteration'})
        CREATE (beingInItself:Entity {
          id: 'being-in-itself',
          type: 'being-in-itself',
          quality: 'internal-determination'
        })
        
        // WHITE - Mediation (Being-for-other)
        CREATE (beingForOther:Entity {
          id: 'being-for-other',
          type: 'being-for-other',
          quality: 'external-relation'
        })
        
        // Create relation
        CREATE (beingInItself)-[:TRANSITIONS_TO]->(beingForOther)
        CREATE (beingForOther)-[:PRESUPPOSES]->(beingInItself)
        
        // BLACK - Unity (Determination)
        CREATE (determination:Context {
          id: 'determination',
          type: 'determination',
          quality: 'specific-quality'
        })
        
        // Connect context to entities
        CREATE (determination)-[:CONTAINS]->(beingInItself)
        CREATE (determination)-[:CONTAINS]->(beingForOther)
        CREATE (determination)-[:UNIFIES {through: 'constitution'}]->(beingInItself)
        CREATE (determination)-[:UNIFIES {through: 'constitution'}]->(beingForOther)
        
        // Connect to prior triple
        CREATE (determination)-[:EMERGES_FROM]->(alteration)
        
        RETURN beingInItself, beingForOther, determination
      `
    });
    
    // Triple 6: Finitude - Limitation - Infinity
    triples.push({
      triple: "Finitude-Limitation-Infinity",
      cypher: `
        // RED - Immediacy (Finitude)
        MATCH (determination:Context {id: 'determination'})
        CREATE (finitude:Entity {
          id: 'finitude',
          type: 'finitude',
          quality: 'limited-existence'
        })
        
        // WHITE - Mediation (Limitation)
        CREATE (limitation:Entity {
          id: 'limitation',
          type: 'limitation',
          quality: 'boundary'
        })
        
        // Create relation
        CREATE (finitude)-[:CONSTRAINED_BY]->(limitation)
        CREATE (limitation)-[:DEFINES]->(finitude)
        
        // BLACK - Unity (Infinity)
        CREATE (infinity:Context {
          id: 'infinity',
          type: 'infinity',
          quality: 'self-transcending'
        })
        
        // Connect context to entities
        CREATE (infinity)-[:CONTAINS]->(finitude)
        CREATE (infinity)-[:CONTAINS]->(limitation)
        CREATE (infinity)-[:UNIFIES {through: 'self-transcendence'}]->(finitude)
        CREATE (infinity)-[:UNIFIES {through: 'self-transcendence'}]->(limitation)
        
        // Connect to prior triple
        CREATE (infinity)-[:EMERGES_FROM]->(determination)
        
        RETURN finitude, limitation, infinity
      `
    });
    
    // SECTION 3: BEING-FOR-SELF
    // Triple 7: Being-for-self - Being-for-one - Ideality
    triples.push({
      triple: "Being-for-self-Being-for-one-Ideality",
      cypher: `
        // RED - Immediacy (Being-for-self)
        MATCH (infinity:Context {id: 'infinity'})
        CREATE (beingForSelf:Entity {
          id: 'being-for-self',
          type: 'being-for-self',
          quality: 'self-relation'
        })
        
        // WHITE - Mediation (Being-for-one)
        CREATE (beingForOne:Entity {
          id: 'being-for-one',
          type: 'being-for-one',
          quality: 'self-knowing'
        })
        
        // Create relation
        CREATE (beingForSelf)-[:RELATES_TO]->(beingForOne)
        CREATE (beingForOne)-[:MOMENT_OF]->(beingForSelf)
        
        // BLACK - Unity (Ideality)
        CREATE (ideality:Context {
          id: 'ideality',
          type: 'ideality',
          quality: 'self-determining'
        })
        
        // Connect context to entities
        CREATE (ideality)-[:CONTAINS]->(beingForSelf)
        CREATE (ideality)-[:CONTAINS]->(beingForOne)
        CREATE (ideality)-[:UNIFIES {through: 'self-reference'}]->(beingForSelf)
        CREATE (ideality)-[:UNIFIES {through: 'self-reference'}]->(beingForOne)
        
        // Connect to prior triple
        CREATE (ideality)-[:EMERGES_FROM]->(infinity)
        
        RETURN beingForSelf, beingForOne, ideality
      `
    });
    
    // Triple 8: One - Many - Repulsion
    triples.push({
      triple: "One-Many-Repulsion",
      cypher: `
        // RED - Immediacy (One)
        MATCH (ideality:Context {id: 'ideality'})
        CREATE (one:Entity {
          id: 'one',
          type: 'one',
          quality: 'singular-unity'
        })
        
        // WHITE - Mediation (Many)
        CREATE (many:Entity {
          id: 'many',
          type: 'many',
          quality: 'plural-unity'
        })
        
        // Create relation
        CREATE (one)-[:GENERATES]->(many)
        CREATE (many)-[:COMPOSED_OF]->(one)
        
        // BLACK - Unity (Repulsion)
        CREATE (repulsion:Context {
          id: 'repulsion',
          type: 'repulsion',
          quality: 'differentiating-force'
        })
        
        // Connect context to entities
        CREATE (repulsion)-[:CONTAINS]->(one)
        CREATE (repulsion)-[:CONTAINS]->(many)
        CREATE (repulsion)-[:UNIFIES {through: 'differentiation'}]->(one)
        CREATE (repulsion)-[:UNIFIES {through: 'differentiation'}]->(many)
        
        // Connect to prior triple
        CREATE (repulsion)-[:EMERGES_FROM]->(ideality)
        
        RETURN one, many, repulsion
      `
    });
    
    // Triple 9: Repulsion - Attraction - Quantity (transition to next section)
    triples.push({
      triple: "Repulsion-Attraction-Quantity",
      cypher: `
        // RED - Immediacy (Repulsion as Entity)
        MATCH (repulsionContext:Context {id: 'repulsion'})
        CREATE (repulsionForce:Entity {
          id: 'repulsion-force',
          type: 'repulsion-force',
          quality: 'separating-force'
        })
        
        // WHITE - Mediation (Attraction)
        CREATE (attraction:Entity {
          id: 'attraction',
          type: 'attraction',
          quality: 'unifying-force'
        })
        
        // Create relation
        CREATE (repulsionForce)-[:OPPOSES]->(attraction)
        CREATE (attraction)-[:OPPOSES]->(repulsionForce)
        
        // BLACK - Unity (Quantity - transition to next section)
        CREATE (quantity:Context {
          id: 'quantity',
          type: 'quantity',
          quality: 'indifferent-determination'
        })
        
        // Connect context to entities
        CREATE (quantity)-[:CONTAINS]->(repulsionForce)
        CREATE (quantity)-[:CONTAINS]->(attraction)
        CREATE (quantity)-[:UNIFIES {through: 'balance-of-forces'}]->(repulsionForce)
        CREATE (quantity)-[:UNIFIES {through: 'balance-of-forces'}]->(attraction)
        
        // Connect to prior triple
        CREATE (quantity)-[:EMERGES_FROM]->(repulsionContext)
        
        RETURN repulsionForce, attraction, quantity
      `
    });
    
    return triples;
  }
  
  /**
   * Generate a complete Cypher script to create the full dialectical structure
   * linking all 9 triads in the Sphere of Quality
   */
  generateQualitativeLogicGraph(): string {
    const triples = this.generateQualitativeTriplePipeline();
    
    // Start with a clean slate
    const setup = `
      // Clear previous data
      MATCH (n) DETACH DELETE n;
      
      // Create constraint for unique IDs
      CREATE CONSTRAINT entity_id IF NOT EXISTS
      FOR (e:Entity) 
      REQUIRE e.id IS UNIQUE;
      
      CREATE CONSTRAINT context_id IF NOT EXISTS
      FOR (c:Context) 
      REQUIRE c.id IS UNIQUE;
    `;
    
    // Build the combined Cypher query
    let fullScript = setup;
    
    // Add each triple's Cypher with transaction markers
    triples.forEach((triple, index) => {
      fullScript += `
      // TRIPLE ${index + 1}: ${triple.triple}
      ${triple.cypher}
      `;
    });
    
    // Add final metadata
    fullScript += `
      // Create the overall dialectical structure metadata
      CREATE (qualitativeLogic:Structure {
        id: 'qualitative-logic',
        name: 'Hegel\'s Sphere of Quality',
        tripleCount: 9,
        description: 'The structure of Qualitative Logic from Hegel\'s Science of Logic'
      });
      
      // Connect structure to all contexts
      MATCH (c:Context)
      CREATE (qualitativeLogic)-[:CONTAINS]->(c);
      
      // Create paths showing the dialectical progression
      MATCH (c1:Context)-[:EMERGES_FROM]->(c2:Context)
      CREATE (c1)-[:DIALECTICAL_MOMENT {position: 'synthesis'}]->(c2);
    `;
    
    return fullScript;
  }
  
  /**
   * Generate BEC to MVC Transformation Protocol
   * 
   * This method implements a transformation protocol that maps Hegel's BEC 
   * (Being-Essence-Concept) structure directly to MVC (Model-View-Controller)
   * architecture patterns according to the following mapping:
   * 
   * - Being -> Model (immediate reality, data representation)
   * - Essence -> View (appearance, mediated presentation)
   * - Concept -> Controller (unity of being and essence, logical operation)
   * 
   * This follows Hegel's compulsory method as an algorithmic transformation.
   */
  generateBECtoMVCTransformation(): string {
    return `
      // BEC to MVC Transformation Protocol
      // Based on Hegel's dialectical method
      
      // =========================================================
      // PHASE 1: Establish the BEC Framework (Transcendental Form)
      // =========================================================
      
      // Create the BEC structure
      CREATE (bec:MetaStructure {
        id: 'bec-structure',
        name: 'Being-Essence-Concept',
        origin: 'Hegel\'s Science of Logic',
        description: 'The fundamental ontological structure of reality'
      });
      
      // Create the three moments of the BEC structure
      CREATE (being:BECMoment {
        id: 'being',
        name: 'Being',
        quality: 'immediacy',
        description: 'The immediate, undetermined presence'
      });
      
      CREATE (essence:BECMoment {
        id: 'essence',
        name: 'Essence',
        quality: 'reflection',
        description: 'The mediated, relational appearance'
      });
      
      CREATE (concept:BECMoment {
        id: 'concept',
        name: 'Concept',
        quality: 'universality',
        description: 'The concrete universal, unity of being and essence'
      });
      
      // Connect moments to the BEC structure
      CREATE (bec)-[:CONTAINS]->(being);
      CREATE (bec)-[:CONTAINS]->(essence);
      CREATE (bec)-[:CONTAINS]->(concept);
      
      // Establish dialectical relations
      CREATE (being)-[:TRANSITIONS_TO {through: 'negation'}]->(essence);
      CREATE (essence)-[:TRANSITIONS_TO {through: 'negation-of-negation'}]->(concept);
      CREATE (concept)-[:CONTAINS {as: 'moments'}]->(being);
      CREATE (concept)-[:CONTAINS {as: 'moments'}]->(essence);
      
      // =========================================================
      // PHASE 2: Establish the MVC Framework (Ordinary Form)
      // =========================================================
      
      // Create the MVC structure
      CREATE (mvc:MetaStructure {
        id: 'mvc-structure',
        name: 'Model-View-Controller',
        origin: 'Software Architecture',
        description: 'A software design pattern for implementing user interfaces'
      });
      
      // Create the three components of MVC
      CREATE (model:MVCComponent {
        id: 'model',
        name: 'Model',
        responsibility: 'data',
        description: 'Manages the data, logic and rules of the application'
      });
      
      CREATE (view:MVCComponent {
        id: 'view',
        name: 'View', 
        responsibility: 'presentation',
        description: 'Renders the model into a form suitable for interaction'
      });
      
      CREATE (controller:MVCComponent {
        id: 'controller',
        name: 'Controller',
        responsibility: 'logic',
        description: 'Accepts input and converts it to commands for the model or view'
      });
      
      // Connect components to the MVC structure
      CREATE (mvc)-[:CONTAINS]->(model);
      CREATE (mvc)-[:CONTAINS]->(view);
      CREATE (mvc)-[:CONTAINS]->(controller);
      
      // Establish MVC relationships
      CREATE (controller)-[:MANIPULATES]->(model);
      CREATE (controller)-[:UPDATES]->(view);
      CREATE (model)-[:NOTIFIES]->(view);
      CREATE (view)-[:RENDERS]->(model);
      
      // =========================================================
      // PHASE 3: BEC to MVC Transformation Mapping
      // =========================================================
      
      // Create the BEC-MVC transformation protocol
      CREATE (transformation:TransformationProtocol {
        id: 'bec-to-mvc',
        name: 'BEC to MVC Transformation',
        description: 'Maps Hegelian ontological structure to software architecture pattern'
      });
      
      // Connect the transformation to both frameworks
      CREATE (transformation)-[:SOURCE]->(bec);
      CREATE (transformation)-[:TARGET]->(mvc);
      
      // Create the fundamental mappings
      CREATE (being)-[:MAPS_TO {
        reason: 'Both represent immediate reality',
        properties: ['identity', 'quality', 'determination']
      }]->(model);
      
      CREATE (essence)-[:MAPS_TO {
        reason: 'Both represent mediated appearance',
        properties: ['reflection', 'manifestation', 'presentation']
      }]->(view);
      
      CREATE (concept)-[:MAPS_TO {
        reason: 'Both represent unification and logical operation',
        properties: ['universality', 'particularity', 'singularity']
      }]->(controller);
      
      // =========================================================
      // PHASE 4: Transitional Properties
      // =========================================================
      
      // Being/Model transitional properties
      MATCH (being {id: 'being'}), (model {id: 'model'})
      CREATE (properties:TransitionalProperties {
        category: 'being-model',
        properties: [
          'immediacy -> data structure',
          'quality -> attributes',
          'quantity -> collections',
          'measure -> validation',
          'determinate being -> entity'
        ]
      })
      CREATE (being)-[:HAS_TRANSITIONAL_PROPERTIES]->(properties)
      CREATE (model)-[:HAS_TRANSITIONAL_PROPERTIES]->(properties);
      
      // Essence/View transitional properties
      MATCH (essence {id: 'essence'}), (view {id: 'view'})
      CREATE (properties:TransitionalProperties {
        category: 'essence-view',
        properties: [
          'appearance -> UI component',
          'reflection -> data binding',
          'identity/difference -> styling',
          'phenomenon -> user interface',
          'actuality -> rendered output'
        ]
      })
      CREATE (essence)-[:HAS_TRANSITIONAL_PROPERTIES]->(properties)
      CREATE (view)-[:HAS_TRANSITIONAL_PROPERTIES]->(properties);
      
      // Concept/Controller transitional properties
      MATCH (concept {id: 'concept'}), (controller {id: 'controller'})
      CREATE (properties:TransitionalProperties {
        category: 'concept-controller',
        properties: [
          'universality -> abstract class/interface',
          'particularity -> concrete implementation',
          'individuality -> instance/singleton',
          'syllogism -> business logic',
          'teleology -> routing/navigation'
        ]
      })
      CREATE (concept)-[:HAS_TRANSITIONAL_PROPERTIES]->(properties)
      CREATE (controller)-[:HAS_TRANSITIONAL_PROPERTIES]->(properties);
      
      // =========================================================
      // PHASE 5: Practical Implementation Examples
      // =========================================================
      
      // Example 1: Entity definition
      CREATE (entityExample:CodeGeneration {
        id: 'entity-example',
        name: 'Entity Definition',
        description: 'An entity defined through BEC and transformed to MVC',
        becSource: 'Being with qualities: identity, properties, relations',
        mvcTarget: 'class User extends Model { id: number; name: string; }'
      })
      CREATE (transformation)-[:EXAMPLE]->(entityExample);
      
      // Example 2: Component rendering
      CREATE (componentExample:CodeGeneration {
        id: 'component-example',
        name: 'Component Rendering',
        description: 'A view component defined through BEC and transformed to MVC',
        becSource: 'Essence with appearance, form, and reflection',
        mvcTarget: 'function UserView({user}) { return <div>{user.name}</div> }'
      })
      CREATE (transformation)-[:EXAMPLE]->(componentExample);
      
      // Example 3: Business logic
      CREATE (logicExample:CodeGeneration {
        id: 'logic-example',
        name: 'Business Logic',
        description: 'Controller logic defined through BEC and transformed to MVC',
        becSource: 'Concept with universality, particularity, individual implementation',
        mvcTarget: 'class UserController { getUser(id); updateUser(user); deleteUser(id); }'
      })
      CREATE (transformation)-[:EXAMPLE]->(logicExample);
      
      // =========================================================
      // PHASE 6: Form Transformation Process
      // =========================================================
      
      // The process of transforming Form definitions to JSX using Being Triples
      CREATE (formTransformation:TransformationProcess {
        id: 'form-to-jsx',
        name: 'Form Definition to JSX',
        description: 'Process for transforming abstract form definitions to concrete JSX components'
      })
      CREATE (transformation)-[:IMPLEMENTS]->(formTransformation);
      
      // Steps in the transformation process
      CREATE (step1:TransformationStep {
        id: 'step1',
        name: 'Form Definition',
        description: 'Define form in terms of Being triples: entity-relation-context',
        example: 'UserForm: { entity: User, relations: [hasName, hasEmail], context: Authentication }'
      })
      CREATE (formTransformation)-[:STEP {order: 1}]->(step1);
      
      CREATE (step2:TransformationStep {
        id: 'step2',
        name: 'Essence Extraction',
        description: 'Extract the appearance aspects from the Being definition',
        example: 'formFields: [nameField, emailField], validation: [required, email]'
      })
      CREATE (formTransformation)-[:STEP {order: 2}]->(step2);
      
      CREATE (step3:TransformationStep {
        id: 'step3',
        name: 'Conceptual Integration',
        description: 'Apply controller logic and event handling',
        example: 'onSubmit, validation, state management, error handling'
      })
      CREATE (formTransformation)-[:STEP {order: 3}]->(step3);
      
      CREATE (step4:TransformationStep {
        id: 'step4',
        name: 'JSX Generation',
        description: 'Generate the final JSX component with full MVC integration',
        example: '<Form onSubmit={handleSubmit}><Input name="email" /></Form>'
      })
      CREATE (formTransformation)-[:STEP {order: 4}]->(step4);
      
      // =========================================================
      // PHASE 7: Return useful information about the transformation
      // =========================================================
      
      // Return a summary of the transformation
      MATCH (bec:MetaStructure {id: 'bec-structure'})-[:CONTAINS]->(becMoment:BECMoment),
            (becMoment)-[:MAPS_TO]->(mvcComponent:MVCComponent)
      RETURN becMoment.name AS BEC_Moment, 
             mvcComponent.name AS MVC_Component,
             [(becMoment)-[r:MAPS_TO]->(mvcComponent) | r.reason] AS Mapping_Reason,
             [(becMoment)-[r:MAPS_TO]->(mvcComponent) | r.properties] AS Shared_Properties;
    `;
  }
  
  /**
   * Generate Transpilation between Transcendental and Ordinary Forms
   * 
   * Creates a Cypher query that maps Hegelian dialectical structures
   * to ordinary form structures (like database schemas)
   * 
   * Maps:
   * - Entity (RED/Immediacy) → Table/Model
   * - Relation (WHITE/Mediation) → Relationship/Association
   * - Context (BLACK/Unity) → Schema/Domain
   */
  generateTranscendentalToOrdinaryMapping(): string {
    return `
      // Map Hegelian Entities to Database Tables
      MATCH (e:Entity)
      WHERE e.type IN ['something', 'being-in-itself', 'finitude', 'one']
      CREATE (table:OrdinaryForm:Table {
        name: CASE 
          WHEN e.type = 'something' THEN 'entity'
          WHEN e.type = 'being-in-itself' THEN 'attribute'
          WHEN e.type = 'finitude' THEN 'constraint' 
          WHEN e.type = 'one' THEN 'instance'
          ELSE e.type
        END,
        sourceConceptId: e.id,
        properties: {
          hasIdentity: true,
          hasAttributes: true,
          isInstantiable: true
        }
      })
      CREATE (e)-[:TRANSLATED_TO {method: 'transcendental-to-ordinary'}]->(table);
      
      // Map Hegelian Relations to Database Relationships
      MATCH (e1:Entity)-[r:NEGATES|OPPOSES|DIFFERS_FROM|TRANSITIONS_TO|GENERATES]->(e2:Entity)
      CREATE (rel:OrdinaryForm:Relationship {
        name: CASE type(r)
          WHEN 'NEGATES' THEN 'excludes'
          WHEN 'OPPOSES' THEN 'inverse_of'
          WHEN 'DIFFERS_FROM' THEN 'distinct_from'
          WHEN 'TRANSITIONS_TO' THEN 'references'
          WHEN 'GENERATES' THEN 'has_many'
          ELSE type(r)
        END,
        sourceConceptId: id(r),
        cardinality: CASE type(r)
          WHEN 'GENERATES' THEN 'one_to_many'
          ELSE 'many_to_many'
        END
      })
      CREATE (rel)-[:CONNECTS]->(e1)
      CREATE (rel)-[:CONNECTS]->(e2);
      
      // Map Hegelian Contexts to Database Schemas
      MATCH (c:Context)
      CREATE (schema:OrdinaryForm:Schema {
        name: c.type,
        sourceConceptId: c.id,
        description: 'Generated from dialectical concept: ' + c.type
      })
      CREATE (c)-[:TRANSLATED_TO {method: 'transcendental-to-ordinary'}]->(schema)
      
      // Connect schema to its tables (entities contained in context)
      MATCH (c:Context)-[:CONTAINS]->(e:Entity)-[:TRANSLATED_TO]->(table:Table),
            (c)-[:TRANSLATED_TO]->(schema:Schema)
      CREATE (schema)-[:CONTAINS]->(table);
      
      // Return transformed structures
      MATCH (schema:OrdinaryForm:Schema)-[:CONTAINS]->(table:OrdinaryForm:Table)
      RETURN schema.name AS schema, collect(table.name) AS tables
    `;
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