import { describe, it, expect } from 'vitest';
import { hasPermission, getPermissionsForRole, isRoleAtLeast, canChangeRole } from './permissions';
import { UserRole } from '@prisma/client';

describe('Permissions', () => {
  describe('hasPermission', () => {
    it('should return true for owner with any permission', () => {
      const permissions = [
        'api.create', 'api.delete', 'user.invite', 'org.delete',
        'ticket.view_all', 'org.billing', 'org.transfer_ownership',
      ];
      for (const perm of permissions) {
        expect(hasPermission('owner', perm as any)).toBe(true);
      }
    });

    it('should return true for admin with admin permissions', () => {
      expect(hasPermission('admin', 'api.create')).toBe(true);
      expect(hasPermission('admin', 'user.invite')).toBe(true);
      expect(hasPermission('admin', 'org.update')).toBe(true);
      expect(hasPermission('admin', 'ticket.assign')).toBe(true);
    });

    it('should return false for admin with owner-only permissions', () => {
      expect(hasPermission('admin', 'org.delete')).toBe(false);
      expect(hasPermission('admin', 'org.billing')).toBe(false);
      expect(hasPermission('admin', 'org.transfer_ownership')).toBe(false);
    });

    it('should return true for member with member permissions', () => {
      expect(hasPermission('member', 'api.create')).toBe(true);
      expect(hasPermission('member', 'incident.acknowledge')).toBe(true);
      expect(hasPermission('member', 'ticket.create')).toBe(true);
    });

    it('should return false for member with admin permissions', () => {
      expect(hasPermission('member', 'user.invite')).toBe(false);
      expect(hasPermission('member', 'api.delete')).toBe(false);
      expect(hasPermission('member', 'org.update')).toBe(false);
    });

    it('should return true for viewer with read permissions', () => {
      expect(hasPermission('viewer', 'api.view')).toBe(true);
      expect(hasPermission('viewer', 'incident.view')).toBe(true);
      expect(hasPermission('viewer', 'ticket.view')).toBe(true);
    });

    it('should return false for viewer with write permissions', () => {
      expect(hasPermission('viewer', 'api.create')).toBe(false);
      expect(hasPermission('viewer', 'incident.acknowledge')).toBe(false);
      expect(hasPermission('viewer', 'ticket.create')).toBe(false);
    });

    it('should return true for on_call_engineer with incident permissions', () => {
      expect(hasPermission('on_call_engineer', 'incident.acknowledge')).toBe(true);
      expect(hasPermission('on_call_engineer', 'incident.resolve')).toBe(true);
      expect(hasPermission('on_call_engineer', 'incident.note_add')).toBe(true);
    });

    it('should return false for unknown permission', () => {
      expect(hasPermission('owner', 'unknown.permission' as any)).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for owner', () => {
      const permissions = getPermissionsForRole('owner');
      expect(permissions.length).toBeGreaterThan(50);
    });

    it('should return fewer permissions for viewer', () => {
      const viewerPerms = getPermissionsForRole('viewer');
      const ownerPerms = getPermissionsForRole('owner');
      expect(viewerPerms.length).toBeLessThan(ownerPerms.length);
    });

    it('should include only read permissions for viewer', () => {
      const viewerPerms = getPermissionsForRole('viewer');
      for (const perm of viewerPerms) {
        expect(perm).toMatch(/\.(view|export)$/);
      }
    });
  });

  describe('isRoleAtLeast', () => {
    it('should return true when role matches exactly', () => {
      expect(isRoleAtLeast('admin', 'admin')).toBe(true);
      expect(isRoleAtLeast('member', 'member')).toBe(true);
    });

    it('should return true when role is higher than required', () => {
      expect(isRoleAtLeast('owner', 'admin')).toBe(true);
      expect(isRoleAtLeast('admin', 'member')).toBe(true);
      expect(isRoleAtLeast('on_call_engineer', 'member')).toBe(true);
    });

    it('should return false when role is lower than required', () => {
      expect(isRoleAtLeast('member', 'admin')).toBe(false);
      expect(isRoleAtLeast('viewer', 'member')).toBe(false);
    });
  });

  describe('canChangeRole', () => {
    it('should allow owner to change any role to any role', () => {
      expect(canChangeRole('owner', 'member', 'admin')).toBe(true);
      expect(canChangeRole('owner', 'admin', 'owner')).toBe(true);
      expect(canChangeRole('owner', 'viewer', 'on_call_engineer')).toBe(true);
    });

    it('should allow admin to promote member to on_call_engineer', () => {
      expect(canChangeRole('admin', 'member', 'on_call_engineer')).toBe(true);
      expect(canChangeRole('admin', 'viewer', 'member')).toBe(true);
    });

    it('should not allow admin to promote to owner or admin', () => {
      expect(canChangeRole('admin', 'member', 'owner')).toBe(false);
      expect(canChangeRole('admin', 'member', 'admin')).toBe(false);
    });

    it('should not allow admin to change other admins or owners', () => {
      expect(canChangeRole('admin', 'admin', 'member')).toBe(false);
      expect(canChangeRole('admin', 'owner', 'member')).toBe(false);
    });

    it('should not allow member to change any roles', () => {
      expect(canChangeRole('member', 'viewer', 'member')).toBe(false);
      expect(canChangeRole('member', 'member', 'viewer')).toBe(false);
    });

    it('should not allow viewer to change any roles', () => {
      expect(canChangeRole('viewer', 'viewer', 'member')).toBe(false);
    });
  });
});