import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../lib/prisma';
import { 
  createInvitation, 
  acceptInvitation, 
  getInvitations, 
  revokeInvitation,
  resendInvitation 
} from './invitation.service';
import { activityLogService } from './activityLog.service';

const mockPrisma = prisma as any;

describe('Invitation Service', () => {
  const mockInvitation = {
    id: 'inv-1',
    orgId: 'org-1',
    email: 'new@example.com',
    role: 'member',
    invitedBy: 'user-1',
    token: 'invite-token-abc123',
    message: 'Welcome!',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    acceptedAt: null,
    status: 'pending',
    createdAt: new Date(),
  };

  const mockOrg = {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    ownerId: 'user-1',
  };

  const mockUser = {
    id: 'user-1',
    orgId: 'org-1',
    email: 'owner@example.com',
    name: 'Owner',
    role: 'owner',
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInvitation', () => {
    it('should create invitation successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue(mockInvitation);
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, email: 'new@example.com', name: 'New User' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await createInvitation({
        orgId: 'org-1',
        email: 'new@example.com',
        role: 'member',
        invitedBy: 'user-1',
        message: 'Welcome!',
      });

      expect(result).toEqual(mockInvitation);
      expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: 'org-1',
            email: 'new@example.com',
            role: 'member',
            invitedBy: 'user-1',
            message: 'Welcome!',
            token: expect.any(String),
          }),
        })
      );
    });

    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(createInvitation({
        orgId: 'org-1',
        email: 'new@example.com',
        role: 'member',
        invitedBy: 'user-1',
      })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw if organization not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(createInvitation({
        orgId: 'org-1',
        email: 'new@example.com',
        role: 'member',
        invitedBy: 'user-1',
      })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw if user already member', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser).mockResolvedValueOnce({
        id: 'existing-user',
        orgId: 'org-1',
        email: 'new@example.com',
      });

      await expect(createInvitation({
        orgId: 'org-1',
        email: 'new@example.com',
        role: 'member',
        invitedBy: 'user-1',
      })).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    });

    it('should throw if pending invitation exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.invitation.findFirst.mockResolvedValue({ ...mockInvitation, status: 'pending' });

      await expect(createInvitation({
        orgId: 'org-1',
        email: 'new@example.com',
        role: 'member',
        invitedBy: 'user-1',
      })).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const acceptedInvitation = { ...mockInvitation, status: 'accepted', acceptedAt: new Date() };
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.invitation.update.mockResolvedValue(acceptedInvitation);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        orgId: 'org-1',
        email: 'new@example.com',
        name: 'New User',
        role: 'member',
        passwordHash: 'hashed_password',
      });
      mockPrisma.notificationPreference.create.mockResolvedValue({ userId: 'new-user-id' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await acceptInvitation('invite-token-abc123', {
        name: 'New User',
        password: 'password123',
      });

      expect(result.status).toBe('accepted');
      expect(result.acceptedAt).toBeDefined();
    });

    it('should throw if invitation not found', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(null);

      await expect(acceptInvitation('invalid-token', { name: 'New User', password: 'password123' }))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw if invitation expired', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 1000),
        status: 'pending',
      });

      await expect(acceptInvitation('expired-token', { name: 'New User', password: 'password123' }))
        .rejects.toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    });

    it('should throw if invitation already accepted', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        status: 'accepted',
        acceptedAt: new Date(),
      });

      await expect(acceptInvitation('accepted-token', { name: 'New User', password: 'password123' }))
        .rejects.toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    });
  });

  describe('getInvitations', () => {
    it('should return paginated invitations', async () => {
      mockPrisma.invitation.findMany.mockResolvedValue([mockInvitation]);
      mockPrisma.invitation.count.mockResolvedValue(1);

      const result = await getInvitations('org-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('should filter by status', async () => {
      mockPrisma.invitation.findMany.mockResolvedValue([mockInvitation]);
      mockPrisma.invitation.count.mockResolvedValue(1);

      await getInvitations('org-1', { page: 1, limit: 20, status: 'pending' });

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', status: 'pending' }),
        })
      );
    });
  });

  describe('revokeInvitation', () => {
    it('should revoke invitation', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.invitation.update.mockResolvedValue({ ...mockInvitation, status: 'revoked' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await revokeInvitation('inv-1', 'user-1');

      expect(result.status).toBe('revoked');
    });

    it('should throw if invitation not found', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(null);

      await expect(revokeInvitation('invalid-id', 'user-1'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation with new token and expiry', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue({ ...mockInvitation, status: 'pending' });
      mockPrisma.invitation.update.mockResolvedValue({ 
        ...mockInvitation, 
        token: 'new-token-xyz789',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await resendInvitation('inv-1', 'user-1');

      expect(result.token).not.toBe(mockInvitation.token);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });
});