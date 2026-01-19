import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getQuotaDetails } from '@/actions/payments';
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

// ----------------------------------------------------------------------

export function QuotaDisplay() {
  const { quotaDetails, isLoading } = getQuotaDetails();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quotaDetails) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Quota Information</h3>
          <p className="text-sm text-muted-foreground">
            Quota details are not available at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const calculatePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getQuotaStatus = (used: number, limit: number) => {
    const percentage = calculatePercentage(used, limit);
    if (percentage >= 90) return { variant: 'destructive' as const, icon: AlertCircle };
    if (percentage >= 70) return { variant: 'default' as const, icon: TrendingUp };
    return { variant: 'default' as const, icon: CheckCircle2 };
  };

  // Map API response to display format
  const quotaItems = [
    {
      label: 'Emails',
      used: quotaDetails.emailsConsumedInPlan || 0,
      limit: quotaDetails.emailsAllowedInPlan || 0,
      unit: quotaDetails.emailsAllowedInPlanUnit || 'emails',
      overage: quotaDetails.emailsConsumedInOverage || 0,
      overagePrice: quotaDetails.emailsConsumedInOveragePrice || 0,
      overagePriceUnit: quotaDetails.emailsConsumedInOveragePriceUnit || 'USD',
    },
    {
      label: 'Bandwidth',
      used: quotaDetails.bandwidthConsumedInPlan || 0,
      limit: quotaDetails.bandwidthAllowedInPlan || 0,
      unit: quotaDetails.bandwidthAllowedInPlanUnit || 'MB',
      overage: quotaDetails.bandwidthConsumedInOverage || 0,
      overagePrice: quotaDetails.bandwidthConsumedInOveragePrice || 0,
      overagePriceUnit: quotaDetails.bandwidthConsumedInOveragePriceUnit || 'USD',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quota & Usage</CardTitle>
        <CardDescription>Your current plan limits and usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {quotaItems.map((item) => {
          const percentage = calculatePercentage(item.used, item.limit);
          const status = getQuotaStatus(item.used, item.limit);
          const remaining = Math.max(0, item.limit - item.used);

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <status.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {item.used.toLocaleString()} / {item.limit.toLocaleString()} {item.unit}
                  </span>
                  <Badge variant={status.variant} className="text-xs">
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {remaining.toLocaleString()} {item.unit} remaining
                </span>
                {item.overage > 0 && (
                  <span className="text-destructive">
                    +{item.overage.toLocaleString()} overage ({item.overagePriceUnit} {item.overagePrice.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
