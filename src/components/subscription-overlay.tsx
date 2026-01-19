import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, CreditCard, XCircle } from 'lucide-react';
import { paths } from '@/routes/paths';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------

interface SubscriptionOverlayProps {
  open: boolean;
  subscription?: {
    id?: string;
    status?: string;
    current_period_end?: number;
    cancel_at_period_end?: boolean;
    ended_at?: number;
  };
  isSubscriptionCanceled?: boolean;
}

export function SubscriptionOverlay({ open, subscription, isSubscriptionCanceled }: SubscriptionOverlayProps) {
  const navigate = useNavigate();

  const handleGoToSubscription = () => {
    navigate(paths.dashboard.general.subscription);
  };

  const handleResumeSubscription = () => {
    navigate(paths.dashboard.general.subscription);
  };

  if (!subscription) {
    return null;
  }

  const periodEnd = subscription.current_period_end;
  const daysUntilEnd = periodEnd ? differenceInDays(new Date(periodEnd * 1000), new Date()) : 0;
  const isCanceled = subscription.cancel_at_period_end || isSubscriptionCanceled || subscription.status === 'canceled';
  const isEnded = subscription.status === 'canceled' && subscription.ended_at;

  // Show overlay for cancelled but not yet ended subscriptions
  if (isCanceled && !isEnded && periodEnd && daysUntilEnd > 0) {
    return (
      <Dialog open={open} modal={true}>
        <DialogContent
          className="sm:max-w-lg [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">Subscription Cancelled</DialogTitle>
                <DialogDescription className="text-base pt-1">
                  Your subscription will end soon
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Access until:</span>
                <span className="font-semibold">
                  {format(new Date(periodEnd * 1000), 'MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Days remaining:</span>
                <span className="font-semibold">{daysUntilEnd} day{daysUntilEnd !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your subscription has been cancelled but you'll continue to have access until the end of
              your billing period. You can resume your subscription at any time to avoid service
              interruption.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleResumeSubscription} className="w-full sm:w-auto">
              Resume Subscription
            </Button>
            <Button
              variant="outline"
              onClick={handleGoToSubscription}
              className="w-full sm:w-auto"
            >
              Manage Subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show overlay for ended subscriptions
  if (isEnded && subscription.ended_at) {
    return (
      <Dialog open={open} modal={true}>
        <DialogContent
          className="sm:max-w-lg [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">Subscription Ended</DialogTitle>
                <DialogDescription className="text-base pt-1">
                  Your subscription has been cancelled
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ended on:</span>
                <span className="font-semibold">
                  {format(new Date(subscription.ended_at * 1000), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your subscription has ended and you no longer have access to premium features. To
              continue using the platform, please reactivate your subscription.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleGoToSubscription} className="w-full sm:w-auto">
              Reactivate Subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show overlay for inactive/no subscription
  if (!subscription.id || subscription.status === 'inactive') {
    return (
      <Dialog open={open} modal={true}>
        <DialogContent
          className="sm:max-w-lg [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">Subscription Inactive</DialogTitle>
                <DialogDescription className="text-base pt-1">
                  No active subscription found
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You don't have an active subscription. To continue using the platform, please subscribe
              to a plan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleGoToSubscription} className="w-full sm:w-auto">
              View Plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
