import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { navData } from '@/layouts/dashboard/nav-data';
import type { NavItem } from '@/layouts/dashboard/nav-data';

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

/**
 * Route to breadcrumb name mapping
 * Maps route paths to human-readable names
 */
const routeNameMap: Record<string, string> = {
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
  [paths.dashboard.configurations.root]: 'Configurations',
  [paths.dashboard.configurations.contacts]: 'Contacts Import',
  [paths.dashboard.configurations.contactsImport]: 'Contacts Import',
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
};

/**
 * Find navigation item by path
 */
function findNavItemByPath(
  items: NavItem[],
  path: string,
  currentPath: string
): NavItem | null {
  for (const item of items) {
    if (item.path === path || (item.path && currentPath.startsWith(item.path + '/'))) {
      return item;
    }
    if (item.children) {
      const found = findNavItemByPath(item.children, path, currentPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Build breadcrumb path from navigation structure
 */
function buildBreadcrumbPath(
  items: NavItem[],
  currentPath: string,
  breadcrumbs: BreadcrumbItem[] = []
): BreadcrumbItem[] {
  // Find matching item
  for (const item of items) {
    if (item.path && currentPath.startsWith(item.path)) {
      const newBreadcrumb: BreadcrumbItem = {
        name: item.title,
        href: item.path === currentPath ? undefined : item.path,
      };
      
      const updatedBreadcrumbs = [...breadcrumbs, newBreadcrumb];
      
      // If exact match, return
      if (item.path === currentPath) {
        return updatedBreadcrumbs;
      }
      
      // If has children, recurse
      if (item.children) {
        return buildBreadcrumbPath(item.children, currentPath, updatedBreadcrumbs);
      }
      
      return updatedBreadcrumbs;
    }
  }
  
  return breadcrumbs;
}

/**
 * Hook to generate breadcrumbs from current route
 * 
 * Automatically generates breadcrumbs based on:
 * - Current route path
 * - Navigation data structure
 * - Route parameters (for dynamic routes)
 * 
 * @param customItems - Optional custom breadcrumb items to override/append
 * @returns Array of breadcrumb items
 */
export function useBreadcrumbs(customItems?: BreadcrumbItem[]): BreadcrumbItem[] {
  const location = useLocation();
  const params = useParams();
  const pathname = location.pathname;

  return useMemo(() => {
    // If custom items provided, use them
    if (customItems && customItems.length > 0) {
      return customItems;
    }

    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Dashboard for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      breadcrumbs.push({
        name: 'Dashboard',
        href: paths.dashboard.analytics,
      });
    }

    // Build breadcrumbs from navigation structure
    const navItems = navData.flatMap((section) => section.items);
    const navBreadcrumbs = buildBreadcrumbPath(navItems, pathname);
    
    // Merge with initial dashboard breadcrumb
    if (navBreadcrumbs.length > 0) {
      // Remove duplicate dashboard entry
      const filtered = navBreadcrumbs.filter(
        (item) => item.name !== 'Dashboard' || item.href !== paths.dashboard.analytics
      );
      breadcrumbs.push(...filtered);
    } else {
      // Fallback: use route name map
      const routeName = routeNameMap[pathname];
      if (routeName) {
        breadcrumbs.push({
          name: routeName,
        });
      } else {
        // Extract route name from pathname
        const pathParts = pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        
        // Handle dynamic routes (e.g., /dashboard/campaign/:id)
        if (params.id) {
          const parentPath = pathname.replace(`/${params.id}`, '').replace('/edit', '');
          const parentName = routeNameMap[parentPath] || 
            pathParts[pathParts.length - 2]?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || '';
          
          breadcrumbs.push({
            name: parentName,
            href: parentPath,
          });
          
          // Check if it's an edit route
          if (pathname.includes('/edit/')) {
            breadcrumbs.push({
              name: `Edit ${params.id}`,
            });
          } else {
            breadcrumbs.push({
              name: params.id,
            });
          }
        } else {
          // Format last part as title
          const formattedName = lastPart
            ?.replace(/-/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Page';
          breadcrumbs.push({
            name: formattedName,
          });
        }
      }
    }

    return breadcrumbs;
  }, [pathname, params, customItems]);
}
