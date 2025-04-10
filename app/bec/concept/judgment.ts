// Fix 1: Add proper import for NeoComponentId
import { NeoComponentId, NeoEntityId } from '../../neo/extension';

// Fix 2: Fix NeoNode import
import { NeoNode, createNeoNode } from '../../neo/entity';

// Fix 3: Add missing interface for FormTree and FormReference 
export interface FormTree {
  form: any;
  children: FormTree[];
  projectionInfo?: {
    depth: number;
    childCount: number;
    references: FormReference[];
  };
}

export interface FormReference {
  formId: string;
  referenceType: string;
  fieldId?: string;
}

/**
 * Hegelian Judgment System
 * 
 * A TypeScript implementation of Hegel's theory of judgment
 * from his Science of Logic, representing the dialectical
 * development from judgment of existence through reflection
 * and necessity to concept.
 */

// =========================================================
// JUDGMENT TYPES - The four major forms of judgment
// =========================================================

export type JudgmentType = 
  'existence' | 
  'reflection' | 
  'necessity' | 
  'concept';

export type JudgmentSubtype = 
  // Judgments of Existence
  'positive' | 'negative' | 'infinite' |
  // Judgments of Reflection
  'singular' | 'particular' | 'universal' |
  // Judgments of Necessity
  'categorical' | 'hypothetical' | 'disjunctive' |
  // Judgments of Concept
  'assertoric' | 'problematic' | 'apodictic';

// =========================================================
// BEING, ESSENCE, CONCEPT STRUCTURE
// =========================================================

/**
 * Subject Interface - Represents the subject term in a judgment
 */
export interface Subject {
  id: string;
  term: string;
  being: {
    immediate?: boolean;  // For judgments of existence
    reflected?: boolean;  // For judgments of reflection
    substantial?: boolean; // For judgments of necessity
    conceptual?: boolean; // For judgments of concept
    universal?: boolean;  // For universal judgments
    particular?: boolean; // For particular judgments
    singular?: boolean;   // For singular judgments
  };
  essence: {
    perishable?: boolean;
    determinate?: boolean;
    mediated?: boolean;
    reflectedIntoSelf?: boolean;
  };
  concept: {
    genus?: string;
    determined?: boolean;
    adequate?: boolean;
    nature?: string;
  };
}

/**
 * Predicate Interface - Represents the predicate term in a judgment
 */
export interface Predicate {
  id: string;
  term: string;
  being: {
    abstract?: boolean;
    universal?: boolean;
    essential?: boolean;
    evaluative?: boolean;
  };
  essence: {
    appearance?: string;
    reflection?: boolean;
    expressesEssence?: boolean;
    mediated?: boolean;
  };
  concept: {
    genus?: string;
    differentia?: string;
    purpose?: string;
    quality?: 'good' | 'true' | 'right' | 'beautiful' | string;
  };
}

/**
 * Copula Interface - Represents the connecting element in a judgment
 */
export interface Copula {
  type: 'is' | 'is not' | 'might be' | 'must be' | 'is either' | 'if-then';
  being: {
    affirmative?: boolean;
    negative?: boolean;
    infinite?: boolean;
  };
  essence: {
    reflective?: boolean;
    extensive?: boolean;
    intensive?: boolean;
  };
  concept: {
    necessity?: boolean;
    possibility?: boolean;
    actuality?: boolean;
  };
}

// =========================================================
// JUDGMENT INTERFACE - Base interface for all judgments
// =========================================================

export interface Judgment {
  id: string;
  type: JudgmentType;
  subtype: JudgmentSubtype;
  subject: Subject;
  predicate: Predicate;
  copula: Copula;
  
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
  
  // Properties reflecting judgment characteristics
  properties: {
    [key: string]: any;
  };
}

// =========================================================
// JUDGMENT OF EXISTENCE - First major judgment form
// =========================================================

/**
 * Judgment of Existence
 * 
 * The immediate judgment where the subject is an immediate 
 * singular and the predicate is an abstract universal.
 */
export interface JudgmentOfExistence extends Judgment {
  type: 'existence';
  subtype: 'positive' | 'negative' | 'infinite';
}

/**
 * Create Positive Judgment - The singular is universal
 */
export function createPositiveJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    subjectId?: string;
    predicateId?: string;
  } = {}
): JudgmentOfExistence {
  return {
    id: options.id || `judgment:positive:${Date.now()}`,
    type: 'existence',
    subtype: 'positive',
    subject: {
      id: options.subjectId || `subject:${subject}`,
      term: subject,
      being: {
        immediate: true,
        singular: true
      },
      essence: {
        perishable: true,
        determinate: true
      },
      concept: {
        determined: false
      }
    },
    predicate: {
      id: options.predicateId || `predicate:${predicate}`,
      term: predicate,
      being: {
        abstract: true,
        universal: true
      },
      essence: {
        expressesEssence: false,
        mediated: false
      },
      concept: {}
    },
    copula: {
      type: 'is',
      being: {
        affirmative: true
      },
      essence: {},
      concept: {}
    },
    being: {
      immediate: true,
      quality: 'direct attribution'
    },
    essence: {
      reflective: false,
      mediated: false
    },
    concept: {
      universal: 'abstract',
      particular: 'singular subject',
      individual: 'positive judgment'
    },
    pointsTowards: 'judgment:negative',
    properties: {
      containsOwnNegation: true,
      isImmediate: true
    }
  };
}

/**
 * Create Negative Judgment - The singular is not universal
 */
export function createNegativeJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): JudgmentOfExistence {
  return {
    id: options.id || `judgment:negative:${Date.now()}`,
    type: 'existence',
    subtype: 'negative',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        immediate: true,
        singular: true
      },
      essence: {
        perishable: true
      },
      concept: {}
    },
    predicate: {
      id: `predicate:${predicate}`,
      term: predicate,
      being: {
        abstract: true,
        universal: true
      },
      essence: {},
      concept: {}
    },
    copula: {
      type: 'is not',
      being: {
        negative: true
      },
      essence: {},
      concept: {}
    },
    being: {
      immediate: true,
      quality: 'negation'
    },
    essence: {
      reflective: false,
      mediated: true
    },
    concept: {
      universal: 'abstract',
      particular: 'singular subject',
      individual: 'negative judgment'
    },
    emergesFrom: options.emergesFrom || 'judgment:positive',
    pointsTowards: 'judgment:infinite',
    properties: {
      expressesNonIdentity: true,
      preservesUniversality: true,
      isIndeterminate: true,
      leadsToFurtherDetermination: true
    }
  };
}

/**
 * Create Infinite Judgment - The singular is neither universal nor its negation
 */
export function createInfiniteJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): JudgmentOfExistence {
  return {
    id: options.id || `judgment:infinite:${Date.now()}`,
    type: 'existence',
    subtype: 'infinite',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        immediate: true,
        singular: true
      },
      essence: {},
      concept: {}
    },
    predicate: {
      id: `predicate:${predicate}`,
      term: predicate,
      being: {
        abstract: true
      },
      essence: {},
      concept: {}
    },
    copula: {
      type: 'is not',
      being: {
        infinite: true
      },
      essence: {},
      concept: {}
    },
    being: {
      immediate: false,
      quality: 'absolute negation'
    },
    essence: {
      reflective: true,
      mediated: true
    },
    concept: {
      universal: 'abstract',
      particular: 'singular subject',
      individual: 'infinite judgment'
    },
    emergesFrom: options.emergesFrom || 'judgment:negative',
    pointsTowards: 'judgment:reflection:singular',
    properties: {
      expressesAbsoluteIncompatibility: true,
      isNonsensicalInContent: true,
      critiquesFormality: true,
      revealsInadequacy: true
    }
  };
}

// =========================================================
// JUDGMENT OF REFLECTION - Second major judgment form
// =========================================================

/**
 * Judgment of Reflection
 * 
 * A form of judgment that goes beyond immediate existence,
 * expressing essential relations and reflective determinations.
 */
export interface JudgmentOfReflection extends Judgment {
  type: 'reflection';
  subtype: 'singular' | 'particular' | 'universal';
}

/**
 * Create Singular Judgment of Reflection
 */
export function createSingularReflectionJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): JudgmentOfReflection {
  return {
    id: options.id || `judgment:reflection:singular:${Date.now()}`,
    type: 'reflection',
    subtype: 'singular',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        singular: true,
        immediate: false
      },
      essence: {
        reflectedIntoSelf: true,
        mediated: true
      },
      concept: {}
    },
    predicate: {
      id: `predicate:${predicate}`,
      term: predicate,
      being: {
        universal: true,
        essential: true
      },
      essence: {
        expressesEssence: true
      },
      concept: {}
    },
    copula: {
      type: 'is',
      being: {},
      essence: {
        reflective: true
      },
      concept: {}
    },
    being: {
      immediate: false,
      quality: 'essential quality'
    },
    essence: {
      reflective: true,
      mediated: true,
      appearance: 'essential relation'
    },
    concept: {
      universal: 'reflective',
      particular: 'reflected singular',
      individual: 'singular judgment of reflection'
    },
    emergesFrom: options.emergesFrom || 'judgment:infinite',
    pointsTowards: 'judgment:reflection:particular',
    properties: {
      isReflectedIntoItself: true,
      expressesEssentialNature: true,
      retainsElementOfImmediacy: true,
      bridgesImmediateAndReflective: true
    }
  };
}

/**
 * Create Particular Judgment of Reflection
 */
export function createParticularReflectionJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): JudgmentOfReflection {
  return {
    id: options.id || `judgment:reflection:particular:${Date.now()}`,
    type: 'reflection',
    subtype: 'particular',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        particular: true,
        singular: false
      },
      essence: {
        mediated: true
      },
      concept: {}
    },
    predicate: {
      id: `predicate:${predicate}`,
      term: predicate,
      being: {
        universal: true,
        essential: true
      },
      essence: {
        expressesEssence: true
      },
      concept: {}
    },
    copula: {
      type: 'is',
      being: {},
      essence: {
        reflective: true,
        extensive: true
      },
      concept: {}
    },
    being: {
      immediate: false,
      quality: 'particular determination'
    },
    essence: {
      reflective: true,
      mediated: true
    },
    concept: {
      universal: 'reflective',
      particular: 'explicit particularity',
      individual: 'particular judgment of reflection'
    },
    emergesFrom: options.emergesFrom || 'judgment:reflection:singular',
    pointsTowards: 'judgment:reflection:universal',
    properties: {
      expressesGroupOfParticulars: true,
      appliesUniversallyToGroup: true,
      containsPositiveAndNegative: true,
      isIndeterminate: true
    }
  };
}

/**
 * Create Universal Judgment of Reflection
 */
export function createUniversalReflectionJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): JudgmentOfReflection {
  return {
    id: options.id || `judgment:reflection:universal:${Date.now()}`,
    type: 'reflection',
    subtype: 'universal',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        universal: true
      },
      essence: {
        mediated: true
      },
      concept: {}
    },
    predicate: {
      id: `predicate:${predicate}`,
      term: predicate,
      being: {
        universal: true,
        essential: true
      },
      essence: {
        expressesEssence: true
      },
      concept: {}
    },
    copula: {
      type: 'is',
      being: {},
      essence: {
        reflective: true,
        intensive: true
      },
      concept: {}
    },
    being: {
      immediate: false,
      quality: 'universal determination'
    },
    essence: {
      reflective: true,
      mediated: true
    },
    concept: {
      universal: 'concrete universal',
      particular: 'reflective universal',
      individual: 'universal judgment of reflection'
    },
    emergesFrom: options.emergesFrom || 'judgment:reflection:particular',
    pointsTowards: 'judgment:necessity:categorical',
    properties: {
      appliesUniversally: true,
      overcomesIndeterminacy: true,
      providesScientificBasis: true,
      retainsExternality: true
    }
  };
}

// =========================================================
// JUDGMENT OF NECESSITY - Third major judgment form
// =========================================================

/**
 * Judgment of Necessity
 * 
 * A higher stage of judgment expressing the necessary connection
 * between subject and predicate, where the predicate expresses
 * the substance of the subject.
 */
export interface JudgmentOfNecessity extends Judgment {
  type: 'necessity';
  subtype: 'categorical' | 'hypothetical' | 'disjunctive';
}

/**
 * Create Categorical Judgment
 */
export function createCategoricalNecessityJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): JudgmentOfNecessity {
  return {
    id: options.id || `judgment:necessity:categorical:${Date.now()}`,
    type: 'necessity',
    subtype: 'categorical',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        universal: true
      },
      essence: {
        mediated: true
      },
      concept: {
        genus: predicate
      }
    },
    predicate: {
      id: `predicate:${predicate}`,
      term: predicate,
      being: {
        universal: true,
        essential: true
      },
      essence: {
        expressesEssence: true
      },
      concept: {
        genus: predicate
      }
    },
    copula: {
      type: 'is',
      being: {},
      essence: {},
      concept: {
        necessity: true
      }
    },
    being: {
      immediate: false,
      quality: 'necessary determination'
    },
    essence: {
      reflective: true,
      mediated: true,
      appearance: 'substantial identity'
    },
    concept: {
      universal: 'concrete universal',
      particular: 'substantial predicate',
      individual: 'categorical judgment'
    },
    emergesFrom: options.emergesFrom || 'judgment:reflection:universal',
    pointsTowards: 'judgment:necessity:hypothetical',
    properties: {
      isConcreteUniversal: true,
      expressesEssentialNature: true,
      containsImplicitContradiction: true,
      retainsImmediacy: true
    }
  };
}

/**
 * Create Hypothetical Judgment
 */
export function createHypotheticalNecessityJudgment(
  antecedent: string, 
  consequent: string,
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): JudgmentOfNecessity {
  return {
    id: options.id || `judgment:necessity:hypothetical:${Date.now()}`,
    type: 'necessity',
    subtype: 'hypothetical',
    subject: {
      id: `subject:${antecedent}`,
      term: `If ${antecedent}`,
      being: {
        universal: true
      },
      essence: {
        mediated: true
      },
      concept: {}
    },
    predicate: {
      id: `predicate:${consequent}`,
      term: `then ${consequent}`,
      being: {
        universal: true
      },
      essence: {
        mediated: true
      },
      concept: {}
    },
    copula: {
      type: 'if-then',
      being: {},
      essence: {},
      concept: {
        necessity: true
      }
    },
    being: {
      immediate: false,
      quality: 'conditional necessity'
    },
    essence: {
      reflective: true,
      mediated: true
    },
    concept: {
      universal: 'relational necessity',
      particular: 'conditional relation',
      individual: 'hypothetical judgment'
    },
    emergesFrom: options.emergesFrom || 'judgment:necessity:categorical',
    pointsTowards: 'judgment:necessity:disjunctive',
    properties: {
      expressesNecessaryConnection: true,
      containsTensionIndependenceDependence: true,
      retainsExternality: true,
      isCompleteExistence: true
    }
  };
}

/**
 * Create Disjunctive Judgment
 */
export function createDisjunctiveNecessityJudgment(
  subject: string, 
  predicates: string[],
  options: {
    id?: string;
    emergesFrom?: string;
  } = {}
): JudgmentOfNecessity {
  const predicateTerms = predicates.join(' or ');
  
  return {
    id: options.id || `judgment:necessity:disjunctive:${Date.now()}`,
    type: 'necessity',
    subtype: 'disjunctive',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        universal: true
      },
      essence: {
        mediated: true
      },
      concept: {
        determined: true
      }
    },
    predicate: {
      id: `predicate:disjunction:${Date.now()}`,
      term: predicateTerms,
      being: {
        universal: true
      },
      essence: {
        mediated: true
      },
      concept: {}
    },
    copula: {
      type: 'is either',
      being: {},
      essence: {},
      concept: {
        necessity: true
      }
    },
    being: {
      immediate: false,
      quality: 'disjunctive totality'
    },
    essence: {
      reflective: true,
      mediated: true
    },
    concept: {
      universal: 'complete universal',
      particular: 'totality of particulars',
      individual: 'disjunctive judgment'
    },
    emergesFrom: options.emergesFrom || 'judgment:necessity:hypothetical',
    pointsTowards: 'judgment:concept:assertoric',
    properties: {
      isMutuallyExclusive: true,
      isCollectivelyExhaustive: true,
      containsUnityOfIdentityAndDifference: true,
      representsHighestFormOfJudgment: true
    }
  };
}

// =========================================================
// JUDGMENT OF CONCEPT - Fourth major judgment form
// =========================================================

/**
 * Judgment of Concept
 * 
 * The highest form of judgment expressing the unity of concept
 * and reality, and assessing the adequacy of a subject to its concept.
 */
export interface JudgmentOfConcept extends Judgment {
  type: 'concept';
  subtype: 'assertoric' | 'problematic' | 'apodictic';
}

/**
 * Create Assertoric Judgment of Concept
 */
export function createAssertoricalConceptJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
    quality?: 'good' | 'true' | 'right' | 'beautiful' | string;
  } = {}
): JudgmentOfConcept {
  const quality = options.quality || 'good';
  
  return {
    id: options.id || `judgment:concept:assertoric:${Date.now()}`,
    type: 'concept',
    subtype: 'assertoric',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        singular: true
      },
      essence: {},
      concept: {
        adequate: true
      }
    },
    predicate: {
      id: `predicate:${predicate || quality}`,
      term: predicate || quality,
      being: {
        evaluative: true
      },
      essence: {},
      concept: {
        quality: quality
      }
    },
    copula: {
      type: 'is',
      being: {},
      essence: {},
      concept: {
        actuality: true
      }
    },
    being: {
      immediate: true,
      quality: 'evaluative assertion'
    },
    essence: {
      reflective: false,
      mediated: false
    },
    concept: {
      universal: 'evaluative concept',
      particular: 'immediate assertion',
      individual: 'assertoric judgment'
    },
    emergesFrom: options.emergesFrom || 'judgment:necessity:disjunctive',
    pointsTowards: 'judgment:concept:problematic',
    properties: {
      isImmediateAssertion: true,
      containsEvaluativeDimension: true,
      lacksJustification: true,
      containsImplicitContradiction: true
    }
  };
}

/**
 * Create Problematic Judgment of Concept
 */
export function createProblematicConceptJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
    quality?: 'good' | 'true' | 'right' | 'beautiful' | string;
  } = {}
): JudgmentOfConcept {
  const quality = options.quality || 'good';
  
  return {
    id: options.id || `judgment:concept:problematic:${Date.now()}`,
    type: 'concept',
    subtype: 'problematic',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        singular: true
      },
      essence: {
        mediated: true
      },
      concept: {
        adequate: false
      }
    },
    predicate: {
      id: `predicate:${predicate || quality}`,
      term: predicate || quality,
      being: {
        evaluative: true
      },
      essence: {},
      concept: {
        quality: quality
      }
    },
    copula: {
      type: 'might be',
      being: {},
      essence: {},
      concept: {
        possibility: true
      }
    },
    being: {
      immediate: false,
      quality: 'evaluative possibility'
    },
    essence: {
      reflective: true,
      mediated: true
    },
    concept: {
      universal: 'evaluative concept',
      particular: 'contingent adequacy',
      individual: 'problematic judgment'
    },
    emergesFrom: options.emergesFrom || 'judgment:concept:assertoric',
    pointsTowards: 'judgment:concept:apodictic',
    properties: {
      expressesUncertainty: true,
      introducesReflection: true,
      addressesJustificationDemand: true,
      containsDialecticalTension: true
    }
  };
}

/**
 * Create Apodictic Judgment of Concept
 */
export function createApodicticalConceptJudgment(
  subject: string, 
  predicate: string,
  options: {
    id?: string;
    emergesFrom?: string;
    quality?: 'good' | 'true' | 'right' | 'beautiful' | string;
    explanation?: string;
  } = {}
): JudgmentOfConcept {
  const quality = options.quality || 'good';
  const explanation = options.explanation || 'by its nature';
  
  return {
    id: options.id || `judgment:concept:apodictic:${Date.now()}`,
    type: 'concept',
    subtype: 'apodictic',
    subject: {
      id: `subject:${subject}`,
      term: subject,
      being: {
        universal: true
      },
      essence: {
        mediated: true
      },
      concept: {
        adequate: true,
        determined: true,
        nature: explanation
      }
    },
    predicate: {
      id: `predicate:${predicate || quality}`,
      term: predicate || quality,
      being: {
        evaluative: true,
        essential: true
      },
      essence: {
        expressesEssence: true
      },
      concept: {
        quality: quality
      }
    },
    copula: {
      type: 'must be',
      being: {},
      essence: {},
      concept: {
        necessity: true
      }
    },
    being: {
      immediate: false,
      quality: 'conceptual necessity'
    },
    essence: {
      reflective: true,
      mediated: true
    },
    concept: {
      universal: 'evaluative concept',
      particular: 'necessary adequacy',
      individual: 'apodictic judgment'
    },
    emergesFrom: options.emergesFrom || 'judgment:concept:problematic',
    pointsTowards: 'syllogism',
    properties: {
      expressesNecessity: true,
      providesFullGrounding: true,
      synthesizesImmediacyAndMediation: true,
      representsHighestFormOfJudgment: true
    }
  };
}

// =========================================================
// JUDGMENT SYSTEM - Core functionality
// =========================================================

/**
 * Judgment System
 * 
 * Main class that provides functionality for working with
 * Hegelian judgments in the Neo ecosystem
 */
export class JudgmentSystem {
  private judgments: Map<string, Judgment> = new Map();
  
  /**
   * Create a judgment based on type
   */
  createJudgment(
    type: JudgmentType,
    subtype: JudgmentSubtype,
    subject: string,
    predicate: string,
    options: any = {}
  ): Judgment {
    let judgment: Judgment;
    
    // Create judgment based on type and subtype
    if (type === 'existence') {
      if (subtype === 'positive') {
        judgment = createPositiveJudgment(subject, predicate, options);
      } else if (subtype === 'negative') {
        judgment = createNegativeJudgment(subject, predicate, options);
      } else {
        judgment = createInfiniteJudgment(subject, predicate, options);
      }
    } else if (type === 'reflection') {
      if (subtype === 'singular') {
        judgment = createSingularReflectionJudgment(subject, predicate, options);
      } else if (subtype === 'particular') {
        judgment = createParticularReflectionJudgment(subject, predicate, options);
      } else {
        judgment = createUniversalReflectionJudgment(subject, predicate, options);
      }
    } else if (type === 'necessity') {
      if (subtype === 'categorical') {
        judgment = createCategoricalNecessityJudgment(subject, predicate, options);
      } else if (subtype === 'hypothetical') {
        judgment = createHypotheticalNecessityJudgment(subject, predicate, options);
      } else {
        judgment = createDisjunctiveNecessityJudgment(subject, 
          Array.isArray(predicate) ? predicate : [predicate], options);
      }
    } else { // type === 'concept'
      if (subtype === 'assertoric') {
        judgment = createAssertoricalConceptJudgment(subject, predicate, options);
      } else if (subtype === 'problematic') {
        judgment = createProblematicConceptJudgment(subject, predicate, options);
      } else {
        judgment = createApodicticalConceptJudgment(subject, predicate, options);
      }
    }
    
    // Store judgment
    this.judgments.set(judgment.id, judgment);
    
    return judgment;
  }
  
  /**
   * Get judgment by ID
   */
  getJudgment(id: string): Judgment | undefined {
    return this.judgments.get(id);
  }
  
  /**
   * Convert judgment to string expression
   */
  toExpression(judgment: Judgment): string {
    let expression = '';
    
    switch (judgment.copula.type) {
      case 'is':
        expression = `${judgment.subject.term} is ${judgment.predicate.term}`;
        break;
      case 'is not':
        expression = `${judgment.subject.term} is not ${judgment.predicate.term}`;
        break;
      case 'might be':
        expression = `${judgment.subject.term} might be ${judgment.predicate.term}`;
        break;
      case 'must be':
        expression = `${judgment.subject.term} must be ${judgment.predicate.term}`;
        break;
      case 'is either':
        expression = `${judgment.subject.term} is either ${judgment.predicate.term}`;
        break;
      case 'if-then':
        expression = `${judgment.subject.term} ${judgment.predicate.term}`;
        break;
    }
    
    return expression;
  }
  
  /**
   * Convert judgment to Neo node
   */
  toNode(judgment: Judgment): NeoNode {
    return createNeoNode({
      id: judgment.id,
      type: `judgment:${judgment.type}:${judgment.subtype}`,
      being: {
        quality: judgment.being.quality,
        immediate: judgment.being.immediate
      },
      essence: {
        appearance: judgment.essence.appearance,
        reflective: judgment.essence.reflective,
        mediated: judgment.essence.mediated
      },
      concept: {
        universal: judgment.concept.universal,
        particular: judgment.concept.particular,
        individual: judgment.concept.individual,
        purpose: 'judgment'
      },
      properties: {
        subject: judgment.subject.term,
        predicate: judgment.predicate.term,
        copula: judgment.copula.type,
        expression: this.toExpression(judgment),
        ...judgment.properties
      },
      metadata: {
        emergesFrom: judgment.emergesFrom,
        pointsTowards: judgment.pointsTowards
      }
    });
  }
  
  /**
   * Develop judgment to next form
   */
  developJudgment(judgment: Judgment): Judgment | null {
    if (!judgment.pointsTowards) {
      return null;
    }
    
    const [type, subtype] = judgment.pointsTowards.split(':').slice(1);
    
    if (!type || !subtype) {
      return null;
    }
    
    // Create the next judgment in the dialectical progression
    return this.createJudgment(
      type as JudgmentType,
      subtype as JudgmentSubtype,
      judgment.subject.term,
      judgment.predicate.term,
      { emergesFrom: judgment.id }
    );
  }
  
  /**
   * Find judgments by type
   */
  findJudgmentsByType(type: JudgmentType, subtype?: JudgmentSubtype): Judgment[] {
    const results: Judgment[] = [];
    
    for (const judgment of this.judgments.values()) {
      if (judgment.type === type) {
        if (!subtype || judgment.subtype === subtype) {
          results.push(judgment);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Clear all judgments
   */
  clear(): void {
    this.judgments.clear();
  }
  
  /**
   * Create entire dialectical progression starting from positive judgment
   */
  createDialecticalProgression(
    subject: string,
    initialPredicate: string
  ): Judgment[] {
    const progression: Judgment[] = [];
    
    // Start with positive judgment
    let current = this.createJudgment('existence', 'positive', subject, initialPredicate);
    progression.push(current);
    
    // Develop through all forms
    while (current && current.pointsTowards) {
      const next = this.developJudgment(current);
      if (!next) break;
      
      progression.push(next);
      current = next;
    }
    
    return progression;
  }
}

/**
 * Create judgment system
 */
export function createJudgmentSystem(): JudgmentSystem {
  return new JudgmentSystem();
}

export default createJudgmentSystem;