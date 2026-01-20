import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { navData } from './nav-data';
import type { NavItem } from './nav-data';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { NavTour } from '@/components/tour/nav-tour';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { CompanyLogo } from '@/components/company-logo';

interface NavItemProps {
  item: NavItem;
  pathname: string;
  level?: number;
  onNavigate?: () => void;
}

/**
 * Check if a route is active based on exact match or path prefix
 * Handles nested routes by checking if pathname starts with the item path
 */
function isRouteActive(itemPath: string | undefined, pathname: string, hasChildren?: boolean): boolean {
  if (!itemPath) return false;

  // Exact match
  if (itemPath === pathname) return true;

  // If item has children, only exact match should mark it as active
  // This prevents parent items from appearing active when a child is active
  if (hasChildren) return false;

  // Check if pathname starts with item path (for nested routes)
  // e.g., /dashboard/campaign/123 should match /dashboard/campaign
  if (pathname.startsWith(itemPath + '/')) return true;

  return false;
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

function NavItemComponent({ item, pathname, level = 0, onNavigate }: NavItemProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasActiveChild(item.children, pathname);
  const isActive = isRouteActive(item.path, pathname, hasChildren);
  const isParentActive = isChildActive && !isActive; // Parent is active if child is active but not exact match

  // Only expand if this item or its children are active
  const [isOpen, setIsOpen] = useState(isChildActive || isActive);

  // Auto-expand/collapse based on active state
  useEffect(() => {
    setIsOpen(isChildActive || isActive);
  }, [isChildActive, isActive]);

  const handleNavigation = () => {
    // Close mobile menu on navigation
    if (onNavigate && item.path) {
      onNavigate();
    }
  };

  return (
    <div>
      {item.path ? (
        <Link
          to={item.path}
          onClick={handleNavigation}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
            isActive
              ? 'bg-primary text-primary-foreground shadow-sm'
              : isParentActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            level > 0 && 'ml-4',
            // Add left border indicator for active items
            (isActive || isParentActive) && level === 0 && 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-primary before:rounded-r'
          )}
        >
          {item.icon && (
            <span className={cn(
              'flex-shrink-0',
              isActive && 'text-primary-foreground',
              isParentActive && 'text-primary'
            )}>
              {item.icon}
            </span>
          )}
          <span className={cn(
            isActive && 'font-semibold',
            isParentActive && 'font-semibold'
          )}>
            {item.title}
          </span>
        </Link>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isParentActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            level > 0 && 'ml-4'
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon && (
              <span className={cn(
                'flex-shrink-0',
                isParentActive && 'text-primary'
              )}>
                {item.icon}
              </span>
            )}
            <span className={cn(isParentActive && 'font-semibold')}>
              {item.title}
            </span>
          </div>
          {hasChildren && (
            <span className="flex-shrink-0">
              {isOpen ? (
                <ChevronDown className={cn('h-4 w-4', isParentActive && 'text-primary')} />
              ) : (
                <ChevronRight className={cn('h-4 w-4', isParentActive && 'text-primary')} />
              )}
            </span>
          )}
        </button>
      )}

      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child, childIndex) => (
            <NavItemComponent
              key={`nav-child-${child.path || child.title}-${childIndex}`}
              item={child}
              pathname={pathname}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Filter nav items based on user role
function filterNavItems(items: NavItem[], userRole?: string): NavItem[] {
  return items.filter((item) => {
    // If item has roles restriction, check if user has permission
    if (item.roles && userRole) {
      if (!item.roles.includes(userRole)) {
        return false;
      }
    }
    // Recursively filter children
    if (item.children) {
      item.children = filterNavItems(item.children, userRole);
    }
    return true;
  });
}

interface NavSectionProps {
  subheader: string;
  items: NavItem[];
  pathname: string;
  isCollapsible?: boolean;
  onNavigate?: () => void;
}

/**
 * Navigation Section Component
 * Displays a collapsible section of navigation items
 */
function NavSection({ subheader, items, pathname, isCollapsible = true, onNavigate }: NavSectionProps) {
  // Check if any item in section is active
  const hasActiveItem = useMemo(() => {
    return items.some((item) => {
      if (isRouteActive(item.path, pathname)) return true;
      return hasActiveChild(item.children, pathname);
    });
  }, [items, pathname]);

  // Only expand section if it has active item
  const [isOpen, setIsOpen] = useState(hasActiveItem);

  // Auto-expand/collapse based on active state
  useEffect(() => {
    setIsOpen(hasActiveItem);
  }, [hasActiveItem]);

  return (
    <div>
      {isCollapsible ? (
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between px-3 py-2 h-auto font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-accent mb-2"
        >
          <span>{subheader}</span>
          <ChevronUp
            className={cn(
              'h-3 w-3 transition-transform duration-200',
              !isOpen && 'rotate-180'
            )}
          />
        </Button>
      ) : (
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {subheader}
        </div>
      )}
      
      <div
        className={cn(
          'space-y-1 overflow-hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {items.map((item, index) => (
          <NavItemComponent
            key={`nav-item-${item.path || item.title}-${index}`}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

interface DashboardSidebarProps {
  /**
   * Callback to close mobile menu when navigation occurs
   */
  onNavigate?: () => void;
}

export function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuthContext();
  const userRole = user?.role?.name;

  // Filter navigation items based on user role
  const filteredNavData = useMemo(() => {
    return navData.map((section) => ({
      ...section,
      items: filterNavItems(section.items, userRole),
    })).filter((section) => section.items.length > 0);
  }, [userRole]);

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b px-4">
        <Logo isSingle={false} width={130} height={28} disableLink={false} />
      </div>
      
      {/* Company Workspace Section */}
      {user?.company && (
        <div className="border-b bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
            <CompanyLogo
              logo={user.company.logo}
              name={user.company.name}
              size="sm"
              showName={false}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div 
                className="text-xs font-semibold text-foreground truncate leading-tight" 
                title={user.company.name}
              >
                {user.company.name}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-0.5">
                Workspace
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {filteredNavData.map((section, index) => (
          <div key={index} className="mb-2">
            <NavSection
              subheader={section.subheader}
              items={section.items}
              pathname={pathname}
              isCollapsible={true}
              onNavigate={onNavigate}
            />
            {index < filteredNavData.length - 1 && <Separator className="my-4" />}
          </div>
        ))}

        {/* Tour Guide */}
        {!user?.tourSteps?.isSkipped &&
          !user?.tourSteps?.isCompleted &&
          user?.tourSteps?.steps?.length > 0 && (
            <>
              <Separator className="my-4" />
              <NavTour
                steps={user.tourSteps.steps}
                isCompletedTour={user.tourSteps.isCompleted}
              />
            </>
          )}
      </nav>
    </div>
  );
}
