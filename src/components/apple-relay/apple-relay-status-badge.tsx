import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppleRelayStatus = 'VERIFIED' | 'IN_PROGRESS' | 'NOT_VERIFIED' | undefined;

interface AppleRelayStatusBadgeProps {
  status: AppleRelayStatus;
  className?: string;
}

export function AppleRelayStatusBadge({ status, className }: AppleRelayStatusBadgeProps) {
  if (!status || status === 'NOT_VERIFIED') {
    return (
      <Badge
        variant="outline"
        className={cn('border-gray-400 text-gray-700 bg-transparent', className)}
      >
        <XCircle className="h-3 w-3 mr-1" />
        Not Verified
      </Badge>
    );
  }

  if (status === 'IN_PROGRESS') {
    return (
      <Badge
        variant="outline"
        className={cn('border-yellow-500 text-yellow-700 bg-yellow-50', className)}
      >
        <Clock className="h-3 w-3 mr-1 animate-pulse" />
        Verifying
      </Badge>
    );
  }

  if (status === 'VERIFIED') {
    return (
      <Badge
        variant="outline"
        className={cn('border-green-500 text-green-700 bg-green-50', className)}
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    );
  }

  return null;
}
