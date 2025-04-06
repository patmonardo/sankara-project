import { registry } from '../../lib/data/being/registry';
import { topicalRegistry } from './reflection';
import { dialecticalDeterminator } from './ground';

/**
 * Essence - The Sphere of Reflective Determinations
 *
 * This module unifies the reflective and ground systems,
 * representing the complete Qualitative Logic of Essence.
 *
 * It provides the bridge between Being (Registry) and
 * Appearance (the UI components).
 */
export class Essence {
  private static instance: Essence;

  // Core components of the Essence system
  private reflection: typeof topicalRegistry;
  private ground: typeof dialecticalDeterminator;

  private constructor() {
    // Initialize the Essence components
    this.reflection = topicalRegistry;
    this.ground = dialecticalDeterminator;

    this.initializeEssentialSystem();
  }

  private initializeEssentialSystem() {
    // Register the fundamental essence concepts
    this.registerEssentialConcepts();
  }

  private registerEssentialConcepts() {
    // Register the "Reflection" concept
    const reflectionEntity = registry.registerEntity({
      type: 'essence.concept',
      id: 'reflection',
      name: 'Reflection',
      description: 'The dialectical movement of appearance reflecting back into itself',
      properties: {
        essential: true,
        hegelian: 'Reflection (Shine/Schein reflected back into itself)',
        moment: 'first'
      }
    });

    // Register the "Appearance" concept
    const appearanceEntity = registry.registerEntity({
      type: 'essence.concept',
      id: 'appearance',
      name: 'Appearance',
      description: 'The manifestation of essence in determinate form',
      properties: {
        essential: true,
        hegelian: 'Appearance (Erscheinung)',
        moment: 'second'
      }
    });

    // Register the "Actuality" concept
    const actualityEntity = registry.registerEntity({
      type: 'essence.concept',
      id: 'actuality',
      name: 'Actuality',
      description: 'The unity of essence and appearance',
      properties: {
        essential: true,
        hegelian: 'Actuality (Wirklichkeit)',
        moment: 'third'
      }
    });

    // Create relations between these concepts
    registry.createRelation({
      source: { entity: reflectionEntity.type, id: reflectionEntity.id },
      target: { entity: appearanceEntity.type, id: appearanceEntity.id },
      type: 'essence.develops_into',
      properties: {
        hegelian: 'Reflection develops into Appearance'
      }
    });

    registry.createRelation({
      source: { entity: appearanceEntity.type, id: appearanceEntity.id },
      target: { entity: actualityEntity.type, id: actualityEntity.id },
      type: 'essence.unifies_as',
      properties: {
        hegelian: 'Appearance unifies as Actuality'
      }
    });
  }

  public static getInstance(): Essence {
    if (!Essence.instance) {
      Essence.instance = new Essence();
    }
    return Essence.instance;
  }

  /**
   * Create a reflective appearance
   *
   * This bridges the gap between the reflection system (marks/topics)
   * and the appearance system (visual representation).
   */
  createReflectiveAppearance(entityRef: {
    entity: string;
    id: string;
  }, appearanceType: string): {
    entityRef: { entity: string; id: string };
    appearance: {
      type: string;
      reflections: Array<{ mark: string; value: any }>;
      topics: string[];
      visualProperties: Record<string, any>;
    };
  } {
    // Get the entity
    const entity = registry.getEntityByRef(entityRef);
    if (!entity) {
      throw new Error(`Entity not found: ${entityRef.entity}:${entityRef.id}`);
    }

    // Find all marks applied to the entity
    const markRelations = registry.findRelationsBySourceAndType(
      entityRef,
      'topic.has_mark'
    );

    // Extract mark information
    const reflections = markRelations.map(relation => {
      const markEntity = registry.getEntityByRef(relation.target);
      return {
        mark: markEntity?.name || relation.target.id,
        value: relation.properties?.value || true
      };
    });

    // Find all topics the entity is categorized under
    const topicRelations = registry.findRelationsBySourceAndType(
      entityRef,
      'topic.categorized_as'
    );

    // Extract topic names
    const topics = topicRelations
      .map(relation => {
        const topicEntity = registry.getEntityByRef(relation.target);
        return topicEntity?.name || relation.target.id;
      });

    // Determine visual properties based on marks and appearance type
    const visualProperties = this.determineVisualProperties(
      reflections,
      appearanceType
    );

    return {
      entityRef,
      appearance: {
        type: appearanceType,
        reflections,
        topics,
        visualProperties
      }
    };
  }

  /**
   * Determine visual properties based on marks and appearance type
   */
  private determineVisualProperties(
    reflections: Array<{ mark: string; value: any }>,
    appearanceType: string
  ): Record<string, any> {
    const visualProperties: Record<string, any> = {};

    // Apply appearance rules based on marks
    for (const reflection of reflections) {
      switch (reflection.mark) {
        case 'color':
          visualProperties.color = reflection.value;
          break;
        case 'size':
          visualProperties.size = reflection.value;
          break;
        case 'importance':
          // Map importance to visual emphasis
          if (typeof reflection.value === 'number') {
            visualProperties.emphasis = reflection.value;
            visualProperties.fontSize = 14 + (reflection.value * 2);
          }
          break;
        case 'status':
          // Map status to visual indicators
          switch (reflection.value) {
            case 'active':
              visualProperties.statusColor = '#4CAF50';
              break;
            case 'warning':
              visualProperties.statusColor = '#FFC107';
              break;
            case 'error':
              visualProperties.statusColor = '#F44336';
              break;
            default:
              visualProperties.statusColor = '#9E9E9E';
          }
          break;
      }

      // Store the raw reflection value as well
      visualProperties[`mark_${reflection.mark}`] = reflection.value;
    }

    // Apply appearance-type specific defaults
    switch (appearanceType) {
      case 'node':
        visualProperties.shape = visualProperties.shape || 'circle';
        visualProperties.radius = visualProperties.radius || 5;
        visualProperties.color = visualProperties.color || '#1976D2';
        break;
      case 'card':
        visualProperties.elevation = visualProperties.elevation || 1;
        visualProperties.cornerRadius = visualProperties.cornerRadius || 4;
        break;
      case 'list-item':
        visualProperties.height = visualProperties.height || 48;
        visualProperties.divider = visualProperties.divider !== undefined
          ? visualProperties.divider
          : true;
        break;
    }

    return visualProperties;
  }

  /**
   * Create a dialectical appearance sequence
   *
   * This uses the ground system to create a sequence of appearances
   * that transform according to dialectical rules.
   */
  async createDialecticalAppearanceSequence(
    entityRef: { entity: string; id: string },
    sequenceName: string,
    states: string[],
    transitions: Array<{
      from: string;
      to: string;
      condition: { type: string; expression: string };
      visualTransformation: Record<string, any>;
    }>
  ): Promise<{
    sequenceRef: { entity: string; id: string };
    initialAppearance: Record<string, any>;
  }> {
    // Create a dialectical sequence
    const sequenceRef = this.ground.createDialecticalSequence(
      sequenceName,
      states[0]
    );

    // Define all states
    const stateRefs: Record<string, { entity: string; id: string }> = {};

    for (const state of states) {
      stateRefs[state] = this.ground.defineState(sequenceRef, state);
    }

    // Define all transitions
    for (const transition of transitions) {
      this.ground.defineTransition(
        sequenceRef,
        stateRefs[transition.from],
        stateRefs[transition.to],
        transition.condition
      );

      // Create a relation between the transition and its visual transformation
      const transitionEntity = registry.registerEntity({
        type: 'appearance.transformation',
        name: `${transition.from} → ${transition.to}`,
        description: `Visual transformation from ${transition.from} to ${transition.to}`,
        properties: {
          transformation: transition.visualTransformation,
          defined: new Date()
        }
      });

      // Link the visual transformation to the entity
      registry.createRelation({
        source: { entity: transitionEntity.type, id: transitionEntity.id },
        target: entityRef,
        type: 'appearance.transforms'
      });
    }

    // Create the initial appearance
    const initialAppearance = this.createReflectiveAppearance(
      entityRef,
      'dialectical'
    );

    // Link the appearance to the sequence
    registry.createRelation({
      source: sequenceRef,
      target: entityRef,
      type: 'dialectic.appears_as'
    });

    return {
      sequenceRef,
      initialAppearance: initialAppearance.appearance.visualProperties
    };
  }

  /**
   * Advance the appearance to the next state
   */
  async advanceAppearance(
    sequenceRef: { entity: string; id: string },
    context?: Record<string, any>
  ): Promise<{
    previousState: string;
    currentState: string;
    visualTransformation: Record<string, any>;
    newAppearance: Record<string, any>;
  }> {
    // Use the ground system to advance the state
    const result = await this.ground.next(sequenceRef, context);

    // If state changed, find the visual transformation
    if (result.currentState !== result.previousState) {
      // Find the entity being transformed
      const appearanceRelation = registry.findRelationsBySourceAndType(
        sequenceRef,
        'dialectic.appears_as'
      )[0];

      if (!appearanceRelation) {
        throw new Error(`No appearance found for sequence ${sequenceRef.entity}:${sequenceRef.id}`);
      }

      const entityRef = appearanceRelation.target;

      // Find the transformation for this state transition
      const transformations = registry.findEntitiesByType('appearance.transformation')
        .filter(entity =>
          entity.name === `${result.previousState} → ${result.currentState}`
        );

      const transformation = transformations[0]?.properties?.transformation || {};

      // Create the new appearance
      const newAppearance = this.createReflectiveAppearance(
        entityRef,
        'dialectical'
      );

      // Apply the transformation
      const transformedAppearance = {
        ...newAppearance.appearance.visualProperties,
        ...transformation
      };

      return {
        previousState: result.previousState,
        currentState: result.currentState,
        visualTransformation: transformation,
        newAppearance: transformedAppearance
      };
    } else {
      // State didn't change, return unchanged appearance
      return {
        previousState: result.previousState,
        currentState: result.currentState,
        visualTransformation: {},
        newAppearance: {}
      };
    }
  }
}

// Export the singleton
export const essence = Essence.getInstance();
