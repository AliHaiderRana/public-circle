import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { LoadingState } from '@/components/ui/loading-state';
import { paths } from '@/routes/paths';

// Error pages - lazy loaded for code splitting
const NotFoundPage = lazy(() => import('@/pages/404'));
const ForbiddenPage = lazy(() => import('@/pages/error/403'));
const ServerErrorPage = lazy(() => import('@/pages/error/500'));

/**
 * Error Routes Configuration
 * All error-related routes (404, 403, 500, etc.)
 * Following React Router v6 best practices with lazy loading
 * 
 * These routes handle error states and edge cases:
 * - 404: Page not found (also used as catch-all route)
 * - 403: Access forbidden (insufficient permissions)
 * - 500: Internal server error
 */
export const errorRoutes: RouteObject[] = [
  {
    path: paths.page403,
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <ForbiddenPage />
      </Suspense>
    ),
  },
  {
    path: paths.page500,
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <ServerErrorPage />
      </Suspense>
    ),
  },
  {
    path: '/404',
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
];
