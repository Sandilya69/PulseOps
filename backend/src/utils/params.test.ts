import { describe, it, expect } from 'vitest';
import { getParam, getParams } from './params.js';
import { Request } from 'express';

function createMockRequest(params: Record<string, string>): Partial<Request> {
  return { params };
}

describe('params utils', () => {
  describe('getParam', () => {
    it('should extract a single parameter', () => {
      const req = createMockRequest({ id: '123' });
      expect(getParam(req as Request, 'id')).toBe('123');
    });

    it('should return undefined for missing param', () => {
      const req = createMockRequest({});
      expect(getParam(req as Request, 'missing')).toBeUndefined();
    });

    it('should handle array params by returning first', () => {
      const req = { params: { ids: ['1', '2', '3'] } } as Partial<Request>;
      expect(getParam(req as Request, 'ids')).toBe('1');
    });
  });

  describe('getParams', () => {
    it('should extract multiple parameters', () => {
      const req = createMockRequest({ id: '123', orgId: '456' });
      const result = getParams(req as Request, 'id', 'orgId');
      expect(result).toEqual({ id: '123', orgId: '456' });
    });

    it('should return empty object for no keys', () => {
      const req = createMockRequest({ id: '123' });
      const result = getParams(req as Request);
      expect(result).toEqual({});
    });

    it('should handle missing keys', () => {
      const req = createMockRequest({ id: '123' });
      const result = getParams(req as Request, 'id', 'missing');
      expect(result).toEqual({ id: '123', missing: undefined });
    });
  });
});