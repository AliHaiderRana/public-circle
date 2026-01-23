import type { ReactNode } from 'react';
import { useHasPermission } from '../hooks/use-has-permission';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { paths } from '@/routes/paths';
import { useNavigate } from 'react-router-dom';

interface RoleBasedGuardProps {
  children: ReactNode;
  acceptRoles: string[];
  hasContent?: boolean;
  redirectTo?: string;
}

export function RoleBasedGuard({
  children,
  acceptRoles,
  hasContent = false,
  redirectTo,
}: RoleBasedGuardProps) {
  const navigate = useNavigate();
  const hasPermission = useHasPermission(acceptRoles);

  if (!hasPermission) {
    if (redirectTo) {
      // Redirect if redirectTo is provided
      navigate(redirectTo, { replace: true });
      return null;
    }

    if (hasContent) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="rounded-full bg-destructive/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page. This page is restricted to{' '}
              {acceptRoles.join(', ')} role{acceptRoles.length > 1 ? 's' : ''}.
            </p>
            <Button onClick={() => navigate(paths.dashboard.analytics)} variant="outline">
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
