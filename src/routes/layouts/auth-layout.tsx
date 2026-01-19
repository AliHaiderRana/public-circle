import { Suspense, ReactNode } from 'react';
import { GuestGuard } from '@/auth/guard/guest-guard';
import { LoadingState } from '@/components/ui/loading-state';

/**
 * Auth Layout Wrapper
 * 
 * Provides a consistent wrapper for all authentication-related pages.
 * This wrapper:
 * - Protects routes with GuestGuard (prevents authenticated users from accessing auth pages)
 * - Provides Suspense boundary with loading state for lazy-loaded routes
 * - Auth pages handle their own layouts (cards, styling, gradients, etc.)
 * 
 * Usage:
 * ```tsx
 * <Route 
 *   path="auth/jwt/sign-in" 
 *   element={<AuthLayoutWrapper><SignInPage /></AuthLayoutWrapper>} 
 * />
 * ```
 */
export function AuthLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        {children}
      </Suspense>
    </GuestGuard>
  );
}
