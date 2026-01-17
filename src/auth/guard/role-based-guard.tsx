import type { ReactNode } from 'react';
import { useAuthContext } from '../hooks/use-auth-context';

interface RoleBasedGuardProps {
  children: ReactNode;
  acceptRoles: string[];
  hasContent?: boolean;
}

export function RoleBasedGuard({
  children,
  acceptRoles,
  hasContent = false,
}: RoleBasedGuardProps) {
  const { user } = useAuthContext();
  const userRole = user?.role?.name || '';

  const hasPermission = acceptRoles.includes(userRole);

  if (!hasPermission) {
    if (hasContent) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-500">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
