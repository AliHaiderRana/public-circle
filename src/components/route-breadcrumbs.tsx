import { useBreadcrumbs, type BreadcrumbItem } from '@/hooks/use-breadcrumbs';
import { CustomBreadcrumbs } from './custom-breadcrumbs';

interface RouteBreadcrumbsProps {
  /**
   * Custom breadcrumb items to override automatic generation
   */
  customItems?: BreadcrumbItem[];
  /**
   * Optional heading to display below breadcrumbs
   */
  heading?: string;
  /**
   * Optional description to display below heading
   */
  description?: string;
  /**
   * Optional action button/component to display on the right
   */
  action?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * RouteBreadcrumbs Component
 * 
 * Automatically generates breadcrumbs based on the current route.
 * Integrates with the routing system and navigation structure.
 * 
 * Features:
 * - Automatic breadcrumb generation from current route
 * - Support for custom breadcrumb items
 * - Integration with navigation data structure
 * - Handles dynamic routes (e.g., /campaign/:id)
 * - Fallback to route name mapping
 * 
 * Usage:
 * ```tsx
 * <RouteBreadcrumbs />
 * 
 * // With custom items
 * <RouteBreadcrumbs 
 *   customItems={[
 *     { name: 'Dashboard', href: '/dashboard' },
 *     { name: 'Custom Page' }
 *   ]}
 * />
 * 
 * // With heading and description
 * <RouteBreadcrumbs 
 *   heading="Page Title"
 *   description="Page description"
 * />
 * ```
 */
export function RouteBreadcrumbs({
  customItems,
  heading,
  description,
  action,
  className,
}: RouteBreadcrumbsProps) {
  const breadcrumbs = useBreadcrumbs(customItems);

  // Don't render if no breadcrumbs
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <CustomBreadcrumbs
      links={breadcrumbs}
      heading={heading}
      description={description}
      action={action}
      className={className}
    />
  );
}
