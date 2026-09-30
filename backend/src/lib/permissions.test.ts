import { describe, it, expect } from 'vitest';
import { 
  hasPermission, 
  getPermissionsForRole, 
  isRoleAtLeast, 
  canChangeRole,
  permissionMap 
} from './permissions';
import { UserRole } from '@prisma/client';

describe('Permissions', () => {
  const allRoles: UserRole[] = ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'];
  const allPermissions = Object.keys(permissionMap) as (keyof typeof permissionMap)[];

  describe('hasPermission', () => {
    it('should return true for allowed roles', () => {
      expect(hasPermission('owner', 'api.create')).toBe(true);
      expect(hasPermission('admin', 'api.create')).toBe(true);
      expect(hasPermission('member', 'api.create')).toBe(true);
      expect(hasPermission('owner', 'api.view')).toBe(true);
      expect(hasPermission('viewer', 'api.view')).toBe(true);
      expect(hasPermission('on_call_engineer', 'api.view')).toBe(true);
    });

    it('should return false for disallowed roles', () => {
      expect(hasPermission('viewer', 'api.create')).toBe(false);
      expect(hasPermission('on_call_engineer', 'api.delete')).toBe(false);
      expect(hasPermission('member', 'user.invite')).toBe(false);
      expect(hasPermission('viewer', 'org.delete')).toBe(false);
    });

    it('should return false for unknown permission', () => {
      expect(hasPermission('owner', 'unknown.permission' as any)).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for owner', () => {
      const permissions = getPermissionsForRole('owner');
      expect(permissions.length).toBe(allPermissions.length);
      allPermissions.forEach(p => expect(permissions).toContain(p));
    });

    it('should return subset for admin', () => {
      const permissions = getPermissionsForRole('admin');
      expect(permissions).toContain('api.create');
      expect(permissions).toContain('api.delete');
      expect(permissions).not.toContain('org.delete');
      expect(permissions).not.toContain('org.billing');
      expect(permissions).not.toContain('org.transfer_ownership');
    });

    it('should return limited permissions for member', () => {
      const permissions = getPermissionsForRole('member');
      expect(permissions).toContain('api.create');
      expect(permissions).toContain('api.update');
      expect(permissions).toContain('api.view');
      expect(permissions).toContain('incident.acknowledge');
      expect(permissions).not.toContain('api.delete');
      expect(permissions).not.toContain('user.invite');
      expect(permissions).not.toContain('org.update');
    });

    it('should return view-only for viewer', () => {
      const permissions = getPermissionsForRole('viewer');
      expect(permissions).toContain('api.view');
      expect(permissions).toContain('incident.view');
      expect(permissions).toContain('ticket.view');
      expect(permissions).toContain('analytics.view');
      expect(permissions).not.toContain('api.create');
      expect(permissions).not.toContain('incident.acknowledge');
    });

    it('should return on-call permissions for on_call_engineer', () => {
      const permissions = getPermissionsForRole('on_call_engineer');
      expect(permissions).toContain('api.view');
      expect(permissions).toContain('incident.acknowledge');
      expect(permissions).toContain('incident.resolve');
      expect(permissions).toContain('incident.note_add');
      expect(permissions).not.toContain('api.create');
      expect(permissions).not.toContain('user.invite');
    });
  });

  describe('isRoleAtLeast', () => {
    it('should return true for same role', () => {
      allRoles.forEach(role => {
        expect(isRoleAtLeast(role, role)).toBe(true);
      });
    });

    it('should return true for higher role', () => {
      expect(isRoleAtLeast('admin', 'member')).toBe(true);
      expect(isRoleAtLeast('owner', 'admin')).toBe(true);
      expect(isRoleAtLeast('on_call_engineer', 'member')).toBe(true);
    });

    it('should return false for lower role', () => {
      expect(isRoleAtLeast('member', 'admin')).toBe(false);
      expect(isRoleAtLeast('admin', 'owner')).toBe(false);
      expect(isRoleAtLeast('viewer', 'member')).toBe(false);
    });

    it('should handle on_call_engineer hierarchy correctly', () => {
      expect(isRoleAtLeast('on_call_engineer', 'member')).toBe(true);
      expect(isRoleAtLeast('admin', 'on_call_engineer')).toBe(true);
      expect(isRoleAtLeast('member', 'on_call_engineer')).toBe(false);
    });
  });

  describe('canChangeRole', () => {
    it('should allow owner to change any role', () => {
      expect(canChangeRole('owner', 'admin', 'member')).toBe(true);
      expect(canChangeRole('owner', 'member', 'admin')).toBe(true);
      expect(canChangeRole('owner', 'viewer', 'owner')).toBe(true);
      expect(canChangeRole('owner', 'owner', 'admin')).toBe(true);
    });

    it('should allow admin to promote member/viewer/on_call_engineer to member/on_call_engineer', () => {
      expect(canChangeRole('admin', 'member', 'on_call_engineer')).toBe(true);
      expect(canChangeRole('admin', 'viewer', 'member')).toBe(true);
      expect(canChangeRole('admin', 'on_call_engineer', 'viewer')).toBe(true);
    });

    it('should NOT allow admin to promote to admin or owner', () => {
      expect(canChangeRole('admin', 'member', 'admin')).toBe(false);
      expect(canChangeRole('admin', 'viewer', 'owner')).toBe(false);
    });

    it('should NOT allow admin to change other admins or owners', () => {
      expect(canChangeRole('admin', 'admin', 'member')).toBe(false);
      expect(canChangeRole('admin', 'owner', 'member')).toBe(false);
    });

    it('should NOT allow member/viewer/on_call_engineer to change any role', () => {
      expect(canChangeRole('member', 'viewer', 'member')).toBe(false);
      expect(canChangeRole('viewer', 'member', 'viewer')).toBe(false);
      expect(canChangeRole('on_call_engineer', 'member', 'viewer')).toBe(false);
    });
  });

  describe('permissionMap completeness', () => {
    it('should have all permissions defined for at least one role', () => {
      allPermissions.forEach(permission => {
        const roles = permissionMap[permission];
        expect(roles.length).toBeGreaterThan(0);
        roles.forEach(role => expect(allRoles).toContain(role));
      });
    });

    it('should not have duplicate permissions', () => {
      const uniquePermissions = new Set(allPermissions);
      expect(uniquePermissions.size).toBe(allPermissions.length);
    });
  });
});