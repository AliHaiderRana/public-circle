/**
 * useHasPermission Hook
 * Reusable hook for checking user permissions based on roles
 */

import { useAuthContext } from './use-auth-context';

/**
 * Check if user has permission based on required roles
 * @param requiredRoles - Array of role names that have permission
 * @returns boolean indicating if user has permission
 */
export function useHasPermission(requiredRoles: string[]): boolean {
  const { user } = useAuthContext();
  // Handle both string role and object role with name property
  const userRole = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');

  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // No restrictions, allow access
  }

  return requiredRoles.includes(userRole);
}

/**
 * Check if user is admin
 * @returns boolean indicating if user is admin
 */
export function useIsAdmin(): boolean {
  return useHasPermission(['Admin']);
}

/**
 * Check if user has any of the specified roles
 * @param roles - Array of role names to check
 * @returns boolean indicating if user has any of the roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const { user } = useAuthContext();
  // Handle both string role and object role with name property
  const userRole = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');

  return roles.includes(userRole);
}