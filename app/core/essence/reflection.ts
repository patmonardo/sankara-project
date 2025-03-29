import { EntityRef } from '../schema/entity';
import { Context } from '../schema/context';
import { registry } from '../idea/registry';

/**
 * TopicalRegistry - System of Reflective Marks
 *
 * While the Registry represents universal principles (Being as such),
 * the TopicalRegistry represents particular principles - the "Right" or "Dharma"
 * of entities organized by their reflective marks (properties).
 *
 * This corresponds to Fichte's second principle - the "not-I" that stands
 * in opposition to the "I" (Registry).
 */
export class TopicalRegistry {
  private static instance: TopicalRegistry;

  // The topical context ID - where topics are organized
  private topicalContextId: string;

  private constructor() {
    this.initializeTopicalSystem();
  }

  /**
   * Initialize the topical system
   */
  private initializeTopicalSystem() {
    // Create the master topical context if it doesn't exist
    const existingContexts = registry.findContextsByType('topical.master');

    if (existingContexts.length > 0) {
      this.topicalContextId = existingContexts[0].id;
    } else {
      // Create the master topical context
      const context = registry.createContext({
        name: 'Master Topical System',
        type: 'topical.master',
        scope: 'global',
        description: 'The organizational system for reflective marks and topics',
        properties: {
          system: true,
          reflective: true,
          dialectical: true
        }
      });

      this.topicalContextId = context.id;

      // Register the foundational topic entities
      this.registerFoundationalTopics();
    }
  }

  /**
   * Register the foundational topics
   */
  private registerFoundationalTopics() {
    // Register the "Mark" concept entity
    const markEntity = registry.registerEntity({
      type: 'topic.concept',
      id: 'mark',
      name: 'Mark',
      description: 'A reflective designation that can be applied to entities',
      properties: {
        dialectical: true,
        reflective: true
      }
    });

    // Register the "Topic" concept entity
    const topicEntity = registry.registerEntity({
      type: 'topic.concept',
      id: 'topic',
      name: 'Topic',
      description: 'A subject matter that organizes entities by their marks',
      properties: {
        dialectical: true,
        reflective: true,
        topical: true
      }
    });

    // Create the relation between Mark and Topic
    registry.createRelation({
      source: { entity: markEntity.type, id: markEntity.id },
      target: { entity: topicEntity.type, id: topicEntity.id },
      type: 'dialectical.becomes',
      properties: {
        fichtean: 'Mark (thesis) becomes Topic (antithesis) through reflection'
      }
    });

    // Add these to the topical context
    registry.addEntitiesToContext(this.topicalContextId, [
      { entity: markEntity.type, id: markEntity.id },
      { entity: topicEntity.type, id: topicEntity.id }
    ]);
  }

  public static getInstance(): TopicalRegistry {
    if (!TopicalRegistry.instance) {
      TopicalRegistry.instance = new TopicalRegistry();
    }
    return TopicalRegistry.instance;
  }

  /**
   * Register a new mark (reflective property)
   */
  registerMark(name: string, properties: {
    description?: string;
    topical?: boolean;
    categories?: string[];
    [key: string]: any;
  } = {}): EntityRef {
    // Create the mark entity
    const markEntity = registry.registerEntity({
      type: 'topic.mark',
      name,
      description: properties.description || `Mark: ${name}`,
      properties: {
        ...properties,
        reflective: true,
        registerTime: new Date()
      }
    });

    // Add to the topical context
    registry.addEntitiesToContext(this.topicalContextId, [
      { entity: markEntity.type, id: markEntity.id }
    ]);

    return { entity: markEntity.type, id: markEntity.id };
  }

  /**
   * Register a topic (organizing principle)
   */
  registerTopic(name: string, properties: {
    description?: string;
    marks?: string[];
    parent?: string;
    [key: string]: any;
  } = {}): EntityRef {
    // Create the topic entity
    const topicEntity = registry.registerEntity({
      type: 'topic.subject',
      name,
      description: properties.description || `Topic: ${name}`,
      properties: {
        ...properties,
        topical: true,
        reflective: true,
        registerTime: new Date()
      }
    });

    // Link to parent topic if provided
    if (properties.parent) {
      const parentRef = this.findTopic(properties.parent);
      if (parentRef) {
        registry.createRelation({
          source: { entity: topicEntity.type, id: topicEntity.id },
          target: parentRef,
          type: 'topic.subtopic_of'
        });
      }
    }

    // Add to the topical context
    registry.addEntitiesToContext(this.topicalContextId, [
      { entity: topicEntity.type, id: topicEntity.id }
    ]);

    // Link to associated marks
    if (properties.marks && properties.marks.length > 0) {
      for (const markName of properties.marks) {
        const markRef = this.findMark(markName);
        if (markRef) {
          registry.createRelation({
            source: { entity: topicEntity.type, id: topicEntity.id },
            target: markRef,
            type: 'topic.marked_by'
          });
        }
      }
    }

    return { entity: topicEntity.type, id: topicEntity.id };
  }

  /**
   * Find a mark by name
   */
  findMark(name: string): EntityRef | undefined {
    const marks = registry.findEntitiesByTypeAndProperty(
      'topic.mark', 'name', name
    );

    return marks.length > 0
      ? { entity: marks[0].type, id: marks[0].id }
      : undefined;
  }

  /**
   * Find a topic by name
   */
  findTopic(name: string): EntityRef | undefined {
    const topics = registry.findEntitiesByTypeAndProperty(
      'topic.subject', 'name', name
    );

    return topics.length > 0
      ? { entity: topics[0].type, id: topics[0].id }
      : undefined;
  }

  /**
   * Mark an entity with a reflective property
   */
  markEntity(entityRef: EntityRef, markName: string, value: any = true): void {
    const markRef = this.findMark(markName);

    if (!markRef) {
      // Create the mark if it doesn't exist
      const newMarkRef = this.registerMark(markName);

      // Create the marking relation
      registry.createRelation({
        source: entityRef,
        target: newMarkRef,
        type: 'topic.has_mark',
        properties: { value }
      });
    } else {
      // Create the marking relation
      registry.createRelation({
        source: entityRef,
        target: markRef,
        type: 'topic.has_mark',
        properties: { value }
      });
    }
  }

  /**
   * Categorize an entity under a topic
   */
  categorizeEntity(entityRef: EntityRef, topicName: string): void {
    let topicRef = this.findTopic(topicName);

    if (!topicRef) {
      // Create the topic if it doesn't exist
      topicRef = this.registerTopic(topicName);
    }

    // Create the categorization relation
    registry.createRelation({
      source: entityRef,
      target: topicRef,
      type: 'topic.categorized_as',
      properties: {
        categorizedAt: new Date()
      }
    });
  }

  /**
   * Find entities marked with a specific mark
   */
  findEntitiesWithMark(markName: string): EntityRef[] {
    const markRef = this.findMark(markName);
    if (!markRef) return [];

    const relations = registry.findRelationsByTargetAndType(
      markRef,
      'topic.has_mark'
    );

    return relations.map(relation => relation.source);
  }

  /**
   * Find entities categorized under a topic
   */
  findEntitiesInTopic(topicName: string): EntityRef[] {
    const topicRef = this.findTopic(topicName);
    if (!topicRef) return [];

    const relations = registry.findRelationsByTargetAndType(
      topicRef,
      'topic.categorized_as'
    );

    return relations.map(relation => relation.source);
  }

  /**
   * Create a topical context - a view organized by topics
   */
  createTopicalContext(name: string, topics: string[]): Context {
    // Create the context
    const context = registry.createContext({
      name,
      type: 'topical.view',
      description: `Topical view: ${name}`,
      properties: {
        topics,
        reflective: true
      }
    });

    // Find all entities in the specified topics
    const entityRefs: EntityRef[] = [];

    for (const topicName of topics) {
      entityRefs.push(...this.findEntitiesInTopic(topicName));
    }

    // Add entities to the context
    if (entityRefs.length > 0) {
      registry.addEntitiesToContext(context.id, entityRefs);
    }

    return context;
  }
}

// Export the singleton
export const topicalRegistry = TopicalRegistry.getInstance();
// ... existing code ...

/**
 * Logical operations through reflective determinations
 *
 * These methods implement the core logical operations as reflective processes,
 * representing the "Laws of Consciousness" in their logical form.
 */
export class ReflectiveLogic {
  private static instance: ReflectiveLogic;
  private registry: typeof topicalRegistry;

  private constructor() {
    this.registry = topicalRegistry;
  }

  public static getInstance(): ReflectiveLogic {
    if (!ReflectiveLogic.instance) {
      ReflectiveLogic.instance = new ReflectiveLogic();
    }
    return ReflectiveLogic.instance;
  }

  /**
   * Identity - A = A
   *
   * The reflective determination of identity where an entity
   * is recognized as itself through its own reflection.
   */
  identity(entityRef: EntityRef): boolean {
    // Get the entity
    const entity = registry.getEntityByRef(entityRef);
    if (!entity) return false;

    // Mark the entity with its own identity
    this.registry.markEntity(entityRef, 'identity', entity.id);

    // Create a self-reflective relation
    registry.createRelation({
      source: entityRef,
      target: entityRef,
      type: 'logic.identity',
      properties: {
        logical: true,
        reflection: 'identity',
        formula: 'A = A'
      }
    });

    return true;
  }

  /**
   * Difference - A ≠ B
   *
   * The reflective determination of difference where two entities
   * are recognized as distinct through their reflections.
   */
  difference(entityRefA: EntityRef, entityRefB: EntityRef): boolean {
    // Get the entities
    const entityA = registry.getEntityByRef(entityRefA);
    const entityB = registry.getEntityByRef(entityRefB);
    if (!entityA || !entityB) return false;

    // Create a difference relation
    registry.createRelation({
      source: entityRefA,
      target: entityRefB,
      type: 'logic.difference',
      properties: {
        logical: true,
        reflection: 'difference',
        formula: 'A ≠ B'
      }
    });

    // Mark both entities with the difference
    this.registry.markEntity(entityRefA, 'different_from', entityRefB.id);
    this.registry.markEntity(entityRefB, 'different_from', entityRefA.id);

    return true;
  }

  /**
   * Contradiction - A ∧ ¬A
   *
   * The reflective determination of contradiction where an entity
   * contains opposing determinations.
   */
  contradiction(entityRef: EntityRef, property: string): boolean {
    // Get the entity
    const entity = registry.getEntityByRef(entityRef);
    if (!entity) return false;

    // Create a mark for the property
    const propertyMarkRef = this.registry.registerMark(property, {
      logical: true,
      type: 'property'
    });

    // Create a mark for the negation of the property
    const negationMarkRef = this.registry.registerMark(`not_${property}`, {
      logical: true,
      type: 'negation',
      negates: property
    });

    // Mark the entity with both the property and its negation
    this.registry.markEntity(entityRef, property, true);
    this.registry.markEntity(entityRef, `not_${property}`, true);

    // Create a contradiction relation
    registry.createRelation({
      source: entityRef,
      target: entityRef,
      type: 'logic.contradiction',
      properties: {
        logical: true,
        reflection: 'contradiction',
        formula: 'A ∧ ¬A',
        property
      }
    });

    return true;
  }

  /**
   * Excluded Middle - A ∨ ¬A
   *
   * The reflective determination of excluded middle where an entity
   * must either have a property or not have it.
   */
  excludedMiddle(entityRef: EntityRef, property: string): EntityRef {
    // Create a topic for the excluded middle
    const topicRef = this.registry.registerTopic(`excluded_middle_${property}`, {
      logical: true,
      property,
      formula: 'A ∨ ¬A'
    });

    // Categorize the entity under this topic
    this.registry.categorizeEntity(entityRef, topicRef.id);

    // Create marks for possible values
    const hasPropertyRef = this.registry.registerMark(property);
    const lacksPropertyRef = this.registry.registerMark(`not_${property}`);

    // Create a relation representing the excluded middle
    registry.createRelation({
      source: hasPropertyRef,
      target: lacksPropertyRef,
      type: 'logic.excluded_middle',
      properties: {
        logical: true,
        reflection: 'excluded_middle',
        formula: 'A ∨ ¬A',
        property
      }
    });

    return topicRef;
  }

  /**
   * Disjunctive Syllogism - (A ∨ B) ∧ ¬A → B
   *
   * The reflective determination of disjunctive syllogism where
   * given a disjunction and the negation of one disjunct,
   * the other disjunct follows.
   */
  disjunctiveSyllogism(
    entityRef: EntityRef,
    disjunction: [string, string],
    negated: string
  ): string {
    // Verify the negated term is part of the disjunction
    const [termA, termB] = disjunction;
    if (negated !== termA && negated !== termB) {
      throw new Error(`Negated term "${negated}" is not part of the disjunction [${termA}, ${termB}]`);
    }

    // The conclusion is the other term
    const conclusion = negated === termA ? termB : termA;

    // Register the disjunction as a topic
    const disjunctionTopic = this.registry.registerTopic(`disjunction_${termA}_${termB}`, {
      logical: true,
      disjunction,
      formula: `(${termA} ∨ ${termB})`
    });

    // Register the negation as a mark
    const negationMark = this.registry.registerMark(`not_${negated}`, {
      logical: true,
      negates: negated
    });

    // Register the conclusion as a mark
    const conclusionMark = this.registry.registerMark(conclusion);

    // Mark the entity with the conclusion
    this.registry.markEntity(entityRef, conclusion, true);

    // Create a syllogism relation
    registry.createRelation({
      source: entityRef,
      target: { entity: 'topic.mark', id: conclusionMark.id },
      type: 'logic.disjunctive_syllogism',
      properties: {
        logical: true,
        reflection: 'disjunctive_syllogism',
        formula: `(${termA} ∨ ${termB}) ∧ ¬${negated} → ${conclusion}`,
        disjunction,
        negated,
        conclusion
      }
    });

    return conclusion;
  }

  /**
   * Create a logical context for evaluating propositions
   */
  createLogicalContext(name: string, axioms: string[]): Context {
    // Create a logical context
    const context = registry.createContext({
      name,
      type: 'logical.evaluation',
      description: `Logical evaluation context: ${name}`,
      properties: {
        logical: true,
        axioms,
        reflective: true,
        created: new Date()
      }
    });

    // Register each axiom as a mark
    for (const axiom of axioms) {
      const markRef = this.registry.registerMark(axiom, {
        logical: true,
        axiom: true
      });

      // Add the axiom to the context
      registry.addEntitiesToContext(context.id, [markRef]);
    }

    return context;
  }
}

// Export the reflective logic singleton
export const reflectiveLogic = ReflectiveLogic.getInstance();
