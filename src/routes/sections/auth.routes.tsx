import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { AuthLayoutWrapper } from '@/routes/layouts/auth-layout';

// Auth pages - lazy loaded for code splitting
const SignInPage = lazy(() => import('@/pages/auth/sign-in'));
const SignUpPage = lazy(() => import('@/pages/auth/sign-up'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password'));
const UpdatePasswordPage = lazy(() => import('@/pages/auth/update-password'));

/**
 * Auth Routes Configuration
 * All authentication-related routes (sign in, sign up, password reset, etc.)
 * Following React Router v6 best practices with lazy loading and route guards
 * 
 * Each route is protected by AuthLayoutWrapper which includes:
 * - GuestGuard to prevent authenticated users from accessing auth pages
 * - Suspense boundary with loading state for lazy-loaded routes
 * - Auth pages handle their own layouts (cards, styling, gradients, etc.)
 */
export const authRoutes: RouteObject[] = [
  {
    path: 'auth/jwt/sign-in',
    element: (
      <AuthLayoutWrapper>
        <SignInPage />
      </AuthLayoutWrapper>
    ),
  },
  {
    path: 'auth/jwt/sign-up',
    element: (
      <AuthLayoutWrapper>
        <SignUpPage />
      </AuthLayoutWrapper>
    ),
  },
  {
    path: 'auth/jwt/reset-password',
    element: (
      <AuthLayoutWrapper>
        <ResetPasswordPage />
      </AuthLayoutWrapper>
    ),
  },
  {
    path: 'auth/jwt/update-password',
    element: (
      <AuthLayoutWrapper>
        <UpdatePasswordPage />
      </AuthLayoutWrapper>
    ),
  },
];
