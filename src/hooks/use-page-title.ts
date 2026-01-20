import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { paths } from '@/routes/paths';

const APP_NAME = 'Public Circle';

/**
 * Route to page title mapping
 */
const routeTitleMap: Record<string, string> = {
  [paths.dashboard.root]: 'Dashboard',
  [paths.dashboard.analytics]: 'Analytics',
  [paths.dashboard.campaign.root]: 'Campaigns',
  [paths.dashboard.campaign.list]: 'All Campaigns',
  [paths.dashboard.campaign.new]: 'Create Campaign',
  [paths.dashboard.campaign.recurring]: 'Recurring Campaigns',
  [paths.dashboard.template.root]: 'Templates',
  [paths.dashboard.template.create]: 'Create Template',
  [paths.dashboard.template.sample]: 'Sample Templates',
  [paths.dashboard.template.select]: 'Select Template',
  [paths.dashboard.audience.root]: 'Audience',
  [paths.dashboard.audience.filters]: 'Fields',
  [paths.dashboard.audience.segments]: 'Segments',
  [paths.dashboard.audience.list]: 'Contacts',
  [paths.dashboard.audience.newFilter]: 'New Filter',
  [paths.dashboard.audience.newSegment]: 'New Segment',
  [paths.dashboard.contacts.root]: 'Contacts',
  [paths.dashboard.contacts.list]: 'All Contacts',
  [paths.dashboard.contacts.import]: 'Import Contacts',
  [paths.dashboard.configurations.root]: 'Configurations',
  [paths.dashboard.configurations.emailConfiguration]: 'Emails and Domains',
  [paths.dashboard.configurations.newEmail]: 'New Email',
  [paths.dashboard.configurations.webhooks]: 'Webhooks',
  [paths.dashboard.configurations.roles]: 'Roles & Members',
  [paths.dashboard.logs.root]: 'Campaign Logs',
  [paths.dashboard.logs.list]: 'Campaign Logs',
  [paths.dashboard.logs.messages]: 'Message Logs',
  [paths.dashboard.logs.detail]: 'Log Details',
  [paths.dashboard.general.settings]: 'Settings',
  [paths.dashboard.general.profile]: 'Profile',
  [paths.dashboard.general.organizationSettings]: 'Organizational Settings',
  [paths.dashboard.general.subscription]: 'Subscription',
  // Auth routes
  [paths.auth.jwt.signIn]: 'Sign In',
  [paths.auth.jwt.signUp]: 'Sign Up',
  [paths.auth.jwt.resetPassword]: 'Reset Password',
  [paths.auth.jwt.updatePassword]: 'Update Password',
  // Public routes
  [paths.about]: 'About Us',
  [paths.contact]: 'Contact Us',
  [paths.faqs]: 'FAQs',
  [paths.emailVerification]: 'Email Verification',
};

/**
 * Hook to set the document title based on current route
 */
export function usePageTitle() {
  const location = useLocation();
  const params = useParams();
  const pathname = location.pathname;

  useEffect(() => {
    let title = routeTitleMap[pathname];

    if (!title) {
      // Handle dynamic routes
      if (params.id) {
        const parentPath = pathname.replace(`/${params.id}`, '').replace('/edit', '');
        title = routeTitleMap[parentPath];

        if (pathname.includes('/edit/')) {
          title = title ? `Edit ${title}` : 'Edit';
        }
      }

      // Fallback: extract from pathname
      if (!title) {
        const pathParts = pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        title = lastPart
          ?.replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()) || APP_NAME;
      }
    }

    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [pathname, params]);
}
