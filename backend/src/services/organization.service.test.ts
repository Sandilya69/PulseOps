import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../lib/prisma';
import { 
  createOrganization, 
  getOrganization, 
  updateOrganization, 
  deleteOrganization,
  getOrganizationMembers,
  updateMemberRole,
  removeMember,
  getMemberActivity
} from './organization.service';
import { activityLogService } from './activityLog.service';

const mockPrisma = prisma as any;

describe('Organization Service', () => {
  const mockOwner = {
    id: 'owner-1',
    orgId: 'org-1',
    email: 'owner@example.com',
    name: 'Owner',
    role: 'owner',
    isActive: true,
  };

  const mockAdmin = {
    id: 'admin-1',
    orgId: 'org-1',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'admin',
    isActive: true,
  };

  const mockMember = {
    id: 'member-1',
    orgId: 'org-1',
    email: 'member@example.com',
    name: 'Member',
    role: 'member',
    isActive: true,
  };

  const mockOrg = {
    id: 'org-1',
    name: 'Test Organization',
    slug: 'test-organization',
    ownerId: 'owner-1',
    logoUrl: null,
    website: 'https://example.com',
    industry: 'technology',
    companySize: '11-50',
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create organization successfully', async () => {
      mockPrisma.organization.create.mockResolvedValue(mockOrg);
      mockPrisma.user.update.mockResolvedValue({ ...mockOwner, orgId: 'org-1' });
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await createOrganization({
        name: 'Test Organization',
        ownerId: 'owner-1',
        slug: 'test-organization',
      });

      expect(result).toEqual(mockOrg);
      expect(mockPrisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Organization',
            ownerId: 'owner-1',
            slug: 'test-organization',
          }),
        })
      );
    });
  });

  describe('getOrganization', () => {
    it('should return organization', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await getOrganization('org-1');

      expect(result).toEqual(mockOrg);
    });

    it('should throw if not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(getOrganization('invalid-id'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateOrganization', () => {
    it('should update organization', async () => {
      const updatedOrg = { ...mockOrg, name: 'Updated Org', website: 'https://updated.com' };
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.organization.update.mockResolvedValue(updatedOrg);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await updateOrganization('org-1', { name: 'Updated Org', website: 'https://updated.com' });

      expect(result.name).toBe('Updated Org');
      expect(result.website).toBe('https://updated.com');
    });

    it('should throw if slug already taken', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.organization.findUnique.mockResolvedValueOnce(mockOrg).mockResolvedValueOnce({
        id: 'org-2',
        slug: 'taken-slug',
      });

      await expect(updateOrganization('org-1', { slug: 'taken-slug' }))
        .rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.organization.delete.mockResolvedValue({});
      (activityLogService.log as any).mockResolvedValue(undefined);

      await deleteOrganization('org-1', 'owner-1');

      expect(mockPrisma.organization.delete).toHaveBeenCalledWith({ where: { id: 'org-1' } });
    });

    it('should throw if not owner', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ ...mockOrg, ownerId: 'owner-1' });

      await expect(deleteOrganization('org-1', 'admin-1'))
        .rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    });
  });

  describe('getOrganizationMembers', () => {
    it('should return paginated members', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockOwner, mockAdmin, mockMember]);
      mockPrisma.user.count.mockResolvedValue(3);

      const result = await getOrganizationMembers('org-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(3);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 3, totalPages: 1 });
    });

    it('should filter by role', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockAdmin]);
      mockPrisma.user.count.mockResolvedValue(1);

      await getOrganizationMembers('org-1', { page: 1, limit: 20, role: 'admin' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', role: 'admin' }),
        })
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      const updatedMember = { ...mockMember, role: 'admin' };
      mockPrisma.user.findUnique.mockResolvedValue(mockMember);
      mockPrisma.user.update.mockResolvedValue(updatedMember);
      (activityLogService.log as any).mockResolvedValue(undefined);

      const result = await updateMemberRole('org-1', 'member-1', 'admin', 'owner-1');

      expect(result.role).toBe('admin');
    });

    it('should throw if trying to change owner role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);

      await expect(updateMemberRole('org-1', 'owner-1', 'member', 'admin-1'))
        .rejects.toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    });

    it('should throw if trying to assign owner role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockMember);

      await expect(updateMemberRole('org-1', 'member-1', 'owner', 'admin-1'))
        .rejects.toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    });
  });

  describe('removeMember', () => {
    it('should remove member', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockMember);
      mockPrisma.user.delete.mockResolvedValue({});
      (activityLogService.log as any).mockResolvedValue(undefined);

      await removeMember('org-1', 'member-1', 'admin-1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'member-1' } });
    });

    it('should throw if trying to remove owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);

      await expect(removeMember('org-1', 'owner-1', 'admin-1'))
        .rejects.toMatchObject({ statusCode: 400, code: 'BAD_REQUEST' });
    });

    it('should throw if member not in org', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockMember, orgId: 'org-2' });

      await expect(removeMember('org-1', 'member-1', 'admin-1'))
        .rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    });
  });

  describe('getMemberActivity', () => {
    it('should return member activity', async () => {
      const mockActivity = [
        { id: 'act-1', userId: 'member-1', action: 'user.login', createdAt: new Date() },
      ];
      mockPrisma.activityLog.findMany.mockResolvedValue(mockActivity);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      const result = await getMemberActivity('org-1', 'member-1', { page: 1, limit: 20 });

      expect(result.data).toEqual(mockActivity);
      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: 'org-1', userId: 'member-1' }),
        })
      );
    });
  });
});