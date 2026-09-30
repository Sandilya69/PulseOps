import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const ErrorSchema = z.object({
  statusCode: z.number().int().openapi({ example: 400 }),
  code: z.string().openapi({ example: 'BAD_REQUEST' }),
  message: z.string().openapi({ example: 'Invalid input' }),
  details: z.record(z.any()).nullable().optional(),
});

registry.register('Error', ErrorSchema);

const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  meta: z.object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 20 }),
    total: z.number().int().openapi({ example: 100 }),
    totalPages: z.number().int().openapi({ example: 5 }),
  }),
});

registry.register('PaginatedResponse', PaginatedResponseSchema);

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
  400: { description: 'Bad Request', content: { 'application/json': { schema: ErrorSchema } } },
  401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Forbidden', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'Not Found', content: { 'application/json': { schema: ErrorSchema } } },
  409: { description: 'Conflict', content: { 'application/json': { schema: ErrorSchema } } },
  422: { description: 'Unprocessable Entity', content: { 'application/json': { schema: ErrorSchema } } },
  500: { description: 'Internal Server Error', content: { 'application/json': { schema: ErrorSchema } } },
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