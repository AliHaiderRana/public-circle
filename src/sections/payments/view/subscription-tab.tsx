import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getActivePlans,
  cancelSubscription,
  resumeSubscription,
  updateSubscription,
} from '@/actions/payments';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { QuotaDisplay } from './quota-display';
import { PaymentSummaryCard } from './payment-summary-card';
import { BillingAddressCard } from './billing-address-card';
import { PlanUpgradeDialog } from './plan-upgrade-dialog';

// ----------------------------------------------------------------------

export function SubscriptionTab() {
  const { activePlans, isLoading } = getActivePlans();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      await cancelSubscription();
      setCancelDialogOpen(false);
    } catch (error) {
      // Error is handled in the action
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsProcessing(true);
    try {
      await resumeSubscription();
      setResumeDialogOpen(false);
    } catch (error) {
      // Error is handled in the action
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activePlans || activePlans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Active Subscription</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You don't have an active subscription plan.
              </p>
            </div>
            <Button>Choose a Plan</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const plan = activePlans[0];
  const isCanceled = plan.isSubscriptionCanceled;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            <Badge variant={isCanceled ? 'destructive' : 'default'}>
              {isCanceled ? 'Canceling' : 'Active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan Name</p>
              <p className="text-lg font-semibold mt-1">{plan.productName || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Price</p>
              <p className="text-lg font-semibold mt-1">{plan.productPrice || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subscription ID</p>
              <p className="text-sm font-mono mt-1 text-muted-foreground">
                {plan.subscriptionId || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {isCanceled ? (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Will cancel at period end</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {isCanceled ? (
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="default"
                onClick={() => setResumeDialogOpen(true)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Resume Subscription'
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="default"
                onClick={() => setUpgradeDialogOpen(true)}
                disabled={isProcessing}
              >
                Change Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
                disabled={isProcessing}
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentSummaryCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuotaDisplay />
        <BillingAddressCard />
      </div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? Your subscription will remain
              active until the end of the current billing period, and you'll continue to have
              access to all features until then.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Subscription Dialog */}
      <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Subscription</DialogTitle>
            <DialogDescription>
              Your subscription will continue as normal and you'll be billed at the end of the
              current period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResumeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResumeSubscription} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Resume Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Upgrade/Downgrade Dialog */}
      <PlanUpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
    </div>
  );
}
