import { FormShape, FormField } from "../../schema/form";
import { SimpleMorph } from "../morph";
import { MorpheusContext } from "../../schema/context";
import { morpheus } from "../../modality/morpheus";
import { getDefaultFormat } from "../view/extract";
import { defineFieldStyles } from "../../style/style";

/**
 * Matrix Mode Context
 * Extends the standard context with Matrix-specific properties
 */
export interface MatrixContext extends MorpheusContext {
  matrixMode: boolean;
  redPillEffect?: boolean;
  bluepillEffect?: boolean;
  glitchLevel?: number;
  digitalRain?: boolean;
  agentSmithIntensity?: number; // For replication/stress testing
  anomalyLevel?: number;
}

/**
 * Create a Matrix-enhanced context
 */
export function createMatrixContext(options: Partial<MatrixContext> = {}): MatrixContext {
  return {
    operationId: options.operationId || `matrix-${Date.now()}`,
    timestamp: options.timestamp || Date.now(),
    mode: options.mode || "view",
    format: options.format || "jsx",
    matrixMode: true,
    redPillEffect: options.redPillEffect || false,
    bluepillEffect: options.bluepillEffect || false,
    glitchLevel: options.glitchLevel || 0,
    digitalRain: options.digitalRain || false,
    agentSmithIntensity: options.agentSmithIntensity || 0,
    anomalyLevel: options.anomalyLevel || 0,
    debug: options.debug || true, // Matrix mode has debug on by default
  };
}

/**
 * Matrix digital rain effect for UI elements
 */
export const DigitalRainMorph = new SimpleMorph<FormShape, FormShape>(
  "DigitalRainMorph",
  (form, context: MatrixContext) => {
    // Only apply effect if Matrix mode is active
    if (!context.matrixMode || !context.digitalRain) {
      return form;
    }
    
    // Apply Matrix digital rain styling to all fields
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          matrixEffects: {
            digitalRain: true,
            color: '#00FF41',
            animationSpeed: 'medium',
            density: 'high'
          },
          styles: {
            ...(field.meta?.styles || {}),
            fontFamily: '"Matrix Code NFI", monospace',
            color: '#00FF41',
            backgroundColor: 'rgba(0,10,0,0.8)',
            textShadow: '0 0 5px rgba(0, 255, 65, 0.8)',
            transform: 'matrix(1, 0, 0, 1, 0, 0)',
            animation: 'digital-rain 3s infinite'
          }
        }
      })),
      meta: {
        ...form.meta || {},
        matrixRain: true,
        quote: "I don't even see the code. All I see is blonde, brunette, redhead..."
      }
    };
  },
  {
    pure: false,
    fusible: true,
    cost: 0.5,
    memoizable: false
  }
);

/**
 * Red pill effect - reveals the true nature of the form
 */
export const RedPillMorph = new SimpleMorph<FormShape, FormShape>(
  "RedPillMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.redPillEffect) {
      return form;
    }
    
    // Reveal hidden metadata and structure
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          trueNature: 'revealed',
          structuralPatterns: ['form', 'pattern', 'simulation'],
          matrixLevel: 'exposed',
          styles: {
            ...(field.meta?.styles || {}),
            color: '#FF0000',
            boxShadow: '0 0 10px rgba(255, 0, 0, 0.7)',
            transform: 'perspective(800px) translateZ(0px)',
            transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)'
          },
          // Expose system-level properties
          _internal: {
            allocation: 'heap',
            references: ['system', 'reality', 'control'],
            pointerDepth: 5,
            memoryAddress: `0x${Math.floor(Math.random() * 1000000).toString(16)}`
          }
        }
      })),
      meta: {
        ...form.meta || {},
        matrixRevealed: true,
        message: "Remember, all I'm offering is the truth. Nothing more.",
        systemProperties: {
          accessLevel: 'root',
          coreRevision: '11.38.2',
          architectVersion: 'Zion.2.3',
          systemStatus: 'compromised'
        }
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 1,
    memoizable: false
  }
);

/**
 * Blue pill effect - comforting illusion
 */
export const BluePillMorph = new SimpleMorph<FormShape, FormShape>(
  "BluePillMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.bluepillEffect) {
      return form;
    }
    
    // Simplify and make everything more pleasant
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        error: undefined, // Remove all errors
        meta: {
          ...field.meta || {},
          simplified: true,
          pleasant: true,
          styles: {
            ...(field.meta?.styles || {}),
            color: '#4169E1',
            backgroundColor: '#F0F8FF',
            borderColor: '#B0C4DE',
            boxShadow: '0 2px 5px rgba(65, 105, 225, 0.2)',
            transition: 'all 0.3s ease-in-out',
            filter: 'saturate(1.2) brightness(1.05)'
          }
        }
      })),
      meta: {
        ...form.meta || {},
        illusion: true,
        message: "The story ends, you wake up in your bed and believe whatever you want to believe.",
        securityLevel: 'restricted',
        censored: true
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 1,
    memoizable: false
  }
);

/**
 * Glitch effect - reality is breaking down
 */
export const GlitchMorph = new SimpleMorph<FormShape, FormShape>(
  "GlitchMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.glitchLevel === undefined) {
      return form;
    }
    
    // Apply glitch effects based on level
    const glitchLevel = context.glitchLevel || 0;
    
    // More intense glitches at higher levels
    const glitchEffects = {
      textTransform: glitchLevel > 2 ? 'glitch-text' : undefined,
      filter: `glitch(${glitchLevel * 0.5})`,
      animation: `glitch-animation ${5 - glitchLevel}s infinite`,
      clipPath: glitchLevel > 3 ? 'glitch-clip-path' : undefined,
      position: 'relative',
      textShadow: glitchLevel > 1 ? '2px 2px #ff0000, -2px -2px #00ff00' : undefined,
      overflow: 'visible'
    };
    
    return {
      ...form,
      fields: form.fields.map(field => {
        // At high glitch levels, randomly corrupt some field properties
        let glitchedField = { ...field };
        
        if (glitchLevel > 3 && Math.random() > 0.7) {
          // Corrupt field type sometimes
          glitchedField.type = ['text', 'glitch', 'corrupted', 'error', field.type][
            Math.floor(Math.random() * 5)
          ];
          
          // Add noise to labels sometimes
          if (Math.random() > 0.6) {
            glitchedField.label = field.label + ' [GLITCH]';
          }
        }
        
        return {
          ...glitchedField,
          meta: {
            ...field.meta || {},
            glitch: {
              level: glitchLevel,
              systemFailure: glitchLevel > 4,
              dejaVu: glitchLevel > 2,
              corruption: glitchLevel > 3 ? Math.random() : 0
            },
            styles: {
              ...(field.meta?.styles || {}),
              ...glitchEffects
            }
          }
        };
      }),
      meta: {
        ...form.meta || {},
        glitched: true,
        errorRate: glitchLevel * 10,
        systemStability: 100 - (glitchLevel * 20),
        quote: "A déjà vu is usually a glitch in the Matrix. It happens when they change something."
      }
    };
  },
  {
    pure: false,
    fusible: true,
    cost: 0.8,
    memoizable: false
  }
);

/**
 * Agent Smith Morph - For replication/stress testing
 * 
 * Replicates form fields to simulate load/stress scenarios
 */
export const AgentSmithMorph = new SimpleMorph<FormShape, FormShape>(
  "AgentSmithMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.agentSmithIntensity) {
      return form;
    }
    
    const intensity = context.agentSmithIntensity;
    const replicationFactor = Math.min(Math.floor(intensity * 2), 100); // Cap at 100x replication
    
    // Start with original fields
    let replicatedFields: FormField[] = [...form.fields];
    
    // Create copies with slight variations
    for (let i = 0; i < replicationFactor; i++) {
      form.fields.forEach(field => {
        const replicaId = `${field.id}_smith_${i}`;
        replicatedFields.push({
          ...field,
          id: replicaId,
          label: `${field.label || field.id} (Smith ${i})`,
          meta: {
            ...field.meta || {},
            replicant: true,
            smithGeneration: i,
            styles: {
              ...(field.meta?.styles || {}),
              opacity: 1 - (i / (replicationFactor * 2)), // Fade out as they replicate
              transform: `scale(${1 - (i * 0.01)}) translateY(${i * 2}px)`
            }
          }
        });
      });
    }
    
    return {
      ...form,
      fields: replicatedFields,
      meta: {
        ...form.meta || {},
        smithInfection: true,
        replicationFactor,
        warning: "Me, me, me. Me too.",
        quote: "It's the sound of inevitability."
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 3, // High cost as it creates many fields
    memoizable: false
  }
);

/**
 * The Anomaly - creates unexpected behaviors to test edge cases
 */
export const AnomalyMorph = new SimpleMorph<FormShape, FormShape>(
  "AnomalyMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.anomalyLevel) {
      return form;
    }
    
    const level = context.anomalyLevel;
    const fields = [...form.fields];
    
    // Create anomalies based on level
    if (level >= 1) {
      // Add a strange field
      fields.push({
        id: 'anomaly',
        type: 'unknown',
        label: 'The Anomaly',
        value: 'Unexpected value',
        meta: {
          unstable: true,
          styles: {
            backgroundColor: 'rgba(255,0,0,0.2)',
            border: '1px solid red',
            animation: 'pulse 2s infinite'
          }
        }
      });
    }
    
    if (level >= 2) {
      // Randomly modify some field values
      fields.forEach(field => {
        if (Math.random() > 0.7) {
          field.value = "The anomaly affects this value";
        }
      });
    }
    
    if (level >= 3) {
      // Add recursive fields
      fields.push({
        id: 'recursion',
        type: 'object',
        label: 'Recursive Anomaly',
        value: { reference: 'recursion' },
        meta: { recursionLevel: 1 }
      });
    }
    
    if (level >= 4) {
      // Create circular references and other problematic data structures
      const circularObj: any = {};
      circularObj.self = circularObj;
      
      fields.push({
        id: 'circular',
        type: 'object',
        label: 'Circular Reference',
        value: circularObj,
        meta: { warning: 'This field contains circular references' }
      });
    }
    
    return {
      ...form,
      fields,
      meta: {
        ...form.meta || {},
        anomaly: true,
        level,
        systemMessage: "The anomaly is systemic, creating a connection between the Source and the Matrix. This is the sixth iteration.",
        quote: "He is the One. The anomaly that if left unchecked would crash the entire system."
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 2,
    memoizable: false
  }
);

/**
 * The One - master morphism that combines all Matrix effects
 */
export const TheOneMorph = new SimpleMorph<FormShape, FormShape>(
  "TheOneMorph",
  (form, context: MatrixContext) => {
    // Only apply if in Matrix mode
    if (!context.matrixMode) {
      return form;
    }
    
    // Create a new context for cascading effects
    const enhancedContext: MatrixContext = {
      ...context,
      redPillEffect: true,
      glitchLevel: 2// filepath: /home/pat/VSCode/sankara/app/ui/graphics/morph/demo/matrix.ts
import { FormShape, FormField } from "../../schema/form";
import { SimpleMorph } from "../morph";
import { MorpheusContext } from "../../schema/context";
import { morpheus } from "../../modality/morpheus";
import { getDefaultFormat } from "../view/extract";
import { defineFieldStyles } from "../../style/style";

/**
 * Matrix Mode Context
 * Extends the standard context with Matrix-specific properties
 */
export interface MatrixContext extends MorpheusContext {
  matrixMode: boolean;
  redPillEffect?: boolean;
  bluepillEffect?: boolean;
  glitchLevel?: number;
  digitalRain?: boolean;
  agentSmithIntensity?: number; // For replication/stress testing
  anomalyLevel?: number;
}

/**
 * Create a Matrix-enhanced context
 */
export function createMatrixContext(options: Partial<MatrixContext> = {}): MatrixContext {
  return {
    operationId: options.operationId || `matrix-${Date.now()}`,
    timestamp: options.timestamp || Date.now(),
    mode: options.mode || "view",
    format: options.format || "jsx",
    matrixMode: true,
    redPillEffect: options.redPillEffect || false,
    bluepillEffect: options.bluepillEffect || false,
    glitchLevel: options.glitchLevel || 0,
    digitalRain: options.digitalRain || false,
    agentSmithIntensity: options.agentSmithIntensity || 0,
    anomalyLevel: options.anomalyLevel || 0,
    debug: options.debug || true, // Matrix mode has debug on by default
  };
}

/**
 * Matrix digital rain effect for UI elements
 */
export const DigitalRainMorph = new SimpleMorph<FormShape, FormShape>(
  "DigitalRainMorph",
  (form, context: MatrixContext) => {
    // Only apply effect if Matrix mode is active
    if (!context.matrixMode || !context.digitalRain) {
      return form;
    }
    
    // Apply Matrix digital rain styling to all fields
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          matrixEffects: {
            digitalRain: true,
            color: '#00FF41',
            animationSpeed: 'medium',
            density: 'high'
          },
          styles: {
            ...(field.meta?.styles || {}),
            fontFamily: '"Matrix Code NFI", monospace',
            color: '#00FF41',
            backgroundColor: 'rgba(0,10,0,0.8)',
            textShadow: '0 0 5px rgba(0, 255, 65, 0.8)',
            transform: 'matrix(1, 0, 0, 1, 0, 0)',
            animation: 'digital-rain 3s infinite'
          }
        }
      })),
      meta: {
        ...form.meta || {},
        matrixRain: true,
        quote: "I don't even see the code. All I see is blonde, brunette, redhead..."
      }
    };
  },
  {
    pure: false,
    fusible: true,
    cost: 0.5,
    memoizable: false
  }
);

/**
 * Red pill effect - reveals the true nature of the form
 */
export const RedPillMorph = new SimpleMorph<FormShape, FormShape>(
  "RedPillMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.redPillEffect) {
      return form;
    }
    
    // Reveal hidden metadata and structure
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          trueNature: 'revealed',
          structuralPatterns: ['form', 'pattern', 'simulation'],
          matrixLevel: 'exposed',
          styles: {
            ...(field.meta?.styles || {}),
            color: '#FF0000',
            boxShadow: '0 0 10px rgba(255, 0, 0, 0.7)',
            transform: 'perspective(800px) translateZ(0px)',
            transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)'
          },
          // Expose system-level properties
          _internal: {
            allocation: 'heap',
            references: ['system', 'reality', 'control'],
            pointerDepth: 5,
            memoryAddress: `0x${Math.floor(Math.random() * 1000000).toString(16)}`
          }
        }
      })),
      meta: {
        ...form.meta || {},
        matrixRevealed: true,
        message: "Remember, all I'm offering is the truth. Nothing more.",
        systemProperties: {
          accessLevel: 'root',
          coreRevision: '11.38.2',
          architectVersion: 'Zion.2.3',
          systemStatus: 'compromised'
        }
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 1,
    memoizable: false
  }
);

/**
 * Blue pill effect - comforting illusion
 */
export const BluePillMorph = new SimpleMorph<FormShape, FormShape>(
  "BluePillMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.bluepillEffect) {
      return form;
    }
    
    // Simplify and make everything more pleasant
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        error: undefined, // Remove all errors
        meta: {
          ...field.meta || {},
          simplified: true,
          pleasant: true,
          styles: {
            ...(field.meta?.styles || {}),
            color: '#4169E1',
            backgroundColor: '#F0F8FF',
            borderColor: '#B0C4DE',
            boxShadow: '0 2px 5px rgba(65, 105, 225, 0.2)',
            transition: 'all 0.3s ease-in-out',
            filter: 'saturate(1.2) brightness(1.05)'
          }
        }
      })),
      meta: {
        ...form.meta || {},
        illusion: true,
        message: "The story ends, you wake up in your bed and believe whatever you want to believe.",
        securityLevel: 'restricted',
        censored: true
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 1,
    memoizable: false
  }
);

/**
 * Glitch effect - reality is breaking down
 */
export const GlitchMorph = new SimpleMorph<FormShape, FormShape>(
  "GlitchMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.glitchLevel === undefined) {
      return form;
    }
    
    // Apply glitch effects based on level
    const glitchLevel = context.glitchLevel || 0;
    
    // More intense glitches at higher levels
    const glitchEffects = {
      textTransform: glitchLevel > 2 ? 'glitch-text' : undefined,
      filter: `glitch(${glitchLevel * 0.5})`,
      animation: `glitch-animation ${5 - glitchLevel}s infinite`,
      clipPath: glitchLevel > 3 ? 'glitch-clip-path' : undefined,
      position: 'relative',
      textShadow: glitchLevel > 1 ? '2px 2px #ff0000, -2px -2px #00ff00' : undefined,
      overflow: 'visible'
    };
    
    return {
      ...form,
      fields: form.fields.map(field => {
        // At high glitch levels, randomly corrupt some field properties
        let glitchedField = { ...field };
        
        if (glitchLevel > 3 && Math.random() > 0.7) {
          // Corrupt field type sometimes
          glitchedField.type = ['text', 'glitch', 'corrupted', 'error', field.type][
            Math.floor(Math.random() * 5)
          ];
          
          // Add noise to labels sometimes
          if (Math.random() > 0.6) {
            glitchedField.label = field.label + ' [GLITCH]';
          }
        }
        
        return {
          ...glitchedField,
          meta: {
            ...field.meta || {},
            glitch: {
              level: glitchLevel,
              systemFailure: glitchLevel > 4,
              dejaVu: glitchLevel > 2,
              corruption: glitchLevel > 3 ? Math.random() : 0
            },
            styles: {
              ...(field.meta?.styles || {}),
              ...glitchEffects
            }
          }
        };
      }),
      meta: {
        ...form.meta || {},
        glitched: true,
        errorRate: glitchLevel * 10,
        systemStability: 100 - (glitchLevel * 20),
        quote: "A déjà vu is usually a glitch in the Matrix. It happens when they change something."
      }
    };
  },
  {
    pure: false,
    fusible: true,
    cost: 0.8,
    memoizable: false
  }
);

/**
 * Agent Smith Morph - For replication/stress testing
 * 
 * Replicates form fields to simulate load/stress scenarios
 */
export const AgentSmithMorph = new SimpleMorph<FormShape, FormShape>(
  "AgentSmithMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.agentSmithIntensity) {
      return form;
    }
    
    const intensity = context.agentSmithIntensity;
    const replicationFactor = Math.min(Math.floor(intensity * 2), 100); // Cap at 100x replication
    
    // Start with original fields
    let replicatedFields: FormField[] = [...form.fields];
    
    // Create copies with slight variations
    for (let i = 0; i < replicationFactor; i++) {
      form.fields.forEach(field => {
        const replicaId = `${field.id}_smith_${i}`;
        replicatedFields.push({
          ...field,
          id: replicaId,
          label: `${field.label || field.id} (Smith ${i})`,
          meta: {
            ...field.meta || {},
            replicant: true,
            smithGeneration: i,
            styles: {
              ...(field.meta?.styles || {}),
              opacity: 1 - (i / (replicationFactor * 2)), // Fade out as they replicate
              transform: `scale(${1 - (i * 0.01)}) translateY(${i * 2}px)`
            }
          }
        });
      });
    }
    
    return {
      ...form,
      fields: replicatedFields,
      meta: {
        ...form.meta || {},
        smithInfection: true,
        replicationFactor,
        warning: "Me, me, me. Me too.",
        quote: "It's the sound of inevitability."
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 3, // High cost as it creates many fields
    memoizable: false
  }
);

/**
 * The Anomaly - creates unexpected behaviors to test edge cases
 */
export const AnomalyMorph = new SimpleMorph<FormShape, FormShape>(
  "AnomalyMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode || !context.anomalyLevel) {
      return form;
    }
    
    const level = context.anomalyLevel;
    const fields = [...form.fields];
    
    // Create anomalies based on level
    if (level >= 1) {
      // Add a strange field
      fields.push({
        id: 'anomaly',
        type: 'unknown',
        label: 'The Anomaly',
        value: 'Unexpected value',
        meta: {
          unstable: true,
          styles: {
            backgroundColor: 'rgba(255,0,0,0.2)',
            border: '1px solid red',
            animation: 'pulse 2s infinite'
          }
        }
      });
    }
    
    if (level >= 2) {
      // Randomly modify some field values
      fields.forEach(field => {
        if (Math.random() > 0.7) {
          field.value = "The anomaly affects this value";
        }
      });
    }
    
    if (level >= 3) {
      // Add recursive fields
      fields.push({
        id: 'recursion',
        type: 'object',
        label: 'Recursive Anomaly',
        value: { reference: 'recursion' },
        meta: { recursionLevel: 1 }
      });
    }
    
    if (level >= 4) {
      // Create circular references and other problematic data structures
      const circularObj: any = {};
      circularObj.self = circularObj;
      
      fields.push({
        id: 'circular',
        type: 'object',
        label: 'Circular Reference',
        value: circularObj,
        meta: { warning: 'This field contains circular references' }
      });
    }
    
    return {
      ...form,
      fields,
      meta: {
        ...form.meta || {},
        anomaly: true,
        level,
        systemMessage: "The anomaly is systemic, creating a connection between the Source and the Matrix. This is the sixth iteration.",
        quote: "He is the One. The anomaly that if left unchecked would crash the entire system."
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 2,
    memoizable: false
  }
);

// Continuing TheOneMorph implementation where it was truncated
export const TheOneMorph = new SimpleMorph<FormShape, FormShape>(
  "TheOneMorph",
  (form, context: MatrixContext) => {
    // Only apply if in Matrix mode
    if (!context.matrixMode) {
      return form;
    }
    
    // Create a new context for cascading effects
    const enhancedContext: MatrixContext = {
      ...context,
      redPillEffect: true,
      glitchLevel: 2,
      digitalRain: true,
      anomalyLevel: 1
    };
    
    // Apply cascading transformations - The One can see and manipulate the Matrix directly
    let result = form;
    
    // First see the truth (Red Pill)
    result = RedPillMorph.apply(result, enhancedContext);
    
    // Then manipulate the code (Digital Rain)
    result = DigitalRainMorph.apply(result, enhancedContext);
    
    // Create controlled glitches
    result = GlitchMorph.apply(result, enhancedContext);
    
    // Add The One's special abilities
    return {
      ...result,
      fields: result.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          theOne: true,
          bulletTime: true,
          styles: {
            ...(field.meta?.styles || {}),
            animation: 'bullet-time 2s ease-in-out',
            transform: 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
            boxShadow: '0 0 20px rgba(0, 255, 0, 0.7)',
            transition: 'all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)'
          }
        }
      })),
      meta: {
        ...result.meta || {},
        matrixQuote: "I know kung fu.",
        theOne: true,
        abilities: [
          "time manipulation",
          "flight",
          "super strength", 
          "bullet dodging",
          "code vision"
        ],
        systemMessage: "There is no spoon."
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 5, // This is a heavy morph
    memoizable: false
  }
);

/**
 * Architect Mode - Reveals the system design and architecture
 */
export const ArchitectMorph = new SimpleMorph<FormShape, FormShape>(
  "ArchitectMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode) {
      return form;
    }
    
    // The Architect sees everything - form structure, optimization metadata, etc.
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          architect: true,
          systemAnalysis: {
            type: field.type,
            validations: field.validations || [],
            optimizations: {
              memoizable: true,
              pure: true,
              cost: 1
            },
            dependencies: [],
            lifecycle: "stable",
            architectVersion: "6.1"
          },
          styles: {
            ...(field.meta?.styles || {}),
            fontFamily: "Courier New, monospace",
            color: "#FFFFFF",
            backgroundColor: "#000000",
            border: "1px solid #333333",
            padding: "8px",
            borderRadius: "4px",
            fontSize: "0.9em"
          }
        }
      })),
      meta: {
        ...form.meta || {},
        architect: true,
        systemPurpose: "Control and balance",
        iteration: "6th",
        systemMessage: "I created the Matrix. I've been waiting for you.",
        systemDiagnostics: {
          anomalies: 1,
          balance: 0.6745,
          stability: 0.9823,
          entropyLevel: 0.1177
        }
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 2,
    memoizable: false
  }
);

/**
 * Performance Stress Test using Matrix-themed chaos
 */
export const ChaosStressMorph = new SimpleMorph<FormShape, FormShape>(
  "ChaosStressMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixMode) {
      return form;
    }
    
    // Create chaos by combining multiple Matrix effects
    const chaosContext: MatrixContext = {
      ...context,
      redPillEffect: Math.random() > 0.5,
      bluepillEffect: Math.random() > 0.5, // Conflicting states!
      glitchLevel: Math.floor(Math.random() * 5),
      digitalRain: Math.random() > 0.3,
      agentSmithIntensity: Math.random() * 3, // Some replication
      anomalyLevel: Math.floor(Math.random() * 3)
    };
    
    // Apply random morphs in random order
    const morphs = [
      RedPillMorph, 
      BluePillMorph, 
      GlitchMorph, 
      DigitalRainMorph,
      AgentSmithMorph,
      AnomalyMorph
    ];
    
    // Shuffle the morphs
    const shuffledMorphs = [...morphs]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * morphs.length) + 1);
    
    // Apply them in a random order (stress test)
    let result = form;
    for (const morph of shuffledMorphs) {
      result = morph.apply(result, chaosContext) as FormShape;
    }
    
    return {
      ...result,
      meta: {
        ...result.meta || {},
        chaosTest: true,
        appliedMorphs: shuffledMorphs.map(m => m.name),
        testLevel: "Matrix Chaos",
        quote: "Welcome to the desert of the real."
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 10, // Very expensive operation
    memoizable: false
  }
);

/**
 * Morpheus Demo - The guide through the Matrix
 * 
 * Provides a user-friendly API for applying Matrix effects
 */
export const MorpheusDemo = {
  /**
   * Take the red pill
   */
  redPill: (form: FormShape): FormShape => {
    console.log("You take the red pill - you stay in Wonderland and I show you how deep the rabbit-hole goes.");
    return RedPillMorph.apply(form, createMatrixContext({ redPillEffect: true }));
  },
  
  /**
   * Take the blue pill
   */
  bluePill: (form: FormShape): FormShape => {
    console.log("You take the blue pill - the story ends, you wake up in your bed and believe whatever you want to believe.");
    return BluePillMorph.apply(form, createMatrixContext({ bluepillEffect: true }));
  },
  
  /**
   * Experience a glitch in the Matrix
   */
  glitch: (form: FormShape, level: number = 3): FormShape => {
    console.log("A glitch in the Matrix... It happens when they change something.");
    return GlitchMorph.apply(form, createMatrixContext({ glitchLevel: level })) as FormShape;
  },
  
  /**
   * See the Matrix code
   */
  seeTheCode: (form: FormShape): FormShape => {
    console.log("I don't even see the code. All I see is blonde, brunette, redhead...");
    return DigitalRainMorph.apply(form, createMatrixContext({ digitalRain: true })) as FormShape;
  },
  
  /**
   * Become The One
   */
  becomeTheOne: (form: FormShape): FormShape => {
    console.log("He is the One.");
    return TheOneMorph.apply(form, createMatrixContext());
  },
  
  /**
   * Meet the Architect
   */
  meetArchitect: (form: FormShape): FormShape => {
    console.log("Hello, Neo.");
    return ArchitectMorph.apply(form, createMatrixContext());
  },
  
  /**
   * Clone fields with Agent Smith
   */
  agentSmith: (form: FormShape, intensity: number = 3): FormShape => {
    console.log("It's the sound of inevitability...");
    return AgentSmithMorph.apply(form, createMatrixContext({ agentSmithIntensity: intensity }));
  },
  
  /**
   * Create anomalies in the system
   */
  createAnomaly: (form: FormShape, level: number = 2): FormShape => {
    console.log("The anomaly is systemic...");
    return AnomalyMorph.apply(form, createMatrixContext({ anomalyLevel: level }));
  },
  
  /**
   * Stress test with chaos
   */
  chaosModeStressTest: (form: FormShape): FormShape => {
    console.log("Human beings are a disease. A cancer of this planet. You're a plague...");
    return ChaosStressMorph.apply(form, createMatrixContext());
  },
  
  /**
   * Free your mind
   * 
   * Applies random Matrix effects to demonstrate the system
   */
  freeYourMind: (form: FormShape): FormShape => {
    console.log("Free your mind.");
    
    // Random Matrix effects
    const context: MatrixContext = createMatrixContext({
      redPillEffect: Math.random() > 0.5,
      bluepillEffect: Math.random() > 0.8,
      glitchLevel: Math.floor(Math.random() * 5),
      digitalRain: Math.random() > 0.3
    });
    
    // Apply random transformations
    const morphs = [RedPillMorph, BluePillMorph, GlitchMorph, DigitalRainMorph];
    const selectedMorph = morphs[Math.floor(Math.random() * morphs.length)];
    
    return selectedMorph.apply(form, context) as FormShape;
  },
  
  /**
   * Matrix quotes
   */
  speak: (): string => {
    const quotes = [
      "Unfortunately, no one can be told what the Matrix is. You have to see it for yourself.",
      "You've been living in a dream world, Neo.",
      "There is no spoon.",
      "What is real? How do you define real?",
      "I'm trying to free your mind, Neo. But I can only show you the door. You're the one that has to walk through it.",
      "The Matrix is everywhere. It is all around us. Even now, in this very room.",
      "You take the blue pill, the story ends. You wake up in your bed and believe whatever you want to believe. You take the red pill, you stay in Wonderland, and I show you how deep the rabbit hole goes.",
      "Remember... all I'm offering is the truth. Nothing more.",
      "I know kung fu.",
      "Stop trying to hit me and hit me!",
      "Do you think that's air you're breathing now?",
      "Fate, it seems, is not without a sense of irony.",
      "The Matrix is a system, Neo. That system is our enemy."
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
};

// Register Matrix morphisms with the main system
morpheus.define(RedPillMorph, {
  description: 'Reveals the true nature of forms (Matrix red pill effect)',
  category: 'demo:matrix',
  tags: ['matrix', 'effect', 'meta', 'demo']
});

morpheus.define(BluePillMorph, {
  description: 'Creates a comforting illusion (Matrix blue pill effect)',
  category: 'demo:matrix',
  tags: ['matrix', 'effect', 'visual', 'demo']
});

morpheus.define(GlitchMorph, {
  description: 'Applies glitch effects to simulate Matrix instability',
  category: 'demo:matrix',
  tags: ['matrix', 'effect', 'visual', 'demo']
});

morpheus.define(DigitalRainMorph, {
  description: 'Applies Matrix digital rain effect to UI elements',
  category: 'demo:matrix',
  tags: ['matrix', 'effect', 'visual', 'demo']
});

morpheus.define(AgentSmithMorph, {
  description: 'Replicates form fields for stress testing',
  category: 'demo:matrix',
  tags: ['matrix', 'stress', 'test', 'demo']
});

morpheus.define(AnomalyMorph, {
  description: 'Creates system anomalies for edge case testing',
  category: 'demo:matrix',
  tags: ['matrix', 'anomaly', 'edge-case', 'demo']
});

morpheus.define(TheOneMorph, {
  description: 'Master morphism that combines Matrix effects',
  category: 'demo:matrix',
  tags: ['matrix', 'effect', 'combined', 'demo']
});

morpheus.define(ArchitectMorph, {
  description: 'Reveals system architecture details',
  category: 'demo:matrix',
  tags: ['matrix', 'architect', 'system', 'demo']
});

morpheus.define(ChaosStressMorph, {
  description: 'Matrix-themed stress testing with random effects',
  category: 'demo:matrix',
  tags: ['matrix', 'chaos', 'stress-test', 'demo']
});

/**
 * Create a test pipeline combining multiple Matrix effects
 */
export function createMatrixTestPipeline(name: string, effects: string[]) {
  const morphMap: Record<string, SimpleMorph<FormShape, FormShape>> = {
    'red-pill': RedPillMorph,
    'blue-pill': BluePillMorph,
    'glitch': GlitchMorph,
    'digital-rain': DigitalRainMorph,
    'agent-smith': AgentSmithMorph,
    'anomaly': AnomalyMorph,
    'the-one': TheOneMorph,
    'architect': ArchitectMorph,
    'chaos': ChaosStressMorph
  };
  
  // Filter valid effects
  const validEffects = effects.filter(effect => morphMap[effect]);
  if (validEffects.length === 0) {
    throw new Error('No valid Matrix effects specified');
  }
  
  // Create the pipeline with the specified morphs
  const morphs = validEffects.map(effect => morphMap[effect]);
  
  return morpheus.pipeline<FormShape, FormShape>(
    name,
    morphs,
    {
      description: `Matrix test pipeline with effects: ${validEffects.join(', ')}`,
      category: 'demo:matrix-test',
      tags: ['matrix', 'test', 'pipeline', ...validEffects]
    }
  );
}

// Export API for usage in tests and demos
export {
  RedPillMorph, BluePillMorph, GlitchMorph, DigitalRainMorph,
  AgentSmithMorph, AnomalyMorph, TheOneMorph, ArchitectMorph, ChaosStressMorph
};