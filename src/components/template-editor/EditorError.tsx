/**
 * EditorError Component
 * Error display when editor fails to initialize
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorErrorProps {
  error: string;
  onRetry?: () => void;
}

export function EditorError({ error, onRetry }: EditorErrorProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
      <div className="text-center max-w-md px-4">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Failed to Load Editor
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {error || 'An unexpected error occurred while initializing the template editor.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          If the problem persists, please check your configuration or contact support.
        </p>
      </div>
    </div>
  );
}
