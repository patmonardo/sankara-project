import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { PropertyScript } from './script';
import { PropertyScriptSchema } from '../schema/property';
import { SandarbhaSevā } from '../context/service';
import { FormContext } from '../context/context'; // Assuming this is where getSandarbha is
import { FormProperty } from './property'; // Needed for mocking dependencies

// --- Mocks ---

// Mock SandarbhaSevā
vi.mock('../context/service', () => ({
  SandarbhaSevā: {
    guṇātmakaNiṣpādana: vi.fn(),
  },
}));

// Mock FormContext (or Sandarbha if getSandarbha is static there)
const mockSambandhaNirmāṇa = vi.fn();
const mockSambandhāḥPrāpti = vi.fn();
const mockGetSandarbha = vi.fn(() => ({
  sambandhaNirmāṇa: mockSambandhaNirmāṇa,
  sambandhāḥPrāpti: mockSambandhāḥPrāpti,
}));
vi.mock('../context/context', () => ({
  FormContext: { // Or Sandarbha if static
    getSandarbha: mockGetSandarbha,
  },
}));

// Mock FormProperty (for dependency fetching in execute)
const mockGetValue = vi.fn();
const mockGetProperty = vi.fn(() => Promise.resolve({
    name: 'dependencyProp',
    getValue: mockGetValue,
}));
// Mock the dynamic import used in execute
vi.mock('./property', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual, // Keep other exports if any
    FormProperty: {
        ...actual.FormProperty, // Keep other static methods if any
        getProperty: mockGetProperty,
    }
  };
});


// Helper to create valid base data
const createValidData = (overrides = {}): z.infer<typeof PropertyScriptSchema> => ({
  id: 'script:test1',
  name: 'Test Script',
  scriptType: 'calculator',
  contextId: 'ctx:test',
  propertyId: 'prop:test',
  code: '() => 42',
  created: new Date(),
  updated: new Date(),
  ...overrides,
});

// --- Tests ---

describe('PropertyScript', () => {
  let dateNowSpy: ReturnType<typeof vi.spyOn>;
  const constantDate = new Date('2025-04-13T10:00:00.000Z');
  const constantIdSuffix = 'abcdef';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date.now() for predictable timestamps/IDs
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(constantDate.getTime());
    // Mock Math.random for predictable IDs
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789); // Will produce 'abcdef'

    // Default mock implementation for guṇātmakaNiṣpādana
    (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockImplementation(async (ctxId, opType, callback) => {
        // Simulate successful operation by default
        try {
            const result = await callback();
            return { saphala: true, mūlya: result };
        } catch (error) {
            return { saphala: false, doṣa: error };
        }
    });
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
    vi.spyOn(Math, 'random').mockRestore();
  });

  // --- Constructor ---
  describe('constructor', () => {
    it('should create an instance with valid data', () => {
      const data = createValidData();
      const script = new PropertyScript(data);
      expect(script).toBeInstanceOf(PropertyScript);
      expect(script.id).toBe(data.id);
      expect(script.name).toBe(data.name);
      expect(script.code).toBe(data.code);
      expect(script.created).toEqual(data.created);
      expect(script.updated).toEqual(data.updated);
    });

    it('should throw if data is invalid', () => {
      const invalidData = { ...createValidData(), name: undefined }; // Missing required name
      expect(() => new PropertyScript(invalidData as any)).toThrow(z.ZodError);
    });

     it('should handle date initialization correctly', () => {
        const dataWithStringDate = createValidData({
            created: '2025-01-01T00:00:00.000Z',
            updated: constantDate.getTime(), // number
        });
        const script = new PropertyScript(dataWithStringDate);
        expect(script.created).toEqual(new Date('2025-01-01T00:00:00.000Z'));
        expect(script.updated).toEqual(constantDate);
     });
  });

  // --- Static Factories ---
  describe('create', () => {
    it('should create a PropertyScript instance and call register', () => {
      const data = createValidData();
      // Use Omit helper type if available or manually omit properties
      const createData: Omit<z.infer<typeof PropertyScriptSchema>, 'id' | 'created' | 'updated'> = {
        name: data.name,
        scriptType: data.scriptType,
        contextId: data.contextId,
        propertyId: data.propertyId,
        code: data.code,
      };
      const script = PropertyScript.create(createData);

      const expectedId = `script:${constantDate.getTime()}:${constantIdSuffix}`;

      expect(script).toBeInstanceOf(PropertyScript);
      expect(script.id).toBe(expectedId);
      expect(script.name).toBe(data.name);
      expect(script.created).toEqual(constantDate);
      expect(script.updated).toEqual(constantDate);
      // Check if register was called (indirectly via guṇātmakaNiṣpādana)
      expect(SandarbhaSevā.guṇātmakaNiṣpādana).toHaveBeenCalledTimes(1);
    });
  });

  describe('createValidator', () => {
    it('should call create with validator type and stringified function', () => {
      const createSpy = vi.spyOn(PropertyScript, 'create');
      const validationFn = (value: any) => value > 10;
      const script = PropertyScript.createValidator('ctx:v', 'prop:v', 'My Validator', validationFn);

      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My Validator',
        contextId: 'ctx:v',
        propertyId: 'prop:v',
        scriptType: 'validator',
        code: validationFn.toString(),
      }));
      expect(script).toBeInstanceOf(PropertyScript);
      createSpy.mockRestore(); // Clean up spy
    });
  });

  describe('createCalculator', () => {
    it('should call create with calculator type and stringified function', () => {
      const createSpy = vi.spyOn(PropertyScript, 'create');
      const calculationFn = (inputs: any) => inputs.a + inputs.b;
      const script = PropertyScript.createCalculator('ctx:c', 'prop:c', 'My Calc', calculationFn, { caching: true, cacheTTL: 10000 });

      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My Calc',
        contextId: 'ctx:c',
        propertyId: 'prop:c',
        scriptType: 'calculator',
        code: calculationFn.toString(),
        caching: { enabled: true, ttl: 10000 },
      }));
      expect(script).toBeInstanceOf(PropertyScript);
      createSpy.mockRestore(); // Clean up spy
    });

     it('should handle caching options correctly', () => {
        const createSpy = vi.spyOn(PropertyScript, 'create');
        const calculationFn = (inputs: any) => inputs.a;
        PropertyScript.createCalculator('ctx:c', 'prop:c', 'Calc1', calculationFn, { caching: true });
        expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ caching: { enabled: true, ttl: undefined } }));

        PropertyScript.createCalculator('ctx:c', 'prop:c', 'Calc2', calculationFn, { caching: false });
        expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ caching: { enabled: false, ttl: undefined } }));

        PropertyScript.createCalculator('ctx:c', 'prop:c', 'Calc3', calculationFn, { caching: true, cacheTTL: 500 });
        expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ caching: { enabled: true, ttl: 500 } }));

        PropertyScript.createCalculator('ctx:c', 'prop:c', 'Calc4', calculationFn, {}); // No caching options
        expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ caching: undefined }));

        createSpy.mockRestore();
     });
  });

  // --- register ---
  describe('register', () => {
    it('should call guṇātmakaNiṣpādana with correct args and callback', async () => {
      const data = createValidData();
      const script = new PropertyScript(data);
      mockSambandhaNirmāṇa.mockReturnValue('relation:new'); // Mock relation creation

      script.register(); // Call register directly

      // Check the outer service call
      expect(SandarbhaSevā.guṇātmakaNiṣpādana).toHaveBeenCalledTimes(1);
      expect(SandarbhaSevā.guṇātmakaNiṣpādana).toHaveBeenCalledWith(
        data.contextId,
        'mūrtīkaraṇa', // Or the correct KriyaPrakara
        expect.any(Function) // The callback
      );

      // Manually invoke the callback passed to guṇātmakaNiṣpādana to test its internals
      const callback = (SandarbhaSevā.guṇātmakaNiṣpādana as any).mock.calls[0][2];
      const callbackResult = await callback();

      // Check calls inside the callback
      expect(mockGetSandarbha).toHaveBeenCalledWith(data.contextId);
      expect(mockSambandhaNirmāṇa).toHaveBeenCalledWith(
        'system',
        `scriptDef:${data.id}`,
        'scriptDefinition',
        {
          script: script.toJSON(), // Check that it serializes the script
          timestamp: constantDate.getTime(),
        }
      );
      expect(callbackResult).toBe('relation:new');
    });

    it('should throw if context is not found in register callback', async () => {
       mockGetSandarbha.mockReturnValueOnce(null); // Simulate context not found
       const data = createValidData();
       const script = new PropertyScript(data);

       script.register(); // Call register

       // Manually invoke the callback
       const callback = (SandarbhaSevā.guṇātmakaNiṣpādana as any).mock.calls[0][2];
       await expect(callback()).rejects.toThrow(`Context not found: ${data.contextId}`);
    });
  });

  // --- execute ---
  describe('execute', () => {
    it('should execute a simple calculator script', async () => {
      const script = new PropertyScript(createValidData({
        code: '(inputs) => inputs.a + inputs.b',
      }));
      const result = await script.execute({ a: 5, b: 3 });
      expect(result).toBe(8);
    });

     it('should execute a simple async calculator script', async () => {
        const script = new PropertyScript(createValidData({
            code: 'async (inputs) => { await new Promise(r => setTimeout(r, 1)); return inputs.a * inputs.b; }',
        }));
        const result = await script.execute({ a: 5, b: 3 });
        expect(result).toBe(15);
     });

    it('should execute a simple validator script', async () => {
      const script = new PropertyScript(createValidData({
        scriptType: 'validator',
        code: '(inputs) => inputs.value > 10 ? true : "Value too small"',
      }));
      expect(await script.execute({ value: 15 })).toBe(true);
      expect(await script.execute({ value: 5 })).toBe('Value too small');
    });

    it('should fetch and inject dependencies', async () => {
      mockGetValue.mockResolvedValue(100); // Mock dependency value
      const script = new PropertyScript(createValidData({
        dependencies: ['dep:1'], // Matches mockGetProperty setup
        code: '(inputs) => inputs.dependencyProp + inputs.x', // Access dependency by name
      }));

      const result = await script.execute({ x: 5 });

      expect(mockGetProperty).toHaveBeenCalledWith(script.contextId, 'dep:1');
      expect(mockGetValue).toHaveBeenCalled();
      expect(result).toBe(105); // 100 (from dep) + 5 (from input)
    });

    it('should handle missing dependencies gracefully', async () => {
        mockGetProperty.mockResolvedValueOnce(null); // Simulate dependency not found
        const script = new PropertyScript(createValidData({
            dependencies: ['dep:missing'],
            code: '(inputs) => inputs.x', // Script doesn't rely on the missing dep value
        }));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console output

        const result = await script.execute({ x: 5 });

        expect(mockGetProperty).toHaveBeenCalledWith(script.contextId, 'dep:missing');
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Dependency property 'dep:missing' not found"));
        expect(result).toBe(5); // Should still execute with provided inputs

        warnSpy.mockRestore();
    });

    it('should use cached result if caching enabled and TTL valid', async () => {
      const script = new PropertyScript(createValidData({
        code: '(inputs) => inputs.a + Math.random()', // Make output variable
        caching: { enabled: true, ttl: 10000 }, // 10 seconds TTL
      }));
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result1 = await script.execute({ a: 1 });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cache miss'));

      const result2 = await script.execute({ a: 1 }); // Same input
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cache hit'));
      expect(result2).toBe(result1); // Should be the exact same cached result

      logSpy.mockRestore();
    });

    it('should re-execute if cache TTL expired', async () => {
      const script = new PropertyScript(createValidData({
        code: '(inputs) => inputs.a + Math.random()',
        caching: { enabled: true, ttl: 100 }, // 100 ms TTL
      }));
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result1 = await script.execute({ a: 1 });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cache miss'));

      // Advance time beyond TTL
      dateNowSpy.mockReturnValue(constantDate.getTime() + 200);

      const result2 = await script.execute({ a: 1 }); // Same input, after TTL
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cache miss')); // Should be a miss again
      expect(result2).not.toBe(result1); // Should be a new result

      logSpy.mockRestore();
    });

     it('should use default TTL if not specified', async () => {
        const script = new PropertyScript(createValidData({
            code: '(inputs) => inputs.a + Math.random()',
            caching: { enabled: true }, // No TTL specified
        }));
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const result1 = await script.execute({ a: 1 });
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cache miss'));

        // Advance time less than default TTL (5000ms)
        dateNowSpy.mockReturnValue(constantDate.getTime() + 1000);

        const result2 = await script.execute({ a: 1 });
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cache hit'));
        expect(result2).toBe(result1);

        // Advance time beyond default TTL
        dateNowSpy.mockReturnValue(constantDate.getTime() + 6000);

        const result3 = await script.execute({ a: 1 });
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('cache miss'));
        expect(result3).not.toBe(result1);

        logSpy.mockRestore();
     });

    it('should throw if script code compilation fails', async () => {
      const script = new PropertyScript(createValidData({ code: 'this is not valid js {' }));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(script.execute()).rejects.toThrow(/Script compilation failed/);
      errorSpy.mockRestore();
    });

    it('should throw if script execution fails', async () => {
      const script = new PropertyScript(createValidData({ code: '() => { throw new Error("Boom!"); }' }));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(script.execute()).rejects.toThrow(/Script execution failed: Boom!/);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Error within compiled script execution:"), expect.any(Error));
      errorSpy.mockRestore();
    });
  });

  // --- clearCache ---
  describe('clearCache', () => {
    it('should clear the internal cache map', async () => {
      const script = new PropertyScript(createValidData({
        code: '(inputs) => inputs.a + Math.random()',
        caching: { enabled: true, ttl: 10000 },
      }));
      await script.execute({ a: 1 }); // Populate cache
      expect((script as any)._cache.size).toBe(1);

      script.clearCache();
      expect((script as any)._cache.size).toBe(0);
    });
  });

  // --- toJSON ---
  describe('toJSON', () => {
    it('should return a plain object matching the schema', () => {
      const data = createValidData({ description: 'Desc', dependencies: ['dep1'] });
      const script = new PropertyScript(data);
      const json = script.toJSON();

      // Check a few key properties
      expect(json.id).toBe(data.id);
      expect(json.name).toBe(data.name);
      expect(json.scriptType).toBe(data.scriptType);
      expect(json.code).toBe(data.code);
      expect(json.dependencies).toEqual(data.dependencies);
      expect(json.created).toEqual(data.created);

      // Ensure internal state is not included
      expect(json).not.toHaveProperty('_compiledFn');
      expect(json).not.toHaveProperty('_cache');

      // Validate against the schema
      expect(() => PropertyScriptSchema.parse(json)).not.toThrow();
    });
  });

  // --- getScript ---
  describe('getScript', () => {
     const scriptId = 'script:fetched';
     const contextId = 'ctx:fetch';
     const mockRelationData = {
        id: `relation:def:${scriptId}`,
        type: 'scriptDefinition',
        sourceId: 'system',
        targetId: `scriptDef:${scriptId}`,
        content: { // Using 'content' based on previous discussion
            script: createValidData({ id: scriptId, contextId: contextId, name: 'Fetched Script' })
        }
     };

     it('should retrieve and instantiate a script successfully', async () => {
        // Mock service to return the mock relation
        (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockImplementationOnce(async (ctxId, opType, callback) => {
            mockSambandhāḥPrāpti.mockReturnValueOnce([mockRelationData]); // Mock context method return
            const result = await callback();
            return { saphala: true, mūlya: result };
        });

        const script = await PropertyScript.getScript(contextId, scriptId);

        expect(SandarbhaSevā.guṇātmakaNiṣpādana).toHaveBeenCalledWith(contextId, 'mūrtīkaraṇa', expect.any(Function)); // Check KriyaPrakara used
        expect(mockGetSandarbha).toHaveBeenCalledWith(contextId);
        expect(mockSambandhāḥPrāpti).toHaveBeenCalledWith({ mode: 'scriptDefinition', para: `scriptDef:${scriptId}` });
        expect(script).toBeInstanceOf(PropertyScript);
        expect(script?.id).toBe(scriptId);
        expect(script?.name).toBe('Fetched Script');
     });

     it('should return null if script relation is not found', async () => {
        (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockImplementationOnce(async (ctxId, opType, callback) => {
            mockSambandhāḥPrāpti.mockReturnValueOnce([]); // No relations found
            const result = await callback();
            return { saphala: true, mūlya: result }; // Operation succeeded, but result is undefined
        });

        const script = await PropertyScript.getScript(contextId, 'script:notfound');
        expect(script).toBeNull();
     });

     it('should return null if operation fails', async () => {
        (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockResolvedValueOnce({ saphala: false, doṣa: 'DB error' }); // Simulate service failure

        const script = await PropertyScript.getScript(contextId, scriptId);
        expect(script).toBeNull();
     });

     it('should return null if script data is missing in relation content', async () => {
        const badRelation = { ...mockRelationData, content: {} }; // Missing 'script' key
         (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockImplementationOnce(async (ctxId, opType, callback) => {
            mockSambandhāḥPrāpti.mockReturnValueOnce([badRelation]);
            const result = await callback();
            return { saphala: true, mūlya: result };
        });
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const script = await PropertyScript.getScript(contextId, scriptId);
        expect(script).toBeNull();
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Script data missing in relation'), expect.anything());
        errorSpy.mockRestore();
     });

     it('should return null if script data fails validation on reconstruction', async () => {
        const invalidScriptData = { ...createValidData({ id: scriptId }), name: undefined }; // Invalid name
        const badRelation = { ...mockRelationData, content: { script: invalidScriptData } };
         (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockImplementationOnce(async (ctxId, opType, callback) => {
            mockSambandhāḥPrāpti.mockReturnValueOnce([badRelation]);
            const result = await callback();
            return { saphala: true, mūlya: result };
        });
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const script = await PropertyScript.getScript(contextId, scriptId);
        expect(script).toBeNull();
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation error creating PropertyScript instance'), expect.any(z.ZodError), expect.anything(), expect.anything());
        errorSpy.mockRestore();
     });
  });

  // --- findForProperty ---
  describe('findForProperty', () => {
    const contextId = 'ctx:find';
    const propertyIdTarget = 'prop:findTarget';
    const propertyIdOther = 'prop:findOther';

    const mockRelation1 = {
        id: 'rel:1', type: 'scriptDefinition', sourceId: 'system', targetId: 'scriptDef:s1',
        content: { script: createValidData({ id: 'script:s1', propertyId: propertyIdTarget, name: 'Script 1' }) }
    };
    const mockRelation2 = {
        id: 'rel:2', type: 'scriptDefinition', sourceId: 'system', targetId: 'scriptDef:s2',
        content: { script: createValidData({ id: 'script:s2', propertyId: propertyIdOther, name: 'Script 2' }) }
    };
     const mockRelation3 = {
        id: 'rel:3', type: 'scriptDefinition', sourceId: 'system', targetId: 'scriptDef:s3',
        content: { script: createValidData({ id: 'script:s3', propertyId: propertyIdTarget, name: 'Script 3' }) }
    };
     const mockRelationBad = {
        id: 'rel:bad', type: 'scriptDefinition', sourceId: 'system', targetId: 'scriptDef:sBad',
        content: { /* missing script */ }
    };

    it('should find and return scripts matching the propertyId', async () => {
        (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockImplementationOnce(async (ctxId, opType, callback) => {
            mockSambandhāḥPrāpti.mockReturnValueOnce([mockRelation1, mockRelation2, mockRelation3]); // Return all relations
            const result = await callback(); // This will be the filtered relations
            return { saphala: true, mūlya: result };
        });

        const scripts = await PropertyScript.findForProperty(contextId, propertyIdTarget);

        expect(SandarbhaSevā.guṇātmakaNiṣpādana).toHaveBeenCalledWith(contextId, 'mūrtīkaraṇa', expect.any(Function)); // Check KriyaPrakara
        expect(mockGetSandarbha).toHaveBeenCalledWith(contextId);
        expect(mockSambandhāḥPrāpti).toHaveBeenCalledWith({ mode: 'scriptDefinition' }); // Called to get all script defs
        expect(scripts).toHaveLength(2);
        expect(scripts[0]).toBeInstanceOf(PropertyScript);
        expect(scripts[0].id).toBe('script:s1');
        expect(scripts[1]).toBeInstanceOf(PropertyScript);
        expect(scripts[1].id).toBe('script:s3');
    });

    it('should return an empty array if no matching scripts are found', async () => {
         (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockImplementationOnce(async (ctxId, opType, callback) => {
            mockSambandhāḥPrāpti.mockReturnValueOnce([mockRelation2]); // Only relation for other property
            const result = await callback();
            return { saphala: true, mūlya: result };
        });

        const scripts = await PropertyScript.findForProperty(contextId, propertyIdTarget);
        expect(scripts).toHaveLength(0);
    });

     it('should return an empty array if operation fails', async () => {
        (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockResolvedValueOnce({ saphala: false });

        const scripts = await PropertyScript.findForProperty(contextId, propertyIdTarget);
        expect(scripts).toHaveLength(0);
     });

     it('should handle relations with missing script data gracefully', async () => {
        (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockImplementationOnce(async (ctxId, opType, callback) => {
            mockSambandhāḥPrāpti.mockReturnValueOnce([mockRelation1, mockRelationBad, mockRelation3]);
            const result = await callback();
            return { saphala: true, mūlya: result };
        });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const scripts = await PropertyScript.findForProperty(contextId, propertyIdTarget);

        expect(scripts).toHaveLength(2); // Should still get the valid ones
        expect(scripts.map(s => s.id)).toEqual(['script:s1', 'script:s3']);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Script data missing in relation'), mockRelationBad);
        warnSpy.mockRestore();
     });

     it('should handle relations with invalid script data gracefully', async () => {
        const invalidScriptData = { ...createValidData({ id: 'script:sInvalid', propertyId: propertyIdTarget }), name: undefined };
        const mockRelationInvalid = { ...mockRelation1, content: { script: invalidScriptData }, id: 'rel:invalid', targetId: 'scriptDef:sInvalid' };

        (SandarbhaSevā.guṇātmakaNiṣpādana as any).mockImplementationOnce(async (ctxId, opType, callback) => {
            mockSambandhāḥPrāpti.mockReturnValueOnce([mockRelation1, mockRelationInvalid, mockRelation3]);
            const result = await callback();
            return { saphala: true, mūlya: result };
        });
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const scripts = await PropertyScript.findForProperty(contextId, propertyIdTarget);

        expect(scripts).toHaveLength(2); // Should still get the valid ones
        expect(scripts.map(s => s.id)).toEqual(['script:s1', 'script:s3']);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation error creating PropertyScript instance'), expect.any(z.ZodError), expect.anything(), expect.anything());
        errorSpy.mockRestore();
     });
  });

});