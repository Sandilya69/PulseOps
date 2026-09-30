import { z } from 'zod';
import { registry, registerPath, commonSchemas, createApiResponse, createPaginatedApiResponse } from '../lib/swagger';

const SignupRequest = z.object({
  name: z.string().min(2).max(100).openapi({ example: 'John Doe' }),
  email: z.string().email().openapi({ example: 'john@example.com' }),
  password: z.string().min(8).max(100).openapi({ example: 'SecurePass123!' }),
  organizationName: z.string().max(100).optional().openapi({ example: 'Acme Corp' }),
});

const LoginRequest = z.object({
  email: z.string().email().openapi({ example: 'john@example.com' }),
  password: z.string().min(1).openapi({ example: 'SecurePass123!' }),
  rememberMe: z.boolean().default(false).optional(),
});

const TokenResponse = z.object({
  accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIs...' }),
  refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIs...' }),
});

const UserResponse = z.object({
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
  onboardingCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

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
  settings: z.record(z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const AuthResponse = z.object({
  user: UserResponse,
  organization: OrganizationResponse,
  tokens: TokenResponse,
});

const RefreshTokenRequest = z.object({
  refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIs...' }),
});

const OAuthRequest = z.object({
  code: z.string().optional(),
  accessToken: z.string().optional(),
});

registry.register('SignupRequest', SignupRequest);
registry.register('LoginRequest', LoginRequest);
registry.register('TokenResponse', TokenResponse);
registry.register('UserResponse', UserResponse);
registry.register('OrganizationResponse', OrganizationResponse);
registry.register('AuthResponse', AuthResponse);
registry.register('RefreshTokenRequest', RefreshTokenRequest);
registry.register('OAuthRequest', OAuthRequest);

registerPath('post', '/auth/signup', {
  summary: 'Register new user and organization',
  description: 'Creates a new user account with an organization. Returns user, organization, and JWT tokens.',
  tags: ['Authentication'],
  request: {
    body: { content: { 'application/json': { schema: SignupRequest } } },
  },
  responses: createApiResponse(AuthResponse, 'User registered successfully'),
  security: false,
});

registerPath('post', '/auth/login', {
  summary: 'User login',
  description: 'Authenticates user with email and password. Returns user, organization, and JWT tokens.',
  tags: ['Authentication'],
  request: {
    body: { content: { 'application/json': { schema: LoginRequest } } },
  },
  responses: createApiResponse(AuthResponse, 'Login successful'),
  security: false,
});

registerPath('post', '/auth/refresh', {
  summary: 'Refresh access token',
  description: 'Generates new access and refresh tokens using a valid refresh token.',
  tags: ['Authentication'],
  request: {
    body: { content: { 'application/json': { schema: RefreshTokenRequest } } },
  },
  responses: createApiResponse(TokenResponse, 'Tokens refreshed'),
  security: false,
});

registerPath('post', '/auth/logout', {
  summary: 'User logout',
  description: 'Logs out the current user (logs activity).',
  tags: ['Authentication'],
  responses: { 200: { description: 'Logged out successfully' } },
  security: true,
});

registerPath('get', '/auth/me', {
  summary: 'Get current user profile',
  description: 'Returns the authenticated user\'s profile with organization details.',
  tags: ['Authentication'],
  responses: createApiResponse(z.object({ user: UserResponse, organization: OrganizationResponse }), 'User profile'),
  security: true,
});

registerPath('post', '/auth/google', {
  summary: 'Google OAuth login/signup',
  description: 'Authenticates or registers user via Google OAuth.',
  tags: ['Authentication'],
  request: {
    body: { content: { 'application/json': { schema: OAuthRequest } } },
  },
  responses: createApiResponse(AuthResponse, 'Google auth successful'),
  security: false,
});

registerPath('post', '/auth/github', {
  summary: 'GitHub OAuth login/signup',
  description: 'Authenticates or registers user via GitHub OAuth.',
  tags: ['Authentication'],
  request: {
    body: { content: { 'application/json': { schema: OAuthRequest } } },
  },
  responses: createApiResponse(AuthResponse, 'GitHub auth successful'),
  security: false,
});