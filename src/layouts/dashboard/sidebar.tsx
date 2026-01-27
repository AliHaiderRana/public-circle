import { useMemo, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { navData } from './nav-data';
import type { NavItem } from './nav-data';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { NavTour } from '@/components/tour/nav-tour';
import { Logo } from '@/components/logo';
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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

function CollapsedMenuItem({
  item,
  pathname,
  isActive,
  isAllowed,
  isSubscriptionCancelled,
  menuButton,
}: {
  item: NavItem;
  pathname: string;
  isActive: boolean;
  isAllowed: boolean;
  isSubscriptionCancelled: boolean;
  menuButton: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const itemRef = useRef<HTMLLIElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.top, left: rect.right });
    }
  }, []);

  const checkHover = useCallback(() => {
    requestAnimationFrame(() => {
      const itemEl = itemRef.current;
      const popoverEl = popoverRef.current;
      const isOverItem = itemEl?.matches(':hover');
      const isOverPopover = popoverEl?.matches(':hover');
      if (!isOverItem && !isOverPopover) {
        setOpen(false);
      }
    });
  }, []);

  const handleEnter = useCallback(() => {
    updatePosition();
    setOpen(true);
  }, [updatePosition]);

  return (
    <SidebarMenuItem
      ref={itemRef}
      onMouseEnter={handleEnter}
      onMouseLeave={checkHover}
    >
      {menuButton}
      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed min-w-[180px] rounded-md border bg-popover text-popover-foreground shadow-md"
          style={{
            top: popoverPos.top,
            left: popoverPos.left,
            zIndex: 50,
            paddingLeft: 4,
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={checkHover}
        >
          <div className="rounded-md border bg-popover overflow-hidden">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              {item.title}
            </div>
            {item.children?.map((child) => {
              const childIsActive = isRouteActive(child.path, pathname);
              const childIsAllowed = !isSubscriptionCancelled || !child.path || ALLOWED_PATHS_WHEN_CANCELLED.some(
                (allowedPath) => child.path === allowedPath || child.path?.startsWith(allowedPath + '/')
              );

              return (
                <Link
                  key={child.path || child.title}
                  to={child.path || '#'}
                  onClick={(e) => {
                    if (!childIsAllowed) e.preventDefault();
                    else setOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                    childIsActive && 'bg-sidebar-primary/10 text-sidebar-primary font-medium',
                    !childIsAllowed && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {child.icon}
                  <span>{child.title}</span>
                </Link>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </SidebarMenuItem>
  );
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
  const { state: sidebarState } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = sidebarState === 'collapsed';

  // Check if this path is allowed when subscription is cancelled
  const isAllowed = !isSubscriptionCancelled || !item.path || ALLOWED_PATHS_WHEN_CANCELLED.some(
    (allowedPath) => item.path === allowedPath || item.path?.startsWith(allowedPath + '/')
  );

  if (hasChildren) {
    const menuButton = (
      <SidebarMenuButton
        isActive={isChildActive || isActive}
        tooltip={!isCollapsed ? undefined : undefined}
        className={cn(
          !isAllowed && 'opacity-50 cursor-not-allowed'
        )}
      >
        {item.icon}
        <span>{item.title}</span>
        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
      </SidebarMenuButton>
    );

    if (isCollapsed) {
      return (
        <CollapsedMenuItem
          item={item}
          pathname={pathname}
          isActive={isChildActive || isActive}
          isAllowed={isAllowed}
          isSubscriptionCancelled={isSubscriptionCancelled}
          menuButton={menuButton}
        />
      );
    }

    return (
      <Collapsible
        asChild
        defaultOpen={isChildActive || isActive}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            {menuButton}
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

// Sidebar Logo component that responds to collapse state
function SidebarLogo() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarHeader className="border-b border-sidebar-border">
      <div className="flex h-12 items-center justify-center px-2">
        {isCollapsed ? (
          <Logo isSingle={true} width={32} height={32} disableLink={false} />
        ) : (
          <Logo isSingle={false} width={130} height={28} disableLink={false} />
        )}
      </div>
    </SidebarHeader>
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
      <SidebarLogo />

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
