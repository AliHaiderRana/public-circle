import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { navData } from './nav-data';
import type { NavItem } from './nav-data';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/auth/hooks/use-auth-context';

interface NavItemProps {
  item: NavItem;
  pathname: string;
  level?: number;
}

function NavItemComponent({ item, pathname, level = 0 }: NavItemProps) {
  const [isOpen, setIsOpen] = useState(
    item.children?.some((child) => child.path === pathname) || false
  );
  const isActive = item.path === pathname;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      {item.path ? (
        <Link
          to={item.path}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            level > 0 && 'ml-4'
          )}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          <span>{item.title}</span>
        </Link>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            level > 0 && 'ml-4'
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            <span>{item.title}</span>
          </div>
          {hasChildren && (
            <span className="flex-shrink-0">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
        </button>
      )}

      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavItemComponent
              key={child.path || child.title}
              item={child}
              pathname={pathname}
              level={level + 1}
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

export function DashboardSidebar() {
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
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Public Circle</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNavData.map((section, index) => (
          <div key={index}>
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.subheader}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItemComponent
                  key={item.path || item.title}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </div>
            {index < filteredNavData.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </nav>
    </div>
  );
}
