import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CONFIG } from "@/config/config";
import { paths } from "@/routes/paths";
import { useAuthContext } from "../hooks/use-auth-context";

// ----------------------------------------------------------------------

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, loading } = useAuthContext();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // Once loading is complete, check if user is authenticated
    if (!authenticated) {
      const { method } = CONFIG.auth;

      const signInPath = {
        jwt: paths.auth.jwt.signIn,
      }[method];

      const returnTo = location.pathname;
      const href = `${signInPath}?returnTo=${encodeURIComponent(returnTo)}`;

      navigate(href, { replace: true });
      return;
    }

    // User is authenticated, allow access
    setHasChecked(true);
  }, [authenticated, loading, navigate, location.pathname]);

  // Show loading while auth is being checked
  if (loading || (!authenticated && !hasChecked)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!authenticated) {
    return null;
  }

  // User is authenticated - subscription status is handled by header banner
  return <>{children}</>;
}
