import { NeoNode, createNeoNode } from '../../neo/entity';

/**
 * Hegelian Concept System
 * 
 * A TypeScript implementation of Hegel's theory of concept
 * from his Science of Logic, representing the dialectical
 * development from universal through particular to singular concept.
 */

// =========================================================
// CONCEPT TYPES
// =========================================================

export type ConceptType = 'universal' | 'particular' | 'singular';

export type UniversalConceptSubtype = 
  'abstract' | 'concrete' | 'absolute';

export type ParticularConceptSubtype = 
  'species' | 'variety' | 'subtype';

export type SingularConceptSubtype = 
  'individual' | 'unique' | 'this';

export type ConceptSubtype = 
  UniversalConceptSubtype | 
  ParticularConceptSubtype | 
  SingularConceptSubtype;

// =========================================================
// CONCEPT SUBSTANCES (For Universal Concept)
// =========================================================

/**
 * Substance Interface - Base for all substances
 */
export interface Substance {
  id: string;
  name: string;
  maintainsIdentityInOpposition?: boolean;
}

/**
 * Active Substance - Self-referring negativity
 */
export interface ActiveSubstance extends Substance {
  isSelfReferringNegativity: boolean;
}

/**
 * Passive Substance - Powerless to posit itself
 */
export interface PassiveSubstance extends Substance {
  isPowerlessToPositItself: boolean;
}

/**
 * Cause - Brings about an effect
 */
export interface Cause extends ActiveSubstance {
  effect?: Effect;
}

/**
 * Effect - Result of cause's action
 */
export interface Effect {
  id: string;
  name: string;
  cause?: string; // Reference to cause
}

// =========================================================
// DETERMINATENESS (For Particular Concept)
// =========================================================

/**
 * Determinateness - Quality of being determinate
 */
export interface Determinateness {
  id: string;
  name: string;
  quality: string;
  specificity: number; // 0-1 range
}

/**
 * Totality - Comprehensive whole
 */
export interface Totality {
  id: string;
  name: string;
  parts: string[]; // References to parts making up the totality
}

// =========================================================
// CONCEPT INTERFACE - Base for all concepts
// =========================================================

/**
 * Concept Interface - Base for all Hegelian concepts
 */
export interface Concept {
  // Identity
  id: string;
  name: string;
  type: ConceptType;
  subtype?: ConceptSubtype;
  
  // BEC Structure
  being: {
    quality?: string;
    determinate?: boolean;
    immediate?: boolean;
  };
  essence: {
    reflection?: boolean;
    appearance?: string;
    mediated?: boolean; // Changed from mediation to mediated
  };
  concept: {
    universal?: string;
    particular?: string;
    singular?: string;
  };
  
  // Dialectical relations
  source?: string; // Where this concept comes from
  target?: string; // Where this concept points to
  
  // Properties
  properties: Record<string, any>;
}

// =========================================================
// UNIVERSAL CONCEPT
// =========================================================

/**
 * Universal Concept
 * 
 * The absolute power and self-referring negativity that
 * differentiates itself into a relation of substances.
 */
export interface UniversalConcept extends Concept {
  type: 'universal';
  subtype?: UniversalConceptSubtype;
  
  // Specific properties of universal concept
  isAbsolutePower: boolean;
  isSelfReferringNegativity: boolean;
  
  // Relations specific to universal
  substances: {
    active?: ActiveSubstance;
    passive?: PassiveSubstance;
  };
}

/**
 * Create Universal Concept
 */
export function createUniversalConcept(
  name: string,
  options: {
    id?: string;
    subtype?: UniversalConceptSubtype;
    isAbsolutePower?: boolean;
    isSelfReferringNegativity?: boolean;
    activeSubstance?: Partial<ActiveSubstance>;
    passiveSubstance?: Partial<PassiveSubstance>;
    properties?: Record<string, any>;
  } = {}
): UniversalConcept {
  const id = options.id || `concept:universal:${Date.now()}`;
  
  // Create active substance if provided
  const activeSubstance = options.activeSubstance ? {
    id: options.activeSubstance.id || `substance:active:${Date.now()}`,
    name: options.activeSubstance.name || `${name} (Active)`,
    isSelfReferringNegativity: options.activeSubstance.isSelfReferringNegativity ?? true,
    maintainsIdentityInOpposition: options.activeSubstance.maintainsIdentityInOpposition ?? true
  } : undefined;
  
  // Create passive substance if provided
  const passiveSubstance = options.passiveSubstance ? {
    id: options.passiveSubstance.id || `substance:passive:${Date.now()}`,
    name: options.passiveSubstance.name || `${name} (Passive)`,
    isPowerlessToPositItself: options.passiveSubstance.isPowerlessToPositItself ?? true,
    maintainsIdentityInOpposition: options.passiveSubstance.maintainsIdentityInOpposition ?? true
  } : undefined;
  
  return {
    // Identity
    id,
    name,
    type: 'universal',
    subtype: options.subtype || 'abstract',
    
    // BEC Structure
    being: {
      quality: 'universal',
      determinate: false,
      immediate: true
    },
    essence: {
      reflection: true,
      appearance: 'universal form',
      mediated: false
    },
    concept: {
      universal: name,
      particular: undefined,
      singular: undefined
    },
    
    // Dialectical target - points to particular concept
    target: `concept:particular:${name.toLowerCase()}`,
    
    // Universal specific
    isAbsolutePower: options.isAbsolutePower ?? true,
    isSelfReferringNegativity: options.isSelfReferringNegativity ?? true,
    
    // Relations
    substances: {
      active: activeSubstance,
      passive: passiveSubstance
    },
    
    // Properties
    properties: {
      differentiatesItself: true,
      containsOpposites: true,
      ...options.properties
    }
  };
}

// =========================================================
// PARTICULAR CONCEPT
// =========================================================

/**
 * Particular Concept
 * 
 * The concept posited as determinate and distinct
 * from other concepts.
 */
export interface ParticularConcept extends Concept {
  type: 'particular';
  subtype?: ParticularConceptSubtype;
  
  // Specific properties of particular concept
  isDeterminate: boolean;
  isSelfDetermining: boolean;
  hasNormOfSelfIdentity: boolean;
  
  // Particular specific relations
  determinateness?: Determinateness;
  totalityReference?: Totality;
}

/**
 * Create Particular Concept
 */
export function createParticularConcept(
  name: string,
  options: {
    id?: string;
    subtype?: ParticularConceptSubtype;
    source?: string;
    isDeterminate?: boolean;
    isSelfDetermining?: boolean;
    hasNormOfSelfIdentity?: boolean;
    determinateness?: Partial<Determinateness>;
    totality?: Partial<Totality>;
    properties?: Record<string, any>;
  } = {}
): ParticularConcept {
  const id = options.id || `concept:particular:${Date.now()}`;
  
  // Create determinateness if provided
  const determinateness = options.determinateness ? {
    id: options.determinateness.id || `determinateness:${Date.now()}`,
    name: options.determinateness.name || `${name} Determinateness`,
    quality: options.determinateness.quality || 'specific',
    specificity: options.determinateness.specificity ?? 0.75
  } : undefined;
  
  // Create totality if provided
  const totality = options.totality ? {
    id: options.totality.id || `totality:${Date.now()}`,
    name: options.totality.name || `${name} Totality`,
    parts: options.totality.parts || []
  } : undefined;
  
  return {
    // Identity
    id,
    name,
    type: 'particular',
    subtype: options.subtype || 'species',
    
    // BEC Structure
    being: {
      quality: 'particular',
      determinate: true,
      immediate: false
    },
    essence: {
      reflection: true,
      appearance: 'differentiated form',
      mediated: true
    },
    concept: {
      universal: name.split(' ').pop() || name, // Extract genus
      particular: name,
      singular: undefined
    },
    
    // Dialectical relations
    source: options.source || `concept:universal:${name.toLowerCase()}`,
    target: `concept:singular:${name.toLowerCase()}`,
    
    // Particular specific
    isDeterminate: options.isDeterminate ?? true,
    isSelfDetermining: options.isSelfDetermining ?? true,
    hasNormOfSelfIdentity: options.hasNormOfSelfIdentity ?? true,
    
    // Relations
    determinateness,
    totalityReference: totality,
    
    // Properties
    properties: {
      involvesDialecticalMovement: true,
      isImmediatelySingular: false,
      ...options.properties
    }
  };
}

// =========================================================
// SINGULAR CONCEPT
// =========================================================

/**
 * Singular Concept
 * 
 * The concept reflecting itself out of difference into
 * absolute negativity, marking the transition to judgment.
 */
export interface SingularConcept extends Concept {
  type: 'singular';
  subtype?: SingularConceptSubtype;
  
  // Specific properties of singular concept
  isAbsoluteNegativity: boolean;
  isSelfReferringNegativity: boolean;
  existsForItself: boolean;
  isQualitativeOne: boolean;
  
  // Traces transformation into judgment
  transitionToJudgment?: {
    complete: boolean;
    judgmentType?: string;
  };
}

/**
 * Create Singular Concept
 */
export function createSingularConcept(
  name: string,
  options: {
    id?: string;
    subtype?: SingularConceptSubtype;
    source?: string;
    isAbsoluteNegativity?: boolean;
    isSelfReferringNegativity?: boolean;
    existsForItself?: boolean;
    isQualitativeOne?: boolean;
    isExclusive?: boolean;
    transitionToJudgment?: boolean;
    properties?: Record<string, any>;
  } = {}
): SingularConcept {
  const id = options.id || `concept:singular:${Date.now()}`;
  
  return {
    // Identity
    id,
    name,
    type: 'singular',
    subtype: options.subtype || 'individual',
    
    // BEC Structure
    being: {
      quality: 'singular',
      determinate: true,
      immediate: true
    },
    essence: {
      reflection: true,
      appearance: 'concrete individual',
      mediated: true
    },
    concept: {
      universal: name.split(' ').pop() || name, // Extract genus
      particular: name.includes(' ') ? name.substring(0, name.lastIndexOf(' ')) : name,
      singular: name
    },
    
    // Dialectical relations
    source: options.source || `concept:particular:${name.toLowerCase()}`,
    target: options.transitionToJudgment ? 'judgment:existence:positive' : undefined,
    
    // Singular specific
    isAbsoluteNegativity: options.isAbsoluteNegativity ?? true,
    isSelfReferringNegativity: options.isSelfReferringNegativity ?? true,
    existsForItself: options.existsForItself ?? true,
    isQualitativeOne: options.isQualitativeOne ?? true,
    
    // Transition to judgment
    transitionToJudgment: options.transitionToJudgment ? {
      complete: false,
      judgmentType: 'existence:positive'
    } : undefined,
    
    // Properties
    properties: {
      isExclusive: options.isExclusive ?? true,
      presupposesItself: true,
      reflectsIntoDeterminateness: true,
      ...options.properties
    }
  };
}

// =========================================================
// CONCEPT SYSTEM - Main implementation
// =========================================================

/**
 * Concept System
 * 
 * Main class that provides functionality for working with
 * Hegelian concepts in the BEC ecosystem
 */
export class ConceptSystem {
  private concepts: Map<string, Concept> = new Map();
  
  /**
   * Create a concept based on type
   */
  createConcept(
    type: ConceptType,
    name: string,
    options: any = {}
  ): Concept {
    let concept: Concept;
    
    // Create concept based on type
    if (type === 'universal') {
      concept = createUniversalConcept(name, options);
    } else if (type === 'particular') {
      concept = createParticularConcept(name, options);
    } else { // type === 'singular'
      concept = createSingularConcept(name, options);
    }
    
    // Store concept
    this.concepts.set(concept.id, concept);
    
    return concept;
  }
  
  /**
   * Get concept by ID
   */
  getConcept(id: string): Concept | undefined {
    return this.concepts.get(id);
  }
  
  /**
   * Convert concept to Neo node
   */
  toNode(concept: Concept): NeoNode {
    return createNeoNode({
      id: concept.id,
      type: `concept:${concept.type}`,
      being: concept.being,
      essence: concept.essence,
      concept: concept.concept,
      properties: {
        name: concept.name,
        subtype: concept.subtype,
        ...concept.properties
      },
      metadata: {
        source: concept.source,
        target: concept.target
      }
    });
  }
  
  /**
   * Develop concept to next form in dialectical progression
   */
  developConcept(concept: Concept): Concept | null {
    if (!concept.target) {
      return null;
    }
    
    // Extract the target concept type
    const targetParts = concept.target.split(':');
    if (targetParts.length < 2) {
      return null;
    }
    
    const targetType = targetParts[1] as ConceptType;
    
    // Create the next concept based on the current concept
    if (targetType === 'particular' && concept.type === 'universal') {
      return this.createConcept('particular', concept.name, {
        source: concept.id
      });
    } else if (targetType === 'singular' && concept.type === 'particular') {
      return this.createConcept('singular', concept.name, {
        source: concept.id
      });
    } else if (concept.target.startsWith('judgment') && concept.type === 'singular') {
      // This would transition to judgment - handled by judgment system
      const singularConcept = concept as SingularConcept;
      singularConcept.transitionToJudgment = {
        complete: true,
        judgmentType: targetParts.slice(1).join(':')
      };
      return singularConcept;
    }
    
    return null;
  }
  
  /**
   * Create full dialectical progression of a concept
   */
  createConceptProgression(name: string): Concept[] {
    const progression: Concept[] = [];
    
    // Create universal concept
    const universal = this.createConcept('universal', name) as UniversalConcept;
    progression.push(universal);
    
    // Develop to particular
    const particular = this.developConcept(universal);
    if (particular) {
      progression.push(particular);
      
      // Develop to singular
      const singular = this.developConcept(particular);
      if (singular) {
        progression.push(singular);
      }
    }
    
    return progression;
  }
  
  /**
   * Find concepts that match a specific type
   */
  findConceptsByType(type: ConceptType, subtype?: ConceptSubtype): Concept[] {
    const results: Concept[] = [];
    
    for (const concept of this.concepts.values()) {
      if (concept.type === type) {
        if (!subtype || concept.subtype === subtype) {
          results.push(concept);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Find concept by name
   */
  findConceptByName(name: string): Concept | undefined {
    for (const concept of this.concepts.values()) {
      if (concept.name.toLowerCase() === name.toLowerCase()) {
        return concept;
      }
    }
    return undefined;
  }
  
  /**
   * Create cause-effect relationship between concepts
   */
  createCausalRelation(
    cause: UniversalConcept | ActiveSubstance,
    effectName: string
  ): Effect {
    // If cause is a universal concept, use its active substance
    const causalAgent = 'substances' in cause ? 
      cause.substances.active! : 
      cause as ActiveSubstance;
    
    // Create the effect
    const effect: Effect = {
      id: `effect:${Date.now()}`,
      name: effectName,
      cause: causalAgent.id
    };
    
    // Set up as cause with effect
    const causalCause = causalAgent as Cause;
    causalCause.effect = effect;
    
    return effect;
  }
  
  /**
   * Clear all concepts
   */
  clear(): void {
    this.concepts.clear();
  }
  
  /**
   * Create a connection to the judgment system (bridging to judgment.ts)
   */
  transitionToJudgment(singularConcept: SingularConcept): { 
    conceptId: string; 
    judgmentType: string;
    complete: boolean;
  } {
    // Ensure we have a singular concept
    if (singularConcept.type !== 'singular') {
      throw new Error('Only singular concepts can transition to judgment');
    }
    
    // Mark as ready for transition
    singularConcept.transitionToJudgment = {
      complete: true,
      judgmentType: 'existence:positive'
    };
    
    // Update the concept
    this.concepts.set(singularConcept.id, singularConcept);
    
    // Return transition info for judgment system
    return {
      conceptId: singularConcept.id,
      judgmentType: 'existence:positive',
      complete: true
    };
  }
}

/**
 * Create a concept system
 */
export function createConceptSystem(): ConceptSystem {
  return new ConceptSystem();
}

export default createConceptSystem;