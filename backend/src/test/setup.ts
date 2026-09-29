import { vi, beforeAll, afterAll, afterEach } from 'vitest';

vi.mock('../lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    organization: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    invitation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    supportTicket: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    ticketMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    notificationPreference: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    monitoredApi: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    apiCheck: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    alertRule: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    alert: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    incident: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    incidentTimelineEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    integration: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    integrationLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    contact: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    statusPage: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    statusPageItem: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    statusSubscriber: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };

  return {
    default: mockPrisma,
    __mockPrisma: mockPrisma,
  };
});

vi.mock('../utils/jwt', () => {
  const actualJwt = vi.importActual('../utils/jwt');
  return {
    ...actualJwt,
    generateTokens: vi.fn(() => ({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    })),
    verifyAccessToken: vi.fn((token: string) => {
      if (token === 'valid-access-token') {
        return { userId: 'test-user-id', orgId: 'test-org-id', role: 'owner' };
      }
      return null;
    }),
    verifyRefreshToken: vi.fn((token: string) => {
      if (token === 'valid-refresh-token') {
        return { userId: 'test-user-id', orgId: 'test-org-id', role: 'owner' };
      }
      return null;
    }),
  };
});

vi.mock('../utils/hash', () => ({
  hashPassword: vi.fn(async (password: string) => `hashed_${password}`),
  comparePassword: vi.fn(async (password: string, hash: string) => hash === `hashed_${password}`),
}));

vi.mock('../utils/slug', () => ({
  generateSlug: vi.fn((text: string) => text.toLowerCase().replace(/\s+/g, '-')),
  generateUniqueSlug: vi.fn((text: string) => `${text.toLowerCase().replace(/\s+/g, '-')}-abc123`),
}));

vi.mock('../services/activityLog.service', () => ({
  activityLogService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: vi.fn(),
  })),
}));

vi.mock('../middleware/errorHandler.middleware', () => ({
  ApiError: {
    conflict: (message: string) => {
      const error = new Error(message);
      (error as any).statusCode = 409;
      (error as any).code = 'CONFLICT';
      return error;
    },
    unauthorized: (message: string) => {
      const error = new Error(message);
      (error as any).statusCode = 401;
      (error as any).code = 'UNAUTHORIZED';
      return error;
    },
    forbidden: (message: string) => {
      const error = new Error(message);
      (error as any).statusCode = 403;
      (error as any).code = 'FORBIDDEN';
      return error;
    },
    badRequest: (message: string) => {
      const error = new Error(message);
      (error as any).statusCode = 400;
      (error as any).code = 'BAD_REQUEST';
      return error;
    },
  },
}));

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-characters-long';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-characters-long';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
  process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
  process.env.FRONTEND_URL = 'http://localhost:3000';
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});

global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    orgId: 'test-org-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed_password123',
    role: 'member',
    phoneNumber: null,
    timezone: 'UTC',
    isActive: true,
    lastLoginAt: null,
    lastActiveAt: null,
    notificationSettings: {},
    onboardingCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  createMockOrg: (overrides = {}) => ({
    id: 'test-org-id',
    name: 'Test Org',
    slug: 'test-org',
    ownerId: 'test-user-id',
    logoUrl: null,
    website: null,
    industry: null,
    companySize: null,
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
    stripeCustomerId: null,
    billingEmail: null,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  createMockTicket: (overrides = {}) => ({
    id: 'test-ticket-id',
    orgId: 'test-org-id',
    userId: 'test-user-id',
    ticketNumber: 'TICKET-0001',
    title: 'Test Ticket',
    description: 'Test description',
    category: 'technical_support',
    priority: 'medium',
    status: 'open',
    assignedTo: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
    closedAt: null,
    ...overrides,
  }),
  createMockIncident: (overrides = {}) => ({
    id: 'test-incident-id',
    orgId: 'test-org-id',
    apiId: null,
    title: 'Test Incident',
    description: 'Test description',
    severity: 'medium',
    status: 'triggered',
    triggeredAt: new Date(),
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolvedAt: null,
    resolvedBy: null,
    rootCause: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};