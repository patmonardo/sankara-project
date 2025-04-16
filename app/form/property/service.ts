import { FormRelation } from "@/form/relation/relation";
import { FormEntity } from "@/form/entity/entity";
import { PropertyEngineVerbs } from "./engine";
import { v4 as uuidv4 } from "uuid";

// Placeholder for getting a system entity to be the source of service verbs
const getServiceSourceEntity = (): FormEntity => {
    return FormEntity.findOrCreate({ id: 'system:propertyService', type: 'System::Service' });
};

/**
 * PropertyService - API layer for property operations.
 * Translates requests into verbs emitted for PropertyEngine.
 */
export class PropertyService {

  /**
   * Request the creation of a new property definition/instance.
   * Emits 'propertyEngine:requestCreation'.
   */
  static createProperty(
    options: {
      id?: string;
      name: string;
      description?: string;
      propertyType: 'qualitative' | 'quantitative' | 'derived' | 'scripted'; // Example types
      contextId?: string; // Optional context association
      entityId?: string; // Optional entity association
      relationId?: string; // Optional relation association
      staticValue?: any; // Initial static value if applicable
      derivedFrom?: string[]; // For derived properties
      scriptId?: string; // For scripted properties
      qualitative?: { possibleValues: string[] }; // Qualitative details
      quantitative?: { dataType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'; unit?: string; range?: { min?: number; max?: number } }; // Quantitative details
    },
    requestMetadata?: Record<string, any>
  ): string { // Return the generated/requested ID
    const serviceEntity = getServiceSourceEntity();
    const propertyId = options.id || `prop:${uuidv4()}`; // Generate ID if not provided

    // Prepare content matching expected PropertySchema/Engine input
    const verbContent = {
      id: propertyId,
      name: options.name,
      description: options.description,
      propertyType: options.propertyType,
      contextId: options.contextId,
      entityId: options.entityId,
      relationId: options.relationId,
      staticValue: options.staticValue,
      derivedFrom: options.derivedFrom,
      scriptId: options.scriptId,
      qualitative: options.qualitative,
      quantitative: options.quantitative,
      // Engine will add created/updated timestamps
    };
    const verbMetadata = { ...(requestMetadata || {}), contextId: options.contextId };

    console.log(`PropertyService: Requesting creation for property '${options.name}' (ID: ${propertyId})`);

    FormRelation.emit(
        serviceEntity,
        PropertyEngineVerbs.REQUEST_CREATE, // Use the creation verb
        verbContent,
        verbMetadata
    );

    return propertyId; // Return the ID
  }

  /**
   * Request setting a property value on an entity/relation within a context.
   * Emits 'propertyEngine:requestSet'.
   */
  static setProperty(
    contextId: string,
    targetId: string, // Can be entityId or relationId
    propertyName: string,
    value: any,
    options?: {
      targetType?: 'entity' | 'relation'; // Clarify target
      // ... other options ...
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
      contextId,
      targetId,
      propertyName,
      value,
      options: { ...(options || {}), targetType: options?.targetType || 'entity' }, // Default to entity
    };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        PropertyEngineVerbs.REQUEST_SET, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request getting a property value from an entity/relation within a context.
   * Emits 'propertyEngine:requestGet'.
   */
  static getProperty(
    contextId: string,
    targetId: string, // Can be entityId or relationId
    propertyName: string,
    options?: { targetType?: 'entity' | 'relation' },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
        contextId,
        targetId,
        propertyName,
        options: { ...(options || {}), targetType: options?.targetType || 'entity' },
    };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        PropertyEngineVerbs.REQUEST_GET, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request getting all properties of an entity/relation within a context.
   * Emits 'propertyEngine:requestGetAll'.
   */
  static getAllProperties(
    contextId: string,
    targetId: string, // Can be entityId or relationId
    options?: { targetType?: 'entity' | 'relation' },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
        contextId,
        targetId,
        options: { ...(options || {}), targetType: options?.targetType || 'entity' },
    };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        PropertyEngineVerbs.REQUEST_GET_ALL, // Use new verb
        verbContent,
        verbMetadata
    );
  }

   /**
    * Request deleting a property from an entity/relation.
    * Emits 'propertyEngine:requestDelete'.
    */
   static deleteProperty(
    contextId: string,
    targetId: string, // Can be entityId or relationId
    propertyName: string,
    options?: {
        targetType?: 'entity' | 'relation';
        deleteAllHistory?: boolean;
        timestamp?: number;
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
        contextId,
        targetId,
        propertyName,
        options: { ...(options || {}), targetType: options?.targetType || 'entity' },
    };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        PropertyEngineVerbs.REQUEST_DELETE, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request defining a derived property.
   * Emits 'propertyEngine:requestDefineDerived'.
   */
  static defineDerivedProperty(
    contextId: string,
    targetId: string, // Can be entityId or relationId
    propertyName: string,
    definition: {
      dependencies: string[];
      derivation: string;
    },
    options?: { targetType?: 'entity' | 'relation' },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
        contextId,
        targetId,
        propertyName,
        definition,
        options: { ...(options || {}), targetType: options?.targetType || 'entity' },
    };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        PropertyEngineVerbs.REQUEST_DEFINE_DERIVED, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request validating a property against specified rules.
   * Emits 'propertyEngine:requestValidate'.
   */
  static validateProperty(
    contextId: string,
    targetId: string, // Can be entityId or relationId
    propertyName: string,
    rules: Array<{ ruleName: string; validator: string; validationType?: "required" | "optional"; }>,
    options?: { targetType?: 'entity' | 'relation' },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
        contextId,
        targetId,
        propertyName,
        rules,
        options: { ...(options || {}), targetType: options?.targetType || 'entity' },
    };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        PropertyEngineVerbs.REQUEST_VALIDATE, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request propagating a property value along relations.
   * Emits 'propertyEngine:requestPropagate'.
   * Note: Propagation might involve coordination between PropertyEngine and RelationEngine.
   */
  static propagateProperty(
    contextId: string,
    sourceEntityId: string, // Propagation starts from an entity
    propertyName: string,
    relationType: string,
    transformer?: string,
    options?: { direction?: 'outgoing' | 'incoming' | 'both'; depth?: number; },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    // Target type is implicitly 'entity' for the source of propagation
    const verbContent = { contextId, sourceEntityId, propertyName, relationType, transformer, options };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        PropertyEngineVerbs.REQUEST_PROPAGATE, // Use new verb
        verbContent,
        verbMetadata
    );
  }

  /**
   * Request getting the historical values of a property.
   * Emits 'propertyEngine:requestGetHistory'.
   */
  static getPropertyHistory(
    contextId: string,
    targetId: string, // Can be entityId or relationId
    propertyName: string,
    options?: {
      targetType?: 'entity' | 'relation';
      startTime?: number;
      endTime?: number;
      limit?: number;
    },
    requestMetadata?: Record<string, any>
  ): void {
    const serviceEntity = getServiceSourceEntity();
    const verbContent = {
        contextId,
        targetId,
        propertyName,
        options: { ...(options || {}), targetType: options?.targetType || 'entity' },
    };
    const verbMetadata = { ...(requestMetadata || {}), contextId };

    FormRelation.emit(
        serviceEntity,
        PropertyEngineVerbs.REQUEST_GET_HISTORY, // Use new verb
        verbContent,
        verbMetadata
    );
  }
}

// Export the main service class
export default PropertyService;

// For convenience, export individual methods

// Export the static method as a standalone function
export const createProperty = PropertyService.createProperty;
export const setProperty = PropertyService.setProperty;
export const getProperty = PropertyService.getProperty;
export const getAllProperties = PropertyService.getAllProperties;
export const deleteProperty = PropertyService.deleteProperty;
export const defineDerivedProperty = PropertyService.defineDerivedProperty;
// export const getDerivedProperty = PropertyService.getDerivedProperty; // Removed
export const validateProperty = PropertyService.validateProperty;
export const propagateProperty = PropertyService.propagateProperty;
export const getPropertyHistory = PropertyService.getPropertyHistory;