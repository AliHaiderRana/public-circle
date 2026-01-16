import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSubscriptionStatus } from '@/actions/subscription';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function SubscriptionPage() {
  const { subscriptionStatus, isLoading } = getSubscriptionStatus();
  // subscriptionStatus is an array of plans, each with a subscription object
  const plan = Array.isArray(subscriptionStatus) && subscriptionStatus.length > 0 
    ? subscriptionStatus[0] 
    : null;
  const subscription = plan?.subscription;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and billing</p>
      </div>

      {!plan || !subscription ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No active subscription</p>
            <Button>Choose a Plan</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your active subscription details</CardDescription>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'outline'}>
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan</p>
                <p className="text-lg">{plan.productName || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price</p>
                <p className="text-lg">{plan.productPrice || '—'}</p>
              </div>
              {subscription.current_period_end && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Billing Date</p>
                  <p className="text-lg">
                    {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}
              {plan.isSubscriptionCanceled && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span>Subscription will cancel at the end of the billing period</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Billing history will appear here</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
