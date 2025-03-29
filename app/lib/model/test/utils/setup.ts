import { readFileSync } from 'fs';
import { join } from 'path';

// Test utilities
const loadTestFile = (name: string): string => {
    return readFileSync(join(__dirname, 'fixtures', name), 'utf8');
};

// Export utilities
export const testUtils = {
    loadFixture: loadTestFile
};

// Configure Jest hooks
beforeEach(() => {
    jest.clearAllMocks();
});