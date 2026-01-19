import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

export interface BreadcrumbLinkItem {
  name: string;
  href?: string;
}

interface CustomBreadcrumbsProps {
  links?: BreadcrumbLinkItem[];
  heading?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CustomBreadcrumbs({
  links = [],
  heading,
  description,
  action,
  className,
}: CustomBreadcrumbsProps) {
  const lastLink = links?.[links.length - 1]?.name || '';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Breadcrumbs */}
      {links.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {links.map((link, index) => {
              const isLast = index === links.length - 1;
              return (
                <div key={link.name || index} className="flex items-center">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{link.name}</BreadcrumbPage>
                    ) : link.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={link.href}>{link.name}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <span className="text-muted-foreground">{link.name}</span>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Heading and Action */}
      {(heading || action) && (
        <div className="flex items-center justify-between">
          {heading && (
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
    </div>
  );
}
