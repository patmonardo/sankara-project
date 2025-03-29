import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from "uuid";
import {
  BaseSchema,
  BaseStateSchema,
  BaseShapeSchema,
  MonetarySchema,
  PeriodSchema,
} from './base'; // Import your schemas

describe('Base Schemas', () => {
  it('should validate a valid BaseSchema', () => {
    const validBase = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = BaseSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('should invalidate a BaseSchema with invalid id', () => {
    const invalidBase = {
      id: 'invalid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = BaseSchema.safeParse(invalidBase);
    expect(result.success).toBe(false);
  });

  it('should validate a valid BaseStateSchema', () => {
    const validBaseState = {
      status: 'active',
    };
    const result = BaseStateSchema.safeParse(validBaseState);
    expect(result.success).toBe(true);
  });

  it('should invalidate a BaseStateSchema with invalid status', () => {
    const invalidBaseState = {
      status: 'invalid',
    };
    const result = BaseStateSchema.safeParse(invalidBaseState);
    expect(result.success).toBe(false);
  });

  it('should validate a valid BaseShapeSchema', () => {
    const validBaseShape = {
      base: {
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      state: {
        status: 'active',
      },
    };
    const result = BaseShapeSchema.safeParse(validBaseShape);
    expect(result.success).toBe(true);
  });

  it('should validate a valid OperationResultSchema', () => {

  });

  it('should validate a valid MonetarySchema', () => {
    const validMonetary = {
      amount: 100,
      currency: 'USD',
    };
    const result = MonetarySchema.safeParse(validMonetary);
    expect(result.success).toBe(true);
  });

  it('should validate a valid PeriodSchema', () => {
    const validPeriod = {
      startDate: new Date(),
      endDate: new Date(),
    };
    const result = PeriodSchema.safeParse(validPeriod);
    expect(result.success).toBe(true);
  });
});
