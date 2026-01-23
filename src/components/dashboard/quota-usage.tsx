import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Mail } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface QuotaData {
  overageConsumptionInPercentageBandwidth?: number;
  bandwidthAllowedInPlan?: number;
  bandwidthAllowedInPlanUnit?: string;
  bandwidthConsumedInOverage?: number;
  bandwidthConsumedInOverageUnit?: string;
  bandwidthConsumedInPlan?: number;
  bandwidthConsumedInPlanUnit?: string;
  bandwidthConsumedInOveragePrice?: number;
  overageConsumptionInPercentageEmails?: number;
  emailsAllowedInPlan?: number;
  emailsAllowedInPlanUnit?: string;
  emailsConsumedInOverage?: number;
  emailsConsumedInOverageUnit?: string;
  emailsConsumedInPlan?: number;
  emailsConsumedInPlanUnit?: string;
  emailsConsumedInOveragePrice?: number;
}

interface QuotaUsageProps {
  quota: QuotaData | null;
}

export function QuotaUsage({ quota }: QuotaUsageProps) {
  const data = quota || {};

  const bandwidthPercentage = data.overageConsumptionInPercentageBandwidth ?? 0;
  const emailPercentage = data.overageConsumptionInPercentageEmails ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Bandwidth Usage Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">Bandwidth Usage</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Current month consumption
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Database className="h-6 w-6 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Usage</span>
              <span className="text-2xl font-bold text-foreground">
                {bandwidthPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(bandwidthPercentage, 100)} className="h-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total in Plan</p>
              <p className="text-sm font-semibold">
                {data.bandwidthAllowedInPlan?.toLocaleString() || 0}{' '}
                {data.bandwidthAllowedInPlanUnit || 'KB'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Consumed</p>
              <p className="text-sm font-semibold">
                {data.bandwidthConsumedInPlan?.toLocaleString() || 0}{' '}
                {data.bandwidthConsumedInPlanUnit || 'KB'}
              </p>
            </div>
            {data.bandwidthConsumedInOverage && data.bandwidthConsumedInOverage > 0 && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Overage</p>
                  <p className="text-sm font-semibold text-foreground">
                    {data.bandwidthConsumedInOverage.toLocaleString()}{' '}
                    {data.bandwidthConsumedInOverageUnit || 'KB'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Overage Cost</p>
                  <p className="text-sm font-semibold text-foreground">
                    ${data.bandwidthConsumedInOveragePrice?.toLocaleString() || 0}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Usage Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">Monthly Emails</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Current month consumption
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Usage</span>
              <span className="text-2xl font-bold text-foreground">
                {emailPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(emailPercentage, 100)} className="h-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total in Plan</p>
              <p className="text-sm font-semibold">
                {data.emailsAllowedInPlan?.toLocaleString() || 0}{' '}
                {data.emailsAllowedInPlanUnit || ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Consumed</p>
              <p className="text-sm font-semibold">
                {data.emailsConsumedInPlan?.toLocaleString() || 0}{' '}
                {data.emailsConsumedInPlanUnit || ''}
              </p>
            </div>
            {data.emailsConsumedInOverage && data.emailsConsumedInOverage > 0 && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Overage</p>
                  <p className="text-sm font-semibold text-foreground">
                    {data.emailsConsumedInOverage.toLocaleString()}{' '}
                    {data.emailsConsumedInOverageUnit || ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Overage Cost</p>
                  <p className="text-sm font-semibold text-foreground">
                    ${data.emailsConsumedInOveragePrice?.toLocaleString() || 0}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
