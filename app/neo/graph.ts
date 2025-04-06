import { 
  NeoProtocol, 
  NeoEvent, 
  NeoMessage 
} from './protocol';

// Graph node types
export interface GraphNode {
  id: string;
  type: string;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

// Graph edge types
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Neo Graph System
 * Implements a graph structure that integrates with Neo Protocol
 */
export class NeoGraphSystem {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private neoProtocol: NeoProtocol;
  private graphSpaceId: string;
  
  constructor(neoProtocol: NeoProtocol, graphSpaceId: string = 'graph') {
    this.neoProtocol = neoProtocol;
    this.graphSpaceId = graphSpaceId;
    
    // Create graph space if it doesn't exist
    try {
      this.neoProtocol.createSpace(graphSpaceId, 'Graph Space');
    } catch (e) {
      // Space might already exist
    }
    
    // Join graph space
    this.neoProtocol.joinSpace(graphSpaceId);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    // Listen for node events
    this.neoProtocol.onEvent('graph:node', (event) => {
      switch (event.subtype) {
        case 'create':
          this.handleNodeCreate(event);
          break;
        case 'update':
          this.handleNodeUpdate(event);
          break;
        case 'delete':
          this.handleNodeDelete(event);
          break;
      }
    });
    
    // Listen for edge events
    this.neoProtocol.onEvent('graph:edge', (event) => {
      switch (event.subtype) {
        case 'create':
          this.handleEdgeCreate(event);
          break;
        case 'update':
          this.handleEdgeUpdate(event);
          break;
        case 'delete':
          this.handleEdgeDelete(event);
          break;
      }
    });
    
    // Listen for property events
    this.neoProtocol.onEvent('graph:property', (event) => {
      switch (event.subtype) {
        case 'set':
          this.handlePropertySet(event);
          break;
        case 'delete':
          this.handlePropertyDelete(event);
          break;
      }
    });
  }
  
  // Node operations
  
  /**
   * Create a new node
   */
  createNode(node: Omit<GraphNode, 'id'>): string {
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Emit node creation event
    this.neoProtocol.emitEvent({
      type: 'graph:node',
      subtype: 'create',
      source: this.neoProtocol['componentId'],
      timestamp: Date.now(),
      content: {
        node: {
          id: nodeId,
          ...node
        }
      }
    });
    
    return nodeId;
  }
  
  /**
   * Update an existing node
   */
  updateNode(nodeId: string, updates: Partial<Omit<GraphNode, 'id'>>): void {
    // Check if node exists
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    
    // Emit node update event
    this.neoProtocol.emitEvent({
      type: 'graph:node',
      subtype: 'update',
      source: this.neoProtocol['componentId'],
      timestamp: Date.now(),
      content: {
        nodeId,
        updates
      }
    });
  }
  
  /**
   * Delete a node
   */
  deleteNode(nodeId: string): void {
    // Check if node exists
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    
    // Emit node delete event
    this.neoProtocol.emitEvent({
      type: 'graph:node',
      subtype: 'delete',
      source: this.neoProtocol['componentId'],
      timestamp: Date.now(),
      content: {
        nodeId
      }
    });
  }
  
  // Edge operations
  
  /**
   * Create a new edge between nodes
   */
  createEdge(edge: Omit<GraphEdge, 'id'>): string {
    // Check if source and target nodes exist
    if (!this.nodes.has(edge.source)) {
      throw new Error(`Source node not found: ${edge.source}`);
    }
    
    if (!this.nodes.has(edge.target)) {
      throw new Error(`Target node not found: ${edge.target}`);
    }
    
    const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Emit edge creation event
    this.neoProtocol.emitEvent({
      type: 'graph:edge',
      subtype: 'create',
      source: this.neoProtocol['componentId'],
      timestamp: Date.now(),
      content: {
        edge: {
          id: edgeId,
          ...edge
        }
      }
    });
    
    return edgeId;
  }
  
  /**
   * Update an existing edge
   */
  updateEdge(edgeId: string, updates: Partial<Omit<GraphEdge, 'id' | 'source' | 'target'>>): void {
    // Check if edge exists
    if (!this.edges.has(edgeId)) {
      throw new Error(`Edge not found: ${edgeId}`);
    }
    
    // Emit edge update event
    this.neoProtocol.emitEvent({
      type: 'graph:edge',
      subtype: 'update',
      source: this.neoProtocol['componentId'],
      timestamp: Date.now(),
      content: {
        edgeId,
        updates
      }
    });
  }
  
  /**
   * Delete an edge
   */
  deleteEdge(edgeId: string): void {
    // Check if edge exists
    if (!this.edges.has(edgeId)) {
      throw new Error(`Edge not found: ${edgeId}`);
    }
    
    // Emit edge delete event
    this.neoProtocol.emitEvent({
      type: 'graph:edge',
      subtype: 'delete',
      source: this.neoProtocol['componentId'],
      timestamp: Date.now(),
      content: {
        edgeId
      }
    });
  }
  
  // Property operations
  
  /**
   * Set property on a node or edge
   */
  setProperty(elementId: string, key: string, value: any): void {
    // Check if element exists
    if (!this.nodes.has(elementId) && !this.edges.has(elementId)) {
      throw new Error(`Element not found: ${elementId}`);
    }
    
    // Emit property set event
    this.neoProtocol.emitEvent({
      type: 'graph:property',
      subtype: 'set',
      source: this.neoProtocol['componentId'],
      timestamp: Date.now(),
      content: {
        elementId,
        key,
        value
      }
    });
  }
  
  /**
   * Delete property from a node or edge
   */
  deleteProperty(elementId: string, key: string): void {
    // Check if element exists
    if (!this.nodes.has(elementId) && !this.edges.has(elementId)) {
      throw new Error(`Element not found: ${elementId}`);
    }
    
    // Emit property delete event
    this.neoProtocol.emitEvent({
      type: 'graph:property',
      subtype: 'delete',
      source: this.neoProtocol['componentId'],
      timestamp: Date.now(),
      content: {
        elementId,
        key
      }
    });
  }
  
  // Query operations
  
  /**
   * Get a node by ID
   */
  getNode(nodeId: string): GraphNode | null {
    return this.nodes.get(nodeId) || null;
  }
  
  /**
   * Get an edge by ID
   */
  getEdge(edgeId: string): GraphEdge | null {
    return this.edges.get(edgeId) || null;
  }
  
  /**
   * Find nodes by type and properties
   */
  findNodes(criteria: {
    type?: string;
    properties?: Record<string, any>;
  }): GraphNode[] {
    return Array.from(this.nodes.values()).filter(node => {
      // Match type if specified
      if (criteria.type && node.type !== criteria.type) {
        return false;
      }
      
      // Match properties if specified
      if (criteria.properties) {
        for (const [key, value] of Object.entries(criteria.properties)) {
          if (node.properties[key] !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
  
  /**
   * Find edges connected to a node
   */
  findEdges(nodeId: string, direction: 'outgoing' | 'incoming' | 'both' = 'both'): GraphEdge[] {
    return Array.from(this.edges.values()).filter(edge => {
      if (direction === 'outgoing' || direction === 'both') {
        if (edge.source === nodeId) return true;
      }
      
      if (direction === 'incoming' || direction === 'both') {
        if (edge.target === nodeId) return true;
      }
      
      return false;
    });
  }
  
  // Event handlers
  
  private handleNodeCreate(event: NeoEvent) {
    const node = event.content.node as GraphNode;
    this.nodes.set(node.id, node);
  }
  
  private handleNodeUpdate(event: NeoEvent) {
    const { nodeId, updates } = event.content;
    const node = this.nodes.get(nodeId);
    
    if (node) {
      this.nodes.set(nodeId, {
        ...node,
        ...updates,
        properties: {
          ...node.properties,
          ...(updates.properties || {})
        },
        metadata: {
          ...node.metadata,
          ...(updates.metadata || {})
        }
      });
    }
  }
  
  private handleNodeDelete(event: NeoEvent) {
    const { nodeId } = event.content;
    this.nodes.delete(nodeId);
    
    // Clean up associated edges
    for (const [edgeId, edge] of this.edges.entries()) {
      if (edge.source === nodeId || edge.target === nodeId) {
        this.edges.delete(edgeId);
      }
    }
  }
  
  private handleEdgeCreate(event: NeoEvent) {
    const edge = event.content.edge as GraphEdge;
    this.edges.set(edge.id, edge);
  }
  
  private handleEdgeUpdate(event: NeoEvent) {
    const { edgeId, updates } = event.content;
    const edge = this.edges.get(edgeId);
    
    if (edge) {
      this.edges.set(edgeId, {
        ...edge,
        ...updates,
        properties: {
          ...edge.properties,
          ...(updates.properties || {})
        },
        metadata: {
          ...edge.metadata,
          ...(updates.metadata || {})
        }
      });
    }
  }
  
  private handleEdgeDelete(event: NeoEvent) {
    const { edgeId } = event.content;
    this.edges.delete(edgeId);
  }
  
  private handlePropertySet(event: NeoEvent) {
    const { elementId, key, value } = event.content;
    
    // Update node property
    const node = this.nodes.get(elementId);
    if (node) {
      node.properties[key] = value;
      return;
    }
    
    // Update edge property
    const edge = this.edges.get(elementId);
    if (edge) {
      edge.properties[key] = value;
    }
  }
  
  private handlePropertyDelete(event: NeoEvent) {
    const { elementId, key } = event.content;
    
    // Delete node property
    const node = this.nodes.get(elementId);
    if (node) {
      delete node.properties[key];
      return;
    }
    
    // Delete edge property
    const edge = this.edges.get(elementId);
    if (edge) {
      delete edge.properties[key];
    }
  }
}

/**
 * Create a Neo Graph System
 */
export function createNeoGraphSystem(neoProtocol: NeoProtocol, graphSpaceId?: string): NeoGraphSystem {
  return new NeoGraphSystem(neoProtocol, graphSpaceId);
}