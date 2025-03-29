import { describe, expect, it, beforeEach } from 'vitest';
import { registryService } from './registry';
import { Registry } from './schema/registry';

describe('RegistryService', () => {
  // Reset state before each test
  beforeEach(() => {
    // Get private registries map and clear it
    const registriesMap = (registryService as any).registries as Map<string, Registry>;
    registriesMap.clear();

    // Clear type index
    const typeIndex = (registryService as any).typeIndex as Map<string, Set<string>>;
    typeIndex.clear();
  });

  it('should create a registry', () => {
    const registry = registryService.createRegistry({
      name: 'Test Registry',
      description: 'A test registry',
      type: 'project',
      properties: {
        testProp: 'test value'
      }
    });

    expect(registry).toBeDefined();
    expect(registry.id).toBeDefined();
    expect(registry.name).toBe('Test Registry');
    expect(registry.description).toBe('A test registry');
    expect(registry.type).toBe('project');
    expect(registry.properties?.testProp).toBe('test value');
    expect(registry.active).toBe(true);
    expect(registry.stats?.entityCount).toBe(0);
  });

  it('should retrieve a registry by ID', () => {
    const registry = registryService.createRegistry({
      name: 'Test Registry'
    });

    const retrieved = registryService.getRegistry(registry.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(registry.id);
  });

  it('should retrieve registries by type', () => {
    registryService.createRegistry({
      name: 'Registry A',
      type: 'project'
    });

    registryService.createRegistry({
      name: 'Registry B',
      type: 'project'
    });

    registryService.createRegistry({
      name: 'Registry C',
      type: 'personal'
    });

    const projectRegistries = registryService.getRegistriesByType('project');
    expect(projectRegistries.length).toBe(2);
    expect(projectRegistries[0].type).toBe('project');
    expect(projectRegistries[1].type).toBe('project');

    const personalRegistries = registryService.getRegistriesByType('personal');
    expect(personalRegistries.length).toBe(1);
    expect(personalRegistries[0].type).toBe('personal');
  });

  it('should update a registry', () => {
    const registry = registryService.createRegistry({
      name: 'Original Name',
      properties: {
        originalProp: 'original value'
      }
    });

    const updated = registryService.updateRegistry(registry.id, {
      name: 'Updated Name',
      properties: {
        newProp: 'new value'
      }
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe('Updated Name');
    expect(updated?.properties?.originalProp).toBe('original value');
    expect(updated?.properties?.newProp).toBe('new value');

    // Verify the update is persisted
    const retrieved = registryService.getRegistry(registry.id);
    expect(retrieved?.name).toBe('Updated Name');
  });

  it('should update registry statistics', () => {
    const registry = registryService.createRegistry({
      name: 'Stats Registry'
    });

    const updated = registryService.updateRegistryStats(registry.id, {
      entityCount: 10,
      relationCount: 5,
      contextCount: 2
    });

    expect(updated).toBeDefined();
    expect(updated?.stats?.entityCount).toBe(10);
    expect(updated?.stats?.relationCount).toBe(5);
    expect(updated?.stats?.contextCount).toBe(2);
    expect(updated?.stats?.lastUpdated).toBeDefined();

    // Verify the update is persisted
    const retrieved = registryService.getRegistry(registry.id);
    expect(retrieved?.stats?.entityCount).toBe(10);
  });

  it('should delete a registry', () => {
    const registry = registryService.createRegistry({
      name: 'To Be Deleted'
    });

    const result = registryService.deleteRegistry(registry.id);
    expect(result).toBe(true);

    // Verify the registry is gone
    const retrieved = registryService.getRegistry(registry.id);
    expect(retrieved).toBeUndefined();
  });

  it('should deactivate a registry', () => {
    const registry = registryService.createRegistry({
      name: 'To Be Deactivated'
    });

    const deactivated = registryService.deactivateRegistry(registry.id);
    expect(deactivated).toBeDefined();
    expect(deactivated?.active).toBe(false);

    // Verify the deactivation is persisted
    const retrieved = registryService.getRegistry(registry.id);
    expect(retrieved?.active).toBe(false);

    // Check that it's not included in active registries
    const activeRegistries = registryService.getActiveRegistries();
    expect(activeRegistries.find(r => r.id === registry.id)).toBeUndefined();
  });

  it('should search registries by name or description', () => {
    registryService.createRegistry({
      name: 'Alpha Registry',
      description: 'First registry'
    });

    registryService.createRegistry({
      name: 'Beta Registry',
      description: 'Second registry with alpha characteristics'
    });

    registryService.createRegistry({
      name: 'Gamma Registry',
      description: 'Third registry'
    });

    const alphaResults = registryService.searchRegistries('alpha');
    expect(alphaResults.length).toBe(2); // Matches both name and description

    const gammaResults = registryService.searchRegistries('gamma');
    expect(gammaResults.length).toBe(1);
    expect(gammaResults[0].name).toBe('Gamma Registry');

    const noResults = registryService.searchRegistries('delta');
    expect(noResults.length).toBe(0);
  });

  it('should associate elements with a registry', () => {
    const registry = registryService.createRegistry({
      name: 'Association Test'
    });

    const updated = registryService.associateElements(registry.id, {
      entityIds: ['entity1', 'entity2'],
      relationIds: ['relation1'],
      contextIds: ['context1', 'context2', 'context3']
    });

    expect(updated).toBeDefined();
    expect(updated?.stats?.entityCount).toBe(2);
    expect(updated?.stats?.relationCount).toBe(1);
    expect(updated?.stats?.contextCount).toBe(3);
  });
});
