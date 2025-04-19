import { 
  EntityOps, 
  ContextOps, 
  RelationOps,
  EntitySchema,
  ContextSchema,
  isCreateContext
} from './becMock';

describe('BEC Mock', () => {
  beforeEach(() => {
    // Reset the in-memory stores between tests
    jest.resetModules();
    // You could also add explicit reset methods to the mock if needed
  });
  
  describe('EntityOps', () => {
    it('should create an entity', () => {
      const entity = EntityOps.create({
        type: 'test',
        name: 'Test Entity'
      });
      
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('Test Entity');
      expect(entity.type).toBe('test');
      expect(entity.createdAt).toBeInstanceOf(Date);
    });
    
    it('should get an entity by ID', () => {
      const entity = EntityOps.create({
        type: 'test',
        name: 'Test Entity'
      });
      
      const retrieved = EntityOps.get(entity.id);
      expect(retrieved).toEqual(entity);
    });
    
    it('should update an entity', () => {
      const entity = EntityOps.create({
        type: 'test',
        name: 'Test Entity'
      });
      
      const updated = EntityOps.update(entity.id, {
        name: 'Updated Entity',
        title: 'Updated Title'
      });
      
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Entity');
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.updatedAt).not.toEqual(entity.updatedAt);
    });
    
    it('should find entities by criteria', () => {
      // Create test entities
      EntityOps.create({
        type: 'type1',
        name: 'Entity 1',
        title: 'Title 1'
      });
      
      EntityOps.create({
        type: 'type2',
        name: 'Entity 2',
        title: 'Title 2'
      });
      
      // Test find by type
      const typeResults = EntityOps.find({ type: 'type1' });
      expect(typeResults.length).toBe(1);
      expect(typeResults[0].name).toBe('Entity 1');
      
      // Test find by name
      const nameResults = EntityOps.find({ name: 'Entity 2' });
      expect(nameResults.length).toBe(1);
      expect(nameResults[0].type).toBe('type2');
      
      // Test find by title
      const titleResults = EntityOps.find({ title: 'Title 1' });
      expect(titleResults.length).toBe(1);
      expect(titleResults[0].name).toBe('Entity 1');
    });
  });
  
  describe('ContextOps', () => {
    let testEntity: ReturnType<typeof EntityOps.create>;
    
    beforeEach(() => {
      testEntity = EntityOps.create({
        type: 'test',
        name: 'Test Entity'
      });
    });
    
    it('should create a context', () => {
      const context = ContextOps.create({
        entityRef: { entity: 'test', id: testEntity.id },
        type: 'testContext',
        data: { foo: 'bar' }
      });
      
      expect(context).toBeDefined();
      expect(context.id).toBeDefined();
      expect(context.entityRef.id).toBe(testEntity.id);
      expect(context.type).toBe('testContext');
      expect(context.data.foo).toBe('bar');
    });
    
    it('should get a context by ID', () => {
      const context = ContextOps.create({
        entityRef: { entity: 'test', id: testEntity.id },
        type: 'testContext',
        data: { foo: 'bar' }
      });
      
      const retrieved = ContextOps.get(context.id);
      expect(retrieved).toEqual(context);
    });
    
    it('should update a context', () => {
      const context = ContextOps.create({
        entityRef: { entity: 'test', id: testEntity.id },
        type: 'testContext',
        data: { foo: 'bar' }
      });
      
      const updated = ContextOps.update(context.id, {
        data: { foo: 'baz', newProp: 'value' }
      });
      
      expect(updated).toBeDefined();
      expect(updated?.data.foo).toBe('baz');
      expect(updated?.data.newProp).toBe('value');
      expect(updated?.updatedAt).not.toEqual(context.updatedAt);
    });
    
    it('should find contexts for an entity', () => {
      // Create test contexts
      ContextOps.create({
        entityRef: { entity: 'test', id: testEntity.id },
        type: 'context1',
        data: { foo: 'bar' }
      });
      
      ContextOps.create({
        entityRef: { entity: 'test', id: testEntity.id },
        type: 'context2',
        data: { baz: 'qux' }
      });
      
      // Test find all contexts for entity
      const allContexts = ContextOps.findForEntity({ entity: 'test', id: testEntity.id });
      expect(allContexts.length).toBe(2);
      
      // Test find contexts by type
      const typeContexts = ContextOps.findForEntity(
        { entity: 'test', id: testEntity.id }, 
        'context1'
      );
      expect(typeContexts.length).toBe(1);
      expect(typeContexts[0].data.foo).toBe('bar');
    });
    
    it('should allow context creation', () => {
      const allowed = isCreateContext(
        { entity: 'test', id: testEntity.id },
        'testContext'
      );
      expect(allowed).toBe(true);
    });
  });
  
  // Add more tests for RelationOps as needed
});