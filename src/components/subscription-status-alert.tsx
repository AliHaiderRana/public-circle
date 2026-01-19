import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, CreditCard, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { getSubscriptionStatus } from '@/actions/subscription';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SubscriptionStatusAlertProps {
  className?: string;
}

type AlertType = {
  type: 'cancelled' | 'past_due' | 'unpaid' | 'trial_ending' | 'renewing_soon' | 'ended';
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  variant: 'default' | 'destructive' | 'warning';
  icon: React.ReactNode;
  endDate?: string;
  daysRemaining?: number;
};

export function SubscriptionStatusAlert({ className }: SubscriptionStatusAlertProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const { subscriptionStatus } = getSubscriptionStatus();
  const [alert, setAlert] = useState<AlertType | null>(null);

  useEffect(() => {
    if (!subscriptionStatus || dismissed) {
      setAlert(null);
      return;
    }

    // subscriptionStatus is an array of plans, each with a subscription object
    const subscription = Array.isArray(subscriptionStatus) && subscriptionStatus.length > 0
      ? subscriptionStatus[0]?.subscription
      : null;

    if (!subscription) {
      setAlert(null);
      return;
    }

    const now = new Date();
    const currentPeriodEnd = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd * 1000)
      : null;
    const trialEnd = subscription.trialEnd ? new Date(subscription.trialEnd * 1000) : null;

    // Check for ended subscription
    if (subscription.status === 'ended' || subscription.status === 'canceled') {
      if (currentPeriodEnd && currentPeriodEnd < now) {
        setAlert({
          type: 'ended',
          title: 'Subscription Ended',
          description: `Your subscription ended on ${format(currentPeriodEnd, 'MMM dd, yyyy')}. Please renew to continue using the platform.`,
          actionLabel: 'Renew Subscription',
          actionPath: paths.dashboard.general.subscription,
          variant: 'destructive',
          icon: <AlertCircle className="h-4 w-4" />,
          endDate: currentPeriodEnd.toISOString(),
        });
        return;
      }
    }

    // Check for cancelled subscription
    if (subscription.status === 'cancelled' || subscription.cancelAtPeriodEnd) {
      if (currentPeriodEnd) {
        const daysUntilEnd = Math.ceil(
          (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        setAlert({
          type: 'cancelled',
          title: 'Subscription Cancelled',
          description: `Your subscription will end on ${format(currentPeriodEnd, 'MMM dd, yyyy')}. You have ${daysUntilEnd} day${daysUntilEnd !== 1 ? 's' : ''} remaining.`,
          actionLabel: 'Resume Subscription',
          actionPath: paths.dashboard.general.subscription,
          variant: 'warning',
          icon: <Calendar className="h-4 w-4" />,
          endDate: currentPeriodEnd.toISOString(),
          daysRemaining: daysUntilEnd,
        });
        return;
      }
    }

    // Check for past due
    if (subscription.status === 'past_due') {
      setAlert({
        type: 'past_due',
        title: 'Payment Past Due',
        description: 'Your subscription payment is past due. Please update your payment method to avoid service interruption.',
        actionLabel: 'Update Payment Method',
        actionPath: paths.dashboard.general.subscription,
        variant: 'destructive',
        icon: <CreditCard className="h-4 w-4" />,
      });
      return;
    }

    // Check for unpaid/incomplete
    if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
      setAlert({
        type: 'unpaid',
        title: 'Payment Required',
        description: 'Your subscription payment is incomplete. Please complete your payment to continue using the platform.',
        actionLabel: 'Complete Payment',
        actionPath: paths.dashboard.general.subscription,
        variant: 'destructive',
        icon: <CreditCard className="h-4 w-4" />,
      });
      return;
    }

    // Check for trial ending soon (within 3 days)
    if (trialEnd && subscription.status === 'trialing') {
      const daysUntilTrialEnd = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilTrialEnd <= 3 && daysUntilTrialEnd > 0) {
        setAlert({
          type: 'trial_ending',
          title: 'Trial Ending Soon',
          description: `Your free trial ends in ${daysUntilTrialEnd} day${daysUntilTrialEnd !== 1 ? 's' : ''} on ${format(trialEnd, 'MMM dd, yyyy')}. Subscribe to continue using the platform.`,
          actionLabel: 'Subscribe Now',
          actionPath: paths.dashboard.general.subscription,
          variant: 'warning',
          icon: <Clock className="h-4 w-4" />,
          endDate: trialEnd.toISOString(),
          daysRemaining: daysUntilTrialEnd,
        });
        return;
      }
    }

    // Check for subscription renewing soon (within 7 days)
    if (currentPeriodEnd && subscription.status === 'active') {
      const daysUntilRenewal = Math.ceil(
        (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
        setAlert({
          type: 'renewing_soon',
          title: 'Subscription Renewing Soon',
          description: `Your subscription will renew on ${format(currentPeriodEnd, 'MMM dd, yyyy')} in ${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''}.`,
          actionLabel: 'View Subscription',
          actionPath: paths.dashboard.general.subscription,
          variant: 'default',
          icon: <CheckCircle2 className="h-4 w-4" />,
          endDate: currentPeriodEnd.toISOString(),
          daysRemaining: daysUntilRenewal,
        });
        return;
      }
    }

    setAlert(null);
  }, [subscriptionStatus, dismissed]);

  if (!alert || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage with alert type and end date to prevent showing again
    const dismissalKey = `subscription_alert_dismissed_${alert.type}_${alert.endDate || 'none'}`;
    localStorage.setItem(dismissalKey, 'true');
  };

  const handleAction = () => {
    navigate(alert.actionPath);
  };

  return (
    <Alert
      variant={alert.variant}
      className={cn(
        'relative border-l-4',
        alert.variant === 'destructive' && 'border-destructive bg-destructive/10',
        alert.variant === 'warning' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
        alert.variant === 'default' && 'border-primary bg-primary/10',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{alert.icon}</div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="font-semibold mb-1">{alert.title}</AlertTitle>
          <AlertDescription className="text-sm">{alert.description}</AlertDescription>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant={alert.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleAction}
            >
              {alert.actionLabel}
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
