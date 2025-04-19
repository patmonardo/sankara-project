/**
 * The Trika Protocol - The A Priori Foundation
 */
class TrikaProtocol {
  // Entity, Property, Relation definitions remain unchanged
  // ...

  /**
   * Note that there is NO "defineAction" method at this level!
   * Actions cannot exist in the a priori domain
   */
}

/**
 * The MVC Protocol - The A Posteriori Manifestation
 */
class MVCProtocol {
  // Model, View definitions (derived from Entity, Property)
  // ...

  /**
   * Action - Exists ONLY at the a posteriori level
   * 
   * Actions are temporal manifestations that occur in the realm
   * that supports such actions, never at the a priori level.
   */
  static defineAction(
    controllerName: string,
    actionName: string,
    implementation: (source: Instance, target: Instance, context: any) => Promise<any>
  ): string {
    const action = new Action(controllerName, actionName, implementation);
    Registry.registerAction(action);
    return action.id;
  }
  
  /**
   * Execute an action - the fundamental a posteriori operation
   */
  static async executeAction(
    actionId: string,
    sourceId: string,
    targetId: string,
    context?: any
  ): Promise<ActionResult> {
    const action = Registry.getAction(actionId);
    if (!action) throw new Error(`Action not found: ${actionId}`);
    
    const source = Registry.getInstance(sourceId);
    if (!source) throw new Error(`Source instance not found: ${sourceId}`);
    
    const target = Registry.getInstance(targetId);
    if (!target) throw new Error(`Target instance not found: ${targetId}`);
    
    // Create temporal record of this action
    const executionId = `execution-${actionId}-${Date.now()}`;
    Registry.recordExecution({
      id: executionId,
      actionId,
      sourceId,
      targetId,
      context,
      startTime: Date.now(),
      status: 'started'
    });
    
    try {
      // Execute the action in temporal reality
      const result = await action.implementation(source, target, context);
      
      // Record completion
      Registry.updateExecution(executionId, {
        status: 'completed',
        result,
        endTime: Date.now()
      });
      
      return {
        success: true,
        result
      };
    } catch (error) {
      // Record failure
      Registry.updateExecution(executionId, {
        status: 'failed',
        error: error.message,
        endTime: Date.now()
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Action - A purely a posteriori concept
 * Cannot exist in the a priori domain
 */
class Action {
  id: string;
  
  constructor(
    public controllerName: string,
    public name: string,
    public implementation: (source: Instance, target: Instance, context: any) => Promise<any>
  ) {
    this.id = `action-${controllerName}-${name}-${Date.now()}`;
  }
}

/**
 * ActionExecution - Records the temporal manifestation of an action
 * The historical trace of action in the a posteriori world
 */
interface ActionExecution {
  id: string;
  actionId: string;
  sourceId: string;
  targetId: string;
  context?: any;
  startTime: number;
  endTime?: number;
  status: 'started' | 'completed' | 'failed';
  result?: any;
  error?: string;
}