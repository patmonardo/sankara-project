/**
 * BEC - Being-Essence-Concept System
 * 
 * A Neo Platform extension that implements Hegelian dialectics
 * as a reciprocating transpilation system between transcendental (BEC)
 * and ordinary (MVC) forms.
 */

// Export BEC components
export * from './being/being.cypher';
export * from './essence/essence.cypher';
export * from './concept/concept.cypher';

// Export BEC adapters
export * from './bec-mvc-adapter';
export * from './bec-graph-adapter';

// Import and export dashboard generator
import { DashboardGenerator, dashboardGenerator } from '@/form/dashboard/dashboard-generator';
export { DashboardGenerator, dashboardGenerator };

/**
 * Generate a dashboard from BEC structures
 */
export function generateDashboardFromBEC(
  name: string,
  description: string,
  becStructures: any[]
) {
  return dashboardGenerator.generateFromBEC(name, description, becStructures);
}

/**
 * Generate an example BEC dashboard
 */
export function generateExampleBECDashboard(
  name: string = 'BEC Dashboard',
  description: string = 'Dashboard generated from BEC structures using dialectical transformation'
) {
  return dashboardGenerator.generateExampleDashboard(name, description);
}

/**
 * The Neo BEC System integrates Hegelian philosophy with modern software architecture
 * patterns, allowing the generation of practical software components from dialectical
 * structures and vice versa.
 * 
 * This system demonstrates that BEC and MVC are isomorphic patterns, with:
 * - Being → Model (immediate data representation)
 * - Essence → View (mediated appearance)
 * - Concept → Controller (unifying logic)
 * 
 * The reciprocating transpilation between these forms enables philosophical
 * concepts to be transformed into practical software architecture and back,
 * creating a bridge between abstract thinking and concrete implementation.
 */
const NeoBECSystem = {
  dashboardGenerator,
  generateDashboardFromBEC,
  generateExampleBECDashboard
};

export default NeoBECSystem;