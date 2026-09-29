import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../lib/prisma';
import { signup, login, refreshToken, logout, getMe, googleOAuth, githubOAuth } from './auth.service';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { generateUniqueSlug } from '../utils/slug';
import { activityLogService } from './activityLog.service';
import axios from 'axios';

const mockPrisma = prisma as any;

describe('Auth Service', () => {
  const mockUser = {
    id: 'test-user-id',
    orgId: 'test-org-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed_password123',
    role: 'owner',
    isActive: true,
    lastLoginAt: null,
    lastActiveAt: null,
    avatarUrl: null,
    onboardingCompleted: false,
    organization: {
      id: 'test-org-id',
      name: 'Test Org',
      slug: 'test-org',
      subscriptionTier: 'free',
    },
    notificationSettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrg = {
    id: 'test-org-id',
    name: 'Test Org',
    slug: 'test-org',
    ownerId: 'test-user-id',
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('should create user and organization successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        const mockTx = {
          organization: {
            create: vi.fn().mockResolvedValue({ id: 'test-org-id', name: "Test User's Organization", slug: 'test-user-organization-abc123' }),
            update: vi.fn().mockResolvedValue({}),
          },
          user: {
            create: vi.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', name: 'Test User', role: 'owner', orgId: 'test-org-id' }),
          },
          notificationPreference: {
            create: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
          },
        };
        return cb(mockTx);
      });
      (generateTokens as any).mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await signup({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('owner');
      expect(result.organization).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
    });

    it('should throw conflict error if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user', email: 'test@example.com' });

      await expect(signup({ name: 'Test User', email: 'test@example.com', password: 'password123' }))
        .rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    });

    it('should use custom organization name if provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        const mockTx = {
          organization: {
            create: vi.fn().mockResolvedValue({ id: 'test-org-id', name: 'Custom Org', slug: 'custom-org-abc123' }),
            update: vi.fn().mockResolvedValue({}),
          },
          user: {
            create: vi.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', name: 'Test User', role: 'owner', orgId: 'test-org-id' }),
          },
          notificationPreference: {
            create: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
          },
        };
        return cb(mockTx);
      });
      (generateTokens as any).mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await signup({ name: 'Test User', email: 'test@example.com', password: 'password123', organizationName: 'Custom Org' });

      expect(result.organization.name).toBe('Custom Org');
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (comparePassword as any).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      (generateTokens as any).mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await login({ email: 'test@example.com', password: 'password123' });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({ lastLoginAt: expect.any(Date), lastActiveAt: expect.any(Date) }),
      });
    });

    it('should throw unauthorized if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(login({ email: 'nonexistent@example.com', password: 'password123' }))
        .rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    });

    it('should throw forbidden if user is deactivated', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(login({ email: 'test@example.com', password: 'password123' }))
        .rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    });

    it('should throw unauthorized if password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (comparePassword as any).mockResolvedValue(false);

      await expect(login({ email: 'test@example.com', password: 'wrongpassword' }))
        .rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      (verifyRefreshToken as any).mockReturnValue({ userId: 'test-user-id', orgId: 'test-org-id', role: 'owner' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (generateTokens as any).mockReturnValue({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });

      const result = await refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw unauthorized for invalid refresh token', async () => {
      (verifyRefreshToken as any).mockReturnValue(null);

      await expect(refreshToken('invalid-token'))
        .rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    });

    it('should throw unauthorized if user no longer exists', async () => {
      (verifyRefreshToken as any).mockReturnValue({ userId: 'test-user-id', orgId: 'test-org-id', role: 'owner' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(refreshToken('valid-refresh-token'))
        .rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    });

    it('should throw unauthorized if user is deactivated', async () => {
      (verifyRefreshToken as any).mockReturnValue({ userId: 'test-user-id', orgId: 'test-org-id', role: 'owner' });
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(refreshToken('valid-refresh-token'))
        .rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    });
  });

  describe('logout', () => {
    it('should log activity', async () => {
      (activityLogService.log as any).mockResolvedValue(undefined);

      await logout('test-user-id', 'test-org-id');

      expect(activityLogService.log).toHaveBeenCalledWith({
        orgId: 'test-org-id',
        userId: 'test-user-id',
        action: 'user.logout',
        resourceType: 'user',
        resourceId: 'test-user-id',
      });
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getMe('test-user-id');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: expect.any(Object),
      });
    });
  });

  describe('googleOAuth', () => {
    it('should create new user and org for new email', async () => {
      (axios.get as any).mockResolvedValue({ data: { email: 'new@example.com', name: 'New User', picture: 'https://example.com/avatar.jpg' } });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        const mockTx = {
          organization: {
            create: vi.fn().mockResolvedValue({ id: 'new-org-id', name: "New User's Workspace", slug: 'new-user-workspace-abc123' }),
            update: vi.fn().mockResolvedValue({}),
          },
          user: {
            create: vi.fn().mockResolvedValue({ id: 'new-user-id', email: 'new@example.com', name: 'New User', role: 'owner', orgId: 'new-org-id', avatarUrl: 'https://example.com/avatar.jpg' }),
          },
          notificationPreference: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return cb(mockTx);
      });
      (generateTokens as any).mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await googleOAuth('valid-google-access-token');

      expect(result.user.email).toBe('new@example.com');
      expect(result.user.role).toBe('owner');
      expect(result.tokens).toBeDefined();
    });

    it('should login existing user', async () => {
      (axios.get as any).mockResolvedValue({ data: { email: 'test@example.com', name: 'Test User', picture: 'https://example.com/avatar.jpg' } });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (generateTokens as any).mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await googleOAuth('valid-google-access-token');

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
    });

    it('should throw error for invalid Google token', async () => {
      (axios.get as any).mockResolvedValue({ data: { name: 'No Email' } });

      await expect(googleOAuth('invalid-token'))
        .rejects.toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    });
  });

  describe('githubOAuth', () => {
    it('should create new user and org for new email', async () => {
      (axios.post as any).mockResolvedValue({ data: { access_token: 'github-access-token' } });
      (axios.get as any)
        .mockResolvedValueOnce({ data: { name: 'GitHub User', login: 'githubuser', avatar_url: 'https://github.com/avatar.jpg' } })
        .mockResolvedValueOnce({ data: [{ email: 'github@example.com', primary: true }] });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        const mockTx = {
          organization: {
            create: vi.fn().mockResolvedValue({ id: 'new-org-id', name: "GitHub User's Workspace", slug: 'github-user-workspace-abc123' }),
            update: vi.fn().mockResolvedValue({}),
          },
          user: {
            create: vi.fn().mockResolvedValue({ id: 'new-user-id', email: 'github@example.com', name: 'GitHub User', role: 'owner', orgId: 'new-org-id', avatarUrl: 'https://github.com/avatar.jpg' }),
          },
          notificationPreference: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return cb(mockTx);
      });
      (generateTokens as any).mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await githubOAuth('github-code');

      expect(result.user.email).toBe('github@example.com');
      expect(result.user.role).toBe('owner');
      expect(result.tokens).toBeDefined();
    });

    it('should throw error if no primary email', async () => {
      (axios.post as any).mockResolvedValue({ data: { access_token: 'github-access-token' } });
      (axios.get as any)
        .mockResolvedValueOnce({ data: { name: 'GitHub User', login: 'githubuser', avatar_url: 'https://github.com/avatar.jpg' } })
        .mockResolvedValueOnce({ data: [{ email: 'private@example.com', primary: false }] });

      await expect(githubOAuth('github-code'))
        .rejects.toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    });
  });
});