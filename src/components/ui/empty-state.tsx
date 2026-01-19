import React from 'react';
import type { LucideProps } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Inbox, Plus, Search } from 'lucide-react';

type LucideIcon = React.ComponentType<LucideProps>;

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
}

export function EmptyState({
  title = 'No items found',
  description = 'Get started by creating a new item.',
  icon: Icon = Inbox,
  actionLabel = 'Create New',
  onAction,
  className,
  variant = 'default',
}: EmptyStateProps) {
  if (variant === 'card') {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-3">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {onAction && (
          <CardFooter className="flex justify-center">
            <Button onClick={onAction}>
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel}
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {onAction && (
          <Button onClick={onAction} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
      {onAction && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Specialized empty states
export function EmptySearchState({ searchTerm, onClear }: { searchTerm: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No items match "${searchTerm}". Try adjusting your search terms.`}
      actionLabel="Clear Search"
      onAction={onClear}
      variant="minimal"
    />
  );
}

export function EmptyListState({
  title = 'No items yet',
  description = 'Get started by creating your first item.',
  onCreate,
}: {
  title?: string;
  description?: string;
  onCreate?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel="Create New"
      onAction={onCreate}
      variant="default"
    />
  );
}
