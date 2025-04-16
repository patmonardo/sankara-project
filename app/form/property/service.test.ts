import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'; // Import Mock type
import { PropertyService } from './service';
import { FormRelation } from '@/form/relation/relation';
import { FormEntity } from '@/form/entity/entity';

// --- Mock Setup ---

// Mock the entire FormRelation module
vi.mock('@/form/relation/relation', () => ({
    FormRelation: {
        emit: vi.fn(), // Mock the emit static method
        // Mock other static methods if needed by the service (likely not)
        // send: vi.fn(),
        // subscribeToVerbs: vi.fn(),
    }
}));

// Mock the FormEntity module, specifically providing findOrCreate
vi.mock('@/form/entity/entity', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/form/entity/entity')>(); // Get actual module type if needed
    return {
        ...actual, // Keep other exports like FormEntityId if they exist
        FormEntity: {
            ...actual.FormEntity, // Keep other static/prototype members if needed
            // Provide the mock implementation for findOrCreate
            findOrCreate: vi.fn().mockImplementation((config: { id: string; type: string }) => {
                // Return a simple mock object satisfying the service's needs
                // console.log(`Mock findOrCreate called with:`, config); // Debug log
                return {
                    id: config.id,
                    type: config.type,
                    // Add other properties if the service interacts with them (it shouldn't)
                };
            }),
        },
        __esModule: true,
    };
});

// --- Test Suite ---

describe('PropertyService', () => {
    let mockEmit: Mock;
    let mockFindOrCreate: Mock;
    let mockServiceEntity: { id: string; type: string }; // Type matches the simplified mock return

    beforeEach(() => {
        // Clear mocks before each test
        vi.clearAllMocks();

        // Re-assign mocks in beforeEach to ensure clean state and access after vi.mock runs
        mockEmit = FormRelation.emit as Mock;
        mockFindOrCreate = FormEntity.findOrCreate as Mock;

        // Create the mock service entity instance for checks
        // Note: findOrCreate is called *within* the service methods,
        // so we don't call it here to get the instance, we just check
        // that emit is called *with* the expected source entity structure.
        // We know the structure because we defined the mock implementation.
        mockServiceEntity = { id: 'system:propertyService', type: 'System::Service' };

        // Optional: Check if mocks are assigned correctly
        // console.log('mockEmit assigned:', typeof mockEmit);
        // console.log('mockFindOrCreate assigned:', typeof mockFindOrCreate);
    });

    it('should call FormEntity.findOrCreate when initializing service source entity', () => {
        // Call any service method to trigger the internal findOrCreate
        PropertyService.getProperty(contextId, entityId, propertyName);
        // Verify findOrCreate was called (at least once by the service)
        expect(mockFindOrCreate).toHaveBeenCalledWith({ id: 'system:propertyService', type: 'System::Service' });
    });


    // --- Test Cases (Keep the same assertions as before) ---

    const contextId = 'ctx-123';
    const entityId = 'ent-456';
    const propertyName = 'testProp';

    it('should emit setRequested verb on setProperty', () => {
        const value = 'testValue';
        const options = { persistence: 'persistent' as const };
        const requestMetadata = { traceId: 'trace-set' };

        PropertyService.setProperty(contextId, entityId, propertyName, value, options, requestMetadata);

        expect(mockEmit).toHaveBeenCalledTimes(1);
        // Use expect.objectContaining for the source entity if the exact instance isn't stable
        expect(mockEmit).toHaveBeenCalledWith(
            expect.objectContaining(mockServiceEntity), // Check structure
            'property:setRequested',
            { contextId, entityId, propertyName, value, options },
            { ...requestMetadata, contextId }
        );
    });

    it('should emit getRequested verb on getProperty', () => {
        const requestMetadata = { traceId: 'trace-get' };
        PropertyService.getProperty(contextId, entityId, propertyName, requestMetadata);

        expect(mockEmit).toHaveBeenCalledTimes(1);
        expect(mockEmit).toHaveBeenCalledWith(
            expect.objectContaining(mockServiceEntity),
            'property:getRequested',
            { contextId, entityId, propertyName },
            { ...requestMetadata, contextId }
        );
    });

    it('should emit getAllRequested verb on getAllProperties', () => {
        const requestMetadata = { traceId: 'trace-getAll' };
        PropertyService.getAllProperties(contextId, entityId, requestMetadata);

        expect(mockEmit).toHaveBeenCalledTimes(1);
        expect(mockEmit).toHaveBeenCalledWith(
            expect.objectContaining(mockServiceEntity),
            'property:getAllRequested',
            { contextId, entityId },
            { ...requestMetadata, contextId }
        );
    });

    it('should emit deleteRequested verb on deleteProperty', () => {
        const options = { deleteAllHistory: true };
        const requestMetadata = { traceId: 'trace-delete' };
        PropertyService.deleteProperty(contextId, entityId, propertyName, options, requestMetadata);

        expect(mockEmit).toHaveBeenCalledTimes(1);
        expect(mockEmit).toHaveBeenCalledWith(
            expect.objectContaining(mockServiceEntity),
            'property:deleteRequested',
            { contextId, entityId, propertyName, options },
            { ...requestMetadata, contextId }
        );
    });

    it('should emit defineDerivedRequested verb on defineDerivedProperty', () => {
        const definition = { dependencies: ['dep1'], derivation: 'dep1 * 2' };
        const options = { observable: true };
        const requestMetadata = { traceId: 'trace-defineDerived' };
        PropertyService.defineDerivedProperty(contextId, entityId, propertyName, definition, options, requestMetadata);

        expect(mockEmit).toHaveBeenCalledTimes(1);
        expect(mockEmit).toHaveBeenCalledWith(
            expect.objectContaining(mockServiceEntity),
            'property:defineDerivedRequested',
            { contextId, entityId, propertyName, definition, options },
            { ...requestMetadata, contextId }
        );
    });

     it('should emit getDerivedRequested verb on getDerivedProperty', () => {
        const requestMetadata = { traceId: 'trace-getDerived' };
        PropertyService.getDerivedProperty(contextId, entityId, propertyName, requestMetadata);

        expect(mockEmit).toHaveBeenCalledTimes(1);
        expect(mockEmit).toHaveBeenCalledWith(
            expect.objectContaining(mockServiceEntity),
            'property:getDerivedRequested',
            { contextId, entityId, propertyName },
            { ...requestMetadata, contextId }
        );
    });

    it('should emit validateRequested verb on validateProperty', () => {
        const rules = [{ ruleName: 'required', validator: 'value !== null && value !== undefined' }];
        const requestMetadata = { traceId: 'trace-validate' };
        PropertyService.validateProperty(contextId, entityId, propertyName, rules, requestMetadata);

        expect(mockEmit).toHaveBeenCalledTimes(1);
        expect(mockEmit).toHaveBeenCalledWith(
            expect.objectContaining(mockServiceEntity),
            'property:validateRequested',
            { contextId, entityId, propertyName, rules },
            { ...requestMetadata, contextId }
        );
    });

    it('should emit propagateRequested verb on propagateProperty', () => {
        const relationType = 'relatedTo';
        const transformer = 'value + 1';
        const options = { direction: 'outgoing' as const, depth: 1 };
        const requestMetadata = { traceId: 'trace-propagate' };
        PropertyService.propagateProperty(contextId, entityId, propertyName, relationType, transformer, options, requestMetadata);

        expect(mockEmit).toHaveBeenCalledTimes(1);
        expect(mockEmit).toHaveBeenCalledWith(
            expect.objectContaining(mockServiceEntity),
            'property:propagateRequested',
            { contextId, entityId, propertyName, relationType, transformer, options },
            { ...requestMetadata, contextId }
        );
    });

     it('should emit getHistoryRequested verb on getPropertyHistory', () => {
        const options = { limit: 10 };
        const requestMetadata = { traceId: 'trace-history' };
        PropertyService.getPropertyHistory(contextId, entityId, propertyName, options, requestMetadata);

        expect(mockEmit).toHaveBeenCalledTimes(1);
        expect(mockEmit).toHaveBeenCalledWith(
            expect.objectContaining(mockServiceEntity),
            'property:getHistoryRequested',
            { contextId, entityId, propertyName, options },
            { ...requestMetadata, contextId }
        );
    });

});