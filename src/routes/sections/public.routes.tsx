import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { LoadingState } from '@/components/ui/loading-state';
import { paths } from '@/routes/paths';

// Public pages - lazy loaded for code splitting
const HomePage = lazy(() => import('@/pages/home'));
const AboutUsPage = lazy(() => import('@/pages/about-us'));
const ContactUsPage = lazy(() => import('@/pages/contact-us'));
const FAQsPage = lazy(() => import('@/pages/faqs'));
const EmailVerificationPage = lazy(() => import('@/pages/email-verification'));
const UnSubscribePage = lazy(() => import('@/pages/un-subscribe'));

/**
 * Public Routes Configuration
 * All publicly accessible routes that don't require authentication
 * Following React Router v6 best practices with lazy loading
 * 
 * These routes are accessible to both authenticated and unauthenticated users.
 * They typically include marketing pages, informational pages, and utility pages.
 */
export const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: paths.about,
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <AboutUsPage />
      </Suspense>
    ),
  },
  {
    path: paths.contact,
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <ContactUsPage />
      </Suspense>
    ),
  },
  {
    path: paths.faqs,
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <FAQsPage />
      </Suspense>
    ),
  },
  {
    path: paths.emailVerification,
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <EmailVerificationPage />
      </Suspense>
    ),
  },
  {
    path: '/un-sub',
    element: (
      <Suspense fallback={<LoadingState variant="spinner" message="Loading..." />}>
        <UnSubscribePage />
      </Suspense>
    ),
  },
];
