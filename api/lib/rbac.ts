import { User } from './db';

export type Role = 'Owner' | 'Admin' | 'Manager' | 'Member' | 'Guest';

export interface Permission {
  resource: string;
  action: string;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  Owner: 5,
  Admin: 4,
  Manager: 3,
  Member: 2,
  Guest: 1,
};

const PERMISSIONS: Record<Role, Permission[]> = {
  Owner: [
    { resource: '*', action: '*' },
  ],
  Admin: [
    { resource: 'org', action: 'read' },
    { resource: 'org', action: 'update' },
    { resource: 'users', action: '*' },
    { resource: 'billing', action: '*' },
    { resource: 'files', action: '*' },
    { resource: 'shares', action: '*' },
    { resource: 'audit', action: 'read' },
  ],
  Manager: [
    { resource: 'files', action: '*' },
    { resource: 'shares', action: '*' },
    { resource: 'users', action: 'read' },
  ],
  Member: [
    { resource: 'files', action: 'read' },
    { resource: 'files', action: 'create' },
    { resource: 'files', action: 'update' },
    { resource: 'files', action: 'delete' },
    { resource: 'shares', action: 'read' },
    { resource: 'shares', action: 'create' },
  ],
  Guest: [
    { resource: 'files', action: 'read' },
    { resource: 'shares', action: 'read' },
  ],
};

export function hasPermission(user: User, resource: string, action: string): boolean {
  const userPermissions = PERMISSIONS[user.role];
  
  // Check for wildcard permissions
  if (userPermissions.some(p => p.resource === '*' && p.action === '*')) {
    return true;
  }

  // Check for exact match
  if (userPermissions.some(p => p.resource === resource && p.action === action)) {
    return true;
  }

  // Check for resource wildcard
  if (userPermissions.some(p => p.resource === resource && p.action === '*')) {
    return true;
  }

  return false;
}

export function canManageUser(manager: User, targetUser: User): boolean {
  // Can only manage users with lower or equal role
  if (ROLE_HIERARCHY[manager.role] <= ROLE_HIERARCHY[targetUser.role]) {
    return false;
  }

  // Owners can manage anyone
  if (manager.role === 'Owner') {
    return true;
  }

  // Admins can manage non-owners
  if (manager.role === 'Admin' && targetUser.role !== 'Owner') {
    return true;
  }

  return false;
}

export function requireRole(user: User, ...allowedRoles: Role[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }
}

