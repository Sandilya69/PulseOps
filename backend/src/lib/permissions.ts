// ============================================
// PulseOps CRM - RBAC Permission System
// ============================================
// Complete permission matrix mapping permissions to allowed roles

import { UserRole } from '@prisma/client';

// All permissions in the system
export type Permission =
  // API Management
  | 'api.create'
  | 'api.update'
  | 'api.delete'
  | 'api.view'
  // Incident Management
  | 'incident.acknowledge'
  | 'incident.resolve'
  | 'incident.view'
  | 'incident.delete'
  | 'incident.note_add'
  // User Management
  | 'user.invite'
  | 'user.remove'
  | 'user.change_role'
  | 'user.view'
  | 'user.deactivate'
  | 'user.reactivate'
  // Organization Settings
  | 'org.update'
  | 'org.delete'
  | 'org.billing'
  | 'org.transfer_ownership'
  // Integrations
  | 'integration.create'
  | 'integration.update'
  | 'integration.delete'
  | 'integration.view'
  // Analytics
  | 'analytics.view'
  | 'analytics.export'
  // Support Tickets
  | 'ticket.create'
  | 'ticket.view'
  | 'ticket.view_all'
  | 'ticket.assign'
  | 'ticket.resolve'
  | 'ticket.close'
  // Contacts
  | 'contact.create'
  | 'contact.update'
  | 'contact.delete'
  | 'contact.view'
  // Activity Logs
  | 'activity.view'
  | 'activity.export'
  // Notification Settings
  | 'notification.manage_defaults';

// Permission → Roles mapping
const permissionMap: Record<Permission, UserRole[]> = {
  // ── API Management ──
  'api.create':   ['owner', 'admin', 'member'],
  'api.update':   ['owner', 'admin', 'member'],
  'api.delete':   ['owner', 'admin'],
  'api.view':     ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'],

  // ── Incident Management ──
  'incident.acknowledge': ['owner', 'admin', 'member', 'on_call_engineer'],
  'incident.resolve':     ['owner', 'admin', 'member', 'on_call_engineer'],
  'incident.view':        ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'],
  'incident.delete':      ['owner', 'admin'],
  'incident.note_add':    ['owner', 'admin', 'member', 'on_call_engineer'],

  // ── User Management ──
  'user.invite':       ['owner', 'admin'],
  'user.remove':       ['owner', 'admin'],
  'user.change_role':  ['owner', 'admin'],
  'user.view':         ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'],
  'user.deactivate':   ['owner', 'admin'],
  'user.reactivate':   ['owner', 'admin'],

  // ── Organization ──
  'org.update':             ['owner', 'admin'],
  'org.delete':             ['owner'],
  'org.billing':            ['owner'],
  'org.transfer_ownership': ['owner'],

  // ── Integrations ──
  'integration.create': ['owner', 'admin'],
  'integration.update': ['owner', 'admin'],
  'integration.delete': ['owner', 'admin'],
  'integration.view':   ['owner', 'admin', 'member'],

  // ── Analytics ──
  'analytics.view':   ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'],
  'analytics.export': ['owner', 'admin'],

  // ── Support Tickets ──
  'ticket.create':   ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'],
  'ticket.view':     ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'],
  'ticket.view_all': ['owner', 'admin'],
  'ticket.assign':   ['owner', 'admin'],
  'ticket.resolve':  ['owner', 'admin'],
  'ticket.close':    ['owner', 'admin'],

  // ── Contacts ──
  'contact.create': ['owner', 'admin', 'member'],
  'contact.update': ['owner', 'admin', 'member'],
  'contact.delete': ['owner', 'admin'],
  'contact.view':   ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'],

  // ── Activity Logs ──
  'activity.view':   ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'],
  'activity.export': ['owner', 'admin'],

  // ── Notifications ──
  'notification.manage_defaults': ['owner', 'admin'],
};

/**
 * Check if a given role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = permissionMap[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * Get all permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return (Object.entries(permissionMap) as [Permission, UserRole[]][])
    .filter(([_, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}

/**
 * Check if a role is at least as privileged as another role
 */
const roleHierarchy: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  on_call_engineer: 3,
  member: 2,
  viewer: 1,
};

export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if a user can change another user's role
 * Owners can change anyone. Admins can change member/viewer/on_call_engineer only.
 */
export function canChangeRole(
  actorRole: UserRole,
  targetCurrentRole: UserRole,
  targetNewRole: UserRole
): boolean {
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') {
    // Admins cannot promote to owner or admin
    if (targetNewRole === 'owner' || targetNewRole === 'admin') return false;
    // Admins cannot change other admins or owners
    if (targetCurrentRole === 'owner' || targetCurrentRole === 'admin') return false;
    return true;
  }
  return false;
}

export { permissionMap };
