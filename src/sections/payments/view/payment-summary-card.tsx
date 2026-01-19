import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getActivePlans } from '@/actions/payments';
import { Shield, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

// ----------------------------------------------------------------------

export function PaymentSummaryCard() {
  const { activePlans, isLoading } = getActivePlans();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!activePlans || activePlans.length === 0) {
    return null;
  }

  const plan = activePlans[0];
  const isCanceled = plan.isSubscriptionCanceled;

  // Extract price from "9.99 USD" format
  const priceMatch = plan.productPrice?.match(/(\d+\.?\d*)/);
  const price = priceMatch ? priceMatch[1] : '0.00';
  const currency = plan.productPrice?.replace(/[\d.]/g, '').trim() || 'USD';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Summary</CardTitle>
        <CardDescription>Your current subscription and billing information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Subscription</p>
            <p className="text-lg font-semibold mt-1">{plan.productName || '—'}</p>
          </div>
          <Badge variant={isCanceled ? 'destructive' : 'default'}>
            {isCanceled ? 'Canceling' : 'Active'}
          </Badge>
        </div>

        {/* Billing Cycle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Billing Cycle</p>
            <p className="text-sm mt-1">Monthly</p>
          </div>
          <Switch defaultChecked disabled />
        </div>

        <Separator />

        {/* Price */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{currency}</span>
            <span className="text-4xl font-bold">{price}</span>
            <span className="text-sm text-muted-foreground">/ mo</span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total Billed</span>
          <span className="text-lg font-semibold">
            {currency} {price}*
          </span>
        </div>

        <p className="text-xs text-muted-foreground">* Plus applicable taxes</p>

        {/* Upgrade Button - This will be handled by parent component */}

        {/* Security Badge */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Shield className="h-4 w-4 text-green-500" />
          <p className="text-xs text-muted-foreground">
            Secure credit card payment - 128-bit SSL encrypted
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
