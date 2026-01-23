import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCombinedAccountStatus } from '@/utils/account-restrictions';

// ----------------------------------------------------------------------

interface User {
  company?: {
    sesComplaintStatus?: string;
    sesBounceStatus?: string;
    complaintRate?: number;
    bounceRate?: number;
    status?: string;
  };
}

// ----------------------------------------------------------------------

interface SesStatusBadgeProps {
  user: User | null | undefined;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}

export function SesStatusBadge({ 
  user, 
  className,
  showIcon = true,
  variant 
}: SesStatusBadgeProps) {
  const status = getCombinedAccountStatus(user);

  if (!status) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'BLOCKED':
        return {
          label: 'Blocked',
          icon: XCircle,
          className: 'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20',
          iconClassName: 'text-red-600',
        };
      case 'RISK':
        return {
          label: 'Risk',
          icon: AlertCircle,
          className: 'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20',
          iconClassName: 'text-orange-600',
        };
      case 'WARNING':
        return {
          label: 'Warning',
          icon: AlertTriangle,
          className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20',
          iconClassName: 'text-yellow-600',
        };
      case 'HEALTHY':
        return {
          label: 'Healthy',
          icon: CheckCircle2,
          className: 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20',
          iconClassName: 'text-green-600',
        };
      default:
        return {
          label: 'Unknown',
          icon: AlertCircle,
          className: 'bg-muted text-muted-foreground border-border',
          iconClassName: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={variant || 'outline'}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={cn('h-3.5 w-3.5', config.iconClassName)} />}
      <span className="text-xs font-medium">{config.label}</span>
    </Badge>
  );
}
