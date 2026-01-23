import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '@/config/config';
import { paths } from '@/routes/paths';
import { useAuthContext } from '../hooks/use-auth-context';

// ----------------------------------------------------------------------

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { authenticated, loading } = useAuthContext();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // Once loading is complete, check if user is authenticated
    if (authenticated) {
      const { redirectPath } = CONFIG.auth;
      navigate(redirectPath, { replace: true });
      return;
    }

    // User is not authenticated, allow access to guest pages
    setHasChecked(true);
  }, [authenticated, loading, navigate]);

  // Show loading only while auth is being checked
  if (loading || (authenticated && !hasChecked)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't render children (will redirect)
  if (authenticated) {
    return null;
  }

  // User is not authenticated, show the guest page
  return <>{children}</>;
}
