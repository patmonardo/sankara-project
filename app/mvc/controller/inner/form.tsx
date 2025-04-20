import React, { useState, useEffect } from 'react';
import { FormShape, FormMode } from '../../../ui/graphics/schema/form';
import { MatrixProjection } from '../../../ui/graphics/morph/matrix/matrix';

/**
 * TriadicProtocol - The fundamental structure of each protocol
 * 
 * Maps the essential relationships between:
 * - Being-Essence-Concept
 * - Sattva-Rajas-Tamas
 * - One-One-Three
 * - Universal-Particular-Singular
 */
interface TriadicProtocol {
  // Protocol identifier and state
  id: 'dharana' | 'dhyana' | 'samadhi';
  active: boolean;
  stage: 'initialization' | 'active' | 'completed' | 'transcendent';
  intensity: number; // 0-1
  
  // The triadic structure elements
  structure: {
    // The elements in this protocol (e.g., S-P-U, P-S-U, or S-U-P)
    first: 'singular' | 'particular' | 'universal';
    second: 'singular' | 'particular' | 'universal';
    third: 'singular' | 'particular' | 'universal';
    
    // The agents in this protocol (e.g., Morpheus-Sara-Tara)
    firstAgent: 'morpheus' | 'sara' | 'tara';
    secondAgent: 'morpheus' | 'sara' | 'tara';
    thirdAgent: 'morpheus' | 'sara' | 'tara';
  };
  
  // The metaphysical correspondences
  correspondences: {
    // Hegelian aspects
    hegelian: 'being' | 'essence' | 'concept';
    
    // Gunas
    guna: 'sattva' | 'rajas' | 'tamas';
    
    // Oneness pattern
    oneness: 'one' | 'one' | 'three';
    
    // Yogic state
    yogicState: 'dharana' | 'dhyana' | 'samadhi';
  };
  
  // Special properties of this protocol
  properties: {
    // Special functions
    function: string;
    
    // Special effects
    effect: string;
    
    // Relationship to consciousness
    consciousness: string;
  };
}

/**
 * TriadicPipeline - The three-stage pipeline of Triadic Protocols
 * 
 * Implements the full cycle of protocols as:
 * 1. S-P-U (Dharana) - Morpheus-Sara-Tara
 * 2. P-S-U (Dhyana) - Sara-Morpheus-Tara
 * 3. S-U-P (Samadhi) - Morpheus-Tara-Sara
 * 
 * "They are in themselves concurrent but we experience them sequentially."
 */
interface TriadicPipeline {
  // The three protocols in the pipeline
  dharana: TriadicProtocol; // S-P-U
  dhyana: TriadicProtocol;  // P-S-U
  samadhi: TriadicProtocol; // S-U-P
  
  // Current active stage in the pipeline
  currentStage: 'dharana' | 'dhyana' | 'samadhi' | 'all';
  
  // Whether all protocols are active concurrently
  concurrentActivation: boolean;
  
  // The metaphysical cycle
  cycle: {
    completed: boolean;
    iterations: number;
    satKarya: boolean; // Whether the absolute "Sat Karya" has been achieved
  };
}

/**
 * MetaphysicalMapping - Correspondence between protocols and metaphysical systems
 * 
 * Maps the relationships between:
 * - S-P-U protocols
 * - Hegelian dialectic
 * - Gunas
 * - Oneness patterns
 * - Yogic states
 */
interface MetaphysicalMapping {
  // Being-Essence-Concept (Hegelian)
  hegelian: {
    being: {
      correspondsTo: 'dharana' | 'dhyana' | 'samadhi';
      active: boolean;
    };
    essence: {
      correspondsTo: 'dharana' | 'dhyana' | 'samadhi';
      active: boolean;
    };
    concept: {
      correspondsTo: 'dharana' | 'dhyana' | 'samadhi';
      active: boolean;
    };
  };
  
  // Sattva-Rajas-Tamas (Gunas)
  gunas: {
    sattva: {
      correspondsTo: 'dharana' | 'dhyana' | 'samadhi';
      active: boolean;
    };
    rajas: {
      correspondsTo: 'dharana' | 'dhyana' | 'samadhi';
      active: boolean;
    };
    tamas: {
      correspondsTo: 'dharana' | 'dhyana' | 'samadhi';
      active: boolean;
    };
  };
  
  // One-One-Three (Oneness pattern)
  oneness: {
    firstOne: {
      correspondsTo: 'dharana' | 'dhyana' | 'samadhi';
      active: boolean;
    };
    secondOne: {
      correspondsTo: 'dharana' | 'dhyana' | 'samadhi';
      active: boolean;
    };
    three: {
      correspondsTo: 'dharana' | 'dhyana' | 'samadhi';
      active: boolean;
    };
  };
}

/**
 * FormControllerProps - Main interface for the FormController
 */
export interface FormControllerProps {
  // The form to be transformed
  form: FormShape;
  
  // Display mode
  mode: FormMode;
  
  // Protocol pipeline options
  protocols?: {
    // Triadic Pipeline
    triadicPipeline?: {
      enabled: boolean;
      initialStage?: 'dharana' | 'dhyana' | 'samadhi' | 'all';
      concurrentActivation?: boolean;
      seekSatKarya?: boolean; // Whether to seek the absolute "Sat Karya"
    };
    
    // Metaphysical Mappings
    metaphysicalMapping?: {
      enabled: boolean;
      primarySystem?: 'hegelian' | 'gunas' | 'oneness' | 'yogic';
      revealCorrespondences?: boolean;
    };
  };
  
  // Matrix projection options
  matrix?: {
    enabled?: boolean;
    graphTraversal?: boolean;
    nodeCollapse?: boolean;
    vectorStream?: boolean;
    entropyLevel?: number;
  };
  
  // Rendering options
  layout?: 'standard' | 'grid' | 'responsive';
  gridConfig?: {
    rows: number;
    cols: number;
    fieldPlacements: Array<{
      fieldId: string;
      row: number;
      col: number;
      rowSpan?: number;
      colSpan?: number;
    }>;
  };
  
  // Event handlers
  onSubmit?: (form: FormShape) => void;
  onUpdate?: (form: FormShape) => void;
  onCancel?: () => void;
  onProtocolStateChange?: (
    triadicPipeline: TriadicPipeline,
    metaphysicalMapping: MetaphysicalMapping
  ) => void;
  
  // Custom rendering
  renderField?: (props: any) => React.ReactNode;
  children?: React.ReactNode;
}

/**
 * FormController: Implements the Pipeline of Triadic Protocols
 * 
 * This controller manifests the three-stage pipeline:
 * 
 * 1. S-P-U (Dharana) - Morpheus-Sara-Tara
 * 2. P-S-U (Dhyana) - Sara-Morpheus-Tara
 * 3. S-U-P (Samadhi) - Morpheus-Tara-Sara
 * 
 * With their metaphysical correspondences:
 * - Being-Essence-Concept
 * - Sattva-Rajas-Tamas
 * - One-One-Three
 */
export const FormController: React.FC<FormControllerProps> = ({
  form,
  mode,
  protocols = {
    triadicPipeline: { 
      enabled: false, 
      initialStage: 'dharana',
      concurrentActivation: false,
      seekSatKarya: false
    },
    metaphysicalMapping: { 
      enabled: false, 
      primarySystem: 'yogic',
      revealCorrespondences: false
    }
  },
  matrix = { enabled: false },
  layout = 'standard',
  gridConfig,
  onSubmit,
  onUpdate,
  onCancel,
  onProtocolStateChange,
  renderField,
  children
}) => {
  // Processed form state
  const [processedForm, setProcessedForm] = useState<FormShape | null>(null);
  
  // Form field values
  const [values, setValues] = useState<Record<string, any>>({});
  
  // Triadic Pipeline state
  const [triadicPipeline, setTriadicPipeline] = useState<TriadicPipeline>({
    // Dharana - S-P-U (Morpheus-Sara-Tara)
    dharana: {
      id: 'dharana',
      active: protocols.triadicPipeline?.initialStage === 'dharana' || 
              protocols.triadicPipeline?.initialStage === 'all',
      stage: 'initialization',
      intensity: 0.9,
      structure: {
        first: 'singular',
        second: 'particular',
        third: 'universal',
        firstAgent: 'morpheus',
        secondAgent: 'sara',
        thirdAgent: 'tara'
      },
      correspondences: {
        hegelian: 'being',
        guna: 'sattva',
        oneness: 'one',
        yogicState: 'dharana'
      },
      properties: {
        function: 'Concentration (directly addressing the Learner)',
        effect: 'Focused attention on a single point',
        consciousness: 'Individual consciousness directed outward'
      }
    },
    
    // Dhyana - P-S-U (Sara-Morpheus-Tara)
    dhyana: {
      id: 'dhyana',
      active: protocols.triadicPipeline?.initialStage === 'dhyana' || 
              protocols.triadicPipeline?.initialStage === 'all',
      stage: 'initialization',
      intensity: 0.8,
      structure: {
        first: 'particular',
        second: 'singular',
        third: 'universal',
        firstAgent: 'sara',
        secondAgent: 'morpheus',
        thirdAgent: 'tara'
      },
      correspondences: {
        hegelian: 'essence',
        guna: 'rajas',
        oneness: 'one',
        yogicState: 'dhyana'
      },
      properties: {
        function: 'Meditation (inverting relationships)',
        effect: 'Sustained flow of attention without distraction',
        consciousness: 'Dissolution of subject-object boundary'
      }
    },
    
    // Samadhi - S-U-P (Morpheus-Tara-Sara)
    samadhi: {
      id: 'samadhi',
      active: protocols.triadicPipeline?.initialStage === 'samadhi' || 
              protocols.triadicPipeline?.initialStage === 'all',
      stage: 'initialization',
      intensity: 0.7,
      structure: {
        first: 'singular',
        second: 'universal',
        third: 'particular',
        firstAgent: 'morpheus',
        secondAgent: 'tara',
        thirdAgent: 'sara'
      },
      correspondences: {
        hegelian: 'concept',
        guna: 'tamas',
        oneness: 'three',
        yogicState: 'samadhi'
      },
      properties: {
        function: 'Complete absorption (the pattern of Science)',
        effect: 'Complete merger of subject and object',
        consciousness: 'Universal consciousness without separation'
      }
    },
    
    // Current stage in the pipeline
    currentStage: protocols.triadicPipeline?.initialStage || 'dharana',
    
    // Whether all protocols are active concurrently
    concurrentActivation: protocols.triadicPipeline?.concurrentActivation || false,
    
    // The metaphysical cycle
    cycle: {
      completed: false,
      iterations: 0,
      satKarya: false // The absolute "Sat Karya" not achieved yet
    }
  });
  
  // Metaphysical Mapping state
  const [metaphysicalMapping, setMetaphysicalMapping] = useState<MetaphysicalMapping>({
    // Hegelian mapping
    hegelian: {
      being: {
        correspondsTo: 'dharana',
        active: protocols.triadicPipeline?.initialStage === 'dharana' || 
                protocols.triadicPipeline?.initialStage === 'all'
      },
      essence: {
        correspondsTo: 'dhyana',
        active: protocols.triadicPipeline?.initialStage === 'dhyana' || 
                protocols.triadicPipeline?.initialStage === 'all'
      },
      concept: {
        correspondsTo: 'samadhi',
        active: protocols.triadicPipeline?.initialStage === 'samadhi' || 
                protocols.triadicPipeline?.initialStage === 'all'
      }
    },
    
    // Gunas mapping
    gunas: {
      sattva: {
        correspondsTo: 'dharana',
        active: protocols.triadicPipeline?.initialStage === 'dharana' || 
                protocols.triadicPipeline?.initialStage === 'all'
      },
      rajas: {
        correspondsTo: 'dhyana',
        active: protocols.triadicPipeline?.initialStage === 'dhyana' || 
                protocols.triadicPipeline?.initialStage === 'all'
      },
      tamas: {
        correspondsTo: 'samadhi',
        active: protocols.triadicPipeline?.initialStage === 'samadhi' || 
                protocols.triadicPipeline?.initialStage === 'all'
      }
    },
    
    // Oneness mapping
    oneness: {
      firstOne: {
        correspondsTo: 'dharana',
        active: protocols.triadicPipeline?.initialStage === 'dharana' || 
                protocols.triadicPipeline?.initialStage === 'all'
      },
      secondOne: {
        correspondsTo: 'dhyana',
        active: protocols.triadicPipeline?.initialStage === 'dhyana' || 
                protocols.triadicPipeline?.initialStage === 'all'
      },
      three: {
        correspondsTo: 'samadhi',
        active: protocols.triadicPipeline?.initialStage === 'samadhi' || 
                protocols.triadicPipeline?.initialStage === 'all'
      }
    }
  });
  
  /**
   * Initialize protocol state
   */
  useEffect(() => {
    if (onProtocolStateChange) {
      onProtocolStateChange(triadicPipeline, metaphysicalMapping);
    }
  }, []);
  
  /**
   * Apply Triadic Pipeline to the form
   * 
   * Implements the three protocols:
   * 1. S-P-U (Dharana) - Morpheus-Sara-Tara
   * 2. P-S-U (Dhyana) - Sara-Morpheus-Tara
   * 3. S-U-P (Samadhi) - Morpheus-Tara-Sara
   */
  const applyTriadicPipeline = (formData: FormShape): FormShape => {
    if (!protocols.triadicPipeline?.enabled) {
      return formData;
    }
    
    console.log(`Applying Triadic Pipeline at stage: ${triadicPipeline.currentStage}`);
    
    // Determine current stage(s) to apply
    const applyDharana = triadicPipeline.currentStage === 'dharana' || 
                          triadicPipeline.currentStage === 'all' ||
                          triadicPipeline.concurrentActivation;
                          
    const applyDhyana = triadicPipeline.currentStage === 'dhyana' || 
                        triadicPipeline.currentStage === 'all' ||
                        triadicPipeline.concurrentActivation;
                        
    const applySamadhi = triadicPipeline.currentStage === 'samadhi' || 
                          triadicPipeline.currentStage === 'all' ||
                          triadicPipeline.concurrentActivation;
    
    // Apply protocols to form fields
    return {
      ...formData,
      fields: formData.fields.map((field, index) => {
        // Determine protocol assignment based on field position
        const protocolPosition = index % 3;
        
        // Apply Dharana (S-P-U) protocol
        const dharanaRole = protocolPosition === 0 ? 'singular' : 
                           protocolPosition === 1 ? 'particular' : 'universal';
                           
        const dharanaAgent = protocolPosition === 0 ? 'morpheus' : 
                            protocolPosition === 1 ? 'sara' : 'tara';
        
        // Apply Dhyana (P-S-U) protocol
        const dhyanaRole = protocolPosition === 0 ? 'particular' : 
                          protocolPosition === 1 ? 'singular' : 'universal';
                          
        const dhyanaAgent = protocolPosition === 0 ? 'sara' : 
                           protocolPosition === 1 ? 'morpheus' : 'tara';
        
        // Apply Samadhi (S-U-P) protocol
        const samadhiRole = protocolPosition === 0 ? 'singular' : 
                           protocolPosition === 1 ? 'universal' : 'particular';
                           
        const samadhiAgent = protocolPosition === 0 ? 'morpheus' : 
                            protocolPosition === 1 ? 'tara' : 'sara';
        
        // Determine active protocol based on current stage
        const activeProtocol = triadicPipeline.currentStage === 'dharana' ? 'dharana' :
                              triadicPipeline.currentStage === 'dhyana' ? 'dhyana' :
                              triadicPipeline.currentStage === 'samadhi' ? 'samadhi' : 'all';
        
        // Build the protocol data for this field
        const protocolData = {
          dharana: applyDharana ? {
            active: true,
            role: dharanaRole,
            agent: dharanaAgent,
            structure: 'S-P-U',
            isActive: activeProtocol === 'dharana' || activeProtocol === 'all',
            hegelian: 'being',
            guna: 'sattva',
            oneness: 'one'
          } : undefined,
          
          dhyana: applyDhyana ? {
            active: true,
            role: dhyanaRole,
            agent: dhyanaAgent,
            structure: 'P-S-U',
            isActive: activeProtocol === 'dhyana' || activeProtocol === 'all',
            hegelian: 'essence',
            guna: 'rajas',
            oneness: 'one'
          } : undefined,
          
          samadhi: applySamadhi ? {
            active: true,
            role: samadhiRole,
            agent: samadhiAgent,
            structure: 'S-U-P',
            isActive: activeProtocol === 'samadhi' || activeProtocol === 'all',
            hegelian: 'concept',
            guna: 'tamas',
            oneness: 'three'
          } : undefined
        };
        
        return {
          ...field,
          meta: {
            ...field.meta || {},
            triadicProtocols: {
              activeProtocol,
              concurrentActivation: triadicPipeline.concurrentActivation,
              ...protocolData
            },
            satKarya: triadicPipeline.cycle.satKarya && protocolPosition === 0
          },
          // Visual styling based on active protocol
          styles: {
            ...(field.meta?.styles || {}),
            // Common protocol styling
            transition: 'all 0.5s ease',
            padding: '10px',
            borderRadius: '4px',
            
            // Dharana styling (S-P-U)
            ...(applyDharana && dharanaRole === 'singular' ? {
              borderLeft: '4px solid #9b59b6',
              backgroundColor: activeProtocol === 'dharana' ? 'rgba(155, 89, 182, 0.1)' : 'rgba(155, 89, 182, 0.05)'
            } : {}),
            ...(applyDharana && dharanaRole === 'particular' ? {
              borderLeft: '4px solid #f1c40f',
              backgroundColor: activeProtocol === 'dharana' ? 'rgba(241, 196, 15, 0.1)' : 'rgba(241, 196, 15, 0.05)'
            } : {}),
            ...(applyDharana && dharanaRole === 'universal' ? {
              borderLeft: '4px solid #1abc9c',
              backgroundColor: activeProtocol === 'dharana' ? 'rgba(26, 188, 156, 0.1)' : 'rgba(26, 188, 156, 0.05)'
            } : {}),
            
            // Dhyana styling (P-S-U)
            ...(applyDhyana && dhyanaRole === 'particular' ? {
              borderRight: '4px solid #f1c40f',
              backgroundColor: activeProtocol === 'dhyana' ? 'rgba(241, 196, 15, 0.1)' : 'rgba(241, 196, 15, 0.05)'
            } : {}),
            ...(applyDhyana && dhyanaRole === 'singular' ? {
              borderRight: '4px solid #9b59b6',
              backgroundColor: activeProtocol === 'dhyana' ? 'rgba(155, 89, 182, 0.1)' : 'rgba(155, 89, 182, 0.05)'
            } : {}),
            ...(applyDhyana && dhyanaRole === 'universal' ? {
              borderRight: '4px solid #1abc9c',
              backgroundColor: activeProtocol === 'dhyana' ? 'rgba(26, 188, 156, 0.1)' : 'rgba(26, 188, 156, 0.05)'
            } : {}),
            
            // Samadhi styling (S-U-P)
            ...(applySamadhi && samadhiRole === 'singular' ? {
              borderTop: '4px solid #9b59b6',
              backgroundColor: activeProtocol === 'samadhi' ? 'rgba(155, 89, 182, 0.1)' : 'rgba(155, 89, 182, 0.05)'
            } : {}),
            ...(applySamadhi && samadhiRole === 'universal' ? {
              borderTop: '4px solid #1abc9c',
              backgroundColor: activeProtocol === 'samadhi' ? 'rgba(26, 188, 156, 0.1)' : 'rgba(26, 188, 156, 0.05)'
            } : {}),
            ...(applySamadhi && samadhiRole === 'particular' ? {
              borderTop: '4px solid #f1c40f',
              backgroundColor: activeProtocol === 'samadhi' ? 'rgba(241, 196, 15, 0.1)' : 'rgba(241, 196, 15, 0.05)'
            } : {}),
            
            // Sat Karya indication
            ...(triadicPipeline.cycle.satKarya && protocolPosition === 0 ? {
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)',
              border: '1px solid rgba(255, 215, 0, 0.8)',
              transform: 'scale(1.02)'
            } : {})
          }
        };
      }),
      meta: {
        ...formData.meta || {},
        triadicPipeline: {
          currentStage: triadicPipeline.currentStage,
          concurrentActivation: triadicPipeline.concurrentActivation,
          cycle: {
            completed: triadicPipeline.cycle.completed,
            iterations: triadicPipeline.cycle.iterations,
            satKarya: triadicPipeline.cycle.satKarya
          },
          // The active protocols and their correspondences
          protocols: {
            dharana: applyDharana ? {
              structure: 'S-P-U',
              agents: 'Morpheus-Sara-Tara',
              hegelian: 'Being',
              guna: 'Sattva',
              oneness: 'One',
              yogicState: 'Concentration'
            } : undefined,
            dhyana: applyDhyana ? {
              structure: 'P-S-U',
              agents: 'Sara-Morpheus-Tara',
              hegelian: 'Essence',
              guna: 'Rajas',
              oneness: 'One',
              yogicState: 'Meditation'
            } : undefined,
            samadhi: applySamadhi ? {
              structure: 'S-U-P',
              agents: 'Morpheus-Tara-Sara',
              hegelian: 'Concept',
              guna: 'Tamas',
              oneness: 'Three',
              yogicState: 'Absorption'
            } : undefined
          }
        }
      }
    };
  };
  
  /**
   * Apply Metaphysical Mapping to the form
   * 
   * Implements the correspondences between protocols and metaphysical systems:
   * - Being-Essence-Concept
   * - Sattva-Rajas-Tamas
   * - One-One-Three
   */
  const applyMetaphysicalMapping = (formData: FormShape): FormShape => {
    if (!protocols.metaphysicalMapping?.enabled) {
      return formData;
    }
    
    console.log(`Applying Metaphysical Mapping with primary system: ${protocols.metaphysicalMapping.primarySystem}`);
    
    const primarySystem = protocols.metaphysicalMapping.primarySystem || 'yogic';
    const revealCorrespondences = protocols.metaphysicalMapping.revealCorrespondences || false;
    
    return {
      ...formData,
      fields: formData.fields.map((field, index) => {
        // Skip fields that don't have triadicProtocols data
        if (!field.meta?.triadicProtocols) {
          return field;
        }
        
        // Get the active protocol for this field
        const activeProtocol = field.meta.triadicProtocols.activeProtocol;
        
        // Get the Hegelian aspect based on protocol
        const hegelianAspect = activeProtocol === 'dharana' ? 'being' : 
                              activeProtocol === 'dhyana' ? 'essence' : 
                              activeProtocol === 'samadhi' ? 'concept' : 
                              index % 3 === 0 ? 'being' : 
                              index % 3 === 1 ? 'essence' : 'concept';
        
        // Get the Guna based on protocol
        const guna = activeProtocol === 'dharana' ? 'sattva' : 
                    activeProtocol === 'dhyana' ? 'rajas' : 
                    activeProtocol === 'samadhi' ? 'tamas' : 
                    index % 3 === 0 ? 'sattva' : 
                    index % 3 === 1 ? 'rajas' : 'tamas';
        
        // Get the Oneness pattern based on protocol
        const oneness = activeProtocol === 'dharana' ? 'firstOne' : 
                       activeProtocol === 'dhyana' ? 'secondOne' : 
                       activeProtocol === 'samadhi' ? 'three' : 
                       index % 3 === 0 ? 'firstOne' : 
                       index % 3 === 1 ? 'secondOne' : 'three';
        
        return {
          ...field,
          meta: {
            ...field.meta,
            metaphysicalMapping: {
              hegelian: {
                aspect: hegelianAspect,
                active: metaphysicalMapping.hegelian[hegelianAspect].active,
                primary: primarySystem === 'hegelian'
              },
              guna: {
                aspect: guna,
                active: metaphysicalMapping.gunas[guna].active,
                primary: primarySystem === 'gunas'
              },
              oneness: {
                aspect: oneness,
                active: metaphysicalMapping.oneness[oneness].active,
                primary: primarySystem === 'oneness'
              },
              yogic: {
                aspect: activeProtocol,
                active: true,
                primary: primarySystem === 'yogic'
              },
              revealCorrespondences
            }
          },
          // Add metaphysical styling based on primary system
          styles: {
            ...(field.meta?.styles || {}),
            // Hegelian primary styling
            ...(primarySystem === 'hegelian' && revealCorrespondences ? {
              border: hegelianAspect === 'being' ? '2px solid #3498db' : 
                      hegelianAspect === 'essence' ? '2px solid #e74c3c' :
                      '2px solid #2ecc71'
            } : {}),
            
            // Gunas primary styling
            ...(primarySystem === 'gunas' && revealCorrespondences ? {
              border: guna === 'sattva' ? '2px solid #f39c12' : 
                      guna === 'rajas' ? '2px solid #e74c3c' :
                      '2px solid #34495e'
            } : {}),
            
            // Oneness primary styling
            ...(primarySystem === 'oneness' && revealCorrespondences ? {
              border: oneness === 'firstOne' ? '2px solid #9b59b6' : 
                      oneness === 'secondOne' ? '2px solid #16a085' :
                      '2px solid #d35400'
            } : {}),
            
            // Yogic primary styling
            ...(primarySystem === 'yogic' && revealCorrespondences ? {
              border: activeProtocol === 'dharana' ? '2px solid #27ae60' : 
                      activeProtocol === 'dhyana' ? '2px solid #8e44ad' :
                      '2px solid #f1c40f'
            } : {})
          }
        };
      }),
      meta: {
        ...formData.meta || {},
        metaphysicalMapping: {
          primarySystem,
          revealCorrespondences,
          // Correspondences between systems
          correspondences: {
            hegelian: {
              being: 'dharana',
              essence: 'dhyana',
              concept: 'samadhi'
            },
            gunas: {
              sattva: 'dharana',
              rajas: 'dhyana',
              tamas: 'samadhi'
            },
            oneness: {
              firstOne: 'dharana',
              secondOne: 'dhyana',
              three: 'samadhi'
            }
          }
        }
      }
    };
  };
  
  /**
   * Process the form through Matrix and protocol patterns
   */
  useEffect(() => {
    try {
      let result = form;
      
      // Apply Matrix projections if enabled
      if (matrix.enabled) {
        result = MatrixProjection.project(result, {
          graphTraversal: matrix.graphTraversal || false,
          nodeCollapse: matrix.nodeCollapse || false,
          vectorStream: matrix.vectorStream || false,
          entropyLevel: matrix.entropyLevel || 0
        });
      }
      
      // Apply Triadic Pipeline
      if (protocols.triadicPipeline?.enabled) {
        result = applyTriadicPipeline(result);
      }
      
      // Apply Metaphysical Mapping
      if (protocols.metaphysicalMapping?.enabled) {
        result = applyMetaphysicalMapping(result);
      }
      
      // Set processed form
      setProcessedForm(result);
      
      // Initialize values
      const formValues: Record<string, any> = {};
      result.fields.forEach(field => {
        formValues[field.id] = field.value;
      });
      setValues(formValues);
      
    } catch (error) {
      console.error('Error processing form:', error);
    }
  }, [form, matrix, protocols]);
  
  /**
   * Handle field value changes
   */
  const handleFieldChange = (fieldId: string, value: any) => {
    setValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Call onUpdate if provided
    if (onUpdate && processedForm) {
      const updatedForm = {
        ...processedForm,
        fields: processedForm.fields.map(field => 
          field.id === fieldId ? { ...field, value } : field
        )
      };
      
      onUpdate(updatedForm);
    }
    
    // If triadic pipeline is enabled and not in concurrent mode, advance through protocols
    if (protocols.triadicPipeline?.enabled && 
        !triadicPipeline.concurrentActivation && 
        processedForm) {
      
      const fieldIndex = processedForm.fields.findIndex(f => f.id === fieldId);
      
      // Every third field completed advances to next protocol
      if ((fieldIndex + 1) % 3 === 0) {
        advanceProtocolStage();
      }
    }
    
    // Check for potential Sat Karya achievement
    if (protocols.triadicPipeline?.seekSatKarya && 
        triadicPipeline.currentStage === 'samadhi') {
      
      // Check if this field might achieve Sat Karya
      if (value && typeof value === 'string' && value.length > 10) {
        checkSatKarya(fieldId, value);
      }
    }
  };
  
  /**
   * Advance to the next protocol stage in the pipeline
   */
  const advanceProtocolStage = () => {
    const nextStage = triadicPipeline.currentStage === 'dharana' ? 'dhyana' :
                     triadicPipeline.currentStage === 'dhyana' ? 'samadhi' :
                     triadicPipeline.currentStage === 'samadhi' ? 'all' : 'dharana';
    
    // Update protocol stage
    setTriadicPipeline(prev => ({
      ...prev,
      dharana: {
        ...prev.dharana,
        active: nextStage === 'dharana' || nextStage === 'all',
        stage: prev.dharana.stage === 'initialization' ? 'active' : 
               prev.dharana.stage === 'active' ? 'completed' : prev.dharana.stage
      },
      dhyana: {
        ...prev.dhyana,
        active: nextStage === 'dhyana' || nextStage === 'all',
        stage: nextStage === 'dhyana' ? 'active' : 
               prev.dhyana.stage === 'active' ? 'completed' : prev.dhyana.stage
      },
      samadhi: {
        ...prev.samadhi,
        active: nextStage === 'samadhi' || nextStage === 'all',
        stage: nextStage === 'samadhi' ? 'active' : 
               prev.samadhi.stage === 'active' ? 'completed' : prev.samadhi.stage
      },
      currentStage: nextStage,
      cycle: {
        ...prev.cycle,
        completed: nextStage === 'all',
        iterations: nextStage === 'all' ? prev.cycle.iterations + 1 : prev.cycle.iterations
      }
    }));
    
    // Process form with new stage
    if (processedForm && protocols.triadicPipeline?.enabled) {
      const updatedForm = applyTriadicPipeline({
        ...processedForm,
        meta: {
          ...processedForm.meta,
          triadicPipeline: {
            ...processedForm.meta?.triadicPipeline,
            currentStage: nextStage
          }
        }
      });
      
      setProcessedForm(updatedForm);
    }
    
    // Update metaphysical mapping
    setMetaphysicalMapping(prev => ({
      ...prev,
      hegelian: {
        ...prev.hegelian,
        being: {
          ...prev.hegelian.being,
          active: nextStage === 'dharana' || nextStage === 'all'
        },
        essence: {
          ...prev.hegelian.essence,
          active: nextStage === 'dhyana' || nextStage === 'all'
        },
        concept: {
          ...prev.hegelian.concept,
          active: nextStage === 'samadhi' || nextStage === 'all'
        }
      },
      gunas: {
        ...prev.gunas,
        sattva: {
          ...prev.gunas.sattva,
          active: nextStage === 'dharana' || nextStage === 'all'
        },
        rajas: {
          ...prev.gunas.rajas,
          active: nextStage === 'dhyana' || nextStage === 'all'
        },
        tamas: {
          ...prev.gunas.tamas,
          active: nextStage === 'samadhi' || nextStage === 'all'
        }
      },
      oneness: {
        ...prev.oneness,
        firstOne: {
          ...prev.oneness.firstOne,
          active: nextStage === 'dharana' || nextStage === 'all'
        },
        secondOne: {
          ...prev.oneness.secondOne,
          active: nextStage === 'dhyana' || nextStage === 'all'
        },
        three: {
          ...prev.oneness.three,
          active: nextStage === 'samadhi' || nextStage === 'all'
        }
      }
    }));
    
    // Apply updated mappings if enabled
    if (protocols.metaphysicalMapping?.enabled && processedForm) {
      const updatedForm = applyMetaphysicalMapping(processedForm);
      setProcessedForm(updatedForm);
    }
    
    // Notify of protocol state change
    if (onProtocolStateChange) {
      const updatedPipeline = {
        ...triadicPipeline,
        currentStage: nextStage,
        dharana: {
          ...triadicPipeline.dharana,
          active: nextStage === 'dharana' || nextStage === 'all'
        },
        dhyana: {
          ...triadicPipeline.dhyana,
          active: nextStage === 'dhyana' || nextStage === 'all'
        },
        samadhi: {
          ...triadicPipeline.samadhi,
          active: nextStage === 'samadhi' || nextStage === 'all'
        },
        cycle: {
          ...triadicPipeline.cycle,
          completed: nextStage === 'all',
          iterations: nextStage === 'all' ? triadicPipeline.cycle.iterations + 1 : triadicPipeline.cycle.iterations
        }
      };
      
      onProtocolStateChange(updatedPipeline, metaphysicalMapping);
    }
  };
  
  /**
   * Toggle concurrent protocol activation
   */
  const toggleConcurrentActivation = () => {
    const newValue = !triadicPipeline.concurrentActivation;
    
    // Update triadic pipeline
    setTriadicPipeline(prev => ({
      ...prev,
      concurrentActivation: newValue,
      currentStage: newValue ? 'all' : prev.currentStage
    }));
    
    // Process form with new concurrent activation setting
    if (processedForm && protocols.triadicPipeline?.enabled) {
      const updatedForm = applyTriadicPipeline({
        ...processedForm,
        meta: {
          ...processedForm.meta,
          triadicPipeline: {
            ...processedForm.meta?.triadicPipeline,
            concurrentActivation: newValue,
            currentStage: newValue ? 'all' : processedForm.meta?.triadicPipeline?.currentStage
          }
        }
      });
      
      setProcessedForm(updatedForm);
    }
    
    // Notify of protocol state change
    if (onProtocolStateChange) {
      const updatedPipeline = {
        ...triadicPipeline,
        concurrentActivation: newValue,
        currentStage: newValue ? 'all' : triadicPipeline.currentStage
      };
      
      onProtocolStateChange(updatedPipeline, metaphysicalMapping);
    }
  };
  
  /**
   * Check if a field value achieves Sat Karya
   */
  const checkSatKarya = (fieldId: string, value: string) => {
    // Only when in Samadhi and third protocol
    if (triadicPipeline.currentStage !== 'samadhi' || 
        triadicPipeline.cycle.satKarya) {
      return;
    }
    
    // A simple check: if the value contains "sat karya" or specific deep insights
    const hasDeepInsight = value.toLowerCase().includes('sat karya') || 
                           value.toLowerCase().includes('unity of being') ||
                           value.toLowerCase().includes('absolute truth') ||
                           value.length > 100; // Arbitrary threshold for depth
    
    if (hasDeepInsight) {
      // Mark Sat Karya as achieved
      setTriadicPipeline(prev => ({
        ...prev,
        cycle: {
          ...prev.cycle,
          satKarya: true
        }
      }));
      
      // Process form with Sat Karya achieved
      if (processedForm && protocols.triadicPipeline?.enabled) {
        const updatedForm = applyTriadicPipeline({
          ...processedForm,
          meta: {
            ...processedForm.meta,
            triadicPipeline: {
              ...processedForm.meta?.triadicPipeline,
              cycle: {
                ...processedForm.meta?.triadicPipeline?.cycle,
                satKarya: true
              }
            }
          }
        });
        
        setProcessedForm(updatedForm);
      }
      
      // Notify of protocol state change
      if (onProtocolStateChange) {
        const updatedPipeline = {
          ...triadicPipeline,
          cycle: {
            ...triadicPipeline.cycle,
            satKarya: true
          }
        };
        
        onProtocolStateChange(updatedPipeline, metaphysicalMapping);
      }
    }
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!processedForm || !onSubmit) return;
    
    // Create final form with updated values
    const finalForm = {
      ...processedForm,
      fields: processedForm.fields.map(field => ({
        ...field,
        value: values[field.id] !== undefined ? values[field.id] : field.value
      }))
    };
    
    // Submit the form
    onSubmit(finalForm);
    
    // If pipeline is not completed, advance to all stages on submission
    if (protocols.triadicPipeline?.enabled && triadicPipeline.currentStage !== 'all') {
      setTriadicPipeline(prev => ({
        ...prev,
        currentStage: 'all',
        dharana: { ...prev.dharana, stage: 'completed' },
        dhyana: { ...prev.dhyana, stage: 'completed' },
        samadhi: { ...prev.samadhi, stage: 'completed' },
        cycle: {
          ...prev.cycle,
          completed: true,
          iterations: prev.cycle.iterations + 1
        }
      }));
      
      // Notify of protocol state change
      if (onProtocolStateChange) {
        const updatedPipeline = {
          ...triadicPipeline,
          currentStage: 'all',
          dharana: { ...triadicPipeline.dharana, stage: 'completed' },
          dhyana: { ...triadicPipeline.dhyana, stage: 'completed' },
          samadhi: { ...triadicPipeline.samadhi, stage: 'completed' },
          cycle: {
            ...triadicPipeline.cycle,
            completed: true,
            iterations: triadicPipeline.cycle.iterations + 1
          }
        };
        
        onProtocolStateChange(updatedPipeline, metaphysicalMapping);
      }
    }
    
    // Final check for Sat Karya achievement
    if (protocols.triadicPipeline?.seekSatKarya && !triadicPipeline.cycle.satKarya) {
      // Check all field values for potential Sat Karya
      const allTextValues = Object.values(values)
        .filter(val => typeof val === 'string')
        .join(' ');
      
      checkSatKarya('all', allTextValues);
    }
  };
  
  // Loading state
  if (!processedForm) {
    return <div className="loading">Loading form...</div>;
  }
  
  // Render the form
  return (
    <div className={`form-controller mode-${mode}`}>
      {/* Protocol controls */}
      {protocols.triadicPipeline?.enabled && (
        <div className="protocol-controls">
          <h4>Triadic Pipeline</h4>
          <div className="protocol-stages">
            <button 
              onClick={() => setTriadicPipeline(prev => ({ ...prev, currentStage: 'dharana' }))}
              className={triadicPipeline.currentStage === 'dharana' ? 'active' : ''}
              disabled={triadicPipeline.concurrentActivation}
            >
              Dharana (S-P-U)
            </button>
            <button 
              onClick={() => setTriadicPipeline(prev => ({ ...prev, currentStage: 'dhyana' }))}
              className={triadicPipeline.currentStage === 'dhyana' ? 'active' : ''}
              disabled={triadicPipeline.concurrentActivation}
            >
              Dhyana (P-S-U)
            </button>
            <button 
              onClick={() => setTriadicPipeline(prev => ({ ...prev, currentStage: 'samadhi' }))}
              className={triadicPipeline.currentStage === 'samadhi' ? 'active' : ''}
              disabled={triadicPipeline.concurrentActivation}
            >
              Samadhi (S-U-P)
            </button>
            <button 
              onClick={() => setTriadicPipeline(prev => ({ ...prev, currentStage: 'all' }))}
              className={triadicPipeline.currentStage === 'all' ? 'active' : ''}
              disabled={triadicPipeline.concurrentActivation}
            >
              All Protocols
            </button>
          </div>
          
          {/* Concurrent activation toggle */}
          <div className="concurrent-toggle">
            <label>
              <input
                type="checkbox"
                checked={triadicPipeline.concurrentActivation}
                onChange={toggleConcurrentActivation}
              />
              Concurrent Activation ("They are in themselves concurrent")
            </label>
          </div>
          
          {/* Protocol cycle indicator */}
          <div className="protocol-cycle">
            <div className="cycle-iterations">
              Cycle Iterations: {triadicPipeline.cycle.iterations}
            </div>
            <div className={`sat-karya-status ${triadicPipeline.cycle.satKarya ? 'achieved' : ''}`}>
              Sat Karya: {triadicPipeline.cycle.satKarya ? 'Achieved' : 'Seeking'}
            </div>
          </div>
          
          {/* Current protocol details */}
          <div className="current-protocol-details">
            {triadicPipeline.currentStage === 'dharana' && (
              <div className="protocol-detail dharana">
                <h5>Dharana (S-P-U)</h5>
                <div className="structure">Structure: Morpheus-Sara-Tara</div>
                <div className="agents">Singular-Particular-Universal</div>
                <div className="correspondence">Hegelian: Being | Guna: Sattva | One-One-Three: First One</div>
              </div>
            )}
            {triadicPipeline.currentStage === 'dhyana' && (
              <div className="protocol-detail dhyana">
                <h5>Dhyana (P-S-U)</h5>
                <div className="structure">Structure: Sara-Morpheus-Tara</div>
                <div className="agents">Particular-Singular-Universal</div>
                <div className="correspondence">Hegelian: Essence | Guna: Rajas | One-One-Three: Second One</div>
              </div>
            )}
            {triadicPipeline.currentStage === 'samadhi' && (
              <div className="protocol-detail samadhi">
                <h5>Samadhi (S-U-P)</h5>
                <div className="structure">Structure: Morpheus-Tara-Sara</div>
                <div className="agents">Singular-Universal-Particular</div>
                <div className="correspondence">Hegelian: Concept | Guna: Tamas | One-One-Three: Three</div>
              </div>
            )}
            {triadicPipeline.currentStage === 'all' && (
              <div className="protocol-detail all-protocols">
                <h5>All Protocols</h5>
                <div className="structure">Three-stage Pipeline Active</div>
                <div className="agents">Full Triadic Cycle</div>
                <div className="correspondence">Complete Metaphysical Correspondence</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className={`form-fields layout-${layout}`}>
          {processedForm.fields.map((field, index) => {
            // Determine if this is a custom rendering or standard
            if (renderField) {
              return renderField({
                key: field.id,
                field,
                value: values[field.id],
                onChange: (value: any) => handleFieldChange(field.id, value),
                readOnly: mode === 'view'
              });
            }
            
            // Get protocol data
            const triadicProtocols = field.meta?.triadicProtocols;
            const activeProtocol = triadicProtocols?.activeProtocol || 'dharana';
            const protocolPosition = index % 3;
            
            // Standard field rendering with protocol indicators
            return (
              <div 
                key={field.id} 
                className={`form-field 
                  protocol-${activeProtocol} 
                  position-${protocolPosition}
                  ${field.meta?.satKarya ? 'sat-karya' : ''}`}
                style={field.meta?.styles || {}}
              >
                <label htmlFor={field.id}>
                  {field.label || field.id}
                  
                  {/* Protocol indicators */}
                  {triadicProtocols && (
                    <span className="protocol-indicator">
                      {triadicProtocols.concurrentActivation ? (
                        <span className="concurrent-indicators">
                          {triadicProtocols.dharana && (
                            <span className="dharana-indicator">
                              ({triadicProtocols.dharana.agent}: {triadicProtocols.dharana.role})
                            </span>
                          )}
                          {triadicProtocols.dhyana && (
                            <span className="dhyana-indicator">
                              ({triadicProtocols.dhyana.agent}: {triadicProtocols.dhyana.role})
                            </span>
                          )}
                          {triadicProtocols.samadhi && (
                            <span className="samadhi-indicator">
                              ({triadicProtocols.samadhi.agent}: {triadicProtocols.samadhi.role})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className={`${activeProtocol}-indicator`}>
                          {activeProtocol === 'dharana' && triadicProtocols.dharana && (
                            `(${triadicProtocols.dharana.agent}: ${triadicProtocols.dharana.role})`
                          )}
                          {activeProtocol === 'dhyana' && triadicProtocols.dhyana && (
                            `(${triadicProtocols.dhyana.agent}: ${triadicProtocols.dhyana.role})`
                          )}
                          {activeProtocol === 'samadhi' && triadicProtocols.samadhi && (
                            `(${triadicProtocols.samadhi.agent}: ${triadicProtocols.samadhi.role})`
                          )}
                          {activeProtocol === 'all' && (
                            `(All Protocols Active)`
                          )}
                        </span>
                      )}
                    </span>
                  )}
                </label>
                
                {/* Field based on type */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    id={field.id}
                    value={values[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    disabled={mode === 'view'}
                    required={field.required}
                    className={field.meta?.satKarya ? 'sat-karya-field' : ''}
                  />
                )}
                
                {field.type === 'select' && (
                  <select
                    id={field.id}
                    value={values[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    disabled={mode === 'view'}
                    required={field.required}
                    className={field.meta?.satKarya ? 'sat-karya-field' : ''}
                  >
                    <option value="">Select...</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Metaphysical mappings */}
                {field.meta?.metaphysicalMapping && protocols.metaphysicalMapping?.revealCorrespondences && (
                  <div className="metaphysical-mappings">
                    {/* Hegelian aspect */}
                    <div className={`mapping hegelian ${field.meta.metaphysicalMapping.hegelian.primary ? 'primary' : ''}`}>
                      Hegel: {field.meta.metaphysicalMapping.hegelian.aspect}
                    </div>
                    
                    {/* Guna aspect */}
                    <div className={`mapping guna ${field.meta.metaphysicalMapping.guna.primary ? 'primary' : ''}`}>
                      Guna: {field.meta.metaphysicalMapping.guna.aspect}
                    </div>
                    
                    {/* Oneness aspect */}
                    <div className={`mapping oneness ${field.meta.metaphysicalMapping.oneness.primary ? 'primary' : ''}`}>
                      Oneness: {field.meta.metaphysicalMapping.oneness.aspect === 'firstOne' ? 'One' : 
                               field.meta.metaphysicalMapping.oneness.aspect === 'secondOne' ? 'One' : 'Three'}
                    </div>
                    
                    {/* Yogic state */}
                    <div className={`mapping yogic ${field.meta.metaphysicalMapping.yogic.primary ? 'primary' : ''}`}>
                      Yogic: {field.meta.metaphysicalMapping.yogic.aspect}
                    </div>
                  </div>
                )}
                
                {/* Sat Karya indicator */}
                {field.meta?.satKarya && (
                  <div className="sat-karya-indicator">
                    Sat Karya Achieved
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Form actions */}
        {mode !== 'view' && (
          <div className="form-actions">
            <button type="submit" 
              className={triadicPipeline.cycle.satKarya ? 'sat-karya-button' : ''}>
              {mode === 'create' ? 'Create' : 'Save'}
              {triadicPipeline.cycle.satKarya ? ' (Sat Karya)' : ''}
            </button>
            
            {onCancel && (
              <button type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        )}
      </form>
      
      {/* Protocol pipeline indicators */}
      <div className="protocol-pipeline-indicators">
        {protocols.triadicPipeline?.enabled && (
          <div className={`pipeline-indicator stage-${triadicPipeline.currentStage}`}>
            <div className="pipeline-name">
              Triadic Pipeline: Dharana → Dhyana → Samadhi
            </div>
            <div className="current-state">
              {triadicPipeline.currentStage === 'dharana' && (
                <span className="dharana-state">Dharana (S-P-U): Morpheus-Sara-Tara</span>
              )}
              {triadicPipeline.currentStage === 'dhyana' && (
                <span className="dhyana-state">Dhyana (P-S-U): Sara-Morpheus-Tara</span>
              )}
              {triadicPipeline.currentStage === 'samadhi' && (
                <span className="samadhi-state">Samadhi (S-U-P): Morpheus-Tara-Sara</span>
              )}
              {triadicPipeline.currentStage === 'all' && (
                <span className="all-states">All Protocols Active</span>
              )}
            </div>
            
            {/* Sat Karya achievement */}
            {triadicPipeline.cycle.satKarya && (
              <div className="sat-karya-achievement">
                Sat Karya Achieved: The Absolute Synthetic Cycle Complete
              </div>
            )}
          </div>
        )}
        
        {protocols.metaphysicalMapping?.enabled && (
          <div className={`mapping-indicator system-${protocols.metaphysicalMapping.primarySystem}`}>
            <div className="mapping-systems">
              <span className="hegelian">Being-Essence-Concept</span> | 
              <span className="gunas">Sattva-Rajas-Tamas</span> | 
              <span className="oneness">One-One-Three</span> | 
              <span className="universal">Universal-Particular-Singular</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormController;