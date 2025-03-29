import { QueryOperators, PropertyFilterValue } from '@/core/being/schema/filters';

/**
 * Event types for system objects
 */
export type SystemEvent<T = any> = {
  type: string;
  target: T;
  data?: any;
  timestamp: Date;
};

/**
 * EventEmitter - Base class for system-wide event handling
 */
export class EventEmitter<T extends SystemEvent = SystemEvent> {
  private listeners: Map<string, ((event: T) => void)[]> = new Map();

  /**
   * Register an event listener
   *
   * @param eventType - Type of event to listen for, or '*' for all events
   * @param listener - Callback function to execute when event occurs
   * @returns Function to unsubscribe
   */
  on(eventType: string, listener: (event: T) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (!listeners) return;

      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }

      // Clean up empty listener arrays
      if (listeners.length === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Register a one-time event listener
   *
   * @param eventType - Type of event to listen for, or '*' for all events
   * @param listener - Callback function to execute when event occurs
   * @returns Function to unsubscribe
   */
  once(eventType: string, listener: (event: T) => void): () => void {
    // Create a wrapper that will unsubscribe after first execution
    const wrappedListener = (event: T) => {
      // Unsubscribe first to prevent recursion if handler emits same event
      unsubscribe();
      listener(event);
    };

    // Get unsubscribe function
    const unsubscribe = this.on(eventType, wrappedListener);
    return unsubscribe;
  }

  /**
   * Remove all listeners for an event type
   *
   * @param eventType - Type of event to remove listeners for, or undefined for all
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event type
   *
   * @param eventType - Type of event to count listeners for, or '*' for all
   * @returns Number of listeners
   */
  listenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.length || 0;
  }

  /**
   * Emit an event to all registered listeners
   *
   * @param event - Event to emit
   */
  protected emit(event: T): void {
    // Get specific event listeners
    const typeListeners = this.listeners.get(event.type) || [];

    // Get wildcard listeners
    const wildcardListeners = this.listeners.get('*') || [];

    // Combine and execute all listeners
    const allListeners = [...typeListeners, ...wildcardListeners];

    for (const listener of allListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    }
  }
}

/**
 * SystemPropertyHandler - Base class for handling properties and property filtering
 */
export class SystemPropertyHandler {
  /**
   * Check if a property value matches a filter value
   *
   * @param propValue - The property value to check
   * @param filterValue - The filter value to match against
   * @returns True if the property matches the filter, false otherwise
   */
  static matchesPropertyFilter(propValue: any, filterValue: PropertyFilterValue): boolean {
    // Handle null/undefined property values
    if (propValue === undefined || propValue === null) {
      // Only $exists operator or direct null/undefined comparison should match
      if (typeof filterValue === 'object' && filterValue !== null && !Array.isArray(filterValue)) {
        if ('$exists' in filterValue) {
          return filterValue.$exists === false;
        }
        if ('$eq' in filterValue) {
          return filterValue.$eq === null || filterValue.$eq === undefined;
        }
        if ('$ne' in filterValue) {
          return filterValue.$ne !== null && filterValue.$ne !== undefined;
        }
      }

      return filterValue === null || filterValue === undefined;
    }

    // Handle query operators
    if (filterValue && typeof filterValue === 'object' && !Array.isArray(filterValue)) {
      // Handle query operators for property
      return SystemPropertyHandler.evaluateQueryOperators(propValue, filterValue as QueryOperators);
    }

    // Simple equality comparison
    return propValue === filterValue;
  }

  /**
   * Evaluate query operators against a property value
   *
   * @param propValue - The property value to check
   * @param operators - The query operators to evaluate
   * @returns True if all operators pass, false otherwise
   */
  private static evaluateQueryOperators(propValue: any, operators: QueryOperators): boolean {
    // Check each operator - all must pass
    for (const [op, operatorValue] of Object.entries(operators)) {
      // Skip non-operator properties
      if (!op.startsWith('$')) continue;

      // Evaluate the operator
      switch (op) {
        case "$eq":
          if (propValue !== operatorValue) return false;
          break;

        case "$ne":
          if (propValue === operatorValue) return false;
          break;

        case "$gt":
          if (typeof propValue !== "number" || propValue <= operatorValue) return false;
          break;

        case "$gte":
          if (typeof propValue !== "number" || propValue < operatorValue) return false;
          break;

        case "$lt":
          if (typeof propValue !== "number" || propValue >= operatorValue) return false;
          break;

        case "$lte":
          if (typeof propValue !== "number" || propValue > operatorValue) return false;
          break;

        case "$in":
          if (!Array.isArray(operatorValue) || !operatorValue.includes(propValue)) return false;
          break;

        case "$nin":
          if (!Array.isArray(operatorValue) || operatorValue.includes(propValue)) return false;
          break;

        case "$exists":
          if (operatorValue && propValue === undefined) return false;
          if (!operatorValue && propValue !== undefined) return false;
          break;

        case "$contains":
          if (typeof propValue === "string") {
            if (typeof operatorValue !== "string" || !propValue.includes(operatorValue)) return false;
          } else if (Array.isArray(propValue)) {
            if (!propValue.includes(operatorValue)) return false;
          } else {
            return false;
          }
          break;

        case "$containsAll":
          if (!Array.isArray(propValue) || !Array.isArray(operatorValue)) return false;
          if (!operatorValue.every(item => propValue.includes(item))) return false;
          break;

        case "$containsAny":
          if (!Array.isArray(propValue) || !Array.isArray(operatorValue)) return false;
          if (!operatorValue.some(item => propValue.includes(item))) return false;
          break;

        case "$startsWith":
          if (typeof propValue !== "string" || !propValue.startsWith(operatorValue)) return false;
          break;

        case "$endsWith":
          if (typeof propValue !== "string" || !propValue.endsWith(operatorValue)) return false;
          break;

        default:
          // Unknown operator - treat as not passing
          console.warn(`Unknown query operator: ${op}`);
          return false;
      }
    }

    // All operators passed
    return true;
  }

  /**
   * Filter an array of objects by property filters
   *
   * @param items - Array of objects to filter
   * @param propertyFilters - Property filters to apply
   * @param getProperties - Function to get properties from an item
   * @returns Filtered array of items
   */
  static filterByProperties<T>(
    items: T[],
    propertyFilters: Record<string, any> | undefined,
    getProperties: (item: T) => Record<string, any> | undefined
  ): T[] {
    if (!propertyFilters) return items;

    return items.filter(item => {
      const properties = getProperties(item);
      if (!properties) return false;

      for (const [key, filterValue] of Object.entries(propertyFilters)) {
        const propValue = properties[key];

        if (!SystemPropertyHandler.matchesPropertyFilter(propValue, filterValue)) {
          return false;
        }
      }

      return true;
    });
  }
}
