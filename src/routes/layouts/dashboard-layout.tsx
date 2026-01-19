import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthGuard } from '@/auth/guard/auth-guard';
import { DashboardLayout } from '@/layouts/dashboard';
import { LoadingState } from '@/components/ui/loading-state';

/**
 * Dashboard Layout Wrapper
 * 
 * Provides the dashboard layout with nested route support using React Router's Outlet.
 * This wrapper:
 * - Protects routes with AuthGuard (requires authentication)
 * - Wraps content in DashboardLayout (sidebar, header, etc.)
 * - Provides Suspense boundary with loading state for lazy-loaded routes
 * 
 * Usage:
 * ```tsx
 * <Route path="dashboard" element={<DashboardLayoutWrapper />}>
 *   <Route index element={<DashboardPage />} />
 *   <Route path="analytics" element={<AnalyticsPage />} />
 * </Route>
 * ```
 */
export function DashboardLayoutWrapper() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <Suspense fallback={<LoadingState variant="spinner" message="Loading page..." />}>
          <Outlet />
        </Suspense>
      </DashboardLayout>
    </AuthGuard>
  );
}
