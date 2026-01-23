import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, XCircle, Clock } from 'lucide-react';
import { format, differenceInDays, isAfter, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { cn } from '@/lib/utils';
import { getSubscriptionStatus } from '@/actions/subscription';

// ----------------------------------------------------------------------

interface SubscriptionData {
  subscription?: {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete' | 'incomplete_expired';
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    ended_at?: number;
    trial_end?: number;
  };
  isSubscriptionCanceled?: boolean;
}

// Also support array format from getSubscriptionStatus
type Subscription = SubscriptionData | SubscriptionData[] | null | undefined;

interface SubscriptionStatusAlertProps {
  subscription?: Subscription | null | undefined;
  className?: string;
  autoFetch?: boolean;
}

export function SubscriptionStatusAlert({ 
  subscription: propSubscription, 
  className,
  autoFetch = true 
}: SubscriptionStatusAlertProps) {
  const navigate = useNavigate();
  const { subscriptionStatus } = getSubscriptionStatus();
  
  // Use prop subscription if provided, otherwise fetch automatically
  const subscription = propSubscription !== undefined 
    ? propSubscription 
    : (autoFetch ? subscriptionStatus : null);

  // Handle array format (from getSubscriptionStatus)
  let subscriptionData: SubscriptionData | null = null;
  if (Array.isArray(subscription)) {
    subscriptionData = subscription.length > 0 ? subscription[0] : null;
  } else {
    subscriptionData = subscription || null;
  }

  if (!subscriptionData?.subscription) {
    return null;
  }

  const sub = subscriptionData.subscription;
  const now = Date.now() / 1000; // Current time in seconds
  const periodEnd = sub.current_period_end;
  const daysUntilEnd = periodEnd ? differenceInDays(new Date(periodEnd * 1000), new Date()) : 0;
  const isCanceled = sub.cancel_at_period_end || subscriptionData.isSubscriptionCanceled || sub.status === 'canceled';
  const isPastDue = sub.status === 'past_due';
  const isUnpaid = sub.status === 'unpaid' || sub.status === 'incomplete' || sub.status === 'incomplete_expired';
  const isTrialing = sub.status === 'trialing';
  const trialEnd = sub.trial_end;
  const daysUntilTrialEnd = trialEnd ? differenceInDays(new Date(trialEnd * 1000), new Date()) : null;

  // Alert for cancelled subscription
  if (isCanceled && periodEnd && daysUntilEnd > 0) {
    return (
      <Alert variant="destructive" className={cn('mb-4', className)}>
        <XCircle className="h-4 w-4" />
        <AlertTitle>Subscription Cancelled</AlertTitle>
        <AlertDescription className="mt-2">
          <p>
            Your subscription will end on{' '}
            <strong>{format(new Date(periodEnd * 1000), 'MMMM d, yyyy')}</strong>.
            You'll continue to have access until then.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate(paths.dashboard.general.subscription)}
          >
            Resume Subscription
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Alert for past due
  if (isPastDue) {
    return (
      <Alert variant="destructive" className={cn('mb-4', className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Past Due</AlertTitle>
        <AlertDescription className="mt-2">
          <p>
            Your subscription payment is past due. Please update your payment method to avoid
            service interruption.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate(paths.dashboard.general.subscription)}
          >
            Update Payment Method
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Alert for unpaid/incomplete
  if (isUnpaid) {
    return (
      <Alert variant="destructive" className={cn('mb-4', className)}>
        <XCircle className="h-4 w-4" />
        <AlertTitle>Payment Required</AlertTitle>
        <AlertDescription className="mt-2">
          <p>
            Your subscription payment failed. Please update your payment method to continue using
            the service.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate(paths.dashboard.general.subscription)}
          >
            Update Payment Method
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Alert for trial ending soon (within 3 days)
  if (isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd <= 3 && daysUntilTrialEnd > 0) {
    return (
      <Alert variant="default" className={cn('mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950', className)}>
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">Trial Ending Soon</AlertTitle>
        <AlertDescription className="mt-2 text-yellow-700 dark:text-yellow-300">
          <p>
            Your trial ends in {daysUntilTrialEnd} {daysUntilTrialEnd === 1 ? 'day' : 'days'} on{' '}
            <strong>{format(new Date(trialEnd! * 1000), 'MMMM d, yyyy')}</strong>.
            Add a payment method to continue your subscription.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900"
            onClick={() => navigate(paths.dashboard.general.subscription)}
          >
            Add Payment Method
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Alert for subscription expiring soon (within 7 days and not cancelled)
  if (!isCanceled && periodEnd && daysUntilEnd <= 7 && daysUntilEnd > 0) {
    return (
      <Alert variant="default" className={cn('mb-4 border-gray-500 bg-gray-50 dark:bg-gray-950', className)}>
        <Clock className="h-4 w-4 text-gray-600" />
        <AlertTitle className="text-gray-800 dark:text-gray-200">Subscription Renewing Soon</AlertTitle>
        <AlertDescription className="mt-2 text-gray-700 dark:text-gray-300">
          <p>
            Your subscription will renew in {daysUntilEnd} {daysUntilEnd === 1 ? 'day' : 'days'} on{' '}
            <strong>{format(new Date(periodEnd * 1000), 'MMMM d, yyyy')}</strong>.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-gray-600 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900"
            onClick={() => navigate(paths.dashboard.general.subscription)}
          >
            View Subscription
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Alert for already ended subscription
  if (sub.status === 'canceled' && sub.ended_at) {
    return (
      <Alert variant="destructive" className={cn('mb-4', className)}>
        <XCircle className="h-4 w-4" />
        <AlertTitle>Subscription Ended</AlertTitle>
        <AlertDescription className="mt-2">
          <p>
            Your subscription ended on{' '}
            <strong>{format(new Date(sub.ended_at * 1000), 'MMMM d, yyyy')}</strong>.
            Reactivate your subscription to continue using the service.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate(paths.dashboard.general.subscription)}
          >
            Reactivate Subscription
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
