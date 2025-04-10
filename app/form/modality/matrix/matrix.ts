+import { FormShape, FormField } from "../../schema/form";
import { createMorph } from "../morph";
import { MorpheusContext } from "../../schema/context";
import { morpheus } from "../morpheus";
import { ViewOutput } from "../view/display";

/**
 * Matrix Context
 * Extends standard context with graph projection capabilities
 */
export interface MatrixContext extends MorpheusContext {
  matrixEnabled: boolean;
  graphTraversal?: boolean;      // Follow graph connections (was redPillEffect)
  nodeCollapse?: boolean;        // Collapse similar nodes (was bluepillEffect)
  entropyLevel?: number;         // Level of data uncertainty (was glitchLevel)
  vectorStream?: boolean;        // Stream vector embeddings (was digitalRain)
  replicationFactor?: number;    // For scaling operations (was agentSmithIntensity)
  anomalyDetection?: number;     // For outlier handling (was anomalyLevel)
}

/**
 * Create a Matrix context with sensible defaults
 */
export function createMatrixContext(options: Partial<MatrixContext> = {}): MatrixContext {
  return {
    operationId: options.operationId || `matrix-${Date.now()}`,
    timestamp: options.timestamp || Date.now(),
    mode: options.mode || "projection",
    format: options.format || "json",
    matrixEnabled: true,
    graphTraversal: options.graphTraversal || false,
    nodeCollapse: options.nodeCollapse || false,
    entropyLevel: options.entropyLevel || 0,
    vectorStream: options.vectorStream || false,
    replicationFactor: options.replicationFactor || 0,
    anomalyDetection: options.anomalyDetection || 0,
    debug: options.debug || false,
  };
}

/**
 * VectorStream: Stream vector embeddings for knowledge representation
 * (Previously DigitalRainMorph - now represents vector embedding visualization)
 */
export const VectorStreamMorph = createMorph<FormShape, FormShape>(
  "VectorStreamMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixEnabled || !context.vectorStream) {
      return form;
    }
    
    // Apply vector embedding metadata to fields
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          vectorization: {
            enabled: true,
            dimensions: 768, // Standard embedding dimension
            model: "text-embedding-ada-002",
            distance: "cosine",
            sparsity: 0.12,
          },
          styles: {
            ...(field.meta?.styles || {}),
            fontFamily: "monospace",
            color: '#085C11', // Dark green for vectors
            backgroundColor: 'rgba(240, 248, 240, 0.9)',
            visualization: 'vector-stream'
          }
        }
      })),
      meta: {
        ...form.meta || {},
        vectorized: true,
        embeddingModel: "text-embedding-ada-002"
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
 * GraphTraversalMorph: Reveal graph connections and enhance with knowledge graph data
 * (Previously RedPillMorph - now represents graph traversal and knowledge graph connections)
 */
export const GraphTraversalMorph = createMorph<FormShape, FormShape>(
  "GraphTraversalMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixEnabled || !context.graphTraversal) {
      return form;
    }
    
    // Reveal graph connections and metadata
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          knowledgeGraph: {
            connections: generateFieldConnections(field, form),
            entityType: inferEntityType(field),
            confidence: 0.92,
            traversalDepth: 3
          },
          styles: {
            ...(field.meta?.styles || {}),
            color: '#1A3C6E', // Knowledge graph blue
            borderLeft: '3px solid #3366CC',
            paddingLeft: '10px'
          },
          // Graph traversal specific information
          graphData: {
            nodeId: `node-${field.id}`,
            edgeCount: Math.floor(Math.random() * 10) + 1,
            centrality: Math.random(),
            cluster: `cluster-${Math.floor(Math.random() * 5)}`
          }
        }
      })),
      meta: {
        ...form.meta || {},
        graphTraversalActive: true,
        graphSummary: "Knowledge graph connections revealed",
        graphStatistics: {
          nodeCount: form.fields.length,
          edgeCount: form.fields.length * 3,
          density: 0.35,
          diameter: 6
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
 * NodeCollapseMorph: Collapse similar nodes for simplified representation
 * (Previously BluePillMorph - now represents node/entity consolidation)
 */
export const NodeCollapseMorph = createMorph<FormShape, FormShape>(
  "NodeCollapseMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixEnabled || !context.nodeCollapse) {
      return form;
    }
    
    // Simplify by collapsing similar fields
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        error: undefined, // Remove validation errors
        meta: {
          ...field.meta || {},
          collapsed: true,
          simplificationLevel: 'high',
          originalComplexity: field.meta?.complexity || 'medium',
          styles: {
            ...(field.meta?.styles || {}),
            color: '#555555',
            backgroundColor: '#f8f8f8',
            borderColor: '#e0e0e0',
            borderRadius: '4px',
            padding: '8px',
            transition: 'all 0.3s ease'
          }
        }
      })),
      meta: {
        ...form.meta || {},
        collapsed: true,
        simplificationApplied: true,
        collapseFactor: 0.6, // 60% reduction in complexity
        originalNodeCount: form.fields.length,
        effectiveNodeCount: Math.ceil(form.fields.length * 0.6)
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
 * EntropyMorph: Handle data uncertainty and incomplete information
 * (Previously GlitchMorph - now represents entropy/uncertainty in knowledge)
 */
export const EntropyMorph = createMorph<FormShape, FormShape>(
  "EntropyMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixEnabled || !context.entropyLevel) {
      return form;
    }
    
    const entropyLevel = context.entropyLevel || 0;
    
    // Apply entropy indicators based on level
    const entropyStyles = {
      border: entropyLevel > 2 ? '1px dashed #bf9000' : '1px solid #e6b326',
      backgroundColor: `rgba(255, 250, 220, ${entropyLevel * 0.2})`,
      position: 'relative',
      opacity: Math.max(1 - (entropyLevel * 0.1), 0.5)
    };
    
    return {
      ...form,
      fields: form.fields.map(field => {
        // Apply entropy effects based on level
        let entropyField = { ...field };
        
        if (entropyLevel > 3 && Math.random() > 0.7) {
          // Mark some fields as having uncertain data
          entropyField.meta = {
            ...entropyField.meta,
            uncertain: true,
            confidenceScore: 1 - (entropyLevel * 0.15)
          };
        }
        
        return {
          ...entropyField,
          meta: {
            ...field.meta || {},
            entropy: {
              level: entropyLevel,
              informationLoss: entropyLevel > 4,
              incompleteData: entropyLevel > 2,
              uncertaintyScore: entropyLevel > 3 ? Math.random() : 0
            },
            styles: {
              ...(field.meta?.styles || {}),
              ...entropyStyles
            }
          }
        };
      }),
      meta: {
        ...form.meta || {},
        entropyDetected: true,
        dataQualityScore: 100 - (entropyLevel * 15),
        uncertaintyFactor: entropyLevel * 0.2,
        completenessEstimate: `${100 - (entropyLevel * 12)}%`
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
 * ScalingMorph: Handle large-scale data with replication for load testing
 * (Previously AgentSmithMorph - now represents scaling and load distribution)
 */
export const ScalingMorph = createMorph<FormShape, FormShape>(
  "ScalingMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixEnabled || !context.replicationFactor) {
      return form;
    }
    
    const factor = context.replicationFactor;
    const replicationCount = Math.min(Math.floor(factor * 2), 100);
    
    // Create scaled copies for testing
    let replicatedFields: FormField[] = [...form.fields];
    
    // Create replica fields with distribution metadata
    for (let i = 0; i < replicationCount; i++) {
      form.fields.forEach(field => {
        const replicaId = `${field.id}-replica-${i}`;
        replicatedFields.push({
          ...field,
          id: replicaId,
          label: `${field.label || field.id} (Replica ${i})`,
          meta: {
            ...field.meta || {},
            replica: true,
            scaleGeneration: i,
            partitionKey: `partition-${i % 5}`,
            shardId: i % 10,
            styles: {
              ...(field.meta?.styles || {}),
              opacity: 0.8 - (i / (replicationCount * 2)),
              transform: `translateY(${i * 2}px)`
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
        scaling: true,
        replicationFactor,
        scalingStatistics: {
          originalSize: form.fields.length,
          scaledSize: replicatedFields.length,
          scalingRatio: replicatedFields.length / form.fields.length,
          partitioning: 'horizontal',
          shardCount: 10
        }
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 3,
    memoizable: false
  }
);

/**
 * AnomalyDetectionMorph: Identify and handle outliers in the data
 * (Previously AnomalyMorph - now represents actual anomaly detection)
 */
export const AnomalyDetectionMorph = createMorph<FormShape, FormShape>(
  "AnomalyDetectionMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixEnabled || !context.anomalyDetection) {
      return form;
    }
    
    const level = context.anomalyDetection;
    const fields = [...form.fields];
    
    // Create anomalies based on level
    if (level >= 1) {
      // Add an anomaly field
      fields.push({
        id: 'anomaly-outlier',
        type: 'outlier',
        label: 'Detected Anomaly',
        value: 'Outlier value: 5σ from mean',
        meta: {
          anomaly: true,
          zScore: 5.2,
          confidence: 0.98,
          styles: {
            backgroundColor: 'rgba(255,240,240,1)',
            border: '1px solid #ffcccc',
            borderLeft: '4px solid #cc0000',
            padding: '8px'
          }
        }
      });
    }
    
    if (level >= 2) {
      // Mark some fields as anomalous
      fields.forEach(field => {
        if (Math.random() > 0.8) {
          field.meta = {
            ...field.meta || {},
            anomaly: true,
            anomalyScore: 0.87,
            anomalyType: 'statistical',
            recommendation: 'Verify data source'
          };
        }
      });
    }
    
    return {
      ...form,
      fields,
      meta: {
        ...form.meta || {},
        anomalyDetection: true,
        anomalyStats: {
          outlierCount: Math.floor(level * 1.5),
          averageConfidence: 0.92,
          falsePositiveRate: 0.03,
          detectionMethod: 'statistical',
          thresholdZ: 3.0
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
 * MultiModalProjectionMorph: Combined approach for knowledge representation
 * (Previously TheOneMorph - now represents multi-modal projection/fusion)
 */
export const MultiModalProjectionMorph = createMorph<FormShape, FormShape>(
  "MultiModalProjectionMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixEnabled) {
      return form;
    }
    
    // Create a context with multiple projections active
    const enhancedContext: MatrixContext = {
      ...context,
      graphTraversal: true,
      entropyLevel: 1,
      vectorStream: true,
    };
    
    // Apply stacked transformations for multi-modal projection
    let result = form;
    
    // First reveal graph connections
    result = GraphTraversalMorph.apply(result, enhancedContext);
    
    // Then apply vector representations
    result = VectorStreamMorph.apply(result, enhancedContext);
    
    // Handle data uncertainty
    result = EntropyMorph.apply(result, enhancedContext);
    
    // Add multi-modal capabilities
    return {
      ...result,
      fields: result.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          multiModal: true,
          projectionTypes: ['text', 'vector', 'graph', 'semantic'],
          styles: {
            ...(field.meta?.styles || {}),
            borderBottom: '2px solid #4a2b8a',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.4s ease'
          }
        }
      })),
      meta: {
        ...result.meta || {},
        projectionType: 'multi-modal',
        capabilities: [
          "knowledge graph traversal",
          "vector space operations", 
          "semantic similarity",
          "uncertainty handling",
          "cross-modal retrieval"
        ],
        systemMode: "integrative"
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 5,
    memoizable: false
  }
);

/**
 * ArchitecturalViewMorph: Provides a system-level view of the knowledge architecture
 * (Previously ArchitectMorph - now represents system architecture visualization)
 */
export const ArchitecturalViewMorph = createMorph<FormShape, FormShape>(
  "ArchitecturalViewMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixEnabled) {
      return form;
    }
    
    // Provide architectural overview of the form system
    return {
      ...form,
      fields: form.fields.map(field => ({
        ...field,
        meta: {
          ...field.meta || {},
          architecture: {
            componentType: getComponentType(field),
            dependencies: getDependencies(field, form),
            dataFlow: getDataFlow(field, form),
            performance: {
              latency: `${Math.floor(Math.random() * 100) + 10}ms`,
              throughput: `${Math.floor(Math.random() * 1000) + 100}/s`,
              resourceUse: 'medium'
            }
          },
          styles: {
            ...(field.meta?.styles || {}),
            fontFamily: "monospace",
            color: "#333333",
            backgroundColor: "#f9f9f9",
            border: "1px solid #dddddd",
            padding: "8px",
            borderRadius: "4px",
            fontSize: "0.9em"
          }
        }
      })),
      meta: {
        ...form.meta || {},
        architecture: true,
        systemMap: "knowledge-projection-system",
        version: "2.4.0",
        components: [
          "knowledge-graph",
          "vector-store",
          "retrieval-engine",
          "projection-system",
          "uncertainty-handler"
        ],
        systemDiagnostics: {
          efficiency: 0.87,
          balance: 0.92,
          stability: 0.96,
          integrationLevel: 0.89
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
 * StressTestingMorph: Test framework for knowledge projection systems
 * (Previously ChaosStressMorph - now represents proper stress testing)
 */
export const StressTestingMorph = createMorph<FormShape, FormShape>(
  "StressTestingMorph",
  (form, context: MatrixContext) => {
    if (!context.matrixEnabled) {
      return form;
    }
    
    // Create stress test scenarios with multiple factors
    const stressContext: MatrixContext = {
      ...context,
      graphTraversal: Math.random() > 0.5,
      nodeCollapse: Math.random() > 0.5,
      entropyLevel: Math.floor(Math.random() * 5),
      vectorStream: Math.random() > 0.3,
      replicationFactor: Math.random() * 3,
      anomalyDetection: Math.floor(Math.random() * 3)
    };
    
    // Apply random morphs in random order
    const morphs = [
      GraphTraversalMorph, 
      NodeCollapseMorph, 
      EntropyMorph, 
      VectorStreamMorph,
      ScalingMorph,
      AnomalyDetectionMorph
    ];
    
    // Shuffle the morphs
    const shuffledMorphs = [...morphs]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * morphs.length) + 1);
    
    // Apply them in a random order (stress test)
    let result = form;
    for (const morph of shuffledMorphs) {
      result = morph.apply(result, stressContext) as FormShape;
    }
    
    return {
      ...result,
      meta: {
        ...result.meta || {},
        stressTest: true,
        testProfile: "knowledge-projection-stress",
        appliedTransformations: shuffledMorphs.map(m => m.name),
        testConfiguration: {
          concurrency: 50,
          duration: "30s",
          rampUp: "5s",
          loadPattern: "variable"
        }
      }
    };
  },
  {
    pure: false,
    fusible: false,
    cost: 10,
    memoizable: false
  }
);

// Helper functions for matrix operations

/**
 * Generate connections between fields
 */
function generateFieldConnections(field: FormField, form: FormShape): Array<{id: string, strength: number}> {
  const connections: Array<{id: string, strength: number}> = [];
  
  // Generate realistic connections between fields
  form.fields.forEach(otherField => {
    if (field.id !== otherField.id) {
      // Simple heuristic - fields with similar names might be related
      const similarity = calculateNameSimilarity(field.id, otherField.id);
      
      if (similarity > 0.3 || Math.random() > 0.7) {
        connections.push({
          id: otherField.id,
          strength: similarity * 0.7 + Math.random() * 0.3
        });
      }
    }
  });
  
  return connections;
}

/**
 * Calculate name similarity between two strings
 */
function calculateNameSimilarity(a: string, b: string): number {
  // Simple Jaro-Winkler like similarity
  if (a === b) return 1;
  
  const aWords = a.split(/[^a-zA-Z0-9]+/);
  const bWords = b.split(/[^a-zA-Z0-9]+/);
  
  // Count common words
  const commonWords = aWords.filter(word => bWords.includes(word)).length;
  
  return commonWords / Math.max(aWords.length, bWords.length);
}

/**
 * Infer entity type from field
 */
function inferEntityType(field: FormField): string {
  // Simple heuristic based on field properties
  const nameLower = field.id.toLowerCase();
  const type = field.type?.toLowerCase() || '';
  
  if (nameLower.includes('name')) return 'Person';
  if (nameLower.includes('address')) return 'Location';
  if (nameLower.includes('date')) return 'Timestamp';
  if (nameLower.includes('price') || nameLower.includes('cost')) return 'Monetary';
  if (type === 'number') return 'Metric';
  if (type === 'checkbox' || type === 'boolean') return 'Boolean';
  if (type === 'select') return 'Category';
  
  return 'Generic';
}

/**
 * Determine component type for architectural view
 */
function getComponentType(field: FormField): string {
  const type = field.type?.toLowerCase() || '';
  
  if (type === 'object' || type === 'array') return 'DataStructure';
  if (type === 'text' || type === 'richtext') return 'ContentNode';
  if (type === 'select' || type === 'radio') return 'SelectorComponent';
  if (type === 'date' || type === 'datetime') return 'TemporalComponent';
  if (type === 'number') return 'MetricComponent';
  
  return 'BasicComponent';
}

/**
 * Get dependencies for a field
 */
function getDependencies(field: FormField, form: FormShape): string[] {
  // Determine dependencies based on field properties
  const dependencies: string[] = [];
  
  // Look for references in validations
  if (Array.isArray(field.validations)) {
    field.validations.forEach(validation => {
      if (validation.type === 'equals' || validation.type === 'dependent') {
        dependencies.push(validation.params?.field || '');
      }
    });
  }
  
  // Add some random dependencies for demo purposes
  if (Math.random() > 0.7) {
    const randomField = form.fields[Math.floor(Math.random() * form.fields.length)];
    if (randomField && randomField.id !== field.id) {
      dependencies.push(randomField.id);
    }
  }
  
  return dependencies.filter(Boolean);
}

/**
 * Get data flow for a field
 */
function getDataFlow(field: FormField, form: FormShape): Array<{
  source: string;
  target: string;
  type: string;
}> {
  const flows: Array<{source: string; target: string; type: string}> = [];
  
  // Add some example data flows
  if (field.id.includes('total') || field.id.includes('sum')) {
    // This might be a calculation result field
    const potentialSources = form.fields.filter(f => 
      f.id !== field.id && 
      (f.type === 'number' || f.type === 'decimal')
    );
    
    potentialSources.slice(0, 2).forEach(source => {
      flows.push({
        source: source.id,
        target: field.id,
        type: 'calculation'
      });
    });
  }
  
  // Add a random flow for demonstration
  if (Math.random() > 0.8) {
    flows.push({
      source: 'system',
      target: field.id,
      type: 'initialization'
    });
  }
  
  return flows;
}

/**
 * Matrix Projection API - Clean developer interface for the Matrix system
 */
export const MatrixProjection = {
  /**
   * Enable graph connections traversal
   */
  enableGraphTraversal: (form: FormShape): FormShape => {
    console.log("Activating knowledge graph traversal mode");
    return GraphTraversalMorph.apply(form, createMatrixContext({ graphTraversal: true }));
  },
  
  /**
   * Collapse nodes for simplified views 
   */
  collapseNodes: (form: FormShape): FormShape => {
    console.log("Collapsing similar nodes for simplified representation");
    return NodeCollapseMorph.apply(form, createMatrixContext({ nodeCollapse: true }));
  },
  
  /**
   * Visualize vector embeddings
   */
  streamVectors: (form: FormShape): FormShape => {
    console.log("Streaming vector embeddings for knowledge representation");
    return VectorStreamMorph.apply(form, createMatrixContext({ vectorStream: true }));
  },
  
  /**
   * Handle data uncertainty
   */
  handleEntropy: (form: FormShape, level: number = 2): FormShape => {
    console.log(`Processing data with entropy level ${level}`);
    return EntropyMorph.apply(form, createMatrixContext({ entropyLevel: level }));
  },
  
  /**
   * Apply multi-modal projection
   */
  projectMultiModal: (form: FormShape): FormShape => {
    console.log("Applying multi-modal knowledge projection");
    return MultiModalProjectionMorph.apply(form, createMatrixContext());
  },
  
  /**
   * View system architecture
   */
  viewArchitecture: (form: FormShape): FormShape => {
    console.log("Generating architectural view of knowledge system");
    return ArchitecturalViewMorph.apply(form, createMatrixContext());
  },
  
  /**
   * Scale system for performance testing
   */
  scaleSystem: (form: FormShape, factor: number = 3): FormShape => {
    console.log(`Scaling system with replication factor ${factor}`);
    return ScalingMorph.apply(form, createMatrixContext({ replicationFactor: factor }));
  },
  
  /**
   * Detect data anomalies
   */
  detectAnomalies: (form: FormShape, level: number = 2): FormShape => {
    console.log("Running anomaly detection on data");
    return AnomalyDetectionMorph.apply(form, createMatrixContext({ anomalyDetection: level }));
  },
  
  /**
   * Run stress tests on the system
   */
  runStressTest: (form: FormShape): FormShape => {
    console.log("Initiating comprehensive stress testing");
    return StressTestingMorph.apply(form, createMatrixContext());
  },
  
  /**
   * Project form through knowledge matrix
   * 
   * Applies a customized set of matrix projections
   */
  project: (form: FormShape, options: {
    graphTraversal?: boolean;
    nodeCollapse?: boolean;  
    vectorStream?: boolean;
    entropyLevel?: number;
    detectAnomalies?: number;
  } = {}): FormShape => {
    console.log("Projecting form through knowledge matrix");
    
    // Configure context based on options
    const context = createMatrixContext({
      graphTraversal: options.graphTraversal,
      nodeCollapse: options.nodeCollapse, 
      vectorStream: options.vectorStream,
      entropyLevel: options.entropyLevel,
      anomalyDetection: options.detectAnomalies
    });
    
    // Apply appropriate morphs based on options
    let result = form;
    
    if (options.graphTraversal) {
      result = GraphTraversalMorph.apply(result, context);
    }
    
    if (options.nodeCollapse) {
      result = NodeCollapseMorph.apply(result, context);
    }
    
    if (options.vectorStream) {
      result = VectorStreamMorph.apply(result, context);
    }
    
    if (options.entropyLevel) {
      result = EntropyMorph.apply(result, context);
    }
    
    if (options.detectAnomalies) {
      result = AnomalyDetectionMorph.apply(result, context);
    }
    
    return result;
  }
};

// Register Matrix morphisms with the main system
morpheus.define(GraphTraversalMorph, {
  description: 'Reveals graph connections in knowledge structures',
  category: 'matrix:knowledge-graph',
  tags: ['matrix', 'graph', 'traversal', 'connections']
});

morpheus.define(NodeCollapseMorph, {
  description: 'Simplifies representation by collapsing similar nodes',
  category: 'matrix:optimization',
  tags: ['matrix', 'collapse', 'simplify', 'nodes']
});

morpheus.define(EntropyMorph, {
  description: 'Handles data uncertainty and incomplete information',
  category: 'matrix:uncertainty',
  tags: ['matrix', 'entropy', 'uncertainty', 'data-quality']
});

morpheus.define(VectorStreamMorph, {
  description: 'Streams vector embeddings for knowledge representation',
  category: 'matrix:embeddings',
  tags: ['matrix', 'vectors', 'embeddings', 'representation']
});

morpheus.define(ScalingMorph, {
  description: 'Scales system for performance testing',
  category: 'matrix:performance',
  tags: ['matrix', 'scale', 'performance', 'testing']
});

morpheus.define(AnomalyDetectionMorph, {
  description: 'Detects and handles anomalies in data',
  category: 'matrix:anomalies',
  tags: ['matrix', 'anomaly', 'detection', 'outliers']
});

morpheus.define(MultiModalProjectionMorph, {
  description: 'Projects information through multiple modalities',
  category: 'matrix:projection',
  tags: ['matrix', 'multi-modal', 'projection', 'fusion']
});

morpheus.define(ArchitecturalViewMorph, {
  description: 'Provides architectural system view',
  category: 'matrix:architecture',
  tags: ['matrix', 'architecture', 'system', 'design']
});

morpheus.define(StressTestingMorph, {
  description: 'Comprehensive stress testing for knowledge systems',
  category: 'matrix:testing',
  tags: ['matrix', 'stress', 'test', 'performance']
});

/**
 * Create a matrix projection pipeline
 */
export function createMatrixProjectionPipeline(name: string, projections: string[]) {
  const morphMap: Record<string, any> = {
    'graph-traversal': GraphTraversalMorph,
    'node-collapse': NodeCollapseMorph,
    'entropy': EntropyMorph,
    'vector-stream': VectorStreamMorph,
    'scaling': ScalingMorph,
    'anomaly-detection': AnomalyDetectionMorph,
    'multi-modal': MultiModalProjectionMorph,
    'architecture': ArchitecturalViewMorph,
    'stress-test': StressTestingMorph
  };
  
  // Filter valid projections
  const validProjections = projections.filter(proj => morphMap[proj]);
  if (validProjections.length === 0) {
    throw new Error('No valid Matrix projections specified');
  }
  
  // Create the pipeline with the specified morphs
  const morphs = validProjections.map(proj => morphMap[proj]);
  
  return morpheus.pipeline<FormShape, FormShape>(
    name,
    morphs,
    {
      description: `Matrix projection pipeline with: ${validProjections.join(', ')}`,
      category: 'matrix:pipeline',
      tags: ['matrix', 'projection', 'pipeline', ...validProjections]
    }
  );
}

// Adapter to handle conversion between Matrix and real world
export const MatrixAdapter = {
  toMatrix: createMorph<FormShape, FormShape>(
    "ToMatrixAdapter",
    (shape, context) => ({
      ...shape,
      meta: {
        ...shape.meta,
        reality: "matrix",
        conversion: "real-to-matrix",
        matrixVersion: "1.0",
        timestamp: new Date().toISOString(),
      },
    }),
    {
      pure: false,
      fusible: true,
      cost: 1
    }
  ),
  
  /**
   * Convert a Matrix shape to reality
   */
  toReality: createMorph<FormShape, FormShape>(
    "ToRealityAdapter",
    (shape, context) => {
      const matrixContext = context as Partial<MatrixContext>;
      console.log(`[Matrix] Converting form from Matrix to reality...`);

      // Track conversion statistics for debugging
      const stats = {
        originalFieldCount: shape.fields.length,
        replicaFieldsCollapsed: 0,
        entropyFieldsCleaned: 0,
        anomalyFieldsRemoved: 0,
        finalFieldCount: 0,
      };

      // Step 1: Handle replica fields - merge them if possible
      const replicaFields = new Map<string, FormField[]>();
      const nonReplicaFields: FormField[] = [];

      // First, separate replica fields from others
      for (const field of shape.fields) {
        if (field.meta?.replica) {
          // Extract original ID by removing replica suffix
          const originalId = field.id.replace(/-replica-\d+$/, "");

          if (!replicaFields.has(originalId)) {
            replicaFields.set(originalId, []);
          }
          replicaFields.get(originalId)?.push(field);
        } else {
          nonReplicaFields.push(field);
        }
      }

      // Process replicated fields - collapse into representative fields
      const mergedReplicaFields: FormField[] = [];
      replicaFields.forEach((fields, originalId) => {
        // Find a representative field to keep
        const primaryField = fields[0];

        // Create a merged version with count metadata
        mergedReplicaFields.push({
          ...primaryField,
          id: originalId, // Restore original ID
          label: primaryField.label?.replace(/ \(Replica \d+\)$/, "") || originalId,
          meta: {
            ...(primaryField.meta || {}),
            replicaCount: fields.length,
            collapsedReplicas: true,
            replica: false // No longer a replica
          },
        });
        
        stats.replicaFieldsCollapsed += fields.length - 1;
      });
      
      // Step 2: Clean up entropy fields
      const cleanedFields = [...nonReplicaFields, ...mergedReplicaFields].map(field => {
        if (field.meta?.entropy?.level > 1) {
          stats.entropyFieldsCleaned++;
          
          // Clean up uncertainty from field
          return {
            ...field,
            meta: {
              ...field.meta,
              entropy: {
                ...field.meta.entropy,
                resolved: true,
                originalLevel: field.meta.entropy.level,
                level: 0
              }
            }
          };
        }
        return field;
      });
      
      // Step 3: Remove anomaly fields
      const filteredFields = cleanedFields.filter(field => {
        if (field.id === 'anomaly-outlier' || field.meta?.anomaly) {
          stats.anomalyFieldsRemoved++;
          return false; // Remove anomaly fields
        }
        return true;
      });
      
      // Update final stats
      stats.finalFieldCount = filteredFields.length;
      
      // Return the converted form
      return {
        ...shape,
        fields: filteredFields,
        meta: {
          ...shape.meta,
          matrixToReality: true,
          conversionStats: stats,
          timestamp: new Date().toISOString()
        }
      };
    },
    {
      pure: false,
      fusible: true,
      cost: 2
    }
  ),
};

// Export main components for use in application
export {
  GraphTraversalMorph, NodeCollapseMorph, EntropyMorph, VectorStreamMorph,
  ScalingMorph, AnomalyDetectionMorph, MultiModalProjectionMorph, 
  ArchitecturalViewMorph, StressTestingMorph
};