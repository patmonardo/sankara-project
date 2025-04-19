/**
 * The Registry for the Trika Protocol
 */
class Registry {
  private static essences = new Map<string, Essence>();
  private static existences = new Map<string, Existence>();
  private static actualities = new Map<string, Actuality>();
  private static revelations = new Map<string, Revelation>();
  private static movements: Movement[] = [];

  /**
   * Register an essence
   */
  static registerEssence(essence: Essence): void {
    this.essences.set(essence.id, essence);
  }

  /**
   * Get an essence by ID
   */
  static getEssence(id: string): Essence | undefined {
    return this.essences.get(id);
  }

  /**
   * Register an existence
   */
  static registerExistence(existence: Existence): void {
    this.existences.set(existence.id, existence);
  }

  /**
   * Get an existence by ID
   */
  static getExistence(id: string): Existence | undefined {
    return this.existences.get(id);
  }

  /**
   * Register an actuality
   */
  static registerActuality(actuality: Actuality): void {
    this.actualities.set(actuality.id, actuality);
  }

  /**
   * Register a revelation method
   */
  static registerRevelation(name: string, revelation: Revelation): void {
    this.revelations.set(name, revelation);
  }

  /**
   * Get a revelation method
   */
  static getRevelation(name: string): Revelation | undefined {
    return this.revelations.set(name);
  }

  /**
   * Record a movement in the dialectical process
   */
  static recordMovement(movement: Movement): void {
    this.movements.push(movement);
  }

  /**
   * Trace movements related to an entity
   */
  static traceMovements(id: string): Movement[] {
    return this.movements.filter(m => m.fromId === id || m.toId === id)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
}

/**
 * Revelation - Method for transitioning from Existence to Actuality
 */
interface Revelation {
  apply(existence: Existence): Actuality;
}

/**
 * Movement - Records dialectical transitions
 */
interface Movement {
  type: 'Manifestation' | 'Revelation' | 'Transformation';
  fromId: string;
  toId: string;
  timestamp: number;
}