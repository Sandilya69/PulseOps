import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../lib/prisma';
import { activityLogService } from './activityLog.service';

const mockPrisma = prisma as any;

describe('Activity Log Service', () => {
  const mockActivity = {
    id: 'act-1',
    orgId: 'org-1',
    userId: 'user-1',
    action: 'user.login',
    resourceType: 'user',
    resourceId: 'user-1',
    resourceName: 'Test User',
    changes: null,
    metadata: { ip: '127.0.0.1' },
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    createdAt: new Date(),
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com', avatarUrl: null },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should create activity log', async () => {
      mockPrisma.activityLog.create.mockResolvedValue(mockActivity);

      const result = await activityLogService.log({
        orgId: 'org-1',
        userId: 'user-1',
        action: 'user.login',
        resourceType: 'user',
        resourceId: 'user-1',
        resourceName: 'Test User',
        metadata: { ip: '127.0.0.1' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: 'org-1',
            userId: 'user-1',
            action: 'user.login',
          }),
        })
      );
    });

    it('should work without optional fields', async () => {
      mockPrisma.activityLog.create.mockResolvedValue({ ...mockActivity, userId: null, metadata: null });

      const result = await activityLogService.log({
        orgId: 'org-1',
        action: 'system.startup',
      });

      expect(result.action).toBe('system.startup');
      expect(result.userId).toBeNull();
    });
  });

  describe('getActivityLogs', () => {
    it('should return paginated logs', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      const result = await activityLogService.getActivityLogs('org-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('should filter by action', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      await activityLogService.getActivityLogs('org-1', { page: 1, limit: 20, action: 'user.login' });

      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', action: 'user.login' }),
        })
      );
    });

    it('should filter by resource type', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      await activityLogService.getActivityLogs('org-1', { page: 1, limit: 20, resourceType: 'user' });

      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', resourceType: 'user' }),
        })
      );
    });

    it('should filter by date range', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await activityLogService.getActivityLogs('org-1', { page: 1, limit: 20, startDate, endDate });

      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: 'org-1',
            createdAt: expect.objectContaining({ gte: startDate, lte: endDate }),
          }),
        })
      );
    });

    it('should search in resource name', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      await activityLogService.getActivityLogs('org-1', { page: 1, limit: 20, search: 'Test User' });

      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: 'org-1',
            resourceName: { contains: 'Test User', mode: 'insensitive' },
          }),
        })
      );
    });
  });

  describe('getActivityLogById', () => {
    it('should return activity log by id', async () => {
      mockPrisma.activityLog.findUnique.mockResolvedValue(mockActivity);

      const result = await activityLogService.getActivityLogById('act-1', 'org-1');

      expect(result).toEqual(mockActivity);
    });

    it('should throw if not found', async () => {
      mockPrisma.activityLog.findUnique.mockResolvedValue(null);

      await expect(activityLogService.getActivityLogById('invalid-id', 'org-1'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getActivityStats', () => {
    it('should return activity statistics', async () => {
      mockPrisma.activityLog.groupBy
        .mockResolvedValueOnce([
          { action: 'user.login', _count: { action: 50 } },
          { action: 'api.create', _count: { action: 10 } },
        ])
        .mockResolvedValueOnce([
          { resourceType: 'user', _count: { resourceType: 30 } },
          { resourceType: 'api', _count: { resourceType: 20 } },
        ]);

      const result = await activityLogService.getActivityStats('org-1');

      expect(result.byAction).toEqual({ 'user.login': 50, 'api.create': 10 });
      expect(result.byResource).toEqual({ user: 30, api: 20 });
    });
  });

  describe('exportActivityLogs', () => {
    it('should return all logs for export', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([mockActivity]);

      const result = await activityLogService.exportActivityLogs('org-1', { startDate: new Date('2024-01-01') });

      expect(result).toHaveLength(1);
      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1' }),
          orderBy: { createdAt: 'desc' },
          take: undefined,
        })
      );
    });
  });
});