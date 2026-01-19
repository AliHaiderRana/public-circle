import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'full';
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  onGoHome,
  className,
  variant = 'default',
}: ErrorStateProps) {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || message || 'An unexpected error occurred. Please try again.';

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10', className)}>
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn('min-h-[400px] flex items-center justify-center p-6', className)}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center">{title}</CardTitle>
            <CardDescription className="text-center">{errorMessage}</CardDescription>
          </CardHeader>
          {(onRetry || onGoHome) && (
            <CardFooter className="flex gap-2 justify-center">
              {onRetry && (
                <Button onClick={onRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {onGoHome && (
                <Button variant="outline" onClick={onGoHome}>
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{errorMessage}</p>
      <div className="flex gap-2">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome}>
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );
}
