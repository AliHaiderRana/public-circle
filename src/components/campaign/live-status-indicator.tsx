import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, Play, Pause, FileText, Archive } from 'lucide-react';

// ----------------------------------------------------------------------

interface LiveStatusIndicatorProps {
  status: string;
  isProcessing?: boolean;
  className?: string;
}

export function LiveStatusIndicator({ status, isProcessing, className }: LiveStatusIndicatorProps) {
  const statusUpper = status?.toUpperCase() || '';

  if (isProcessing) {
    return (
      <Badge variant="secondary" className={cn('gap-1.5', className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Processing</span>
      </Badge>
    );
  }

  switch (statusUpper) {
    case 'ACTIVE':
      return (
        <Badge variant="default" className={cn('gap-1.5 bg-green-600 hover:bg-green-700', className)}>
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <Play className="h-3 w-3" />
          <span>Active</span>
        </Badge>
      );
    case 'PAUSED':
      return (
        <Badge variant="secondary" className={cn('gap-1.5', className)}>
          <Pause className="h-3 w-3" />
          <span>Paused</span>
        </Badge>
      );
    case 'DRAFT':
      return (
        <Badge variant="outline" className={cn('gap-1.5', className)}>
          <FileText className="h-3 w-3" />
          <span>Draft</span>
        </Badge>
      );
    case 'ARCHIVED':
      return (
        <Badge variant="outline" className={cn('gap-1.5', className)}>
          <Archive className="h-3 w-3" />
          <span>Archived</span>
        </Badge>
      );
    case 'INACTIVE':
      return (
        <Badge variant="secondary" className={cn('gap-1.5 opacity-60', className)}>
          <span>Inactive</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={cn('gap-1.5', className)}>
          <span>{status || 'Unknown'}</span>
        </Badge>
      );
  }
}
