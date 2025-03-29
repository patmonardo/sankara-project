import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseService } from './base';
import { SystemEvent } from '../system/property';
import { OperationResult } from './schema/base';

// Define a test event type
type TestEvent = SystemEvent<string> & {
  name: string;
};

// Create a concrete implementation of BaseService for testing
class TestService extends BaseService<{ id: string; name: string }, TestEvent> {
  // Expose protected methods for testing
  public filterItems(
    items: Array<{ id: string; name: string }>,
    propertyFilters?: Record<string, any>
  ) {
    return this.filterByProperties(
      items,
      propertyFilters,
      (item) => ({ name: item.name, id: item.id })
    );
  }

  public success<T>(data: T, message?: string): OperationResult<T> {
    return this.createSuccessResult(data, message);
  }

  public error<T>(message: string, error?: Error): OperationResult<T> {
    return this.createErrorResult(message, error);
  }

  public async execute<T>(
    operation: () => Promise<T> | T,
    successMessage?: string,
    errorMessage?: string
  ): Promise<OperationResult<T>> {
    return this.executeOperation(operation, successMessage, errorMessage);
  }

  // Add a method to emit events for testing event functionality
  public emitTestEvent(name: string, target: string, data?: any) {
    this.emit(name, {
      type: name,
      name,
      target,
      data,
      timestamp: new Date()
    });
  }
}

describe('BaseService', () => {
  let service: TestService;
  let testItems: Array<{ id: string; name: string; extra?: string }>;

  beforeEach(() => {
    service = new TestService();
    testItems = [
      { id: '1', name: 'Item 1', extra: 'info1' },
      { id: '2', name: 'Item 2', extra: 'info2' },
      { id: '3', name: 'Item 3', extra: 'info3' },
      { id: '4', name: 'Other Item', extra: 'info4' },
      { id: '5', name: 'Something Else', extra: 'info5' }
    ];
  });

  describe('filterByProperties', () => {
    it('should filter items by exact property match', () => {
      const filtered = service.filterItems(testItems, { name: 'Item 1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter items by multiple properties', () => {
      const filtered = service.filterItems(testItems, {
        name: 'Item 2',
        id: '2'
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Item 2');
    });

    it('should filter items by partial string match with contains operator', () => {
      const filtered = service.filterItems(testItems, {
        name: { $contains: 'Item' }
      });
      expect(filtered).toHaveLength(4); // All items with "Item" in the name
    });

    it('should filter items by partial string match with startsWith operator', () => {
      const filtered = service.filterItems(testItems, {
        name: { $startsWith: 'Item' }
      });
      expect(filtered).toHaveLength(3); // Items that start with "Item"
    });

    it('should filter items by numerical comparison operators', () => {
      const numericItems = [
        { id: '1', name: 'Item 1', value: 10 },
        { id: '2', name: 'Item 2', value: 20 },
        { id: '3', name: 'Item 3', value: 30 },
        { id: '4', name: 'Item 4', value: 40 },
        { id: '5', name: 'Item 5', value: 50 }
      ];

      // Create a new service instance with the numeric property getter
      const numericService = new TestService();
      const filterNumeric = (
        items: Array<{ id: string; name: string; value: number }>,
        propertyFilters?: Record<string, any>
      ) => {
        return numericService.filterByProperties(
          items,
          propertyFilters,
          (item) => ({ name: item.name, id: item.id, value: item.value })
        );
      };

      // Test greater than
      const greaterThan = filterNumeric(numericItems, {
        value: { $gt: 30 }
      });
      expect(greaterThan).toHaveLength(2);
      expect(greaterThan.map(i => i.id)).toEqual(['4', '5']);

      // Test less than
      const lessThan = filterNumeric(numericItems, {
        value: { $lt: 30 }
      });
      expect(lessThan).toHaveLength(2);
      expect(lessThan.map(i => i.id)).toEqual(['1', '2']);

      // Test greater than or equal
      const greaterEqual = filterNumeric(numericItems, {
        value: { $gte: 30 }
      });
      expect(greaterEqual).toHaveLength(3);
      expect(greaterEqual.map(i => i.id)).toEqual(['3', '4', '5']);

      // Test less than or equal
      const lessEqual = filterNumeric(numericItems, {
        value: { $lte: 30 }
      });
      expect(lessEqual).toHaveLength(3);
      expect(lessEqual.map(i => i.id)).toEqual(['1', '2', '3']);

      // Test equality
      const equal = filterNumeric(numericItems, {
        value: 30
      });
      expect(equal).toHaveLength(1);
      expect(equal[0].id).toBe('3');
    });

    it('should return all items when no filters are provided', () => {
      const filtered = service.filterItems(testItems, undefined);
      expect(filtered).toHaveLength(testItems.length);
      expect(filtered).toEqual(testItems);
    });

    it('should return empty array when no items match filters', () => {
      const filtered = service.filterItems(testItems, { name: 'Nonexistent' });
      expect(filtered).toHaveLength(0);
    });

    it('should handle complex filter combinations', () => {
      const items = [
        { id: '1', name: 'Apple', category: 'fruit', price: 1.0 },
        { id: '2', name: 'Banana', category: 'fruit', price: 0.5 },
        { id: '3', name: 'Carrot', category: 'vegetable', price: 0.3 },
        { id: '4', name: 'Orange', category: 'fruit', price: 0.8 },
        { id: '5', name: 'Potato', category: 'vegetable', price: 0.2 }
      ];

      // Complex filtering function
      const filterComplex = (
        items: typeof items,
        propertyFilters?: Record<string, any>
      ) => {
        return service.filterByProperties(
          items,
          propertyFilters,
          (item) => ({
            name: item.name,
            id: item.id,
            category: item.category,
            price: item.price
          })
        );
      };

      // Test multiple conditions
      const fruitUnderDollar = filterComplex(items, {
        category: 'fruit',
        price: { $lt: 1.0 }
      });

      expect(fruitUnderDollar).toHaveLength(2);
      expect(fruitUnderDollar.map(i => i.name)).toEqual(['Banana', 'Orange']);
    });
  });

  describe('createSuccessResult', () => {
    it('should create a success result with data', () => {
      const data = { id: '1', name: 'Test' };
      const result = service.success(data);

      expect(result.status).toBe('success');
      expect(result.data).toBe(data);
      expect(result.message).toBe('Operation successful');
    });

    it('should create a success result with custom message', () => {
      const data = { id: '1', name: 'Test' };
      const message = 'Custom success message';
      const result = service.success(data, message);

      expect(result.status).toBe('success');
      expect(result.data).toBe(data);
      expect(result.message).toBe(message);
    });

    it('should handle null data in success result', () => {
      const result = service.success(null, 'No data found');

      expect(result.status).toBe('success');
      expect(result.data).toBeNull();
      expect(result.message).toBe('No data found');
    });
  });

  describe('createErrorResult', () => {
    it('should create an error result with message', () => {
      const message = 'Something went wrong';
      const result = service.error(message);

      expect(result.status).toBe('error');
      expect(result.data).toBeNull();
      expect(result.message).toBe(message);
    });

    it('should create an error result with Error object', () => {
      const message = 'Failed to process';
      const error = new Error('Invalid input');
      const result = service.error(message, error);

      expect(result.status).toBe('error');
      expect(result.data).toBeNull();
      expect(result.message).toBe('Failed to process: Invalid input');
    });
  });

  describe('executeOperation', () => {
    it('should return success result when operation succeeds', async () => {
      const operation = () => Promise.resolve({ id: '1', name: 'Test' });
      const result = await service.execute(operation);

      expect(result.status).toBe('success');
      expect(result.data).toEqual({ id: '1', name: 'Test' });
    });

    it('should return success result with custom message', async () => {
      const operation = () => Promise.resolve({ id: '1', name: 'Test' });
      const message = 'Item created successfully';
      const result = await service.execute(operation, message);

      expect(result.status).toBe('success');
      expect(result.message).toBe(message);
    });

    it('should return error result when operation fails', async () => {
      const error = new Error('Database connection failed');
      const operation = () => Promise.reject(error);
      const result = await service.execute(operation);

      expect(result.status).toBe('error');
      expect(result.data).toBeNull();
      expect(result.message).toContain('Operation failed');
      expect(result.message).toContain('Database connection failed');
    });

    it('should return error result with custom error message', async () => {
      const error = new Error('Invalid data');
      const operation = () => Promise.reject(error);
      const errorMessage = 'Failed to create item';
      const result = await service.execute(operation, 'Success', errorMessage);

      expect(result.status).toBe('error');
      expect(result.message).toContain(errorMessage);
      expect(result.message).toContain('Invalid data');
    });

    it('should handle synchronous operations', async () => {
      const operation = () => ({ id: '1', name: 'Test' });
      const result = await service.execute(operation);

      expect(result.status).toBe('success');
      expect(result.data).toEqual({ id: '1', name: 'Test' });
    });

    it('should handle synchronous errors', async () => {
      const operation = () => {
        throw new Error('Synchronous error');
      };
      const result = await service.execute(operation);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Synchronous error');
    });
  });

  describe('Event Handling', () => {
    it('should emit and receive events', () => {
      const listener = vi.fn();
      service.on('test-event', listener);

      const eventData = { value: 'test data' };
      service.emitTestEvent('test-event', 'test-target', eventData);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'test-event',
        target: 'test-target',
        data: eventData
      }));
    });

    it('should allow unsubscribing from events', () => {
      const listener = vi.fn();
      const unsubscribe = service.on('test-event', listener);

      // First event should be received
      service.emitTestEvent('test-event', 'test-target');
      expect(listener).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Second event should not be received
      service.emitTestEvent('test-event', 'test-target');
      expect(listener).toHaveBeenCalledTimes(1); // Still just one call
    });

    it('should handle multiple listeners for the same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      service.on('test-event', listener1);
      service.on('test-event', listener2);

      service.emitTestEvent('test-event', 'test-target');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should only trigger listeners for the specific event type', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      service.on('event-1', listener1);
      service.on('event-2', listener2);

      service.emitTestEvent('event-1', 'test-target');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(0);
    });

    it('should provide event timestamp', () => {
      const listener = vi.fn();
      service.on('test-event', listener);

      // Mock Date
      const mockDate = new Date('2023-01-01T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      service.emitTestEvent('test-event', 'test-target');

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        timestamp: mockDate
      }));

      vi.useRealTimers();
    });
  });
});
