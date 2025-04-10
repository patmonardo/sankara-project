import { NeoNode, createNeoNode } from '../../neo/entity';
import { NeoEntityId } from '../../neo/extension';
import { Judgment } from './judgment';
import { Concept } from './concept';

/**
 * Hegelian Syllogism System
 * 
 * A TypeScript implementation of Hegel's theory of syllogism
 * from his Science of Logic, representing the dialectical
 * development from syllogism of existence through reflection
 * and necessity to the fully developed concept.
 */

// =========================================================
// SYLLOGISM TYPES - The three major forms of syllogism
// =========================================================

export type SyllogismType = 
  'existence' | 
  'reflection' | 
  'necessity';

export type SyllogismOfExistenceSubtype = 
  'first-figure' | 'second-figure' | 'third-figure' | 'fourth-figure';

export type SyllogismOfReflectionSubtype = 
  'allness' | 'induction' | 'analogy';

export type SyllogismOfNecessitySubtype = 
  'categorical' | 'hypothetical' | 'disjunctive';

export type SyllogismSubtype = 
  SyllogismOfExistenceSubtype | 
  SyllogismOfReflectionSubtype | 
  SyllogismOfNecessitySubtype;

// =========================================================
// SYLLOGISM TERMS - Major, Minor, and Middle
// =========================================================

/**
 * Term interface - represents a term in a syllogism
 */
export interface Term {
  id: string;
  content: string;
  role: 'major' | 'minor' | 'middle';
  
  // BEC Structure
  being: {
    quality?: string;
    immediate?: boolean;
    determinate?: boolean;
  };
  essence: {
    reflection?: boolean;
    mediation?: boolean;
    appearance?: string;
  };
  concept: {
    universal?: boolean;
    particular?: boolean;
    singular?: boolean;
  };
}

// =========================================================
// SYLLOGISTIC FORMS - The logical forms of inference
// =========================================================

/**
 * Figure - Represents the arrangement of terms in a syllogism
 */
export interface Figure {
  id: string;
  name: string;
  structure: string; // Logical structure (e.g., "S-P-U" for first figure)
  property: string;  // Key property of this figure
  dialecticalSignificance: string;
}

/**
 * Premiss - Represents a premiss in a syllogism
 */
export interface Premiss {
  id: string;
  termMajor: Term;
  termMinor: Term;
  copula: string;
  judgmentRef?: string; // Reference to a judgment if available
}

/**
 * Conclusion - Represents the conclusion of a syllogism
 */
export interface Conclusion {
  id: string;
  termMajor: Term;
  termMinor: Term;
  copula: string;
  necessity: number; // 0-1 scale of necessity
  judgmentRef?: string; // Reference to a judgment if available
}

// =========================================================
// SYLLOGISM INTERFACE - Base interface for all syllogisms
// =========================================================

export interface Syllogism {
  id: string;
  type: SyllogismType;
  subtype: SyllogismSubtype;
  
  // Components
  figure: Figure;
  premissMajor: Premiss;
  premissMinor: Premiss;
  conclusion: Conclusion;
  middleTerm: Term;
  
  // BEC Structure
  being: {
    immediate?: boolean;
    determinate?: boolean;
    quality?: string;
  };
  essence: {
    reflective?: boolean;
    mediated?: boolean;
    appearance?: string;
  };
  concept: {
    universal?: string;
    particular?: string;
    individual?: string;
  };
  
  // Dialectical relations
  emergesFrom?: string;
  pointsTowards?: string;
  restoresConcept?: boolean;
  
  // Properties
  properties: Record<string, any>;
}

// =========================================================
// SYLLOGISM OF EXISTENCE - First major syllogistic form
// =========================================================

/**
 * Syllogism of Existence
 * 
 * The first and immediate form of syllogism with abstract
 * and immediate determinations.
 */
export interface SyllogismOfExistence extends Syllogism {
  type: 'existence';
  subtype: SyllogismOfExistenceSubtype;
  
  // Additional characteristics of syllogisms of existence
  isImmediate: boolean;
  isAbstract: boolean;
  isSubjective: boolean;
  isContingent: boolean;
}

/**
 * Create First Figure Syllogism - S-P-U
 */
export function createFirstFigureSyllogism(
  singular: string,
  particular: string,
  universal: string,
  options: {
    id?: string;
    singularTermId?: string;
    particularTermId?: string;
    universalTermId?: string;
  } = {}
): SyllogismOfExistence {
  const id = options.id || `syllogism:existence:first-figure:${Date.now()}`;
  
  // Create the terms
  const singularTerm: Term = {
    id: options.singularTermId || `term:singular:${Date.now()}`,
    content: singular,
    role: 'minor',
    being: {
      quality: 'singular',
      immediate: true,
      determinate: true
    },
    essence: {
      reflection: false,
      mediation: true
    },
    concept: {
      singular: true,
      particular: false,
      universal: false
    }
  };
  
  const particularTerm: Term = {
    id: options.particularTermId || `term:particular:${Date.now()}`,
    content: particular,
    role: 'middle',
    being: {
      quality: 'particular',
      immediate: true,
      determinate: true
    },
    essence: {
      reflection: false,
      mediation: false
    },
    concept: {
      singular: false,
      particular: true,
      universal: false
    }
  };
  
  const universalTerm: Term = {
    id: options.universalTermId || `term:universal:${Date.now()}`,
    content: universal,
    role: 'major',
    being: {
      quality: 'universal',
      immediate: true,
      determinate: false
    },
    essence: {
      reflection: false,
      mediation: true
    },
    concept: {
      singular: false,
      particular: false,
      universal: true
    }
  };
  
  // Create the figure
  const figure: Figure = {
    id: `figure:first:${Date.now()}`,
    name: 'First Figure',
    structure: 'S-P-U',
    property: 'Subsumption of singular under universal through particular',
    dialecticalSignificance: 'Initial unity of extremes through middle term'
  };
  
  // Create the premisses
  const premissMinor: Premiss = {
    id: `premiss:minor:${Date.now()}`,
    termMajor: particularTerm,
    termMinor: singularTerm,
    copula: 'is'
  };
  
  const premissMajor: Premiss = {
    id: `premiss:major:${Date.now()}`,
    termMajor: universalTerm,
    termMinor: particularTerm,
    copula: 'is'
  };
  
  // Create the conclusion
  const conclusion: Conclusion = {
    id: `conclusion:${Date.now()}`,
    termMajor: universalTerm,
    termMinor: singularTerm,
    copula: 'is',
    necessity: 0.3 // Low necessity in syllogism of existence
  };
  
  return {
    id,
    type: 'existence',
    subtype: 'first-figure',
    
    // Components
    figure,
    premissMajor,
    premissMinor,
    conclusion,
    middleTerm: particularTerm,
    
    // BEC Structure
    being: {
      immediate: true,
      determinate: false,
      quality: 'formal relation'
    },
    essence: {
      reflective: false,
      mediated: true,
      appearance: 'abstract relation'
    },
    concept: {
      universal: 'formal universality',
      particular: 'abstract particularity',
      individual: 'immediate singularity'
    },
    
    // Dialectical relations
    pointsTowards: 'syllogism:existence:second-figure',
    
    // Characteristics of syllogism of existence
    isImmediate: true,
    isAbstract: true,
    isSubjective: true,
    isContingent: true,
    
    // Properties
    properties: {
      hasSuperficialObjectiveSignificance: true,
      reliesOnFormalUniversality: true
    }
  };
}

/**
 * Create Second Figure Syllogism - P-S-U
 */
export function createSecondFigureSyllogism(
  particular: string,
  singular: string,
  universal: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): SyllogismOfExistence {
  const id = options.id || `syllogism:existence:second-figure:${Date.now()}`;
  
  // Create the terms
  const particularTerm: Term = {
    id: `term:particular:${Date.now()}`,
    content: particular,
    role: 'minor',
    being: {
      quality: 'particular',
      immediate: true,
      determinate: true
    },
    essence: {
      reflection: false,
      mediation: false
    },
    concept: {
      singular: false,
      particular: true,
      universal: false
    }
  };
  
  const singularTerm: Term = {
    id: `term:singular:${Date.now()}`,
    content: singular,
    role: 'middle',
    being: {
      quality: 'singular',
      immediate: true,
      determinate: true
    },
    essence: {
      reflection: false,
      mediation: true
    },
    concept: {
      singular: true,
      particular: false,
      universal: false
    }
  };
  
  const universalTerm: Term = {
    id: `term:universal:${Date.now()}`,
    content: universal,
    role: 'major',
    being: {
      quality: 'universal',
      immediate: true,
      determinate: false
    },
    essence: {
      reflection: false,
      mediation: true
    },
    concept: {
      singular: false,
      particular: false,
      universal: true
    }
  };
  
  // Create the figure
  const figure: Figure = {
    id: `figure:second:${Date.now()}`,
    name: 'Second Figure',
    structure: 'P-S-U',
    property: 'Singularity as mediating element',
    dialecticalSignificance: 'Reversal of first figure, making singularity the middle term'
  };
  
  // Create the premisses
  const premissMinor: Premiss = {
    id: `premiss:minor:${Date.now()}`,
    termMajor: singularTerm,
    termMinor: particularTerm,
    copula: 'is'
  };
  
  const premissMajor: Premiss = {
    id: `premiss:major:${Date.now()}`,
    termMajor: universalTerm,
    termMinor: singularTerm,
    copula: 'contains'
  };
  
  // Create the conclusion
  const conclusion: Conclusion = {
    id: `conclusion:${Date.now()}`,
    termMajor: universalTerm,
    termMinor: particularTerm,
    copula: 'might be',
    necessity: 0.4 // Slightly higher necessity than first figure
  };
  
  return {
    id,
    type: 'existence',
    subtype: 'second-figure',
    
    // Components
    figure,
    premissMajor,
    premissMinor,
    conclusion,
    middleTerm: singularTerm,
    
    // BEC Structure
    being: {
      immediate: true,
      determinate: true,
      quality: 'singularity as mediator'
    },
    essence: {
      reflective: false,
      mediated: true,
      appearance: 'immediate connection'
    },
    concept: {
      universal: 'abstract universality',
      particular: 'determined particularity',
      individual: 'mediating singularity'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || 'syllogism:existence:first-figure',
    pointsTowards: 'syllogism:existence:third-figure',
    
    // Characteristics
    isImmediate: true,
    isAbstract: true,
    isSubjective: true,
    isContingent: true,
    
    // Properties
    properties: {
      hasPositiveForm: true,
      hasNegativeContent: true,
      containsIndifferentPremises: true,
      hasLimitedValue: true
    }
  };
}

/**
 * Create Third Figure Syllogism - S-U-P
 */
export function createThirdFigureSyllogism(
  singular: string,
  universal: string,
  particular: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): SyllogismOfExistence {
  const id = options.id || `syllogism:existence:third-figure:${Date.now()}`;
  
  // Create the terms
  const singularTerm: Term = {
    id: `term:singular:${Date.now()}`,
    content: singular,
    role: 'minor',
    being: {
      quality: 'singular',
      immediate: true,
      determinate: true
    },
    essence: {
      reflection: false,
      mediation: false
    },
    concept: {
      singular: true,
      particular: false,
      universal: false
    }
  };
  
  const universalTerm: Term = {
    id: `term:universal:${Date.now()}`,
    content: universal,
    role: 'middle',
    being: {
      quality: 'universal',
      immediate: true,
      determinate: false
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: false,
      universal: true
    }
  };
  
  const particularTerm: Term = {
    id: `term:particular:${Date.now()}`,
    content: particular,
    role: 'major',
    being: {
      quality: 'particular',
      immediate: true,
      determinate: true
    },
    essence: {
      reflection: false,
      mediation: false
    },
    concept: {
      singular: false,
      particular: true,
      universal: false
    }
  };
  
  // Create the figure
  const figure: Figure = {
    id: `figure:third:${Date.now()}`,
    name: 'Third Figure',
    structure: 'S-U-P',
    property: 'Universality as mediating element',
    dialecticalSignificance: 'Concrete universality emerges as mediator'
  };
  
  // Create the premisses
  const premissMinor: Premiss = {
    id: `premiss:minor:${Date.now()}`,
    termMajor: universalTerm,
    termMinor: singularTerm,
    copula: 'is'
  };
  
  const premissMajor: Premiss = {
    id: `premiss:major:${Date.now()}`,
    termMajor: particularTerm,
    termMinor: universalTerm,
    copula: 'is'
  };
  
  // Create the conclusion
  const conclusion: Conclusion = {
    id: `conclusion:${Date.now()}`,
    termMajor: particularTerm,
    termMinor: singularTerm,
    copula: 'is',
    necessity: 0.5 // Higher necessity, completing syllogism of existence
  };
  
  return {
    id,
    type: 'existence',
    subtype: 'third-figure',
    
    // Components
    figure,
    premissMajor,
    premissMinor,
    conclusion,
    middleTerm: universalTerm,
    
    // BEC Structure
    being: {
      immediate: true,
      determinate: true,
      quality: 'universality as mediator'
    },
    essence: {
      reflective: true,
      mediated: true,
      appearance: 'concrete universality'
    },
    concept: {
      universal: 'concrete universality',
      particular: 'determined particularity',
      individual: 'immediately singular'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || 'syllogism:existence:second-figure',
    pointsTowards: 'syllogism:reflection:allness',
    
    // Characteristics
    isImmediate: true,
    isAbstract: false, // False because universality is becoming concrete
    isSubjective: true,
    isContingent: true,
    
    // Properties
    properties: {
      completesDetemination: true,
      hasFormAsContent: true,
      isConcrete: true,
      presupposesSelf: true
    }
  };
}

// =========================================================
// SYLLOGISM OF REFLECTION - Second major syllogistic form
// =========================================================

/**
 * Syllogism of Reflection
 * 
 * A more determined form of syllogism that develops from
 * the syllogism of existence, characterized by reflective universality.
 */
export interface SyllogismOfReflection extends Syllogism {
  type: 'reflection';
  subtype: SyllogismOfReflectionSubtype;
  
  // Additional characteristics of syllogisms of reflection
  isMediated: boolean;
  isReflective: boolean;
  isContentFull: boolean;
  representsTotalityOfInstances: boolean;
}

/**
 * Create Syllogism of Allness
 */
export function createSyllogismOfAllness(
  subject: string,
  middle: string,
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): SyllogismOfReflection {
  const id = options.id || `syllogism:reflection:allness:${Date.now()}`;
  
  // Create the terms
  const subjectTerm: Term = {
    id: `term:subject:${Date.now()}`,
    content: subject,
    role: 'minor',
    being: {
      quality: 'subject',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: false, 
      universal: false // Depends on the specific case
    }
  };
  
  const middleTerm: Term = {
    id: `term:middle:${Date.now()}`,
    content: middle,
    role: 'middle',
    being: {
      quality: 'all instances',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: false,
      universal: true // Empirically universal
    }
  };
  
  const predicateTerm: Term = {
    id: `term:predicate:${Date.now()}`,
    content: predicate,
    role: 'major',
    being: {
      quality: 'predicate',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: false,
      universal: true
    }
  };
  
  // Create the figure
  const figure: Figure = {
    id: `figure:allness:${Date.now()}`,
    name: 'Syllogism of Allness',
    structure: 'S-A-U',
    property: 'Allness as mediating element',
    dialecticalSignificance: 'Empirical universality based on all observed instances'
  };
  
  // Create the premisses
  const premissMinor: Premiss = {
    id: `premiss:minor:${Date.now()}`,
    termMajor: middleTerm,
    termMinor: subjectTerm,
    copula: 'is included in'
  };
  
  const premissMajor: Premiss = {
    id: `premiss:major:${Date.now()}`,
    termMajor: predicateTerm,
    termMinor: middleTerm,
    copula: 'belongs to all'
  };
  
  // Create the conclusion
  const conclusion: Conclusion = {
    id: `conclusion:${Date.now()}`,
    termMajor: predicateTerm,
    termMinor: subjectTerm,
    copula: 'is',
    necessity: 0.7 // Higher necessity in syllogism of reflection
  };
  
  return {
    id,
    type: 'reflection',
    subtype: 'allness',
    
    // Components
    figure,
    premissMajor,
    premissMinor,
    conclusion,
    middleTerm,
    
    // BEC Structure
    being: {
      immediate: false,
      determinate: true,
      quality: 'empirical universality'
    },
    essence: {
      reflective: true,
      mediated: true,
      appearance: 'totality of instances'
    },
    concept: {
      universal: 'reflective universality',
      particular: 'totality of particulars',
      individual: 'empirical allness'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || 'syllogism:existence:third-figure',
    pointsTowards: 'syllogism:reflection:induction',
    
    // Characteristics
    isMediated: true,
    isReflective: true,
    isContentFull: true,
    representsTotalityOfInstances: true,
    
    // Properties
    properties: {
      isMoreDetermined: true,
      representsAllness: true,
      containsContingency: true,
      isExternalUniversality: true
    }
  };
}

/**
 * Create Syllogism of Induction
 */
export function createSyllogismOfInduction(
  universalTerm: string,
  singulars: string[],
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): SyllogismOfReflection {
  const id = options.id || `syllogism:reflection:induction:${Date.now()}`;
  
  // Create the middle term (the collection of singulars)
  const singularList = singulars.join(', ');
  const middleTerm: Term = {
    id: `term:middle:induction:${Date.now()}`,
    content: singularList,
    role: 'middle',
    being: {
      quality: 'completed singularity',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: true, // A collection of singulars
      particular: false,
      universal: false
    }
  };
  
  // Create the universal term
  const majorTerm: Term = {
    id: `term:universal:${Date.now()}`,
    content: universalTerm,
    role: 'minor',
    being: {
      quality: 'genus',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: false,
      universal: true
    }
  };
  
  // Create the predicate term
  const predicateTerm: Term = {
    id: `term:predicate:${Date.now()}`,
    content: predicate,
    role: 'major',
    being: {
      quality: 'attribute',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: true,
      universal: false
    }
  };
  
  // Create the figure
  const figure: Figure = {
    id: `figure:induction:${Date.now()}`,
    name: 'Syllogism of Induction',
    structure: 'U-S-P',
    property: 'Singularity as collection mediating universal and particular',
    dialecticalSignificance: 'Inductive movement from singulars to universality'
  };
  
  // Create the premisses
  const premissMinor: Premiss = {
    id: `premiss:minor:${Date.now()}`,
    termMajor: middleTerm,
    termMinor: majorTerm,
    copula: 'contains'
  };
  
  const premissMajor: Premiss = {
    id: `premiss:major:${Date.now()}`,
    termMajor: predicateTerm,
    termMinor: middleTerm,
    copula: 'belongs to'
  };
  
  // Create the conclusion
  const conclusion: Conclusion = {
    id: `conclusion:${Date.now()}`,
    termMajor: predicateTerm,
    termMinor: majorTerm,
    copula: 'might be',
    necessity: 0.6 // Problematic due to induction's potential incompleteness
  };
  
  return {
    id,
    type: 'reflection',
    subtype: 'induction',
    
    // Components
    figure,
    premissMajor,
    premissMinor,
    conclusion,
    middleTerm,
    
    // BEC Structure
    being: {
      immediate: false,
      determinate: true,
      quality: 'empirical collection'
    },
    essence: {
      reflective: true,
      mediated: true,
      appearance: 'collection of instances'
    },
    concept: {
      universal: 'problematic universality',
      particular: 'determined particularity',
      individual: 'collection of singulars'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || 'syllogism:reflection:allness',
    pointsTowards: 'syllogism:reflection:analogy',
    
    // Characteristics
    isMediated: true,
    isReflective: true,
    isContentFull: true,
    representsTotalityOfInstances: false, // May always be incomplete
    
    // Properties
    properties: {
      hasObjectiveSignificance: true,
      isSubjective: true,
      isProblematic: true,
      representsIncompleteUniversality: true,
      isCompletedSingularity: true
    }
  };
}

/**
 * Create Syllogism of Analogy
 */
export function createSyllogismOfAnalogy(
  subject1: string,
  subject2: string,
  commonAttribute: string,
  inferredAttribute: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): SyllogismOfReflection {
  const id = options.id || `syllogism:reflection:analogy:${Date.now()}`;
  
  // Create the terms
  const subject1Term: Term = {
    id: `term:subject1:${Date.now()}`,
    content: subject1,
    role: 'minor',
    being: {
      quality: 'concrete entity',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: true,
      particular: false,
      universal: false
    }
  };
  
  const subject2Term: Term = {
    id: `term:subject2:${Date.now()}`,
    content: subject2,
    role: 'middle',
    being: {
      quality: 'concrete entity',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: true,
      particular: false,
      universal: false
    }
  };
  
  // Create a compound term for the middle (universal nature)
  const middleTerm: Term = {
    id: `term:middle:analogy:${Date.now()}`,
    content: `universal nature of ${subject2}`,
    role: 'middle',
    being: {
      quality: 'concrete universal',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: false,
      universal: true
    }
  };
  
  const predicateTerm: Term = {
    id: `term:predicate:${Date.now()}`,
    content: inferredAttribute,
    role: 'major',
    being: {
      quality: 'attribute',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: true,
      universal: false
    }
  };
  
  // Create the figure
  const figure: Figure = {
    id: `figure:analogy:${Date.now()}`,
    name: 'Syllogism of Analogy',
    structure: 'S₁-S₂-P',
    property: 'Similar nature as mediating element',
    dialecticalSignificance: 'Movement toward essential similarity rather than mere external comparison'
  };
  
  // Create the premisses
  const premissMinor: Premiss = {
    id: `premiss:minor:${Date.now()}`,
    termMajor: middleTerm,
    termMinor: subject1Term,
    copula: 'shares nature with'
  };
  
  const premissMajor: Premiss = {
    id: `premiss:major:${Date.now()}`,
    termMajor: predicateTerm,
    termMinor: subject2Term, 
    copula: 'has'
  };
  
  // Create the conclusion
  const conclusion: Conclusion = {
    id: `conclusion:${Date.now()}`,
    termMajor: predicateTerm,
    termMinor: subject1Term,
    copula: 'probably has',
    necessity: 0.8 // Higher than induction but still not necessity
  };
  
  return {
    id,
    type: 'reflection',
    subtype: 'analogy',
    
    // Components
    figure,
    premissMajor,
    premissMinor,
    conclusion,
    middleTerm,
    
    // BEC Structure
    being: {
      immediate: false,
      determinate: true,
      quality: 'analogical relation'
    },
    essence: {
      reflective: true,
      mediated: true,
      appearance: 'essential similarity'
    },
    concept: {
      universal: 'concrete universality',
      particular: 'analogical relation',
      individual: 'similar natures'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || 'syllogism:reflection:induction',
    pointsTowards: 'syllogism:necessity:categorical',
    
    // Characteristics
    isMediated: true,
    isReflective: true,
    isContentFull: true,
    representsTotalityOfInstances: false,
    
    // Properties
    properties: {
      bridgesEmpiricalAndConceptual: true,
      containsSingularity: true,
      isConcrete: true,
      isProbable: true
    }
  };
}

// =========================================================
// SYLLOGISM OF NECESSITY - Third major syllogistic form
// =========================================================

/**
 * Syllogism of Necessity
 * 
 * A higher form of syllogistic reasoning characterized by
 * objective universality and necessity.
 */
export interface SyllogismOfNecessity extends Syllogism {
  type: 'necessity';
  subtype: SyllogismOfNecessitySubtype;
  
  // Additional characteristics of syllogisms of necessity
  isObjective: boolean;
  isContentFull: boolean;
  unifiesFormAndContent: boolean;
  overcomesContingency: boolean;
}

/**
 * Create Categorical Syllogism of Necessity
 */
export function createCategoricalSyllogism(
  singular: string,
  species: string,
  genus: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): SyllogismOfNecessity {
  const id = options.id || `syllogism:necessity:categorical:${Date.now()}`;
  
  // Create the terms
  const singularTerm: Term = {
    id: `term:singular:${Date.now()}`,
    content: singular,
    role: 'minor',
    being: {
      quality: 'singular instance',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true,
      appearance: 'concrete individual'
    },
    concept: {
      singular: true,
      particular: false,
      universal: false
    }
  };
  
  const speciesTerm: Term = {
    id: `term:species:${Date.now()}`,
    content: species,
    role: 'middle',
    being: {
      quality: 'species',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true,
      appearance: 'substantial nature'
    },
    concept: {
      singular: false,
      particular: true,
      universal: false
    }
  };
  
  const genusTerm: Term = {
    id: `term:genus:${Date.now()}`,
    content: genus,
    role: 'major',
    being: {
      quality: 'genus',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true,
      appearance: 'universal nature'
    },
    concept: {
      singular: false,
      particular: false,
      universal: true
    }
  };
  
  // Create the figure
  const figure: Figure = {
    id: `figure:categorical:${Date.now()}`,
    name: 'Categorical Syllogism',
    structure: 'S-Sp-G',
    property: 'Substantiality as mediating element',
    dialecticalSignificance: 'Substance elevated to concept as universal'
  };
  
  // Create the premisses
  const premissMinor: Premiss = {
    id: `premiss:minor:${Date.now()}`,
    termMajor: speciesTerm,
    termMinor: singularTerm,
    copula: 'is necessarily'
  };
  
  const premissMajor: Premiss = {
    id: `premiss:major:${Date.now()}`,
    termMajor: genusTerm,
    termMinor: speciesTerm,
    copula: 'is necessarily'
  };
  
  // Create the conclusion
  const conclusion: Conclusion = {
    id: `conclusion:${Date.now()}`,
    termMajor: genusTerm,
    termMinor: singularTerm,
    copula: 'is necessarily',
    necessity: 0.9 // Very high necessity
  };
  
  return {
    id,
    type: 'necessity',
    subtype: 'categorical',
    
    // Components
    figure,
    premissMajor,
    premissMinor,
    conclusion,
    middleTerm: speciesTerm,
    
    // BEC Structure
    being: {
      immediate: false,
      determinate: true,
      quality: 'substantial relation'
    },
    essence: {
      reflective: true,
      mediated: true,
      appearance: 'substantial identity'
    },
    concept: {
      universal: 'substantial universality',
      particular: 'species as substantial particular',
      individual: 'determined singular'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || 'syllogism:reflection:analogy',
    pointsTowards: 'syllogism:necessity:hypothetical',
    
    // Characteristics
    isObjective: true,
    isContentFull: true,
    unifiesFormAndContent: true,
    overcomesContingency: true,
    
    // Properties
    properties: {
      isObjective: true,
      representsNecessaryConnection: true,
      expressesEssentialNature: true,
      existsInAndForItself: true
    }
  };
}

/**
 * Create Hypothetical Syllogism of Necessity
 */
export function createHypotheticalSyllogism(
  antecedent: string,
  consequent: string,
  actualCondition: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): SyllogismOfNecessity {
  const id = options.id || `syllogism:necessity:hypothetical:${Date.now()}`;
  
  // Create the terms
  const antecedentTerm: Term = {
    id: `term:antecedent:${Date.now()}`,
    content: antecedent,
    role: 'major',
    being: {
      quality: 'condition',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: true,
      universal: false
    }
  };
  
  const consequentTerm: Term = {
    id: `term:consequent:${Date.now()}`,
    content: consequent,
    role: 'minor',
    being: {
      quality: 'result',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: true,
      universal: false
    }
  };
  
  const actualConditionTerm: Term = {
    id: `term:actual:${Date.now()}`,
    content: actualCondition,
    role: 'middle',
    being: {
      quality: 'actuality',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: true,
      particular: false,
      universal: false
    }
  };
  
  // Create the figure
  const figure: Figure = {
    id: `figure:hypothetical:${Date.now()}`,
    name: 'Hypothetical Syllogism',
    structure: 'If A, then B; A exists; Therefore B',
    property: 'Necessity of connection between condition and result',
    dialecticalSignificance: 'Mediation through actuality rather than abstractly'
  };
  
  // Create the premisses
  // First premise is the hypothetical judgment
  const premissMajor: Premiss = {
    id: `premiss:major:${Date.now()}`,
    termMajor: consequentTerm,
    termMinor: antecedentTerm,
    copula: 'if-then'
  };
  
  // Second premise is the assertion of actuality
  const premissMinor: Premiss = {
    id: `premiss:minor:${Date.now()}`,
    termMajor: actualConditionTerm,
    termMinor: antecedentTerm,
    copula: 'is actual as'
  };
  
  // Create the conclusion
  const conclusion: Conclusion = {
    id: `conclusion:${Date.now()}`,
    termMajor: consequentTerm,
    termMinor: actualConditionTerm,
    copula: 'must be',
    necessity: 0.95 // Very high necessity
  };
  
  return {
    id,
    type: 'necessity',
    subtype: 'hypothetical',
    
    // Components
    figure,
    premissMajor,
    premissMinor,
    conclusion,
    middleTerm: antecedentTerm,
    
    // BEC Structure
    being: {
      immediate: false,
      determinate: true,
      quality: 'causal necessity'
    },
    essence: {
      reflective: true,
      mediated: true,
      appearance: 'real ground'
    },
    concept: {
      universal: 'necessary connection',
      particular: 'determinate ground',
      individual: 'actual existence'
    },
    
    // Dialectical relations
    emergesFrom: options.emergesFrom || 'syllogism:necessity:categorical',
    pointsTowards: 'syllogism:necessity:disjunctive',
    
    // Characteristics
    isObjective: true,
    isContentFull: true,
    unifiesFormAndContent: true,
    overcomesContingency: true,
    
    // Properties
    properties: {
      expressesNecessaryConnection: true,
      presupposesActuality: true,
      determinesConsequence: true
    }
  };
}

/**
 * Create Disjunctive Syllogism of Necessity
 */
export function createDisjunctiveSyllogism(
  subject: string,
  options: string[],
  actualOption: string,
  options2: {
    id?: string;
    emergesFrom?: string;
  } = {}
): SyllogismOfNecessity {
  const id = options2.id || `syllogism:necessity:disjunctive:${Date.now()}`;
  
  // Create the terms
  const subjectTerm: Term = {
    id: `term:subject:${Date.now()}`,
    content: subject,
    role: 'middle',
    being: {
      quality: 'genus',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true,
      appearance: 'concrete universal'
    },
    concept: {
      singular: false,
      particular: false,
      universal: true
    }
  };
  
  // Create a composite term for the disjunction
  const optionsTerms = options.join(' or ');
  const disjunctionTerm: Term = {
    id: `term:disjunction:${Date.now()}`,
    content: optionsTerms,
    role: 'major',
    being: {
      quality: 'totality of species',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: false,
      particular: true,
      universal: false
    }
  };
  
  const actualTerm: Term = {
    id: `term:actual:${Date.now()}`,
    content: actualOption,
    role: 'minor',
    being: {
      quality: 'specific determination',
      immediate: false,
      determinate: true
    },
    essence: {
      reflection: true,
      mediation: true
    },
    concept: {
      singular: true,
      particular: true, // Both singular and particular
      universal: false
    }
  };
  
  // Create the figure
  const figure: Figure = {
    id: `figure:disjunctive:${Date.now()}`,
    name: 'Disjunctive Syllogism',
    structure: 'A is either B, C, or D; A is B; Therefore A is not C or D',
    property: 'Concrete universality as totality of determinations',
    dialecticalSignificance: 'Highest form of the syllogism, representing genus as totality of species'
  };
  
  // Create the premisses
  // First premise is the disjunctive judgment
  const premissMajor: Premiss = {
    id: `premiss:major:${Date.now()}`,
    termMajor: disjunctionTerm,
    termMinor: subjectTerm,
    copula: 'is either'
  };
  
  // Second premise is the assertion of one option
  const premissMinor: Premiss = {
    id: `premiss:minor:${Date.now()}`,
    termMajor: actualTerm,
    termMinor: subjectTerm,
    copula: 'is'
  };
  
  // Create the conclusion - in disjunctive syllogism, the conclusion is negative for non-chosen options
  const conclusion: Conclusion = {
    id: `conclusion:${Date.now()}`,
    termMajor: disjunctionTerm,
    termMinor: actualTerm,
    copula: 'excludes all but',
    necessity: 1.0 // Complete necessity - the highest form
  };
  
  return {
    id,
    type: 'necessity',
    subtype: 'disjunctive',
    
    // Components
    figure,
    premissMajor,
    premissMinor,
    conclusion,
    middleTerm: subjectTerm,
    
    // BEC Structure
    being: {
      immediate: false,
      determinate: true,
      quality: 'concrete universal'
    },
    essence: {
      reflective: true,
      mediated: true,
      appearance: 'totality of determinations'
    },
    concept: {
      universal: 'concrete universal genus',
      particular: 'complete totality of species',
      individual: 'determined actuality'
    },
    
    // Dialectical relations
    emergesFrom: options2.emergesFrom || 'syllogism:necessity:hypothetical',
    pointsTowards: 'objectivity', // Points beyond syllogism to objectivity
    restoresConcept: true, // Crucially, restores the concept
    
    // Characteristics
    isObjective: true,
    isContentFull: true,
    unifiesFormAndContent: true,
    overcomesContingency: true,
    
    // Properties
    properties: {
      representsCompleteUniversality: true,
      unitesSingularAndUniversal: true,
      achievesDeterminateConcept: true,
      restoresConceptualUnity: true,
      exhibitsAbsoluteTotality: true,
      isSelfDetermining: true,
      overcomesFormalism: true,
      reconcilesMediationAndImmediacy: true,
      isObjectivelyNecessary: true
    }
  };
}

// =========================================================
// SYLLOGISM SYSTEM - Main implementation
// =========================================================

/**
 * Syllogism System
 * 
 * Main class that provides functionality for working with
 * Hegelian syllogisms in the BEC ecosystem
 */
export class SyllogismSystem {
  private syllogisms: Map<string, Syllogism> = new Map();
  
  /**
   * Create a syllogism based on type
   */
  createSyllogism(
    type: SyllogismType,
    subtype: SyllogismSubtype,
    terms: string[],
    options: any = {}
  ): Syllogism {
    let syllogism: Syllogism;
    
    // Create syllogism based on type and subtype
    if (type === 'existence') {
      if (subtype === 'first-figure') {
        syllogism = createFirstFigureSyllogism(terms[0], terms[1], terms[2], options);
      } else if (subtype === 'second-figure') {
        syllogism = createSecondFigureSyllogism(terms[0], terms[1], terms[2], options);
      } else {
        syllogism = createThirdFigureSyllogism(terms[0], terms[1], terms[2], options);
      }
    } else if (type === 'reflection') {
      if (subtype === 'allness') {
        syllogism = createSyllogismOfAllness(terms[0], terms[1], terms[2], options);
      } else if (subtype === 'induction') {
        const universalTerm = terms[0];
        const predicate = terms[terms.length - 1];
        const singulars = terms.slice(1, terms.length - 1);
        syllogism = createSyllogismOfInduction(universalTerm, singulars, predicate, options);
      } else {
        syllogism = createSyllogismOfAnalogy(terms[0], terms[1], terms[2], terms[3], options);
      }
    } else { // type === 'necessity'
      if (subtype === 'categorical') {
        syllogism = createCategoricalSyllogism(terms[0], terms[1], terms[2], options);
      } else if (subtype === 'hypothetical') {
        syllogism = createHypotheticalSyllogism(terms[0], terms[1], terms[2], options);
      } else {
        const subject = terms[0];
        const actualOption = terms[terms.length - 1];
        const optionsList = terms.slice(1, terms.length - 1);
        const options2 = { 
          id: options.id,
          emergesFrom: options.emergesFrom
        };
        syllogism = createDisjunctiveSyllogism(subject, optionsList, actualOption, options2);
      }
    }
    
    // Store syllogism
    this.syllogisms.set(syllogism.id, syllogism);
    
    return syllogism;
  }
  
  /**
   * Get syllogism by ID
   */
  getSyllogism(id: string): Syllogism | undefined {
    return this.syllogisms.get(id);
  }
  
  /**
   * Convert syllogism to string expression
   */
  toExpression(syllogism: Syllogism): string {
    // Create the major premise expression
    const majorPremise = `${syllogism.premissMajor.termMinor.content} ${syllogism.premissMajor.copula} ${syllogism.premissMajor.termMajor.content}`;
    
    // Create the minor premise expression
    const minorPremise = `${syllogism.premissMinor.termMinor.content} ${syllogism.premissMinor.copula} ${syllogism.premissMinor.termMajor.content}`;
    
    // Create the conclusion expression
    const conclusion = `${syllogism.conclusion.termMinor.content} ${syllogism.conclusion.copula} ${syllogism.conclusion.termMajor.content}`;
    
    // Compose the full expression
    return `${majorPremise}; ${minorPremise}; Therefore ${conclusion}`;
  }
  
  /**
   * Convert syllogism to Neo node
   */
  toNode(syllogism: Syllogism): NeoNode {
    return createNeoNode({
      id: syllogism.id,
      type: `syllogism:${syllogism.type}:${syllogism.subtype}`,
      being: {
        quality: syllogism.being.quality,
        immediate: syllogism.being.immediate,
        determinate: syllogism.being.determinate
      },
      essence: {
        appearance: syllogism.essence.appearance,
        reflective: syllogism.essence.reflective,
        mediated: syllogism.essence.mediated
      },
      concept: {
        universal: syllogism.concept.universal,
        particular: syllogism.concept.particular,
        individual: syllogism.concept.individual
      },
      properties: {
        figure: syllogism.figure.name,
        structure: syllogism.figure.structure,
        majorPremise: `${syllogism.premissMajor.termMinor.content} ${syllogism.premissMajor.copula} ${syllogism.premissMajor.termMajor.content}`,
        minorPremise: `${syllogism.premissMinor.termMinor.content} ${syllogism.premissMinor.copula} ${syllogism.premissMinor.termMajor.content}`,
        conclusion: `${syllogism.conclusion.termMinor.content} ${syllogism.conclusion.copula} ${syllogism.conclusion.termMajor.content}`,
        expression: this.toExpression(syllogism),
        ...syllogism.properties
      },
      metadata: {
        emergesFrom: syllogism.emergesFrom,
        pointsTowards: syllogism.pointsTowards,
        restoresConcept: syllogism.restoresConcept
      }
    });
  }
  
  /**
   * Develop syllogism to next form
   */
  developSyllogism(syllogism: Syllogism): Syllogism | null {
    if (!syllogism.pointsTowards || syllogism.pointsTowards === 'objectivity') {
      return null; // End of syllogistic development
    }
    
    const [type, subtype] = syllogism.pointsTowards.split(':').slice(1);
    
    if (!type || !subtype) {
      return null;
    }
    
    // Extract necessary terms based on current syllogism type and next type
    let terms: string[] = [];
    
    // For transitions between existence figures
    if (syllogism.type === 'existence' && type === 'existence') {
      if (subtype === 'second-figure') {
        // First to second: rearrange S-P-U to P-S-U
        terms = [
          syllogism.premissMajor.termMinor.content, // P
          syllogism.premissMinor.termMinor.content, // S
          syllogism.premissMajor.termMajor.content  // U
        ];
      } else if (subtype === 'third-figure') {
        // Second to third: rearrange P-S-U to S-U-P
        terms = [
          syllogism.premissMinor.termMinor.content, // S
          syllogism.premissMajor.termMajor.content, // U
          syllogism.premissMinor.termMajor.content  // P
        ];
      }
    }
    // For transition from existence to reflection
    else if (syllogism.type === 'existence' && type === 'reflection') {
      // Extract terms from third figure for allness
      terms = [
        syllogism.premissMinor.termMinor.content, // Subject
        "All " + syllogism.premissMajor.termMajor.content, // Middle (allness)
        syllogism.premissMajor.termMinor.content  // Predicate
      ];
    }
    // For transitions between reflection types
    else if (syllogism.type === 'reflection' && type === 'reflection') {
      if (subtype === 'induction') {
        // Allness to induction: need genus and instances
        terms = [
          syllogism.premissMinor.termMinor.content, // Universal/genus
          "instance1", "instance2", "instance3",     // Individual instances
          syllogism.premissMajor.termMajor.content  // Predicate
        ];
      } else if (subtype === 'analogy') {
        // Induction to analogy: need two subjects with common nature
        terms = [
          "Subject1", // First subject
          "Subject2", // Second subject (analog)
          "Common Nature", // Common attribute
          "Inferred Attribute" // Inferred attribute
        ];
      }
    }
    // For transition from reflection to necessity
    else if (syllogism.type === 'reflection' && type === 'necessity') {
      // Extract terms for categorical syllogism
      terms = [
        "Individual", // Singular
        "Species", // Species
        "Genus" // Genus
      ];
    }
    // For transitions between necessity types
    else if (syllogism.type === 'necessity' && type === 'necessity') {
      if (subtype === 'hypothetical') {
        // Categorical to hypothetical
        terms = [
          "Condition", // Antecedent
          "Result", // Consequent
          "Actuality" // Actual condition
        ];
      } else if (subtype === 'disjunctive') {
        // Hypothetical to disjunctive
        terms = [
          "Subject", // Subject genus
          "Option1", "Option2", "Option3", // Options/species
          "Option1" // Actual option
        ];
      }
    }
    
    // Create the next syllogism
    return this.createSyllogism(
      type as SyllogismType,
      subtype as SyllogismSubtype,
      terms,
      { emergesFrom: syllogism.id }
    );
  }
  
  /**
   * Create complete dialectical progression of syllogisms
   */
  createDialecticalProgression(): Syllogism[] {
    const progression: Syllogism[] = [];
    
    // Start with first figure syllogism
    let current = this.createSyllogism(
      'existence', 
      'first-figure', 
      ['Socrates', 'human', 'mortal']
    );
    
    progression.push(current);
    
    // Develop through all forms
    while (current && current.pointsTowards && current.pointsTowards !== 'objectivity') {
      const next = this.developSyllogism(current);
      if (!next) break;
      
      progression.push(next);
      current = next;
    }
    
    return progression;
  }
  
  /**
   * Create syllogism from judgments
   */
  createFromJudgments(majorJudgment: Judgment, minorJudgment: Judgment): Syllogism | null {
    // This would connect to the judgment system
    // Implementation would depend on judgment structure
    return null;
  }
  
  /**
   * Check validity of a syllogism
   */
  checkValidity(syllogism: Syllogism): { 
    valid: boolean;
    reason?: string;
  } {
    // For existence syllogisms, check formal validity
    if (syllogism.type === 'existence') {
      if (syllogism.subtype === 'first-figure') {
        return { valid: true };
      } else {
        // Second and third figures have formal issues in traditional logic
        return { 
          valid: false, 
          reason: "Formal validity requires conversion to first figure"
        };
      }
    }
    
    // For reflection, check completeness of induction, etc.
    if (syllogism.type === 'reflection') {
      if (syllogism.subtype === 'induction') {
        return { 
          valid: true, 
          reason: "Valid but contingent on completeness of instances"
        };
      } else if (syllogism.subtype === 'analogy') {
        return { 
          valid: true,
          reason: "Valid but depends on essential similarity"
        };
      }
    }
    
    // For necessity, all are valid in their sphere
    if (syllogism.type === 'necessity') {
      return { 
        valid: true,
        reason: "Necessarily valid within its conceptual sphere"
      };
    }
    
    return { valid: false };
  }
  
  /**
   * Clear all syllogisms
   */
  clear(): void {
    this.syllogisms.clear();
  }
  
  /**
   * Connect to concept system
   */
  restoreToConcept(syllogism: SyllogismOfNecessity): {
    conceptType: string;
    complete: boolean;
  } {
    // Only disjunctive syllogism of necessity can fully restore the concept
    if (syllogism.type !== 'necessity' || syllogism.subtype !== 'disjunctive') {
      return {
        conceptType: 'incomplete',
        complete: false
      };
    }
    
    // Disjunctive syllogism restores the concrete universal concept
    return {
      conceptType: 'object',
      complete: true
    };
  }
}

/**
 * Create syllogism system
 */
export function createSyllogismSystem(): SyllogismSystem {
  return new SyllogismSystem();
}

export default createSyllogismSystem;