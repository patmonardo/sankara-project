import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FormProperty } from './property';
import { PropertySchema, PropertyType } from '../schema/property'; // Import schema for test data
import { z } from 'zod';

// Helper to create valid base data for tests
const createValidData = (overrides: Partial<z.infer<typeof PropertySchema>> = {}): z.infer<typeof PropertySchema> => {
    const defaults: z.infer<typeof PropertySchema> = {
        id: 'prop-123',
        name: 'TestProperty',
        propertyType: PropertyType.Intrinsic,
        contextId: 'ctx-abc',
        entityId: 'ent-xyz',
        created: new Date(),
        updated: new Date(),
        qualitative: { mutable: true }, // Default to mutable for setValue tests
        // Add other required fields from schema if any
    };
    // Ensure dates are valid Date objects or ISO strings for Zod parsing
    const data = { ...defaults, ...overrides };
    if (data.created && !(data.created instanceof Date)) data.created = new Date(data.created);
    if (data.updated && !(data.updated instanceof Date)) data.updated = new Date(data.updated);
    return data;
};


describe('FormProperty', () => {

    // Spy on console.warn for specific tests
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    beforeEach(() => {
        // Reset mocks/spies if needed (though consoleWarnSpy is cleared in afterEach)
        vi.useRealTimers(); // Ensure Date.now() works as expected
    });

    afterEach(() => {
        consoleWarnSpy.mockClear(); // Clear console spy after each test
    });

    describe('Constructor', () => {
        it('should create an instance with valid data', () => {
            const data = createValidData({ staticValue: 100, description: 'A test prop' });
            const prop = new FormProperty(data);

            expect(prop).toBeInstanceOf(FormProperty);
            expect(prop.id).toBe(data.id);
            expect(prop.name).toBe(data.name);
            expect(prop.staticValue).toBe(100);
            expect(prop.description).toBe('A test prop');
            expect(prop.contextId).toBe(data.contextId);
            expect(prop.entityId).toBe(data.entityId);
            expect(prop.created).toBeInstanceOf(Date);
            expect(prop.updated).toBeInstanceOf(Date);
        });

        it('should parse date strings correctly', () => {
             const createdStr = new Date(Date.now() - 10000).toISOString();
             const updatedStr = new Date().toISOString();
             const data = createValidData({ created: createdStr, updated: updatedStr });
             const prop = new FormProperty(data);
             expect(prop.created.toISOString()).toBe(createdStr);
             expect(prop.updated.toISOString()).toBe(updatedStr);
        });

        it('should throw if data is invalid according to schema', () => {
            const invalidData = { ...createValidData(), name: undefined }; // Missing required name
            // Need to cast because TS expects valid data, but we're testing Zod validation
            expect(() => new FormProperty(invalidData as any)).toThrow(z.ZodError);
        });
    });

    describe('getValue', () => {
        it('should return staticValue if defined', async () => {
            const data = createValidData({ staticValue: 'hello' });
            const prop = new FormProperty(data);
            await expect(prop.getValue()).resolves.toBe('hello');
        });

        it('should return cached value if available and within TTL', async () => {
            vi.useFakeTimers();
            const data = createValidData({ staticValue: 50 });
            const prop = new FormProperty(data);

            // Prime the cache
            await prop.getValue();
            prop.staticValue = 100; // Change underlying static value

            // Advance time slightly, still within TTL (1000ms)
            vi.advanceTimersByTime(500);

            // Should still get the cached value (50)
            await expect(prop.getValue()).resolves.toBe(50);
            vi.useRealTimers();
        });

        it('should re-evaluate static value if cache expired', async () => {
            vi.useFakeTimers();
            const data = createValidData({ staticValue: 50 });
            const prop = new FormProperty(data);

            // Prime the cache
            await prop.getValue();
            prop.staticValue = 100; // Change underlying static value

            // Advance time beyond TTL (1000ms)
            vi.advanceTimersByTime(1001);

            // Should get the new static value (100)
            await expect(prop.getValue()).resolves.toBe(100);
            vi.useRealTimers();
        });

        it('should return undefined and warn for derived properties without staticValue', async () => {
            const data = createValidData({ propertyType: PropertyType.Derived, derivedFrom: 'otherProp' });
            const prop = new FormProperty(data);

            await expect(prop.getValue()).resolves.toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('requires calculation by the engine'));
        });

        it('should return undefined and warn for scripted properties without staticValue', async () => {
            const data = createValidData({ propertyType: PropertyType.Scripted, scriptId: 'script-abc' });
            const prop = new FormProperty(data);

            await expect(prop.getValue()).resolves.toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('requires calculation by the engine'));
        });

         it('should return undefined and warn for relational properties without staticValue', async () => {
            const data = createValidData({ propertyType: PropertyType.Relational, relationId: 'rel-1' });
            const prop = new FormProperty(data);

            await expect(prop.getValue()).resolves.toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('requires calculation by the engine'));
        });
    });

    describe('getValueSync', () => {
         it('should return staticValue if defined', () => {
            const data = createValidData({ staticValue: 'syncHello' });
            const prop = new FormProperty(data);
            const result = prop.getValueSync();
            expect(result.value).toBe('syncHello');
            expect(result.isCached).toBe(false);
            expect(result.timestamp).toBe(prop.updated.getTime());
        });

         it('should return cached value if available', async () => {
            const data = createValidData({ staticValue: 123 });
            const prop = new FormProperty(data);
            await prop.getValue(); // Prime cache

            prop.staticValue = 456; // Change underlying value

            const result = prop.getValueSync();
            expect(result.value).toBe(123); // Should be cached value
            expect(result.isCached).toBe(true);
            expect(result.timestamp).toBeGreaterThan(0);
        });

         it('should return undefined if no static or cached value', () => {
            const data = createValidData({ propertyType: PropertyType.Derived });
            const prop = new FormProperty(data);
            const result = prop.getValueSync();
            expect(result.value).toBeUndefined();
            expect(result.isCached).toBe(false);
            expect(result.timestamp).toBe(0);
        });
    });

    describe('setValue', () => {
        it('should update staticValue, cache, and updated timestamp', () => {
            const initialDate = new Date(Date.now() - 5000);
            const data = createValidData({ staticValue: 10, qualitative: { mutable: true }, updated: initialDate });
            const prop = new FormProperty(data);

            prop.setValue(20);

            expect(prop.staticValue).toBe(20);
            const syncVal = prop.getValueSync();
            expect(syncVal.value).toBe(20); // Check cache updated
            expect(syncVal.isCached).toBe(true);
            expect(prop.updated.getTime()).toBeGreaterThan(initialDate.getTime());
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Remember to call PropertyService.setProperty to persist'));
        });

        it('should throw if property is immutable', () => {
            const data = createValidData({ staticValue: 10, qualitative: { mutable: false } });
            const prop = new FormProperty(data);

            expect(() => prop.setValue(20)).toThrow('Cannot modify immutable property');
        });

         it('should default to mutable if qualitative is undefined', () => {
            // Assuming default behavior should allow setting if qualitative is missing
            // If the intent is default immutable, this test should change
            const data = createValidData({ staticValue: 10, qualitative: undefined });
            const prop = new FormProperty(data);

            expect(() => prop.setValue(20)).not.toThrow();
            expect(prop.staticValue).toBe(20);
            expect(consoleWarnSpy).toHaveBeenCalled();
        });
    });

    describe('invalidateCache', () => {
        it('should clear cached value and timestamp', async () => {
            const data = createValidData({ staticValue: 99 });
            const prop = new FormProperty(data);
            await prop.getValue(); // Prime cache

            expect(prop.getValueSync().isCached).toBe(true); // Verify cache is primed

            prop.invalidateCache();

            const result = prop.getValueSync();
            expect(result.value).toBe(99); // Should get static value now
            expect(result.isCached).toBe(false); // Cache should be cleared

            // Check internal state if needed (though getValueSync covers it)
            // expect((prop as any)._cachedValue).toBeUndefined();
            // expect((prop as any)._lastCalculated).toBe(0);
        });
    });

    describe('validate', () => {
        it('should return valid for correct data type', () => {
            const data = createValidData({ quantitative: { dataType: 'number' } });
            const prop = new FormProperty(data);
            expect(prop.validate(123)).toEqual({ valid: true, errors: [] });
        });

        it('should return invalid for incorrect data type', () => {
            const data = createValidData({ quantitative: { dataType: 'string' } });
            const prop = new FormProperty(data);
            expect(prop.validate(123)).toEqual({ valid: false, errors: ['Expected string, got number'] });
        });

        it('should return valid for number within range', () => {
            const data = createValidData({ quantitative: { dataType: 'number', range: { min: 0, max: 100 } } });
            const prop = new FormProperty(data);
            expect(prop.validate(50)).toEqual({ valid: true, errors: [] });
        });

        it('should return invalid for number below min range', () => {
            const data = createValidData({ quantitative: { dataType: 'number', range: { min: 0, max: 100 } } });
            const prop = new FormProperty(data);
            expect(prop.validate(-10)).toEqual({ valid: false, errors: ['Value -10 is less than minimum 0'] });
        });

        it('should return invalid for number above max range', () => {
            const data = createValidData({ quantitative: { dataType: 'number', range: { min: 0, max: 100 } } });
            const prop = new FormProperty(data);
            expect(prop.validate(110)).toEqual({ valid: false, errors: ['Value 110 is greater than maximum 100'] });
        });

        it('should handle multiple errors', () => {
             const data = createValidData({ quantitative: { dataType: 'string', range: { min: 0 } } }); // Range doesn't apply to string
             const prop = new FormProperty(data);
             // Validate a number against string type
             expect(prop.validate(123)).toEqual({ valid: false, errors: ['Expected string, got number'] });
        });
    });

    describe('toJSON', () => {
        it('should return a plain object matching the schema', () => {
            const date = new Date();
            const data = createValidData({
                staticValue: 'jsonTest',
                description: 'Desc',
                created: date,
                updated: date,
                quantitative: { dataType: 'string' }
            });
            const prop = new FormProperty(data);
            const json = prop.toJSON();

            // Check a few key properties
            expect(json.id).toBe(data.id);
            expect(json.name).toBe(data.name);
            expect(json.staticValue).toBe('jsonTest');
            expect(json.quantitative?.dataType).toBe('string');
            // Zod schema stringifies dates by default in output unless transformed
            expect(json.created).toEqual(date); // Or .toISOString() if schema transforms
            expect(json.updated).toEqual(date); // Or .toISOString() if schema transforms

            // Optionally, validate the output against the schema again
            expect(() => PropertySchema.parse(json)).not.toThrow();
        });
    });
});