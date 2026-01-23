import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router';
import { RoleBasedGuard } from '@/auth/guard/role-based-guard';
import { paths } from '@/routes/paths';
import { DashboardLayoutWrapper } from '@/routes/layouts/dashboard-layout';

// Dashboard pages - lazy loaded for code splitting
const AnalyticsPage = lazy(() => 
  import('@/pages/dashboard/analytics').catch((error) => {
    console.error('Failed to load AnalyticsPage:', error);
    // Return a fallback component
    return { default: () => <div>Failed to load analytics page. Please refresh.</div> };
  })
);
const DashboardPage = lazy(() => import('@/pages/dashboard'));

// Campaign pages
const CampaignListPage = lazy(() => import('@/pages/dashboard/campaign/list'));
const CampaignDetailsPage = lazy(() => import('@/pages/dashboard/campaign/details'));
const CampaignCreatePage = lazy(() => import('@/pages/dashboard/campaign/create'));
const CampaignEditPage = lazy(() => import('@/pages/dashboard/campaign/edit'));
const RecurringCampaignsPage = lazy(() => import('@/pages/dashboard/campaign/recurring'));

// Template pages
const TemplateListPage = lazy(() => import('@/pages/dashboard/templates/index'));
const TemplateCreatePage = lazy(() => import('@/pages/dashboard/templates/template-create'));
const SampleTemplatesPage = lazy(() => import('@/pages/dashboard/templates/sample'));
const TemplateSelectPage = lazy(() => import('@/pages/dashboard/templates/template-select'));

// Audience pages
const FiltersPage = lazy(() => import('@/pages/dashboard/audience/filters'));
const SegmentsPage = lazy(() => import('@/pages/dashboard/audience/segments'));
const ContactsListPage = lazy(() => import('@/pages/dashboard/audience/list'));
const NewFilterPage = lazy(() => import('@/pages/dashboard/audience/newfilter'));
const NewSegmentPage = lazy(() => import('@/pages/dashboard/audience/segment-new'));
const EditSegmentPage = lazy(() => import('@/pages/dashboard/audience/edit'));

// Configuration pages
const ContactsListManagementPage = lazy(() => import('@/pages/dashboard/configurations/contacts-list'));
const ContactsImportPage = lazy(() => import('@/pages/dashboard/configurations/contacts'));
const EmailConfigurationPage = lazy(() => import('@/pages/dashboard/configurations/email-configuration'));
const WebhooksPage = lazy(() => import('@/pages/dashboard/configurations/webhooks'));
const RolesMembersPage = lazy(() => import('@/pages/dashboard/configurations/roles-members'));
const NewEmailPage = lazy(() => import('@/pages/dashboard/configurations/new-email'));

// Logs pages
const CampaignLogsPage = lazy(() => import('@/pages/dashboard/logs/list'));
const CampaignLogDetailsPage = lazy(() => import('@/pages/dashboard/logs/details'));
const MessageLogsPage = lazy(() => import('@/pages/dashboard/logs/messages'));

// Settings pages
const SettingsPage = lazy(() => import('@/pages/dashboard/settings'));
const ProfilePage = lazy(() => import('@/pages/dashboard/profile'));
const OrganizationSettingsPage = lazy(() => import('@/pages/dashboard/organization-settings'));
const SubscriptionPage = lazy(() => import('@/pages/dashboard/subscription'));

/**
 * Dashboard Routes Configuration
 * Uses nested routes pattern for better organization and performance
 * Following React Router v6 best practices with Outlet for nested routing
 */
export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <DashboardLayoutWrapper />,
    children: [
      // Index redirect to analytics
      {
        index: true,
        element: <Navigate to={paths.dashboard.analytics} replace />,
      },
      
      // Analytics route
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      
      // Dashboard home (fallback)
      {
        path: '',
        element: <DashboardPage />,
      },
      
      // Campaign routes - nested structure
      {
        path: 'campaign',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.campaign.list} replace />,
          },
          {
            path: 'list',
            element: <CampaignListPage />,
          },
          {
            path: 'new',
            element: <CampaignCreatePage />,
          },
          {
            path: 'recurring',
            element: <RecurringCampaignsPage />,
          },
          {
            path: ':id',
            element: <CampaignDetailsPage />,
          },
          {
            path: 'edit/:id',
            element: <CampaignEditPage />,
          },
        ],
      },
      
      // Template routes - nested structure
      {
        path: 'templates',
        children: [
          {
            index: true,
            element: <TemplateListPage />,
          },
          {
            path: 'template',
            element: <TemplateCreatePage />,
          },
          {
            path: 'template/:id',
            element: <TemplateCreatePage />,
          },
          {
            path: 'sample',
            element: <SampleTemplatesPage />,
          },
          {
            path: 'select',
            element: <TemplateSelectPage />,
          },
        ],
      },
      
      // Audience routes - nested structure
      {
        path: 'audience',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.audience.filters} replace />,
          },
          {
            path: 'filters',
            element: <FiltersPage />,
          },
          {
            path: 'newfilter',
            element: <NewFilterPage />,
          },
          {
            path: 'newfilter/:id',
            element: <NewFilterPage />,
          },
          {
            path: 'segments',
            element: <SegmentsPage />,
          },
          {
            path: 'newsegment',
            element: <NewSegmentPage />,
          },
          {
            path: 'newsegment/:id',
            element: <NewSegmentPage />,
          },
          {
            path: ':id/edit',
            element: <EditSegmentPage />,
          },
          {
            path: 'list',
            element: <ContactsListPage />,
          },
        ],
      },
      
      // Contacts routes - nested structure
      {
        path: 'contacts',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.contacts.list} replace />,
          },
          {
            path: 'list',
            element: <ContactsListManagementPage />,
          },
          {
            path: 'import',
            element: <ContactsImportPage />,
          },
        ],
      },

      // Configuration routes - nested structure
      {
        path: 'configurations',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.configurations.emailConfiguration} replace />,
          },
          {
            path: 'emailConfiguration',
            element: <EmailConfigurationPage />,
          },
          {
            path: 'webhooks',
            element: <WebhooksPage />,
          },
          {
            path: 'newEmail',
            element: <NewEmailPage />,
          },
          {
            path: 'roles&members',
            element: (
              <RoleBasedGuard acceptRoles={['Admin']} hasContent>
                <RolesMembersPage />
              </RoleBasedGuard>
            ),
          },
        ],
      },
      
      // Logs routes - nested structure
      {
        path: 'logs',
        children: [
          {
            index: true,
            element: <Navigate to={paths.dashboard.logs.root} replace />,
          },
          {
            path: 'list',
            element: <CampaignLogsPage />,
          },
          {
            path: 'details',
            element: <CampaignLogDetailsPage />,
          },
          {
            path: 'details/:id',
            element: <CampaignLogDetailsPage />,
          },
          {
            path: 'messages',
            element: <MessageLogsPage />,
          },
        ],
      },
      
      // Settings routes
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'organizationSettings',
        element: (
          <RoleBasedGuard acceptRoles={['Admin']} hasContent>
            <OrganizationSettingsPage />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'subscription',
        element: <SubscriptionPage />,
      },

      // Legacy route redirects for backward compatibility
      {
        path: 'addfilters',
        element: <Navigate to={paths.dashboard.audience.newfilter} replace />,
      },
    ],
  },
];
