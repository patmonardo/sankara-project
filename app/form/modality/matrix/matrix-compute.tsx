// matrix-compute-service.tsx - Access distributed compute resources through Matrix

import { MatrixEventService, MatrixEvent } from './event-system';

/**
 * Types of compute resources available through Matrix
 */
export type ComputeResourceType = 
  | 'gpu'          // Graphics Processing Unit
  | 'tpu'          // Tensor Processing Unit
  | 'cpu'          // CPU compute nodes
  | 'quantum'      // Quantum compute resources
  | 'memory'       // Memory allocation
  | 'storage';     // Storage resources

/**
 * State of a compute unit
 */
export type ComputeUnitState = 
  | 'available'    // Ready for computation
  | 'busy'         // Currently processing
  | 'offline'      // Not available
  | 'error';       // In error state

/**
 * Compute resource interface - represents a single compute unit
 */
export interface ComputeUnit {
  id: string;
  type: ComputeResourceType;
  capabilities: Record<string, any>;  // Resource-specific capabilities
  state: ComputeUnitState;
  utilization: number;                // 0-1 utilization level
  roomId: string;                     // Matrix room for this compute unit
}

/**
 * Computation job request
 */
export interface ComputationRequest<T = any> {
  id: string;
  type: string;                       // Type of computation
  input: T;                           // Input data
  requirements?: {
    memory?: number;                  // Memory requirements (bytes)
    timeout?: number;                 // Max execution time (ms)
    priority?: number;                // Job priority (0-100)
    exclusive?: boolean;              // Whether job needs exclusive access
  };
  meta?: Record<string, any>;         // Metadata
}

/**
 * Computation result
 */
export interface ComputationResult<T = any> {
  id: string;
  requestId: string;                  // Original request ID
  status: 'success' | 'error' | 'cancelled';
  output?: T;                         // Output data if successful
  error?: string;                     // Error message if failed
  stats?: {
    startTime: number;                // When computation started
    endTime: number;                  // When computation completed
    resourceUsage: Record<string, any>; // Resource usage statistics
  };
}

/**
 * Matrix Compute Service - access compute resources through Matrix
 */
export class MatrixComputeService {
  private computeUnits: Map<string, ComputeUnit> = new Map();
  private pendingJobs: Map<string, ComputationRequest> = new Map();
  private jobCallbacks: Map<string, (result: ComputationResult) => void> = new Map();
  
  constructor(private matrixService: MatrixEventService) {
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    // Listen for compute unit announcements
    this.matrixService.on('system', (event: MatrixEvent) => {
      if (event.subtype === 'compute-unit-announcement') {
        this.registerComputeUnit(event.content);
      }
    });
    
    // Listen for compute unit state updates
    this.matrixService.on('state', (event: MatrixEvent) => {
      if (event.subtype === 'compute-unit-state') {
        this.updateComputeUnitState(event.content.id, event.content.state);
      }
    });
    
    // Listen for computation results
    this.matrixService.on('computation', (event: MatrixEvent) => {
      if (event.subtype === 'result') {
        this.handleComputationResult(event.content);
      }
    });
  }
  
  /**
   * Register a new compute unit
   */
  private registerComputeUnit(unit: ComputeUnit) {
    this.computeUnits.set(unit.id, unit);
    
    // Join the compute unit's room
    this.matrixService.joinRoom(unit.roomId).catch(err => {
      console.error(`Failed to join compute unit room ${unit.roomId}:`, err);
    });
    
    // Announce that we're using this compute unit
    this.matrixService.emit({
      type: 'system',
      subtype: 'compute-unit-registration',
      roomId: unit.roomId,
      timestamp: Date.now(),
      content: {
        unitId: unit.id,
        clientId: this.matrixService.userId
      }
    }).catch(console.error);
  }
  
  /**
   * Update a compute unit's state
   */
  private updateComputeUnitState(unitId: string, state: Partial<ComputeUnit>) {
    const unit = this.computeUnits.get(unitId);
    if (unit) {
      this.computeUnits.set(unitId, { ...unit, ...state });
    }
  }
  
  /**
   * Handle computation result
   */
  private handleComputationResult(result: ComputationResult) {
    // Remove from pending jobs
    this.pendingJobs.delete(result.requestId);
    
    // Invoke callback if registered
    const callback = this.jobCallbacks.get(result.requestId);
    if (callback) {
      callback(result);
      this.jobCallbacks.delete(result.requestId);
    }
  }
  
  /**
   * Get all available compute units
   */
  getComputeUnits(type?: ComputeResourceType): ComputeUnit[] {
    const units = Array.from(this.computeUnits.values());
    return type ? units.filter(u => u.type === type) : units;
  }
  
  /**
   * Get available GPU units
   */
  getGPUs(): ComputeUnit[] {
    return this.getComputeUnits('gpu');
  }
  
  /**
   * Submit a computation job to a specific compute unit
   */
  async submitComputation<T, R>(
    unitId: string, 
    request: Omit<ComputationRequest<T>, 'id'>,
    options?: {
      timeout?: number;
      retries?: number;
    }
  ): Promise<ComputationResult<R>> {
    const unit = this.computeUnits.get(unitId);
    if (!unit) {
      throw new Error(`Compute unit ${unitId} not found`);
    }
    
    // Generate request ID
    const requestId = `computation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create full request
    const fullRequest: ComputationRequest<T> = {
      id: requestId,
      ...request
    };
    
    // Store in pending jobs
    this.pendingJobs.set(requestId, fullRequest);
    
    // Create promise for result
    const resultPromise = new Promise<ComputationResult<R>>((resolve, reject) => {
      // Register callback
      this.jobCallbacks.set(requestId, resolve as any);
      
      // Set timeout if specified
      if (options?.timeout) {
        setTimeout(() => {
          // Check if job is still pending
          if (this.pendingJobs.has(requestId)) {
            this.pendingJobs.delete(requestId);
            this.jobCallbacks.delete(requestId);
            reject(new Error(`Computation timed out after ${options.timeout}ms`));
          }
        }, options.timeout);
      }
    });
    
    // Send computation request
    await this.matrixService.emit({
      type: 'computation',
      subtype: 'request',
      roomId: unit.roomId,
      timestamp: Date.now(),
      content: fullRequest
    });
    
    return resultPromise;
  }
  
  /**
   * Submit a computation job to any available unit of specified type
   */
  async compute<T, R>(
    type: ComputeResourceType,
    request: Omit<ComputationRequest<T>, 'id'>,
    options?: {
      timeout?: number;
      retries?: number;
      selectionStrategy?: 'roundRobin' | 'leastUtilized' | 'fastest';
    }
  ): Promise<ComputationResult<R>> {
    // Find available units of requested type
    const availableUnits = this.getComputeUnits(type)
      .filter(unit => unit.state === 'available');
    
    if (availableUnits.length === 0) {
      throw new Error(`No available compute units of type ${type}`);
    }
    
    // Select unit based on strategy
    let selectedUnit: ComputeUnit;
    
    switch (options?.selectionStrategy) {
      case 'leastUtilized':
        selectedUnit = availableUnits.reduce(
          (min, unit) => unit.utilization < min.utilization ? unit : min,
          availableUnits[0]
        );
        break;
        
      case 'fastest':
        // Assuming lower numbered units are faster (in reality would use benchmarks)
        selectedUnit = availableUnits.reduce(
          (fastest, unit) => {
            const fastestSpeed = fastest.capabilities.speed || 1;
            const unitSpeed = unit.capabilities.speed || 1;
            return unitSpeed > fastestSpeed ? unit : fastest;
          }, 
          availableUnits[0]
        );
        break;
        
      case 'roundRobin':
      default:
        // Simple round robin
        const index = Date.now() % availableUnits.length;
        selectedUnit = availableUnits[index];
    }
    
    // Submit to selected unit
    return this.submitComputation<T, R>(selectedUnit.id, request, options);
  }
  
  /**
   * Run a shader on available GPUs
   */
  async runShader(
    shaderCode: string, 
    uniforms: Record<string, any>, 
    dimensions: { width: number; height: number }
  ): Promise<{ result: Uint8Array | Float32Array; width: number; height: number }> {
    return this.compute<{
      shader: string;
      uniforms: Record<string, any>;
      dimensions: { width: number; height: number };
    }, {
      data: number[];
      width: number;
      height: number;
      format: 'uint8' | 'float32';
    }>('gpu', {
      type: 'shader',
      input: {
        shader: shaderCode,
        uniforms,
        dimensions
      }
    }).then(result => {
      if (result.status === 'error') {
        throw new Error(result.error);
      }
      
      // Convert result data to appropriate typed array
      const data = result.output!.format === 'float32' ?
        new Float32Array(result.output!.data) :
        new Uint8Array(result.output!.data);
      
      return {
        result: data,
        width: result.output!.width,
        height: result.output!.height
      };
    });
  }
  
  /**
   * Run a batch of computations in parallel across multiple units
   */
  async batch<T, R>(
    type: ComputeResourceType,
    requests: Array<Omit<ComputationRequest<T>, 'id'>>,
    options?: {
      timeout?: number;
      maxConcurrent?: number;
    }
  ): Promise<ComputationResult<R>[]> {
    const maxConcurrent = options?.maxConcurrent || Infinity;
    const availableUnits = this.getComputeUnits(type)
      .filter(unit => unit.state === 'available');
    
    if (availableUnits.length === 0) {
      throw new Error(`No available compute units of type ${type}`);
    }
    
    // Determine how many jobs to run concurrently
    const concurrency = Math.min(
      requests.length,
      availableUnits.length,
      maxConcurrent
    );
    
    // Create batches
    const batches: Array<Omit<ComputationRequest<T>, 'id'>[]> = [];
    for (let i = 0; i < concurrency; i++) {
      batches.push([]);
    }
    
    // Distribute requests across batches
    requests.forEach((req, i) => {
      batches[i % concurrency].push(req);
    });
    
    // Process each batch on a different compute unit
    const results: ComputationResult<R>[][] = await Promise.all(
      batches.map((batchRequests, i) => {
        const unit = availableUnits[i];
        
        return Promise.all(
          batchRequests.map(request => 
            this.submitComputation<T, R>(unit.id, request, {
              timeout: options?.timeout
            })
          )
        );
      })
    );
    
    // Flatten results
    return results.flat();
  }
}

/**
 * Create a local GPU compute unit for testing
 */
export function createLocalGPU(matrixService: MatrixEventService, options: {
  id?: string;
  capabilities?: Record<string, any>;
}): ComputeUnit {
  const id = options.id || `local-gpu-${Date.now()}`;
  const roomId = `compute-${id}`;
  
  const capabilities = {
    cores: 768,
    memory: 4 * 1024 * 1024 * 1024, // 4GB
    shaderLanguages: ['glsl', 'wgsl'],
    ...options.capabilities
  };
  
  const gpu: ComputeUnit = {
    id,
    type: 'gpu',
    capabilities,
    state: 'available',
    utilization: 0,
    roomId
  };
  
  // Create the compute unit room
  matrixService.joinRoom(roomId).catch(console.error);
  
  // Announce this compute unit
  matrixService.emit({
    type: 'system',
    subtype: 'compute-unit-announcement',
    roomId,
    timestamp: Date.now(),
    content: gpu
  }).catch(console.error);
  
  // Listen for computation requests
  matrixService.on('computation', async (event: MatrixEvent) => {
    if (event.subtype === 'request' && event.roomId === roomId) {
      const request = event.content as ComputationRequest;
      
      // Update state to busy
      matrixService.emit({
        type: 'state',
        subtype: 'compute-unit-state',
        roomId,
        timestamp: Date.now(),
        content: {
          id,
          state: 'busy',
          utilization: 0.8
        }
      }).catch(console.error);
      
      try {
        // Process the computation (mock implementation)
        let result: any;
        
        if (request.type === 'shader') {
          // Mock shader execution
          const { shader, uniforms, dimensions } = request.input;
          console.log(`[LocalGPU] Executing shader with dimensions: ${dimensions.width}x${dimensions.height}`);
          
          // Create mock shader result
          const pixelCount = dimensions.width * dimensions.height;
          const data = new Float32Array(pixelCount * 4); // RGBA
          
          // Fill with simple pattern (would be shader result in real implementation)
          for (let i = 0; i < pixelCount; i++) {
            const x = i % dimensions.width;
            const y = Math.floor(i / dimensions.width);
            
            data[i * 4 + 0] = x / dimensions.width; // R
            data[i * 4 + 1] = y / dimensions.height; // G
            data[i * 4 + 2] = (x + y) / (dimensions.width + dimensions.height); // B
            data[i * 4 + 3] = 1.0; // A
          }
          
          result = {
            data: Array.from(data), // Convert to regular array for JSON
            width: dimensions.width,
            height: dimensions.height,
            format: 'float32'
          };
        } else {
          // Generic mock computation
          console.log(`[LocalGPU] Processing computation of type: ${request.type}`);
          result = { processed: true, input: request.input };
        }
        
        // Send success result
        await matrixService.emit({
          type: 'computation',
          subtype: 'result',
          roomId,
          timestamp: Date.now(),
          content: {
            id: `result-${request.id}`,
            requestId: request.id,
            status: 'success',
            output: result,
            stats: {
              startTime: Date.now() - 100, // Pretend computation took 100ms
              endTime: Date.now(),
              resourceUsage: {
                memoryUsed: 128 * 1024 * 1024, // 128MB
                computeTimeMs: 100
              }
            }
          }
        });
        
      } catch (error) {
        // Send error result
        await matrixService.emit({
          type: 'computation',
          subtype: 'result',
          roomId,
          timestamp: Date.now(),
          content: {
            id: `result-${request.id}`,
            requestId: request.id,
            status: 'error',
            error: error.message || 'Unknown error during computation'
          }
        });
      } finally {
        // Update state back to available
        matrixService.emit({
          type: 'state',
          subtype: 'compute-unit-state',
          roomId,
          timestamp: Date.now(),
          content: {
            id,
            state: 'available',
            utilization: 0.1
          }
        }).catch(console.error);
      }
    }
  });
  
  return gpu;
}

/**
 * Set up a virtual GPU array in Matrix
 */
export function createGPUArray(
  matrixService: MatrixEventService, 
  count: number
): ComputeUnit[] {
  const gpus: ComputeUnit[] = [];
  
  for (let i = 0; i < count; i++) {
    gpus.push(createLocalGPU(matrixService, {
      id: `gpu-${i}`,
      capabilities: {
        cores: 512 + (i * 128), // Different capabilities for each GPU
        memory: (2 + i) * 1024 * 1024 * 1024, // 2GB + i GB
        speed: 1.0 + (i * 0.1) // Relative speed factor
      }
    }));
  }
  
  return gpus;
}

/**
 * Create a Matrix compute service with a GPU array
 */
export function createMatrixComputeSystem(
  matrixService: MatrixEventService,
  gpuCount: number = 4
): MatrixComputeService {
  // Create the compute service
  const computeService = new MatrixComputeService(matrixService);
  
  // Create virtual GPUs
  createGPUArray(matrixService, gpuCount);
  
  return computeService;
}