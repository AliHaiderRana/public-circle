import { useRoutes, Navigate } from 'react-router-dom';
import { dashboardRoutes } from './sections/dashboard.routes';
import { authRoutes } from './sections/auth.routes';
import { publicRoutes } from './sections/public.routes';
import { errorRoutes } from './sections/error.routes';
import { paths } from './paths';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { lazy, Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';

// Unsubscribe page
const UnSubscribePage = lazy(() => import('@/pages/un-subscribe'));

/**
 * Root Redirect Component
 * Checks authentication state and redirects accordingly
 */
function RootRedirect() {
  const authContext = useAuthContext();
  const { authenticated, loading } = authContext;

  // Show loading while checking auth
  if (loading) {
    return <LoadingState variant="spinner" message="Loading..." />;
  }

  // Redirect based on auth state
  if (authenticated) {
    return <Navigate to={paths.dashboard.analytics} replace />;
  }

  return <Navigate to={paths.auth.jwt.signIn} replace />;
}

/**
 * Main Router Component
 * 
 * Consolidates all route modules into a single router using React Router's useRoutes hook.
 * This provides better organization and follows React Router v6 best practices.
 * 
 * Route Structure:
 * - Root redirect (handles authentication state)
 * - Public routes (home, about, contact, etc.)
 * - Auth routes (sign in, sign up, password reset, etc.)
 * - Dashboard routes (all dashboard pages with nested structure)
 * - Error routes (404, 403, 500, catch-all)
 * - Utility routes (unsubscribe, etc.)
 */
export function AppRouter() {
  const routes = useRoutes([
    // Root redirect - check auth state
    {
      path: '/',
      element: <RootRedirect />,
    },

    // Public routes
    ...publicRoutes,

    // Auth routes
    ...authRoutes,

    // Dashboard routes (nested structure with Outlet)
    ...dashboardRoutes,

    // Unsubscribe route
    {
      path: '/un-sub',
      element: (
        <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
          <UnSubscribePage />
        </Suspense>
      ),
    },

    // Error routes (must be last)
    ...errorRoutes,
  ]);

  return routes;
}
