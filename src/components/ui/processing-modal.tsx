import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';

// ----------------------------------------------------------------------

type ProcessingStatus = 'processing' | 'success' | 'error';

interface ProcessingModalProps {
  progress?: number;
  title?: string;
  message?: string;
  isIndeterminate?: boolean;
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  status?: ProcessingStatus;
}

export function ProcessingModal({
  progress,
  title = 'Processing',
  message,
  isIndeterminate = false,
  className,
  onClose,
  showCloseButton = false,
  status = 'processing',
}: ProcessingModalProps) {
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isProcessing = status === 'processing';

  const getStatusIcon = () => {
    if (isSuccess) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (isError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  };

  const getStatusColor = () => {
    if (isSuccess) return 'border-green-500/50 bg-green-50/50';
    if (isError) return 'border-destructive/50 bg-destructive/5';
    return 'border-primary/50';
  };

  return (
    <Card
      className={cn(
        'fixed bottom-6 right-6 z-50 w-[320px] sm:w-[360px] shadow-xl border-2 animate-in slide-in-from-bottom-5 fade-in-0 duration-300',
        getStatusColor(),
        className
      )}
    >
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle
              className={cn(
                'text-sm font-semibold',
                isSuccess && 'text-green-700',
                isError && 'text-red-700'
              )}
            >
              {title}
            </CardTitle>
          </div>
          {showCloseButton && onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {message && (
          <p
            className={cn(
              'text-xs leading-relaxed',
              isSuccess && 'text-green-700',
              isError && 'text-red-700',
              isProcessing && 'text-muted-foreground'
            )}
          >
            {message}
          </p>
        )}
        {isProcessing && (
          <div className="space-y-1.5">
            <Progress
              value={isIndeterminate ? undefined : progress}
              className="h-2"
            />
            {!isIndeterminate && progress !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-medium text-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
            {isIndeterminate && (
              <p className="text-xs text-muted-foreground text-center">
                Please wait...
              </p>
            )}
          </div>
        )}
        {isSuccess && (
          <div className="space-y-1.5">
            {progress !== undefined && (
              <Progress value={100} className="h-2 bg-green-200" />
            )}
            <div className="flex items-center justify-center gap-2 text-xs text-green-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completed successfully!</span>
            </div>
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center gap-2 text-xs text-destructive font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>An error occurred. Please try again.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProcessingModalNoProgressProps {
  title?: string;
  message?: string;
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  status?: ProcessingStatus;
}

export function ProcessingModalNoProgress({
  title = 'Processing',
  message,
  className,
  onClose,
  showCloseButton = false,
  status = 'processing',
}: ProcessingModalNoProgressProps) {
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isProcessing = status === 'processing';

  const getStatusIcon = () => {
    if (isSuccess) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (isError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  };

  const getStatusColor = () => {
    if (isSuccess) return 'border-green-500/50 bg-green-50/50';
    if (isError) return 'border-destructive/50 bg-destructive/5';
    return 'border-primary/50';
  };

  return (
    <Card
      className={cn(
        'fixed bottom-6 right-6 z-50 w-[320px] sm:w-[360px] shadow-xl border-2 animate-in slide-in-from-bottom-5 fade-in-0 duration-300',
        getStatusColor(),
        className
      )}
    >
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle
              className={cn(
                'text-sm font-semibold',
                isSuccess && 'text-green-700',
                isError && 'text-red-700'
              )}
            >
              {title}
            </CardTitle>
          </div>
          {showCloseButton && onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {message && (
          <p
            className={cn(
              'text-xs leading-relaxed',
              isSuccess && 'text-green-700',
              isError && 'text-red-700',
              isProcessing && 'text-muted-foreground'
            )}
          >
            {message}
          </p>
        )}
        {isProcessing && (
          <>
            <Progress value={undefined} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              This may take a few moments...
            </p>
          </>
        )}
        {isSuccess && (
          <div className="flex items-center justify-center gap-2 text-xs text-green-700 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed successfully!</span>
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center gap-2 text-xs text-destructive font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>An error occurred. Please try again.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
