import { EntityRef } from '../schema/entity';
import { Context } from '../schema/context';
import { registry } from '../idea/registry';

/**
 * DialecticalDeterminator - The Next() Function
 *
 * This class implements the Fichtean movement from thesis (Registry)
 * through antithesis (TopicalRegistry) to synthesis through dialectical determination.
 *
 * It embodies the "Next()" function of finite automata, determining the next state
 * through hypothetical reasoning.
 */
export class DialecticalDeterminator {
  private static instance: DialecticalDeterminator;

  private constructor() {
    this.initializeDialecticalSystem();
  }

  private initializeDialecticalSystem() {
    // Register the fundamental dialectical concepts
    this.registerDialecticalConcepts();
  }

  private registerDialecticalConcepts() {
    // Register the "State" concept
    const stateEntity = registry.registerEntity({
      type: 'dialectic.concept',
      id: 'state',
      name: 'State',
      description: 'A moment in the dialectical progression',
      properties: {
        dialectical: true,
        fichtean: 'Position (Thesis)'
      }
    });

    // Register the "Transition" concept
    const transitionEntity = registry.registerEntity({
      type: 'dialectic.concept',
      id: 'transition',
      name: 'Transition',
      description: 'Movement between dialectical states',
      properties: {
        dialectical: true,
        fichtean: 'Opposition (Antithesis)'
      }
    });

    // Register the "Determination" concept
    const determinationEntity = registry.registerEntity({
      type: 'dialectic.concept',
      id: 'determination',
      name: 'Determination',
      description: 'The result of dialectical movement',
      properties: {
        dialectical: true,
        fichtean: 'Limitation (Synthesis)'
      }
    });

    // Create relations between these concepts
    registry.createRelation({
      source: { entity: stateEntity.type, id: stateEntity.id },
      target: { entity: transitionEntity.type, id: transitionEntity.id },
      type: 'dialectic.negates',
      properties: {
        fichtean: 'Position negates into Opposition'
      }
    });

    registry.createRelation({
      source: { entity: transitionEntity.type, id: transitionEntity.id },
      target: { entity: determinationEntity.type, id: determinationEntity.id },
      type: 'dialectic.synthesizes',
      properties: {
        fichtean: 'Opposition synthesizes into Limitation'
      }
    });

    registry.createRelation({
      source: { entity: determinationEntity.type, id: determinationEntity.id },
      target: { entity: stateEntity.type, id: stateEntity.id },
      type: 'dialectic.posits',
      properties: {
        fichtean: 'Limitation posits new Position'
      }
    });
  }

  public static getInstance(): DialecticalDeterminator {
    if (!DialecticalDeterminator.instance) {
      DialecticalDeterminator.instance = new DialecticalDeterminator();
    }
    return DialecticalDeterminator.instance;
  }

  /**
   * Create a dialectical sequence - the automaton definition
   */
  createDialecticalSequence(name: string, initialState: string): EntityRef {
    // Create the sequence entity
    const sequenceEntity = registry.registerEntity({
      type: 'dialectic.sequence',
      name,
      description: `Dialectical sequence: ${name}`,
      properties: {
        initialState,
        currentState: initialState,
        created: new Date(),
        stateHistory: [initialState]
      }
    });

    return { entity: sequenceEntity.type, id: sequenceEntity.id };
  }

  /**
   * Define a state in a dialectical sequence
   */
  defineState(sequenceRef: EntityRef, name: string, properties: {
    description?: string;
    terminal?: boolean;
    [key: string]: any;
  } = {}): EntityRef {
    // Create the state entity
    const stateEntity = registry.registerEntity({
      type: 'dialectic.state',
      name,
      description: properties.description || `State: ${name}`,
      properties: {
        ...properties,
        dialectical: true
      }
    });

    // Link to the sequence
    registry.createRelation({
      source: sequenceRef,
      target: { entity: stateEntity.type, id: stateEntity.id },
      type: 'dialectic.has_state',
      properties: {
        defined: new Date()
      }
    });

    return { entity: stateEntity.type, id: stateEntity.id };
  }

  /**
   * Define a transition between states
   */
  defineTransition(
    sequenceRef: EntityRef,
    fromStateRef: EntityRef,
    toStateRef: EntityRef,
    condition: {
      type: 'property' | 'relation' | 'context' | 'hypothesis';
      expression: string;
    }
  ): EntityRef {
    // Create the transition entity
    const transitionEntity = registry.registerEntity({
      type: 'dialectic.transition',
      name: `${fromStateRef.id} → ${toStateRef.id}`,
      description: `Transition from ${fromStateRef.id} to ${toStateRef.id}`,
      properties: {
        dialectical: true,
        condition,
        defined: new Date()
      }
    });

    // Link to source state
    registry.createRelation({
      source: { entity: transitionEntity.type, id: transitionEntity.id },
      target: fromStateRef,
      type: 'dialectic.from_state'
    });

    // Link to target state
    registry.createRelation({
      source: { entity: transitionEntity.type, id: transitionEntity.id },
      target: toStateRef,
      type: 'dialectic.to_state'
    });

    // Link to sequence
    registry.createRelation({
      source: sequenceRef,
      target: { entity: transitionEntity.type, id: transitionEntity.id },
      type: 'dialectic.has_transition'
    });

    return { entity: transitionEntity.type, id: transitionEntity.id };
  }

  /**
   * The Next() function - the heart of dialectical determination
   *
   * This evaluates the current state and conditions to determine the next state
   * in the dialectical progression.
   */
  async next(sequenceRef: EntityRef, context?: Record<string, any>): Promise<{
    previousState: string;
    currentState: string;
    transitions: Array<{
      from: string;
      to: string;
      conditionMet: boolean;
      evaluation: Record<string, any>;
    }>;
    terminal: boolean;
  }> {
    // Get the sequence entity
    const sequence = registry.getEntityByRef(sequenceRef);
    if (!sequence) {
      throw new Error(`Sequence not found: ${sequenceRef.entity}:${sequenceRef.id}`);
    }

    // Get current state
    const currentState = sequence.properties.currentState;

    // Create an evaluation context
    const evaluationContext = registry.createContext({
      name: `Dialectical evaluation for ${sequence.name}`,
      type: 'dialectic.evaluation',
      description: `Evaluating next state for sequence ${sequence.id} from state ${currentState}`,
      properties: {
        sequence: sequenceRef,
        currentState,
        evaluationContext: context || {},
        evaluationTime: new Date()
      }
    });

    // Find outgoing transitions from current state
    const currentStateRef = {
      entity: 'dialectic.state',
      id: currentState
    };

    // Find transitions
    const transitions = registry.findRelationsByType('dialectic.has_transition')
      .filter(rel => rel.source.entity === sequenceRef.entity && rel.source.id === sequenceRef.id)
      .map(rel => registry.getEntityByRef(rel.target))
      .filter(entity => entity !== undefined)
      .map(entity => entity!);

    // Evaluate each transition
    const evaluations = [];
    let nextState = currentState;
    let isTerminal = false;

    for (const transition of transitions) {
      // Get source and target states
      const fromRel = registry.findRelationsBySourceAndType(
        { entity: transition.type, id: transition.id },
        'dialectic.from_state'
      )[0];

      const toRel = registry.findRelationsBySourceAndType(
        { entity: transition.type, id: transition.id },
        'dialectic.to_state'
      )[0];

      if (!fromRel || !toRel) continue;

      const fromState = registry.getEntityByRef(fromRel.target);
      const toState = registry.getEntityByRef(toRel.target);

      if (!fromState || !toState) continue;

      // Skip if not from current state
      if (fromState.id !== currentState) continue;

      // Evaluate the condition
      const condition = transition.properties.condition;
      const evaluation = await registry.executeInContext(
        evaluationContext.id,
        'evaluateCondition',
        {
          condition,
          context
        }
      );

      evaluations.push({
        from: fromState.id,
        to: toState.id,
        conditionMet: evaluation.result,
        evaluation: evaluation.evaluation
      });

      // If condition is met, this is our next state
      if (evaluation.result) {
        nextState = toState.id;
        isTerminal = toState.properties.terminal === true;
        break;
      }
    }

    // Update the sequence with the new state
    if (nextState !== currentState) {
      registry.updateEntity(sequence.type, sequence.id, {
        properties: {
          ...sequence.properties,
          currentState: nextState,
          previousState: currentState,
          stateHistory: [...(sequence.properties.stateHistory || []), nextState],
          lastTransition: new Date()
        }
      });
    }

    return {
      previousState: currentState,
      currentState: nextState,
      transitions: evaluations,
      terminal: isTerminal
    };
  }

  /**
   * Run a complete dialectical sequence until a terminal state
   */
  async run(sequenceRef: EntityRef, context?: Record<string, any>, maxSteps: number = 100): Promise<{
    path: string[];
    terminal: boolean;
    steps: number;
    finalState: string;
  }> {
    // Get the sequence
    const sequence = registry.getEntityByRef(sequenceRef);
    if (!sequence) {
      throw new Error(`Sequence not found: ${sequenceRef.entity}:${sequenceRef.id}`);
    }

    const path: string[] = [sequence.properties.currentState];
    let steps = 0;
    let terminal = false;

    while (steps < maxSteps && !terminal) {
      const result = await this.next(sequenceRef, context);

      if (result.currentState !== result.previousState) {
        path.push(result.currentState);
      }

      terminal = result.terminal;
      steps++;

      if (result.currentState === result.previousState) {
        // No transition occurred, we're stuck
        break;
      }
    }

    return {
      path,
      terminal,
      steps,
      finalState: path[path.length - 1]
    };
  }

  /**
   * Create a hypothetical branch - evaluate what would happen if
   */
  async evaluateHypothetical(
    sequenceRef: EntityRef,
    hypotheticalState: string,
    context?: Record<string, any>
  ): Promise<{
    path: string[];
    terminal: boolean;
    steps: number;
    finalState: string;
  }> {
    // Clone the sequence entity for hypothetical evaluation
    const sequence = registry.getEntityByRef(sequenceRef);
    if (!sequence) {
      throw new Error(`Sequence not found: ${sequenceRef.entity}:${sequenceRef.id}`);
    }

    // Create a hypothetical sequence
    const hypotheticalSequence = registry.registerEntity({
      type: 'dialectic.hypothetical',
      name: `Hypothetical: ${sequence.name}`,
      description: `Hypothetical evaluation of ${sequence.name} from state ${hypotheticalState}`,
      properties: {
        sourceSequence: sequenceRef,
        currentState: hypotheticalState,
        hypothetical: true,
        createdAt: new Date(),
        stateHistory: [hypotheticalState]
      }
    });

    const hypotheticalRef = { entity: hypotheticalSequence.type, id: hypotheticalSequence.id };

    // Clone all the states and transitions for this hypothetical
    const states = registry.findRelationsBySourceAndType(sequenceRef, 'dialectic.has_state')
      .map(rel => registry.getEntityByRef(rel.target))
      .filter(entity => entity !== undefined)
      .map(entity => entity!);

    const transitions = registry.findRelationsBySourceAndType(sequenceRef, 'dialectic.has_transition')
      .map(rel => registry.getEntityByRef(rel.target))
      .filter(entity => entity !== undefined)
      .map(entity => entity!);

    // Link states and transitions to the hypothetical sequence
    for (const state of states) {
      registry.createRelation({
        source: hypotheticalRef,
        target: { entity: state.type, id: state.id },
        type: 'dialectic.has_state',
        properties: {
          hypothetical: true
        }
      });
    }

    for (const transition of transitions) {
      registry.createRelation({
        source: hypotheticalRef,
        target: { entity: transition.type, id: transition.id },
        type: 'dialectic.has_transition',
        properties: {
          hypothetical: true
        }
      });
    }

    // Run the hypothetical sequence
    const result = await this.run(hypotheticalRef, context);

    // Mark the hypothetical as completed
    registry.updateEntity(hypotheticalSequence.type, hypotheticalSequence.id, {
      properties: {
        ...hypotheticalSequence.properties,
        completed: true,
        result
      }
    });

    return result;
  }
}

// Export the singleton
export const dialecticalDeterminator = DialecticalDeterminator.getInstance();
// ... existing code ...

/**
 * Mathematical operations through dialectical determination
 *
 * These methods implement the core mathematical operations as dialectical processes,
 * representing the "Laws of Consciousness" in their mathematical form.
 */
export class DialecticalMathematics {
  private static instance: DialecticalMathematics;
  private determinator: typeof dialecticalDeterminator;

  private constructor() {
    this.determinator = dialecticalDeterminator;
    this.initializeMathematicalSystem();
  }

  private initializeMathematicalSystem() {
    // Register fundamental mathematical concepts
    this.registerMathematicalConcepts();
  }

  private registerMathematicalConcepts() {
    // Register the "Number" concept
    const numberEntity = registry.registerEntity({
      type: 'math.concept',
      id: 'number',
      name: 'Number',
      description: 'The quantitative determination of magnitude',
      properties: {
        mathematical: true,
        dialectical: true,
        fundamental: true
      }
    });

    // Register the "Operation" concept
    const operationEntity = registry.registerEntity({
      type: 'math.concept',
      id: 'operation',
      name: 'Operation',
      description: 'The process of transforming quantities',
      properties: {
        mathematical: true,
        dialectical: true,
        fundamental: true
      }
    });

    // Register the "Relation" concept
    const relationEntity = registry.registerEntity({
      type: 'math.concept',
      id: 'relation',
      name: 'Relation',
      description: 'The comparative determination between quantities',
      properties: {
        mathematical: true,
        dialectical: true,
        fundamental: true
      }
    });

    // Create relations between these concepts
    registry.createRelation({
      source: { entity: numberEntity.type, id: numberEntity.id },
      target: { entity: operationEntity.type, id: operationEntity.id },
      type: 'math.undergoes',
      properties: {
        mathematical: true,
        formula: 'Number undergoes Operation'
      }
    });

    registry.createRelation({
      source: { entity: operationEntity.type, id: operationEntity.id },
      target: { entity: relationEntity.type, id: relationEntity.id },
      type: 'math.establishes',
      properties: {
        mathematical: true,
        formula: 'Operation establishes Relation'
      }
    });

    registry.createRelation({
      source: { entity: relationEntity.type, id: relationEntity.id },
      target: { entity: numberEntity.type, id: numberEntity.id },
      type: 'math.determines',
      properties: {
        mathematical: true,
        formula: 'Relation determines Number'
      }
    });
  }

  public static getInstance(): DialecticalMathematics {
    if (!DialecticalMathematics.instance) {
      DialecticalMathematics.instance = new DialecticalMathematics();
    }
    return DialecticalMathematics.instance;
  }

  /**
   * Create a number entity
   */
  createNumber(value: number): EntityRef {
    // Create a number entity
    const numberEntity = registry.registerEntity({
      type: 'math.number',
      name: `Number ${value}`,
      description: `Mathematical number with value ${value}`,
      properties: {
        mathematical: true,
        value,
        created: new Date()
      }
    });

    return { entity: numberEntity.type, id: numberEntity.id };
  }

  /**
   * Addition - dialectical synthesis of quantities
   */
  addition(a: EntityRef, b: EntityRef): EntityRef {
    // Get the number entities
    const entityA = registry.getEntityByRef(a);
    const entityB = registry.getEntityByRef(b);

    if (!entityA || !entityB) {
      throw new Error('Number entities not found');
    }

    const valueA = entityA.properties.value;
    const valueB = entityB.properties.value;

    if (typeof valueA !== 'number' || typeof valueB !== 'number') {
      throw new Error('Entities must have numeric values');
    }

    // Create the result entity
    const result = this.createNumber(valueA + valueB);

    // Create an operation entity to represent this addition
    const operationEntity = registry.registerEntity({
      type: 'math.operation',
      name: `Addition: ${valueA} + ${valueB}`,
      description: `Addition of ${valueA} and ${valueB}`,
      properties: {
        mathematical: true,
        operation: 'addition',
        operands: [valueA, valueB],
        result: valueA + valueB,
        formula: `${valueA} + ${valueB} = ${valueA + valueB}`
      }
    });

    // Link the operands to the operation
    registry.createRelation({
      source: a,
      target: { entity: operationEntity.type, id: operationEntity.id },
      type: 'math.operand_of',
      properties: {
        position: 'first',
        mathematical: true
      }
    });

    registry.createRelation({
      source: b,
      target: { entity: operationEntity.type, id: operationEntity.id },
      type: 'math.operand_of',
      properties: {
        position: 'second',
        mathematical: true
      }
    });

    // Link the operation to the result
    registry.createRelation({
      source: { entity: operationEntity.type, id: operationEntity.id },
      target: result,
      type: 'math.results_in',
      properties: {
        mathematical: true
      }
    });

    return result;
  }

  /**
   * Subtraction - dialectical negation of quantities
   */
  subtraction(a: EntityRef, b: EntityRef): EntityRef {
    // Similar implementation to addition, with subtraction logic
    const entityA = registry.getEntityByRef(a);
    const entityB = registry.getEntityByRef(b);

    if (!entityA || !entityB) {
      throw new Error('Number entities not found');
    }

    const valueA = entityA.properties.value;
    const valueB = entityB.properties.value;

    if (typeof valueA !== 'number' || typeof valueB !== 'number') {
      throw new Error('Entities must have numeric values');
    }

    // Create the result entity
    const result = this.createNumber(valueA - valueB);

    // Create an operation entity
    const operationEntity = registry.registerEntity({
      type: 'math.operation',
      name: `Subtraction: ${valueA} - ${valueB}`,
      description: `Subtraction of ${valueB} from ${valueA}`,
      properties: {
        mathematical: true,
        operation: 'subtraction',
        operands: [valueA, valueB],
        result: valueA - valueB,
        formula: `${valueA} - ${valueB} = ${valueA - valueB}`
      }
    });

    // Create the necessary relations
    registry.createRelation({
      source: a,
      target: { entity: operationEntity.type, id: operationEntity.id },
      type: 'math.operand_of',
      properties: {
        position: 'minuend',
        mathematical: true
      }
    });

    registry.createRelation({
      source: b,
      target: { entity: operationEntity.type, id: operationEntity.id },
      type: 'math.operand_of',
      properties: {
        position: 'subtrahend',
        mathematical: true
      }
    });

    registry.createRelation({
      source: { entity: operationEntity.type, id: operationEntity.id },
      target: result,
      type: 'math.results_in',
      properties: {
        mathematical: true
      }
    });

    return result;
  }

  /**
   * Multiplication - dialectical repetition of quantities
   */
  multiplication(a: EntityRef, b: EntityRef): EntityRef {
    // Implementation similar to addition, with multiplication logic
    const entityA = registry.getEntityByRef(a);
    const entityB = registry.getEntityByRef(b);

    if (!entityA || !entityB) {
      throw new Error('Number entities not found');
    }

    const valueA = entityA.properties.value;
    const valueB = entityB.properties.value;

    if (typeof valueA !== 'number' || typeof valueB !== 'number') {
      throw new Error('Entities must have numeric values');
    }

    // Create the result entity
    const result = this.createNumber(valueA * valueB);

    // Create an operation entity
    const operationEntity = registry.registerEntity({
      type: 'math.operation',
      name: `Multiplication: ${valueA} × ${valueB}`,
      description: `Multiplication of ${valueA} and ${valueB}`,
      properties: {
        mathematical: true,
        operation: 'multiplication',
        operands: [valueA, valueB],
        result: valueA * valueB,
        formula: `${valueA} × ${valueB} = ${valueA * valueB}`
      }
    });

    // Create relations
    registry.createRelation({
      source: a,
      target: { entity: operationEntity.type, id: operationEntity.id },
      type: 'math.operand_of',
      properties: {
        position: 'multiplicand',
        mathematical: true
      }
    });

    registry.createRelation({
      source: b,
      target: { entity: operationEntity.type, id: operationEntity.id },
      type: 'math.operand_of',
      properties: {
        position: 'multiplier',
        mathematical: true
      }
    });

    registry.createRelation({
      source: { entity: operationEntity.type, id: operationEntity.id },
      target: result,
      type: 'math.results_in',
      properties: {
        mathematical: true
      }
    });

    return result;
  }

  /**
   * Create a mathematical sequence through dialectical progression
   */
  createMathematicalSequence(
    name: string,
    initialValue: number,
    formula: string,
    steps: number = 10
  ): EntityRef[] {
    // Create a sequence context
    const sequenceContext = registry.createContext({
      name: `Mathematical Sequence: ${name}`,
      type: 'math.sequence',
      description: `Mathematical sequence defined by formula: ${formula}`,
      properties: {
        mathematical: true,
        formula,
        initialValue,
        steps
      }
    });

    const sequence: EntityRef[] = [];
    let currentValue = initialValue;

    // Create the initial number entity
    let current = this.createNumber(currentValue);
    sequence.push(current);

    // Add to the sequence context
    registry.addEntitiesToContext(sequenceContext.id, [current]);

    // Parse and apply the formula for each step
    for (let i = 1; i < steps; i++) {
      // Evaluate the next value
      // This is a simplified formula evaluator - in a real system,
      // you would use a proper expression evaluator
      let nextValue: number;

      if (formula.includes('n+1')) {
        // Linear sequence: a_n+1 = a_n + constant
        const constant = parseInt(formula.split('=')[1].trim().split('+')[1]);
        nextValue = currentValue + constant;
      } else if (formula.includes('n*')) {
        // Geometric sequence: a_n+1 = a_n * constant
        const constant = parseInt(formula.split('=')[1].trim().split('*')[1]);
        nextValue = currentValue * constant;
      } else if (formula.includes('n^2')) {
        // Quadratic sequence
        nextValue = i * i;
      } else {
        // Default: increment by 1
        nextValue = currentValue + 1;
      }

      // Create the next number entity
      const next = this.createNumber(nextValue);
      sequence.push(next);

      // Add to the sequence context
      registry.addEntitiesToContext(sequenceContext.id, [next]);

      // Create a transition relation between current and next
      registry.createRelation({
        source: current,
        target: next,
        type: 'math.sequence_transition',
        properties: {
          mathematical: true,
          step: i,
          formula,
          from: currentValue,
          to: nextValue
        }
      });

      // Update for next iteration
      current = next;
      currentValue = nextValue;
    }

    return sequence;
  }

  /**
   * Create a mathematical proof using dialectical movement
   */
  createMathematicalProof(
    name: string,
    axioms: string[],
    theorem: string,
    steps: Array<{
      formula: string;
      justification: string;
      derivedFrom: number[];
    }>
  ): EntityRef {
    // Create a proof context
    const proofContext = registry.createContext({
      name: `Mathematical Proof: ${name}`,
      type: 'math.proof',
      description: `Proof of theorem: ${theorem}`,
      properties: {
        mathematical: true,
        theorem,
        axioms,
        steps: steps.length
      }
    });

    // Register the theorem entity
    const theoremEntity = registry.registerEntity({
      type: 'math.theorem',
      name: theorem,
      description: `Theorem: ${theorem}`,
      properties: {
        mathematical: true,
        statement: theorem,
        proven: false
      }
    });

    // Register axiom entities
    const axiomRefs: EntityRef[] = [];
    for (const axiom of axioms) {
      const axiomEntity = registry.registerEntity({
        type: 'math.axiom',
        name: axiom,
        description: `Axiom: ${axiom}`,
        properties: {
          mathematical: true,
          statement: axiom,
          fundamental: true
        }
      });

      axiomRefs.push({ entity: axiomEntity.type, id: axiomEntity.id });
    }

    // Add axioms to the proof context
    registry.addEntitiesToContext(proofContext.id, axiomRefs);

    // Create a dialectical sequence for the proof
    const proofSequence = this.determinator.createDialecticalSequence(
      `Proof of ${theorem}`,
      'start'
    );

    // Register the proof states
    const startState = this.determinator.defineState(proofSequence, 'start', {
      description: 'Initial state with axioms'
    });

    const inProgressState = this.determinator.defineState(proofSequence, 'in_progress', {
      description: 'Proof in progress'
    });

    const completedState = this.determinator.defineState(proofSequence, 'completed', {
      description: 'Proof completed',
      terminal: true
    });

    // Define transitions
    this.determinator.defineTransition(
      proofSequence,
      startState,
      inProgressState,
      {
        type: 'property',
        expression: 'context.stepsCompleted > 0 && context.stepsCompleted < context.totalSteps'
      }
    );

    this.determinator.defineTransition(
      proofSequence,
      inProgressState,
      completedState,
      {
        type: 'property',
        expression: 'context.stepsCompleted >= context.totalSteps'
      }
    );

    // Register each proof step
    const stepRefs: EntityRef[] = [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepEntity = registry.registerEntity({
        type: 'math.proof_step',
        name: `Step ${i + 1}: ${step.formula}`,
        description: `Proof step: ${step.formula} (${step.justification})`,
        properties: {
          mathematical: true,
          stepNumber: i + 1,
          formula: step.formula,
          justification: step.justification,
          derivedFrom: step.derivedFrom
        }
      });

      stepRefs.push({ entity: stepEntity.type, id: stepEntity.id });

      // Create relations to previous steps/axioms this step depends on
      for (const sourceIdx of step.derivedFrom) {
        let sourceRef: EntityRef;

        if (sourceIdx === 0) {
          // Reference to theorem statement itself
          sourceRef = { entity: theoremEntity.type, id: theoremEntity.id };
        } else if (sourceIdx < 0) {
          // Reference to an axiom
          const axiomIdx = Math.abs(sourceIdx) - 1;
          sourceRef = axiomRefs[axiomIdx];
        } else {
          // Reference to a previous step
          sourceRef = stepRefs[sourceIdx - 1];
        }

        // Create the derivation relation
        registry.createRelation({
          source: sourceRef,
          target: { entity: stepEntity.type, id: stepEntity.id },
          type: 'math.derives',
          properties: {
            mathematical: true,
            justification: step.justification
          }
        });
      }
    }

    // Add all steps to the proof context
    registry.addEntitiesToContext(proofContext.id, stepRefs);

    // Link the final step to the theorem to mark it as proven
    if (stepRefs.length > 0) {
      const finalStep = stepRefs[stepRefs.length - 1];

      registry.createRelation({
        source: finalStep,
        target: { entity: theoremEntity.type, id: theoremEntity.id },
        type: 'math.proves',
        properties: {
          mathematical: true,
          proven: true,
          provenAt: new Date()
        }
      });

      // Update the theorem to mark it as proven
      registry.updateEntity(theoremEntity.type, theoremEntity.id, {
        properties: {
          ...theoremEntity.properties,
          proven: true,
          provenAt: new Date(),
          provenBy: name
        }
      });
    }

    return { entity: theoremEntity.type, id: theoremEntity.id };
  }
}

// Export the singleton
export const dialecticalMathematics = DialecticalMathematics.getInstance();
