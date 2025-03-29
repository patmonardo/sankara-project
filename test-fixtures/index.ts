import { sanskritPhilosophyFixture } from './sanskrit-philosophy';
import { vedantaConceptsFixture } from './vedanta-concepts';
import { buddhistTerminologyFixture } from './buddhist-terminology';
// Add more fixtures as needed

export const fixtures = {
  'sanskrit-philosophy': sanskritPhilosophyFixture,
  'vedanta-concepts': vedantaConceptsFixture,
  'buddhist-terminology': buddhistTerminologyFixture,
  // Add more fixtures as needed
};

export type FixtureType = keyof typeof fixtures;
