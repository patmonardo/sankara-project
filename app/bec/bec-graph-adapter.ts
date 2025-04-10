/**
 * BEC-Graph Adapter
 * 
 * Integrates the Being-Essence-Concept (BEC) system with NeoGraph
 * to support transformations between transcendental and ordinary forms.
 */

import { NeoGraph, NeoGraphNode, NeoGraphEdge } from '../neo/graph';
import { NeoProtocol } from '../neo/extension';
import { NeoNode, createNeoNode } from '@/neo/entity';
import { Property } from '@/neo/property';

// Import BEC components
import { createSyllogismSystem, Syllogism, SyllogismType, SyllogismOfNecessity } from './concept/syllogism';
import { JudgmentType } from './concept/judgment';
import { BECStructure, MVCStructure } from './bec-mvc-adapter';
import BECMVCAdapter from './bec-mvc-adapter';

/**
 * BEC Graph Adapter
 * 
 * Adapter for storing and retrieving BEC and MVC structures in Neo4j.
 * This connects the philosophical BEC structure to the practical MVC 
 * architecture in the graph database, enabling bidirectional queries.
 */
export class BECGraphAdapter {
  private graph: NeoGraph;
  private syllogismSystem = createSyllogismSystem();
  
  // Track node representations of BEC elements
  private syllogismNodes: Map<string, string> = new Map(); // syllogismId -> nodeId
  
  constructor(neoProtocol: NeoProtocol, graphSpaceId: string = "bec-graph") {
    this.graph = new NeoGraph(neoProtocol, graphSpaceId);
  }
  
  /**
   * Convert a BEC structure to Neo4j nodes and relationships
   * 
   * @param bec BEC structure
   * @returns Neo4j representation with nodes and relationships
   */
  becToGraph(bec: BECStructure): {
    nodes: NeoNode[];
    relationships: any[];
  } {
    // Create the Neo nodes for Being, Essence, and Concept
    const beingNode = createNeoNode({
      id: bec.being.id,
      type: 'Being',
      being: {
        quality: bec.being.quality || 'entity',
        determinate: bec.being.determinate,
        immediate: bec.being.immediate
      },
      essence: {
        reflective: false,
        mediated: false
      },
      concept: {
        universal: 'being',
        particular: 'quality',
        individual: bec.being.id
      },
      properties: {
        quality: bec.being.quality
      }
    });
    
    const essenceNode = createNeoNode({
      id: bec.essence.id,
      type: 'Essence',
      being: {
        quality: 'appearance',
        determinate: true,
        immediate: false
      },
      essence: {
        reflective: bec.essence.reflective,
        appearance: bec.essence.appearance || 'form',
        mediated: bec.essence.mediated
      },
      concept: {
        universal: 'essence',
        particular: 'reflection',
        individual: bec.essence.id
      },
      properties: {
        appearance: bec.essence.appearance
      }
    });
    
    const conceptNode = createNeoNode({
      id: bec.concept.id,
      type: 'Concept',
      being: {
        quality: 'concrete-universal',
        determinate: true,
        immediate: false
      },
      essence: {
        reflective: true,
        mediated: true
      },
      concept: {
        universal: bec.concept.universal || 'universal',
        particular: bec.concept.particular || 'particular',
        individual: bec.concept.individual || bec.concept.id
      },
      properties: {
        universal: bec.concept.universal,
        particular: bec.concept.particular,
        individual: bec.concept.individual
      }
    });
    
    // Create BEC Structure node that ties them together
    const becStructureNode = createNeoNode({
      id: `bec:${bec.being.id}:${bec.essence.id}:${bec.concept.id}`,
      type: 'BECStructure',
      being: {
        quality: 'structure',
        determinate: true,
        immediate: false
      },
      essence: {
        reflective: true,
        appearance: 'structure',
        mediated: true
      },
      concept: {
        universal: 'structure',
        particular: 'bec',
        individual: `bec:${bec.being.id}`
      },
      properties: {
        timestamp: Date.now()
      }
    });
    
    // Define relationships
    const relationships = [
      {
        from: becStructureNode.id,
        to: beingNode.id,
        type: 'HAS_BEING',
        properties: {}
      },
      {
        from: becStructureNode.id,
        to: essenceNode.id,
        type: 'HAS_ESSENCE',
        properties: {}
      },
      {
        from: becStructureNode.id,
        to: conceptNode.id,
        type: 'HAS_CONCEPT',
        properties: {}
      },
      {
        from: conceptNode.id,
        to: beingNode.id,
        type: 'CONTAINS',
        properties: { as: 'moment' }
      },
      {
        from: conceptNode.id,
        to: essenceNode.id,
        type: 'CONTAINS',
        properties: { as: 'moment' }
      }
    ];
    
    // Convert to MVC and add those nodes too
    const mvc = BECMVCAdapter.becToMvc(bec);
    const mvcGraph = this.mvcToGraph(mvc);
    
    // Create relationship between BEC and MVC
    const becToMvcRelationship = {
      from: becStructureNode.id,
      to: mvcGraph.nodes.find(n => n.type === 'MVCStructure')?.id,
      type: 'TRANSPILES_TO',
      properties: {
        direction: 'bec-to-mvc',
        timestamp: Date.now()
      }
    };
    
    return {
      nodes: [beingNode, essenceNode, conceptNode, becStructureNode, ...mvcGraph.nodes],
      relationships: [...relationships, ...mvcGraph.relationships, becToMvcRelationship]
    };
  }
  
  /**
   * Convert an MVC structure to Neo4j nodes and relationships
   * 
   * @param mvc MVC structure
   * @returns Neo4j representation with nodes and relationships
   */
  mvcToGraph(mvc: MVCStructure): {
    nodes: NeoNode[];
    relationships: any[];
  } {
    // Create the Neo nodes for Model, View, and Controller
    const modelNode = createNeoNode({
      id: mvc.model.id,
      type: 'Model',
      being: {
        quality: 'data',
        determinate: true,
        immediate: true
      },
      essence: {
        reflective: false,
        mediated: false
      },
      concept: {
        universal: 'data-model',
        particular: 'model',
        individual: mvc.model.id
      },
      properties: {
        name: mvc.model.name,
        ...mvc.model.properties
      }
    });
    
    const viewNode = createNeoNode({
      id: mvc.view.id,
      type: 'View',
      being: {
        quality: 'presentation',
        determinate: true,
        immediate: false
      },
      essence: {
        reflective: true,
        appearance: 'UI',
        mediated: true
      },
      concept: {
        universal: 'presentation',
        particular: 'view',
        individual: mvc.view.id
      },
      properties: {
        name: mvc.view.name,
        template: mvc.view.template
      }
    });
    
    const controllerNode = createNeoNode({
      id: mvc.controller.id,
      type: 'Controller',
      being: {
        quality: 'logic',
        determinate: true,
        immediate: false
      },
      essence: {
        reflective: true,
        mediated: true
      },
      concept: {
        universal: 'logic',
        particular: 'controller',
        individual: mvc.controller.id
      },
      properties: {
        name: mvc.controller.name,
        actions: mvc.controller.actions
      }
    });
    
    // Create MVC Structure node that ties them together
    const mvcStructureNode = createNeoNode({
      id: `mvc:${mvc.model.id}:${mvc.view.id}:${mvc.controller.id}`,
      type: 'MVCStructure',
      being: {
        quality: 'architecture',
        determinate: true,
        immediate: false
      },
      essence: {
        reflective: true,
        appearance: 'pattern',
        mediated: true
      },
      concept: {
        universal: 'architecture',
        particular: 'mvc',
        individual: `mvc:${mvc.model.id}`
      },
      properties: {
        timestamp: Date.now()
      }
    });
    
    // Define relationships
    const relationships = [
      {
        from: mvcStructureNode.id,
        to: modelNode.id,
        type: 'HAS_MODEL',
        properties: {}
      },
      {
        from: mvcStructureNode.id,
        to: viewNode.id,
        type: 'HAS_VIEW',
        properties: {}
      },
      {
        from: mvcStructureNode.id,
        to: controllerNode.id,
        type: 'HAS_CONTROLLER',
        properties: {}
      },
      {
        from: controllerNode.id,
        to: modelNode.id,
        type: 'MANIPULATES',
        properties: {}
      },
      {
        from: controllerNode.id,
        to: viewNode.id,
        type: 'UPDATES',
        properties: {}
      },
      {
        from: viewNode.id,
        to: modelNode.id,
        type: 'RENDERS',
        properties: {}
      }
    ];
    
    // If this is a direct MVC to BEC conversion, add that relationship
    const bec = BECMVCAdapter.mvcToBec(mvc);
    const becGraph = this.becToGraph(bec);
    
    // Create relationship between MVC and BEC
    const mvcToBecRelationship = {
      from: mvcStructureNode.id,
      to: becGraph.nodes.find(n => n.type === 'BECStructure')?.id,
      type: 'TRANSPILES_TO',
      properties: {
        direction: 'mvc-to-bec',
        timestamp: Date.now()
      }
    };
    
    return {
      nodes: [modelNode, viewNode, controllerNode, mvcStructureNode, ...becGraph.nodes],
      relationships: [...relationships, ...becGraph.relationships, mvcToBecRelationship]
    };
  }
  
  /**
   * Generate Cypher queries to store the BEC and MVC structures
   * 
   * @param bec BEC structure
   * @returns Cypher queries as string
   */
  generateBECCypher(bec: BECStructure): string {
    const graph = this.becToGraph(bec);
    
    // Create Cypher for nodes
    const nodeQueries = graph.nodes.map(node => {
      const props = Object.entries(node.properties || {})
        .filter(([k, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ');
        
      return `
      CREATE (${node.id.replace(/[^a-zA-Z0-9]/g, '_')}:${node.type} {
        id: '${node.id}',
        ${props}
      })`;
    }).join('\n');
    
    // Create Cypher for relationships
    const relQueries = graph.relationships.map(rel => {
      const props = Object.entries(rel.properties || {})
        .filter(([k, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ');
        
      return `
      MATCH (a), (b)
      WHERE a.id = '${rel.from}' AND b.id = '${rel.to}'
      CREATE (a)-[r:${rel.type} {${props}}]->(b)`;
    }).join('\n');
    
    return `// BEC Structure Cypher
    ${nodeQueries}
    
    // Relationships
    ${relQueries}`;
  }
  
  /**
   * Generate query to find BEC structures in Neo4j
   * 
   * @returns Cypher query to find BEC structures
   */
  findBECStructuresQuery(): string {
    return `
    // Find all BEC structures
    MATCH (bec:BECStructure)-[:HAS_BEING]->(being:Being),
          (bec)-[:HAS_ESSENCE]->(essence:Essence),
          (bec)-[:HAS_CONCEPT]->(concept:Concept)
    RETURN bec, being, essence, concept
    ORDER BY bec.timestamp DESC
    LIMIT 100`;
  }
  
  /**
   * Generate query to find dashboard structures
   * 
   * @returns Cypher query to find dashboard structures
   */
  findDashboardsQuery(): string {
    return `
    // Find all dashboards with their structures
    MATCH (d:Dashboard)
    OPTIONAL MATCH (d)-[:CONTAINS]->(s:DashboardSection)
    OPTIONAL MATCH (s)-[:CONTAINS]->(c:DashboardComponent)
    RETURN d, s, c
    ORDER BY d.timestamp DESC`;
  }
  
  /**
   * Generate query to find the relationship between BEC and MVC
   * 
   * @returns Cypher query for BEC-MVC relationship
   */
  findBECMVCRelationshipsQuery(): string {
    return `
    // Find reciprocating transpilations
    MATCH (bec:BECStructure)-[t:TRANSPILES_TO]->(mvc:MVCStructure),
          (mvc)-[t2:TRANSPILES_TO]->(bec)
    RETURN bec, mvc, t, t2`;
  }
  
  /**
   * Add a syllogism to the graph
   * 
   * @param syllogism The syllogism to add to the graph
   * @returns The ID of the created node
   */
  addSyllogism(syllogism: Syllogism): string {
    // Create a node representation of the syllogism
    const nodeId = this.graph.createNode({
      type: `syllogism:${syllogism.type}:${syllogism.subtype}`,
      properties: {
        syllogismId: syllogism.id,
        type: syllogism.type,
        subtype: syllogism.subtype,
        figure: syllogism.figure.name,
        structure: syllogism.figure.structure,
        majorPremiss: `${syllogism.premissMajor.termMinor.content} ${syllogism.premissMajor.copula} ${syllogism.premissMajor.termMajor.content}`,
        minorPremiss: `${syllogism.premissMinor.termMinor.content} ${syllogism.premissMinor.copula} ${syllogism.premissMinor.termMajor.content}`,
        conclusion: `${syllogism.conclusion.termMinor.content} ${syllogism.conclusion.copula} ${syllogism.conclusion.termMajor.content}`,
        necessity: syllogism.conclusion.necessity,
        bec: {
          being: syllogism.being,
          essence: syllogism.essence,
          concept: syllogism.concept
        }
      },
      metadata: {
        emergesFrom: syllogism.emergesFrom,
        pointsTowards: syllogism.pointsTowards,
        restoresConcept: syllogism.restoresConcept,
        created: Date.now()
      }
    });
    
    // Track the node representation
    this.syllogismNodes.set(syllogism.id, nodeId);
    
    // Create nodes for each term and connect them
    this.createTermNodes(syllogism, nodeId);
    
    // If this syllogism emerges from another, create the connection
    if (syllogism.emergesFrom && this.syllogismNodes.has(syllogism.emergesFrom)) {
      const sourceNodeId = this.syllogismNodes.get(syllogism.emergesFrom)!;
      this.graph.createEdge({
        source: sourceNodeId,
        target: nodeId,
        type: 'emerges-from',
        properties: {
          dialecticalMovement: 'forward',
          transformationType: 'necessary-development'
        }
      });
    }
    
    return nodeId;
  }
  
  /**
   * Create nodes for the terms in a syllogism and connect them
   */
  private createTermNodes(syllogism: Syllogism, syllogismNodeId: string): void {
    // Create nodes for each term
    const majorTermNodeId = this.graph.createNode({
      type: 'term:major',
      properties: {
        content: syllogism.premissMajor.termMajor.content,
        role: 'major',
        being: syllogism.premissMajor.termMajor.being,
        essence: syllogism.premissMajor.termMajor.essence,
        concept: syllogism.premissMajor.termMajor.concept
      }
    });
    
    const minorTermNodeId = this.graph.createNode({
      type: 'term:minor',
      properties: {
        content: syllogism.premissMinor.termMinor.content,
        role: 'minor',
        being: syllogism.premissMinor.termMinor.being,
        essence: syllogism.premissMinor.termMinor.essence,
        concept: syllogism.premissMinor.termMinor.concept
      }
    });
    
    const middleTermNodeId = this.graph.createNode({
      type: 'term:middle',
      properties: {
        content: syllogism.middleTerm.content,
        role: 'middle',
        being: syllogism.middleTerm.being,
        essence: syllogism.middleTerm.essence,
        concept: syllogism.middleTerm.concept
      }
    });
    
    // Connect terms to syllogism
    this.graph.createEdge({
      source: syllogismNodeId,
      target: majorTermNodeId,
      type: 'has-term',
      properties: { role: 'major' }
    });
    
    this.graph.createEdge({
      source: syllogismNodeId,
      target: minorTermNodeId,
      type: 'has-term',
      properties: { role: 'minor' }
    });
    
    this.graph.createEdge({
      source: syllogismNodeId,
      target: middleTermNodeId,
      type: 'has-term',
      properties: { role: 'middle' }
    });
  }
  
  /**
   * Generate a dialectical progression starting from an initial syllogism
   * and add the entire progression to the graph
   */
  addDialecticalProgression(initialSyllogism: Syllogism): string[] {
    const progression = [initialSyllogism];
    let current = initialSyllogism;
    const nodeIds = [];
    
    // First add the initial syllogism
    nodeIds.push(this.addSyllogism(initialSyllogism));
    
    // Develop through all forms
    while (current && current.pointsTowards && current.pointsTowards !== 'objectivity') {
      const next = this.syllogismSystem.developSyllogism(current);
      if (!next) break;
      
      progression.push(next);
      current = next;
      
      // Add the next syllogism to the graph
      nodeIds.push(this.addSyllogism(next));
    }
    
    return nodeIds;
  }
  
  /**
   * Transform a syllogism from transcendental to ordinary form
   * This maps the BEC structure to an MVC representation
   */
  transformToOrdinaryForm(syllogismId: string): NeoNode {
    const nodeId = this.syllogismNodes.get(syllogismId);
    if (!nodeId) {
      throw new Error(`Syllogism not found in graph: ${syllogismId}`);
    }
    
    const node = this.graph.getNode(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    
    // Extract syllogism properties
    const { type, subtype, majorPremiss, minorPremiss, conclusion, necessity, bec } = node.properties;
    
    // Transform to ordinary form (MVC structure)
    return createNeoNode({
      id: `ordinary:${syllogismId}`,
      type: `ordinary:${type}:${subtype}`,
      being: bec.being,
      essence: bec.essence,
      concept: bec.concept,
      properties: {
        // Model properties (data representation)
        model: {
          syllogismType: type,
          syllogismSubtype: subtype,
          majorPremiss,
          minorPremiss,
          conclusion,
          necessityLevel: necessity
        },
        // View properties (presentation)
        view: {
          displayName: `${type.charAt(0).toUpperCase() + type.slice(1)} Syllogism of ${subtype.charAt(0).toUpperCase() + subtype.slice(1)}`,
          representation: `${majorPremiss}; ${minorPremiss}; Therefore ${conclusion}`,
          necessityIndicator: this.getNecessityIndicator(necessity)
        },
        // Controller properties (behavior)
        controller: {
          canDevelop: node.metadata?.pointsTowards !== 'objectivity',
          nextForm: node.metadata?.pointsTowards,
          previousForm: node.metadata?.emergesFrom,
          transformations: [
            'develop',
            'revert',
            'analyze',
            'evaluate',
            'apply'
          ]
        }
      },
      metadata: node.metadata
    });
  }
  
  /**
   * Transform a syllogism from ordinary to transcendental form
   * This reconstructs the BEC structure from an MVC representation
   */
  transformToTranscendentalForm(ordinaryNode: NeoNode): Syllogism {
    const [_, type, subtype] = ordinaryNode.type.split(':');
    
    // Extract model properties
    const {
      majorPremiss,
      minorPremiss,
      conclusion,
      necessityLevel
    } = ordinaryNode.data.model;
    
    // Parse the premises and conclusion to extract terms
    const majorTerms = this.parseLogicalStatement(majorPremiss);
    const minorTerms = this.parseLogicalStatement(minorPremiss);
    const conclusionTerms = this.parseLogicalStatement(conclusion);
    
    // Recreate a syllogism based on the type
    let syllogism: Syllogism;
    
    if (type === 'existence') {
      if (subtype === 'first-figure') {
        syllogism = this.syllogismSystem.createSyllogism(
          'existence',
          'first-figure',
          [minorTerms.subject, majorTerms.subject, majorTerms.predicate]
        );
      } else if (subtype === 'second-figure') {
        syllogism = this.syllogismSystem.createSyllogism(
          'existence',
          'second-figure',
          [minorTerms.subject, majorTerms.subject, majorTerms.predicate]
        );
      } else {
        syllogism = this.syllogismSystem.createSyllogism(
          'existence',
          'third-figure',
          [minorTerms.subject, majorTerms.subject, majorTerms.predicate]
        );
      }
    } else if (type === 'reflection') {
      if (subtype === 'allness') {
        syllogism = this.syllogismSystem.createSyllogism(
          'reflection',
          'allness',
          [minorTerms.subject, majorTerms.subject, majorTerms.predicate]
        );
      } else if (subtype === 'induction') {
        // For induction, we need to extract instances from the middle term
        const instances = majorTerms.subject.split(',').map(s => s.trim());
        const terms = [minorTerms.subject, ...instances, majorTerms.predicate];
        syllogism = this.syllogismSystem.createSyllogism(
          'reflection',
          'induction',
          terms
        );
      } else {
        syllogism = this.syllogismSystem.createSyllogism(
          'reflection',
          'analogy',
          [minorTerms.subject, majorTerms.subject, 'common attribute', majorTerms.predicate]
        );
      }
    } else { // necessity
      if (subtype === 'categorical') {
        syllogism = this.syllogismSystem.createSyllogism(
          'necessity',
          'categorical',
          [minorTerms.subject, majorTerms.subject, majorTerms.predicate]
        );
      } else if (subtype === 'hypothetical') {
        syllogism = this.syllogismSystem.createSyllogism(
          'necessity',
          'hypothetical',
          [minorTerms.subject, majorTerms.predicate, minorTerms.subject]
        );
      } else {
        // For disjunctive, we need to extract options from the major premise
        const options = majorTerms.predicate.split('or').map(s => s.trim());
        const terms = [minorTerms.subject, ...options, conclusionTerms.predicate];
        syllogism = this.syllogismSystem.createSyllogism(
          'necessity',
          'disjunctive',
          terms
        );
      }
    }
    
    return syllogism;
  }
  
  /**
   * Parse a logical statement into subject and predicate
   */
  private parseLogicalStatement(statement: string): { subject: string, predicate: string } {
    const parts = statement.split(/\s+(?:is|are|has|have|must|might|belongs to|contains|excludes)\s+/);
    return {
      subject: parts[0].trim(),
      predicate: parts[1]?.trim() || ''
    };
  }
  
  /**
   * Get a human-readable necessity indicator
   */
  private getNecessityIndicator(necessity: number): string {
    if (necessity >= 0.9) return 'Absolute';
    if (necessity >= 0.7) return 'High';
    if (necessity >= 0.5) return 'Moderate';
    if (necessity >= 0.3) return 'Low';
    return 'Minimal';
  }
  
  /**
   * Get a syllogism from the graph by its ID
   */
  getSyllogism(syllogismId: string): Syllogism | null {
    const nodeId = this.syllogismNodes.get(syllogismId);
    if (!nodeId) return null;
    
    const node = this.graph.getNode(nodeId);
    if (!node) return null;
    
    // Convert node back to syllogism
    return this.nodeToSyllogism(node);
  }
  
  /**
   * Convert a graph node to a syllogism
   */
  private nodeToSyllogism(node: NeoGraphNode): Syllogism {
    const {
      syllogismId,
      type,
      subtype,
      majorPremiss,
      minorPremiss,
      conclusion,
      necessity,
      bec
    } = node.properties;
    
    // For simplicity, we'll use the system to recreate the syllogism
    // and then update its properties
    const syllogism = this.transformToTranscendentalForm(createNeoNode({
      id: syllogismId,
      type: `${type}:${subtype}`,
      being: bec.being,
      essence: bec.essence,
      concept: bec.concept,
      properties: {
        model: {
          syllogismType: type,
          syllogismSubtype: subtype,
          majorPremiss,
          minorPremiss,
          conclusion,
          necessityLevel: necessity
        }
      },
      metadata: node.metadata
    }));
    
    return syllogism;
  }
  
  /**
   * Find syllogisms in the graph by type and subtype
   */
  findSyllogisms(type?: SyllogismType, subtype?: string): Syllogism[] {
    const typePattern = type ? `syllogism:${type}` : 'syllogism';
    const fullPattern = subtype ? `${typePattern}:${subtype}` : typePattern;
    
    const nodes = this.graph.findNodes({
      type: fullPattern
    });
    
    return nodes.map(node => this.nodeToSyllogism(node));
  }
  
  /**
   * Create a connected dialectical graph from a concept
   */
  createDialecticalGraphForConcept(concept: string): string {
    // Start by creating a categorical syllogism
    const singularTerm = concept;
    const speciesTerm = `Type of ${concept}`;
    const genusTerm = `Category of ${concept}`;
    
    const categoricalSyllogism = this.syllogismSystem.createSyllogism(
      'necessity',
      'categorical',
      [singularTerm, speciesTerm, genusTerm]
    );
    
    // Add the progression to the graph
    const nodeIds = this.addDialecticalProgression(categoricalSyllogism);
    
    // Create a central concept node
    const conceptNodeId = this.graph.createNode({
      type: 'concept:universal',
      properties: {
        name: concept,
        dialecticallyDeveloped: true,
        syllogismIds: nodeIds.map(id => {
          const node = this.graph.getNode(id);
          return node?.properties.syllogismId;
        }).filter(Boolean)
      },
      metadata: {
        created: Date.now()
      }
    });
    
    // Connect the concept to each syllogism
    for (const nodeId of nodeIds) {
      this.graph.createEdge({
        source: conceptNodeId,
        target: nodeId,
        type: 'dialectical-moment',
        properties: {
          relation: 'moment-of-concept'
        }
      });
    }
    
    return conceptNodeId;
  }
  
  /**
   * Transform between modalities using syllogisms
   */
  transformModality(
    sourceNodeId: string, 
    modality: 'possibility' | 'actuality' | 'necessity'
  ): string {
    const sourceNode = this.graph.getNode(sourceNodeId);
    if (!sourceNode) {
      throw new Error(`Node not found: ${sourceNodeId}`);
    }
    
    let syllogismType: SyllogismType;
    let syllogismSubtype: string;
    
    // Map modality to appropriate syllogism form
    switch (modality) {
      case 'possibility':
        syllogismType = 'existence';
        syllogismSubtype = 'first-figure';
        break;
      case 'actuality':
        syllogismType = 'reflection';
        syllogismSubtype = 'analogy';
        break;
      case 'necessity':
        syllogismType = 'necessity';
        syllogismSubtype = 'disjunctive';
        break;
    }
    
    // Create appropriate syllogism based on node properties
    let syllogism: Syllogism;
    
    if (modality === 'necessity') {
      // For necessity, create a disjunctive syllogism
      const subject = sourceNode.properties.name || 'Subject';
      const options = ['Option A', 'Option B', 'Option C'];
      const actualOption = 'Option A';
      
      syllogism = this.syllogismSystem.createSyllogism(
        'necessity',
        'disjunctive',
        [subject, ...options, actualOption]
      );
    } else if (modality === 'actuality') {
      // For actuality, create an analogy syllogism
      const subject1 = sourceNode.properties.name || 'Subject';
      const subject2 = 'Similar Subject';
      const commonAttr = 'Common Nature';
      const inferredAttr = 'Inferred Property';
      
      syllogism = this.syllogismSystem.createSyllogism(
        'reflection',
        'analogy',
        [subject1, subject2, commonAttr, inferredAttr]
      );
    } else {
      // For possibility, create a first figure syllogism
      const singular = sourceNode.properties.name || 'Subject';
      const particular = 'Class';
      const universal = 'Category';
      
      syllogism = this.syllogismSystem.createSyllogism(
        'existence',
        'first-figure',
        [singular, particular, universal]
      );
    }
    
    // Add the syllogism to the graph
    const syllogismNodeId = this.addSyllogism(syllogism);
    
    // Connect the source node to the syllogism
    this.graph.createEdge({
      source: sourceNodeId,
      target: syllogismNodeId,
      type: 'modal-transformation',
      properties: {
        modalityChange: `to-${modality}`,
        transformationType: 'dialectical'
      }
    });
    
    return syllogismNodeId;
  }
}

/**
 * Create a BEC Graph Adapter
 */
export function createBECGraphAdapter(
  neoProtocol: NeoProtocol,
  graphSpaceId?: string
): BECGraphAdapter {
  return new BECGraphAdapter(neoProtocol, graphSpaceId);
}

export const becGraphAdapter = new BECGraphAdapter();
export default becGraphAdapter;