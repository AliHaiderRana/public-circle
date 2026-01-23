import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
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

interface SesStatusDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null | undefined;
}

export function SesStatusDialog({ open, onClose, user }: SesStatusDialogProps) {
  const formatStatus = (status?: string) => {
    if (!status) return 'Healthy';
    const s = status.toUpperCase();
    if (s === 'HEALTHY') return 'Healthy';
    if (s === 'WARNING') return 'Warning';
    if (s === 'RISK') return 'Risk';
    if (s === 'BLOCK' || s === 'BLOCKED') return 'Blocked';
    return status;
  };

  const getStatusConfig = (status?: string) => {
    const s = status?.toUpperCase() || 'HEALTHY';
    if (s === 'HEALTHY') {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        icon: CheckCircle2,
        iconColor: 'text-green-600',
      };
    }
    if (s === 'WARNING') {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        icon: AlertTriangle,
        iconColor: 'text-yellow-600',
      };
    }
    if (s === 'RISK' || s === 'BLOCK' || s === 'BLOCKED') {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        icon: s === 'BLOCK' || s === 'BLOCKED' ? XCircle : AlertCircle,
        iconColor: 'text-red-600',
      };
    }
    return {
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      borderColor: 'border-border',
      icon: AlertCircle,
      iconColor: 'text-muted-foreground',
    };
  };

  const accountStatus = getCombinedAccountStatus(user);
  const complaintStatus = user?.company?.sesComplaintStatus;
  const bounceStatus = user?.company?.sesBounceStatus;
  const complaintRate = user?.company?.complaintRate || 0;
  const bounceRate = user?.company?.bounceRate || 0;

  const complaintConfig = getStatusConfig(complaintStatus);
  const bounceConfig = getStatusConfig(bounceStatus);
  const ComplaintIcon = complaintConfig.icon;
  const BounceIcon = bounceConfig.icon;

  // Calculate progress values for visual representation
  const getBounceProgress = () => {
    if (bounceRate <= 4) return (bounceRate / 4) * 33.33;
    if (bounceRate <= 8) return 33.33 + ((bounceRate - 4) / (8 - 4)) * 33.33;
    return Math.min(66.66 + ((bounceRate - 8) / (10 - 8)) * 33.34, 100);
  };

  const getComplaintProgress = () => {
    if (complaintRate <= 0.2) return (complaintRate / 0.2) * 33.33;
    if (complaintRate <= 0.4) return 33.33 + ((complaintRate - 0.2) / (0.4 - 0.2)) * 33.33;
    return Math.min(66.66 + ((complaintRate - 0.4) / (1 - 0.4)) * 33.34, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reputation Metrics</DialogTitle>
          <DialogDescription>
            Maintaining a good sender reputation is vital to the health of your account. The
            Reputation metrics page provides high-level visibility into key factors affecting your
            reputation.
          </DialogDescription>
        </DialogHeader>

        {accountStatus === 'BLOCKED' && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Blocked</AlertTitle>
            <AlertDescription>
              Your account is blocked. Please contact us at{' '}
              <strong>long.tran@venndii.com</strong> to resolve this issue.
            </AlertDescription>
          </Alert>
        )}

        {/* Account Status Summary */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-semibold">Account Status:</span>
          <SesStatusBadge user={user} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bounce Rate Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bounce Rate</CardTitle>
              <CardDescription className="text-sm">
                The percentage of emails sent from your account that resulted in a hard bounce
                based on a representative volume of email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <BounceIcon className={cn('h-4 w-4', bounceConfig.iconColor)} />
                    <span className={cn('text-sm font-semibold', bounceConfig.color)}>
                      {formatStatus(bounceStatus)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Historic Bounce Rate</p>
                  <p className={cn('text-sm font-semibold', bounceConfig.color)}>
                    {bounceRate.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar with Thresholds */}
              <div className="space-y-3">
                <div className="relative">
                  <Progress 
                    value={getBounceProgress()} 
                    className="h-2"
                  />
                  {/* Warning threshold at 33.33% */}
                  <div className="absolute left-[33.33%] top-0 bottom-0 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-yellow-600">Warning</span>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <span className="text-[10px] text-yellow-600 mt-1">4%</span>
                  </div>
                  {/* Block threshold at 66.66% */}
                  <div className="absolute left-[66.66%] top-0 bottom-0 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-red-600">Block</span>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <span className="text-[10px] text-red-600 mt-1">8%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold">Reference Values:</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">Warning: 4%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">Block: 8%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complaint Rate Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Complaint Rate</CardTitle>
              <CardDescription className="text-sm">
                The percentage of emails sent from your account that resulted in recipients
                reporting them as spam.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <ComplaintIcon className={cn('h-4 w-4', complaintConfig.iconColor)} />
                    <span className={cn('text-sm font-semibold', complaintConfig.color)}>
                      {formatStatus(complaintStatus)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Historic Complaint Rate</p>
                  <p className={cn('text-sm font-semibold', complaintConfig.color)}>
                    {complaintRate.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar with Thresholds */}
              <div className="space-y-3">
                <div className="relative">
                  <Progress 
                    value={getComplaintProgress()} 
                    className="h-2"
                  />
                  {/* Warning threshold at 33.33% */}
                  <div className="absolute left-[33.33%] top-0 bottom-0 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-yellow-600">Warning</span>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <span className="text-[10px] text-yellow-600 mt-1">0.2%</span>
                  </div>
                  {/* Block threshold at 66.66% */}
                  <div className="absolute left-[66.66%] top-0 bottom-0 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-red-600">Block</span>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <span className="text-[10px] text-red-600 mt-1">0.4%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold">Reference Values:</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">Warning: 0.2%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">Block: 0.4%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for account status badge in dialog
function SesStatusBadge({ user }: { user: User | null | undefined }) {
  const status = getCombinedAccountStatus(user);
  if (!status) return null;

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1',
        config.bgColor,
        config.borderColor,
        config.color
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', config.iconColor)} />
      <span className="text-xs font-medium">
        {status === 'BLOCKED' ? 'Blocked' : status === 'RISK' ? 'Risk' : status === 'WARNING' ? 'Warning' : 'Healthy'}
      </span>
    </Badge>
  );
}

function getStatusConfig(status: string) {
  const s = status.toUpperCase();
  if (s === 'HEALTHY') {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
    };
  }
  if (s === 'WARNING') {
    return {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
    };
  }
  if (s === 'RISK' || s === 'BLOCK' || s === 'BLOCKED') {
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      icon: s === 'BLOCK' || s === 'BLOCKED' ? XCircle : AlertCircle,
      iconColor: 'text-red-600',
    };
  }
  return {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-border',
    icon: AlertCircle,
    iconColor: 'text-muted-foreground',
  };
}
