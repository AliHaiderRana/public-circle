import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { navData } from './nav-data';
import type { NavItem } from './nav-data';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { NavTour } from '@/components/tour/nav-tour';
import { Logo } from '@/components/logo';
import { CompanyLogo } from '@/components/company-logo';
import { getSubscriptionStatus } from '@/actions/subscription';
import { paths } from '@/routes/paths';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Pages that should remain accessible even when subscription is cancelled
const ALLOWED_PATHS_WHEN_CANCELLED = [
  paths.dashboard.general.subscription,
  paths.dashboard.general.profile,
  paths.dashboard.general.organizationSettings,
  paths.dashboard.general.settings,
];

/**
 * Check if a route is active based on exact match only
 */
function isRouteActive(itemPath: string | undefined, pathname: string): boolean {
  if (!itemPath) return false;
  return itemPath === pathname;
}

/**
 * Check if any child route is active
 */
function hasActiveChild(children: NavItem[] | undefined, pathname: string): boolean {
  if (!children) return false;
  return children.some((child) => {
    if (isRouteActive(child.path, pathname)) return true;
    return hasActiveChild(child.children, pathname);
  });
}

// Filter nav items based on user role
function filterNavItems(items: NavItem[], userRole?: string): NavItem[] {
  return items.filter((item) => {
    if (item.roles && userRole) {
      if (!item.roles.includes(userRole)) {
        return false;
      }
    }
    if (item.children) {
      item.children = filterNavItems(item.children, userRole);
    }
    return true;
  });
}

interface NavMenuItemProps {
  item: NavItem;
  pathname: string;
  isSubscriptionCancelled: boolean;
}

function NavMenuItemComponent({ item, pathname, isSubscriptionCancelled }: NavMenuItemProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasActiveChild(item.children, pathname);
  const isActive = isRouteActive(item.path, pathname);

  // Check if this path is allowed when subscription is cancelled
  const isAllowed = !isSubscriptionCancelled || !item.path || ALLOWED_PATHS_WHEN_CANCELLED.some(
    (allowedPath) => item.path === allowedPath || item.path?.startsWith(allowedPath + '/')
  );

  if (hasChildren) {
    return (
      <Collapsible
        asChild
        defaultOpen={isChildActive || isActive}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isChildActive || isActive}
              className={cn(
                !isAllowed && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children?.map((child) => {
                const childIsActive = isRouteActive(child.path, pathname);
                const childIsAllowed = !isSubscriptionCancelled || !child.path || ALLOWED_PATHS_WHEN_CANCELLED.some(
                  (allowedPath) => child.path === allowedPath || child.path?.startsWith(allowedPath + '/')
                );

                return (
                  <SidebarMenuSubItem key={child.path || child.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={childIsActive}
                      className={cn(!childIsAllowed && 'opacity-50 cursor-not-allowed')}
                    >
                      <Link
                        to={child.path || '#'}
                        onClick={(e) => !childIsAllowed && e.preventDefault()}
                      >
                        {child.icon}
                        <span>{child.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={cn(!isAllowed && 'opacity-50 cursor-not-allowed')}
      >
        <Link
          to={item.path || '#'}
          onClick={(e) => !isAllowed && e.preventDefault()}
        >
          {item.icon}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DashboardSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuthContext();
  const userRole = user?.role?.name;

  // Get subscription status
  const { subscriptionStatus, isLoading: subscriptionLoading } = getSubscriptionStatus();

  // Check if subscription is cancelled
  const isSubscriptionCancelled = useMemo(() => {
    if (subscriptionLoading || !subscriptionStatus?.length) return false;

    const subscriptionData = subscriptionStatus[0];
    const sub = subscriptionData?.subscription;

    if (!sub) return true;

    const now = Math.floor(Date.now() / 1000);
    const cancelScheduled = subscriptionData.isSubscriptionCanceled;
    const cancelEffectiveAt = sub.current_period_end ?? Infinity;
    const alreadyEnded = sub.status === 'canceled' || Boolean(sub.ended_at);

    return alreadyEnded || (cancelScheduled && now >= cancelEffectiveAt);
  }, [subscriptionStatus, subscriptionLoading]);

  // Filter navigation items based on user role
  const filteredNavData = useMemo(() => {
    return navData.map((section) => ({
      ...section,
      items: filterNavItems([...section.items], userRole),
    })).filter((section) => section.items.length > 0);
  }, [userRole]);

  return (
    <Sidebar collapsible="icon">
      {/* Logo Section */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-12 items-center px-2">
          <Logo isSingle={false} width={130} height={28} disableLink={false} />
        </div>
      </SidebarHeader>

      {/* Company Workspace Section */}
      {user?.company && (
        <div className="border-b border-sidebar-border px-2 py-2">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent">
            <CompanyLogo
              logo={user.company.logo}
              name={user.company.name}
              size="sm"
              showName={false}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <div
                className="text-xs font-semibold text-sidebar-foreground truncate leading-tight"
                title={user.company.name}
              >
                {user.company.name}
              </div>
              <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider leading-tight mt-0.5">
                Workspace
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <SidebarContent>
        {filteredNavData.map((section) => (
          <SidebarGroup key={section.subheader}>
            <SidebarGroupLabel>{section.subheader}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <NavMenuItemComponent
                    key={item.path || item.title}
                    item={item}
                    pathname={pathname}
                    isSubscriptionCancelled={isSubscriptionCancelled}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Tour Guide in Footer */}
      {!user?.tourSteps?.isSkipped &&
        !user?.tourSteps?.isCompleted &&
        user?.tourSteps?.steps?.length > 0 && (
          <SidebarFooter>
            <SidebarSeparator />
            <NavTour
              steps={user.tourSteps.steps}
              isCompletedTour={user.tourSteps.isCompleted}
            />
          </SidebarFooter>
        )}

      <SidebarRail />
    </Sidebar>
  );
}
