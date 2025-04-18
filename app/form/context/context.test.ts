import { describe, it, expect, beforeEach } from 'vitest';
import { FormContext, Sandarbha } from '@/form/context/context';

describe('Context System', () => {
  beforeEach(() => {
    // Clear context between tests
    FormContext.clearAll();
  });
  
  it('should create a context', () => {
    const sandarbha = Sandarbha.sṛjSandarbha({
      nāma: 'Test Context',
      mode:  "composite",
      svataḥSakriya: true
    });
    
    expect(sandarbha).toBeDefined();
    expect(sandarbha.id).toBeDefined();
    expect(sandarbha.nāma).toBe('Test Context');
  });
  
  it('should retrieve a context by ID', () => {
    const sandarbha = Sandarbha.sṛjSandarbha({
      nāma: 'Test Context',
      mode:  "composite"
    });
    
    const retrieved = Sandarbha.getSandarbha(sandarbha.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(sandarbha.id);
  });
  
  it('should activate a context', () => {
    const sandarbha = Sandarbha.sṛjSandarbha({
      nāma: 'Test Context',
      mode:  "composite"
    });
    
    const activated = sandarbha.sakriyaKaraṇa();
    expect(activated).toBe(true);
  });
  
  it('should create entities within a context', () => {
    const sandarbha = Sandarbha.sṛjSandarbha({
      nāma: 'Test Context',
      mode:  "composite",
      svataḥSakriya: true
    });
    
    const entityId = sandarbha.vastuSṛṣṭi({
      nāma: 'Test Entity',
      mode: 'user'
    });
    
    expect(entityId).toBeDefined();
    
    const entity = sandarbha.prāptaVastu(entityId);
    expect(entity).toBeDefined();
    expect(entity?.nāma).toBe('Test Entity');
  });
  
  it('should create relations between entities', () => {
    const sandarbha = Sandarbha.sṛjSandarbha({
      nāma: 'Test Context',
      mode:  "composite",
      svataḥSakriya: true
    });
    
    const entityId1 = sandarbha.vastuSṛṣṭi({
      nāma: 'Source Entity',
      mode: 'user'
    });
    
    const entityId2 = sandarbha.vastuSṛṣṭi({
      nāma: 'Target Entity',
      mode: 'profile'
    });
    
    const relationId = sandarbha.sambandhaSṛṣṭi(
      entityId1,
      entityId2,
      'HAS_PROFILE',
      { created: new Date().toISOString() }
    );
    
    expect(relationId).toBeDefined();
    
    const relations = sandarbha.prāptaSambandha(entityId1);
    expect(relations).toBeDefined();
    expect(relations.length).toBe(1);
    expect(relations[0].lakṣyaId).toBe(entityId2);
  });
  
  it('should execute operations within a context', () => {
    const sandarbha = Sandarbha.sṛjSandarbha({
      nāma: 'Test Context',
      mode:  "composite",
      svataḥSakriya: true
    });
    
    const result = sāthaSandarbha(sandarbha.id, () => {
      return 'Operation executed';
    });
    
    expect(result).toBe('Operation executed');
  });
});