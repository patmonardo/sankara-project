import { describe, it, expect } from "vitest";
import { createNeoEventEmitter, NeoEvent } from "./event";

describe("Neo Event System", () => {
  it("should emit and receive events", () => {
    const emitter = createNeoEventEmitter();
    const events: NeoEvent[] = [];
    
    emitter.on('test', (event) => {
      events.push(event);
    });
    
    emitter.emit({
      id: 'test:1',
      type: 'test',
      source: 'test-source',
      timestamp: Date.now()
    });
    
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('test');
    expect(events[0].id).toBe('test:1');
  });

  it("should support wildcard listeners", () => {
    const emitter = createNeoEventEmitter();
    const allEvents: NeoEvent[] = [];
    const testEvents: NeoEvent[] = [];
    
    emitter.on('*', (event) => {
      allEvents.push(event);
    });
    
    emitter.on('test', (event) => {
      testEvents.push(event);
    });
    
    emitter.emit({
      id: 'test:1',
      type: 'test',
      source: 'test-source',
      timestamp: Date.now()
    });
    
    emitter.emit({
      id: 'other:1',
      type: 'other',
      source: 'test-source',
      timestamp: Date.now()
    });
    
    expect(allEvents.length).toBe(2);
    expect(testEvents.length).toBe(1);
  });

  it("should remove listeners correctly", () => {
    const emitter = createNeoEventEmitter();
    const events: NeoEvent[] = [];
    
    const handler = (event: NeoEvent) => {
      events.push(event);
    };
    
    emitter.on('test', handler);
    
    emitter.emit({
      id: 'test:1',
      type: 'test',
      source: 'test-source',
      timestamp: Date.now()
    });
    
    expect(events.length).toBe(1);
    
    emitter.off('test', handler);
    
    emitter.emit({
      id: 'test:2',
      type: 'test',
      source: 'test-source',
      timestamp: Date.now()
    });
    
    expect(events.length).toBe(1); // Still just the first event
  });

  it("should support event filtering", () => {
    const emitter = createNeoEventEmitter();
    const subtypeEvents: NeoEvent[] = [];
    
    // Listen for events with specific subtype
    emitter.on('test', (event) => {
      if (event.subtype === 'special') {
        subtypeEvents.push(event);
      }
    });
    
    // Emit regular event
    emitter.emit({
      id: 'test:1',
      type: 'test',
      source: 'test-source',
      timestamp: Date.now()
    });
    
    // Emit event with subtype
    emitter.emit({
      id: 'test:2',
      type: 'test',
      subtype: 'special',
      source: 'test-source',
      timestamp: Date.now()
    });
    
    expect(subtypeEvents.length).toBe(1);
    expect(subtypeEvents[0].id).toBe('test:2');
  });

  it("should handle async event handlers", async () => {
    const emitter = createNeoEventEmitter();
    let processed = false;
    
    emitter.on('test', async (event) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      processed = true;
    });
    
    emitter.emit({
      id: 'test:1',
      type: 'test',
      source: 'test-source',
      timestamp: Date.now()
    });
    
    // Wait for async handler
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(processed).toBe(true);
  });
});