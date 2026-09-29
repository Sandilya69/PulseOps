// ============================================
// PulseOps CRM - Request Parameter Helpers
// ============================================

import { Request } from 'express';

/**
 * Safely extract a single string parameter from req.params
 * Express params can be string | string[] depending on route configuration
 */
export function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}

/**
 * Extract multiple parameters at once
 */
export function getParams(req: Request, ...keys: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = getParam(req, key);
  }
  return result;
}