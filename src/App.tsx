import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/auth/context/auth-provider';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { AuthGuard } from '@/auth/guard/auth-guard';
import { GuestGuard } from '@/auth/guard/guest-guard';
import { RoleBasedGuard } from '@/auth/guard/role-based-guard';
import { DashboardLayout } from '@/layouts/dashboard';
import { paths } from '@/routes/paths';

// Auth pages
const SignInPage = lazy(() => import('@/pages/auth/sign-in'));
const SignUpPage = lazy(() => import('@/pages/auth/sign-up'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password'));
const UpdatePasswordPage = lazy(() => import('@/pages/auth/update-password'));

// Dashboard pages
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const AnalyticsPage = lazy(() => import('@/pages/dashboard/analytics'));
const CampaignListPage = lazy(() => import('@/pages/dashboard/campaign/list'));
const CampaignDetailsPage = lazy(() => import('@/pages/dashboard/campaign/details'));
const CampaignCreatePage = lazy(() => import('@/pages/dashboard/campaign/create'));
const CampaignEditPage = lazy(() => import('@/pages/dashboard/campaign/edit'));

// Template pages
const TemplateListPage = lazy(() => import('@/pages/TemplateList'));
const TemplateCreatePage = lazy(() => import('@/pages/TemplateCreate'));
const SampleTemplatesPage = lazy(() => import('@/pages/dashboard/templates/sample'));
const TemplateSelectPage = lazy(() => import('@/pages/dashboard/templates/template-select'));

// Audience pages
const FiltersPage = lazy(() => import('@/pages/dashboard/audience/filters'));
const SegmentsPage = lazy(() => import('@/pages/dashboard/audience/segments'));
const ContactsListPage = lazy(() => import('@/pages/dashboard/audience/list'));
const NewFilterPage = lazy(() => import('@/pages/dashboard/audience/newfilter'));
const NewSegmentPage = lazy(() => import('@/pages/dashboard/audience/newsegment'));
const EditSegmentPage = lazy(() => import('@/pages/dashboard/audience/edit'));

// Configurations pages
const ContactsImportPage = lazy(() => import('@/pages/dashboard/configurations/contacts'));
const EmailConfigurationPage = lazy(() => import('@/pages/dashboard/configurations/email-configuration'));
const WebhooksPage = lazy(() => import('@/pages/dashboard/configurations/webhooks'));
const RolesMembersPage = lazy(() => import('@/pages/dashboard/configurations/roles-members'));
const NewEmailPage = lazy(() => import('@/pages/dashboard/configurations/new-email'));

// Logs pages
// @ts-expect-error - Module resolution issue, files exist and export correctly
const CampaignLogsPage = lazy(() => import('@/pages/dashboard/logs/list'));
// @ts-expect-error - Module resolution issue, files exist and export correctly
const CampaignLogDetailsPage = lazy(() => import('@/pages/dashboard/logs/details'));
// @ts-expect-error - Module resolution issue, files exist and export correctly
const MessageLogsPage = lazy(() => import('@/pages/dashboard/logs/messages'));

// Settings pages
const SettingsPage = lazy(() => import('@/pages/dashboard/settings'));
const ProfilePage = lazy(() => import('@/pages/dashboard/profile'));
const OrganizationSettingsPage = lazy(() => import('@/pages/dashboard/organization-settings'));

// Subscription page
const SubscriptionPage = lazy(() => import('@/pages/dashboard/subscription'));

// Error pages
const NotFoundPage = lazy(() => import('@/pages/404'));

// Unsubscribe page
const UnSubscribePage = lazy(() => import('@/pages/un-subscribe'));

// Loading component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50" style={{ minHeight: '100vh' }}>
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fee', minHeight: '100vh' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ color: '#c00', fontSize: '24px', marginBottom: '20px' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#a00', marginBottom: '20px' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              Reload Page
            </button>
            <pre style={{
              background: '#f5f5f5',
              padding: '20px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: '12px'
            }}>
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Root redirect component that checks auth state
function RootRedirect() {
  const authContext = useAuthContext();
  const { authenticated, loading } = authContext;

  // Show loading while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect based on auth state
  if (authenticated) {
    return <Navigate to={paths.dashboard.analytics} replace />;
  }

  return <Navigate to={paths.auth.jwt.signIn} replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <SWRConfig
          value={{
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            refreshWhenHidden: true,
            refreshWhenOffline: true,
          }}
        >
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Root redirect - check auth state */}
                  <Route
                    path="/"
                    element={<RootRedirect />}
                  />

                  {/* Auth routes */}
                  <Route
                    path="/auth/jwt/sign-in"
                    element={
                      <GuestGuard>
                        <SignInPage />
                      </GuestGuard>
                    }
                  />
                  <Route
                    path="/auth/jwt/sign-up"
                    element={
                      <GuestGuard>
                        <SignUpPage />
                      </GuestGuard>
                    }
                  />
                  <Route
                    path="/auth/jwt/reset-password"
                    element={
                      <GuestGuard>
                        <ResetPasswordPage />
                      </GuestGuard>
                    }
                  />
                  <Route
                    path="/auth/jwt/update-password"
                    element={
                      <GuestGuard>
                        <UpdatePasswordPage />
                      </GuestGuard>
                    }
                  />

                  {/* Unsubscribe route */}
                  <Route
                    path="/un-sub"
                    element={<UnSubscribePage />}
                  />

                  {/* Dashboard routes - wrapped in layout */}
                  <Route
                    path="/dashboard"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <DashboardPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/analytics"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <AnalyticsPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/campaign"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <CampaignListPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/campaign/list"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <CampaignListPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/campaign/new"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <CampaignCreatePage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/campaign/:id"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <CampaignDetailsPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/campaign/edit/:id"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <CampaignEditPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />

                  {/* Template routes */}
                  <Route
                    path="/dashboard/templates"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <TemplateListPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/templates/template"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <TemplateCreatePage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/templates/template/:id"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <TemplateCreatePage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/templates/sample"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <SampleTemplatesPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/templates/select"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <TemplateSelectPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  {/* Legacy routes for compatibility */}
                  <Route
                    path="/templates"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <TemplateListPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/templates/create"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <TemplateCreatePage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />

                  {/* Audience routes */}
                  <Route
                    path="/dashboard/audience"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <FiltersPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/audience/filters"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <FiltersPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/audience/newfilter"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <NewFilterPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/audience/newfilter/:id"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <NewFilterPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/audience/segments"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <SegmentsPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/audience/newsegment"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <NewSegmentPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/audience/newsegment/:id"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <NewSegmentPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/audience/:id/edit"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <EditSegmentPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/audience/list"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <ContactsListPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />

                  {/* Configurations routes */}
                  <Route
                    path="/dashboard/configurations"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <ContactsImportPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/configurations/contacts"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <ContactsImportPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/configurations/emailConfiguration"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <EmailConfigurationPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/configurations/webhooks"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <WebhooksPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/configurations/newEmail"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <NewEmailPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/configurations/roles&members"
                    element={
                      <AuthGuard>
                        <RoleBasedGuard acceptRoles={['Admin']} hasContent>
                          <DashboardLayout>
                            <RolesMembersPage />
                          </DashboardLayout>
                        </RoleBasedGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Logs routes */}
                  <Route
                    path="/dashboard/logs/list"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <CampaignLogsPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/logs/details"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <CampaignLogDetailsPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/logs/details/:id"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <CampaignLogDetailsPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/logs/messages"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <MessageLogsPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />

                  {/* Settings routes */}
                  <Route
                    path="/dashboard/settings"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <SettingsPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/profile"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <ProfilePage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/organizationSettings"
                    element={
                      <AuthGuard>
                        <RoleBasedGuard acceptRoles={['Admin']} hasContent>
                          <DashboardLayout>
                            <OrganizationSettingsPage />
                          </DashboardLayout>
                        </RoleBasedGuard>
                      </AuthGuard>
                    }
                  />

                  {/* Subscription route */}
                  <Route
                    path="/dashboard/subscription"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <SubscriptionPage />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />

                  {/* Add Filters route */}
                  <Route
                    path="/dashboard/addfilters"
                    element={
                      <AuthGuard>
                        <DashboardLayout>
                          <Navigate to={paths.dashboard.audience.newfilter} replace />
                        </DashboardLayout>
                      </AuthGuard>
                    }
                  />

                  {/* 404 */}
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
              <Toaster />
            </AuthProvider>
          </BrowserRouter>
        </SWRConfig>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
