import { readFileSync } from 'fs';
import { join } from 'path';

export const testUtils = {
    loadFixture: (name: string): string => {
        return readFileSync(join(__dirname, '../fixtures', name), 'utf8');
    }
};