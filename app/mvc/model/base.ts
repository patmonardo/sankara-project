//@/mvc/model/base.ts
import { z } from 'zod'
import type { Base, BaseState, BaseShape } from '@/form/data/schema/base'

export abstract class BaseModel<T extends BaseShape> {
  constructor(
    protected readonly schema: z.ZodType<T>,
    protected readonly shape: T
  ) {}

  // TypeScript property accessors
  get state(): BaseState {
    return this.shape.state;
  }

  get value(): Base {
    return this.shape.base;
  }

  get fullShape(): BaseShape {
    return this.shape;
  }

  // Simplified validation - returns new shape with basic validation status
  validate(): T {
    const result = this.schema.safeParse(this.shape);

    if (!result.success) {
      // Return new shape with simple validation status
      return {
        ...this.shape,
        state: {
          ...this.shape.state,
          // No complex error formatting for now
          validation: { _form: ["Validation failed"] },
          message: "Validation failed"
        }
      };
    }

    // Return shape with cleared validation
    return {
      ...this.shape,
      state: {
        ...this.shape.state,
        validation: {},
        message: undefined
      }
    };
  }

  // Transform to new shape
  map<U extends BaseShape>(fn: (shape: T) => U): U {
    return fn(this.shape);
  }
}
