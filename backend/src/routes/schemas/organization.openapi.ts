import { z } from 'zod';
import { registry, registerPath, commonSchemas, createApiResponse, createPaginatedApiResponse } from '../../lib/swagger';

const OrganizationCreate = z.object({
  name: z.string().min(2).max(255).openapi({ example: 'Acme Corporation' }),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).openapi({ example: 'acme-corp' }),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().max(50).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
  settings: z.record(z.any()).default({}).optional(),
});

const OrganizationUpdate = OrganizationCreate.partial();

const OrganizationResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  ownerId: z.string().uuid(),
  logoUrl: z.string().url().nullable(),
  website: z.string().url().nullable(),
  industry: z.string().nullable(),
  companySize: z.string().nullable(),
  subscriptionTier: z.enum(['free', 'pro', 'team', 'enterprise']),
  subscriptionStatus: z.enum(['active', 'canceled', 'past_due', 'trialing']),
  stripeCustomerId: z.string().nullable(),
  billingEmail: z.string().email().nullable(),
  settings: z.record(z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const MemberResponse = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['owner', 'admin', 'member', 'viewer', 'on_call_engineer']),
  avatarUrl: z.string().url().nullable(),
  phoneNumber: z.string().nullable(),
  timezone: z.string(),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
  lastActiveAt: z.string().datetime().nullable(),
  notificationSettings: z.record(z.any()),
  onboardingCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const UpdateRoleRequest = z.object({
  role: z.enum(['admin', 'member', 'viewer', 'on_call_engineer']).openapi({ example: 'admin' }),
});

const BulkActionRequest = z.object({
  userIds: z.array(z.string().uuid()).min(1).openapi({ example: ['user-id-1', 'user-id-2'] }),
  action: z.enum(['change_role', 'deactivate', 'remove']),
  role: z.enum(['admin', 'member', 'viewer', 'on_call_engineer']).optional(),
});

registry.register('OrganizationCreate', OrganizationCreate);
registry.register('OrganizationUpdate', OrganizationUpdate);
registry.register('OrganizationResponse', OrganizationResponse);
registry.register('MemberResponse', MemberResponse);
registry.register('UpdateRoleRequest', UpdateRoleRequest);
registry.register('BulkActionRequest', BulkActionRequest);

registerPath('post', '/organizations', {
  summary: 'Create organization',
  description: 'Creates a new organization (typically called during signup).',
  tags: ['Organizations'],
  request: {
    body: { content: { 'application/json': { schema: OrganizationCreate } } },
  },
  responses: createApiResponse(OrganizationResponse, 'Organization created'),
  security: true,
});

registerPath('get', '/organizations/{id}', {
  summary: 'Get organization details',
  description: 'Returns organization details by ID.',
  tags: ['Organizations'],
  request: { params: commonSchemas.IdParam },
  responses: createApiResponse(OrganizationResponse, 'Organization details'),
  security: true,
});

registerPath('patch', '/organizations/{id}', {
  summary: 'Update organization',
  description: 'Updates organization settings (Owner/Admin only).',
  tags: ['Organizations'],
  request: {
    params: commonSchemas.IdParam,
    body: { content: { 'application/json': { schema: OrganizationUpdate } } },
  },
  responses: createApiResponse(OrganizationResponse, 'Organization updated'),
  security: true,
});

registerPath('delete', '/organizations/{id}', {
  summary: 'Delete organization',
  description: 'Permanently deletes organization and all data (Owner only).',
  tags: ['Organizations'],
  request: { params: commonSchemas.IdParam },
  responses: { 200: { description: 'Organization deleted' } },
  security: true,
});

registerPath('get', '/organizations/{orgId}/members', {
  summary: 'List organization members',
  description: 'Returns paginated list of organization members with filtering.',
  tags: ['Organizations'],
  request: {
    params: z.object({ orgId: z.string().uuid() }).merge(commonSchemas.PaginationQuery).merge(z.object({
      role: z.enum(['owner', 'admin', 'member', 'viewer', 'on_call_engineer']).optional(),
      status: z.enum(['active', 'inactive']).optional(),
      search: z.string().optional(),
    })),
  },
  responses: createPaginatedApiResponse(MemberResponse, 'Members list'),
  security: true,
});

registerPath('patch', '/organizations/{orgId}/members/{userId}/role', {
  summary: 'Update member role',
  description: 'Changes a member\'s role (Owner/Admin only).',
  tags: ['Organizations'],
  request: {
    params: z.object({ orgId: z.string().uuid(), userId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateRoleRequest } } },
  },
  responses: createApiResponse(MemberResponse, 'Role updated'),
  security: true,
});

registerPath('delete', '/organizations/{orgId}/members/{userId}', {
  summary: 'Remove member',
  description: 'Removes a member from the organization (Owner/Admin only).',
  tags: ['Organizations'],
  request: { params: z.object({ orgId: z.string().uuid(), userId: z.string().uuid() }) },
  responses: { 200: { description: 'Member removed' } },
  security: true,
});

registerPath('post', '/organizations/{orgId}/members/bulk', {
  summary: 'Bulk member actions',
  description: 'Performs bulk actions on multiple members (Owner/Admin only).',
  tags: ['Organizations'],
  request: {
    params: z.object({ orgId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: BulkActionRequest } } },
  },
  responses: { 200: { description: 'Bulk action completed' } },
  security: true,
});

registerPath('get', '/organizations/{orgId}/members/{userId}/activity', {
  summary: 'Get member activity',
  description: 'Returns paginated activity log for a specific member.',
  tags: ['Organizations'],
  request: {
    params: z.object({ orgId: z.string().uuid(), userId: z.string().uuid() }).merge(commonSchemas.PaginationQuery),
  },
  responses: createPaginatedApiResponse(z.object({}), 'Member activity'),
  security: true,
});