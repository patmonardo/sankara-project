import { FormShape } from "../../schema/form";
import { MorpheusContext } from "../../schema/context";
import { morpheus } from "../../modality/morpheus";
import {
  createMatrixContext, MatrixContext,
  RedPillMorph, BluePillMorph, GlitchMorph, DigitalRainMorph,
  AgentSmithMorph, AnomalyMorph, TheOneMorph, ArchitectMorph, ChaosStressMorph,
  createMatrixTestPipeline, MorpheusDemo
} from "./matrix";
import { safeRunDemo, printDemoResults } from "./matrix-test-utils";

/**
 * Matrix Test Configuration
 */
export interface MatrixTestConfig {
  name: string;
  effects: string[];
  formSize?: 'small' | 'medium' | 'large' | 'massive';
  iterations?: number;
  timeout?: number;
  logLevel?: 'minimal' | 'normal' | 'detailed' | 'debug';
  failFast?: boolean;
}

/**
 * Matrix Test Result
 */
export interface MatrixTestResult {
  name: string;
  effects: string[];
  success: boolean;
  duration: number;
  iterations: number;
  completedIterations: number;
  errors: Array<{
    iteration: number;
    error: string;
    stack?: string;
  }>;
  performance: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  memory?: {
    before: number;
    after: number;
    diff: number;
    peak: number;
  };
}

/**
 * Matrix Test Harness - Advanced testing system using Matrix themes
 */
export class MatrixTestHarness {
  private config: MatrixTestConfig[];
  private results: MatrixTestResult[] = [];
  private running: boolean = false;
  
  constructor(config: MatrixTestConfig | MatrixTestConfig[]) {
    this.config = Array.isArray(config) ? config : [config];
  }
  
  /**
   * Run all configured tests
   */
  async runAll(): Promise<MatrixTestResult[]> {
    if (this.running) {
      throw new Error('Tests are already running');
    }
    
    this.running = true;
    this.results = [];
    
    console.log('\n=======================================');
    console.log('  MATRIX TEST HARNESS INITIALIZED');
    console.log('  "Welcome to the desert of the real"');
    console.log('=======================================\n');
    
    for (const testConfig of this.config) {
      try {
        const result = await this.runTest(testConfig);
        this.results.push(result);
        
        // Log result
        if (result.success) {
          console.log(`✓ ${result.name} passed (${result.duration}ms)`);
        } else {
          console.log(`✗ ${result.name} failed with ${result.errors.length} errors`);
          
          if (testConfig.logLevel !== 'minimal') {
            result.errors.forEach((err, i) => {
              console.error(`  Error ${i+1}: ${err.error}`);
              if (testConfig.logLevel === 'debug') {
                console.error(`  Stack: ${err.stack}`);
              }
            });
          }
          
          if (testConfig.failFast) {
            console.log('\nFail fast enabled, stopping tests');
            break;
          }
        }
      } catch (error) {
        console.error(`Failed to execute test ${testConfig.name}:`, error);
        
        if (testConfig.failFast) {
          break;
        }
      }
    }
    
    this.running = false;
    console.log('\n=======================================');
    console.log(`  MATRIX TEST HARNESS COMPLETE`);
    console.log(`  ${this.results.filter(r => r.success).length}/${this.results.length} tests passed`);
    console.log('=======================================\n');
    
    return this.results;
  }
  
  /**
   * Run a single test based on config
   */
  private async runTest(config: MatrixTestConfig): Promise<MatrixTestResult> {
    const startTime = Date.now();
    const iterations = config.iterations || 1;
    const timeout = config.timeout || 5000;
    
    console.log(`\n> Running test: ${config.name}`);
    console.log(`  Effects: ${config.effects.join(', ')}`);
    console.log(`  Iterations: ${iterations}`);
    
    // Create a test form based on specified size
    const testForm = this.createTestForm(config.formSize || 'medium');
    
    // Create matrix pipeline for this test
    const testPipeline = createMatrixTestPipeline(
      `${config.name}_Pipeline`,
      config.effects
    );
    
    // Prepare test context
    const baseContext = createMatrixContext();
    
    // Prepare result
    const result: MatrixTestResult = {
      name: config.name,
      effects: config.effects,
      success: true,
      duration: 0,
      iterations,
      completedIterations: 0,
      errors: [],
      performance: {
        min: Number.MAX_VALUE,
        max: 0,
        avg: 0,
        median: 0
      }
    };
    
    // Track performance
    const durations: number[] = [];
    
    // If detailed logging, track memory
    if (config.logLevel === 'detailed' || config.logLevel === 'debug') {
      if (global.gc) {
        global.gc(); // Force garbage collection before test
      }
      
      result.memory = {
        before: process.memoryUsage().heapUsed,
        after: 0,
        diff: 0,
        peak: 0
      };
    }
    
    // Run iterations
    for (let i = 0; i < iterations; i++) {
      const iterStartTime = Date.now();
      
      try {
        // Create unique context for this iteration
        const iterContext: MatrixContext = {
          ...baseContext,
          operationId: `${config.name}_iter_${i}`,
          timestamp: Date.now(),
          redPillEffect: config.effects.includes('red-pill'),
          bluepillEffect: config.effects.includes('blue-pill'),
          glitchLevel: config.effects.includes('glitch') ? Math.min(i, 5) : 0,
          digitalRain: config.effects.includes('digital-rain'),
          agentSmithIntensity: config.effects.includes('agent-smith') ? Math.min(i/5, 5) : 0,
          anomalyLevel: config.effects.includes('anomaly') ? Math.min(i/2, 4) : 0
        };
        
        // Apply timeout protection
        const testPromise = new Promise<FormShape>((resolve, reject) => {
          try {
            const result = testPipeline.apply(testForm, iterContext);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
        
        // Execute with timeout
        const resultForm = await Promise.race([
          testPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Test iteration timeout')), timeout)
          )
        ]);
        
        // Track memory usage if needed
        if (result.memory) {
          const current = process.memoryUsage().heapUsed;
          result.memory.peak = Math.max(result.memory.peak, current);
        }
        
        // Calculate duration
        const iterDuration = Date.now() - iterStartTime;
        durations.push(iterDuration);
        
        // Update performance stats
        result.performance.min = Math.min(result.performance.min, iterDuration);
        result.performance.max = Math.max(result.performance.max, iterDuration);
        
        // Log progress for long-running tests
        if (iterations > 10 && i % Math.floor(iterations / 10) === 0) {
          console.log(`  Progress: ${Math.round((i / iterations) * 100)}%`);
        }
        
        // Success
        result.completedIterations++;
        
      } catch (error) {
        // Record error
        result.errors.push({
          iteration: i,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Mark as failed and maybe stop
        result.success = false;
        if (config.failFast) {
          break;
        }
      }
    }
    
    // Calculate final performance metrics
    if (durations.length > 0) {
      result.performance.avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      
      // Calculate median
      const sortedDurations = [...durations].sort((a, b) => a - b);
      const mid = Math.floor(sortedDurations.length / 2);
      result.performance.median = sortedDurations.length % 2 === 0
        ? (sortedDurations[mid - 1] + sortedDurations[mid]) / 2
        : sortedDurations[mid];
    }
    
    // Finalize memory stats if tracked
    if (result.memory) {
      if (global.gc) {
        global.gc(); // Force garbage collection after test
      }
      result.memory.after = process.memoryUsage().heapUsed;
      result.memory.diff = result.memory.after - result.memory.before;
    }
    
    // Calculate total duration
    result.duration = Date.now() - startTime;
    
    return result;
  }
  
  /**
   * Create a test form of specified size
   */
  private createTestForm(size: 'small' | 'medium' | 'large' | 'massive'): FormShape {
    // Base form
    const baseForm: FormShape = {
      id: `matrix_test_form_${size}`,
      title: `Matrix Test Form (${size})`,
      fields: []
    };
    
    // Generate fields based on size
    const fieldCounts = {
      small: 5,
      medium: 20,
      large: 100,
      massive: 500
    };
    
    const count = fieldCounts[size];
    const fieldTypes = ['text', 'number', 'date', 'boolean', 'select', 'textarea', 'email', 'url'];
    
    for (let i = 0; i < count; i++) {
      const fieldType = fieldTypes[i % fieldTypes.length];
      
      baseForm.fields.push({
        id: `field_${i}`,
        type: fieldType,
        label: `Test Field ${i}`,
        value: this.generateTestValue(fieldType, i),
        required: i % 3 === 0,
        visible: i % 10 !== 0
      });
    }
    
    return baseForm;
  }
  
  /**
   * Generate test values based on field type
   */
  private generateTestValue(type: string, seed: number): any {
    switch (type) {
      case 'text':
        return `Text value ${seed}`;
      case 'number':
        return seed * 10;
      case 'boolean':
        return seed % 2 === 0;
      case 'date':
        const date = new Date();
        date.setDate(date.getDate() + seed);
        return date.toISOString();
      case 'select':
        return `option_${seed % 5}`;
      case 'textarea':
        return `This is a longer text for field ${seed} with multiple words and potentially sentences.`;
      case 'email':
        return `test${seed}@matrix-example.com`;
      case 'url':
        return `https://matrix-example.com/path/${seed}`;
      default:
        return `Default value ${seed}`;
    }
  }
  
  /**
   * Get test results
   */
  getResults(): MatrixTestResult[] {
    return this.results;
  }
  
  /**
   * Get summary statistics
   */
  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const totalIterations = this.results.reduce((sum, r) => sum + r.completedIterations, 0);
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);
    
    return {
      total,
      passed,
      failed,
      totalDuration,
      totalIterations,
      totalErrors,
      successRate: total > 0 ? (passed / total) * 100 : 0
    };
  }
}

/**
 * Helper to run common Matrix test scenarios
 */
export function runMatrixTestScenario(scenario: 'basic' | 'stress' | 'edge-case' | 'visual' | 'full') {
  let config: MatrixTestConfig[];
  
  switch (scenario) {
    case 'basic':
      config = [
        {
          name: 'Red Pill Basic',
          effects: ['red-pill'],
          formSize: 'small',
          iterations: 5
        },
        {
          name: 'Blue Pill Basic',
          effects: ['blue-pill'],
          formSize: 'small',
          iterations: 5
        },
        {
          name: 'Digital Rain Basic',
          effects: ['digital-rain'],
          formSize: 'small',
          iterations: 5
        }
      ];
      break;
      
    case 'stress':
      config = [
        {
          name: 'Agent Smith Replication',
          effects: ['agent-smith'],
          formSize: 'medium',
          iterations: 10,
          timeout: 10000
        },
        {
          name: 'Chaos Stress',
          effects: ['chaos'],
          formSize: 'medium',
          iterations: 10,
          timeout: 10000
        },
        {
          name: 'Combined Stress',
          effects: ['agent-smith', 'glitch', 'anomaly'],
          formSize: 'large',
          iterations: 5,
          timeout: 20000
        }
      ];
      break;
      
    case 'edge-case':
      config = [
        {
          name: 'Anomaly Testing',
          effects: ['anomaly'],
          formSize: 'medium',
          iterations: 10
        },
        {
          name: 'Glitch Edge Cases',
          effects: ['glitch', 'anomaly'],
          formSize: 'medium',
          iterations: 10
        }
      ];
      break;
      
    case 'visual':
      config = [
        {
          name: 'Digital Rain Visual',
          effects: ['digital-rain'],
          formSize: 'small',
          iterations: 1
        },
        {
          name: 'Red Pill Visual',
          effects: ['red-pill'],
          formSize: 'small',
          iterations: 1
        },
        {
          name: 'Blue Pill Visual',
          effects: ['blue-pill'],
          formSize: 'small',
          iterations: 1
        },
        {
          name: 'The One Visual',
          effects: ['the-one'],
          formSize: 'small',
          iterations: 1
        }
      ];
      break;
      
    case 'full':
      // Combine all test types
      return Promise.all([
        runMatrixTestScenario('basic'),
        runMatrixTestScenario('stress'),
        runMatrixTestScenario('edge-case'),
        runMatrixTestScenario('visual')
      ]).then(results => results.flat());
      
    default:
      throw new Error(`Unknown test scenario: ${scenario}`);
  }
  
  // Run the configured tests
  const harness = new MatrixTestHarness(config);
  return harness.runAll();
}

// Quick launcher functions for demos
export const MatrixLauncher = {
  /**
   * Run a quick Matrix demo
   */
  quickDemo: (formSize: 'small' | 'medium' | 'large' = 'small') => {
    const testForm = new MatrixTestHarness({} as any).createTestForm(formSize);
    
    console.log("=== MATRIX QUICK DEMO ===");
    console.log(MorpheusDemo.speak());
    console.log("========================\n");
    
    // Show red pill effect
    const redPillResult = safeRunDemo('Red Pill', MorpheusDemo.redPill, testForm);
    printDemoResults('Red Pill', redPillResult);
    
    // Show blue pill effect
    const bluePillResult = safeRunDemo('Blue Pill', MorpheusDemo.bluePill, testForm);
    printDemoResults('Blue Pill', bluePillResult);
    
    // Show The One
    const theOneResult = safeRunDemo('The One', MorpheusDemo.becomeTheOne, testForm);
    printDemoResults('The One', theOneResult);
    
    console.log("\n=== DEMO COMPLETE ===");
  },
  
  /**
   * Run a basic test suite
   */
  runTests: (scenario: 'basic' | 'stress' | 'edge-case' | 'visual' | 'full' = 'basic') => {
    console.log(`Starting Matrix tests: ${scenario}`);
    return runMatrixTestScenario(scenario);
  }
};

// Export for usage in tests
export { MatrixContext, createMatrixContext };