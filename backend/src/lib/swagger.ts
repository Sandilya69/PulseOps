import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

registry.registerComponent('schemas', 'Error', {
  type: 'object',
  properties: {
    statusCode: { type: 'integer', example: 400 },
    code: { type: 'string', example: 'BAD_REQUEST' },
    message: { type: 'string', example: 'Invalid input' },
    details: { type: 'object', nullable: true },
  },
});

registry.registerComponent('schemas', 'PaginatedResponse', {
  type: 'object',
  properties: {
    data: { type: 'array', items: { type: 'object' } },
    meta: {
      type: 'object',
      properties: {
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 20 },
        total: { type: 'integer', example: 100 },
        totalPages: { type: 'integer', example: 5 },
      },
    },
  },
});

export const commonSchemas = {
  IdParam: z.object({
    id: z.string().uuid().openapi({ param: { name: 'id', in: 'path' } }),
  }),
  PaginationQuery: z.object({
    page: z.coerce.number().int().positive().default(1).openapi({ example: 1 }),
    limit: z.coerce.number().int().positive().max(100).default(20).openapi({ example: 20 }),
  }),
  DateRangeQuery: z.object({
    startDate: z.string().datetime().optional().openapi({ example: '2024-01-01T00:00:00Z' }),
    endDate: z.string().datetime().optional().openapi({ example: '2024-12-31T23:59:59Z' }),
  }),
};

export function createApiResponse<T extends z.ZodTypeAny>(schema: T, description = 'Success') {
  return {
    [200]: {
      description,
      content: {
        'application/json': { schema },
      },
    },
  };
}

export function createPaginatedApiResponse<T extends z.ZodTypeAny>(itemSchema: T, description = 'Success') {
  return {
    [200]: {
      description,
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(itemSchema),
            meta: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
  };
}

export const errorResponses = {
  400: { description: 'Bad Request', content: { 'application/json': { schema: z.lazy(() => registry.components.schemas['Error']!) } } },
  401: { description: 'Unauthorized', content: { 'application/json': { schema: z.lazy(() => registry.components.schemas['Error']!) } } },
  403: { description: 'Forbidden', content: { 'application/json': { schema: z.lazy(() => registry.components.schemas['Error']!) } } },
  404: { description: 'Not Found', content: { 'application/json': { schema: z.lazy(() => registry.components.schemas['Error']!) } } },
  409: { description: 'Conflict', content: { 'application/json': { schema: z.lazy(() => registry.components.schemas['Error']!) } } },
  422: { description: 'Unprocessable Entity', content: { 'application/json': { schema: z.lazy(() => registry.components.schemas['Error']!) } } },
  500: { description: 'Internal Server Error', content: { 'application/json': { schema: z.lazy(() => registry.components.schemas['Error']!) } } },
};

export function registerPath(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  options: {
    summary: string;
    description?: string;
    tags: string[];
    request?: any;
    responses: Record<string, any>;
    security?: boolean;
  }
) {
  registry.registerPath({
    method,
    path: `/api${path}`,
    summary: options.summary,
    description: options.description,
    tags: options.tags,
    request: options.request,
    responses: {
      ...options.responses,
      ...errorResponses,
    },
    security: options.security ? [{ bearerAuth: [] }] : undefined,
  });
}